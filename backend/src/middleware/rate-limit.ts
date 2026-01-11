/**
 * Rate Limiting Middleware
 * 
 * Supports both in-memory and Redis stores for rate limiting.
 * In production, use Redis for distributed rate limiting across multiple instances.
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import logger from '../lib/logger';

// ============================================
// TYPES
// ============================================

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

export interface RateLimitOptions {
  windowMs?: number;   // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  keyPrefix?: string;  // Prefix for Redis keys
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  increment(key: string, windowMs: number): Promise<{ count: number; firstRequest: number }>;
}

// ============================================
// STORES
// ============================================

/**
 * In-memory store for development/single instance deployments
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now - entry.firstRequest > 300000) { // 5 minutes
          this.store.delete(key);
        }
      }
    }, 300000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    this.store.set(key, entry);
    // Auto-delete after TTL
    setTimeout(() => this.store.delete(key), ttlMs);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; firstRequest: number }> {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now - entry.firstRequest > windowMs) {
      entry = { count: 1, firstRequest: now };
    } else {
      entry.count++;
    }

    this.store.set(key, entry);
    return entry;
  }
}

/**
 * Redis store for production/distributed deployments
 */
class RedisStore implements RateLimitStore {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.redis.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });
    this.redis.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    await this.redis.setex(key, Math.ceil(ttlMs / 1000), JSON.stringify(entry));
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; firstRequest: number }> {
    const now = Date.now();
    const data = await this.redis.get(key);
    
    let entry: RateLimitEntry;
    
    if (!data) {
      entry = { count: 1, firstRequest: now };
    } else {
      entry = JSON.parse(data);
      if (now - entry.firstRequest > windowMs) {
        entry = { count: 1, firstRequest: now };
      } else {
        entry.count++;
      }
    }

    await this.redis.setex(key, Math.ceil(windowMs / 1000), JSON.stringify(entry));
    return entry;
  }
}

// ============================================
// STORE FACTORY
// ============================================

let store: RateLimitStore;

function getStore(): RateLimitStore {
  if (store) return store;

  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl && process.env.NODE_ENV === 'production') {
    logger.info('Using Redis for rate limiting');
    store = new RedisStore(redisUrl);
  } else {
    if (process.env.NODE_ENV === 'production' && !redisUrl) {
      logger.warn('REDIS_URL not set in production - using in-memory rate limiting (not recommended for multiple instances)');
    }
    store = new MemoryStore();
  }

  return store;
}

// ============================================
// MIDDLEWARE
// ============================================

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60000,        // 1 minute
  maxRequests: 100,       // 100 requests per minute
  keyGenerator: (req) => req.ip || 'unknown',
  keyPrefix: 'rl:',
  skipFailedRequests: false,
  message: 'Too many requests, please try again later.',
};

/**
 * Create a rate limiter middleware
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const config = { ...defaultOptions, ...options };
  const rateLimitStore = getStore();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const baseKey = config.keyGenerator(req);
      const key = `${config.keyPrefix}${baseKey}`;

      const entry = await rateLimitStore.increment(key, config.windowMs);

      const remaining = Math.max(0, config.maxRequests - entry.count);
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((entry.firstRequest + config.windowMs) / 1000));

      if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.firstRequest + config.windowMs - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: config.message,
          retryAfter,
        });
      }

      next();
    } catch (err) {
      // On error, allow the request through (fail open)
      logger.error({ err }, 'Rate limit error - allowing request');
      next();
    }
  };
}

// ============================================
// PRE-CONFIGURED LIMITERS
// ============================================

/**
 * Stricter rate limit for AI-related endpoints
 */
export const aiRateLimit = rateLimit({
  windowMs: 60000,   // 1 minute
  maxRequests: 20,   // 20 requests per minute
  keyPrefix: 'rl:ai:',
  message: 'AI rate limit exceeded. Please wait before making more AI requests.',
});

/**
 * Standard API rate limit
 */
export const apiRateLimit = rateLimit({
  windowMs: 60000,   // 1 minute
  maxRequests: 100,  // 100 requests per minute
  keyPrefix: 'rl:api:',
});

/**
 * Webhook rate limit (more permissive for Recall.ai)
 */
export const webhookRateLimit = rateLimit({
  windowMs: 60000,   // 1 minute
  maxRequests: 500,  // 500 requests per minute (high volume transcripts)
  keyPrefix: 'rl:webhook:',
  keyGenerator: () => 'recall-webhook', // Single bucket for all webhooks
});

export default rateLimit;
