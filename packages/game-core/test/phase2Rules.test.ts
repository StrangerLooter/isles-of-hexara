import assert from 'node:assert';
import { test } from 'node:test';
import {
  createInitialGameState,
  executeGameAction,
  generateBoardTopology,
  evaluateLongestRoad,
} from '../src/index.js';

test('Phase 2.1: Pre-Roll Dev Card (Knight) returns phase to ROLLING so dice must still be rolled', () => {
  const game = createInitialGameState('test_pre_roll', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  // Setup phase complete -> ROLLING phase
  game.phase = 'ROLLING';
  game.currentPlayerIndex = 0; // p1's turn
  game.players.p1.devCards = ['knight'];
  game.players.p1.boughtDevCardsThisTurn = []; // bought previous turn
  game.players.p2.resources.ore = 3;

  // Find a hex to place robber adjacent to p2
  const targetHex = Object.values(game.board.hexes).find((h) => h.id !== game.robberHexId)!;
  const p2Vertex = game.board.vertices[targetHex.vertexIds[0]];
  p2Vertex.building = { type: 'settlement', playerId: 'p2' };

  // Play Knight pre-roll
  const knightRes = executeGameAction(game, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'knight',
  });

  assert.strictEqual(knightRes.success, true);
  assert.strictEqual(knightRes.newState.phase, 'ROBBER_MOVE');
  assert.strictEqual(knightRes.newState.returnPhaseAfterRobber, 'ROLLING');
  assert.strictEqual(knightRes.newState.players.p1.playedKnights, 1);
  assert.strictEqual(knightRes.newState.players.p1.hasPlayedDevCardThisTurn, true);

  // Move robber to target hex
  const moveRes = executeGameAction(knightRes.newState, {
    type: 'MOVE_ROBBER',
    playerId: 'p1',
    hexId: targetHex.id,
  });

  assert.strictEqual(moveRes.success, true);
  // Auto-steals from single victim p2 and returns to ROLLING!
  assert.strictEqual(moveRes.newState.phase, 'ROLLING');
  assert.strictEqual(moveRes.newState.players.p1.resources.ore, 1);
  assert.strictEqual(moveRes.newState.players.p2.resources.ore, 2);
  assert.strictEqual(moveRes.newState.dice.rolled, false);

  // Player 1 can now roll the dice
  const rollRes = executeGameAction(moveRes.newState, {
    type: 'ROLL_DICE',
    playerId: 'p1',
  });
  assert.strictEqual(rollRes.success, true);
  assert.strictEqual(rollRes.newState.dice.rolled, true);
});

test('Phase 2.2: Cannot play Dev Card on the turn it was purchased', () => {
  const game = createInitialGameState('test_same_turn_card', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  game.players.p1.resources = { lumber: 0, brick: 0, wool: 1, grain: 1, ore: 1 };
  game.developmentDeck = ['year_of_plenty', 'knight'];

  // Buy dev card
  const buyRes = executeGameAction(game, {
    type: 'BUY_DEV_CARD',
    playerId: 'p1',
  });
  assert.strictEqual(buyRes.success, true);
  assert.deepStrictEqual(buyRes.newState.players.p1.devCards, ['year_of_plenty']);
  assert.deepStrictEqual(buyRes.newState.players.p1.boughtDevCardsThisTurn, ['year_of_plenty']);

  // Attempt to play it in the same turn -> rejected!
  const playRes = executeGameAction(buyRes.newState, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'year_of_plenty',
  });
  assert.strictEqual(playRes.success, false);
  assert.match(playRes.error || '', /turn it was purchased/);
});

test('Phase 2.3: Only one non-VP Dev Card may be played per turn', () => {
  const game = createInitialGameState('test_one_card_limit', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  // Owns 2 cards from previous turns
  game.players.p1.devCards = ['year_of_plenty', 'monopoly'];
  game.players.p1.boughtDevCardsThisTurn = [];

  // Play first card (Year of Plenty)
  const play1 = executeGameAction(game, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'year_of_plenty',
    params: { yearOfPlentyResources: ['lumber', 'brick'] },
  });
  assert.strictEqual(play1.success, true);
  assert.strictEqual(play1.newState.players.p1.hasPlayedDevCardThisTurn, true);

  // Attempt to play second card (Monopoly) -> rejected!
  const play2 = executeGameAction(play1.newState, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'monopoly',
    params: { monopolyResource: 'ore' },
  });
  assert.strictEqual(play2.success, false);
  assert.match(play2.error || '', /only play one development card/);
});

test('Phase 2.4: City Upgrade correctly recycles settlement piece back to player supply', () => {
  const game = createInitialGameState('test_city_recycle', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  const v = Object.values(game.board.vertices)[0];
  v.building = { type: 'settlement', playerId: 'p1' };
  game.players.p1.settlementsRemaining = 4; // 1 already placed
  game.players.p1.citiesRemaining = 4;
  game.players.p1.resources = { lumber: 0, brick: 0, wool: 0, grain: 2, ore: 3 };

  // Upgrade to city
  const cityRes = executeGameAction(game, {
    type: 'BUILD_CITY',
    playerId: 'p1',
    vertexId: v.id,
  });

  assert.strictEqual(cityRes.success, true);
  assert.strictEqual(cityRes.newState.board.vertices[v.id].building?.type, 'city');
  // Settlements remaining increased back from 4 to 5!
  assert.strictEqual(cityRes.newState.players.p1.settlementsRemaining, 5);
  // Cities remaining decreased from 4 to 3!
  assert.strictEqual(cityRes.newState.players.p1.citiesRemaining, 3);
  // Victory points updated to 2
  assert.strictEqual(cityRes.newState.players.p1.victoryPoints, 2);
});

test('Phase 2.5: Immediate Match Victory at 10 VP on player own turn and action locking', () => {
  const game = createInitialGameState('test_immediate_victory', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  // Authoritatively give p1 9 Victory Points: 5 VP cards + 2 cities on board
  game.players.p1.devCards = ['victory_point', 'victory_point', 'victory_point', 'victory_point', 'victory_point'];
  const allVertices = Object.values(game.board.vertices);
  allVertices[10].building = { type: 'city', playerId: 'p1' };
  allVertices[20].building = { type: 'city', playerId: 'p1' };
  game.players.p1.settlementsRemaining = 4;
  game.players.p1.resources = { lumber: 1, brick: 1, wool: 1, grain: 1, ore: 0 };

  // Setup road connection to legal vertex
  const v0 = allVertices[0];
  const e0 = game.board.edges[v0.adjacentEdgeIds[0]];
  e0.road = { playerId: 'p1' };
  game.players.p1.roadsRemaining = 14;

  // Build settlement -> reaches 10 VP!
  const buildRes = executeGameAction(game, {
    type: 'BUILD_SETTLEMENT',
    playerId: 'p1',
    vertexId: v0.id,
  });

  assert.strictEqual(buildRes.success, true);
  assert.strictEqual(buildRes.newState.players.p1.victoryPoints, 10);
  assert.strictEqual(buildRes.newState.winnerId, 'p1');
  assert.strictEqual(buildRes.newState.phase, 'FINISHED');

  // Any subsequent action must be rejected because game is FINISHED
  const lateAction = executeGameAction(buildRes.newState, {
    type: 'END_TURN',
    playerId: 'p1',
  });
  assert.strictEqual(lateAction.success, false);
  assert.match(lateAction.error || '', /already finished/);
});
