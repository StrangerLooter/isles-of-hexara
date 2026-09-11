import assert from 'node:assert';
import test, { describe } from 'node:test';
import { FriendRepository } from '../src/database/models/Friend.js';

describe('Phase 12: Social System (Friends, Requests, Game Invites)', () => {
  test('List friends and verify presence status', async () => {
    const friends = await FriendRepository.getFriends('default_user');
    assert.ok(Array.isArray(friends));
    assert.strictEqual(friends.length >= 2, true);
    assert.strictEqual(friends.some((f) => f.friendUsername === 'Admiral Vane'), true);
  });

  test('Send friend request and accept', async () => {
    const req = await FriendRepository.sendRequest('user_alice', 'Captain Blackbeard', '🏴‍☠️');
    assert.strictEqual(req.userId, 'user_alice');
    assert.strictEqual(req.friendUsername, 'Captain Blackbeard');
    assert.strictEqual(req.status, 'pending');

    const accepted = await FriendRepository.acceptRequest('user_alice', req.id);
    assert.strictEqual(accepted, true);
  });

  test('Send game invitation to room code and retrieve invites', async () => {
    const invite = await FriendRepository.sendInvite(
      'user_host',
      'Host Captain',
      'user_target',
      'HX7K9B',
      'The First Island'
    );

    assert.strictEqual(invite.fromUsername, 'Host Captain');
    assert.strictEqual(invite.roomCode, 'HX7K9B');
    assert.strictEqual(invite.toUserId, 'user_target');

    const invites = await FriendRepository.getInvites('user_target');
    assert.strictEqual(invites.length >= 1, true);
    assert.strictEqual(invites.some((i) => i.roomCode === 'HX7K9B'), true);
  });
});
