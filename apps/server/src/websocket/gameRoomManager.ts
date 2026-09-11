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
  private turnTimers = new Map<string, { timeout: NodeJS.Timeout; turnId: number; deadline: number }>();
  private turnCounters = new Map<string, number>();
  private turnDurations = new Map<string, number>();
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

    const turnDuration = lobby.settings.turnDurationSeconds || 60;
    this.turnDurations.set(lobby.code, turnDuration);
    this.turnDurations.set(game.id, turnDuration);

    logger.info(
      { gameId: game.id, code: lobby.code, playerCount: players.length },
      'Authoritative Game created from lobby'
    );

    // Broadcast initial game state & start turn timer
    this.broadcastGameState(game.id, game, lobby.code);
    this.startTurnTimer(game.id, lobby.code);
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
      this.turnDurations.set(gameId, 60);
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
    this.broadcastGameState(game.id, game, gameId);
    this.startTurnTimer(game.id, gameId);
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
      socket.emit(SERVER_EVENTS.GAME_SYNC, { state: this.sanitizeStateForPlayer(game, playerId) });

      const currentTimer = this.turnTimers.get(gameId);
      if (currentTimer) {
        const activePlayerId = game.playerOrder[game.currentPlayerIndex];
        const durationSeconds = this.turnDurations.get(gameId) ?? 60;
        socket.emit(SERVER_EVENTS.TURN_TIMER, {
          currentPlayerId: activePlayerId,
          turnDeadline: currentTimer.deadline,
          turnId: currentTimer.turnId,
          durationSeconds,
        });
      }

      this.broadcastGameState(game.id, game);
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
      this.broadcastGameState(gameId, game);

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

      this.broadcastGameState(gameId, game);
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

    this.broadcastGameState(gameId, result.newState);
    this.resetWatchdog(gameId);

    // Track action count and persist periodic snapshot
    const currentCount = (this.actionCounters.get(gameId) ?? 0) + 1;
    this.actionCounters.set(gameId, currentCount);

    if (result.newState.phase === 'FINISHED' && result.newState.winnerId) {
      this.persistGameCompletion(result.newState);
      this.clearWatchdog(gameId);
      this.clearTurnTimer(gameId);
    } else {
      const turnChanged =
        result.newState.currentPlayerIndex !== game.currentPlayerIndex ||
        result.newState.turnNumber !== game.turnNumber ||
        result.newState.phase !== game.phase;

      if (turnChanged || !this.turnTimers.has(gameId)) {
        this.startTurnTimer(gameId);
      }
      this.checkAndTriggerAiMove(gameId);
    }

    return { success: true, newState: result.newState };
  }

  /**
   * Sanitizes game state for a viewing player by masking unplayed development
   * cards belonging to opponents, keeping hand size accurate while protecting private card types.
   */
  public sanitizeStateForPlayer(state: GameState, viewerPlayerId?: string): GameState {
    const maskedPlayers: Record<string, any> = {};
    for (const [pId, player] of Object.entries(state.players)) {
      if (pId === viewerPlayerId || !viewerPlayerId) {
        maskedPlayers[pId] = player;
      } else {
        maskedPlayers[pId] = {
          ...player,
          devCards: (player.devCards || []).map(() => 'unknown' as any),
        };
      }
    }
    return {
      ...state,
      players: maskedPlayers,
    };
  }

  /**
   * Broadcasts sanitized game state to all sockets in the game room so no player
   * receives opponent's hidden development card identities.
   */
  public broadcastGameState(gameId: string, state: GameState, roomCode?: string): void {
    const sendToRoom = (roomKey: string) => {
      const roomSockets = this.io?.sockets?.adapter?.rooms?.get(roomKey);
      if (roomSockets && roomSockets.size > 0 && this.io?.sockets?.sockets) {
        for (const socketId of roomSockets) {
          const clientSocket = this.io.sockets.sockets.get(socketId);
          if (!clientSocket) continue;
          const playerId = (clientSocket.data as any)?.playerId || (clientSocket.handshake?.auth as any)?.playerId;
          clientSocket.emit(SERVER_EVENTS.GAME_STATE, this.sanitizeStateForPlayer(state, playerId));
        }
      } else {
        this.io?.to(roomKey)?.emit(SERVER_EVENTS.GAME_STATE, state);
      }
    };

    sendToRoom(`game:${gameId}`);
    if (roomCode && roomCode !== gameId) {
      sendToRoom(`game:${roomCode}`);
    }
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

  public startTurnTimer(gameId: string, roomCode?: string): void {
    const game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') {
      this.clearTurnTimer(gameId);
      return;
    }

    this.clearTurnTimer(gameId);

    const turnId = (this.turnCounters.get(gameId) ?? 0) + 1;
    this.turnCounters.set(gameId, turnId);
    const durationSeconds = this.turnDurations.get(gameId) ?? (roomCode ? this.turnDurations.get(roomCode) : undefined) ?? 60;
    const deadline = Date.now() + durationSeconds * 1000;
    const activePlayerId = game.playerOrder[game.currentPlayerIndex];

    const timerPayload = {
      currentPlayerId: activePlayerId,
      turnDeadline: deadline,
      turnId,
      durationSeconds,
    };

    this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.TURN_TIMER, timerPayload);
    if (roomCode && roomCode !== gameId) {
      this.io.to(`game:${roomCode}`).emit(SERVER_EVENTS.TURN_TIMER, timerPayload);
    }

    const timeout = setTimeout(() => {
      this.handleTurnTimeout(gameId, turnId);
    }, durationSeconds * 1000);
    timeout.unref();

    this.turnTimers.set(gameId, { timeout, turnId, deadline });
  }

  private clearWatchdog(gameId: string): void {
    const existing = this.roomWatchdogs.get(gameId);
    if (existing) {
      clearTimeout(existing);
      this.roomWatchdogs.delete(gameId);
    }
  }

  public clearTurnTimer(gameId: string): void {
    const existing = this.turnTimers.get(gameId);
    if (existing) {
      clearTimeout(existing.timeout);
      this.turnTimers.delete(gameId);
    }
  }

  private handleTurnTimeout(gameId: string, expectedTurnId: number): void {
    const currentTimer = this.turnTimers.get(gameId);
    if (!currentTimer || currentTimer.turnId !== expectedTurnId) return;

    this.turnTimers.delete(gameId);

    const game = this.activeGames.get(gameId);
    if (!game || game.phase === 'FINISHED') return;

    const activePlayerId = game.playerOrder[game.currentPlayerIndex];
    logger.warn(
      { gameId, activePlayerId, phase: game.phase, turnId: expectedTurnId },
      'Server 60s turn timer expired. Executing safe phase-aware action'
    );

    this.io.to(`game:${gameId}`).emit(SERVER_EVENTS.TURN_EXPIRED, {
      playerId: activePlayerId,
    });

    // Determine safe fallback action based on phase so game NEVER gets stuck
    let autoAction: GameAction | null = null;

    if (game.phase === 'ROBBER_DISCARD') {
      const pendingPlayerId = Object.keys(game.pendingDiscards).find(
        (id) => (game.pendingDiscards[id] ?? 0) > 0
      );
      if (pendingPlayerId) {
        autoAction = AiController.getNextMove(game, pendingPlayerId);
      }
    } else if (game.phase === 'ROLLING') {
      autoAction = { type: 'ROLL_DICE', playerId: activePlayerId };
    } else if (game.phase === 'MAIN') {
      autoAction = { type: 'END_TURN', playerId: activePlayerId };
    } else {
      autoAction = AiController.getNextMove(game, activePlayerId);
      if (!autoAction && game.phase !== 'SETUP_ROUND_1' && game.phase !== 'SETUP_ROUND_2') {
        autoAction = { type: 'END_TURN', playerId: activePlayerId };
      }
    }

    if (autoAction) {
      this.handleAction(gameId, autoAction);
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
