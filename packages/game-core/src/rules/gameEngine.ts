import {
  BANK_CARDS_PER_RESOURCE,
  BUILDING_COSTS,
  DEV_CARD_DECK_COUNTS,
  INITIAL_PIECE_LIMITS,
  PLAYER_COLORS,
  ResourceType,
  RESOURCE_TYPES,
  TERRAIN_TO_RESOURCE,
  VICTORY_POINTS_TARGET,
} from '@hexara/shared';
import { generateBoardTopology } from '../board/topology.js';
import { roll2d6 } from '../dice/dice.js';
import { calculateProduction } from '../resources/production.js';
import {
  BoardEdge,
  BoardVertex,
  DevCardType,
  GameAction,
  GameState,
  PlayerState,
  ResourceInventory,
} from '../types/index.js';
import { evaluateLongestRoad } from '../victory/longestRoadGraph.js';
import {
  canBuildCity,
  canBuildRoad,
  canBuildSettlement,
  canBuyDevCard,
  canMaritimeTrade,
  canMoveRobber,
  getRobberVictims,
} from './validation.js';

/**
 * Creates the initial 25-card development deck and shuffles it
 */
function createShuffledDevDeck(seed = 123): DevCardType[] {
  const deck: DevCardType[] = [];
  for (const [cardType, count] of Object.entries(DEV_CARD_DECK_COUNTS)) {
    for (let i = 0; i < count; i++) {
      deck.push(cardType as DevCardType);
    }
  }

  // Deterministic shuffle
  let s = seed;
  const rng = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function createInitialGameState(
  gameId: string,
  playersConfig: { id: string; username: string; isAi?: boolean }[],
  customSeed?: number,
  options?: { targetVictoryPoints?: number; scenarioId?: string; scenarioName?: string }
): GameState {
  const board = generateBoardTopology(customSeed);
  const playerOrder = playersConfig.map((p) => p.id);
  const players: Record<string, PlayerState> = {};

  const emptyInventory: ResourceInventory = {
    lumber: 0,
    brick: 0,
    wool: 0,
    grain: 0,
    ore: 0,
  };

  playersConfig.forEach((p, idx) => {
    players[p.id] = {
      id: p.id,
      username: p.username,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      victoryPoints: 0,
      resources: { ...emptyInventory },
      roadsRemaining: INITIAL_PIECE_LIMITS.roads,
      settlementsRemaining: INITIAL_PIECE_LIMITS.settlements,
      citiesRemaining: INITIAL_PIECE_LIMITS.cities,
      devCards: [],
      boughtDevCardsThisTurn: [],
      hasPlayedDevCardThisTurn: false,
      playedKnights: 0,
      longestRoad: false,
      largestArmy: false,
      controlledHarbors: [],
      isReady: true,
      isConnected: true,
      isAi: p.isAi ?? false,
    };
  });

  // Finite bank supply: 19 cards of each resource type
  const resourceSupply: ResourceInventory = {
    lumber: BANK_CARDS_PER_RESOURCE,
    brick: BANK_CARDS_PER_RESOURCE,
    wool: BANK_CARDS_PER_RESOURCE,
    grain: BANK_CARDS_PER_RESOURCE,
    ore: BANK_CARDS_PER_RESOURCE,
  };

  const developmentDeck = createShuffledDevDeck(customSeed ?? 999);

  return {
    id: gameId,
    version: 1,
    phase: 'SETUP_ROUND_1',
    turnNumber: 1,
    currentPlayerIndex: 0,
    playerOrder,
    players,
    board,
    dice: { dice1: 0, dice2: 0, total: 0, rolled: false },
    robberHexId: board.robberHexId,
    resourceSupply,
    developmentDeck,
    playedDevelopmentCards: [],
    longestRoadOwnerId: null,
    largestArmyOwnerId: null,
    longestRoadLength: 0,
    pendingDiscards: {},
    robberEligibleVictimIds: [],
    activeTrade: null,
    winnerId: null,
    targetVictoryPoints: options?.targetVictoryPoints ?? VICTORY_POINTS_TARGET,
    scenarioId: options?.scenarioId ?? 'first_island',
    logs: ['Game initialized. Setup Round 1 begins.'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Recalculates victory points for all players
 */
export function recalculateAllVictoryPoints(state: GameState): void {
  for (const [pid, player] of Object.entries(state.players)) {
    let vp = 0;

    // 1 VP per settlement, 2 VP per city on the board
    for (const v of Object.values(state.board.vertices)) {
      if (v.building && v.building.playerId === pid) {
        vp += v.building.type === 'city' ? 2 : 1;
      }
    }

    // 2 VP for Longest Road
    if (state.longestRoadOwnerId === pid) {
      vp += 2;
      player.longestRoad = true;
    } else {
      player.longestRoad = false;
    }

    // 2 VP for Largest Army
    if (state.largestArmyOwnerId === pid) {
      vp += 2;
      player.largestArmy = true;
    } else {
      player.largestArmy = false;
    }

    // 1 VP per victory point development card
    const vpCardCount = player.devCards.filter((c) => c === 'victory_point').length;
    vp += vpCardCount;

    player.victoryPoints = vp;
  }
}

/**
 * Checks and updates Largest Army status (minimum 3 played knights; must strictly exceed)
 */
function updateLargestArmy(state: GameState): void {
  let maxKnights = 2; // threshold is 3, so max must be > 2
  let leaderId: string | null = state.largestArmyOwnerId;

  if (leaderId) {
    maxKnights = state.players[leaderId]?.playedKnights || 2;
  }

  for (const [pid, player] of Object.entries(state.players)) {
    if (pid !== leaderId && player.playedKnights > maxKnights) {
      leaderId = pid;
      maxKnights = player.playedKnights;
    }
  }

  state.largestArmyOwnerId = leaderId;
}

/**
 * Checks if the active player has met or exceeded the victory condition on their turn
 */
export function applyVictoryCheck(state: GameState): boolean {
  if (state.phase === 'FINISHED') return true;
  const activePlayerId = state.playerOrder[state.currentPlayerIndex];
  const activePlayer = state.players[activePlayerId];
  if (!activePlayer) return false;

  const requiredVp = state.targetVictoryPoints ?? VICTORY_POINTS_TARGET;
  if (activePlayer.victoryPoints >= requiredVp) {
    state.winnerId = activePlayerId;
    state.phase = 'FINISHED';
    state.logs.push(
      `🎉 VICTORY! ${activePlayer.username} has reached ${activePlayer.victoryPoints} Victory Points and won the match!`
    );
    return true;
  }
  return false;
}

export function executeGameAction(
  state: GameState,
  action: GameAction
): { success: boolean; newState: GameState; error?: string } {
  if (state.phase === 'FINISHED') {
    return { success: false, newState: state, error: 'Game has already finished' };
  }

  const next = JSON.parse(JSON.stringify(state)) as GameState;
  next.version += 1;
  next.updatedAt = Date.now();

  const activePlayerId = next.playerOrder[next.currentPlayerIndex];
  const activePlayer = next.players[activePlayerId];

  switch (action.type) {
    case 'ROLL_DICE': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to roll' };
      }
      if (next.phase !== 'ROLLING') {
        return { success: false, newState: state, error: 'Cannot roll dice in current phase' };
      }

      const diceResult = roll2d6();
      next.dice = {
        dice1: diceResult.dice1,
        dice2: diceResult.dice2,
        total: diceResult.total,
        rolled: true,
      };

      next.logs.push(`${activePlayer.username} rolled ${diceResult.total} [${diceResult.dice1} + ${diceResult.dice2}].`);

      if (diceResult.total === 7) {
        next.returnPhaseAfterRobber = 'MAIN';
        // Robber activated: check for hand limits (>7 cards)
        const discardsNeeded: Record<string, number> = {};
        for (const [pid, p] of Object.entries(next.players)) {
          const totalCards = Object.values(p.resources).reduce((a, b) => a + b, 0);
          if (totalCards > 7) {
            discardsNeeded[pid] = Math.floor(totalCards / 2);
            next.logs.push(`${p.username} holds ${totalCards} cards and must discard ${discardsNeeded[pid]}.`);
          }
        }

        next.pendingDiscards = discardsNeeded;

        if (Object.keys(discardsNeeded).length > 0) {
          next.phase = 'ROBBER_DISCARD';
        } else {
          next.phase = 'ROBBER_MOVE';
        }
      } else {
        // Harvest resources
        const productionEvents = calculateProduction(next, diceResult.total);

        for (const ev of productionEvents) {
          const p = next.players[ev.playerId];
          if (!p) continue;
          for (const [res, count] of Object.entries(ev.resources) as [ResourceType, number][]) {
            p.resources[res] = (p.resources[res] ?? 0) + count;
            if (next.resourceSupply) {
              next.resourceSupply[res] = Math.max(0, (next.resourceSupply[res] ?? 0) - count);
            }
          }
        }

        next.phase = 'MAIN';
      }

      return { success: true, newState: next };
    }

    case 'DISCARD_RESOURCES': {
      const needed = next.pendingDiscards[action.playerId];
      if (needed === undefined) {
        return { success: false, newState: state, error: 'You do not need to discard' };
      }

      const player = next.players[action.playerId];
      const totalDiscarding = Object.values(action.resources).reduce((a, b) => (a ?? 0) + (b ?? 0), 0);

      if (totalDiscarding !== needed) {
        return { success: false, newState: state, error: `Must discard exactly ${needed} resource cards` };
      }

      for (const [res, count] of Object.entries(action.resources) as [ResourceType, number][]) {
        if ((player.resources[res] ?? 0) < count) {
          return { success: false, newState: state, error: `Not enough ${res} to discard` };
        }
        player.resources[res] -= count;
        if (next.resourceSupply) {
          next.resourceSupply[res] = (next.resourceSupply[res] ?? 0) + count;
        }
      }

      delete next.pendingDiscards[action.playerId];
      next.logs.push(`${player.username} discarded ${needed} cards.`);

      // If all discards complete, move to robber movement
      if (Object.keys(next.pendingDiscards).length === 0) {
        next.phase = 'ROBBER_MOVE';
      }

      return { success: true, newState: next };
    }

    case 'MOVE_ROBBER': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to move robber' };
      }
      if (next.phase !== 'ROBBER_MOVE') {
        return { success: false, newState: state, error: 'Cannot move robber now' };
      }

      const val = canMoveRobber(next, action.playerId, action.hexId);
      if (!val.valid) {
        return { success: false, newState: state, error: val.reason };
      }

      next.robberHexId = action.hexId;
      next.logs.push(`${activePlayer.username} moved the robber to hex ${action.hexId}.`);

      // Determine eligible victims
      const victims = getRobberVictims(next, action.hexId, action.playerId);
      const targetPhase = next.returnPhaseAfterRobber || 'MAIN';

      if (victims.length === 0) {
        next.phase = targetPhase;
        next.returnPhaseAfterRobber = undefined;
      } else if (victims.length === 1) {
        // Automatic single victim theft
        const victim = next.players[victims[0]];
        const availableTypes: ResourceType[] = [];
        for (const [r, c] of Object.entries(victim.resources) as [ResourceType, number][]) {
          for (let i = 0; i < c; i++) availableTypes.push(r);
        }

        if (availableTypes.length > 0) {
          const stolen = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          victim.resources[stolen] -= 1;
          activePlayer.resources[stolen] += 1;
          next.logs.push(`${activePlayer.username} stole 1 card from ${victim.username}.`);
        }
        next.phase = targetPhase;
        next.returnPhaseAfterRobber = undefined;
      } else {
        next.robberEligibleVictimIds = victims;
        next.phase = 'ROBBER_STEAL';
      }

      return { success: true, newState: next };
    }

    case 'STEAL_RESOURCE': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to steal' };
      }
      if (next.phase !== 'ROBBER_STEAL') {
        return { success: false, newState: state, error: 'Not in robber steal phase' };
      }

      if (!next.robberEligibleVictimIds.includes(action.victimId)) {
        return { success: false, newState: state, error: 'Chosen player is not an eligible victim' };
      }

      const victim = next.players[action.victimId];
      const availableTypes: ResourceType[] = [];
      for (const [r, c] of Object.entries(victim.resources) as [ResourceType, number][]) {
        for (let i = 0; i < c; i++) availableTypes.push(r);
      }

      if (availableTypes.length > 0) {
        const stolen = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        victim.resources[stolen] -= 1;
        activePlayer.resources[stolen] += 1;
        next.logs.push(`${activePlayer.username} stole 1 card from ${victim.username}.`);
      }

      next.robberEligibleVictimIds = [];
      next.phase = next.returnPhaseAfterRobber || 'MAIN';
      next.returnPhaseAfterRobber = undefined;
      return { success: true, newState: next };
    }

    case 'BUILD_SETTLEMENT': {
      const isSetup = next.phase.startsWith('SETUP');
      if (!isSetup && action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to build' };
      }

      const val = canBuildSettlement(next, action.playerId, action.vertexId, isSetup);
      if (!val.valid) {
        const err = val.reason?.includes('DISTANCE_RULE_VIOLATED') ? 'DISTANCE_RULE_VIOLATED' : val.reason;
        return { success: false, newState: state, error: err };
      }

      const player = next.players[action.playerId];
      const vertex = next.board.vertices[action.vertexId];

      if (!isSetup) {
        // Deduct resources
        for (const [res, count] of Object.entries(BUILDING_COSTS.settlement) as [ResourceType, number][]) {
          player.resources[res] -= count;
          next.resourceSupply[res] += count;
        }
      }

      vertex.building = { type: 'settlement', playerId: action.playerId };
      player.settlementsRemaining -= 1;

      // Harbor control linkage
      if (vertex.harborId && !player.controlledHarbors.includes(vertex.harborId)) {
        player.controlledHarbors.push(vertex.harborId);
      }

      // Check if this settlement broke opponent's Longest Road
      const lrResult = evaluateLongestRoad(next.board, next.playerOrder, next.longestRoadOwnerId);
      next.longestRoadOwnerId = lrResult.newOwnerId;
      next.longestRoadLength = lrResult.playerLengths[lrResult.newOwnerId ?? ''] || 0;

      recalculateAllVictoryPoints(next);
      applyVictoryCheck(next);
      next.logs.push(`${player.username} built a settlement.`);

      return { success: true, newState: next };
    }

    case 'BUILD_ROAD': {
      const isSetup = next.phase.startsWith('SETUP');
      if (!isSetup && action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to build' };
      }

      const player = next.players[action.playerId];
      const edge = next.board.edges[action.edgeId];

      // Find anchor settlement in setup phase
      let anchorId: string | undefined;
      if (isSetup) {
        for (const [vId, v] of Object.entries(next.board.vertices)) {
          if (v.building && v.building.playerId === action.playerId && edge.vertexIds.includes(vId)) {
            anchorId = vId;
            break;
          }
        }
      }

      const val = canBuildRoad(next, action.playerId, action.edgeId, isSetup, anchorId);
      if (!val.valid) {
        return { success: false, newState: state, error: val.reason };
      }

      if (!isSetup) {
        for (const [res, count] of Object.entries(BUILDING_COSTS.road) as [ResourceType, number][]) {
          player.resources[res] -= count;
          next.resourceSupply[res] += count;
        }
      }

      edge.road = { playerId: action.playerId };
      player.roadsRemaining -= 1;

      // Re-evaluate Longest Road
      const lrResult = evaluateLongestRoad(next.board, next.playerOrder, next.longestRoadOwnerId);
      if (lrResult.newOwnerId !== next.longestRoadOwnerId) {
        if (lrResult.newOwnerId) {
          next.logs.push(`${next.players[lrResult.newOwnerId].username} claimed the Longest Road (2 VP)!`);
        } else if (next.longestRoadOwnerId) {
          next.logs.push(`The Longest Road was broken and set aside!`);
        }
      }
      next.longestRoadOwnerId = lrResult.newOwnerId;
      next.longestRoadLength = lrResult.playerLengths[lrResult.newOwnerId ?? ''] || 0;

      recalculateAllVictoryPoints(next);
      applyVictoryCheck(next);
      next.logs.push(`${player.username} paved a road.`);

      // Setup round progression
      if (next.phase === 'SETUP_ROUND_1') {
        const nextIdx = next.currentPlayerIndex + 1;
        if (nextIdx < next.playerOrder.length) {
          next.currentPlayerIndex = nextIdx;
        } else {
          // Last player finished round 1 -> begins round 2!
          next.phase = 'SETUP_ROUND_2';
          next.currentPlayerIndex = next.playerOrder.length - 1;
          next.logs.push(`Setup Round 2 begins (snake draft).`);
        }
      } else if (next.phase === 'SETUP_ROUND_2') {
        // Distribute starting resources for the second settlement just placed
        if (anchorId) {
          const anchorVertex = next.board.vertices[anchorId];
          if (anchorVertex) {
            for (const hexId of anchorVertex.hexIds) {
              const hex = next.board.hexes[hexId];
              if (hex && hex.terrain !== 'desert') {
                const res = TERRAIN_TO_RESOURCE[hex.terrain];
                if (res) {
                  player.resources[res] = (player.resources[res] ?? 0) + 1;
                  next.resourceSupply[res] = Math.max(0, (next.resourceSupply[res] ?? 0) - 1);
                }
              }
            }
          }
        }

        const prevIdx = next.currentPlayerIndex - 1;
        if (prevIdx >= 0) {
          next.currentPlayerIndex = prevIdx;
        } else {
          // Setup phase complete! Starting player begins turn 1
          next.phase = 'ROLLING';
          next.currentPlayerIndex = 0;
          next.turnNumber = 1;
          next.logs.push(`Setup complete! Match begins. ${next.players[next.playerOrder[0]].username}'s turn.`);
        }
      }

      return { success: true, newState: next };
    }

    case 'BUILD_CITY': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to upgrade city' };
      }

      const val = canBuildCity(next, action.playerId, action.vertexId);
      if (!val.valid) {
        return { success: false, newState: state, error: val.reason };
      }

      const player = next.players[action.playerId];
      const vertex = next.board.vertices[action.vertexId];

      // Deduct 3 ore, 2 grain
      for (const [res, count] of Object.entries(BUILDING_COSTS.city) as [ResourceType, number][]) {
        player.resources[res] -= count;
        next.resourceSupply[res] += count;
      }

      // Upgrade
      vertex.building = { type: 'city', playerId: action.playerId };
      player.citiesRemaining -= 1;
      player.settlementsRemaining += 1; // Settlement piece returned to available pool!

      recalculateAllVictoryPoints(next);
      applyVictoryCheck(next);
      next.logs.push(`${player.username} upgraded a settlement to a Fortified City.`);

      return { success: true, newState: next };
    }

    case 'BUY_DEV_CARD': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to buy development card' };
      }

      const val = canBuyDevCard(next, action.playerId);
      if (!val.valid) {
        return { success: false, newState: state, error: val.reason };
      }

      const player = next.players[action.playerId];

      for (const [res, count] of Object.entries(BUILDING_COSTS.dev_card) as [ResourceType, number][]) {
        player.resources[res] -= count;
        next.resourceSupply[res] += count;
      }

      const drawnCard = next.developmentDeck.shift()!;
      player.devCards.push(drawnCard);
      player.boughtDevCardsThisTurn = [...(player.boughtDevCardsThisTurn || []), drawnCard];

      recalculateAllVictoryPoints(next);
      applyVictoryCheck(next);
      next.logs.push(`${player.username} purchased a development card.`);

      return { success: true, newState: next };
    }

    case 'PLAY_DEV_CARD': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to play development cards' };
      }

      // Allowed in ROLLING (pre-roll) or MAIN phase
      if (next.phase !== 'ROLLING' && next.phase !== 'MAIN') {
        return { success: false, newState: state, error: 'Cannot play development cards in current phase' };
      }

      const player = next.players[action.playerId];
      const cardCount = (player.devCards || []).filter((c) => c === action.card).length;
      if (cardCount === 0) {
        return { success: false, newState: state, error: 'You do not own this card' };
      }

      // One-dev-card-per-turn restriction (VP cards exempt)
      if (action.card !== 'victory_point' && player.hasPlayedDevCardThisTurn) {
        return { success: false, newState: state, error: 'May only play one development card per turn' };
      }

      // Cannot play a card on the turn it was purchased (VP cards exempt)
      if (action.card !== 'victory_point') {
        const boughtThisTurnCount = (player.boughtDevCardsThisTurn || []).filter((c) => c === action.card).length;
        if (cardCount <= boughtThisTurnCount) {
          return {
            success: false,
            newState: state,
            error: 'Cannot play a development card on the turn it was purchased',
          };
        }
      }

      const cardIdx = player.devCards.indexOf(action.card);
      player.devCards.splice(cardIdx, 1);
      if (action.card !== 'victory_point') {
        player.hasPlayedDevCardThisTurn = true;
      }

      next.playedDevelopmentCards.push({
        card: action.card,
        playerId: action.playerId,
        turnPlayed: next.turnNumber,
      });

      if (action.card === 'knight') {
        player.playedKnights += 1;
        updateLargestArmy(next);
        recalculateAllVictoryPoints(next);

        next.logs.push(`${player.username} summoned a Knight (Total: ${player.playedKnights}).`);
        next.returnPhaseAfterRobber = next.phase === 'ROLLING' ? 'ROLLING' : 'MAIN';
        next.phase = 'ROBBER_MOVE';
      } else if (action.card === 'year_of_plenty') {
        const [res1, res2] = action.params?.yearOfPlentyResources || ['grain', 'ore'];
        const reqCounts: Partial<Record<ResourceType, number>> = {};
        reqCounts[res1] = (reqCounts[res1] ?? 0) + 1;
        reqCounts[res2] = (reqCounts[res2] ?? 0) + 1;

        for (const [r, needed] of Object.entries(reqCounts) as [ResourceType, number][]) {
          if ((next.resourceSupply[r] ?? 0) < needed) {
            return { success: false, newState: state, error: `Bank supply is out of ${r}` };
          }
        }

        player.resources[res1] = (player.resources[res1] ?? 0) + 1;
        player.resources[res2] = (player.resources[res2] ?? 0) + 1;
        next.resourceSupply[res1] = Math.max(0, next.resourceSupply[res1] - 1);
        next.resourceSupply[res2] = Math.max(0, next.resourceSupply[res2] - 1);
        next.logs.push(`${player.username} played Year of Plenty for ${res1} and ${res2}.`);
      } else if (action.card === 'monopoly') {
        const targetRes = action.params?.monopolyResource || 'ore';
        let totalStolen = 0;
        for (const [oppId, opp] of Object.entries(next.players)) {
          if (oppId !== action.playerId) {
            const count = opp.resources[targetRes] ?? 0;
            if (count > 0) {
              opp.resources[targetRes] = 0;
              player.resources[targetRes] = (player.resources[targetRes] ?? 0) + count;
              totalStolen += count;
            }
          }
        }
        next.logs.push(`${player.username} claimed Monopoly on ${targetRes}, seizing ${totalStolen} cards!`);
      } else if (action.card === 'victory_point') {
        recalculateAllVictoryPoints(next);
        next.logs.push(`${player.username} revealed a Victory Point card!`);
      } else if (action.card === 'road_building') {
        if (player.roadsRemaining <= 0) {
          return { success: false, newState: state, error: 'No road pieces remaining in your supply' };
        }

        if (action.params?.roadBuildingEdges && action.params.roadBuildingEdges.length > 0) {
          const maxRoadsToPlace = Math.min(2, player.roadsRemaining);
          let placedCount = 0;
          for (const edgeId of action.params.roadBuildingEdges) {
            if (placedCount >= maxRoadsToPlace) break;
            const val = canBuildRoad(next, action.playerId, edgeId, false);
            if (!val.valid) {
              return { success: false, newState: state, error: `Invalid road placement: ${val.reason}` };
            }
            const edge = next.board.edges[edgeId];
            edge.road = { playerId: action.playerId };
            player.roadsRemaining -= 1;
            placedCount++;
          }
          const lrResult = evaluateLongestRoad(next.board, next.playerOrder, next.longestRoadOwnerId);
          next.longestRoadOwnerId = lrResult.newOwnerId;
          next.longestRoadLength = lrResult.playerLengths[lrResult.newOwnerId ?? ''] || 0;
          recalculateAllVictoryPoints(next);
        } else {
          // Grant resources for up to 2 free roads
          const count = Math.min(2, player.roadsRemaining);
          player.resources.lumber = (player.resources.lumber ?? 0) + count;
          player.resources.brick = (player.resources.brick ?? 0) + count;
        }

        next.logs.push(`${player.username} played Road Building!`);
      }

      applyVictoryCheck(next);
      return { success: true, newState: next };
    }

    case 'TRADE_MARITIME':
    case 'TRADE_BANK': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to trade' };
      }

      const val = canMaritimeTrade(next, action.playerId, action.giving, action.receiving);
      if (!val.valid) {
        return { success: false, newState: state, error: val.reason };
      }

      const player = next.players[action.playerId];
      player.resources[action.giving] -= val.rate;
      player.resources[action.receiving] += 1;

      next.resourceSupply[action.giving] += val.rate;
      next.resourceSupply[action.receiving] -= 1;

      next.logs.push(
        `${player.username} traded ${val.rate} ${action.giving} for 1 ${action.receiving} (${val.rate}:1 rate).`
      );

      return { success: true, newState: next };
    }

    case 'TRADE_PROPOSE': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Only active player can propose trades' };
      }
      if (next.phase !== 'MAIN') {
        return { success: false, newState: state, error: 'Trades can only be proposed during the main action phase' };
      }
      const player = next.players[action.playerId];
      if (!player) return { success: false, newState: state, error: 'Player does not exist' };

      // Calculate total offered and requested
      let totalOffer = 0;
      let totalRequest = 0;
      for (const [res, count] of Object.entries(action.offer) as [ResourceType, number][]) {
        const c = count ?? 0;
        if (c > 0) {
          totalOffer += c;
          if ((player.resources[res] ?? 0) < c) {
            return { success: false, newState: state, error: `You do not have enough ${res} to offer` };
          }
          // Prevent same-resource loophole (e.g. 3 Ore for 1 Ore)
          if ((action.request[res] ?? 0) > 0) {
            return { success: false, newState: state, error: `Cannot offer and request the same resource (${res})` };
          }
        }
      }

      for (const count of Object.values(action.request)) {
        totalRequest += count ?? 0;
      }

      // Rule: No free gifting (must offer >=1 and request >=1)
      if (totalOffer <= 0 || totalRequest <= 0) {
        return { success: false, newState: state, error: 'Cannot propose empty trades or free gifts' };
      }

      next.activeTrade = {
        id: 'trade_' + Date.now(),
        fromPlayerId: action.playerId,
        offer: action.offer,
        request: action.request,
        acceptedBy: [],
      };

      next.logs.push(`${player.username} proposed a trade offer.`);
      return { success: true, newState: next };
    }

    case 'TRADE_ACCEPT': {
      if (!next.activeTrade) {
        return { success: false, newState: state, error: 'No active trade offer' };
      }

      if (action.playerId === next.activeTrade.fromPlayerId) {
        return { success: false, newState: state, error: 'Cannot accept your own trade' };
      }

      const acceptingPlayer = next.players[action.playerId];
      const fromPlayer = next.players[next.activeTrade.fromPlayerId];
      if (!acceptingPlayer || !fromPlayer) {
        return { success: false, newState: state, error: 'Player does not exist' };
      }

      for (const [res, count] of Object.entries(next.activeTrade.request) as [ResourceType, number][]) {
        if ((acceptingPlayer.resources[res] ?? 0) < (count ?? 0)) {
          return { success: false, newState: state, error: `You do not have the requested ${res}` };
        }
      }

      for (const [res, count] of Object.entries(next.activeTrade.offer) as [ResourceType, number][]) {
        if ((fromPlayer.resources[res] ?? 0) < (count ?? 0)) {
          return { success: false, newState: state, error: `${fromPlayer.username} no longer has the offered ${res}` };
        }
      }

      for (const [res, count] of Object.entries(next.activeTrade.offer) as [ResourceType, number][]) {
        fromPlayer.resources[res] -= count;
        acceptingPlayer.resources[res] = (acceptingPlayer.resources[res] ?? 0) + count;
      }

      for (const [res, count] of Object.entries(next.activeTrade.request) as [ResourceType, number][]) {
        acceptingPlayer.resources[res] -= count;
        fromPlayer.resources[res] = (fromPlayer.resources[res] ?? 0) + count;
      }

      next.activeTrade = null;
      next.logs.push(`${acceptingPlayer.username} accepted trade from ${fromPlayer.username}.`);
      return { success: true, newState: next };
    }

    case 'TRADE_CANCEL': {
      next.activeTrade = null;
      next.logs.push('Trade offer cancelled.');
      return { success: true, newState: next };
    }


    case 'END_TURN': {
      if (action.playerId !== activePlayerId) {
        return { success: false, newState: state, error: 'Not your turn to end turn' };
      }

      recalculateAllVictoryPoints(next);

      // Check victory condition: Target VP reached on player's OWN turn
      const requiredVp = next.targetVictoryPoints ?? VICTORY_POINTS_TARGET;
      if (activePlayer.victoryPoints >= requiredVp) {
        next.winnerId = activePlayerId;
        next.phase = 'FINISHED';
        next.logs.push(`🎉 VICTORY! ${activePlayer.username} has reached ${activePlayer.victoryPoints} Victory Points and won the match!`);
        return { success: true, newState: next };
      }

      // Handle setup round progression via END_TURN
      if (next.phase === 'SETUP_ROUND_1') {
        const nextIdx = next.currentPlayerIndex + 1;
        if (nextIdx < next.playerOrder.length) {
          next.currentPlayerIndex = nextIdx;
        } else {
          next.phase = 'SETUP_ROUND_2';
          next.currentPlayerIndex = next.playerOrder.length - 1;
        }
        return { success: true, newState: next };
      } else if (next.phase === 'SETUP_ROUND_2') {
        const prevIdx = next.currentPlayerIndex - 1;
        if (prevIdx >= 0) {
          next.currentPlayerIndex = prevIdx;
        } else {
          next.phase = 'ROLLING';
          next.currentPlayerIndex = 0;
          next.turnNumber = 1;
        }
        return { success: true, newState: next };
      }

      // Pass turn to next player
      next.currentPlayerIndex = (next.currentPlayerIndex + 1) % next.playerOrder.length;
      next.turnNumber += 1;
      next.dice = { dice1: 0, dice2: 0, total: 0, rolled: false };
      next.phase = 'ROLLING';

      const newPlayer = next.players[next.playerOrder[next.currentPlayerIndex]];
      if (newPlayer) {
        newPlayer.hasPlayedDevCardThisTurn = false;
        newPlayer.boughtDevCardsThisTurn = [];
      }
      next.logs.push(`Turn ${next.turnNumber}: ${newPlayer.username}'s turn begins.`);

      return { success: true, newState: next };
    }

    default:
      return { success: false, newState: state, error: 'Unknown action' };
  }
}
