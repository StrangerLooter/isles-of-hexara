import assert from 'node:assert';
import test, { describe } from 'node:test';
import { signJwt, verifyJwt } from '../src/auth/jwt.js';
import { ProfileRepository } from '../src/database/models/Profile.js';
import { UserRepository } from '../src/database/models/User.js';

describe('Auth & JWT & Profile Progression', () => {
  test('JWT signing and verification with expiration', () => {
    const token = signJwt({ sub: 'user_123', name: 'Captain Test', guest: true }, 3600);
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.split('.').length, 3);

    const decoded = verifyJwt(token);
    assert.notStrictEqual(decoded, null);
    assert.strictEqual(decoded?.sub, 'user_123');
    assert.strictEqual(decoded?.name, 'Captain Test');
    assert.strictEqual(decoded?.guest, true);

    // Invalid signature token
    const tampered = token.slice(0, -4) + 'abcd';
    assert.strictEqual(verifyJwt(tampered), null);

    // Expired token
    const expiredToken = signJwt({ sub: 'user_exp', name: 'Old' }, -10);
    assert.strictEqual(verifyJwt(expiredToken), null);
  });

  test('Guest User creation and Profile progression curve', async () => {
    const user = await UserRepository.createGuest('TestSailor');
    assert.strictEqual(user.username, 'TestSailor');
    assert.strictEqual(user.isGuest, true);

    const initialProfile = await ProfileRepository.createOrUpdate({
      userId: user._id,
      displayName: 'TestSailor',
      avatarId: 'avatar_captain',
      level: 1,
      experience: 0,
      gamesPlayed: 0,
      wins: 0,
      totalVictoryPoints: 0,
    });

    assert.strictEqual(initialProfile.level, 1);
    assert.strictEqual(initialProfile.experience, 0);

    // Win a game with 10 VP: 10 * 50 + 200 = 700 XP
    const afterWin = await ProfileRepository.updateStatsAfterGame(user._id, {
      won: true,
      victoryPoints: 10,
    });

    assert.strictEqual(afterWin?.wins, 1);
    assert.strictEqual(afterWin?.gamesPlayed, 1);
    assert.strictEqual(afterWin?.experience, 700);
    assert.strictEqual(afterWin?.level, 1);

    // Win another game with 10 VP: 700 + 700 = 1400 XP -> Level 2
    const afterSecondWin = await ProfileRepository.updateStatsAfterGame(user._id, {
      won: true,
      victoryPoints: 10,
    });

    assert.strictEqual(afterSecondWin?.wins, 2);
    assert.strictEqual(afterSecondWin?.experience, 1400);
    assert.strictEqual(afterSecondWin?.level, 2);
  });

  test('Demo account seeding creates Captain Jack, Lady Eleanor, and Master Eldon', async () => {
    const { seedDemoAccounts, DEMO_ACCOUNTS } = await import('../src/database/seedDemoAccounts.js');
    await seedDemoAccounts();

    for (const demo of DEMO_ACCOUNTS) {
      const user = await UserRepository.findByEmailOrUsername(demo.username);
      assert.notStrictEqual(user, null);
      assert.strictEqual(user?.email, demo.email);

      const profile = await ProfileRepository.findByUserId(user!._id);
      assert.notStrictEqual(profile, null);
      assert.strictEqual(profile?.level, demo.level);
      assert.strictEqual(profile?.wins, demo.wins);
    }
  });
});
