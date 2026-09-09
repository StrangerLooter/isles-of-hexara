import { logger } from '../logging/logger.js';

interface CacheItem {
  value: string;
  expiresAt: number | null;
}

class InMemoryCache {
  private store = new Map<string, CacheItem>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(prefix: string): Promise<string[]> {
    const now = Date.now();
    const result: string[] = [];
    for (const [k, v] of this.store.entries()) {
      if (v.expiresAt && now > v.expiresAt) {
        this.store.delete(k);
        continue;
      }
      if (k.startsWith(prefix)) {
        result.push(k);
      }
    }
    return result;
  }
}

export const memoryRedis = new InMemoryCache();
logger.info('Zero-Docker in-memory Redis session and cache store initialized.');
