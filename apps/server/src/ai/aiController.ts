import {
  canBuildCity,
  canBuildRoad,
  canBuildSettlement,
  canBuyDevCard,
  canMoveRobber,
  DevCardType,
  GameAction,
  GameState,
  ResourceType,
} from '@hexara/game-core';
import { RESOURCE_TYPES } from '@hexara/shared';

export class AiController {
  static computeVertexScore(game: GameState, vertexId: string): number {
    const vertex = game.board.vertices[vertexId];
    if (!vertex) return -1;

    let score = 0;
    const resources = new Set<string>();

    for (const hexId of vertex.hexIds) {
      const hex = game.board.hexes[hexId];
      if (hex && hex.terrain !== 'desert' && hex.terrain !== 'water') {
        score += hex.pips;
        resources.add(hex.terrain);
      }
    }

    // Bonus for resource variety
    score += resources.size * 1.5;

    // Bonus for harbor presence
    if (vertex.harborId) {
      score += 2;
    }

    return score;
  }

  static getNextMove(game: GameState, aiPlayerId: string): GameAction | null {
    const activePlayerId = game.playerOrder[game.currentPlayerIndex];
    const player = game.players[aiPlayerId];
    if (!player) return null;

    // 1. Robber Discard phase
    if (game.phase === 'ROBBER_DISCARD') {
      const neededDiscards = game.pendingDiscards[aiPlayerId] ?? 0;
      if (neededDiscards > 0) {
        const toDiscard: Partial<Record<ResourceType, number>> = {};
        let count = 0;

        const sortedEntries = (Object.entries(player.resources) as [ResourceType, number][])
          .filter(([_, qty]) => qty > 0)
          .sort((a, b) => b[1] - a[1]);

        for (const [res, qty] of sortedEntries) {
          if (count >= neededDiscards) break;
          const take = Math.min(qty, neededDiscards - count);
          toDiscard[res] = (toDiscard[res] ?? 0) + take;
          count += take;
        }

        return {
          type: 'DISCARD_RESOURCES',
          playerId: aiPlayerId,
          resources: toDiscard,
        };
      }
      return null;
    }

    // Only active player acts for other phases
    if (activePlayerId !== aiPlayerId) return null;

    // 2. Setup Phase
    if (game.phase === 'SETUP_ROUND_1' || game.phase === 'SETUP_ROUND_2') {
      const targetSettlementsRemaining = game.phase === 'SETUP_ROUND_1' ? 4 : 3;
      const targetRoadsRemaining = game.phase === 'SETUP_ROUND_1' ? 14 : 13;

      // Settlement placement
      if (player.settlementsRemaining > targetSettlementsRemaining) {
        const validVertices = Object.values(game.board.vertices).filter(
          (v) => canBuildSettlement(game, aiPlayerId, v.id, true).valid
        );

        if (validVertices.length > 0) {
          const bestVertex = validVertices.reduce((best, v) => {
            const score = this.computeVertexScore(game, v.id);
            const bestScore = this.computeVertexScore(game, best.id);
            return score > bestScore ? v : best;
          }, validVertices[0]);

          return {
            type: 'BUILD_SETTLEMENT',
            playerId: aiPlayerId,
            vertexId: bestVertex.id,
          };
        }
      }

      // Road placement (must attach to newly placed settlement without a road)
      if (player.roadsRemaining > targetRoadsRemaining) {
        const myVertices = Object.values(game.board.vertices).filter(
          (v) => v.building?.playerId === aiPlayerId
        );

        const unattachedVertex = myVertices.find((v) =>
          v.adjacentEdgeIds.every((eId) => game.board.edges[eId]?.road === null)
        );

        const anchor = unattachedVertex || myVertices[myVertices.length - 1];
        if (anchor) {
          const validEdge = anchor.adjacentEdgeIds.find(
            (eId) => canBuildRoad(game, aiPlayerId, eId, true, anchor.id).valid
          );
          if (validEdge) {
            return {
              type: 'BUILD_ROAD',
              playerId: aiPlayerId,
              edgeId: validEdge,
            };
          }
        }
      }

      // End setup turn
      return { type: 'END_TURN', playerId: aiPlayerId };
    }

    // 3. Rolling Phase
    if (game.phase === 'ROLLING') {
      return { type: 'ROLL_DICE', playerId: aiPlayerId };
    }

    // 4. Robber Move Phase
    if (game.phase === 'ROBBER_MOVE') {
      const validHexes = Object.values(game.board.hexes).filter(
        (h) => canMoveRobber(game, aiPlayerId, h.id).valid && h.terrain !== 'desert' && h.terrain !== 'water'
      );

      if (validHexes.length > 0) {
        const bestHex = validHexes.reduce((best, hex) => {
          let score = 0;
          for (const vId of hex.vertexIds) {
            const building = game.board.vertices[vId]?.building;
            if (building) {
              const weight = building.type === 'city' ? 2 : 1;
              if (building.playerId === aiPlayerId) {
                score -= hex.pips * weight * 1.5;
              } else {
                score += hex.pips * weight;
              }
            }
          }

          let bestScore = 0;
          for (const vId of best.vertexIds) {
            const building = game.board.vertices[vId]?.building;
            if (building) {
              const weight = building.type === 'city' ? 2 : 1;
              if (building.playerId === aiPlayerId) {
                bestScore -= best.pips * weight * 1.5;
              } else {
                bestScore += best.pips * weight;
              }
            }
          }

          return score > bestScore ? hex : best;
        }, validHexes[0]);

        return {
          type: 'MOVE_ROBBER',
          playerId: aiPlayerId,
          hexId: bestHex.id,
        };
      }

      // Fallback
      const fallbackHex = Object.values(game.board.hexes).find(
        (h) => canMoveRobber(game, aiPlayerId, h.id).valid
      );
      if (fallbackHex) {
        return {
          type: 'MOVE_ROBBER',
          playerId: aiPlayerId,
          hexId: fallbackHex.id,
        };
      }
    }

    // 5. Robber Steal Phase
    if (game.phase === 'ROBBER_STEAL') {
      if (game.robberEligibleVictimIds.length > 0) {
        const victimId = game.robberEligibleVictimIds.reduce((richest, currentId) => {
          const currentTotal = Object.values(game.players[currentId]?.resources ?? {}).reduce(
            (s, q) => s + q,
            0
          );
          const richestTotal = Object.values(game.players[richest]?.resources ?? {}).reduce(
            (s, q) => s + q,
            0
          );
          return currentTotal > richestTotal ? currentId : richest;
        }, game.robberEligibleVictimIds[0]);

        return {
          type: 'STEAL_RESOURCE',
          playerId: aiPlayerId,
          victimId,
        };
      }
    }

    // 6. Main Action Phase
    if (game.phase === 'MAIN') {
      const res = player.resources;

      // Play Knight card if owned and robber is blocking friendly hex
      const hasKnight = player.devCards.includes('knight');
      if (hasKnight) {
        const currentRobber = game.robberHexId || game.board.robberHexId;
        const myBlockedHex = Object.values(game.board.hexes).find((h) => {
          if (h.id !== currentRobber) return false;
          return h.vertexIds.some((vId) => game.board.vertices[vId]?.building?.playerId === aiPlayerId);
        });

        if (myBlockedHex) {
          const targetHex = Object.values(game.board.hexes).find(
            (h) => canMoveRobber(game, aiPlayerId, h.id).valid && h.terrain !== 'desert' && h.terrain !== 'water'
          );
          if (targetHex) {
            return {
              type: 'PLAY_DEV_CARD',
              playerId: aiPlayerId,
              card: 'knight',
              params: { targetHexId: targetHex.id },
            };
          }
        }
      }

      // Priority 1: Upgrade Settlement to City
      const validCityVertex = Object.values(game.board.vertices).find(
        (v) => canBuildCity(game, aiPlayerId, v.id).valid
      );
      if (validCityVertex) {
        return {
          type: 'BUILD_CITY',
          playerId: aiPlayerId,
          vertexId: validCityVertex.id,
        };
      }

      // Priority 2: Build Settlement
      const validSettlementVertices = Object.values(game.board.vertices).filter(
        (v) => canBuildSettlement(game, aiPlayerId, v.id, false).valid
      );
      if (validSettlementVertices.length > 0) {
        const bestVertex = validSettlementVertices.reduce((best, v) => {
          const score = this.computeVertexScore(game, v.id);
          const bestScore = this.computeVertexScore(game, best.id);
          return score > bestScore ? v : best;
        }, validSettlementVertices[0]);

        return {
          type: 'BUILD_SETTLEMENT',
          playerId: aiPlayerId,
          vertexId: bestVertex.id,
        };
      }

      // Priority 3: Buy Development Card
      if (canBuyDevCard(game, aiPlayerId).valid) {
        return {
          type: 'BUY_DEV_CARD',
          playerId: aiPlayerId,
        };
      }

      // Priority 4: Build Road
      const validRoadEdge = Object.values(game.board.edges).find(
        (e) => canBuildRoad(game, aiPlayerId, e.id, false).valid
      );
      if (validRoadEdge) {
        return {
          type: 'BUILD_ROAD',
          playerId: aiPlayerId,
          edgeId: validRoadEdge.id,
        };
      }

      // Priority 5: Bank Trade (4:1) if holding excess of a resource
      for (const [giveRes, qty] of Object.entries(res) as [ResourceType, number][]) {
        if (qty >= 4) {
          const missingRes = RESOURCE_TYPES.find((r) => res[r] === 0);
          if (missingRes) {
            return {
              type: 'TRADE_BANK',
              playerId: aiPlayerId,
              giving: giveRes,
              receiving: missingRes,
            };
          }
        }
      }

      // Priority 6: End Turn
      return { type: 'END_TURN', playerId: aiPlayerId };
    }

    return null;
  }
}
