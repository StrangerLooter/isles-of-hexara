import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { signJwt, verifyJwt } from '../auth/jwt.js';
import { GameRecordRepository } from '../database/models/GameRecord.js';
import { ProfileRepository } from '../database/models/Profile.js';
import { UserRepository } from '../database/models/User.js';
import { isMongoConnected } from '../database/mongoClient.js';

const guestAuthSchema = z.object({
  username: z.string().min(3).max(24),
});

const patchProfileSchema = z.object({
  displayName: z.string().min(1).max(24).optional(),
  avatarId: z.string().min(1).max(50).optional(),
});

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

    const { username } = parsed.data;
    let user = await UserRepository.findByUsername(username);
    if (!user) {
      user = await UserRepository.createGuest(username);
    }

    let profile = await ProfileRepository.findByUserId(user._id);
    if (!profile) {
      profile = await ProfileRepository.createOrUpdate({
        userId: user._id,
        displayName: username,
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
      guest: true,
    });

    return reply.status(200).send({
      token,
      user: { id: user._id, username: user.username },
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
