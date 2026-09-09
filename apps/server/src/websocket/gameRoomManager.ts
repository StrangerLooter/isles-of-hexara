import {
  createInitialGameState,
  executeGameAction,
  GameAction,
  GameState,
} from '@hexara/game-core';
import { SERVER_EVENTS } from '@hexara/protocol';
import { Server, Socket } from 'socket.io';
import { GameRecordRepository } from '../database/models/GameRecord.js';
import { logger } from '../logging/logger.js';
import { memoryRedis } from '../redis/redisClient.js';

export class GameRoomManager {
  private activeGames = new Map<string, GameState>();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  getGame(gameId: string): GameState | undefined {
    return this.activeGames.get(gameId);
  }

  createOrJoinGame(
    gameId: string,
    player: { id: string; username: string; isAi?: boolean },
    socket: Socket
  ): GameState {
    let game = this.activeGames.get(gameId);

    if (!game) {
      // Create new game with 4 players: the joining player + 3 AI companions by default!
      const initialPlayers = [
        player,
        { id: 'ai_1', username: 'Captain Drake (AI)', isAi: true },
        { id: 'ai_2', username: 'Navigator Anne (AI)', isAi: true },
        { id: 'ai_3', username: 'Merchant Silver (AI)', isAi: true },
      ];
      game = createInitialGameState(gameId, initialPlayers);
      this.activeGames.set(gameId, game);
      logger.info({ gameId, hostPlayer: player.username }, 'New authoritative game created');
    } else {
      // Existing game: update player's connection status
      if (game.players[player.id]) {
        game.players[player.id].isConnected = true;
      }
    }

    socket.join(`game:${gameId}`);
    memoryRedis.set(`presence:${player.id}`, gameId, 3600);

    return game;
  }

  handleAction(
    gameId: string,
    action: GameAction,
    socket: Socket
  ): { success: boolean; error?: string } {
    const game = this.activeGames.get(gameId);
    if (!game) {
      socket.emit(SERVER_EVENTS.ERROR, {
        code: 'GAME_NOT_FOUND',
        message: 'Active game not found',
      });
      return { success: false, error: 'GAME_NOT_FOUND' };
    }

    const result = executeGameAction(game, action);
    if (!result.success) {
      socket.emit(SERVER_EVENTS.ERROR, {
        code: result.error || 'INVALID_ACTION',
        message: `Action failed: ${result.error}`,
      });
      return { success: false, error: result.error };
    }

    // Update state & broadcast authoritative update to entire room
    this.activeGames.set(gameId, result.newState);
    this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, result.newState);

    // If game ended, record result
    if (result.newState.phase === 'FINISHED' && result.newState.winnerId) {
      this.persistGameCompletion(result.newState);
    }

    // Check if next player is AI, and trigger automatic AI move after brief delay
    this.checkAndTriggerAiMove(gameId);

    return { success: true };
  }

  private checkAndTriggerAiMove(gameId: string): void {
    const game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') return;

    const activePlayerId = game.playerOrder[game.currentPlayerIndex];
    const activePlayer = game.players[activePlayerId];

    if (activePlayer && activePlayer.isAi) {
      // Small simulated delay for realistic digital board game feel
      setTimeout(() => {
        this.runAiTurn(gameId, activePlayerId);
      }, 700);
    }
  }

  private runAiTurn(gameId: string, aiPlayerId: string): void {
    let game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') return;
    if (game.playerOrder[game.currentPlayerIndex] !== aiPlayerId) return;

    if (game.phase === 'SETUP_ROUND_1' || game.phase === 'SETUP_ROUND_2') {
      // AI chooses a valid unoccupied vertex
      const unoccupiedVertices = Object.values(game.board.vertices).filter(
        (v) => v.building === null && v.adjacentVertexIds.every((adjId) => game!.board.vertices[adjId]?.building === null)
      );

      if (unoccupiedVertices.length > 0) {
        // Pick best vertex (highest pip total)
        const bestVertex = unoccupiedVertices.reduce((best, v) => {
          const score = v.hexIds.reduce((sum, hId) => sum + (game!.board.hexes[hId]?.pips ?? 0), 0);
          const bestScore = best.hexIds.reduce((sum, hId) => sum + (game!.board.hexes[hId]?.pips ?? 0), 0);
          return score > bestScore ? v : best;
        }, unoccupiedVertices[0]);

        const buildSettlementRes = executeGameAction(game, {
          type: 'BUILD_SETTLEMENT',
          playerId: aiPlayerId,
          vertexId: bestVertex.id,
        });
        if (buildSettlementRes.success) {
          game = buildSettlementRes.newState;
          this.activeGames.set(gameId, game);

          // Build road on one of the adjacent edges
          const adjacentEdgeId = bestVertex.adjacentEdgeIds.find(
            (eId) => game!.board.edges[eId]?.road === null
          );
          if (adjacentEdgeId) {
            const buildRoadRes = executeGameAction(game, {
              type: 'BUILD_ROAD',
              playerId: aiPlayerId,
              edgeId: adjacentEdgeId,
            });
            if (buildRoadRes.success) {
              game = buildRoadRes.newState;
              this.activeGames.set(gameId, game);
            }
          }
        }
      }

      // End setup turn
      const endRes = executeGameAction(game, { type: 'END_TURN', playerId: aiPlayerId });
      if (endRes.success) {
        this.activeGames.set(gameId, endRes.newState);
        this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, endRes.newState);
        this.checkAndTriggerAiMove(gameId);
      }
      return;
    }

    if (game.phase === 'ROLLING') {
      const rollRes = executeGameAction(game, { type: 'ROLL_DICE', playerId: aiPlayerId });
      if (rollRes.success) {
        game = rollRes.newState;
        this.activeGames.set(gameId, game);
        this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, game);

        if (game.phase === 'ROBBER') {
          // AI moves robber to a non-desert hex not currently occupied
          const validHexes = Object.values(game.board.hexes).filter(
            (h) => h.id !== game!.board.robberHexId && h.terrain !== 'desert'
          );
          if (validHexes.length > 0) {
            const chosen = validHexes[Math.floor(Math.random() * validHexes.length)];
            const robberRes = executeGameAction(game, {
              type: 'MOVE_ROBBER',
              playerId: aiPlayerId,
              hexId: chosen.id,
            });
            if (robberRes.success) {
              game = robberRes.newState;
              this.activeGames.set(gameId, game);
            }
          }
        }

        // End turn after main actions
        setTimeout(() => {
          let curGame = this.activeGames.get(gameId);
          if (curGame && curGame.playerOrder[curGame.currentPlayerIndex] === aiPlayerId) {
            const endRes = executeGameAction(curGame, { type: 'END_TURN', playerId: aiPlayerId });
            if (endRes.success) {
              this.activeGames.set(gameId, endRes.newState);
              this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, endRes.newState);
              this.checkAndTriggerAiMove(gameId);
            }
          }
        }, 500);
      }
    }
  }

  private async persistGameCompletion(game: GameState): Promise<void> {
    try {
      const results = Object.values(game.players).map((p) => ({
        playerId: p.id,
        username: p.username,
        victoryPoints: p.victoryPoints,
        color: p.color,
      }));

      await GameRecordRepository.save({
        gameId: game.id,
        winnerId: game.winnerId!,
        playerResults: results,
        turnsCount: game.turnNumber,
        durationSeconds: Math.floor((Date.now() - game.createdAt) / 1000),
        createdAt: new Date(),
      });
      logger.info({ gameId: game.id, winnerId: game.winnerId }, 'Game saved to repository');
    } catch (err) {
      logger.error({ err }, 'Failed to persist game record');
    }
  }
}
