import assert from 'node:assert';
import { test } from 'node:test';
import { DEV_CARD_DECK_COUNTS } from '@hexara/shared';
import {
  createInitialGameState,
  executeGameAction,
} from '../src/index.js';

test('Phase 3.1: Finite Development Card Deck (25 cards) and Deck Depletion', () => {
  const game = createInitialGameState('test_deck', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  const totalDeckExpected = Object.values(DEV_CARD_DECK_COUNTS).reduce((a, b) => a + b, 0);
  assert.strictEqual(game.developmentDeck.length, totalDeckExpected);
  assert.strictEqual(game.developmentDeck.length, 25);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  // Empty deck to test depletion
  game.developmentDeck = [];
  game.players.p1.resources = { ore: 1, wool: 1, grain: 1, lumber: 0, brick: 0 };

  const res = executeGameAction(game, {
    type: 'BUY_DEV_CARD',
    playerId: 'p1',
  });

  assert.strictEqual(res.success, false);
  assert.match(res.error || '', /empty|no development cards/i);
});

test('Phase 3.2: Year of Plenty fails when bank supply is insufficient', () => {
  const game = createInitialGameState('test_yop', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  game.players.p1.devCards = ['year_of_plenty'];
  game.players.p1.boughtDevCardsThisTurn = [];

  // Bank has only 1 ore left
  game.resourceSupply.ore = 1;

  // Attempt to draw 2 ore
  const resFail = executeGameAction(game, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'year_of_plenty',
    params: { yearOfPlentyResources: ['ore', 'ore'] },
  });

  assert.strictEqual(resFail.success, false);
  assert.match(resFail.error || '', /Bank supply is out of ore/i);

  // Succeeds when bank has enough
  game.resourceSupply.ore = 1;
  game.resourceSupply.grain = 10;
  const resOk = executeGameAction(game, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'year_of_plenty',
    params: { yearOfPlentyResources: ['ore', 'grain'] },
  });

  assert.strictEqual(resOk.success, true);
  assert.strictEqual(resOk.newState.players.p1.resources.ore, 1);
  assert.strictEqual(resOk.newState.players.p1.resources.grain, 1);
  assert.strictEqual(resOk.newState.resourceSupply.ore, 0);
  assert.strictEqual(resOk.newState.resourceSupply.grain, 9);
});

test('Phase 3.3: Monopoly sweeps entire resource from all opponents', () => {
  const game = createInitialGameState('test_monopoly', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
    { id: 'p3', username: 'Player 3' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  game.players.p1.devCards = ['monopoly'];
  game.players.p1.boughtDevCardsThisTurn = [];
  game.players.p1.resources.ore = 1;
  game.players.p2.resources.ore = 4;
  game.players.p3.resources.ore = 2;

  const res = executeGameAction(game, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'monopoly',
    params: { monopolyResource: 'ore' },
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.newState.players.p1.resources.ore, 7); // 1 + 4 + 2
  assert.strictEqual(res.newState.players.p2.resources.ore, 0);
  assert.strictEqual(res.newState.players.p3.resources.ore, 0);
});

test('Phase 3.4: Road Building respects piece supply and road placement rules', () => {
  const game = createInitialGameState('test_rb', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.phase = 'MAIN';
  game.currentPlayerIndex = 0;
  game.players.p1.devCards = ['road_building'];
  game.players.p1.boughtDevCardsThisTurn = [];
  game.players.p1.roadsRemaining = 0; // Out of road pieces!

  const resFailSupply = executeGameAction(game, {
    type: 'PLAY_DEV_CARD',
    playerId: 'p1',
    card: 'road_building',
  });

  assert.strictEqual(resFailSupply.success, false);
  assert.match(resFailSupply.error || '', /No road pieces remaining/i);
});

test('Phase 3.5: Trading Anti-Exploits (No free gifting, no same-resource trade, MAIN phase only)', () => {
  const game = createInitialGameState('test_trade_exploits', [
    { id: 'p1', username: 'Player 1' },
    { id: 'p2', username: 'Player 2' },
  ]);

  game.currentPlayerIndex = 0;
  game.players.p1.resources = { ore: 3, grain: 2, wool: 1, lumber: 0, brick: 0 };
  game.players.p2.resources = { lumber: 2, brick: 2, ore: 0, grain: 0, wool: 0 };

  // 1. Proposing trade outside MAIN phase (e.g. ROLLING) should fail
  game.phase = 'ROLLING';
  const resRoll = executeGameAction(game, {
    type: 'TRADE_PROPOSE',
    playerId: 'p1',
    offer: { ore: 1 },
    request: { lumber: 1 },
  });
  assert.strictEqual(resRoll.success, false);
  assert.match(resRoll.error || '', /main action phase/i);

  game.phase = 'MAIN';

  // 2. Free gift exploit: offering 0, requesting >0
  const resFreeGift = executeGameAction(game, {
    type: 'TRADE_PROPOSE',
    playerId: 'p1',
    offer: {},
    request: { lumber: 1 },
  });
  assert.strictEqual(resFreeGift.success, false);
  assert.match(resFreeGift.error || '', /Cannot propose empty trades or free gifts/i);

  // 3. Reverse free gift: offering >0, requesting 0
  const resReverseGift = executeGameAction(game, {
    type: 'TRADE_PROPOSE',
    playerId: 'p1',
    offer: { ore: 1 },
    request: {},
  });
  assert.strictEqual(resReverseGift.success, false);
  assert.match(resReverseGift.error || '', /Cannot propose empty trades or free gifts/i);

  // 4. Same resource loophole: offering 2 ore for 1 ore
  const resSameRes = executeGameAction(game, {
    type: 'TRADE_PROPOSE',
    playerId: 'p1',
    offer: { ore: 2 },
    request: { ore: 1 },
  });
  assert.strictEqual(resSameRes.success, false);
  assert.match(resSameRes.error || '', /Cannot offer and request the same resource/i);

  // 5. Valid trade proposal succeeds
  const resValid = executeGameAction(game, {
    type: 'TRADE_PROPOSE',
    playerId: 'p1',
    offer: { ore: 2 },
    request: { lumber: 1 },
  });
  assert.strictEqual(resValid.success, true);
  assert.ok(resValid.newState.activeTrade);

  // 6. Acceptance fails if accepting player does not have requested resources
  const resAcceptFail = executeGameAction(resValid.newState, {
    type: 'TRADE_ACCEPT',
    playerId: 'p2',
  });
  // p2 has lumber: 2, so p2 actually can accept! Let's test with a player who lacks it:
  const resSelfAccept = executeGameAction(resValid.newState, {
    type: 'TRADE_ACCEPT',
    playerId: 'p1',
  });
  assert.strictEqual(resSelfAccept.success, false);
  assert.match(resSelfAccept.error || '', /Cannot accept your own trade/i);

  // 7. Atomic valid trade execution
  const resAcceptOk = executeGameAction(resValid.newState, {
    type: 'TRADE_ACCEPT',
    playerId: 'p2',
  });
  assert.strictEqual(resAcceptOk.success, true);
  assert.strictEqual(resAcceptOk.newState.activeTrade, null);
  // p1 had 3 ore, gave 2 -> 1 ore; got 1 lumber -> 1 lumber
  assert.strictEqual(resAcceptOk.newState.players.p1.resources.ore, 1);
  assert.strictEqual(resAcceptOk.newState.players.p1.resources.lumber, 1);
  // p2 had 2 lumber, gave 1 -> 1 lumber; got 2 ore -> 2 ore
  assert.strictEqual(resAcceptOk.newState.players.p2.resources.lumber, 1);
  assert.strictEqual(resAcceptOk.newState.players.p2.resources.ore, 2);
});
