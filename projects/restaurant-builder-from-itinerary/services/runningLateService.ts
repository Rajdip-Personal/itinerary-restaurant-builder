// services/runningLateService.ts
// Running Late / GPS re-ranking — zero API cost, < 2s performance budget

import type { EnhancedRestaurant, UrgencyState, MealType, Coordinates } from 'types/index';
import { calculateDistance } from 'utils/distance';

/**
 * Parse "HH:MM" string to minutes since midnight.
 */
function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Get closing time in minutes for a restaurant (uses monday as default day).
 * Returns null if closed or no hours data.
 */
function getClosingTime(restaurant: EnhancedRestaurant): number | null {
  if (!restaurant.weeklyHours) return null;

  const dayHours = restaurant.weeklyHours.monday;
  if (dayHours === 'closed' || !dayHours || dayHours.length === 0) return null;

  const lastSlot = dayHours[dayHours.length - 1];
  return parseTime(lastSlot.close);
}

/**
 * Get opening time in minutes for a restaurant (uses monday as default day).
 * Returns null if closed or no hours data.
 */
function getOpeningTime(restaurant: EnhancedRestaurant): number | null {
  if (!restaurant.weeklyHours) return null;

  const dayHours = restaurant.weeklyHours.monday;
  if (dayHours === 'closed' || !dayHours || dayHours.length === 0) return null;

  return parseTime(dayHours[0].open);
}

/**
 * Re-rank restaurants based on a time delay (Running Late scenario).
 * Filters out restaurants that will be closed, adjusts timing scores.
 * Zero API calls — uses only local data.
 */
export function recalculateForDelay(
  currentRecommendations: EnhancedRestaurant[],
  delayMinutes: number,
  currentTime: string,
): EnhancedRestaurant[] {
  const arrivalMinutes = parseTime(currentTime) + delayMinutes;

  return currentRecommendations
    .filter((r) => {
      const closingMinutes = getClosingTime(r);
      if (closingMinutes === null) {
        return r.isOpenNow !== false;
      }
      return arrivalMinutes < closingMinutes;
    })
    .map((r) => {
      const closingMinutes = getClosingTime(r);
      let timingPenalty = 0;

      if (closingMinutes !== null) {
        const remainingMinutes = closingMinutes - arrivalMinutes;
        if (remainingMinutes < 30) {
          timingPenalty = 5;
        }
      }

      return {
        ...r,
        contextScore: Math.max(0, r.contextScore - timingPenalty),
      };
    })
    .sort((a, b) => b.contextScore - a.contextScore);
}

/**
 * Calculate urgency state for a restaurant at the current time.
 */
export function calculateUrgency(
  restaurant: EnhancedRestaurant,
  currentTime: string,
): UrgencyState {
  const currentMinutes = parseTime(currentTime);
  const closingMinutes = getClosingTime(restaurant);
  const openingMinutes = getOpeningTime(restaurant);

  if (closingMinutes === null || openingMinutes === null) {
    return restaurant.isOpenNow === false ? 'closed' : 'active';
  }

  if (currentMinutes >= closingMinutes) return 'closed';
  if (currentMinutes < openingMinutes) return 'upcoming';
  if (closingMinutes - currentMinutes < 30) return 'closing_soon';

  return 'active';
}

/**
 * Generate a time warning message for a restaurant.
 * Returns undefined if no warning needed.
 */
export function getTimeWarning(
  restaurant: EnhancedRestaurant,
  currentTime: string,
  _mealType: MealType,
): string | undefined {
  const currentMinutes = parseTime(currentTime);
  const closingMinutes = getClosingTime(restaurant);
  const openingMinutes = getOpeningTime(restaurant);

  if (closingMinutes === null || openingMinutes === null) return undefined;

  if (currentMinutes < openingMinutes) {
    const openH = Math.floor(openingMinutes / 60);
    const openM = openingMinutes % 60;
    return `Opens at ${String(openH).padStart(2, '0')}:${String(openM).padStart(2, '0')}`;
  }

  const remaining = closingMinutes - currentMinutes;
  if (remaining > 0 && remaining < 30) {
    return `Closes in ${remaining} minutes`;
  }

  return undefined;
}

/**
 * Re-calculate convenience scores from current GPS position instead of planned position.
 * Re-sorts by adjusted scores. Zero API calls.
 */
export function adjustForCurrentLocation(
  recommendations: EnhancedRestaurant[],
  currentCoordinates: Coordinates,
): EnhancedRestaurant[] {
  return recommendations
    .map((r) => {
      const distance = calculateDistance(currentCoordinates, r.coordinates);

      let distanceScore: number;
      if (distance < 100) distanceScore = 43;
      else if (distance < 200) distanceScore = 38;
      else if (distance < 400) distanceScore = 32;
      else if (distance < 600) distanceScore = 21;
      else if (distance < 800) distanceScore = 10;
      else distanceScore = 0;

      const originalConvenience = r.scoreBreakdown?.convenience ?? 30;
      const scoreDelta = distanceScore - originalConvenience;

      return {
        ...r,
        contextScore: Math.max(0, Math.min(110, r.contextScore + scoreDelta)),
      };
    })
    .sort((a, b) => b.contextScore - a.contextScore);
}
