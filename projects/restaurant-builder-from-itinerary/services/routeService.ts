// services/routeService.ts
// Route calculation: OSRM via backend proxy with Haversine fallback

import type { RouteSegment, RoutePoint, Coordinates } from 'types/index';
import { CACHE_TTLS, PERFORMANCE_BUDGETS } from 'utils/constants';
import { haversineDistance, walkingTime } from 'services/timeCalculator';

const BACKEND_URL = 'http://localhost:3000';

interface RouteCache {
  [key: string]: { segment: RouteSegment; cachedAt: number };
}

const cache: RouteCache = {};

function cacheKey(from: Coordinates, to: Coordinates): string {
  return `${from.latitude},${from.longitude}->${to.latitude},${to.longitude}`;
}

/**
 * Calculate a route between two named locations.
 * Primary: OSRM via backend proxy.
 * Fallback: Haversine straight-line distance → estimated walking time.
 */
export async function calculateRoute(
  fromName: string,
  fromCoords: Coordinates,
  toName: string,
  toCoords: Coordinates,
): Promise<RouteSegment | null> {
  const key = cacheKey(fromCoords, toCoords);

  // Check cache (30-day TTL)
  const cached = cache[key];
  if (cached && Date.now() - cached.cachedAt < CACHE_TTLS.osrm) {
    console.log(`[Route] Cache hit: ${fromName} → ${toName}`);
    return cached.segment;
  }

  // Try OSRM
  try {
    const segment = await fetchOSRM(fromName, fromCoords, toName, toCoords);
    if (segment) {
      cache[key] = { segment, cachedAt: Date.now() };
      console.log(
        `[Route] OSRM: ${fromName} → ${toName} (${segment.distance}m, ${Math.round(segment.duration / 60)}min)`,
      );
      return segment;
    }
  } catch (error) {
    console.log(`[Route] OSRM failed for ${fromName} → ${toName}: ${error}`);
  }

  // Fallback: Haversine
  return haversineFallback(fromName, fromCoords, toName, toCoords);
}

async function fetchOSRM(
  fromName: string,
  from: Coordinates,
  toName: string,
  to: Coordinates,
): Promise<RouteSegment | null> {
  const response = await fetch(`${BACKEND_URL}/api/routing/osrm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coordinates: [
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OSRM responded with ${response.status}`);
  }

  const data = await response.json() as { routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }> };

  if (!data.routes || data.routes.length === 0) {
    return null;
  }

  const route = data.routes[0];
  const geometry: RoutePoint[] = route.geometry.coordinates.map(
    (coord: [number, number]) => ({
      latitude: coord[1],
      longitude: coord[0],
    }),
  );

  return {
    from: fromName,
    to: toName,
    distance: route.distance,
    duration: route.duration,
    geometry,
  };
}

function haversineFallback(
  fromName: string,
  from: Coordinates,
  toName: string,
  to: Coordinates,
): RouteSegment {
  const dist = haversineDistance(from, to);
  const walkSeconds = walkingTime(dist) * 60;

  console.log(
    `[Route] Haversine fallback: ${fromName} → ${toName} (${Math.round(dist)}m, ${Math.round(walkSeconds / 60)}min)`,
  );

  return {
    from: fromName,
    to: toName,
    distance: Math.round(dist),
    duration: walkSeconds,
    geometry: [
      { latitude: from.latitude, longitude: from.longitude },
      { latitude: to.latitude, longitude: to.longitude },
    ],
  };
}

/**
 * Calculate routes between sequential named locations.
 */
export async function calculateRoutes(
  points: { name: string; coordinates: Coordinates }[],
): Promise<RouteSegment[]> {
  if (points.length < 2) return [];

  const segments: RouteSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const segment = await calculateRoute(
      points[i].name,
      points[i].coordinates,
      points[i + 1].name,
      points[i + 1].coordinates,
    );
    if (segment) segments.push(segment);
  }

  return segments;
}

/**
 * Clear the in-memory route cache.
 */
export function clearRouteCache(): void {
  for (const key of Object.keys(cache)) {
    delete cache[key];
  }
  console.log('[Route] Cache cleared');
}
