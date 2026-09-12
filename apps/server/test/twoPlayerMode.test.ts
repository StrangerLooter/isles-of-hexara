import assert from 'node:assert';
import test, { describe } from 'node:test';
import { LobbyManager } from '../src/rooms/lobbyManager.js';
import { createInitialGameState, executeGameAction } from '@hexara/game-core';

describe('Two-Player Mode Full Lifecycle', () => {
  test('Two-player online lobby creation, capacity enforcement, and game launch', () => {
    const manager = new LobbyManager();

    // 1. Host creates a 2-player lobby
    const lobby = manager.createLobby(
      { playerId: 'p1_host', username: 'Captain Alice' },
      {
        scenarioId: 'first_island',
        targetVictoryPoints: 10,
        maxPlayers: 2,
        mode: 'online',
      }
    );

    assert.strictEqual(lobby.settings.maxPlayers, 2);
    assert.strictEqual(lobby.seats.length, 1);
    assert.strictEqual(lobby.hostId, 'p1_host');

    // 2. Joining 2nd player succeeds
    const joinP2 = manager.joinLobby(lobby.code, { playerId: 'p2_guest', username: 'First Mate Bob' });
    assert.strictEqual(joinP2.success, true);
    assert.strictEqual(joinP2.lobby?.seats.length, 2);

    // 3. Joining 3rd player fails due to 2-player limit
    const joinP3 = manager.joinLobby(lobby.code, { playerId: 'p3_intruder', username: 'Intruder Charlie' });
    assert.strictEqual(joinP3.success, false);
    assert.strictEqual(joinP3.error, 'ROOM_FULL');

    // 4. Host cannot start if guest is not ready
    const startUnready = manager.startGame(lobby.code, 'p1_host');
    assert.strictEqual(startUnready.success, false);
    assert.strictEqual(startUnready.error, 'NOT_ALL_PLAYERS_READY');

    // 5. Guest marks ready
    const readyRes = manager.setReady(lobby.code, 'p2_guest', true);
    assert.strictEqual(readyRes.success, true);

    // 6. Host starts game
    const startRes = manager.startGame(lobby.code, 'p1_host');
    assert.strictEqual(startRes.success, true);
    assert.strictEqual(startRes.players?.length, 2);
    assert.strictEqual(startRes.players[0].id, 'p1_host');
    assert.strictEqual(startRes.players[1].id, 'p2_guest');
    assert.strictEqual(startRes.players.every((p) => !p.isAi), true);
  });

  test('Two-player solo lobby fills exactly 1 AI opponent (total 2 players)', () => {
    const manager = new LobbyManager();

    const lobby = manager.createLobby(
      { playerId: 'solo_player', username: 'Solo Voyager' },
      {
        scenarioId: 'first_island',
        targetVictoryPoints: 10,
        maxPlayers: 2,
        mode: 'solo',
      }
    );

    assert.strictEqual(lobby.settings.maxPlayers, 2);
    assert.strictEqual(lobby.seats.length, 1);

    // Starting solo match fills remaining seat with 1 AI bot
    const startRes = manager.startGame(lobby.code, 'solo_player');
    assert.strictEqual(startRes.success, true);
    assert.strictEqual(startRes.players?.length, 2);
    assert.strictEqual(startRes.players[0].id, 'solo_player');
    assert.strictEqual(startRes.players[0].isAi, false);
    assert.strictEqual(startRes.players[1].isAi, true);
    assert.strictEqual(startRes.lobby?.seats.length, 2);
  });

  test('Two-player snake draft setup rounds and turn alternation', () => {
    const players = [
      { id: 'player_a', username: 'Alice' },
      { id: 'player_b', username: 'Bob' },
    ];

    let state = createInitialGameState('game_2p_test', players, 42);

    assert.strictEqual(state.playerOrder.length, 2);
    assert.strictEqual(state.phase, 'SETUP_ROUND_1');
    assert.strictEqual(state.currentPlayerIndex, 0); // Alice

    // Setup Round 1: Alice places settlement & road
    const vertexIds = Object.keys(state.board.vertices);

    // Alice settlement
    const v1 = vertexIds[0];
    const a1 = executeGameAction(state, { type: 'BUILD_SETTLEMENT', playerId: 'player_a', vertexId: v1 });
    assert.strictEqual(a1.success, true);
    state = a1.newState;

    // Alice road adjacent to v1
    const v1Edges = state.board.vertices[v1].adjacentEdgeIds;
    const e1 = v1Edges[0];
    const a2 = executeGameAction(state, { type: 'BUILD_ROAD', playerId: 'player_a', edgeId: e1 });
    assert.strictEqual(a2.success, true);
    state = a2.newState;

    // Turn should advance to Bob in Round 1
    assert.strictEqual(state.phase, 'SETUP_ROUND_1');
    assert.strictEqual(state.currentPlayerIndex, 1); // Bob

    // Bob places settlement & road far from v1
    const v2 = vertexIds.find((vid) => {
      const v = state.board.vertices[vid];
      return vid !== v1 && !v.adjacentVertexIds.includes(v1);
    })!;

    const b1 = executeGameAction(state, { type: 'BUILD_SETTLEMENT', playerId: 'player_b', vertexId: v2 });
    assert.strictEqual(b1.success, true);
    state = b1.newState;

    const v2Edges = state.board.vertices[v2].adjacentEdgeIds;
    const e2 = v2Edges[0];
    const b2 = executeGameAction(state, { type: 'BUILD_ROAD', playerId: 'player_b', edgeId: e2 });
    assert.strictEqual(b2.success, true);
    state = b2.newState;

    // Snake draft transition: Setup Round 2 begins with Bob!
    assert.strictEqual(state.phase, 'SETUP_ROUND_2');
    assert.strictEqual(state.currentPlayerIndex, 1); // Bob goes first in Round 2

    // Bob places 2nd settlement & road
    const v3 = vertexIds.find((vid) => {
      const v = state.board.vertices[vid];
      return (
        vid !== v1 &&
        vid !== v2 &&
        !v.adjacentVertexIds.includes(v1) &&
        !v.adjacentVertexIds.includes(v2)
      );
    })!;

    const b3 = executeGameAction(state, { type: 'BUILD_SETTLEMENT', playerId: 'player_b', vertexId: v3 });
    assert.strictEqual(b3.success, true);
    state = b3.newState;

    const v3Edges = state.board.vertices[v3].adjacentEdgeIds;
    const e3 = v3Edges[0];
    const b4 = executeGameAction(state, { type: 'BUILD_ROAD', playerId: 'player_b', edgeId: e3 });
    assert.strictEqual(b4.success, true);
    state = b4.newState;

    // Round 2 now passes back to Alice
    assert.strictEqual(state.phase, 'SETUP_ROUND_2');
    assert.strictEqual(state.currentPlayerIndex, 0); // Alice

    // Alice places 2nd settlement & road
    const v4 = vertexIds.find((vid) => {
      const v = state.board.vertices[vid];
      return (
        vid !== v1 &&
        vid !== v2 &&
        vid !== v3 &&
        !v.adjacentVertexIds.includes(v1) &&
        !v.adjacentVertexIds.includes(v2) &&
        !v.adjacentVertexIds.includes(v3)
      );
    })!;

    const a3 = executeGameAction(state, { type: 'BUILD_SETTLEMENT', playerId: 'player_a', vertexId: v4 });
    assert.strictEqual(a3.success, true);
    state = a3.newState;

    const v4Edges = state.board.vertices[v4].adjacentEdgeIds;
    const e4 = v4Edges[0];
    const a4 = executeGameAction(state, { type: 'BUILD_ROAD', playerId: 'player_a', edgeId: e4 });
    assert.strictEqual(a4.success, true);
    state = a4.newState;

    // Setup is complete! Regular game begins, Alice's turn 1
    assert.strictEqual(state.phase, 'ROLLING');
    assert.strictEqual(state.currentPlayerIndex, 0);
    assert.strictEqual(state.turnNumber, 1);

    // Roll dice for Alice
    const rollRes = executeGameAction(state, { type: 'ROLL_DICE', playerId: 'player_a' });
    assert.strictEqual(rollRes.success, true);
    state = rollRes.newState;

    // Check turn passing to Bob
    if (state.phase !== 'ROBBER_DISCARD' && state.phase !== 'ROBBER_PLACEMENT') {
      const endRes = executeGameAction(state, { type: 'END_TURN', playerId: 'player_a' });
      assert.strictEqual(endRes.success, true);
      state = endRes.newState;

      // Now Bob's turn!
      assert.strictEqual(state.currentPlayerIndex, 1);
      assert.strictEqual(state.phase, 'ROLLING');
    }
  });
});
