// utils/performanceMonitor.ts
// Operation timing and performance budget tracking

import { PERFORMANCE_BUDGETS } from 'utils/constants';

interface OperationStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  overBudget: number;
}

const stats = new Map<string, { total: number; count: number; min: number; max: number; overBudget: number }>();

/**
 * Start a timer for an operation. Returns a stop function that returns elapsed ms.
 */
export function startTimer(_operationName: string): () => number {
  const start = performance.now();
  return () => {
    const elapsed = performance.now() - start;
    return Math.round(elapsed * 100) / 100;
  };
}

/**
 * Track a completed operation's duration against its performance budget.
 */
export function trackOperation(
  operation: keyof typeof PERFORMANCE_BUDGETS | string,
  durationMs: number,
): { withinBudget: boolean; budget: number | undefined; actual: number } {
  const budget = PERFORMANCE_BUDGETS[operation as keyof typeof PERFORMANCE_BUDGETS];
  const withinBudget = budget === undefined || durationMs <= budget;

  // Update stats
  const existing = stats.get(operation);
  if (existing) {
    existing.total += durationMs;
    existing.count++;
    existing.min = Math.min(existing.min, durationMs);
    existing.max = Math.max(existing.max, durationMs);
    if (!withinBudget) existing.overBudget++;
  } else {
    stats.set(operation, {
      total: durationMs,
      count: 1,
      min: durationMs,
      max: durationMs,
      overBudget: withinBudget ? 0 : 1,
    });
  }

  if (!withinBudget) {
    console.warn(`[Performance] ${operation} took ${durationMs}ms (budget: ${budget}ms)`);
  } else {
    console.log(`[Performance] ${operation} completed in ${durationMs}ms`);
  }

  return { withinBudget, budget, actual: durationMs };
}

/**
 * Get aggregated performance statistics for all tracked operations.
 */
export function getPerformanceStats(): Record<string, OperationStats> {
  const result: Record<string, OperationStats> = {};
  for (const [op, data] of stats) {
    result[op] = {
      count: data.count,
      min: data.min,
      max: data.max,
      avg: data.total / data.count,
      overBudget: data.overBudget,
    };
  }
  return result;
}

/**
 * Reset all performance statistics.
 */
export function resetPerformanceStats(): void {
  stats.clear();
}
