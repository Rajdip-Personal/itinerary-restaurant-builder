// utils/tokenTracker.ts
// Track AI token usage against budget limits

import type { TokenUsage } from 'types/index';
import { TOKEN_BUDGET } from 'utils/constants';

let totalTokensUsed = 0;

/**
 * Track a token usage entry, accumulating toward the budget limit.
 */
export function trackTokenUsage(usage: TokenUsage): void {
  totalTokensUsed += usage.totalTokens;
  console.log(
    `[TokenTracker] +${usage.totalTokens} tokens (total: ${totalTokensUsed}/${TOKEN_BUDGET.limit})`,
  );
}

/**
 * Get current token usage stats.
 */
export function getTokenUsage(): {
  total: number;
  remaining: number;
  percentUsed: number;
  isWarning: boolean;
  isOverBudget: boolean;
} {
  const remaining = TOKEN_BUDGET.limit - totalTokensUsed;
  const percentUsed = (totalTokensUsed / TOKEN_BUDGET.limit) * 100;
  return {
    total: totalTokensUsed,
    remaining: Math.max(0, remaining),
    percentUsed,
    isWarning: totalTokensUsed >= TOKEN_BUDGET.warning,
    isOverBudget: totalTokensUsed > TOKEN_BUDGET.limit,
  };
}

/**
 * Reset all tracked token usage to zero.
 */
export function resetTokenUsage(): void {
  totalTokensUsed = 0;
  console.log('[TokenTracker] Reset to 0');
}

/**
 * Check if estimated tokens fit within remaining budget.
 */
export function canAffordRequest(estimatedTokens: number): boolean {
  return totalTokensUsed + estimatedTokens <= TOKEN_BUDGET.limit;
}
