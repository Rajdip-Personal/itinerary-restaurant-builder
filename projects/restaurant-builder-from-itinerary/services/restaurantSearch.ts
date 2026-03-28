// services/restaurantSearch.ts
// Search curated restaurant data by location, meal type, and route proximity

import type { Restaurant, Coordinates, RoutePoint, MealType } from 'types/index';
import { NEARBY_SEARCH } from 'utils/constants';
import { calculateDistance } from 'utils/distance';
import { filterByRouteProximity } from 'utils/routeCorridorSearch';
import { getParisRestaurants } from 'data/restaurants/paris';
import { getRomeRestaurants } from 'data/restaurants/rome';
import { getVeniceRestaurants } from 'data/restaurants/venice';

/**
 * Load curated restaurants for a city. Returns Restaurant[] (base type).
 */
function loadCityRestaurants(cityId: string): Restaurant[] {
  switch (cityId) {
    case 'paris':
      return getParisRestaurants();
    case 'rome':
      return getRomeRestaurants();
    case 'venice':
      return getVeniceRestaurants();
    default:
      console.log(`[Search] Unsupported city: ${cityId}`);
      return [];
  }
}

/**
 * Search nearby restaurants from curated data by distance from coordinates.
 * Filters by radius, minimum rating, and limits results.
 * Sorted by distance ascending.
 */
export function searchNearbyRestaurants(
  coordinates: Coordinates,
  cityId: string,
  radius: number = NEARBY_SEARCH.radius,
  mealType?: MealType,
): Restaurant[] {
  const allRestaurants = loadCityRestaurants(cityId);
  if (allRestaurants.length === 0) return [];

  console.log(`[Search] Searching ${allRestaurants.length} ${cityId} restaurants within ${radius}m`);

  const withDistance = allRestaurants
    .map((r) => ({
      restaurant: r,
      distance: calculateDistance(coordinates, r.coordinates),
    }))
    .filter((item) => item.distance <= radius)
    .filter((item) => item.restaurant.rating >= NEARBY_SEARCH.minRating)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, NEARBY_SEARCH.max);

  console.log(`[Search] Found ${withDistance.length} restaurants within ${radius}m`);

  return withDistance.map((item) => item.restaurant);
}

/**
 * Search for restaurants along a route corridor.
 * Uses routeCorridorSearch to find restaurants within buffer distance of route.
 */
export function searchAlongRoute(
  routePoints: RoutePoint[],
  cityId: string,
  bufferMeters: number = 400,
  mealType?: MealType,
): Restaurant[] {
  if (routePoints.length === 0) return [];

  const allRestaurants = loadCityRestaurants(cityId);
  if (allRestaurants.length === 0) return [];

  console.log(
    `[Search] Searching ${allRestaurants.length} ${cityId} restaurants along route (${routePoints.length} points, ${bufferMeters}m buffer)`,
  );

  const candidateCoords = allRestaurants.map((r) => r.coordinates);
  const filteredCoords = filterByRouteProximity(candidateCoords, routePoints, bufferMeters);

  // Map filtered coordinates back to restaurants
  const filteredSet = new Set(
    filteredCoords.map((c) => `${c.latitude},${c.longitude}`),
  );

  const results = allRestaurants.filter((r) =>
    filteredSet.has(`${r.coordinates.latitude},${r.coordinates.longitude}`),
  );

  console.log(`[Search] Found ${results.length} restaurants along route`);

  return results;
}
