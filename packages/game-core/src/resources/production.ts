import { ResourceType, TERRAIN_TO_RESOURCE } from '@hexara/shared';
import { GameState, ResourceInventory } from '../types/index.js';

export interface ProductionEvent {
  playerId: string;
  resources: Partial<ResourceInventory>;
}

/**
 * Calculates resource production for a given dice roll according to official Catan rules:
 * - Matching hexes produce 1 card per settlement, 2 cards per city
 * - Robber hex produces zero
 * - Shortage Rule:
 *   If bank supply lacks enough cards to satisfy everyone's yield:
 *   - If shortage affects multiple players -> NO ONE receives that resource this turn!
 *   - If shortage affects only 1 player -> that player gets all remaining cards in the bank
 */
export function calculateProduction(
  gameState: GameState,
  diceRoll: number
): ProductionEvent[] {
  if (diceRoll === 7) {
    return []; // Robber roll: no resource production
  }

  const { board, players, resourceSupply } = gameState;
  const rawYields: Record<ResourceType, Record<string, number>> = {
    lumber: {},
    brick: {},
    wool: {},
    grain: {},
    ore: {},
  };

  for (const hex of Object.values(board.hexes)) {
    if (hex.diceNumber === diceRoll && hex.id !== gameState.robberHexId) {
      const resourceType = TERRAIN_TO_RESOURCE[hex.terrain];
      if (!resourceType) continue;

      for (const vId of hex.vertexIds) {
        const vertex = board.vertices[vId];
        if (vertex && vertex.building) {
          const { playerId, type } = vertex.building;
          const count = type === 'city' ? 2 : 1;
          rawYields[resourceType][playerId] = (rawYields[resourceType][playerId] ?? 0) + count;
        }
      }
    }
  }

  const finalPlayerGains: Record<string, Partial<ResourceInventory>> = {};
  for (const pid of Object.keys(players)) {
    finalPlayerGains[pid] = {};
  }

  // Evaluate shortages per resource type
  for (const resType of Object.keys(rawYields) as ResourceType[]) {
    const playerDemands = rawYields[resType];
    const totalDemanded = Object.values(playerDemands).reduce((a, b) => a + b, 0);
    if (totalDemanded === 0) continue;

    const availableInBank = resourceSupply ? resourceSupply[resType] : 999;

    if (totalDemanded <= availableInBank) {
      // Full supply available: everyone gets their demand
      for (const [pid, count] of Object.entries(playerDemands)) {
        finalPlayerGains[pid][resType] = (finalPlayerGains[pid][resType] ?? 0) + count;
      }
    } else {
      // Shortage condition
      const demandingPlayers = Object.keys(playerDemands);
      if (demandingPlayers.length === 1) {
        // Shortage affects only 1 player: give them whatever is left in the bank
        const pid = demandingPlayers[0];
        finalPlayerGains[pid][resType] = (finalPlayerGains[pid][resType] ?? 0) + availableInBank;
      } else {
        // Shortage affects multiple players: nobody gets this resource!
        // (finalPlayerGains remains 0 for this resource)
      }
    }
  }

  return Object.entries(finalPlayerGains)
    .filter(([_, res]) => Object.keys(res).length > 0)
    .map(([playerId, resources]) => ({ playerId, resources }));
}
