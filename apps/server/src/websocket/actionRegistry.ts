import {
  GameAction,
  GameState,
  ResourceType,
} from '@hexara/game-core';
import {
  buildCitySchema,
  buildRoadSchema,
  buildSettlementSchema,
  buyDevCardSchema,
  CLIENT_EVENTS,
  discardResourcesSchema,
  endTurnSchema,
  moveRobberSchema,
  playDevCardSchema,
  rollDiceSchema,
  SERVER_EVENTS,
  stealResourceSchema,
  tradeAcceptSchema,
  tradeBankSchema,
  tradeCancelSchema,
  tradeMaritimeSchema,
  tradeProposeSchema,
} from '@hexara/protocol';
import { Socket } from 'socket.io';
import { z } from 'zod';
import { logger } from '../logging/logger.js';
import { GameRoomManager } from './gameRoomManager.js';

export interface ActionDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  event: string;
  schema: TSchema;
  toAction: (data: z.infer<TSchema>, playerId: string) => GameAction;
  requiresTurn?: boolean;
}

export class ActionRegistry {
  private handlers = new Map<string, ActionDefinition<any>>();

  constructor() {
    this.registerDefaults();
  }

  register<TSchema extends z.ZodTypeAny>(def: ActionDefinition<TSchema>): void {
    this.handlers.set(def.event, def as ActionDefinition<any>);
  }

  private registerDefaults(): void {
    // 1. ROLL_DICE
    this.register({
      event: CLIENT_EVENTS.ROLL_DICE,
      schema: rollDiceSchema,
      requiresTurn: true,
      toAction: (_data, playerId) => ({ type: 'ROLL_DICE', playerId }),
    });

    // 2. BUILD_ROAD
    this.register({
      event: CLIENT_EVENTS.BUILD_ROAD,
      schema: buildRoadSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({ type: 'BUILD_ROAD', playerId, edgeId: data.edgeId }),
    });

    // 3. BUILD_SETTLEMENT
    this.register({
      event: CLIENT_EVENTS.BUILD_SETTLEMENT,
      schema: buildSettlementSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({ type: 'BUILD_SETTLEMENT', playerId, vertexId: data.vertexId }),
    });

    // 4. BUILD_CITY
    this.register({
      event: CLIENT_EVENTS.BUILD_CITY,
      schema: buildCitySchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({ type: 'BUILD_CITY', playerId, vertexId: data.vertexId }),
    });

    // 5. MOVE_ROBBER
    this.register({
      event: CLIENT_EVENTS.MOVE_ROBBER,
      schema: moveRobberSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({ type: 'MOVE_ROBBER', playerId, hexId: data.hexId }),
    });

    // 6. DISCARD_RESOURCES (can happen asynchronously during ROBBER_DISCARD)
    this.register({
      event: CLIENT_EVENTS.DISCARD_RESOURCES,
      schema: discardResourcesSchema,
      requiresTurn: false,
      toAction: (data, playerId) => ({
        type: 'DISCARD_RESOURCES',
        playerId,
        resources: data.resources,
      }),
    });

    // 7. STEAL_RESOURCE
    this.register({
      event: CLIENT_EVENTS.STEAL_RESOURCE,
      schema: stealResourceSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({ type: 'STEAL_RESOURCE', playerId, victimId: data.victimId }),
    });

    // 8. BUY_DEV_CARD
    this.register({
      event: CLIENT_EVENTS.BUY_DEV_CARD,
      schema: buyDevCardSchema,
      requiresTurn: true,
      toAction: (_data, playerId) => ({ type: 'BUY_DEV_CARD', playerId }),
    });

    // 9. PLAY_DEV_CARD
    this.register({
      event: CLIENT_EVENTS.PLAY_DEV_CARD,
      schema: playDevCardSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({
        type: 'PLAY_DEV_CARD',
        playerId,
        card: data.card,
        params: data.params,
      }),
    });

    // 10. TRADE_BANK
    this.register({
      event: CLIENT_EVENTS.TRADE_BANK,
      schema: tradeBankSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({
        type: 'TRADE_BANK',
        playerId,
        giving: data.giving as ResourceType,
        receiving: data.receiving as ResourceType,
      }),
    });

    // 11. TRADE_MARITIME
    this.register({
      event: CLIENT_EVENTS.TRADE_MARITIME,
      schema: tradeMaritimeSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({
        type: 'TRADE_MARITIME',
        playerId,
        giving: data.giving as ResourceType,
        receiving: data.receiving as ResourceType,
      }),
    });

    // 12. TRADE_PROPOSE
    this.register({
      event: CLIENT_EVENTS.TRADE_PROPOSE,
      schema: tradeProposeSchema,
      requiresTurn: true,
      toAction: (data, playerId) => ({
        type: 'TRADE_PROPOSE',
        playerId,
        offer: data.offer,
        request: data.request,
      }),
    });

    // 13. TRADE_ACCEPT (non-turn players can accept)
    this.register({
      event: CLIENT_EVENTS.TRADE_ACCEPT,
      schema: tradeAcceptSchema,
      requiresTurn: false,
      toAction: (_data, playerId) => ({ type: 'TRADE_ACCEPT', playerId }),
    });

    // 14. TRADE_CANCEL
    this.register({
      event: CLIENT_EVENTS.TRADE_CANCEL,
      schema: tradeCancelSchema,
      requiresTurn: false,
      toAction: (_data, playerId) => ({ type: 'TRADE_CANCEL', playerId }),
    });

    // 15. END_TURN
    this.register({
      event: CLIENT_EVENTS.END_TURN,
      schema: endTurnSchema,
      requiresTurn: true,
      toAction: (_data, playerId) => ({ type: 'END_TURN', playerId }),
    });
  }

  dispatch(
    event: string,
    rawPayload: unknown,
    socket: Socket,
    roomManager: GameRoomManager,
    defaultGameId?: string
  ): boolean {
    const handler = this.handlers.get(event);
    if (!handler) return false;

    // 1. Validate Payload Schema
    const parsed = handler.schema.safeParse(rawPayload);
    if (!parsed.success) {
      socket.emit(SERVER_EVENTS.ERROR, {
        code: 'INVALID_PAYLOAD',
        message: `Validation failed for ${event}: ${parsed.error.message}`,
      });
      return true;
    }

    const data = parsed.data;
    const gameId = data.gameId || defaultGameId;
    const authUserId = socket.data.userId;

    if (!authUserId) {
      socket.emit(SERVER_EVENTS.ERROR, {
        code: 'UNAUTHENTICATED',
        message: 'Socket not authenticated',
      });
      return true;
    }

    // Ensure acting player matches authenticated socket user (or explicit playerId equals authUserId)
    const effectivePlayerId = data.playerId ?? authUserId;
    if (effectivePlayerId !== authUserId) {
      socket.emit(SERVER_EVENTS.ERROR, {
        code: 'UNAUTHORIZED',
        message: 'Cannot perform actions on behalf of other players',
      });
      return true;
    }

    if (!gameId) {
      socket.emit(SERVER_EVENTS.ERROR, {
        code: 'GAME_NOT_FOUND',
        message: 'No active game specified',
      });
      return true;
    }

    const game = roomManager.getGame(gameId);
    if (!game) {
      socket.emit(SERVER_EVENTS.ERROR, {
        code: 'GAME_NOT_FOUND',
        message: `Game ${gameId} not found`,
      });
      return true;
    }

    // 2. Turn Check (if required by action)
    if (handler.requiresTurn) {
      const activePlayerId = game.playerOrder[game.currentPlayerIndex];
      if (activePlayerId !== effectivePlayerId) {
        socket.emit(SERVER_EVENTS.ERROR, {
          code: 'NOT_YOUR_TURN',
          message: `It is not your turn (current turn: ${activePlayerId})`,
        });
        return true;
      }
    }

    // 3. Transform to GameAction and Execute
    const action = handler.toAction(data, effectivePlayerId);
    const start = Date.now();
    const result = roomManager.handleAction(gameId, action, socket);
    const latency = Date.now() - start;

    logger.info(
      {
        gameId,
        playerId: effectivePlayerId,
        actionType: action.type,
        ok: result.success,
        latencyMs: latency,
      },
      `Dispatched ${action.type}`
    );

    return true;
  }
}
