// utils/recommendationRanker.ts
// Scoring engine for restaurant recommendations

import type {
  Restaurant,
  EnhancedRestaurant,
  ScoreBreakdown,
  MealType,
  Coordinates,
  RouteContext,
} from 'types/index';
import { SCORE_WEIGHTS, MAX_SCORE, SCORING_VERSION as _VERSION } from 'utils/constants';
import { calculateDistance } from 'utils/distance';

export const SCORING_VERSION = _VERSION;

const LOCAL_TYPES = new Set([
  'trattoria', 'osteria', 'bacaro', 'pizzeria', 'bakery', 'patisserie', 'gelateria',
]);

const SIMILAR_CUISINES: Record<string, string[]> = {
  roman: ['italian'],
  italian: ['roman', 'pizza', 'pasta'],
  venetian: ['italian'],
  french: ['bistro'],
  bistro: ['french'],
};

export interface ScoringContext {
  targetCoordinates: Coordinates;
  hotelCoordinates?: Coordinates;
  mealType: MealType;
  currentTime?: string;
  previousCuisines?: string[];
}

// ─── Sub-Score Functions ────────────────────────────────────────────────────

/**
 * Quality score based on rating (0-5) and review count.
 * Formula: (rating / 5) * 20 + min(reviewCount / 500, 1) * 5
 */
export function calculateQualityScore(restaurant: Restaurant): number {
  const ratingComponent = (restaurant.rating / 5) * 20;
  const reviewComponent = Math.min(restaurant.reviewCount / 500, 1) * 5;
  return Math.min(SCORE_WEIGHTS.quality, ratingComponent + reviewComponent);
}

/**
 * Authenticity score based on restaurant type, cuisine, and price level.
 * Local/traditional types score higher. Lower prices for non-fine-dining = more authentic.
 */
export function calculateAuthenticityScore(restaurant: Restaurant): number {
  let score = 0;

  // Restaurant type bonus
  if (restaurant.type && LOCAL_TYPES.has(restaurant.type)) {
    score += 10;
  } else {
    score += 3;
  }

  // Price level: lower = more authentic (for non-fine-dining)
  score += Math.max(0, (4 - restaurant.priceLevel)) * 2;

  // Non-generic cuisine bonus
  const hasLocalCuisine = restaurant.cuisineTypes.some(
    (c) => !['italian', 'french', 'pizza', 'pasta'].includes(c),
  );
  if (hasLocalCuisine) {
    score += 3;
  }

  return Math.min(SCORE_WEIGHTS.authenticity, score);
}

/**
 * Convenience score based on distance from target attraction.
 * distanceScore: max(0, 43 - (distanceMeters / 100))
 * Hotel proximity bonus: +5 if within 500m of hotel (capped at 43 total)
 */
export function calculateConvenienceScore(
  restaurant: Restaurant,
  targetCoordinates: Coordinates,
  hotelCoordinates?: Coordinates,
): number {
  const distanceMeters = calculateDistance(restaurant.coordinates, targetCoordinates);
  let distanceScore = Math.max(0, SCORE_WEIGHTS.convenience - distanceMeters / 100);

  let hotelBonus = 0;
  if (hotelCoordinates) {
    const hotelDist = calculateDistance(restaurant.coordinates, hotelCoordinates);
    if (hotelDist <= 500) {
      hotelBonus = 5;
    }
  }

  return Math.min(SCORE_WEIGHTS.convenience, distanceScore + hotelBonus);
}

/**
 * Timing score based on open status, reservation requirements, and meal timing.
 */
export function calculateTimingScore(
  restaurant: Restaurant,
  mealType: MealType,
  currentTime?: string,
): number {
  let score = 0;

  // Base: is restaurant currently open?
  if (restaurant.isOpenNow) {
    score += 8;
  } else {
    score += 2;
  }

  // Reservation penalty: essential reservations with lead time reduce spontaneity
  if (restaurant.reservationRequired === 'none') {
    score += 5;
  } else if (restaurant.reservationRequired === 'recommended') {
    score += 3;
  } else if (restaurant.reservationRequired === 'essential') {
    const leadDays = restaurant.reservationLeadDays ?? 0;
    if (leadDays > 3) {
      score += 0;
    } else {
      score += 1;
    }
  }

  // Off-peak arrival bonus
  if (currentTime) {
    const hour = parseInt(currentTime.split(':')[0], 10);
    const minute = parseInt(currentTime.split(':')[1], 10);
    const timeDecimal = hour + minute / 60;

    if (mealType === 'lunch' && timeDecimal < 12.0) {
      score += 2;
    } else if (mealType === 'dinner' && timeDecimal < 19.0) {
      score += 2;
    }
  }

  return Math.min(SCORE_WEIGHTS.timing, score);
}

/**
 * Curation score based on presence of curated data.
 * In curated list: +3, Famous dishes: +1, Local tips (via safeDishes richness): +1
 */
export function calculateCurationScore(restaurant: Restaurant): number {
  let score = 0;

  // Is in curated list? We treat all restaurants as curated (+3) — adjust if needed
  score += 3;

  // Has famous dishes?
  if (restaurant.famousFor.length > 0) {
    score += 1;
  }

  // Has rich safe dishes (proxy for local tips/curation depth)?
  const totalSafeDishes =
    restaurant.safeDishes.vegetarian.length +
    restaurant.safeDishes.vegan.length +
    (restaurant.safeDishes.glutenFree?.length ?? 0) +
    (restaurant.safeDishes.dairyFree?.length ?? 0);
  if (totalSafeDishes >= 3) {
    score += 1;
  }

  return Math.min(SCORE_WEIGHTS.curation, score);
}

/**
 * Progression score based on cuisine variety.
 * New cuisine type: +5, Same cuisine as previous: -15, Similar: -5
 */
export function calculateProgressionScore(
  restaurant: Restaurant,
  previousCuisines: string[],
): number {
  if (previousCuisines.length === 0) return 0;

  const restaurantCuisines = restaurant.cuisineTypes;

  // Check for exact repetition
  const hasExactRepeat = restaurantCuisines.some((c) => previousCuisines.includes(c));
  if (hasExactRepeat) return -15;

  // Check for similar cuisine
  const hasSimilar = restaurantCuisines.some((c) => {
    const similar = SIMILAR_CUISINES[c] ?? [];
    return similar.some((s) => previousCuisines.includes(s));
  });
  if (hasSimilar) return -5;

  // New cuisine type
  return 5;
}

// ─── Full Scoring ───────────────────────────────────────────────────────────

/**
 * Score a single restaurant against a context. Returns ScoreBreakdown.
 */
export function scoreRestaurant(
  restaurant: Restaurant,
  context: ScoringContext,
): ScoreBreakdown {
  const quality = calculateQualityScore(restaurant);
  const authenticity = calculateAuthenticityScore(restaurant);
  const convenienceRaw = calculateConvenienceScore(
    restaurant,
    context.targetCoordinates,
    context.hotelCoordinates,
  );

  // Extract sub-components for breakdown
  const distanceMeters = calculateDistance(restaurant.coordinates, context.targetCoordinates);
  const distanceScore = Math.max(0, SCORE_WEIGHTS.convenience - distanceMeters / 100);
  let hotelBonus = 0;
  if (context.hotelCoordinates) {
    const hotelDist = calculateDistance(restaurant.coordinates, context.hotelCoordinates);
    if (hotelDist <= 500) hotelBonus = 5;
  }

  const convenience = convenienceRaw;
  const timing = calculateTimingScore(restaurant, context.mealType, context.currentTime);
  const curation = calculateCurationScore(restaurant);
  const progressionScore = context.previousCuisines
    ? calculateProgressionScore(restaurant, context.previousCuisines)
    : 0;

  const rawTotal = quality + authenticity + convenience + timing + curation + progressionScore;
  const total = Math.min(MAX_SCORE, Math.max(0, rawTotal));

  return {
    quality,
    authenticity,
    convenience,
    timing,
    curation,
    total,
    distanceScore: Math.min(SCORE_WEIGHTS.convenience, distanceScore),
    progressionScore,
    hotelBonus,
  };
}

// ─── Ranking ────────────────────────────────────────────────────────────────

/**
 * Score and rank restaurants. Returns EnhancedRestaurant[] sorted by total score descending.
 */
export function rankRestaurants(
  restaurants: Restaurant[],
  context: ScoringContext,
): EnhancedRestaurant[] {
  if (restaurants.length === 0) return [];

  console.log(`[Ranker] Scoring ${restaurants.length} restaurants (v${SCORING_VERSION})`);

  const defaultRouteContext: RouteContext = {
    position: 'between',
    nearbyAttraction: 'Target Location',
    walkTime: 0,
    routeFit: 'Near target location',
  };

  return restaurants
    .map((restaurant) => {
      const breakdown = scoreRestaurant(restaurant, context);
      return {
        ...restaurant,
        contextScore: breakdown.total,
        scoreBreakdown: breakdown,
        mealType: context.mealType,
        routeContext: defaultRouteContext,
      } as EnhancedRestaurant;
    })
    .sort((a, b) => b.contextScore - a.contextScore);
}
