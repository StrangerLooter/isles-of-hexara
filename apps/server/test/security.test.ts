import assert from 'node:assert';
import test, { describe } from 'node:test';
import { createInitialGameState, executeGameAction } from '@hexara/game-core';
import { GameRoomManager } from '../src/websocket/gameRoomManager.js';
import { SocketRateLimiter } from '../src/websocket/rateLimiter.js';

describe('Phase 15: Security & Anti-Cheat Server Audit', () => {
  test('Security 1: Opponent development cards are sanitized and hidden as unknown', () => {
    const manager = new GameRoomManager(null as any);
    const game = createInitialGameState('sec_game_1', [
      { id: 'player_a', username: 'Player A' },
      { id: 'player_b', username: 'Player B' },
    ]);

    // Give secret cards to both players
    game.players.player_a.devCards = ['knight', 'monopoly'];
    game.players.player_b.devCards = ['victory_point', 'road_building'];

    // Sanitize for Player A (should see own cards, but Player B cards masked)
    const sanitizedForA = manager.sanitizeStateForPlayer(game, 'player_a');
    assert.deepStrictEqual(sanitizedForA.players.player_a.devCards, ['knight', 'monopoly']);
    assert.deepStrictEqual(sanitizedForA.players.player_b.devCards, ['unknown', 'unknown']);
    assert.strictEqual(sanitizedForA.players.player_b.devCards.length, 2);

    // Sanitize for Player B (should see own cards, but Player A cards masked)
    const sanitizedForB = manager.sanitizeStateForPlayer(game, 'player_b');
    assert.deepStrictEqual(sanitizedForB.players.player_b.devCards, ['victory_point', 'road_building']);
    assert.deepStrictEqual(sanitizedForB.players.player_a.devCards, ['unknown', 'unknown']);
  });

  test('Security 2: Server-authoritative validation prevents illegal action forgery', () => {
    const game = createInitialGameState('sec_game_2', [
      { id: 'p1', username: 'Player 1' },
      { id: 'p2', username: 'Player 2' },
    ]);

    game.phase = 'ROLLING';
    game.currentPlayerIndex = 0; // p1 turn

    // Player 2 attempts to roll dice when it is not their turn
    const illegalTurn = executeGameAction(game, {
      type: 'ROLL_DICE',
      playerId: 'p2',
    });
    assert.strictEqual(illegalTurn.success, false);
    assert.match(illegalTurn.error || '', /Not your turn/i);

    // Player 1 attempts to build city without resources or settlement
    const illegalBuild = executeGameAction(game, {
      type: 'BUILD_CITY',
      playerId: 'p1',
      vertexId: 'v_0',
    });
    assert.strictEqual(illegalBuild.success, false);

    // Player 1 attempts exploit trade (offering 0, requesting 1) during MAIN phase
    game.phase = 'MAIN';
    const exploitTrade = executeGameAction(game, {
      type: 'TRADE_PROPOSE',
      playerId: 'p1',
      offer: {},
      request: { ore: 1 },
    });
    assert.strictEqual(exploitTrade.success, false);
    assert.match(exploitTrade.error || '', /empty trades|free gifts/i);
  });

  test('Security 3: Rate Limiter stops message and action flooding', () => {
    const limiter = new SocketRateLimiter();
    const socketId = 'sock_flooder';

    // First 5 actions allowed with limit 5
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(limiter.checkActionLimit(socketId, 5), true);
    }

    // 6th action blocked
    assert.strictEqual(limiter.checkActionLimit(socketId, 5), false);
    limiter.cleanup(socketId);
  });
});
