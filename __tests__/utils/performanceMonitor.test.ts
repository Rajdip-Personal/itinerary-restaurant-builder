// __tests__/utils/performanceMonitor.test.ts
// Tests for operation timing and performance budget tracking

import {
  startTimer,
  trackOperation,
  getPerformanceStats,
  resetPerformanceStats,
} from 'utils/performanceMonitor';
import { PERFORMANCE_BUDGETS } from 'utils/constants';

beforeEach(() => {
  resetPerformanceStats();
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('startTimer', () => {
  it('returns a stop function that returns elapsed ms', () => {
    const stop = startTimer('test-op');
    // Immediately stop — should be very small
    const elapsed = stop();
    expect(typeof elapsed).toBe('number');
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('measures elapsed time accurately', async () => {
    const stop = startTimer('slow-op');
    await new Promise((r) => setTimeout(r, 50));
    const elapsed = stop();
    expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
    expect(elapsed).toBeLessThan(200);
  });
});

describe('trackOperation', () => {
  it('returns within budget for fast operations', () => {
    const result = trackOperation('rerank', 100);
    expect(result.withinBudget).toBe(true);
    expect(result.budget).toBe(PERFORMANCE_BUDGETS.rerank);
    expect(result.actual).toBe(100);
  });

  it('returns over budget for slow operations', () => {
    const result = trackOperation('rerank', 3000);
    expect(result.withinBudget).toBe(false);
    expect(result.budget).toBe(PERFORMANCE_BUDGETS.rerank);
    expect(result.actual).toBe(3000);
  });

  it('logs a warning when over budget', () => {
    trackOperation('rerank', 3000);
    expect(console.warn).toHaveBeenCalled();
  });

  it('handles unknown operations gracefully', () => {
    const result = trackOperation('unknown-op', 500);
    // No budget defined — should treat as within budget
    expect(result.withinBudget).toBe(true);
    expect(result.budget).toBeUndefined();
  });
});

describe('getPerformanceStats', () => {
  it('tracks min, max, avg, count for an operation', () => {
    trackOperation('rerank', 100);
    trackOperation('rerank', 200);
    trackOperation('rerank', 300);

    const stats = getPerformanceStats();
    expect(stats.rerank).toBeDefined();
    expect(stats.rerank.count).toBe(3);
    expect(stats.rerank.min).toBe(100);
    expect(stats.rerank.max).toBe(300);
    expect(stats.rerank.avg).toBe(200);
  });

  it('tracks overBudget count', () => {
    trackOperation('rerank', 100);  // within
    trackOperation('rerank', 3000); // over

    const stats = getPerformanceStats();
    expect(stats.rerank.overBudget).toBe(1);
  });

  it('returns empty stats when no operations tracked', () => {
    const stats = getPerformanceStats();
    expect(Object.keys(stats)).toHaveLength(0);
  });
});

describe('resetPerformanceStats', () => {
  it('clears all tracked operations', () => {
    trackOperation('rerank', 100);
    resetPerformanceStats();
    const stats = getPerformanceStats();
    expect(Object.keys(stats)).toHaveLength(0);
  });
});
