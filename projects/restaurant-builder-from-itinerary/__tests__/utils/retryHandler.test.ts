// __tests__/utils/retryHandler.test.ts
// Tests for standardized retry logic

import { withRetry, withTimeout, withFallback } from 'utils/retryHandler';

// Suppress console output from errorLogger during tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('withRetry', () => {
  it('returns result on first successful call', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries once on failure and succeeds on second attempt', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('recovered');
    const result = await withRetry(fn, { maxRetries: 1, delayMs: 0 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('persistent'));
    await expect(withRetry(fn, { maxRetries: 1, delayMs: 0 })).rejects.toThrow('persistent');
    expect(fn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it('calls onRetry callback on each retry', async () => {
    const onRetry = jest.fn();
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');
    await withRetry(fn, { maxRetries: 1, delayMs: 0, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('respects maxRetries: 0 (no retries)', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(withRetry(fn, { maxRetries: 0, delayMs: 0 })).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses default of 1 retry with 2s delay', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');
    // Use delayMs: 0 override to keep test fast
    const result = await withRetry(fn, { delayMs: 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('withTimeout', () => {
  it('returns result when fn completes within timeout', async () => {
    const fn = () => Promise.resolve('fast');
    const result = await withTimeout(fn, 1000);
    expect(result).toBe('fast');
  });

  it('throws when fn exceeds timeout', async () => {
    jest.useFakeTimers();
    const fn = () => new Promise((resolve) => setTimeout(resolve, 5000));
    const promise = withTimeout(fn, 50);
    jest.advanceTimersByTime(100);
    await expect(promise).rejects.toThrow('timed out');
    jest.useRealTimers();
  });

  it('does not resolve late after timeout', async () => {
    jest.useFakeTimers();
    const fn = () => new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 200);
    });
    const promise = withTimeout(fn, 50);
    jest.advanceTimersByTime(100);
    await expect(promise).rejects.toThrow();
    jest.advanceTimersByTime(200);
    jest.useRealTimers();
  });
});

describe('withFallback', () => {
  it('returns fn result on success', async () => {
    const result = await withFallback(() => Promise.resolve('ok'), 'fallback');
    expect(result).toBe('ok');
  });

  it('returns fallback value on error', async () => {
    const result = await withFallback(() => Promise.reject(new Error('fail')), 'fallback');
    expect(result).toBe('fallback');
  });

  it('never throws even on error', async () => {
    const result = await withFallback(() => { throw new Error('sync fail'); }, 'safe');
    expect(result).toBe('safe');
  });
});
