// services/geocodingCache.ts
// Tier 2: In-memory geocoding cache with 30-day TTL
// Key pattern: @culture_guide:geocoding_cache

import type { GeocodedLocation } from 'types/index';
import { CACHE_TTLS } from 'utils/constants';

const GEOCODING_CACHE_KEY = '@culture_guide:geocoding_cache';

interface CacheEntry {
  data: GeocodedLocation;
  timestamp: number;
}

// In-memory cache store (will be replaced by localStorage/AsyncStorage in browser)
const cacheStore: Record<string, CacheEntry> = {};

/**
 * Build a normalized cache key from city and attraction name.
 */
export function buildCacheKey(name: string, cityId: string): string {
  return `${cityId}:${name.toLowerCase().trim()}`;
}

/**
 * Get a cached geocoding result. Returns null on miss or expired entry.
 */
export function getCachedGeocode(cacheKey: string): GeocodedLocation | null {
  const entry = cacheStore[cacheKey];
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTLS.geocoding) {
    console.log(`[Geocoding] Cache entry expired: ${cacheKey}`);
    delete cacheStore[cacheKey];
    return null;
  }

  return entry.data;
}

/**
 * Store a geocoding result in the cache.
 */
export function setCachedGeocode(cacheKey: string, data: GeocodedLocation): void {
  cacheStore[cacheKey] = {
    data,
    timestamp: Date.now(),
  };
}

/**
 * Clear all cache entries.
 */
export function clearCache(): void {
  for (const key of Object.keys(cacheStore)) {
    delete cacheStore[key];
  }
}
