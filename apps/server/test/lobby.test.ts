import assert from 'node:assert';
import test, { describe } from 'node:test';
import { LobbyManager } from '../src/rooms/lobbyManager.js';
import { generateUniqueRoomCode, ROOM_CODE_ALPHABET } from '../src/rooms/roomCodeGenerator.js';

describe('Lobby & Room Code Management', () => {
  test('generateUniqueRoomCode produces valid 6-char codes from unambiguous alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateUniqueRoomCode(() => false);
      assert.strictEqual(code.length, 6);
      for (const char of code) {
        assert.strictEqual(ROOM_CODE_ALPHABET.includes(char), true);
        // Ensure no ambiguous chars: 0, O, 1, I, L
        assert.strictEqual(['0', 'O', '1', 'I', 'L'].includes(char), false);
      }
    }
  });

  test('Lobby creation, join, ready, and capacity enforcement', () => {
    const manager = new LobbyManager();

    // 1. Create Lobby
    const lobby = manager.createLobby(
      { playerId: 'host_1', username: 'Host Player' },
      {
        scenarioId: 'first_island',
        targetVictoryPoints: 10,
        maxPlayers: 3,
        mode: 'online',
      }
    );

    assert.strictEqual(lobby.seats.length, 1);
    assert.strictEqual(lobby.hostId, 'host_1');
    assert.strictEqual(lobby.status, 'waiting');

    // 2. Join Player 2
    const joinP2 = manager.joinLobby(lobby.code, { playerId: 'p_2', username: 'Player Two' });
    assert.strictEqual(joinP2.success, true);
    assert.strictEqual(joinP2.lobby?.seats.length, 2);

    // 3. Ready Toggle
    const readyRes = manager.setReady(lobby.code, 'p_2', true);
    assert.strictEqual(readyRes.success, true);
    assert.strictEqual(readyRes.lobby?.seats.find((s) => s.playerId === 'p_2')?.ready, true);

    // 4. Join Player 3 (Max capacity for 3-player lobby)
    const joinP3 = manager.joinLobby(lobby.code, { playerId: 'p_3', username: 'Player Three' });
    assert.strictEqual(joinP3.success, true);
    assert.strictEqual(joinP3.lobby?.seats.length, 3);

    // 5. Join Player 4 should fail (ROOM_FULL)
    const joinP4 = manager.joinLobby(lobby.code, { playerId: 'p_4', username: 'Player Four' });
    assert.strictEqual(joinP4.success, false);
    assert.strictEqual(joinP4.error, 'ROOM_FULL');

    // 6. Kick Seat (Host only)
    const kickByNonHost = manager.kickSeat(lobby.code, 'p_2', 'p_3');
    assert.strictEqual(kickByNonHost.success, false);
    assert.strictEqual(kickByNonHost.error, 'HOST_ONLY_ACTION');

    const kickByHost = manager.kickSeat(lobby.code, 'host_1', 'p_3');
    assert.strictEqual(kickByHost.success, true);
    assert.strictEqual(kickByHost.lobby?.seats.length, 2);

    // 7. Start Game fills remaining seat with AI up to maxPlayers (3)
    const startRes = manager.startGame(lobby.code, 'host_1');
    assert.strictEqual(startRes.success, true);
    assert.strictEqual(startRes.players?.length, 3);
    assert.strictEqual(startRes.players?.filter((p) => p.isAi).length, 1);
  });
});
