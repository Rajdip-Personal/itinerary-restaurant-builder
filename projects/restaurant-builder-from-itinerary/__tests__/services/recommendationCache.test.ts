// __tests__/services/recommendationCache.test.ts
// Tests for recommendation cache — set/get, TTL, version invalidation, stale fallback

import {
  buildRecommendationCacheKey,
  getCachedRecommendation,
  setCachedRecommendation,
  getStaleRecommendation,
  clearRecommendationCache,
  getCacheStats,
} from 'services/recommendationCache';
import {
  MOCK_RECOMMENDATION_RESULT,
} from '__tests__/fixtures/index';
import { CACHE_TTLS } from 'utils/constants';

beforeEach(() => {
  clearRecommendationCache();
  jest.restoreAllMocks();
});

describe('buildRecommendationCacheKey', () => {
  it('generates a deterministic key from city, meal type, and coordinates', () => {
    const key = buildRecommendationCacheKey('paris', 'lunch', 48.8606, 2.3376);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });

  it('generates different keys for different parameters', () => {
    const key1 = buildRecommendationCacheKey('paris', 'lunch', 48.8606, 2.3376);
    const key2 = buildRecommendationCacheKey('rome', 'lunch', 48.8606, 2.3376);
    const key3 = buildRecommendationCacheKey('paris', 'dinner', 48.8606, 2.3376);
    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('rounds coordinates for stability', () => {
    const key1 = buildRecommendationCacheKey('paris', 'lunch', 48.86061, 2.33761);
    const key2 = buildRecommendationCacheKey('paris', 'lunch', 48.86064, 2.33764);
    expect(key1).toBe(key2);
  });
});

describe('setCachedRecommendation / getCachedRecommendation', () => {
  it('stores and retrieves a recommendation result', () => {
    const key = 'test-key-1';
    setCachedRecommendation(key, MOCK_RECOMMENDATION_RESULT);
    const cached = getCachedRecommendation(key);
    expect(cached).not.toBeNull();
    expect(cached!.source).toBe('cache');
    expect(cached!.restaurants.length).toBe(MOCK_RECOMMENDATION_RESULT.restaurants.length);
  });

  it('returns null for non-existent key', () => {
    expect(getCachedRecommendation('nonexistent')).toBeNull();
  });

  it('returns null for expired cache entry', () => {
    const key = 'test-expired';
    // Store at current time
    const now = Date.now();
    setCachedRecommendation(key, MOCK_RECOMMENDATION_RESULT);

    // Advance time past TTL
    jest.spyOn(Date, 'now').mockReturnValue(now + CACHE_TTLS.ai + 1000);

    const cached = getCachedRecommendation(key);
    expect(cached).toBeNull();
  });
});

describe('getStaleRecommendation', () => {
  it('returns expired entries that getCachedRecommendation rejects', () => {
    const key = 'test-stale';
    const now = Date.now();
    setCachedRecommendation(key, MOCK_RECOMMENDATION_RESULT);

    // Advance time past TTL
    jest.spyOn(Date, 'now').mockReturnValue(now + CACHE_TTLS.ai + 1000);

    // Fresh cache returns null (expired)
    expect(getCachedRecommendation(key)).toBeNull();
    // Stale fallback returns it anyway
    const stale = getStaleRecommendation(key);
    expect(stale).not.toBeNull();
    expect(stale!.source).toBe('stale_cache');
  });

  it('returns null for key that was never set', () => {
    expect(getStaleRecommendation('never-set')).toBeNull();
  });
});

describe('clearRecommendationCache', () => {
  it('removes all cached entries', () => {
    setCachedRecommendation('key-a', MOCK_RECOMMENDATION_RESULT);
    setCachedRecommendation('key-b', MOCK_RECOMMENDATION_RESULT);
    clearRecommendationCache();
    expect(getCachedRecommendation('key-a')).toBeNull();
    expect(getCachedRecommendation('key-b')).toBeNull();
  });
});

describe('getCacheStats', () => {
  it('returns zeroed stats on empty cache', () => {
    const stats = getCacheStats();
    expect(stats.total).toBe(0);
    expect(stats.fresh).toBe(0);
    expect(stats.stale).toBe(0);
  });

  it('counts fresh entries', () => {
    setCachedRecommendation('fresh-1', MOCK_RECOMMENDATION_RESULT);
    setCachedRecommendation('fresh-2', MOCK_RECOMMENDATION_RESULT);
    const stats = getCacheStats();
    expect(stats.total).toBe(2);
    expect(stats.fresh).toBe(2);
  });

  it('counts stale entries separately', () => {
    const now = Date.now();
    setCachedRecommendation('will-be-stale', MOCK_RECOMMENDATION_RESULT);

    // Advance time past TTL so will-be-stale becomes stale
    jest.spyOn(Date, 'now').mockReturnValue(now + CACHE_TTLS.ai + 1000);

    // Store a new entry at the "future" time (fresh)
    setCachedRecommendation('fresh-1', MOCK_RECOMMENDATION_RESULT);

    const stats = getCacheStats();
    expect(stats.total).toBe(2);
    expect(stats.fresh).toBe(1);
    expect(stats.stale).toBe(1);
  });

  it('calculates hitRate correctly', () => {
    setCachedRecommendation('a', MOCK_RECOMMENDATION_RESULT);
    setCachedRecommendation('b', MOCK_RECOMMENDATION_RESULT);
    const stats = getCacheStats();
    expect(stats.hitRate).toBe(1);
  });
});
