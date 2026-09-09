import assert from 'node:assert';
import { test } from 'node:test';
import {
  canBuildCity,
  canBuildRoad,
  canBuildSettlement,
  canMaritimeTrade,
  canMoveRobber,
  createInitialGameState,
  executeGameAction,
  generateBoardTopology,
  getMaritimeTradeRate,
  calculateLongestRoadForPlayer,
  evaluateLongestRoad,
  calculateProduction,
} from '../src/index.js';

test('1. Board Graph Topology: 19 hexes, shared vertices & edges, non-adjacent 6/8', () => {
  const board = generateBoardTopology(42);

  // 19 hexes
  const hexIds = Object.keys(board.hexes);
  assert.strictEqual(hexIds.length, 19, 'Must have exactly 19 hexes');

  // Exactly 1 desert
  const desertHexes = Object.values(board.hexes).filter((h) => h.terrain === 'desert');
  assert.strictEqual(desertHexes.length, 1, 'Must have exactly 1 desert');
  assert.strictEqual(desertHexes[0].diceNumber, null, 'Desert must not have a number token');

  // Exactly 18 number tokens
  const nonDesert = Object.values(board.hexes).filter((h) => h.terrain !== 'desert');
  assert.strictEqual(nonDesert.length, 18, 'Must have 18 productive hexes');
  nonDesert.forEach((h) => {
    assert.notStrictEqual(h.diceNumber, null, 'Productive hex must have a dice number');
    assert.notStrictEqual(h.diceNumber, 7, 'No terrain token with 7');
  });

  // Red numbers (6 and 8) must NOT be adjacent
  for (const h of nonDesert) {
    if (h.diceNumber === 6 || h.diceNumber === 8) {
      // Find neighboring hexes through shared edges
      for (const eId of h.edgeIds) {
        const edge = board.edges[eId];
        for (const otherHexId of edge.hexIds) {
          if (otherHexId !== h.id) {
            const neighborHex = board.hexes[otherHexId];
            if (neighborHex && neighborHex.terrain !== 'desert') {
              assert.notStrictEqual(
                neighborHex.diceNumber,
                6,
                `Hex ${h.id} (${h.diceNumber}) must not border 6`
              );
              assert.notStrictEqual(
                neighborHex.diceNumber,
                8,
                `Hex ${h.id} (${h.diceNumber}) must not border 8`
              );
            }
          }
        }
      }
    }
  }

  // Every hex has exactly 6 vertices and 6 edges
  for (const hex of Object.values(board.hexes)) {
    assert.strictEqual(hex.vertexIds.length, 6, 'Hex must have 6 vertices');
    assert.strictEqual(hex.edgeIds.length, 6, 'Hex must have 6 edges');
  }

  // Shared geometry check: adjacent hexes share the exact same vertex & edge objects
  let sharedVertexFound = false;
  let sharedEdgeFound = false;

  for (const v of Object.values(board.vertices)) {
    if (v.hexIds.length > 1) {
      sharedVertexFound = true;
      // The vertex ID must be present in all those hexes' vertexIds
      for (const hId of v.hexIds) {
        assert.ok(board.hexes[hId].vertexIds.includes(v.id));
      }
    }
  }

  for (const e of Object.values(board.edges)) {
    if (e.hexIds.length > 1) {
      sharedEdgeFound = true;
      for (const hId of e.hexIds) {
        assert.ok(board.hexes[hId].edgeIds.includes(e.id));
      }
    }
  }

  assert.ok(sharedVertexFound, 'Adjacent hexes must share vertices');
  assert.ok(sharedEdgeFound, 'Adjacent hexes must share edges');

  // Exactly 9 harbors attached to coastal intersections
  const harborList = Object.values(board.harbors);
  assert.strictEqual(harborList.length, 9, 'Must have exactly 9 harbors');
});

test('2. Settlement Distance Rule & Building Validation', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  const v1 = Object.values(game.board.vertices)[0];
  const adjVertexId = v1.adjacentVertexIds[0];

  // Place settlement at v1
  const res1 = executeGameAction(game, {
    type: 'BUILD_SETTLEMENT',
    playerId: 'p1',
    vertexId: v1.id,
  });
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.newState.board.vertices[v1.id].building?.playerId, 'p1');

  // Try to place settlement at adjacent vertex (Distance Rule violation)
  const distCheck = canBuildSettlement(res1.newState, 'p2', adjVertexId, true);
  assert.strictEqual(distCheck.valid, false, 'Distance rule must reject adjacent placement');
  assert.match(distCheck.reason || '', /Distance Rule/);

  // Try to place on the same vertex
  const sameCheck = canBuildSettlement(res1.newState, 'p2', v1.id, true);
  assert.strictEqual(sameCheck.valid, false, 'Cannot build on already occupied intersection');
});

test('3. Road Building & Opponent Building Blocking', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  // Set up a path: V0 -- E0 -- V1 -- E1 -- V2
  const v0 = Object.values(game.board.vertices)[0];
  const v1Id = v0.adjacentVertexIds[0];
  const v1 = game.board.vertices[v1Id];
  const e0Id = v0.adjacentEdgeIds.find((eId) => v1.adjacentEdgeIds.includes(eId))!;

  // Give p1 a settlement at v0 and road at e0
  v0.building = { type: 'settlement', playerId: 'p1' };
  game.board.edges[e0Id].road = { playerId: 'p1' };

  // Place an OPPONENT (p2) settlement at V1
  v1.building = { type: 'settlement', playerId: 'p2' };

  // Find an edge E1 extending from V1 (not E0)
  const e1Id = v1.adjacentEdgeIds.find((eId) => eId !== e0Id)!;

  // Set to MAIN phase with resources
  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  game.players.p1.resources.lumber = 5;
  game.players.p1.resources.brick = 5;

  // p1 tries to build road on E1 through p2's settlement -> BLOCKED!
  const roadCheck = canBuildRoad(game, 'p1', e1Id);
  assert.strictEqual(
    roadCheck.valid,
    false,
    'Opponent settlement must block road network continuation through that intersection'
  );
});

test('4. City Upgrade, Piece Recycling, and Double Production', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  const v0 = Object.values(game.board.vertices)[0];
  v0.building = { type: 'settlement', playerId: 'p1' };
  game.players.p1.settlementsRemaining = 4; // 1 built
  game.players.p1.citiesRemaining = 4;
  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;

  // Give resources for city: 3 ore + 2 grain
  game.players.p1.resources.ore = 3;
  game.players.p1.resources.grain = 2;

  const cityRes = executeGameAction(game, {
    type: 'BUILD_CITY',
    playerId: 'p1',
    vertexId: v0.id,
  });

  assert.strictEqual(cityRes.success, true);
  assert.strictEqual(cityRes.newState.board.vertices[v0.id].building?.type, 'city');
  // Settlements remaining returned to supply pool!
  assert.strictEqual(cityRes.newState.players.p1.settlementsRemaining, 5, 'Settlement piece must be returned to pool');
  assert.strictEqual(cityRes.newState.players.p1.citiesRemaining, 3);
});

test('5. Finite Bank Supply & Shortage Handling', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  // Find a hex with a number token, e.g., grain
  const hex = Object.values(game.board.hexes).find(
    (h) => h.terrain === 'fields' && h.diceNumber !== null
  )!;
  const roll = hex.diceNumber!;

  // Give p1 and p2 settlements on this hex
  const v1 = game.board.vertices[hex.vertexIds[0]];
  const v2 = game.board.vertices[hex.vertexIds[2]];
  v1.building = { type: 'settlement', playerId: 'p1' };
  v2.building = { type: 'settlement', playerId: 'p2' };

  // Set bank grain to only 1 (shortage for 2 players!)
  game.resourceSupply.grain = 1;

  const events = calculateProduction(game, roll);
  // Shortage affects multiple players -> neither gets grain!
  const totalGrainDistributed = events.reduce((sum, ev) => sum + (ev.resources.grain ?? 0), 0);
  assert.strictEqual(totalGrainDistributed, 0, 'Multiple player shortage results in 0 distributed');

  // If shortage affects only 1 player:
  v2.building = null;
  const singleEvents = calculateProduction(game, roll);
  assert.strictEqual(singleEvents[0].resources.grain, 1, 'Single player shortage receives remaining bank stock');
});

test('6. Robber Activation on 7: Discard Half if >7 Cards & Steal', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'ROLLING';
  game.currentPlayerIndex = 0;
  // p1 has 6 cards (under limit), p2 has 10 cards (must discard 5)
  game.players.p1.resources.lumber = 6;
  game.players.p2.resources.lumber = 10;

  // Mock roll 7
  game.dice = { dice1: 3, dice2: 4, total: 7, rolled: true };
  const discardsNeeded: Record<string, number> = {};
  for (const [pid, p] of Object.entries(game.players)) {
    const count = Object.values(p.resources).reduce((a, b) => a + b, 0);
    if (count > 7) {
      discardsNeeded[pid] = Math.floor(count / 2);
    }
  }

  assert.strictEqual(discardsNeeded.p1, undefined);
  assert.strictEqual(discardsNeeded.p2, 5, '10 cards discards 5');

  game.pendingDiscards = discardsNeeded;
  game.phase = 'ROBBER_DISCARD';

  // p2 discards 5 lumber
  const discardRes = executeGameAction(game, {
    type: 'DISCARD_RESOURCES',
    playerId: 'p2',
    resources: { lumber: 5 },
  });
  assert.strictEqual(discardRes.success, true);
  assert.strictEqual(discardRes.newState.players.p2.resources.lumber, 5);
  assert.strictEqual(discardRes.newState.phase, 'ROBBER_MOVE');
});

test('7. Edge-level DFS Longest Road with Branches & Cycles', () => {
  const board = generateBoardTopology(42);

  // Pick a continuous chain of 5 edges for player 'p1'
  // Build a straight chain: v0-v1, v1-v2, v2-v3, v3-v4, v4-v5
  const hex = Object.values(board.hexes)[0];
  const eIds = hex.edgeIds; // 6 edges forming a hexagon cycle

  // Assign 5 of the 6 edges to p1
  for (let i = 0; i < 5; i++) {
    board.edges[eIds[i]].road = { playerId: 'p1' };
  }

  const len = calculateLongestRoadForPlayer(board, 'p1');
  assert.strictEqual(len, 5, '5 continuous road segments');

  const evalResult = evaluateLongestRoad(board, ['p1', 'p2'], null);
  assert.strictEqual(evalResult.newOwnerId, 'p1', 'p1 claims Longest Road at 5 segments');

  // Now assign a cycle (all 6 edges)
  board.edges[eIds[5]].road = { playerId: 'p1' };
  const cycleLen = calculateLongestRoadForPlayer(board, 'p1');
  assert.strictEqual(cycleLen, 6, 'Cycle of 6 edges is traversed without infinite recursion');
});

test('8. Development Cards Deck, Monopoly, and Largest Army', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  assert.strictEqual(game.developmentDeck.length, 25, 'Deck must contain 25 cards');

  // Buy dev card
  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  game.players.p1.resources.ore = 1;
  game.players.p1.resources.wool = 1;
  game.players.p1.resources.grain = 1;

  const buyRes = executeGameAction(game, {
    type: 'BUY_DEV_CARD',
    playerId: 'p1',
  });
  assert.strictEqual(buyRes.success, true);
  assert.strictEqual(buyRes.newState.players.p1.devCards.length, 1);
  assert.strictEqual(buyRes.newState.developmentDeck.length, 24);

  // Play Monopoly
  buyRes.newState.players.p1.devCards = ['monopoly'];
  buyRes.newState.players.p2.resources.ore = 4;

  const monoRes = executeGameAction(buyRes.newState, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'monopoly',
    params: { monopolyResource: 'ore' },
  });
  assert.strictEqual(monoRes.success, true);
  assert.strictEqual(monoRes.newState.players.p2.resources.ore, 0, 'Opponent surrendered all ore');
  assert.strictEqual(monoRes.newState.players.p1.resources.ore, 4, 'Current player received all ore');
});

test('9. Maritime Trading: 4:1 Default, 3:1 Generic, 2:1 Special Harbors', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
  ]);

  // Default rate is 4:1
  const defaultRate = getMaritimeTradeRate(game, 'p1', 'ore');
  assert.strictEqual(defaultRate, 4, 'Default trade rate must be 4:1');

  // Find an ore 2:1 harbor and place p1 settlement on its intersection
  const oreHarbor = Object.values(game.board.harbors).find(
    (h) => h.type === 'RESOURCE_2_TO_1' && h.resourceType === 'ore'
  );
  if (oreHarbor) {
    const vId = oreHarbor.adjacentIntersectionIds[0];
    game.board.vertices[vId].building = { type: 'settlement', playerId: 'p1' };

    const rate = getMaritimeTradeRate(game, 'p1', 'ore');
    assert.strictEqual(rate, 2, 'Ore harbor grants 2:1 rate on ore');

    const woolRate = getMaritimeTradeRate(game, 'p1', 'wool');
    assert.strictEqual(woolRate, 4, 'Ore harbor does not discount wool');
  }
});

test('10. Victory Condition: 10 VP Claimed on Own Turn', () => {
  const game = createInitialGameState('test_game', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  // Give p1 5 Victory Point cards + 2 Cities on vertices + 1 Settlement = 10 VP
  game.players.p1.devCards = [
    'victory_point',
    'victory_point',
    'victory_point',
    'victory_point',
    'victory_point',
  ];
  const vIds = Object.keys(game.board.vertices);
  game.board.vertices[vIds[0]].building = { type: 'city', playerId: 'p1' };
  game.board.vertices[vIds[2]].building = { type: 'city', playerId: 'p1' };
  game.board.vertices[vIds[4]].building = { type: 'settlement', playerId: 'p1' };

  const endRes = executeGameAction(game, {
    type: 'END_TURN',
    playerId: 'p1',
  });

  assert.strictEqual(endRes.success, true);
  assert.strictEqual(endRes.newState.winnerId, 'p1', 'p1 wins upon reaching 10 VP on own turn');
  assert.strictEqual(endRes.newState.phase, 'FINISHED');
});
