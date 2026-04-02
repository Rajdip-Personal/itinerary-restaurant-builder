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
import { searchNearbyRestaurants, searchAlongRoute } from 'services/restaurantSearch';
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
import { trackTokenUsage, canAffordRequest } from 'utils/tokenTracker';

const BACKEND_URL = 'http://localhost:3000';
const ESTIMATED_AI_TOKENS = 2000; // Estimated tokens per AI recommendation request

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
 * Evaluate recommendation quality to decide if Tier 1 results are good enough.
 * Returns true if results meet minimum quality bar.
 */
export function evaluateRecommendationQuality(
  restaurants: EnhancedRestaurant[],
): { isGoodQuality: boolean; reason: string; avgScore: number } {
  if (restaurants.length < 2) {
    return { isGoodQuality: false, reason: 'Too few recommendations', avgScore: 0 };
  }

  const avgScore = restaurants.reduce((sum, r) => sum + r.contextScore, 0) / restaurants.length;

  if (avgScore < 50) {
    return { isGoodQuality: false, reason: `Average score too low (${avgScore.toFixed(1)})`, avgScore };
  }

  const highScoreCount = restaurants.filter((r) => r.contextScore >= 60).length;
  const highScoreRatio = highScoreCount / restaurants.length;

  if (highScoreRatio < 0.6) {
    return { isGoodQuality: false, reason: `Only ${(highScoreRatio * 100).toFixed(0)}% have score ≥60`, avgScore };
  }

  return { isGoodQuality: true, reason: 'Good quality', avgScore };
}

/**
 * Get manual (Tier 1) recommendations from curated restaurant data.
 */
export function getManualRecommendations(
  params: RecommendationParams,
): RecommendationResult | null {
  console.log(`[Engine] Tier 1: Manual search for ${params.cityId} ${params.mealType}`);

  let restaurants: Restaurant[] = [];

  // Prefer route-aware search when route points are available
  if (params.routePoints && params.routePoints.length >= 2) {
    console.log(`[Engine] Tier 1: Route-aware search (${params.routePoints.length} points, 500m buffer)`);
    restaurants = searchAlongRoute(
      params.routePoints,
      params.cityId,
      500, // 500m buffer from route
      params.mealType,
    );
    if (restaurants.length > 0) {
      console.log(`[Engine] Tier 1: Found ${restaurants.length} restaurants along route`);
    } else {
      console.log('[Engine] Tier 1: No restaurants along route, falling back to radius search');
    }
  }

  // Fall back to radius search if route search found nothing
  if (restaurants.length === 0) {
    restaurants = searchNearbyRestaurants(
      params.coordinates,
      params.cityId,
    );
  }

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
    const response = await fetch(`${BACKEND_URL}/api/ai/recommend-restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal': 'recommendation-engine' },
      body: JSON.stringify({
        latitude: params.coordinates.latitude,
        longitude: params.coordinates.longitude,
        cityId: params.cityId,
        mealType: params.mealType,
      }),
    });

    if (!response.ok) {
      console.log(`[Engine] Tier 3: API error ${response.status}`);
      return null;
    }

    interface RawAIRestaurant {
      name: string;
      latitude: number;
      longitude: number;
      rating: number;
      reviewCount: number;
      type: string;
      cuisineTypes: string[];
      priceLevel: number;
    }

    const data = (await response.json()) as {
      restaurants: RawAIRestaurant[];
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    if (data.usage) {
      trackTokenUsage({
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        estimatedCost: 0,
      });
    }

    const aiRestaurants: Restaurant[] = (data.restaurants ?? []).map((r, i) => ({
      id: `ai-${params.cityId}-${params.mealType}-${i}`,
      name: r.name,
      address: '',
      cityId: params.cityId,
      coordinates: { latitude: r.latitude, longitude: r.longitude },
      rating: r.rating ?? 0,
      reviewCount: r.reviewCount ?? 0,
      priceLevel: r.priceLevel ?? 2,
      cuisineTypes: r.cuisineTypes ?? [],
      isOpenNow: true,
      famousFor: [],
      safeDishes: { vegetarian: [], vegan: [] },
      type: (r.type as Restaurant['type']) ?? 'restaurant',
    }));
    if (aiRestaurants.length === 0) {
      console.log('[Engine] Tier 3: No restaurants from AI');
      return null;
    }

    // Geocode each AI restaurant via Google Places to replace hallucinated coordinates
    const CITY_NAMES: Record<string, string> = {
      paris: 'Paris, France',
      rome: 'Rome, Italy',
      venice: 'Venice, Italy',
    };

    const geocodeResults = await Promise.all(
      aiRestaurants.map(async (r) => {
        try {
          const cityName = CITY_NAMES[params.cityId] || params.cityId;
          const resp = await fetch(`${BACKEND_URL}/api/geocoding/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Internal': 'recommendation-engine' },
            body: JSON.stringify({ address: `${r.name}, ${cityName}` }),
          });
          if (!resp.ok) return null;
          const data = (await resp.json()) as {
            status: string;
            results: Array<{
              geometry: { location: { lat: number; lng: number } };
              formatted_address?: string;
            }>;
          };
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            const loc = result.geometry.location;
            return {
              ...r,
              coordinates: { latitude: loc.lat, longitude: loc.lng },
              address: result.formatted_address || r.address,
            };
          }
          return null;
        } catch {
          return null;
        }
      }),
    );

    // Filter out restaurants that couldn't be geocoded
    const geocodedRestaurants = geocodeResults.filter((r): r is Restaurant => r !== null);
    console.log(`[Engine] Tier 3: Geocoded ${geocodedRestaurants.length}/${aiRestaurants.length} AI restaurants`);

    if (geocodedRestaurants.length === 0) {
      console.log('[Engine] Tier 3: No restaurants could be geocoded');
      return null;
    }

    // Score AI results through the ranker
    const context: ScoringContext = {
      targetCoordinates: params.coordinates,
      hotelCoordinates: params.hotelCoordinates,
      mealType: params.mealType,
      previousCuisines: params.previousCuisines,
    };

    const ranked = rankRestaurants(geocodedRestaurants, context);

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

  // Tier 1: Manual curation (with quality gate)
  const manual = getManualRecommendations(params);
  if (manual && manual.restaurants.length > 0) {
    const quality = evaluateRecommendationQuality(manual.restaurants);
    if (quality.isGoodQuality) {
      console.log(`[Engine] Tier 1 passed quality gate (avg: ${quality.avgScore.toFixed(1)})`);
      return manual;
    }
    console.log(`[Engine] Tier 1 failed quality gate: ${quality.reason}, trying next tier`);
  }

  // Tier 2: Cache (skip if forceRefresh)
  if (!params.forceRefresh) {
    const cached = getCachedRecommendations(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Tier 3: AI generation (check budget first)
  if (canAffordRequest(ESTIMATED_AI_TOKENS)) {
    const ai = await generateAIRecommendations(params);
    if (ai && ai.restaurants.length > 0) {
      return ai;
    }
  } else {
    console.log('[Engine] Tier 3: Skipped — token budget exceeded');
  }

  // Stale cache fallback
  const stale = getStaleRecommendation(cacheKey);
  if (stale) {
    console.log('[Engine] Using stale cache as final fallback');
    return stale;
  }

  // Low-quality manual results are better than nothing
  if (manual && manual.restaurants.length > 0) {
    console.log('[Engine] Returning low-quality manual results as last resort');
    return manual;
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
