import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { GameRecordRepository } from '../database/models/GameRecord.js';
import { ProfileRepository } from '../database/models/Profile.js';
import { UserRepository } from '../database/models/User.js';

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const apiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString(), game: 'Isles of Hexara' };
  });

  fastify.post('/api/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    const { username, email, password } = parsed.data;
    const existing = await UserRepository.findByUsername(username);
    if (existing) {
      return reply.status(409).send({ error: 'Username already taken' });
    }

    const user = await UserRepository.create({
      username,
      email,
      passwordHash: `mock_hash_${password}`,
    });

    const profile = await ProfileRepository.createOrUpdate({
      userId: user._id,
      displayName: username,
      avatarId: 'avatar_captain',
      level: 1,
      experience: 0,
      gamesPlayed: 0,
      wins: 0,
      totalVictoryPoints: 0,
    });

    return reply.status(201).send({
      user: { id: user._id, username: user.username, email: user.email },
      profile,
    });
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    const { username } = parsed.data;
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      // For frictionless dev experience, auto-register on first login!
      const newUser = await UserRepository.create({
        username,
        email: `${username.toLowerCase()}@hexara.realm`,
        passwordHash: 'mock_pass',
      });
      const profile = await ProfileRepository.createOrUpdate({
        userId: newUser._id,
        displayName: username,
        avatarId: 'avatar_captain',
        level: 1,
        experience: 0,
        gamesPlayed: 0,
        wins: 0,
        totalVictoryPoints: 0,
      });
      return reply.send({
        token: `token_${newUser._id}`,
        user: { id: newUser._id, username: newUser.username },
        profile,
      });
    }

    const profile = await ProfileRepository.findByUserId(user._id);
    return reply.send({
      token: `token_${user._id}`,
      user: { id: user._id, username: user.username },
      profile,
    });
  });

  fastify.get('/api/games/history', async () => {
    const records = await GameRecordRepository.listRecent(10);
    return { records };
  });
};
