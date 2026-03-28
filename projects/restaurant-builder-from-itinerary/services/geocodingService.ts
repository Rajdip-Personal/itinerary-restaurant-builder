// services/geocodingService.ts
// 4-tier geocoding pipeline: Landmark DB → Cache → Google API → (AI disabled) → null

import type { GeocodedLocation, ItineraryAttraction, Coordinates } from 'types/index';
import { PARIS_LANDMARKS, findLandmarkInCity } from 'data/landmarks/paris';
import type { Landmark } from 'data/landmarks/paris';
import { ROME_LANDMARKS } from 'data/landmarks/rome';
import { VENICE_LANDMARKS } from 'data/landmarks/venice';
import { getCachedGeocode, setCachedGeocode, buildCacheKey } from 'services/geocodingCache';
import { geocodeWithGoogle } from 'services/googleGeocodingService';

const ALL_LANDMARKS: Record<string, Landmark[]> = {
  paris: PARIS_LANDMARKS,
  rome: ROME_LANDMARKS,
  venice: VENICE_LANDMARKS,
};

// Confidence values per tier
const CONFIDENCE = {
  landmark: 1.0,
  cache: 0.9,
  google: 0.8,
  ai: 0.6,
} as const;

/**
 * Geocode a single attraction through the 4-tier pipeline.
 * Returns GeocodedLocation with source and confidence, or null if all tiers fail.
 */
export async function geocodeAttraction(
  name: string,
  cityId: string,
): Promise<GeocodedLocation | null> {
  // Guard: empty/whitespace name
  if (!name || !name.trim()) {
    console.log('[Geocoding] Empty name provided, returning null');
    return null;
  }

  const trimmedName = name.trim();

  // ─── Tier 1: Local Landmark Database ────────────────────────────────────
  const landmarks = ALL_LANDMARKS[cityId] || [];
  const landmark = findLandmarkInCity(trimmedName, cityId, landmarks);

  if (landmark) {
    console.log(`[Geocoding] Tier 1 hit: ${landmark.name} (landmark)`);
    return {
      name: landmark.name,
      coordinates: landmark.coordinates,
      source: 'landmark',
      confidence: CONFIDENCE.landmark,
    };
  }

  // ─── Tier 2: Cache ──────────────────────────────────────────────────────
  const cacheKey = buildCacheKey(trimmedName, cityId);
  const cached = getCachedGeocode(cacheKey);

  if (cached) {
    console.log(`[Geocoding] Tier 2 hit: ${trimmedName} (cache)`);
    return cached;
  }

  // ─── Tier 3: Google Geocoding API ───────────────────────────────────────
  try {
    const googleResult = await geocodeWithGoogle(trimmedName, cityId);

    if (googleResult) {
      const geocoded: GeocodedLocation = {
        name: trimmedName,
        coordinates: {
          latitude: googleResult.latitude,
          longitude: googleResult.longitude,
        },
        source: 'google',
        confidence: CONFIDENCE.google,
      };

      // Cache for future reuse
      setCachedGeocode(cacheKey, geocoded);
      console.log(`[Geocoding] Tier 3 hit: ${trimmedName} (google)`);
      return geocoded;
    }
  } catch (error) {
    console.log(`[Geocoding] Tier 3 error for ${trimmedName}: ${error}`);
  }

  // ─── Tier 4: AI Geocoding (DISABLED per PRD Section 20) ────────────────
  // Currently disabled. Falls through to null.
  console.log(`[Geocoding] All tiers missed for: ${trimmedName}`);
  return null;
}

/**
 * Batch geocode an array of ItineraryAttractions.
 * Skips geocoding for attractions that already have coordinates.
 */
export async function geocodeAttractions(
  attractions: ItineraryAttraction[],
  cityId: string,
): Promise<(GeocodedLocation | null)[]> {
  const results: (GeocodedLocation | null)[] = [];

  for (const attraction of attractions) {
    // Skip geocoding if coordinates already exist
    if (attraction.coordinates) {
      results.push({
        name: attraction.name,
        coordinates: attraction.coordinates,
        source: 'pre_existing' as GeocodedLocation['source'],
        confidence: 1.0,
      });
      continue;
    }

    const result = await geocodeAttraction(attraction.name, cityId);
    results.push(result);
  }

  return results;
}
