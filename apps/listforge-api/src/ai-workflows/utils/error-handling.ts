import { Logger } from '@nestjs/common';

const logger = new Logger('ErrorHandling');

/**
 * Error classification
 */
export interface ErrorClassification {
  isRetryable: boolean;
  category: 'network' | 'rate_limit' | 'validation' | 'unknown';
}

/**
 * Circuit breaker state for tracking failures
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000, // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        throw new Error(`Circuit breaker open for ${context}. Try again later.`);
      }
      // Move to half-open state
      this.state = 'half-open';
    }

    try {
      const result = await fn();

      // Success - reset circuit
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        logger.log(`Circuit breaker closed for ${context}`);
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
        logger.warn(`Circuit breaker opened for ${context} after ${this.failures} failures`);
      }

      throw error;
    }
  }

  reset() {
    this.failures = 0;
    this.state = 'closed';
  }
}

// Circuit breakers for different service types
const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(key: string): CircuitBreaker {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, new CircuitBreaker());
  }
  return circuitBreakers.get(key)!;
}

/**
 * Classify error type for retry logic
 */
export function classifyError(error: any): ErrorClassification {
  const message = error?.message?.toLowerCase() || '';

  // Network errors
  if (
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('network') ||
    message.includes('enotfound')
  ) {
    return { isRetryable: true, category: 'network' };
  }

  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    error?.status === 429
  ) {
    return { isRetryable: true, category: 'rate_limit' };
  }

  // Validation errors (not retryable)
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    error?.status === 400 ||
    error?.status === 422
  ) {
    return { isRetryable: false, category: 'validation' };
  }

  // Default to retryable unknown
  return { isRetryable: true, category: 'unknown' };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    context?: string;
    useCircuitBreaker?: boolean;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    context = 'operation',
    useCircuitBreaker = true,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wrap in circuit breaker if enabled
      if (useCircuitBreaker) {
        const breaker = getCircuitBreaker(context);
        return await breaker.execute(fn, context);
      }

      return await fn();
    } catch (error) {
      lastError = error;
      const classification = classifyError(error);

      // Don't retry if error is not retryable
      if (!classification.isRetryable) {
        logger.debug(`Error not retryable for ${context}: ${classification.category}`);
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        logger.warn(`Max retries (${maxRetries}) exceeded for ${context}`);
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay,
      );

      logger.debug(
        `Retry ${attempt + 1}/${maxRetries} for ${context} after ${Math.round(delay)}ms. Error: ${classification.category}`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrap a function with retry logic
 */
export function withRetry<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  context: string,
  options?: Parameters<typeof retryWithBackoff>[1],
) {
  return async (...args: TArgs): Promise<TResult> => {
    return retryWithBackoff(() => fn(...args), { ...options, context });
  };
}
