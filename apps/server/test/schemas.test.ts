import assert from 'node:assert';
import test, { describe } from 'node:test';
import {
  buildCitySchema,
  buildRoadSchema,
  buildSettlementSchema,
  buyDevCardSchema,
  chatMessageSchema,
  createGameSchema,
  discardResourcesSchema,
  endTurnSchema,
  joinGameSchema,
  kickSeatSchema,
  leaveGameSchema,
  moveRobberSchema,
  playDevCardSchema,
  rollDiceSchema,
  setReadySchema,
  startGameSchema,
  stealResourceSchema,
  tradeAcceptSchema,
  tradeBankSchema,
  tradeCancelSchema,
  tradeMaritimeSchema,
  tradeProposeSchema,
} from '@hexara/protocol';

describe('Protocol Schemas Validation', () => {
  test('createGameSchema validates correct and default parameters', () => {
    const valid = createGameSchema.safeParse({
      scenarioId: 'first_island',
      targetVictoryPoints: 10,
      maxPlayers: 4,
      mode: 'online',
    });
    assert.strictEqual(valid.success, true);
    if (valid.success) {
      assert.strictEqual(valid.data.targetVictoryPoints, 10);
      assert.strictEqual(valid.data.maxPlayers, 4);
    }

    // Invalid maxPlayers
    const invalidPlayers = createGameSchema.safeParse({
      maxPlayers: 5,
    });
    assert.strictEqual(invalidPlayers.success, false);
  });

  test('joinGameSchema requires either code or gameId', () => {
    const withCode = joinGameSchema.safeParse({ code: 'ABCD23' });
    assert.strictEqual(withCode.success, true);

    const withGameId = joinGameSchema.safeParse({ gameId: 'archipelago_1' });
    assert.strictEqual(withGameId.success, true);

    const empty = joinGameSchema.safeParse({});
    assert.strictEqual(empty.success, false);
  });

  test('setReadySchema and kickSeatSchema', () => {
    const ready = setReadySchema.safeParse({ ready: true, code: 'XYZ123' });
    assert.strictEqual(ready.success, true);

    const kick = kickSeatSchema.safeParse({ seatPlayerId: 'player_2' });
    assert.strictEqual(kick.success, true);

    const invalidKick = kickSeatSchema.safeParse({});
    assert.strictEqual(invalidKick.success, false);
  });

  test('Game action schemas (build, roll, robber, dev cards, trade)', () => {
    // Build Road
    assert.strictEqual(buildRoadSchema.safeParse({ edgeId: 'e_1' }).success, true);
    assert.strictEqual(buildRoadSchema.safeParse({}).success, false);

    // Build Settlement & City
    assert.strictEqual(buildSettlementSchema.safeParse({ vertexId: 'v_1' }).success, true);
    assert.strictEqual(buildCitySchema.safeParse({ vertexId: 'v_2' }).success, true);

    // Move Robber & Steal
    assert.strictEqual(moveRobberSchema.safeParse({ hexId: 'h_1' }).success, true);
    assert.strictEqual(stealResourceSchema.safeParse({ victimId: 'victim_1' }).success, true);

    // Discard
    assert.strictEqual(
      discardResourcesSchema.safeParse({ resources: { lumber: 2, wool: 1 } }).success,
      true
    );

    // Dev Cards
    assert.strictEqual(buyDevCardSchema.safeParse({}).success, true);
    assert.strictEqual(
      playDevCardSchema.safeParse({
        card: 'knight',
        params: { targetHexId: 'h_3', victimId: 'p2' },
      }).success,
      true
    );

    // Trades
    assert.strictEqual(
      tradeBankSchema.safeParse({ giving: 'wool', receiving: 'ore' }).success,
      true
    );
    assert.strictEqual(
      tradeMaritimeSchema.safeParse({ giving: 'grain', receiving: 'brick' }).success,
      true
    );
    assert.strictEqual(
      tradeProposeSchema.safeParse({
        offer: { lumber: 1 },
        request: { brick: 1 },
      }).success,
      true
    );
    assert.strictEqual(tradeAcceptSchema.safeParse({}).success, true);
    assert.strictEqual(tradeCancelSchema.safeParse({}).success, true);

    // End Turn & Chat
    assert.strictEqual(endTurnSchema.safeParse({}).success, true);
    assert.strictEqual(chatMessageSchema.safeParse({ message: 'Well played!' }).success, true);
    assert.strictEqual(chatMessageSchema.safeParse({ message: '' }).success, false);
  });
});
