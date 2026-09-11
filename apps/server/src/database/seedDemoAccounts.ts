import crypto from 'node:crypto';
import { logger } from '../logging/logger.js';
import { ProfileRepository } from './models/Profile.js';
import { UserRepository } from './models/User.js';

export const DEMO_ACCOUNTS = [
  {
    username: 'Captain Jack',
    email: 'captain@hexara.com',
    password: 'password123',
    avatarId: 'avatar_captain',
    level: 5,
    experience: 2400,
    gamesPlayed: 20,
    wins: 12,
    totalVictoryPoints: 165,
  },
  {
    username: 'Lady Eleanor',
    email: 'voyager@hexara.com',
    password: 'password123',
    avatarId: 'avatar_queen',
    level: 3,
    experience: 1200,
    gamesPlayed: 10,
    wins: 5,
    totalVictoryPoints: 82,
  },
  {
    username: 'Master Eldon',
    email: 'sailor@hexara.com',
    password: 'password123',
    avatarId: 'avatar_wizard',
    level: 2,
    experience: 600,
    gamesPlayed: 6,
    wins: 2,
    totalVictoryPoints: 48,
  },
];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_hexara_salt').digest('hex');
}

export async function seedDemoAccounts(): Promise<void> {
  try {
    for (const demo of DEMO_ACCOUNTS) {
      let user = await UserRepository.findByEmailOrUsername(demo.username);
      if (!user) {
        user = await UserRepository.create({
          username: demo.username,
          email: demo.email,
          passwordHash: hashPassword(demo.password),
          isGuest: false,
        });
      }

      await ProfileRepository.createOrUpdate({
        userId: user._id,
        displayName: demo.username,
        avatarId: demo.avatarId,
        level: demo.level,
        experience: demo.experience,
        gamesPlayed: demo.gamesPlayed,
        wins: demo.wins,
        totalVictoryPoints: demo.totalVictoryPoints,
      });
    }
    logger.info('Demo accounts seeded successfully (Captain Jack, Lady Eleanor, Master Eldon)');
  } catch (err) {
    logger.warn({ err }, 'Failed to seed demo accounts (non-critical)');
  }
}
