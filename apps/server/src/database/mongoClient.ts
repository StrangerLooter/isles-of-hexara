import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';

let isConnected = false;

export async function connectMongo(): Promise<boolean> {
  if (!env.MONGODB_URI) {
    logger.info('MongoDB URI not provided. Running in zero-docker in-memory storage mode.');
    return false;
  }

  try {
    logger.info('Attempting MongoDB connection...');
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    logger.info('MongoDB connected successfully.');
    return true;
  } catch (err) {
    logger.warn('MongoDB not reachable. Defaulting seamlessly to in-memory persistence adapter.');
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}
