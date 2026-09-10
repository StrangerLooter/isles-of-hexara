import assert from 'node:assert';
import test, { describe } from 'node:test';
import { GameRoomManager } from '../src/websocket/gameRoomManager.js';
import { LobbyManager } from '../src/rooms/lobbyManager.js';

describe('Reconnection & Disconnect Grace Policy', () => {
  test('Player reconnects within grace window and state resyncs', () => {
    const mockIo = {
      to: () => ({
        emit: () => {},
      }),
    } as any;

    const lobbyManager = new LobbyManager();
    const roomManager = new GameRoomManager(mockIo, lobbyManager);

    const lobby = lobbyManager.createLobby(
      { playerId: 'p_reconnect', username: 'Reconnect Hero' },
      { scenarioId: 'first_island', targetVictoryPoints: 10, maxPlayers: 3, mode: 'online' }
    );

    const startRes = lobbyManager.startGame(lobby.code, 'p_reconnect');
    const game = roomManager.createGameFromLobby(startRes.lobby!, startRes.players!);

    assert.strictEqual(game.players['p_reconnect'].isConnected, true);

    // 1. Disconnect triggers grace
    roomManager.handlePlayerDisconnect('socket_123', 'p_reconnect', game.id);
    assert.strictEqual(game.players['p_reconnect'].isConnected, false);
    assert.strictEqual(game.players['p_reconnect'].isAi, false);

    // 2. Reconnect within window
    const mockSocket = {
      join: () => {},
      emit: (event: string, payload: any) => {
        if (event === 'server:game_sync') {
          assert.strictEqual(payload.state.id, game.id);
        }
      },
    } as any;

    const reconnected = roomManager.handlePlayerReconnect(game.id, 'p_reconnect', mockSocket);
    assert.strictEqual(reconnected, true);
    assert.strictEqual(game.players['p_reconnect'].isConnected, true);
    assert.strictEqual(game.players['p_reconnect'].isAi, false);
  });
});
