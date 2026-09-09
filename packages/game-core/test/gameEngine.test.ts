import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBoardTopology,
  createInitialGameState,
  executeGameAction,
  satisfiesDistanceRule,
  calculatePlayerVictoryPoints,
} from '../src/index.js';

test('Board Topology Generator creates standard 19-hex board', () => {
  const board = generateBoardTopology();
  const hexCount = Object.keys(board.hexes).length;
  const vertexCount = Object.keys(board.vertices).length;
  const edgeCount = Object.keys(board.edges).length;

  assert.equal(hexCount, 19, 'Must generate exactly 19 hex tiles');
  assert.equal(vertexCount, 54, 'Must generate exactly 54 unique vertices');
  assert.equal(edgeCount, 72, 'Must generate exactly 72 unique edges');
  assert.ok(board.robberHexId, 'Must have initial robber on desert');

  // Verify all vertices are connected to edges
  for (const v of Object.values(board.vertices)) {
    assert.ok(v.adjacentVertexIds.length >= 2, 'Every vertex must touch at least 2 other vertices');
    assert.ok(v.adjacentEdgeIds.length >= 2, 'Every vertex must touch at least 2 edges');
  }
});

test('Initial Game State correctly sets up 4 players', () => {
  const players = [
    { id: 'p1', username: 'Captain Amber' },
    { id: 'p2', username: 'Navigator Sapphire' },
    { id: 'p3', username: 'Merchant Emerald' },
    { id: 'p4', username: 'Corsair Ruby' },
  ];
  const state = createInitialGameState('game_123', players);

  assert.equal(state.phase, 'SETUP_ROUND_1');
  assert.equal(state.currentPlayerIndex, 0);
  assert.equal(state.playerOrder.length, 4);
  assert.equal(state.players['p1'].roadsRemaining, 15);
  assert.equal(state.players['p1'].settlementsRemaining, 5);
  assert.equal(state.players['p1'].victoryPoints, 0);
});

test('Game Engine enforces distance rule for settlements', () => {
  const players = [
    { id: 'p1', username: 'Captain Amber' },
    { id: 'p2', username: 'Navigator Sapphire' },
  ];
  let state = createInitialGameState('game_dist', players);

  const firstVertexId = Object.keys(state.board.vertices)[0];
  const firstVertex = state.board.vertices[firstVertexId];
  const neighborVertexId = firstVertex.adjacentVertexIds[0];

  // Player 1 builds settlement on first vertex
  const res1 = executeGameAction(state, {
    type: 'BUILD_SETTLEMENT',
    playerId: 'p1',
    vertexId: firstVertexId,
  });
  assert.ok(res1.success, 'First settlement placement should succeed');
  state = res1.newState;

  // Verify first vertex now has building
  assert.equal(state.board.vertices[firstVertexId].building?.playerId, 'p1');

  // Check neighbor vertex distance rule
  const neighborVertex = state.board.vertices[neighborVertexId];
  assert.equal(
    satisfiesDistanceRule(neighborVertex, state.board.vertices),
    false,
    'Neighbor vertex must violate distance rule'
  );

  // Attempt to build settlement on adjacent vertex should be rejected
  const res2 = executeGameAction(state, {
    type: 'BUILD_SETTLEMENT',
    playerId: 'p1',
    vertexId: neighborVertexId,
  });
  assert.equal(res2.success, false);
  assert.equal(res2.error, 'DISTANCE_RULE_VIOLATED');
});

test('Turn progression through setup rounds', () => {
  const players = [
    { id: 'p1', username: 'P1' },
    { id: 'p2', username: 'P2' },
  ];
  let state = createInitialGameState('game_turn', players);

  // P1 ends turn in setup round 1 -> passes to P2
  let res = executeGameAction(state, { type: 'END_TURN', playerId: 'p1' });
  assert.ok(res.success);
  state = res.newState;
  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.phase, 'SETUP_ROUND_1');

  // P2 ends turn in setup round 1 -> moves to setup round 2 (snake draft)
  res = executeGameAction(state, { type: 'END_TURN', playerId: 'p2' });
  assert.ok(res.success);
  state = res.newState;
  assert.equal(state.phase, 'SETUP_ROUND_2');
  assert.equal(state.currentPlayerIndex, 1); // P2 goes first in round 2

  // P2 ends turn in setup round 2 -> passes back to P1
  res = executeGameAction(state, { type: 'END_TURN', playerId: 'p2' });
  assert.ok(res.success);
  state = res.newState;
  assert.equal(state.currentPlayerIndex, 0);

  // P1 ends turn in setup round 2 -> setup complete, shifts to ROLLING phase!
  res = executeGameAction(state, { type: 'END_TURN', playerId: 'p1' });
  assert.ok(res.success);
  state = res.newState;
  assert.equal(state.phase, 'ROLLING');
  assert.equal(state.dice.rolled, false);
});

test('Dice roll executes and updates state', () => {
  const players = [
    { id: 'p1', username: 'P1' },
    { id: 'p2', username: 'P2' },
  ];
  let state = createInitialGameState('game_dice', players);
  state.phase = 'ROLLING'; // simulate rolling phase

  const res = executeGameAction(state, { type: 'ROLL_DICE', playerId: 'p1' });
  assert.ok(res.success, 'Dice roll must succeed');
  state = res.newState;

  assert.ok(state.dice.rolled, 'Dice rolled flag must be true');
  assert.ok(state.dice.total >= 2 && state.dice.total <= 12, 'Total must be 2-12');
  assert.ok(state.phase === 'MAIN' || state.phase === 'ROBBER' || state.phase.startsWith('ROBBER_'), 'Must transition to MAIN or ROBBER');
});

test('Bank trade exchanges 4 resources for 1', () => {
  const players = [{ id: 'p1', username: 'P1' }];
  let state = createInitialGameState('game_trade', players);
  state.phase = 'MAIN';
  state.players['p1'].resources.lumber = 4;
  state.players['p1'].resources.ore = 0;

  const res = executeGameAction(state, {
    type: 'TRADE_BANK',
    playerId: 'p1',
    giving: 'lumber',
    receiving: 'ore',
  });

  assert.ok(res.success);
  state = res.newState;
  assert.equal(state.players['p1'].resources.lumber, 0);
  assert.equal(state.players['p1'].resources.ore, 1);
});
