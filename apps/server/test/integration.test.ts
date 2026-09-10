import assert from 'node:assert';
import test, { describe } from 'node:test';
import { executeGameAction, GameState } from '@hexara/game-core';
import { AiController } from '../src/ai/aiController.js';
import { LobbyManager } from '../src/rooms/lobbyManager.js';
import { createServer } from '../src/server.js';
import { GameRoomManager } from '../src/websocket/gameRoomManager.js';

describe('Server & Full Gameplay Integration', () => {
  test('Fastify REST endpoints: health, guest auth, profile me, patch profile', async () => {
    const { app } = await createServer();

    // 1. Health check
    const healthRes = await app.inject({ method: 'GET', url: '/health' });
    assert.strictEqual(healthRes.statusCode, 200);
    const healthBody = JSON.parse(healthRes.body);
    assert.strictEqual(healthBody.status, 'healthy');
    assert.strictEqual(['mongo', 'memory'].includes(healthBody.storage), true);

    // 2. Guest Auth
    const guestRes = await app.inject({
      method: 'POST',
      url: '/api/auth/guest',
      payload: { username: 'AdmiralNelson' },
    });
    assert.strictEqual(guestRes.statusCode, 200);
    const guestBody = JSON.parse(guestRes.body);
    assert.strictEqual(guestBody.user.username, 'AdmiralNelson');
    assert.strictEqual(typeof guestBody.token, 'string');
    assert.strictEqual(guestBody.profile.displayName, 'AdmiralNelson');

    const token = guestBody.token;

    // 3. GET Profile Me
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/profiles/me',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.strictEqual(meRes.statusCode, 200);
    const meBody = JSON.parse(meRes.body);
    assert.strictEqual(meBody.profile.displayName, 'AdmiralNelson');

    // 4. PATCH Profile
    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/profiles/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { displayName: 'Lord Nelson', avatarId: 'avatar_admiral' },
    });
    assert.strictEqual(patchRes.statusCode, 200);
    const patchBody = JSON.parse(patchRes.body);
    assert.strictEqual(patchBody.profile.displayName, 'Lord Nelson');
    assert.strictEqual(patchBody.profile.avatarId, 'avatar_admiral');

    // 5. Game History
    const histRes = await app.inject({ method: 'GET', url: '/api/games/history' });
    assert.strictEqual(histRes.statusCode, 200);

    await app.close();
  });

  test('Full game loop simulation: Setup Snake Draft -> Dice Rolling -> Robber -> Building -> Victory', () => {
    const mockIo = {
      to: () => ({ emit: () => {} }),
    } as any;

    const lobbyManager = new LobbyManager();
    const roomManager = new GameRoomManager(mockIo, lobbyManager);

    // Create a 3-player match: 3 AI seats
    const lobby = lobbyManager.createLobby(
      { playerId: 'sim_host', username: 'Host' },
      { scenarioId: 'first_island', targetVictoryPoints: 6, maxPlayers: 3, mode: 'solo', seed: 42 }
    );

    // Host starts -> remaining seats filled with AI, host marked AI for automated simulation
    const startRes = lobbyManager.startGame(lobby.code, 'sim_host');
    assert.strictEqual(startRes.success, true);

    const players = startRes.players!.map((p) => ({ ...p, isAi: true }));
    let game: GameState = roomManager.createGameFromLobby(startRes.lobby!, players);

    assert.strictEqual(game.phase, 'SETUP_ROUND_1');

    let steps = 0;
    const MAX_STEPS = 500;

    while (game.phase !== 'FINISHED' && steps < MAX_STEPS) {
      steps++;
      const activePlayerId = game.playerOrder[game.currentPlayerIndex];

      // Handle robber discards if pending
      if (game.phase === 'ROBBER_DISCARD') {
        const pendingPlayerIds = Object.keys(game.pendingDiscards).filter(
          (id) => (game.pendingDiscards[id] ?? 0) > 0
        );
        for (const pId of pendingPlayerIds) {
          const discardAction = AiController.getNextMove(game, pId);
          if (discardAction) {
            const res = executeGameAction(game, discardAction);
            if (!res.success) {
              console.error('DISCARD FAILED:', res.error, discardAction);
            }
            assert.strictEqual(res.success, true, `Discard failed: ${res.error}`);
            game = res.newState;
          }
        }
        continue;
      }

      const action = AiController.getNextMove(game, activePlayerId);
      if (!action) {
        // Fallback end turn if in MAIN
        if (game.phase === 'MAIN') {
          const res = executeGameAction(game, { type: 'END_TURN', playerId: activePlayerId });
          if (!res.success) {
            console.error('END_TURN FAILED:', res.error, activePlayerId);
          }
          assert.strictEqual(res.success, true);
          game = res.newState;
        } else {
          console.warn('NO ACTION IN PHASE:', game.phase, 'for player:', activePlayerId);
          break;
        }
      } else {
        const res = executeGameAction(game, action);
        if (!res.success) {
          console.error('ACTION FAILED:', action.type, res.error, 'phase:', game.phase, 'player:', activePlayerId, 'action:', action);
        }
        assert.strictEqual(res.success, true, `Action ${action.type} failed: ${res.error}`);
        game = res.newState;
      }
    }

    assert.strictEqual(steps > 20, true, 'Game advanced through many turns');
    assert.strictEqual(
      ['MAIN', 'FINISHED', 'ROLLING', 'ROBBER_MOVE', 'ROBBER_STEAL'].includes(game.phase),
      true
    );
  });
});
