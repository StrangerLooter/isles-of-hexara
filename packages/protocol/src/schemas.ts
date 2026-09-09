import { z } from 'zod';
import { RESOURCE_TYPES } from '@hexara/shared';

export const resourceTypeSchema = z.enum(RESOURCE_TYPES);

export const joinGameSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  username: z.string().min(1).max(24),
});
export type JoinGamePayload = z.infer<typeof joinGameSchema>;

export const rollDiceSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
});
export type RollDicePayload = z.infer<typeof rollDiceSchema>;

export const buildRoadSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  edgeId: z.string().min(1),
});
export type BuildRoadPayload = z.infer<typeof buildRoadSchema>;

export const buildSettlementSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  vertexId: z.string().min(1),
});
export type BuildSettlementPayload = z.infer<typeof buildSettlementSchema>;

export const buildCitySchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  vertexId: z.string().min(1),
});
export type BuildCityPayload = z.infer<typeof buildCitySchema>;

export const moveRobberSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  hexId: z.string().min(1),
});
export type MoveRobberPayload = z.infer<typeof moveRobberSchema>;

export const tradeBankSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  giving: resourceTypeSchema,
  receiving: resourceTypeSchema,
});
export type TradeBankPayload = z.infer<typeof tradeBankSchema>;

export const endTurnSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
});
export type EndTurnPayload = z.infer<typeof endTurnSchema>;

export const chatMessageSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  message: z.string().min(1).max(200),
});
export type ChatMessagePayload = z.infer<typeof chatMessageSchema>;
