import { z } from 'zod';
import { DEV_CARD_TYPES, RESOURCE_TYPES } from '@hexara/shared';

export const resourceTypeSchema = z.enum(RESOURCE_TYPES);
export const devCardTypeSchema = z.enum(DEV_CARD_TYPES);

export const resourceInventoryPartialSchema = z.object({
  lumber: z.number().int().min(0).optional(),
  brick: z.number().int().min(0).optional(),
  wool: z.number().int().min(0).optional(),
  grain: z.number().int().min(0).optional(),
  ore: z.number().int().min(0).optional(),
});

// Lobby Schemas
export const createGameSchema = z.object({
  code: z.string().optional(),
  roomCode: z.string().optional(),
  scenarioId: z.string().min(1).default('first_island'),
  scenarioName: z.string().optional(),
  seed: z.number().optional(),
  targetVictoryPoints: z.number().int().min(3).max(20).default(10),
  maxPlayers: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4),
  mode: z.enum(['solo', 'online']).default('online'),
  turnDurationSeconds: z.number().int().min(10).max(600).default(60),
});
export type CreateGamePayload = z.infer<typeof createGameSchema>;

export const joinGameSchema = z.object({
  code: z.string().min(1).max(24).optional(),
  gameId: z.string().min(1).optional(),
  playerId: z.string().min(1).optional(),
  username: z.string().min(1).max(24).optional(),
}).refine((data) => data.code !== undefined || data.gameId !== undefined, {
  message: 'Must provide either room code or gameId',
});
export type JoinGamePayload = z.infer<typeof joinGameSchema>;

export const leaveGameSchema = z.object({
  code: z.string().optional(),
  gameId: z.string().optional(),
});
export type LeaveGamePayload = z.infer<typeof leaveGameSchema>;

export const setReadySchema = z.object({
  ready: z.boolean(),
  code: z.string().optional(),
  gameId: z.string().optional(),
});
export type SetReadyPayload = z.infer<typeof setReadySchema>;

export const setColorSchema = z.object({
  color: z.string().min(1),
  code: z.string().optional(),
  gameId: z.string().optional(),
});
export type SetColorPayload = z.infer<typeof setColorSchema>;

export const addAiSchema = z.object({
  code: z.string().optional(),
  gameId: z.string().optional(),
});
export type AddAiPayload = z.infer<typeof addAiSchema>;

export const kickSeatSchema = z.object({
  seatPlayerId: z.string().min(1),
  code: z.string().optional(),
  gameId: z.string().optional(),
});
export type KickSeatPayload = z.infer<typeof kickSeatSchema>;

export const startGameSchema = z.object({
  code: z.string().optional(),
  gameId: z.string().optional(),
});
export type StartGamePayload = z.infer<typeof startGameSchema>;

// Game Action Schemas
export const rollDiceSchema = z.object({
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type RollDicePayload = z.infer<typeof rollDiceSchema>;

export const buildRoadSchema = z.object({
  edgeId: z.string().min(1),
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type BuildRoadPayload = z.infer<typeof buildRoadSchema>;

export const buildSettlementSchema = z.object({
  vertexId: z.string().min(1),
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type BuildSettlementPayload = z.infer<typeof buildSettlementSchema>;

export const buildCitySchema = z.object({
  vertexId: z.string().min(1),
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type BuildCityPayload = z.infer<typeof buildCitySchema>;

export const moveRobberSchema = z.object({
  hexId: z.string().min(1),
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type MoveRobberPayload = z.infer<typeof moveRobberSchema>;

export const discardResourcesSchema = z.object({
  resources: resourceInventoryPartialSchema,
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type DiscardResourcesPayload = z.infer<typeof discardResourcesSchema>;

export const stealResourceSchema = z.object({
  victimId: z.string().min(1),
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type StealResourcePayload = z.infer<typeof stealResourceSchema>;

export const buyDevCardSchema = z.object({
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type BuyDevCardPayload = z.infer<typeof buyDevCardSchema>;

export const playDevCardSchema = z.object({
  card: devCardTypeSchema,
  params: z
    .object({
      targetHexId: z.string().optional(),
      victimId: z.string().optional(),
      monopolyResource: resourceTypeSchema.optional(),
      yearOfPlentyResources: z.tuple([resourceTypeSchema, resourceTypeSchema]).optional(),
      roadBuildingEdges: z.tuple([z.string(), z.string()]).optional(),
    })
    .optional(),
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type PlayDevCardPayload = z.infer<typeof playDevCardSchema>;

export const tradeBankSchema = z.object({
  giving: resourceTypeSchema,
  receiving: resourceTypeSchema,
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type TradeBankPayload = z.infer<typeof tradeBankSchema>;

export const tradeMaritimeSchema = z.object({
  giving: resourceTypeSchema,
  receiving: resourceTypeSchema,
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type TradeMaritimePayload = z.infer<typeof tradeMaritimeSchema>;

export const tradeProposeSchema = z.object({
  offer: resourceInventoryPartialSchema,
  request: resourceInventoryPartialSchema,
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type TradeProposePayload = z.infer<typeof tradeProposeSchema>;

export const tradeAcceptSchema = z.object({
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type TradeAcceptPayload = z.infer<typeof tradeAcceptSchema>;

export const tradeCancelSchema = z.object({
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type TradeCancelPayload = z.infer<typeof tradeCancelSchema>;

export const endTurnSchema = z.object({
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type EndTurnPayload = z.infer<typeof endTurnSchema>;

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(200),
  gameId: z.string().optional(),
  playerId: z.string().optional(),
});
export type ChatMessagePayload = z.infer<typeof chatMessageSchema>;
