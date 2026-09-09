import {
  buildCitySchema,
  buildRoadSchema,
  buildSettlementSchema,
  chatMessageSchema,
  CLIENT_EVENTS,
  endTurnSchema,
  joinGameSchema,
  moveRobberSchema,
  rollDiceSchema,
  SERVER_EVENTS,
  tradeBankSchema,
} from '@hexara/protocol';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';
import { GameRoomManager } from './gameRoomManager.js';

export function setupSocketServer(httpServer: HttpServer): { io: Server; roomManager: GameRoomManager } {
  const io = new Server(httpServer, {
    cors: {
      origin: [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const roomManager = new GameRoomManager(io);

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Socket client connected');

    // 1. Join Game
    socket.on(CLIENT_EVENTS.JOIN_GAME, (data: unknown) => {
      const parsed = joinGameSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: 'INVALID_PAYLOAD',
          message: parsed.error.message,
        });
        return;
      }
      const { gameId, playerId, username } = parsed.data;
      const state = roomManager.createOrJoinGame(gameId, { id: playerId, username }, socket);
      socket.emit(SERVER_EVENTS.GAME_STATE, state);
      io.to(`game:${gameId}`).emit(SERVER_EVENTS.PLAYER_JOINED, { playerId, username });
    });

    // 2. Roll Dice
    socket.on(CLIENT_EVENTS.ROLL_DICE, (data: unknown) => {
      const parsed = rollDiceSchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId } = parsed.data;
      roomManager.handleAction(gameId, { type: 'ROLL_DICE', playerId }, socket);
    });

    // 3. Build Road
    socket.on(CLIENT_EVENTS.BUILD_ROAD, (data: unknown) => {
      const parsed = buildRoadSchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId, edgeId } = parsed.data;
      roomManager.handleAction(gameId, { type: 'BUILD_ROAD', playerId, edgeId }, socket);
    });

    // 4. Build Settlement
    socket.on(CLIENT_EVENTS.BUILD_SETTLEMENT, (data: unknown) => {
      const parsed = buildSettlementSchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId, vertexId } = parsed.data;
      roomManager.handleAction(gameId, { type: 'BUILD_SETTLEMENT', playerId, vertexId }, socket);
    });

    // 5. Build City
    socket.on(CLIENT_EVENTS.BUILD_CITY, (data: unknown) => {
      const parsed = buildCitySchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId, vertexId } = parsed.data;
      roomManager.handleAction(gameId, { type: 'BUILD_CITY', playerId, vertexId }, socket);
    });

    // 6. Move Robber
    socket.on(CLIENT_EVENTS.MOVE_ROBBER, (data: unknown) => {
      const parsed = moveRobberSchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId, hexId } = parsed.data;
      roomManager.handleAction(gameId, { type: 'MOVE_ROBBER', playerId, hexId }, socket);
    });

    // 7. Trade Bank
    socket.on(CLIENT_EVENTS.TRADE_BANK, (data: unknown) => {
      const parsed = tradeBankSchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId, giving, receiving } = parsed.data;
      roomManager.handleAction(gameId, { type: 'TRADE_BANK', playerId, giving, receiving }, socket);
    });

    // 8. End Turn
    socket.on(CLIENT_EVENTS.END_TURN, (data: unknown) => {
      const parsed = endTurnSchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId } = parsed.data;
      roomManager.handleAction(gameId, { type: 'END_TURN', playerId }, socket);
    });

    // 9. Chat
    socket.on(CLIENT_EVENTS.SEND_CHAT, (data: unknown) => {
      const parsed = chatMessageSchema.safeParse(data);
      if (!parsed.success) return;
      const { gameId, playerId, message } = parsed.data;
      const game = roomManager.getGame(gameId);
      const username = game?.players[playerId]?.username ?? 'Voyager';
      io.to(`game:${gameId}`).emit(SERVER_EVENTS.CHAT_MESSAGE, {
        playerId,
        username,
        message,
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket client disconnected');
    });
  });

  return { io, roomManager };
}
