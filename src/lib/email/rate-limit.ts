/**
 * Email rate limiting utilities
 * AWS SES limit: 14 emails/second
 * Resend limit: 10 emails/second (default)
 */

export interface RateLimitConfig {
  maxPerSecond: number;
  burstCapacity?: number;
  windowMs?: number;
}

export interface RateLimitState {
  tokens: number;
  lastRefill: number;
  sentCount: number;
  windowStart: number;
}

/**
 * Token bucket rate limiter
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly windowMs: number;

  constructor(config: RateLimitConfig) {
    this.capacity = config.burstCapacity || config.maxPerSecond;
    this.refillRate = config.maxPerSecond / 1000; // tokens per ms
    this.windowMs = config.windowMs || 1000;
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  tryConsume(tokens = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Consume tokens or wait until available
   */
  async consume(tokens = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      const waitTime = Math.ceil((tokens - this.tokens) / this.refillRate);
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100)));
    }
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter {
  private sentTimestamps: number[] = [];
  private readonly maxPerWindow: number;
  private readonly windowMs: number;

  constructor(maxPerSecond: number, windowMs = 1000) {
    this.maxPerWindow = maxPerSecond;
    this.windowMs = windowMs;
  }

  /**
   * Check if we can send
   */
  canSend(): boolean {
    this.cleanup();
    return this.sentTimestamps.length < this.maxPerWindow;
  }

  /**
   * Record that we sent
   */
  recordSent(): void {
    this.sentTimestamps.push(Date.now());
  }

  /**
   * Try to send
   */
  trySend(): boolean {
    if (this.canSend()) {
      this.recordSent();
      return true;
    }
    return false;
  }

  /**
   * Send or wait until available
   */
  async send(): Promise<void> {
    while (!this.trySend()) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Get current usage
   */
  getUsage(): { current: number; max: number; percentage: number } {
    this.cleanup();
    const current = this.sentTimestamps.length;
    return {
      current,
      max: this.maxPerWindow,
      percentage: (current / this.maxPerWindow) * 100,
    };
  }

  /**
   * Clean up old timestamps
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.sentTimestamps = this.sentTimestamps.filter(ts => ts > cutoff);
  }
}

/**
 * Batch processor with rate limiting
 */
export class BatchProcessor {
  private rateLimiter: TokenBucketRateLimiter;
  private readonly batchSize: number;

  constructor(maxPerSecond: number, batchSize = 10) {
    this.rateLimiter = new TokenBucketRateLimiter({
      maxPerSecond,
      burstCapacity: maxPerSecond * 2,
    });
    this.batchSize = batchSize;
  }

  /**
   * Process items in batches with rate limiting
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>
  ): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
    const results: R[] = [];
    const errors: Array<{ item: T; error: Error }> = [];

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);

      // Wait for rate limit
      await this.rateLimiter.consume(batch.length);

      // Process batch
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            return await processor(item);
          } catch (error) {
            throw error instanceof Error ? error : new Error(String(error));
          }
        })
      );

      // Collect results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            item: batch[index],
            error: result.reason,
          });
        }
      });
    }

    return { results, errors };
  }
}

/**
 * Email sending queue with rate limiting
 */
export class EmailQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private readonly rateLimiter: TokenBucketRateLimiter;

  constructor(maxPerSecond: number) {
    this.rateLimiter = new TokenBucketRateLimiter({
      maxPerSecond,
      burstCapacity: maxPerSecond * 2,
    });
  }

  /**
   * Add email to queue
   */
  async add(task: () => Promise<void>): Promise<void> {
    this.queue.push(task);
    this.process();
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await this.rateLimiter.consume(1);
        try {
          await task();
        } catch (error) {
          console.error('Email queue task failed:', error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}

/**
 * Pre-configured rate limiters for different services
 */
export const rateLimiters = {
  // AWS SES: 14 emails/second
  awsSES: new TokenBucketRateLimiter({
    maxPerSecond: 14,
    burstCapacity: 28,
  }),

  // Resend: 10 emails/second (default)
  resend: new TokenBucketRateLimiter({
    maxPerSecond: 10,
    burstCapacity: 20,
  }),

  // Conservative rate limiter for safety
  conservative: new TokenBucketRateLimiter({
    maxPerSecond: 5,
    burstCapacity: 10,
  }),
};

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum emails per second
   */
  maxPerSecond: number;

  /**
   * Burst capacity (optional)
   */
  burstCapacity?: number;

  /**
   * Time window in milliseconds (default: 1000)
   */
  windowMs?: number;

  /**
   * Retry on failure (default: true)
   */
  retryOnFailure?: boolean;

  /**
   * Maximum retries (default: 3)
   */
  maxRetries?: number;

  /**
   * Retry delay in milliseconds (default: 1000)
   */
  retryDelayMs?: number;
}

/**
 * Apply rate limiting to email sending
 */
export async function withRateLimit<T>(
  config: RateLimitConfig,
  fn: () => Promise<T>
): Promise<T> {
  const limiter = new TokenBucketRateLimiter(config);
  const maxRetries = config.maxRetries || 3;
  const retryDelayMs = config.retryDelayMs || 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await limiter.consume(1);
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      if (config.retryOnFailure !== false) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Rate limit retry failed');
}

/**
 * Calculate optimal batch size based on rate limit
 */
export function calculateOptimalBatchSize(
  maxPerSecond: number,
  targetDurationMs = 1000
): number {
  // Aim to send batch within target duration
  const batchSize = Math.floor((maxPerSecond * targetDurationMs) / 1000);

  // Ensure minimum batch size
  return Math.max(1, Math.min(batchSize, maxPerSecond));
}

/**
 * Monitor rate limit usage
 */
export class RateLimitMonitor {
  private stats: Array<{
    timestamp: number;
    usage: number;
    allowed: number;
  }> = [];

  /**
   * Record rate limit usage
   */
  recordUsage(usage: number, allowed: number): void {
    this.stats.push({
      timestamp: Date.now(),
      usage,
      allowed,
    });

    // Keep only last hour of stats
    const oneHourAgo = Date.now() - 3600000;
    this.stats = this.stats.filter(s => s.timestamp > oneHourAgo);
  }

  /**
   * Get usage statistics
   */
  getStats(): {
    averageUsage: number;
    peakUsage: number;
    totalRequests: number;
    throttledRequests: number;
  } {
    if (this.stats.length === 0) {
      return {
        averageUsage: 0,
        peakUsage: 0,
        totalRequests: 0,
        throttledRequests: 0,
      };
    }

    const usages = this.stats.map(s => s.usage);
    const totalRequests = this.stats.length;
    const throttledRequests = this.stats.filter(s => s.usage > s.allowed).length;

    return {
      averageUsage: usages.reduce((a, b) => a + b, 0) / usages.length,
      peakUsage: Math.max(...usages),
      totalRequests,
      throttledRequests,
    };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.stats = [];
  }
}

/**
 * Default rate limiting configuration
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  maxPerSecond: 10,
  burstCapacity: 20,
  retryOnFailure: true,
  maxRetries: 3,
  retryDelayMs: 1000,
};