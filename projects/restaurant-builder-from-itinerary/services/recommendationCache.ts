// services/recommendationCache.ts
// In-memory cache for recommendation results with TTL and version tracking

import type { RecommendationResult } from 'types/index';
import { CACHE_TTLS } from 'utils/constants';
import { SCORING_VERSION } from 'utils/recommendationRanker';

interface CacheEntry {
  result: RecommendationResult;
  scoringVersion: number;
  storedAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Build a deterministic cache key from city, meal type, and coordinates.
 */
export function buildRecommendationCacheKey(
  cityId: string,
  mealType: string,
  lat: number,
  lon: number,
): string {
  // Round coordinates to 4 decimal places (~11m precision) for cache key stability
  const roundedLat = lat.toFixed(4);
  const roundedLon = lon.toFixed(4);
  return `rec:${cityId}:${mealType}:${roundedLat}:${roundedLon}`;
}

/**
 * Check if a cache entry is fresh (within TTL and matching scoring version).
 */
function isFresh(entry: CacheEntry): boolean {
  if (entry.scoringVersion !== SCORING_VERSION) return false;
  const age = Date.now() - entry.storedAt;
  const ttl = entry.result.source === 'ai' ? CACHE_TTLS.ai : CACHE_TTLS.lowQuality;
  return age <= ttl;
}

/**
 * Get a cached recommendation. Returns null if not found, expired, or version mismatch.
 */
export function getCachedRecommendation(key: string): RecommendationResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (!isFresh(entry)) return null;

  console.log(`[Cache] Hit for ${key}`);
  return { ...entry.result, source: 'cache' };
}

/**
 * Store a recommendation in cache.
 */
export function setCachedRecommendation(key: string, result: RecommendationResult): void {
  cache.set(key, {
    result: { ...result },
    scoringVersion: SCORING_VERSION,
    storedAt: Date.now(),
  });
  console.log(`[Cache] Stored ${key} (${result.restaurants.length} restaurants)`);
}

/**
 * Get a stale (expired) recommendation as a fallback. Returns null if never cached.
 * Marks the source as 'stale_cache'.
 */
export function getStaleRecommendation(key: string): RecommendationResult | null {
  const entry = cache.get(key);
  if (!entry) return null;

  console.log(`[Cache] Stale fallback for ${key}`);
  return { ...entry.result, source: 'stale_cache' };
}

/**
 * Clear all cached recommendations.
 */
export function clearRecommendationCache(): void {
  cache.clear();
  console.log('[Cache] Cleared all entries');
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): { total: number; fresh: number; stale: number; hitRate: number } {
  let fresh = 0;
  let stale = 0;

  for (const entry of cache.values()) {
    if (isFresh(entry)) {
      fresh++;
    } else {
      stale++;
    }
  }

  const total = cache.size;
  return {
    total,
    fresh,
    stale,
    hitRate: total === 0 ? 0 : fresh / total,
  };
}
