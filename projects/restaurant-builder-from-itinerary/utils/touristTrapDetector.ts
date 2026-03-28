// utils/touristTrapDetector.ts
// Detect tourist traps using landmark proximity, price-rating penalty, and quality bonus

import type { Restaurant, Coordinates } from 'types/index';
import { TOURIST_TRAP_THRESHOLD } from 'utils/constants';
import { calculateDistance } from 'utils/distance';
import { PARIS_LANDMARKS } from 'data/landmarks/paris';
import { ROME_LANDMARKS } from 'data/landmarks/rome';
import { VENICE_LANDMARKS } from 'data/landmarks/venice';
import type { Landmark } from 'data/landmarks/paris';

/**
 * Get landmarks for a given city.
 */
function getLandmarksForCity(cityId: string): Landmark[] {
  switch (cityId) {
    case 'paris': return PARIS_LANDMARKS;
    case 'rome': return ROME_LANDMARKS;
    case 'venice': return VENICE_LANDMARKS;
    default: return [];
  }
}

/**
 * Calculate landmark proximity score (0-40).
 * Distance tiers: 0-50m→40, 50-100m→30, 100-200m→20, 200-500m→10, 500m+→0
 */
export function calculateLandmarkProximityScore(
  coordinates: Coordinates,
  cityId: string,
): number {
  const landmarks = getLandmarksForCity(cityId);
  if (landmarks.length === 0) return 0;

  let maxScore = 0;
  for (const landmark of landmarks) {
    const dist = calculateDistance(coordinates, landmark.coordinates);
    let proximityScore = 0;
    if (dist <= 50) proximityScore = 40;
    else if (dist <= 100) proximityScore = 30;
    else if (dist <= 200) proximityScore = 20;
    else if (dist <= 500) proximityScore = 10;

    if (proximityScore > maxScore) {
      maxScore = proximityScore;
    }
  }

  return maxScore;
}

/**
 * Calculate price-rating penalty (0-35).
 * Only applies if near a landmark (<500m).
 */
export function calculatePriceRatingPenalty(
  restaurant: Restaurant,
  landmarkProximityScore: number,
): number {
  // Only applies near landmarks
  if (landmarkProximityScore === 0) return 0;

  const { priceLevel, rating } = restaurant;

  if (priceLevel >= 4 && rating < 4.0) return 35;
  if (priceLevel >= 4 && rating < 4.3) return 30;
  if (priceLevel >= 3 && rating < 4.0) return 30;
  if (priceLevel >= 3 && rating < 4.3) return 25;
  if (priceLevel >= 3 && rating < 4.5) return 15;

  return 0;
}

/**
 * Calculate quality bonus (reduces trap score).
 * High rating + many reviews = not a trap.
 */
export function calculateQualityBonus(restaurant: Restaurant): number {
  const { rating, reviewCount } = restaurant;

  if (rating >= 4.6 && reviewCount >= 1000) return -40;
  if (rating >= 4.5 && reviewCount >= 500) return -30;
  if (rating >= 4.4 && reviewCount >= 200) return -20;
  if (rating >= 4.3 && reviewCount >= 100) return -10;

  return 0;
}

/**
 * Calculate a tourist trap score (0-100) for a restaurant.
 * Components: landmark proximity (0-40) + price-rating penalty (0-35) + quality bonus (reduces)
 */
export function calculateTouristTrapScore(restaurant: Restaurant): number {
  const landmarkScore = calculateLandmarkProximityScore(
    restaurant.coordinates,
    restaurant.cityId,
  );
  const priceRatingPenalty = calculatePriceRatingPenalty(restaurant, landmarkScore);
  const qualityBonus = calculateQualityBonus(restaurant);

  const raw = landmarkScore + priceRatingPenalty + qualityBonus;
  return Math.min(100, Math.max(0, raw));
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
