// utils/recommendationRanker.ts
// Scoring engine for restaurant recommendations
// Based on CultureGuideWeb reference scoring formulas

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
import { calculateTouristTrapScore } from 'utils/touristTrapDetector';

export const SCORING_VERSION = _VERSION;

export interface ScoringContext {
  targetCoordinates: Coordinates;
  hotelCoordinates?: Coordinates;
  mealType: MealType;
  currentTime?: string;
  previousCuisines?: string[];
  /** Route progress 0.0–1.0 (how far along the day's route this meal falls) */
  routeProgress?: number;
}

// ─── Sub-Score Functions ────────────────────────────────────────────────────

/**
 * Quality score (0-25 pts).
 * Rating component (0-12.5): (rating / 5) × 12.5
 * Review count component (0-12.5): min(12.5, log10(reviewCount + 1) × 4.166)
 */
export function calculateQualityScore(restaurant: Restaurant): number {
  const ratingScore = (restaurant.rating / 5) * 12.5;
  const reviewScore = Math.min(12.5, Math.log10(restaurant.reviewCount + 1) * 4.166);
  return Math.min(SCORE_WEIGHTS.quality, ratingScore + reviewScore);
}

/**
 * Authenticity score (0-20 pts).
 * Formula: (100 - touristTrapScore) / 5
 * Depends on tourist trap detection — a score of 0 gets 20, score of 70 gets 6, score of 100 gets 0.
 */
export function calculateAuthenticityScore(restaurant: Restaurant): number {
  const trapScore = calculateTouristTrapScore(restaurant);
  return Math.min(SCORE_WEIGHTS.authenticity, Math.max(0, (100 - trapScore) / 5));
}

/**
 * Convenience score (0-43 pts) — distance tiers.
 * <100m: 43, 100-200m: 38, 200-400m: 32, 400-600m: 21, 600-800m: 10, >800m: 0
 * Returns null for >800m (hard exclusion signal).
 *
 * Hotel bonus: +5 if within 500m of hotel (capped at 43).
 */
export function calculateConvenienceScore(
  restaurant: Restaurant,
  targetCoordinates: Coordinates,
  hotelCoordinates?: Coordinates,
): number | null {
  const distanceMeters = calculateDistance(restaurant.coordinates, targetCoordinates);

  // Hard exclusion: >800m
  if (distanceMeters > 800) return null;

  let distanceScore: number;
  if (distanceMeters < 100) distanceScore = 43;
  else if (distanceMeters < 200) distanceScore = 38;
  else if (distanceMeters < 400) distanceScore = 32;
  else if (distanceMeters < 600) distanceScore = 21;
  else distanceScore = 10; // 600-800m

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
 * Timing score (0-15 pts).
 * Open now: +10, Meal type match: +5 (bakery for breakfast, etc.)
 */
export function calculateTimingScore(
  restaurant: Restaurant,
  mealType: MealType,
  _currentTime?: string,
): number {
  let score = 0;

  // Open now bonus
  if (restaurant.isOpenNow) {
    score += 10;
  }

  // Meal type match
  const type = restaurant.type ?? 'restaurant';
  const cuisines = restaurant.cuisineTypes;

  if (mealType === 'breakfast') {
    if (type === 'bakery' || type === 'patisserie' || cuisines.includes('bakery') || cuisines.includes('pastry')) {
      score += 5;
    }
  } else if (mealType === 'lunch') {
    if (type === 'trattoria' || type === 'osteria' || type === 'bacaro' || type === 'restaurant') {
      score += 5;
    }
  } else if (mealType === 'dinner') {
    if (type === 'trattoria' || type === 'osteria' || type === 'restaurant') {
      score += 5;
    }
  } else if (mealType === 'snack') {
    if (type === 'gelateria' || type === 'bakery' || type === 'patisserie') {
      score += 5;
    }
  }

  return Math.min(SCORE_WEIGHTS.timing, score);
}

/**
 * Curation score (0-5 pts).
 * In curated list: +3, Has famous dishes: +1, Has local tips: +1
 */
export function calculateCurationScore(restaurant: Restaurant): number {
  let score = 0;

  // All restaurants in our system come from curated data
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
 * Progression score (-15 to +5).
 * Breakfast: near hotel + toward first attraction = +5
 * Lunch: 33-66% route progression = +5
 * Dinner: near hotel (≤500m) = +5, OR 66-100% route progression
 */
export function calculateProgressionScore(
  restaurant: Restaurant,
  previousCuisines: string[],
  mealType?: MealType,
  routeProgress?: number,
  hotelCoordinates?: Coordinates,
): number {
  if (previousCuisines.length === 0 && routeProgress === undefined) return 0;

  let score = 0;

  // Route-progress-based scoring
  if (routeProgress !== undefined && mealType) {
    if (mealType === 'breakfast' && routeProgress <= 0.1) {
      score += 5;
    } else if (mealType === 'lunch' && routeProgress >= 0.33 && routeProgress <= 0.66) {
      score += 5;
    } else if (mealType === 'dinner') {
      if (routeProgress >= 0.66) {
        score += 5;
      }
      // Hotel proximity bonus for dinner
      if (hotelCoordinates) {
        const hotelDist = calculateDistance(restaurant.coordinates, hotelCoordinates);
        if (hotelDist <= 500) {
          score = 5; // Cap, don't double-count with route progress
        }
      }
    }
  }

  // Cuisine variety penalty (applies on top)
  if (previousCuisines.length > 0) {
    const hasExactRepeat = restaurant.cuisineTypes.some((c) => previousCuisines.includes(c));
    if (hasExactRepeat) {
      score -= 15;
    } else {
      const SIMILAR_CUISINES: Record<string, string[]> = {
        roman: ['italian'],
        italian: ['roman', 'pizza', 'pasta'],
        venetian: ['italian'],
        french: ['bistro'],
        bistro: ['french'],
      };
      const hasSimilar = restaurant.cuisineTypes.some((c) => {
        const similar = SIMILAR_CUISINES[c] ?? [];
        return similar.some((s) => previousCuisines.includes(s));
      });
      if (hasSimilar) {
        score -= 5;
      }
    }
  }

  return Math.min(5, Math.max(-15, score));
}

// ─── Full Scoring ───────────────────────────────────────────────────────────

/**
 * Score a single restaurant against a context. Returns ScoreBreakdown.
 * Returns null if restaurant is excluded (>800m from target).
 */
export function scoreRestaurant(
  restaurant: Restaurant,
  context: ScoringContext,
): ScoreBreakdown | null {
  const quality = calculateQualityScore(restaurant);
  const authenticity = calculateAuthenticityScore(restaurant);

  const convenienceResult = calculateConvenienceScore(
    restaurant,
    context.targetCoordinates,
    context.hotelCoordinates,
  );

  // Hard exclusion: >800m
  if (convenienceResult === null) return null;

  const convenience = convenienceResult;

  // Extract distance score and hotel bonus for breakdown
  const distanceMeters = calculateDistance(restaurant.coordinates, context.targetCoordinates);
  let distanceScore: number;
  if (distanceMeters < 100) distanceScore = 43;
  else if (distanceMeters < 200) distanceScore = 38;
  else if (distanceMeters < 400) distanceScore = 32;
  else if (distanceMeters < 600) distanceScore = 21;
  else distanceScore = 10;

  let hotelBonus = 0;
  if (context.hotelCoordinates) {
    const hotelDist = calculateDistance(restaurant.coordinates, context.hotelCoordinates);
    if (hotelDist <= 500) hotelBonus = 5;
  }

  const timing = calculateTimingScore(restaurant, context.mealType, context.currentTime);
  const curation = calculateCurationScore(restaurant);
  const progressionScore = calculateProgressionScore(
    restaurant,
    context.previousCuisines ?? [],
    context.mealType,
    context.routeProgress,
    context.hotelCoordinates,
  );

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
 * Restaurants >800m from target are excluded.
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

  const scored: EnhancedRestaurant[] = [];

  for (const restaurant of restaurants) {
    const breakdown = scoreRestaurant(restaurant, context);
    // Skip excluded restaurants (>800m)
    if (breakdown === null) continue;

    scored.push({
      ...restaurant,
      contextScore: breakdown.total,
      scoreBreakdown: breakdown,
      mealType: context.mealType,
      routeContext: defaultRouteContext,
    });
  }

  scored.sort((a, b) => b.contextScore - a.contextScore);

  console.log(`[Ranker] ${scored.length} restaurants scored (${restaurants.length - scored.length} excluded >800m)`);

  return scored;
}
