import cors from '@fastify/cors';
import Fastify from 'fastify';
import { apiRoutes } from './api/routes.js';
import { env } from './config/env.js';
import { connectMongo } from './database/mongoClient.js';
import { logger } from './logging/logger.js';
import { setupSocketServer } from './websocket/socketServer.js';

async function bootstrap() {
  const app = Fastify({
    logger: false, // logger handled by pino
  });

  await app.register(cors, {
    origin: [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  await app.register(apiRoutes);

  // Initialize DB in background (non-blocking)
  connectMongo().catch((err) => {
    logger.warn({ err }, 'MongoDB initialization failed, continuing with in-memory store');
  });

  // Attach socket.io to Fastify's raw Node http server
  const { io } = setupSocketServer(app.server);

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

bootstrap();
