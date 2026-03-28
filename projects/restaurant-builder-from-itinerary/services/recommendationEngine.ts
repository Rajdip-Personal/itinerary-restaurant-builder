// services/recommendationEngine.ts
// 3-tier recommendation engine: manual curation → cache → AI generation
// Fallback chain: manual → cache → AI → stale cache → empty (never crash)

import type {
  Coordinates,
  MealType,
  RecommendationResult,
  EnhancedRestaurant,
  Restaurant,
  RestaurantInsights,
  RoutePoint,
  TokenUsage,
} from 'types/index';
import { searchNearbyRestaurants } from 'services/restaurantSearch';
import { rankRestaurants, SCORING_VERSION } from 'utils/recommendationRanker';
import type { ScoringContext } from 'utils/recommendationRanker';
import { isTouristTrap, calculateTouristTrapScore } from 'utils/touristTrapDetector';
import { TOURIST_TRAP_THRESHOLD } from 'utils/constants';
import {
  buildRecommendationCacheKey,
  getCachedRecommendation,
  setCachedRecommendation,
  getStaleRecommendation,
} from 'services/recommendationCache';
import { trackTokenUsage } from 'utils/tokenTracker';

const BACKEND_URL = 'http://localhost:3000';

export interface RecommendationParams {
  cityId: string;
  coordinates: Coordinates;
  mealType: MealType;
  routePoints?: RoutePoint[];
  hotelCoordinates?: Coordinates;
  previousCuisines?: string[];
  forceRefresh?: boolean;
}

/**
 * Get manual (Tier 1) recommendations from curated restaurant data.
 */
export function getManualRecommendations(
  params: RecommendationParams,
): RecommendationResult | null {
  console.log(`[Engine] Tier 1: Manual search for ${params.cityId} ${params.mealType}`);

  const restaurants = searchNearbyRestaurants(
    params.coordinates,
    params.cityId,
  );

  if (restaurants.length === 0) {
    console.log('[Engine] Tier 1: No curated restaurants found');
    return null;
  }

  const context: ScoringContext = {
    targetCoordinates: params.coordinates,
    hotelCoordinates: params.hotelCoordinates,
    mealType: params.mealType,
    previousCuisines: params.previousCuisines,
  };

  const ranked = rankRestaurants(restaurants, context);

  // Filter out tourist traps
  const filtered = ranked.filter((r) => {
    const trapScore = calculateTouristTrapScore(r);
    return !isTouristTrap(trapScore);
  });

  if (filtered.length === 0) {
    console.log('[Engine] Tier 1: All results filtered as tourist traps');
    return null;
  }

  console.log(`[Engine] Tier 1: Found ${filtered.length} manual recommendations`);

  return {
    restaurants: filtered,
    source: 'manual',
    mealType: params.mealType,
    generatedAt: Date.now(),
    cityId: params.cityId,
  };
}

/**
 * Get cached (Tier 2) recommendations.
 */
export function getCachedRecommendations(
  cacheKey: string,
): RecommendationResult | null {
  console.log(`[Engine] Tier 2: Checking cache for ${cacheKey}`);
  return getCachedRecommendation(cacheKey);
}

/**
 * Generate AI (Tier 3) recommendations via backend proxy.
 */
export async function generateAIRecommendations(
  params: RecommendationParams,
): Promise<RecommendationResult | null> {
  console.log(`[Engine] Tier 3: AI generation for ${params.cityId} ${params.mealType}`);

  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewText: `Recommend restaurants near ${params.coordinates.latitude},${params.coordinates.longitude} in ${params.cityId} for ${params.mealType}`,
      }),
    });

    if (!response.ok) {
      console.log(`[Engine] Tier 3: API error ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      analysis: { restaurants?: Restaurant[] };
      usage?: TokenUsage;
    };

    if (data.usage) {
      trackTokenUsage(data.usage);
    }

    const aiRestaurants = data.analysis?.restaurants ?? [];
    if (aiRestaurants.length === 0) {
      console.log('[Engine] Tier 3: No restaurants from AI');
      return null;
    }

    // Score AI results through the ranker
    const context: ScoringContext = {
      targetCoordinates: params.coordinates,
      hotelCoordinates: params.hotelCoordinates,
      mealType: params.mealType,
      previousCuisines: params.previousCuisines,
    };

    const ranked = rankRestaurants(aiRestaurants, context);

    const result: RecommendationResult = {
      restaurants: ranked,
      source: 'ai',
      mealType: params.mealType,
      generatedAt: Date.now(),
      cityId: params.cityId,
    };

    // Cache the AI result
    const cacheKey = buildRecommendationCacheKey(
      params.cityId,
      params.mealType,
      params.coordinates.latitude,
      params.coordinates.longitude,
    );
    setCachedRecommendation(cacheKey, result);

    console.log(`[Engine] Tier 3: AI generated ${ranked.length} recommendations`);
    return result;
  } catch (error) {
    console.log(`[Engine] Tier 3: Error: ${error}`);
    return null;
  }
}

/**
 * Get recommendations using the 3-tier fallback chain.
 * Tier 1: Manual curation → Tier 2: Cache → Tier 3: AI → Stale cache → Empty
 */
export async function getRecommendations(
  params: RecommendationParams,
): Promise<RecommendationResult> {
  const cacheKey = buildRecommendationCacheKey(
    params.cityId,
    params.mealType,
    params.coordinates.latitude,
    params.coordinates.longitude,
  );

  // Tier 1: Manual curation
  const manual = getManualRecommendations(params);
  if (manual && manual.restaurants.length > 0) {
    return manual;
  }

  // Tier 2: Cache (skip if forceRefresh)
  if (!params.forceRefresh) {
    const cached = getCachedRecommendations(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Tier 3: AI generation
  const ai = await generateAIRecommendations(params);
  if (ai && ai.restaurants.length > 0) {
    return ai;
  }

  // Stale cache fallback
  const stale = getStaleRecommendation(cacheKey);
  if (stale) {
    console.log('[Engine] Using stale cache as final fallback');
    return stale;
  }

  // Empty result (never crash)
  console.log('[Engine] All tiers exhausted, returning empty result');
  return {
    restaurants: [],
    source: 'manual',
    mealType: params.mealType,
    generatedAt: Date.now(),
    cityId: params.cityId,
  };
}
