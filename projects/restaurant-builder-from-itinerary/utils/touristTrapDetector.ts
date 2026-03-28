// utils/touristTrapDetector.ts
// Detect tourist traps using review patterns and location signals

import type { Restaurant } from 'types/index';
import { TOURIST_TRAP_THRESHOLD } from 'utils/constants';

const LOCAL_RESTAURANT_TYPES = new Set([
  'trattoria', 'osteria', 'bacaro', 'pizzeria', 'bakery', 'patisserie', 'gelateria',
]);

const GENERIC_CUISINE_TYPES = new Set(['italian', 'french', 'pizza', 'pasta']);

/**
 * Calculate a tourist trap score (0-100) for a restaurant.
 * Higher score = more likely to be a tourist trap.
 */
export function calculateTouristTrapScore(restaurant: Restaurant): number {
  let score = 0;

  // High review count + mediocre rating → trap signal
  if (restaurant.reviewCount > 1000 && restaurant.rating < 4.0) {
    score += 30;
  } else if (restaurant.reviewCount > 500 && restaurant.rating < 4.0) {
    score += 15;
  }

  // Generic cuisine types → trap signal
  const hasGenericCuisine = restaurant.cuisineTypes.some((c) => GENERIC_CUISINE_TYPES.has(c));
  const hasOnlyGeneric = restaurant.cuisineTypes.every((c) => GENERIC_CUISINE_TYPES.has(c));
  if (hasOnlyGeneric && restaurant.cuisineTypes.length > 0) {
    score += 10;
  } else if (hasGenericCuisine) {
    score += 5;
  }

  // High price + no local restaurant type → trap signal
  const isLocalType = restaurant.type ? LOCAL_RESTAURANT_TYPES.has(restaurant.type) : false;
  if (restaurant.priceLevel >= 3 && !isLocalType) {
    score += 20;
  } else if (restaurant.priceLevel >= 3) {
    score += 5;
  }

  // No famous dishes → trap signal
  if (restaurant.famousFor.length === 0) {
    score += 15;
  }

  // Minimal safe dishes → trap signal (less curation = less care)
  const totalSafeDishes =
    restaurant.safeDishes.vegetarian.length +
    restaurant.safeDishes.vegan.length +
    (restaurant.safeDishes.glutenFree?.length ?? 0) +
    (restaurant.safeDishes.dairyFree?.length ?? 0);
  if (totalSafeDishes <= 1) {
    score += 10;
  } else if (totalSafeDishes <= 3) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Returns true if the tourist trap score meets or exceeds the threshold.
 */
export function isTouristTrap(score: number): boolean {
  return score >= TOURIST_TRAP_THRESHOLD;
}

/**
 * Returns a warning message if the restaurant is flagged as a tourist trap.
 */
export function getTouristTrapWarning(score: number): string | undefined {
  if (!isTouristTrap(score)) return undefined;
  return `High tourist trap risk (score: ${score}/100)`;
}
