/**
 * Retry Logic
 * 
 * Provides retry functionality with configurable backoff strategies.
 */

import { ErrorCode, isRetryableError } from './errors';

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Initial delay in milliseconds */
  delayMs: number;
  
  /** Backoff strategy */
  backoff: 'linear' | 'exponential';
  
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  
  /** Error codes that should trigger a retry */
  retryableErrors?: ErrorCode[];
  
  /** Callback called before each retry */
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoff: 'exponential',
  maxDelayMs: 30000,
  retryableErrors: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR,
    ErrorCode.SERVER_ERROR,
    ErrorCode.DATABASE_ERROR,
  ],
};

/**
 * Calculate delay based on backoff strategy
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  let delay: number;

  if (config.backoff === 'exponential') {
    delay = config.delayMs * Math.pow(2, attempt - 1);
  } else {
    delay = config.delayMs * attempt;
  }

  // Cap at maxDelayMs
  if (config.maxDelayMs) {
    delay = Math.min(delay, config.maxDelayMs);
  }

  return delay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error should be retried
 */
function shouldRetry(error: unknown, config: RetryConfig): boolean {
  // Use the isRetryableError utility
  return isRetryableError(error);
}

/**
 * Execute a function with retry logic
 * 
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise with the function result
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetchData(),
 *   { maxAttempts: 3, delayMs: 1000, backoff: 'exponential' }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is the last attempt
      if (attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      // Don't retry if error is not retryable
      if (!shouldRetry(error, finalConfig)) {
        throw lastError;
      }

      // Call onRetry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, lastError);
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, finalConfig);
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Create a retryable version of a function
 * 
 * @example
 * ```typescript
 * const retryableFetch = createRetryable(
 *   fetchData,
 *   { maxAttempts: 3 }
 * );
 * 
 * const data = await retryableFetch();
 * ```
 */
export function createRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), config);
  }) as T;
}

/**
 * Retry with exponential backoff (convenience function)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  return withRetry(fn, {
    maxAttempts,
    delayMs: 1000,
    backoff: 'exponential',
  });
}

/**
 * Retry with linear backoff (convenience function)
 */
export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  return withRetry(fn, {
    maxAttempts,
    delayMs: 1000,
    backoff: 'linear',
  });
}
