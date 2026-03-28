// services/routePathGenerator.ts
// Generate walking route between geocoded locations using OSRM with straight-line fallback

import type { Coordinates, RoutePoint } from 'types/index';
import { calculateDistance } from 'utils/distance';
import { PERFORMANCE_BUDGETS } from 'utils/constants';

const OSRM_TIMEOUT_MS = PERFORMANCE_BUDGETS.osrm;
const TRANSIT_POINT_INTERVAL_M = 300;
const MAX_TRANSIT_POINTS_PER_SEGMENT = 10;

/**
 * Generate a walking route path through a list of coordinates.
 * Primary: OSRM API for realistic walking routes.
 * Fallback: Straight-line interpolation at ~300m intervals.
 */
export async function generateRoutePath(locations: Coordinates[]): Promise<RoutePoint[]> {
  if (locations.length === 0) return [];
  if (locations.length === 1) {
    return [{ latitude: locations[0].latitude, longitude: locations[0].longitude }];
  }

  // Try OSRM first
  try {
    const osrmRoute = await fetchOSRM(locations);
    if (osrmRoute) {
      console.log(`[Route] OSRM returned ${osrmRoute.length} waypoints`);
      return osrmRoute;
    }
  } catch (error) {
    console.log(`[Route] OSRM failed, using straight-line fallback: ${error}`);
  }

  // Fallback to straight-line interpolation
  console.log('[Route] Using straight-line fallback');
  return generateStraightLineFallback(locations);
}

/**
 * Fetch a walking route from the OSRM public API.
 * Uses https://router.project-osrm.org/route/v1/walking/{coords}
 * Returns RoutePoint[] or null on failure.
 */
async function fetchOSRM(locations: Coordinates[]): Promise<RoutePoint[] | null> {
  // Build coordinates string: "lon1,lat1;lon2,lat2;..."
  const coords = locations
    .map((loc) => `${loc.longitude},${loc.latitude}`)
    .join(';');

  const url = `https://router.project-osrm.org/route/v1/walking/${coords}?geometries=geojson&overview=full`;

  console.log(`[Route] Calling OSRM for ${locations.length} locations`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`[Route] OSRM HTTP ${response.status}`);
      return null;
    }

    const data = await response.json() as {
      code: string;
      routes?: Array<{
        geometry: { coordinates: [number, number][] };
        distance: number;
        duration: number;
      }>;
    };

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.log(`[Route] OSRM returned: ${data.code}`);
      return null;
    }

    const route = data.routes[0];

    // Convert GeoJSON [lon, lat] to RoutePoint {latitude, longitude}
    return route.geometry.coordinates.map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Generate a straight-line interpolated route with transit points every ~300m.
 * Used as fallback when OSRM is unavailable.
 */
export function generateStraightLineFallback(locations: Coordinates[]): RoutePoint[] {
  if (locations.length === 0) return [];
  if (locations.length === 1) {
    return [{ latitude: locations[0].latitude, longitude: locations[0].longitude }];
  }

  const points: RoutePoint[] = [];

  for (let i = 0; i < locations.length; i++) {
    const current = locations[i];

    // Add location point
    points.push({ latitude: current.latitude, longitude: current.longitude });

    // Interpolate transit points to next location
    if (i < locations.length - 1) {
      const next = locations[i + 1];
      const distance = calculateDistance(current, next);
      const numPoints = Math.min(
        Math.floor(distance / TRANSIT_POINT_INTERVAL_M),
        MAX_TRANSIT_POINTS_PER_SEGMENT,
      );

      for (let j = 1; j <= numPoints; j++) {
        const fraction = j / (numPoints + 1);
        points.push({
          latitude: current.latitude + (next.latitude - current.latitude) * fraction,
          longitude: current.longitude + (next.longitude - current.longitude) * fraction,
        });
      }
    }
  }

  console.log(`[Route] Straight-line fallback: ${points.length} points`);
  return points;
}
