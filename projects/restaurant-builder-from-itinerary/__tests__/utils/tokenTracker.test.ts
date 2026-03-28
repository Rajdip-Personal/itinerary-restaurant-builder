// __tests__/utils/tokenTracker.test.ts
// Tests for token usage tracking against budget

import {
  trackTokenUsage,
  getTokenUsage,
  resetTokenUsage,
  canAffordRequest,
} from 'utils/tokenTracker';
import { MOCK_TOKEN_USAGE } from '__tests__/fixtures/index';
import { TOKEN_BUDGET } from 'utils/constants';

beforeEach(() => {
  resetTokenUsage();
});

describe('trackTokenUsage', () => {
  it('tracks a single usage entry', () => {
    trackTokenUsage(MOCK_TOKEN_USAGE);
    const usage = getTokenUsage();
    expect(usage.total).toBe(MOCK_TOKEN_USAGE.totalTokens);
  });

  it('accumulates multiple usage entries', () => {
    trackTokenUsage(MOCK_TOKEN_USAGE);
    trackTokenUsage(MOCK_TOKEN_USAGE);
    const usage = getTokenUsage();
    expect(usage.total).toBe(MOCK_TOKEN_USAGE.totalTokens * 2);
  });
});

describe('getTokenUsage', () => {
  it('returns remaining tokens correctly', () => {
    trackTokenUsage(MOCK_TOKEN_USAGE);
    const usage = getTokenUsage();
    expect(usage.remaining).toBe(TOKEN_BUDGET.limit - MOCK_TOKEN_USAGE.totalTokens);
  });

  it('calculates percentUsed correctly', () => {
    trackTokenUsage({ ...MOCK_TOKEN_USAGE, totalTokens: TOKEN_BUDGET.limit / 2 });
    const usage = getTokenUsage();
    expect(usage.percentUsed).toBeCloseTo(50, 0);
  });

  it('sets isWarning when past 75% threshold', () => {
    trackTokenUsage({ ...MOCK_TOKEN_USAGE, totalTokens: TOKEN_BUDGET.warning + 1 });
    const usage = getTokenUsage();
    expect(usage.isWarning).toBe(true);
  });

  it('does not set isWarning below threshold', () => {
    trackTokenUsage({ ...MOCK_TOKEN_USAGE, totalTokens: 100 });
    const usage = getTokenUsage();
    expect(usage.isWarning).toBe(false);
  });

  it('sets isOverBudget when exceeding limit', () => {
    trackTokenUsage({ ...MOCK_TOKEN_USAGE, totalTokens: TOKEN_BUDGET.limit + 1 });
    const usage = getTokenUsage();
    expect(usage.isOverBudget).toBe(true);
  });

  it('does not set isOverBudget within limit', () => {
    trackTokenUsage(MOCK_TOKEN_USAGE);
    const usage = getTokenUsage();
    expect(usage.isOverBudget).toBe(false);
  });
});

describe('resetTokenUsage', () => {
  it('resets all tracked usage to zero', () => {
    trackTokenUsage(MOCK_TOKEN_USAGE);
    resetTokenUsage();
    const usage = getTokenUsage();
    expect(usage.total).toBe(0);
    expect(usage.remaining).toBe(TOKEN_BUDGET.limit);
    expect(usage.percentUsed).toBe(0);
  });
});

describe('canAffordRequest', () => {
  it('returns true when budget has room', () => {
    expect(canAffordRequest(1000)).toBe(true);
  });

  it('returns false when estimated tokens exceed remaining budget', () => {
    trackTokenUsage({ ...MOCK_TOKEN_USAGE, totalTokens: TOKEN_BUDGET.limit - 100 });
    expect(canAffordRequest(200)).toBe(false);
  });

  it('returns true when estimated exactly fits remaining', () => {
    trackTokenUsage({ ...MOCK_TOKEN_USAGE, totalTokens: TOKEN_BUDGET.limit - 1000 });
    expect(canAffordRequest(1000)).toBe(true);
  });
});
