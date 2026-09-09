import { BUILDING_COSTS, DevCardType, ResourceType } from '@hexara/shared';
import { GameState } from '../types/index.js';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Checks if player has the required resources in their hand
 */
export function hasRequiredResources(
  inventory: Record<ResourceType, number>,
  cost: Partial<Record<ResourceType, number>>
): boolean {
  for (const [res, count] of Object.entries(cost)) {
    if ((inventory[res as ResourceType] ?? 0) < (count ?? 0)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks whether an intersection satisfies the Distance Rule
 */
export function satisfiesDistanceRule(
  boardOrVertex: any,
  vertexIdOrVertices?: any
): boolean {
  if (typeof vertexIdOrVertices === 'string') {
    const vertex = boardOrVertex.vertices
      ? boardOrVertex.vertices[vertexIdOrVertices]
      : boardOrVertex[vertexIdOrVertices];
    if (!vertex || vertex.building !== null) return false;
    const allVertices = boardOrVertex.vertices || boardOrVertex;
    for (const neighborId of vertex.adjacentVertexIds) {
      if (allVertices[neighborId]?.building !== null) return false;
    }
    return true;
  } else {
    const vertex = boardOrVertex;
    const allVertices = vertexIdOrVertices || {};
    if (!vertex || vertex.building !== null) return false;
    for (const neighborId of vertex.adjacentVertexIds) {
      if (allVertices[neighborId]?.building !== null) return false;
    }
    return true;
  }
}

/**
 * Validates settlement placement according to:
 * - RULE A: Intersection must be empty
 * - RULE B: Distance Rule (all adjacent intersections must be completely vacant)
 * - RULE C: Road connection during normal play (at least one adjacent road owned by player)
 * - Inventory & piece supply constraints
 */
export function canBuildSettlement(
  state: GameState,
  playerId: string,
  vertexId: string,
  isSetupPhase = false
): ValidationResult {
  const player = state.players[playerId];
  if (!player) return { valid: false, reason: 'Player does not exist' };

  if (player.settlementsRemaining <= 0) {
    return { valid: false, reason: 'Maximum of 5 settlements already built' };
  }

  if (!isSetupPhase && !hasRequiredResources(player.resources, BUILDING_COSTS.settlement)) {
    return { valid: false, reason: 'Insufficient resources for settlement (need 1 lumber, 1 brick, 1 wool, 1 grain)' };
  }

  const vertex = state.board.vertices[vertexId];
  if (!vertex) return { valid: false, reason: 'Intersection does not exist' };

  if (vertex.building !== null) {
    return { valid: false, reason: 'Intersection already contains a building' };
  }

  // Distance Rule: All neighboring intersections must have NO settlement or city
  for (const neighborId of vertex.adjacentVertexIds) {
    const neighbor = state.board.vertices[neighborId];
    if (neighbor && neighbor.building !== null) {
      return {
        valid: false,
        reason: 'Distance Rule violated: adjacent intersection has a building (DISTANCE_RULE_VIOLATED)',
      };
    }
  }

  // Normal play requires road connection
  if (!isSetupPhase) {
    let connectedToOwnRoad = false;
    for (const edgeId of vertex.adjacentEdgeIds) {
      const edge = state.board.edges[edgeId];
      if (edge && edge.road && edge.road.playerId === playerId) {
        connectedToOwnRoad = true;
        break;
      }
    }

    if (!connectedToOwnRoad) {
      return { valid: false, reason: 'Settlement must connect to at least one of your own roads' };
    }
  }

  return { valid: true };
}

/**
 * Validates city upgrade:
 * - Must upgrade player's own settlement on the same intersection
 * - Costs 3 ore + 2 grain
 * - Player must have city pieces remaining (max 4)
 */
export function canBuildCity(
  state: GameState,
  playerId: string,
  vertexId: string
): ValidationResult {
  const player = state.players[playerId];
  if (!player) return { valid: false, reason: 'Player does not exist' };

  if (player.citiesRemaining <= 0) {
    return { valid: false, reason: 'Maximum of 4 cities already built' };
  }

  if (!hasRequiredResources(player.resources, BUILDING_COSTS.city)) {
    return { valid: false, reason: 'Insufficient resources for city (need 3 ore, 2 grain)' };
  }

  const vertex = state.board.vertices[vertexId];
  if (!vertex) return { valid: false, reason: 'Intersection does not exist' };

  if (!vertex.building) {
    return { valid: false, reason: 'Cannot build city on empty intersection; must upgrade a settlement' };
  }

  if (vertex.building.playerId !== playerId) {
    return { valid: false, reason: 'Cannot upgrade opponent settlement' };
  }

  if (vertex.building.type === 'city') {
    return { valid: false, reason: 'Already upgraded to a city' };
  }

  return { valid: true };
}

/**
 * Validates road placement:
 * - Only 1 road per path
 * - During setup: Must attach to the settlement just placed
 * - During normal play: Must connect to player's road, settlement, or city
 * - Road Blocking Rule: Network cannot pass THROUGH an intersection with an opponent building
 * - Costs 1 lumber + 1 brick
 * - Max 15 roads
 */
export function canBuildRoad(
  state: GameState,
  playerId: string,
  edgeId: string,
  isSetupPhase = false,
  anchorVertexId?: string
): ValidationResult {
  const player = state.players[playerId];
  if (!player) return { valid: false, reason: 'Player does not exist' };

  if (player.roadsRemaining <= 0) {
    return { valid: false, reason: 'Maximum of 15 roads already built' };
  }

  if (!isSetupPhase && !hasRequiredResources(player.resources, BUILDING_COSTS.road)) {
    return { valid: false, reason: 'Insufficient resources for road (need 1 lumber, 1 brick)' };
  }

  const edge = state.board.edges[edgeId];
  if (!edge) return { valid: false, reason: 'Path does not exist' };

  if (edge.road !== null) {
    return { valid: false, reason: 'Path already occupied by a road' };
  }

  // Setup phase validation: road must attach to anchor settlement
  if (isSetupPhase) {
    if (!anchorVertexId) {
      return { valid: false, reason: 'Anchor settlement required during setup road placement' };
    }
    if (!edge.vertexIds.includes(anchorVertexId)) {
      return { valid: false, reason: 'Setup road must attach to the newly built settlement' };
    }
    return { valid: true };
  }

  // Normal gameplay network connection check
  const [v1Id, v2Id] = edge.vertexIds;
  const v1 = state.board.vertices[v1Id];
  const v2 = state.board.vertices[v2Id];

  let hasValidConnection = false;

  // Check endpoint 1
  if (v1) {
    if (v1.building && v1.building.playerId === playerId) {
      hasValidConnection = true;
    } else if (!v1.building || v1.building.playerId === playerId) {
      // Not blocked by opponent: check adjacent roads touching v1
      for (const adjEdgeId of v1.adjacentEdgeIds) {
        if (adjEdgeId !== edgeId) {
          const adjEdge = state.board.edges[adjEdgeId];
          if (adjEdge && adjEdge.road && adjEdge.road.playerId === playerId) {
            hasValidConnection = true;
            break;
          }
        }
      }
    }
  }

  // Check endpoint 2
  if (!hasValidConnection && v2) {
    if (v2.building && v2.building.playerId === playerId) {
      hasValidConnection = true;
    } else if (!v2.building || v2.building.playerId === playerId) {
      // Not blocked by opponent: check adjacent roads touching v2
      for (const adjEdgeId of v2.adjacentEdgeIds) {
        if (adjEdgeId !== edgeId) {
          const adjEdge = state.board.edges[adjEdgeId];
          if (adjEdge && adjEdge.road && adjEdge.road.playerId === playerId) {
            hasValidConnection = true;
            break;
          }
        }
      }
    }
  }

  if (!hasValidConnection) {
    return {
      valid: false,
      reason: 'Road must connect to your existing road, settlement, or city (without opponent blocking)',
    };
  }

  return { valid: true };
}

/**
 * Validates development card purchase:
 * - Finite 25-card deck must have cards remaining
 * - Costs 1 ore, 1 wool, 1 grain
 */
export function canBuyDevCard(state: GameState, playerId: string): ValidationResult {
  const player = state.players[playerId];
  if (!player) return { valid: false, reason: 'Player does not exist' };

  if (state.developmentDeck.length <= 0) {
    return { valid: false, reason: 'Development card deck is empty' };
  }

  if (!hasRequiredResources(player.resources, BUILDING_COSTS.dev_card)) {
    return { valid: false, reason: 'Insufficient resources (need 1 ore, 1 wool, 1 grain)' };
  }

  return { valid: true };
}

/**
 * Validates moving the robber:
 * - Cannot stay on the same hex
 * - Must be a valid terrain hex in board
 */
export function canMoveRobber(
  state: GameState,
  playerId: string,
  targetHexId: string
): ValidationResult {
  if (!state.board.hexes[targetHexId]) {
    return { valid: false, reason: 'Target hex does not exist' };
  }

  if (targetHexId === state.robberHexId) {
    return { valid: false, reason: 'Robber cannot remain on the same terrain hex' };
  }

  return { valid: true };
}

/**
 * Determines maritime trade rate for a player:
 * - 2:1 if player has building on depicted resource harbor
 * - 3:1 if player has building on generic 3:1 harbor
 * - 4:1 default bank trade
 */
export function getMaritimeTradeRate(
  state: GameState,
  playerId: string,
  giving: ResourceType
): number {
  let rate = 4; // Default bank exchange

  // Scan all harbors on the board
  for (const harbor of Object.values(state.board.harbors)) {
    // Check if player has a building on any of the harbor's coastal intersections
    const controlsHarbor = harbor.adjacentIntersectionIds.some((vId) => {
      const v = state.board.vertices[vId];
      return v && v.building && v.building.playerId === playerId;
    });

    if (controlsHarbor) {
      if (harbor.type === 'RESOURCE_2_TO_1' && harbor.resourceType === giving) {
        return 2; // Specific 2:1 rate
      }
      if (harbor.type === 'GENERIC_3_TO_1') {
        rate = Math.min(rate, 3);
      }
    }
  }

  return rate;
}

/**
 * Validates maritime trade
 */
export function canMaritimeTrade(
  state: GameState,
  playerId: string,
  giving: ResourceType,
  receiving: ResourceType
): ValidationResult & { rate: number } {
  if (giving === receiving) {
    return { valid: false, reason: 'Cannot trade resource for itself', rate: 4 };
  }

  const player = state.players[playerId];
  if (!player) return { valid: false, reason: 'Player does not exist', rate: 4 };

  const rate = getMaritimeTradeRate(state, playerId, giving);

  if ((player.resources[giving] ?? 0) < rate) {
    return {
      valid: false,
      reason: `Insufficient ${giving}: need ${rate} units to trade for 1 ${receiving}`,
      rate,
    };
  }

  if ((state.resourceSupply[receiving] ?? 0) <= 0) {
    return {
      valid: false,
      reason: `Bank supply is out of ${receiving}`,
      rate,
    };
  }

  return { valid: true, rate };
}

/**
 * Returns all valid intersection IDs where player can legally build a settlement
 */
export function getLegalSettlements(
  state: GameState,
  playerId: string,
  isSetupPhase = false
): string[] {
  const result: string[] = [];
  for (const vertexId of Object.keys(state.board.vertices)) {
    if (canBuildSettlement(state, playerId, vertexId, isSetupPhase).valid) {
      result.push(vertexId);
    }
  }
  return result;
}

/**
 * Returns all valid intersection IDs where player can legally upgrade to a city
 */
export function getLegalCities(state: GameState, playerId: string): string[] {
  const result: string[] = [];
  for (const vertexId of Object.keys(state.board.vertices)) {
    if (canBuildCity(state, playerId, vertexId).valid) {
      result.push(vertexId);
    }
  }
  return result;
}

/**
 * Returns all valid path IDs where player can legally build a road
 */
export function getLegalRoads(
  state: GameState,
  playerId: string,
  isSetupPhase = false,
  anchorVertexId?: string
): string[] {
  const result: string[] = [];
  for (const edgeId of Object.keys(state.board.edges)) {
    if (canBuildRoad(state, playerId, edgeId, isSetupPhase, anchorVertexId).valid) {
      result.push(edgeId);
    }
  }
  return result;
}

/**
 * Finds all opponent player IDs with a settlement or city adjacent to target hex
 */
export function getRobberVictims(
  state: GameState,
  targetHexId: string,
  robberPlayerId: string
): string[] {
  const hex = state.board.hexes[targetHexId];
  if (!hex) return [];

  const victims = new Set<string>();

  for (const vId of hex.vertexIds) {
    const v = state.board.vertices[vId];
    if (v && v.building && v.building.playerId !== robberPlayerId) {
      // Check if opponent has at least 1 resource card to steal
      const opp = state.players[v.building.playerId];
      if (opp) {
        const totalCards = Object.values(opp.resources).reduce((a, b) => a + b, 0);
        if (totalCards > 0) {
          victims.add(v.building.playerId);
        }
      }
    }
  }

  return Array.from(victims);
}
