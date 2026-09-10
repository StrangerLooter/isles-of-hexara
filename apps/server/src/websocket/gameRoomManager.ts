import {
  createInitialGameState,
  executeGameAction,
  GameAction,
  GameState,
} from '@hexara/game-core';
import { SERVER_EVENTS } from '@hexara/protocol';
import { Server, Socket } from 'socket.io';
import { AiController } from '../ai/aiController.js';
import { GameRecordRepository } from '../database/models/GameRecord.js';
import { ProfileRepository } from '../database/models/Profile.js';
import { logger } from '../logging/logger.js';
import { Lobby, LobbyManager } from '../rooms/lobbyManager.js';

interface DisconnectGraceInfo {
  gameId: string;
  playerId: string;
  timeout: NodeJS.Timeout;
}

export class GameRoomManager {
  private activeGames = new Map<string, GameState>();
  private actionCounters = new Map<string, number>();
  private disconnectGraceTimers = new Map<string, DisconnectGraceInfo>(); // key: `${gameId}:${playerId}`
  private roomWatchdogs = new Map<string, NodeJS.Timeout>();
  private lobbyManager: LobbyManager;
  private io: Server;

  constructor(io: Server, lobbyManager?: LobbyManager) {
    this.io = io;
    this.lobbyManager = lobbyManager || new LobbyManager();
  }

  getLobbyManager(): LobbyManager {
    return this.lobbyManager;
  }

  getGame(gameIdOrCode: string): GameState | undefined {
    return this.activeGames.get(gameIdOrCode);
  }

  createGameFromLobby(
    lobby: Lobby,
    players: Array<{ id: string; username: string; isAi?: boolean }>
  ): GameState {
    const seed = lobby.settings.seed ?? Math.floor(Math.random() * 1000000);
    const game = createInitialGameState(lobby.code, players, seed, {
      targetVictoryPoints: lobby.settings.targetVictoryPoints,
      scenarioId: lobby.settings.scenarioId,
      scenarioName: lobby.settings.scenarioName,
    });

    this.activeGames.set(lobby.code, game);
    this.activeGames.set(game.id, game);
    this.actionCounters.set(game.id, 0);

    logger.info(
      { gameId: game.id, code: lobby.code, playerCount: players.length },
      'Authoritative Game created from lobby'
    );

    // Broadcast initial game state
    this.io.to(`game:${lobby.code}`).emit(SERVER_EVENTS.GAME_STATE, game);
    this.resetWatchdog(game.id);
    this.checkAndTriggerAiMove(game.id);

    return game;
  }

  createOrJoinLegacyGame(
    gameId: string,
    player: { id: string; username: string; isAi?: boolean },
    socket: Socket
  ): GameState {
    let game = this.activeGames.get(gameId);

    if (!game) {
      const initialPlayers = [
        player,
        { id: 'ai_1', username: 'Candamir (Bot)', isAi: true },
        { id: 'ai_2', username: 'Louis (Bot)', isAi: true },
        { id: 'ai_3', username: 'William (Bot)', isAi: true },
      ];
      game = createInitialGameState(gameId, initialPlayers);
      this.activeGames.set(gameId, game);
      this.actionCounters.set(gameId, 0);
      logger.info({ gameId, hostPlayer: player.username }, 'New authoritative game created');
    } else {
      if (game.players[player.id]) {
        game.players[player.id].isConnected = true;
        game.players[player.id].username = player.username;
        this.clearDisconnectGrace(gameId, player.id);
      } else {
        // Seat replacement: Find an AI bot and replace with this human player
        const aiPlayerId = game.playerOrder.find((pId) => game!.players[pId]?.isAi);
        if (aiPlayerId) {
          const oldAi = game.players[aiPlayerId];
          const newPlayer = {
            ...oldAi,
            id: player.id,
            username: player.username,
            isAi: false,
            isConnected: true,
          };
          delete game.players[aiPlayerId];
          game.players[player.id] = newPlayer;

          // Update playerOrder
          const idx = game.playerOrder.indexOf(aiPlayerId);
          if (idx !== -1) {
            game.playerOrder[idx] = player.id;
          }

          // Update any placed buildings/roads on board
          for (const v of Object.values(game.board.vertices)) {
            if (v.building && v.building.playerId === aiPlayerId) {
              v.building.playerId = player.id;
            }
          }
          for (const e of Object.values(game.board.edges)) {
            if (e.road && e.road.playerId === aiPlayerId) {
              e.road.playerId = player.id;
            }
          }

          logger.info(
            { gameId, newPlayerId: player.id, replacedBot: aiPlayerId, username: player.username },
            'Human player took over AI seat in room'
          );
        }
      }
    }

    socket.join(`game:${gameId}`);
    this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, game);
    this.resetWatchdog(game.id);
    this.checkAndTriggerAiMove(gameId);

    return game;
  }

  handlePlayerReconnect(gameId: string, playerId: string, socket: Socket): boolean {
    const game = this.activeGames.get(gameId);
    if (!game) return false;

    if (game.players[playerId]) {
      game.players[playerId].isConnected = true;
      this.clearDisconnectGrace(gameId, playerId);

      socket.join(`game:${gameId}`);
      socket.emit(SERVER_EVENTS.GAME_SYNC, { state: game });
      this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, game);
      logger.info({ gameId, playerId }, 'Player successfully reconnected to game');
      return true;
    }

    return false;
  }

  handlePlayerDisconnect(socketId: string, playerId?: string, gameId?: string): void {
    if (!playerId || !gameId) return;

    const game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') return;

    const player = game.players[playerId];
    if (player && !player.isAi) {
      player.isConnected = false;
      this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.PLAYER_LEFT, {
        playerId,
        reason: 'Connection lost (60s grace period active)',
      });
      this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, game);

      // Start 60s grace period timer
      const graceKey = `${gameId}:${playerId}`;
      this.clearDisconnectGrace(gameId, playerId);

      const timeout = setTimeout(() => {
        this.handleGracePeriodExpiry(gameId, playerId);
      }, 60000);
      timeout.unref();

      this.disconnectGraceTimers.set(graceKey, { gameId, playerId, timeout });
      logger.info({ gameId, playerId }, 'Started 60s disconnect grace period');
    }
  }

  private clearDisconnectGrace(gameId: string, playerId: string): void {
    const graceKey = `${gameId}:${playerId}`;
    const info = this.disconnectGraceTimers.get(graceKey);
    if (info) {
      clearTimeout(info.timeout);
      this.disconnectGraceTimers.delete(graceKey);
    }
  }

  private handleGracePeriodExpiry(gameId: string, playerId: string): void {
    const graceKey = `${gameId}:${playerId}`;
    this.disconnectGraceTimers.delete(graceKey);

    const game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') return;

    const player = game.players[playerId];
    if (player && !player.isConnected) {
      player.isAi = true;
      player.username = `${player.username} (AI Sub)`;
      logger.warn(
        { gameId, playerId },
        'Disconnect grace period expired. Seat converted to AI controller'
      );

      this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, game);
      this.checkAndTriggerAiMove(gameId);
    }
  }

  handleAction(
    gameId: string,
    action: GameAction,
    socket?: Socket
  ): { success: boolean; error?: string; newState?: GameState } {
    const game = this.activeGames.get(gameId);
    if (!game) {
      if (socket) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: 'GAME_NOT_FOUND',
          message: 'Active game not found',
        });
      }
      return { success: false, error: 'GAME_NOT_FOUND' };
    }

    const result = executeGameAction(game, action);
    if (!result.success) {
      if (socket) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: result.error || 'INVALID_ACTION',
          message: `Action failed: ${result.error}`,
        });
      }
      return { success: false, error: result.error };
    }

    // Update state & broadcast authoritative update
    this.activeGames.set(gameId, result.newState);
    if (result.newState.id !== gameId) {
      this.activeGames.set(result.newState.id, result.newState);
    }

    this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.GAME_STATE, result.newState);
    this.resetWatchdog(gameId);

    // Track action count and persist periodic snapshot
    const currentCount = (this.actionCounters.get(gameId) ?? 0) + 1;
    this.actionCounters.set(gameId, currentCount);

    if (result.newState.phase === 'FINISHED' && result.newState.winnerId) {
      this.persistGameCompletion(result.newState);
      this.clearWatchdog(gameId);
    } else {
      this.checkAndTriggerAiMove(gameId);
    }

    return { success: true, newState: result.newState };
  }

  private resetWatchdog(gameId: string): void {
    this.clearWatchdog(gameId);

    // 30s watchdog for AI stall protection
    const timer = setTimeout(() => {
      this.onWatchdogTimeout(gameId);
    }, 30000);
    timer.unref();

    this.roomWatchdogs.set(gameId, timer);
  }

  private clearWatchdog(gameId: string): void {
    const existing = this.roomWatchdogs.get(gameId);
    if (existing) {
      clearTimeout(existing);
      this.roomWatchdogs.delete(gameId);
    }
  }

  private onWatchdogTimeout(gameId: string): void {
    const game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') return;

    const activePlayerId = game.playerOrder[game.currentPlayerIndex];
    const activePlayer = game.players[activePlayerId];

    if (activePlayer && activePlayer.isAi) {
      logger.warn({ gameId, activePlayerId }, '30s AI watchdog triggered — attempting recovery');
      const action = AiController.getNextMove(game, activePlayerId);
      if (action) {
        this.handleAction(gameId, action);
      } else {
        // Fallback force END_TURN
        logger.warn({ gameId, activePlayerId }, 'AI watchdog forcing END_TURN');
        this.handleAction(gameId, { type: 'END_TURN', playerId: activePlayerId });
      }
    }
  }

  public checkAndTriggerAiMove(gameId: string): void {
    const game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') return;

    // Check if any AI has pending robber discards
    if (game.phase === 'ROBBER_DISCARD') {
      for (const [pId, count] of Object.entries(game.pendingDiscards)) {
        if (count > 0 && game.players[pId]?.isAi) {
          const delay = Math.floor(Math.random() * 400) + 400; // 400-800ms
          const t = setTimeout(() => {
            const curGame = this.activeGames.get(gameId);
            if (curGame && curGame.phase === 'ROBBER_DISCARD') {
              const action = AiController.getNextMove(curGame, pId);
              if (action) {
                this.handleAction(gameId, action);
              }
            }
          }, delay);
          t.unref();
          return;
        }
      }
      return;
    }

    const activePlayerId = game.playerOrder[game.currentPlayerIndex];
    const activePlayer = game.players[activePlayerId];

    if (activePlayer && activePlayer.isAi) {
      const delay = Math.floor(Math.random() * 500) + 400; // 400-900ms delay
      const t = setTimeout(() => {
        const curGame = this.activeGames.get(gameId);
        if (!curGame || curGame.phase === 'FINISHED') return;
        if (curGame.playerOrder[curGame.currentPlayerIndex] !== activePlayerId && curGame.phase !== 'ROBBER_DISCARD') return;

        const action = AiController.getNextMove(curGame, activePlayerId);
        if (action) {
          this.handleAction(gameId, action);
        } else if (curGame.phase === 'MAIN') {
          this.handleAction(gameId, { type: 'END_TURN', playerId: activePlayerId });
        }
      }, delay);
      t.unref();
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

      // Update player profile XP / stats
      for (const p of Object.values(game.players)) {
        if (!p.isAi) {
          await ProfileRepository.updateStatsAfterGame(p.id, {
            won: p.id === game.winnerId,
            victoryPoints: p.victoryPoints,
          });
        }
      }

      logger.info({ gameId: game.id, winnerId: game.winnerId }, 'Game saved and profiles updated');
    } catch (err) {
      logger.error({ err }, 'Failed to persist game record or update profiles');
    }
  }
}
