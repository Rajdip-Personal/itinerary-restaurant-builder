// utils/retryHandler.ts
// Standardized retry, timeout, and fallback utilities

import { logWarning, logError } from 'utils/errorLogger';

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Retry an async function with configurable retries and delay.
 * Default: 1 retry with 2s delay (per PRD spec).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 1, delayMs = 2000, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        logWarning(`Retry ${attempt + 1}/${maxRetries}: ${lastError.message}`, 'RetryHandler');
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
  }

  logError(`All ${maxRetries + 1} attempts failed: ${lastError!.message}`, 'RetryHandler');
  throw lastError!;
}

/**
 * Run an async function with a timeout. Throws if the function exceeds the timeout.
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    fn().then(
      (result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      },
      (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(error);
        }
      },
    );
  });
}

/**
 * Run a function and return a fallback value on any error.
 */
export async function withFallback<T>(
  fn: () => T | Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
