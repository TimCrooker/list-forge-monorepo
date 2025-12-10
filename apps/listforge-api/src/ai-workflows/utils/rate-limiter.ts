import { Logger } from '@nestjs/common';

const logger = new Logger('RateLimiter');

/**
 * Token bucket rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum number of tokens in the bucket */
  maxTokens: number;
  /** Tokens refilled per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillInterval: number;
  /** Optional name for logging */
  name?: string;
}

/**
 * Default configurations for common API providers
 */
export const RATE_LIMITER_CONFIGS = {
  /** OpenAI: 500 RPM for GPT-4, more conservative for safety */
  openai: {
    maxTokens: 50,
    refillRate: 5,
    refillInterval: 1000, // 5 tokens per second = 300 RPM
    name: 'OpenAI',
  } as RateLimiterConfig,

  /** OpenAI mini model: Higher limits */
  openaiMini: {
    maxTokens: 100,
    refillRate: 10,
    refillInterval: 1000, // 10 tokens per second = 600 RPM
    name: 'OpenAI-Mini',
  } as RateLimiterConfig,

  /** eBay Browse API: 5000 calls/day, ~3.5 per minute */
  ebayBrowse: {
    maxTokens: 10,
    refillRate: 1,
    refillInterval: 3000, // 1 token every 3 seconds
    name: 'eBay-Browse',
  } as RateLimiterConfig,

  /** eBay Taxonomy API: Lower limits */
  ebayTaxonomy: {
    maxTokens: 5,
    refillRate: 1,
    refillInterval: 5000, // 1 token every 5 seconds
    name: 'eBay-Taxonomy',
  } as RateLimiterConfig,

  /** Web search: Conservative to avoid rate limits */
  webSearch: {
    maxTokens: 10,
    refillRate: 2,
    refillInterval: 1000, // 2 per second
    name: 'WebSearch',
  } as RateLimiterConfig,

  /** Keepa API: 60 req/min limit, configured conservatively at 50 RPM for safety margin */
  keepa: {
    maxTokens: 10,
    refillRate: 1,
    refillInterval: 1200, // 1 token every 1.2 seconds = 50 RPM (allows bursts of 10)
    name: 'Keepa',
  } as RateLimiterConfig,

  /** Amazon SP-API: Conservative rate limiting */
  amazonSpApi: {
    maxTokens: 10,
    refillRate: 2,
    refillInterval: 1000, // 2 per second
    name: 'Amazon-SP-API',
  } as RateLimiterConfig,
} as const;

/**
 * Token bucket rate limiter
 * Implements a simple token bucket algorithm with configurable refill rates
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly config: RateLimiterConfig;
  private waitQueue: Array<{ resolve: () => void; timestamp: number }> = [];

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refillCount = Math.floor(elapsed / this.config.refillInterval) * this.config.refillRate;

    if (refillCount > 0) {
      this.tokens = Math.min(this.config.maxTokens, this.tokens + refillCount);
      this.lastRefill = now;
    }
  }

  /**
   * Try to acquire a token immediately
   * Returns true if token was acquired, false otherwise
   */
  tryAcquire(): boolean {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Acquire a token, waiting if necessary
   * Returns a promise that resolves when a token is available
   */
  async acquire(): Promise<void> {
    if (this.tryAcquire()) {
      return;
    }

    // Calculate wait time
    const waitTime = this.config.refillInterval - (Date.now() - this.lastRefill);

    logger.debug(
      `[${this.config.name || 'RateLimiter'}] Rate limited, waiting ${waitTime}ms (${this.waitQueue.length} in queue)`
    );

    return new Promise<void>((resolve) => {
      this.waitQueue.push({ resolve, timestamp: Date.now() });

      // Set up a timer to check for available tokens
      const checkInterval = setInterval(() => {
        if (this.tryAcquire()) {
          clearInterval(checkInterval);
          // Remove from queue and resolve
          const index = this.waitQueue.findIndex(item => item.resolve === resolve);
          if (index >= 0) {
            this.waitQueue.splice(index, 1);
          }
          resolve();
        }
      }, Math.min(100, this.config.refillInterval / 10));

      // Timeout after 30 seconds to prevent infinite waits
      setTimeout(() => {
        clearInterval(checkInterval);
        const index = this.waitQueue.findIndex(item => item.resolve === resolve);
        if (index >= 0) {
          this.waitQueue.splice(index, 1);
          logger.warn(`[${this.config.name || 'RateLimiter'}] Timed out waiting for token`);
          resolve(); // Resolve anyway to prevent deadlocks
        }
      }, 30000);
    });
  }

  /**
   * Get current available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.waitQueue.length;
  }

  /**
   * Reset the rate limiter to full capacity
   */
  reset(): void {
    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Rate limiter registry - singleton instances per key
 */
const rateLimiters = new Map<string, RateLimiter>();

/**
 * Get or create a rate limiter for a given key
 */
export function getRateLimiter(key: string, config?: RateLimiterConfig): RateLimiter {
  if (!rateLimiters.has(key)) {
    const limiterConfig = config || RATE_LIMITER_CONFIGS[key as keyof typeof RATE_LIMITER_CONFIGS];
    if (!limiterConfig) {
      throw new Error(`No rate limiter configuration found for key: ${key}`);
    }
    rateLimiters.set(key, new RateLimiter({ ...limiterConfig, name: limiterConfig.name || key }));
  }
  return rateLimiters.get(key)!;
}

/**
 * Execute a function with rate limiting
 * @param key Rate limiter key
 * @param fn Function to execute
 * @param config Optional custom configuration
 */
export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>,
  config?: RateLimiterConfig,
): Promise<T> {
  const limiter = getRateLimiter(key, config);
  await limiter.acquire();
  return fn();
}

/**
 * Decorator-style rate limiting wrapper
 */
export function rateLimited(key: string, config?: RateLimiterConfig) {
  return function <T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return withRateLimit(key, () => fn(...args), config);
    }) as T;
  };
}

/**
 * Get statistics for all rate limiters
 */
export function getRateLimiterStats(): Record<string, { availableTokens: number; queueLength: number }> {
  const stats: Record<string, { availableTokens: number; queueLength: number }> = {};

  for (const [key, limiter] of rateLimiters.entries()) {
    stats[key] = {
      availableTokens: limiter.getAvailableTokens(),
      queueLength: limiter.getQueueLength(),
    };
  }

  return stats;
}
