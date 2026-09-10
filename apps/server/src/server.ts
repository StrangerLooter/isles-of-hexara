import cors from '@fastify/cors';
import Fastify from 'fastify';
import { apiRoutes } from './api/routes.js';
import { env } from './config/env.js';
import { connectMongo } from './database/mongoClient.js';
import { logger } from './logging/logger.js';
import { setupSocketServer } from './websocket/socketServer.js';

export async function createServer() {
  const app = Fastify({
    logger: false, // logger handled by pino
  });

  const configuredOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [];

  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://islesofhexara.vercel.app',
  ];

  const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return cb(null, true);
      }
      return cb(null, true); // Allow preview deployments
    },
    credentials: true,
  });

  await app.register(apiRoutes);

  // Initialize DB in background (non-blocking)
  connectMongo().catch((err) => {
    logger.warn({ err }, 'MongoDB initialization failed, continuing with in-memory store');
  });

  // Attach socket.io to Fastify's raw Node http server
  const { io, roomManager, actionRegistry } = setupSocketServer(app.server);

  return { app, io, roomManager, actionRegistry };
}

async function bootstrap() {
  const { app, io } = await createServer();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`🌊 Isles of Hexara Authoritative Game Server running at http://${env.HOST}:${env.PORT}`);
    logger.info(`⚡ Socket.IO listening on port ${env.PORT}`);
  } catch (err) {
    logger.error({ err }, 'Server start failure');
    process.exit(1);
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      io.close();
      await app.close();
      process.exit(0);
    });
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.TEST) {
  bootstrap();
}
