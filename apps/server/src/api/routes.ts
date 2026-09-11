import crypto from 'node:crypto';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { signJwt, verifyJwt } from '../auth/jwt.js';
import { GameRecordRepository } from '../database/models/GameRecord.js';
import { ProfileRepository } from '../database/models/Profile.js';
import { UserRepository } from '../database/models/User.js';
import { FriendRepository } from '../database/models/Friend.js';
import { DEMO_ACCOUNTS, seedDemoAccounts } from '../database/seedDemoAccounts.js';
import { isMongoConnected } from '../database/mongoClient.js';

const guestAuthSchema = z.object({
  username: z.string().min(3).max(24),
  avatarId: z.string().optional(),
});

const registerAuthSchema = z.object({
  username: z.string().min(3).max(24),
  email: z.string().email(),
  password: z.string().min(6),
  avatarId: z.string().optional(),
});

const loginAuthSchema = z.object({
  emailOrUsername: z.string().min(3),
  password: z.string().min(1),
});

const patchProfileSchema = z.object({
  displayName: z.string().min(1).max(24).optional(),
  avatarId: z.string().min(1).max(50).optional(),
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_hexara_salt').digest('hex');
}

function extractToken(request: any): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (request.query && typeof request.query.token === 'string') {
    return request.query.token;
  }
  return null;
}

export const apiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 1. Health Check
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      storage: isMongoConnected() ? 'mongo' : 'memory',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      game: 'Isles of Hexara',
    };
  });

  // 2. Guest Login / Account Creation
  fastify.post('/api/auth/guest', async (request, reply) => {
    const parsed = guestAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'INVALID_PAYLOAD',
        message: 'Username must be between 3 and 24 characters',
      });
    }

    const { username, avatarId } = parsed.data;
    let user = await UserRepository.findByUsername(username);
    if (!user) {
      user = await UserRepository.createGuest(username);
    }

    let profile = await ProfileRepository.findByUserId(user._id);
    if (!profile) {
      profile = await ProfileRepository.createOrUpdate({
        userId: user._id,
        displayName: username,
        avatarId: avatarId || 'avatar_captain',
        level: 1,
        experience: 0,
        gamesPlayed: 0,
        wins: 0,
        totalVictoryPoints: 0,
      });
    } else if (avatarId && profile.avatarId !== avatarId) {
      profile = await ProfileRepository.createOrUpdate({
        ...profile,
        avatarId,
      });
    }

    const token = signJwt({
      sub: user._id,
      name: user.username,
      guest: true,
    });

    return reply.status(200).send({
      token,
      user: { id: user._id, username: user.username },
      profile,
    });
  });

  // 2b. User Registration
  fastify.post('/api/auth/register', async (request, reply) => {
    const parsed = registerAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'INVALID_PAYLOAD',
        message: parsed.error.issues[0]?.message || 'Invalid registration details',
      });
    }

    const { username, email, password, avatarId } = parsed.data;
    const existing = await UserRepository.findByEmailOrUsername(username);
    if (existing) {
      return reply.status(409).send({
        error: 'USERNAME_TAKEN',
        message: 'A voyager with this username or email already exists',
      });
    }

    const passwordHash = hashPassword(password);
    const user = await UserRepository.create({
      username,
      email,
      passwordHash,
      isGuest: false,
    });

    const profile = await ProfileRepository.createOrUpdate({
      userId: user._id,
      displayName: username,
      avatarId: avatarId || 'avatar_captain',
      level: 1,
      experience: 0,
      gamesPlayed: 0,
      wins: 0,
      totalVictoryPoints: 0,
    });

    const token = signJwt({
      sub: user._id,
      name: user.username,
      guest: false,
    });

    return reply.status(201).send({
      token,
      user: { id: user._id, username: user.username, email: user.email },
      profile,
    });
  });

  // 2c. User Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const parsed = loginAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'INVALID_PAYLOAD',
        message: 'Please provide valid credentials',
      });
    }

    const { emailOrUsername, password } = parsed.data;
    const user = await UserRepository.findByEmailOrUsername(emailOrUsername);
    if (!user || !user.passwordHash) {
      return reply.status(401).send({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username/email or password',
      });
    }

    const expectedHash = hashPassword(password);
    if (user.passwordHash !== expectedHash) {
      return reply.status(401).send({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username/email or password',
      });
    }

    let profile = await ProfileRepository.findByUserId(user._id);
    if (!profile) {
      profile = await ProfileRepository.createOrUpdate({
        userId: user._id,
        displayName: user.username,
        avatarId: 'avatar_captain',
        level: 1,
        experience: 0,
        gamesPlayed: 0,
        wins: 0,
        totalVictoryPoints: 0,
      });
    }

    const token = signJwt({
      sub: user._id,
      name: user.username,
      guest: false,
    });

    return reply.status(200).send({
      token,
      user: { id: user._id, username: user.username, email: user.email },
      profile,
    });
  });

  // 3. Get Current User Profile
  fastify.get('/api/profiles/me', async (request, reply) => {
    const token = extractToken(request);
    if (!token) {
      return reply.status(401).send({ error: 'UNAUTHENTICATED', message: 'Missing token' });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return reply.status(401).send({ error: 'INVALID_TOKEN', message: 'Token is invalid or expired' });
    }

    let profile = await ProfileRepository.findByUserId(decoded.sub);
    if (!profile) {
      profile = await ProfileRepository.createOrUpdate({
        userId: decoded.sub,
        displayName: decoded.name,
        avatarId: 'avatar_captain',
        level: 1,
        experience: 0,
        gamesPlayed: 0,
        wins: 0,
        totalVictoryPoints: 0,
      });
    }

    return reply.send({ profile });
  });

  // 4. Update Profile
  fastify.patch('/api/profiles/me', async (request, reply) => {
    const token = extractToken(request);
    if (!token) {
      return reply.status(401).send({ error: 'UNAUTHENTICATED', message: 'Missing token' });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return reply.status(401).send({ error: 'INVALID_TOKEN', message: 'Token is invalid or expired' });
    }

    const parsed = patchProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD', message: parsed.error.message });
    }

    const existing = await ProfileRepository.findByUserId(decoded.sub);
    const updated = await ProfileRepository.createOrUpdate({
      userId: decoded.sub,
      displayName: parsed.data.displayName ?? existing?.displayName ?? decoded.name,
      avatarId: parsed.data.avatarId ?? existing?.avatarId ?? 'avatar_captain',
      level: existing?.level ?? 1,
      experience: existing?.experience ?? 0,
      gamesPlayed: existing?.gamesPlayed ?? 0,
      wins: existing?.wins ?? 0,
      totalVictoryPoints: existing?.totalVictoryPoints ?? 0,
    });

    return reply.send({ profile: updated });
  });

  // 4b. Demo Account Sign In (Phase 11.3)
  fastify.post('/api/auth/demo', async (request, reply) => {
    const body = (request.body as { account?: string }) || {};
    const accountKey = (body.account || 'captain').toLowerCase();
    const demo = DEMO_ACCOUNTS.find(
      (d) => d.username.toLowerCase().includes(accountKey) || d.email.toLowerCase().includes(accountKey)
    ) || DEMO_ACCOUNTS[0];

    await seedDemoAccounts();
    const user = await UserRepository.findByEmailOrUsername(demo.username);
    if (!user) {
      return reply.status(500).send({ error: 'DEMO_SEED_ERROR', message: 'Failed to seed demo user' });
    }

    const profile = await ProfileRepository.findByUserId(user._id);
    const token = signJwt({
      sub: user._id,
      name: user.username,
      guest: false,
    });

    return reply.status(200).send({
      token,
      user: { id: user._id, username: user.username, email: user.email },
      profile,
    });
  });

  // 4c. Social: Friends & Presence (Phase 12)
  fastify.get('/api/social/friends', async (request, reply) => {
    const token = extractToken(request);
    let userId = 'default_user';
    if (token) {
      const decoded = verifyJwt(token);
      if (decoded) userId = decoded.sub;
    }

    const friends = await FriendRepository.getFriends(userId);
    return reply.send({ friends });
  });

  fastify.post('/api/social/friends/request', async (request, reply) => {
    const token = extractToken(request);
    let userId = 'default_user';
    if (token) {
      const decoded = verifyJwt(token);
      if (decoded) userId = decoded.sub;
    }

    const body = request.body as { username?: string; avatar?: string };
    if (!body?.username) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD', message: 'Username required' });
    }

    const rel = await FriendRepository.sendRequest(userId, body.username, body.avatar || '⚓');
    return reply.status(201).send({ request: rel });
  });

  fastify.post('/api/social/invite', async (request, reply) => {
    const token = extractToken(request);
    let userId = 'default_user';
    let username = 'Captain Voyager';
    if (token) {
      const decoded = verifyJwt(token);
      if (decoded) {
        userId = decoded.sub;
        username = decoded.name;
      }
    }

    const body = request.body as { toUserId: string; roomCode: string; scenarioName?: string };
    if (!body?.toUserId || !body?.roomCode) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD', message: 'toUserId and roomCode required' });
    }

    const invite = await FriendRepository.sendInvite(
      userId,
      username,
      body.toUserId,
      body.roomCode,
      body.scenarioName
    );
    return reply.status(200).send({ invite });
  });

  fastify.get('/api/social/invites', async (request, reply) => {
    const token = extractToken(request);
    let userId = 'default_user';
    if (token) {
      const decoded = verifyJwt(token);
      if (decoded) userId = decoded.sub;
    }

    const invites = await FriendRepository.getInvites(userId);
    return reply.send({ invites });
  });

  // 5. Game Records & History
  fastify.get('/api/games/history', async (request) => {
    const query = request.query as { userId?: string; limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const records = await GameRecordRepository.listRecent(limit, query.userId);
    return { records };
  });

  fastify.get('/api/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await GameRecordRepository.findByGameId(id);
    if (!record) {
      return reply.status(404).send({ error: 'GAME_NOT_FOUND', message: 'Game record not found' });
    }
    return { record };
  });
};
