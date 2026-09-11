import {
  addAiSchema,
  chatMessageSchema,
  CLIENT_EVENTS,
  createGameSchema,
  joinGameSchema,
  kickSeatSchema,
  leaveGameSchema,
  SERVER_EVENTS,
  setColorSchema,
  setReadySchema,
  startGameSchema,
} from '@hexara/protocol';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { signJwt, verifyJwt } from '../auth/jwt.js';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';
import { ActionRegistry } from './actionRegistry.js';
import { GameRoomManager } from './gameRoomManager.js';
import { SocketRateLimiter } from './rateLimiter.js';

export function setupSocketServer(httpServer: HttpServer): {
  io: Server;
  roomManager: GameRoomManager;
  actionRegistry: ActionRegistry;
} {
  const allowedOrigins = [
    env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://islesofhexara.vercel.app',
  ];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive for preview deploys
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  const roomManager = new GameRoomManager(io);
  const lobbyManager = roomManager.getLobbyManager();
  const actionRegistry = new ActionRegistry();
  const rateLimiter = new SocketRateLimiter();

  // 1. Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const auth = socket.handshake.auth || {};
    const query = socket.handshake.query || {};
    const token =
      (auth.token as string) ||
      (query.token as string) ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (token) {
      const verified = verifyJwt(token);
      if (verified) {
        socket.data.userId = verified.sub;
        socket.data.username = verified.name;
        socket.data.isGuest = verified.guest ?? true;
        return next();
      }
    }

    // Fallback: If username/guestId provided or in dev mode, create guest identity
    const providedName = (auth.username as string) || (query.username as string) || 'Captain Voyager';
    const guestId = (auth.playerId as string) || (query.playerId as string) || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    socket.data.userId = guestId;
    socket.data.username = providedName;
    socket.data.isGuest = true;
    socket.data.token = signJwt({ sub: guestId, name: providedName, guest: true });

    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;
    logger.info({ socketId: socket.id, userId, username }, 'Socket connected');

    // Attach currentGameCode tracker
    let currentGameCode: string | undefined;

    // A. LOBBY: Create Game
    socket.on(CLIENT_EVENTS.CREATE_GAME, (data: unknown) => {
      const parsed = createGameSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: 'INVALID_PAYLOAD',
          message: parsed.error.message,
        });
        return;
      }

      const lobby = lobbyManager.createLobby(
        { playerId: userId, username },
        {
          scenarioId: parsed.data.scenarioId,
          scenarioName: parsed.data.scenarioName,
          targetVictoryPoints: parsed.data.targetVictoryPoints,
          maxPlayers: parsed.data.maxPlayers,
          mode: parsed.data.mode,
          seed: parsed.data.seed,
        }
      );

      currentGameCode = lobby.code;
      socket.join(`game:${lobby.code}`);
      socket.join(`lobby:${lobby.code}`);

      socket.emit(SERVER_EVENTS.LOBBY_STATE, lobbyManager.toPayload(lobby));
      logger.info({ code: lobby.code, host: username }, 'Lobby created');
    });

    // B. LOBBY: Join Game (by Room Code or legacy gameId)
    socket.on(CLIENT_EVENTS.JOIN_GAME, (data: unknown) => {
      const parsed = joinGameSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: 'INVALID_PAYLOAD',
          message: parsed.error.message,
        });
        return;
      }

      const { code, gameId, playerId } = parsed.data;
      const effectivePlayerId = playerId || userId;
      const targetCode = code || gameId;

      if (!targetCode) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: 'ROOM_NOT_FOUND',
          message: 'Room code or gameId required',
        });
        return;
      }

      // Check if this is an active game reconnection
      const activeGame = roomManager.getGame(targetCode);
      if (activeGame) {
        const reconnected = roomManager.handlePlayerReconnect(
          targetCode,
          effectivePlayerId,
          socket
        );
        if (reconnected) {
          currentGameCode = targetCode;
          return;
        }
      }

      // Otherwise attempt joining lobby
      const joinRes = lobbyManager.joinLobby(targetCode, {
        playerId: effectivePlayerId,
        username,
      });

      if (!joinRes.success || !joinRes.lobby) {
        // If lobby doesn't exist, check legacy game fallback
        if (gameId && !joinRes.lobby) {
          const legacyState = roomManager.createOrJoinLegacyGame(
            gameId,
            { id: effectivePlayerId, username },
            socket
          );
          currentGameCode = gameId;
          socket.emit(SERVER_EVENTS.GAME_STATE, legacyState);
          io.to(`game:${gameId}`).emit(SERVER_EVENTS.PLAYER_JOINED, {
            playerId: effectivePlayerId,
            username,
          });
          return;
        }

        socket.emit(SERVER_EVENTS.ERROR, {
          code: joinRes.error || 'ROOM_NOT_FOUND',
          message: `Unable to join: ${joinRes.error}`,
        });
        return;
      }

      const lobby = joinRes.lobby;
      currentGameCode = lobby.code;
      socket.join(`game:${lobby.code}`);
      socket.join(`lobby:${lobby.code}`);

      io.to(`game:${lobby.code}`).emit(
        SERVER_EVENTS.LOBBY_STATE,
        lobbyManager.toPayload(lobby)
      );
      io.to(`game:${lobby.code}`).emit(SERVER_EVENTS.PLAYER_JOINED, {
        playerId: effectivePlayerId,
        username,
      });
    });

    // C. LOBBY: Set Ready
    socket.on(CLIENT_EVENTS.SET_READY, (data: unknown) => {
      const parsed = setReadySchema.safeParse(data);
      if (!parsed.success) return;

      const code = parsed.data.code || currentGameCode;
      if (!code) return;

      const result = lobbyManager.setReady(code, userId, parsed.data.ready);
      if (result.success && result.lobby) {
        io.to(`game:${result.lobby.code}`).emit(
          SERVER_EVENTS.LOBBY_STATE,
          lobbyManager.toPayload(result.lobby)
        );
      }
    });

    // C2. LOBBY: Set Color
    socket.on(CLIENT_EVENTS.SET_COLOR, (data: unknown) => {
      const parsed = setColorSchema.safeParse(data);
      if (!parsed.success) return;

      const code = parsed.data.code || currentGameCode;
      if (!code) return;

      const result = lobbyManager.setColor(code, userId, parsed.data.color);
      if (result.success && result.lobby) {
        io.to(`game:${result.lobby.code}`).emit(
          SERVER_EVENTS.LOBBY_STATE,
          lobbyManager.toPayload(result.lobby)
        );
      } else if (!result.success) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: result.error || 'INVALID_ACTION',
          message: `Cannot change color: ${result.error}`,
        });
      }
    });

    // C3. LOBBY: Add AI Bot
    socket.on(CLIENT_EVENTS.ADD_AI, (data: unknown) => {
      const parsed = addAiSchema.safeParse(data);
      const code = parsed.success && parsed.data.code ? parsed.data.code : currentGameCode;
      if (!code) return;

      const result = lobbyManager.addAi(code, userId);
      if (result.success && result.lobby) {
        io.to(`game:${result.lobby.code}`).emit(
          SERVER_EVENTS.LOBBY_STATE,
          lobbyManager.toPayload(result.lobby)
        );
      } else if (!result.success) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: result.error || 'INVALID_ACTION',
          message: `Cannot add AI: ${result.error}`,
        });
      }
    });

    // D. LOBBY: Kick Seat
    socket.on(CLIENT_EVENTS.KICK_SEAT, (data: unknown) => {
      const parsed = kickSeatSchema.safeParse(data);
      if (!parsed.success) return;

      const code = parsed.data.code || currentGameCode;
      if (!code) return;

      const result = lobbyManager.kickSeat(code, userId, parsed.data.seatPlayerId);
      if (result.success && result.lobby) {
        io.to(`game:${result.lobby.code}`).emit(
          SERVER_EVENTS.LOBBY_STATE,
          lobbyManager.toPayload(result.lobby)
        );
        if (result.kickedPlayerId) {
          io.to(`game:${result.lobby.code}`).emit(SERVER_EVENTS.PLAYER_LEFT, {
            playerId: result.kickedPlayerId,
            reason: 'Kicked by host',
          });
        }
      }
    });

    // D2. LOBBY: Update Settings (e.g. Turn Duration, VP)
    socket.on('client:update_lobby_settings', (data: any) => {
      const code = data?.code || currentGameCode;
      if (!code || !data?.settings) return;
      const result = lobbyManager.updateLobbySettings(code, userId, data.settings);
      if (result.success && result.lobby) {
        io.to(`game:${result.lobby.code}`).emit(
          SERVER_EVENTS.LOBBY_STATE,
          lobbyManager.toPayload(result.lobby)
        );
      }
    });

    // E. LOBBY: Leave Game
    socket.on(CLIENT_EVENTS.LEAVE_GAME, (data: unknown) => {
      const parsed = leaveGameSchema.safeParse(data);
      const code = parsed.success && parsed.data.code ? parsed.data.code : currentGameCode;
      if (!code) return;

      const result = lobbyManager.leaveLobby(code, userId);
      socket.leave(`game:${code}`);
      socket.leave(`lobby:${code}`);

      if (result.success && result.lobby) {
        io.to(`game:${code}`).emit(
          SERVER_EVENTS.LOBBY_STATE,
          lobbyManager.toPayload(result.lobby)
        );
        io.to(`game:${code}`).emit(SERVER_EVENTS.PLAYER_LEFT, {
          playerId: userId,
          reason: 'Player left room',
        });
      }
      currentGameCode = undefined;
    });

    // F. LOBBY: Start Game
    socket.on(CLIENT_EVENTS.START_GAME, (data: unknown) => {
      const parsed = startGameSchema.safeParse(data);
      const code = parsed.success && parsed.data.code ? parsed.data.code : currentGameCode;
      if (!code) return;

      const startRes = lobbyManager.startGame(code, userId);
      if (!startRes.success || !startRes.lobby || !startRes.players) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: startRes.error || 'INVALID_ACTION',
          message: `Cannot start game: ${startRes.error}`,
        });
        return;
      }

      // Synchronized 3 -> 2 -> 1 -> START countdown before launching match
      io.to(`game:${code}`).emit(SERVER_EVENTS.COUNTDOWN, { count: 3, message: 'Setting sail in 3...' });

      setTimeout(() => {
        io.to(`game:${code}`).emit(SERVER_EVENTS.COUNTDOWN, { count: 2, message: 'Setting sail in 2...' });
      }, 1000);

      setTimeout(() => {
        io.to(`game:${code}`).emit(SERVER_EVENTS.COUNTDOWN, { count: 1, message: 'Setting sail in 1...' });
      }, 2000);

      setTimeout(() => {
        io.to(`game:${code}`).emit(SERVER_EVENTS.COUNTDOWN, { count: 0, message: 'Voyage begins!' });
        // Initialize game state and broadcast
        const game = roomManager.createGameFromLobby(startRes.lobby, startRes.players);
        io.to(`game:${code}`).emit(
          SERVER_EVENTS.LOBBY_STATE,
          lobbyManager.toPayload(startRes.lobby)
        );
        roomManager.broadcastGameState(game.id, game, code);
      }, 3000);
    });

    // G. GAME ACTIONS: Intercepted and routed through ActionRegistry
    const allGameEvents = [
      CLIENT_EVENTS.ROLL_DICE,
      CLIENT_EVENTS.BUILD_ROAD,
      CLIENT_EVENTS.BUILD_SETTLEMENT,
      CLIENT_EVENTS.BUILD_CITY,
      CLIENT_EVENTS.MOVE_ROBBER,
      CLIENT_EVENTS.DISCARD_RESOURCES,
      CLIENT_EVENTS.STEAL_RESOURCE,
      CLIENT_EVENTS.BUY_DEV_CARD,
      CLIENT_EVENTS.PLAY_DEV_CARD,
      CLIENT_EVENTS.TRADE_BANK,
      CLIENT_EVENTS.TRADE_MARITIME,
      CLIENT_EVENTS.TRADE_PROPOSE,
      CLIENT_EVENTS.TRADE_ACCEPT,
      CLIENT_EVENTS.TRADE_CANCEL,
      CLIENT_EVENTS.END_TURN,
    ];

    for (const eventName of allGameEvents) {
      socket.on(eventName, (payload: unknown) => {
        // Rate limit check
        if (!rateLimiter.checkActionLimit(socket.id)) {
          socket.emit(SERVER_EVENTS.ERROR, {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many game actions. Please slow down.',
          });
          return;
        }

        actionRegistry.dispatch(eventName, payload, socket, roomManager, currentGameCode);
      });
    }

    // H. CHAT
    socket.on(CLIENT_EVENTS.SEND_CHAT, (data: unknown) => {
      if (!rateLimiter.checkChatLimit(socket.id)) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Chat message rate limit exceeded.',
        });
        return;
      }

      const parsed = chatMessageSchema.safeParse(data);
      if (!parsed.success) return;

      const { message, gameId } = parsed.data;
      const targetRoom = gameId || currentGameCode;
      if (!targetRoom) return;

      io.to(`game:${targetRoom}`).emit(SERVER_EVENTS.CHAT_MESSAGE, {
        playerId: userId,
        username,
        message,
        timestamp: Date.now(),
      });
    });

    // I. WEBRTC VOICE CHAT SIGNALING
    socket.on('voice:join', (data: { roomCode: string }) => {
      const room = data?.roomCode || currentGameCode;
      if (!room) return;
      socket.to(`game:${room}`).emit('voice:peer-joined', {
        peerId: userId,
        socketId: socket.id,
        username,
      });
    });

    socket.on('voice:signal', (data: { targetPeerId?: string; targetSocketId?: string; signal: any }) => {
      if (data.targetSocketId) {
        io.to(data.targetSocketId).emit('voice:signal', {
          senderPeerId: userId,
          senderSocketId: socket.id,
          senderUsername: username,
          signal: data.signal,
        });
      } else if (currentGameCode) {
        socket.to(`game:${currentGameCode}`).emit('voice:signal', {
          senderPeerId: userId,
          senderSocketId: socket.id,
          senderUsername: username,
          signal: data.signal,
        });
      }
    });

    socket.on('voice:speaking', (data: { isSpeaking: boolean }) => {
      if (currentGameCode) {
        socket.to(`game:${currentGameCode}`).emit('voice:speaking-status', {
          peerId: userId,
          isSpeaking: data.isSpeaking,
        });
      }
    });

    socket.on('voice:leave', () => {
      if (currentGameCode) {
        socket.to(`game:${currentGameCode}`).emit('voice:peer-left', {
          peerId: userId,
        });
      }
    });

    // J. DISCONNECT
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id, userId }, 'Socket client disconnected');
      if (currentGameCode) {
        socket.to(`game:${currentGameCode}`).emit('voice:peer-left', {
          peerId: userId,
        });
      }
      rateLimiter.cleanup(socket.id);
      if (currentGameCode) {
        roomManager.handlePlayerDisconnect(socket.id, userId, currentGameCode);
      }
    });
  });

  return { io, roomManager, actionRegistry };
}
