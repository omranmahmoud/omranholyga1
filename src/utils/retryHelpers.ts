
import { RetryOptions } from './retry';

export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number = 30000
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = 0.5 + Math.random() * 0.5;
  return Math.min(exponentialDelay * jitter, maxDelay);
}

export function shouldRetry(
  error: unknown,
  attempt: number,
  maxRetries: number
): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  // Add custom retry conditions here
  if (error instanceof Error) {
    // Don't retry client errors (4xx)
    if ((error as any).status >= 400 && (error as any).status < 500) {
      return false;
    }
  }

  return true;
}

export function createRetryConfig(options?: Partial<RetryOptions>): RetryOptions {
  return {
    maxRetries: 3,
    retryDelay: 1000,
    ...options
  };
}
