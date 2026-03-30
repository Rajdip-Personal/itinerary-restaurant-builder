// utils/routeCorridorSearch.ts
// Calculate bounding box along route and filter points by proximity

import type { RoutePoint, Coordinates, BoundingBox } from 'types/index';
import { calculateDistance } from 'utils/distance';

const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Calculate a bounding box around route points with padding in meters.
 * Returns empty box (all zeros) for empty route.
 */
export function calculateRouteBoundingBox(
  routePoints: RoutePoint[],
  paddingMeters: number,
): BoundingBox {
  if (routePoints.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  for (const point of routePoints) {
    if (point.latitude > north) north = point.latitude;
    if (point.latitude < south) south = point.latitude;
    if (point.longitude > east) east = point.longitude;
    if (point.longitude < west) west = point.longitude;
  }

  if (paddingMeters > 0) {
    const centerLat = (north + south) / 2;
    const latPad = paddingMeters / METERS_PER_DEGREE_LAT;
    const lonPad = paddingMeters / (METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180));

    north += latPad;
    south -= latPad;
    east += lonPad;
    west -= lonPad;
  }

  console.log(
    `[Corridor] Bounding box: N=${north.toFixed(4)} S=${south.toFixed(4)} E=${east.toFixed(4)} W=${west.toFixed(4)} (padding: ${paddingMeters}m)`,
  );

  return { north, south, east, west };
}

/**
 * Filter candidate coordinates by proximity to a route path.
 * Returns only candidates within maxDistanceMeters of any route segment.
 */
export function filterByRouteProximity(
  candidates: Coordinates[],
  routePoints: RoutePoint[],
  maxDistanceMeters: number,
): Coordinates[] {
  if (candidates.length === 0 || routePoints.length === 0) return [];

  console.log(
    `[Corridor] Filtering ${candidates.length} candidates by proximity (max ${maxDistanceMeters}m)`,
  );

  const filtered = candidates.filter((candidate) => {
    const minDist = getMinDistanceToRoute(candidate, routePoints);
    return minDist <= maxDistanceMeters;
  });

  console.log(
    `[Corridor] ${filtered.length} within corridor, ${candidates.length - filtered.length} filtered out`,
  );

  return filtered;
}

/**
 * Get the minimum distance from a point to any segment of the route.
 */
function getMinDistanceToRoute(
  point: Coordinates,
  routePoints: RoutePoint[],
): number {
  if (routePoints.length === 1) {
    return calculateDistance(point, {
      latitude: routePoints[0].latitude,
      longitude: routePoints[0].longitude,
    });
  }

  let minDistance = Infinity;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const segStart = routePoints[i];
    const segEnd = routePoints[i + 1];
    const dist = perpendicularDistance(point, segStart, segEnd);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
}

/**
 * Calculate perpendicular distance from point to line segment.
 * If projection falls outside segment, returns distance to nearest endpoint.
 */
function perpendicularDistance(
  point: Coordinates,
  segStart: RoutePoint,
  segEnd: RoutePoint,
): number {
  const dx = segEnd.longitude - segStart.longitude;
  const dy = segEnd.latitude - segStart.latitude;

  if (dx === 0 && dy === 0) {
    return calculateDistance(point, { latitude: segStart.latitude, longitude: segStart.longitude });
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.longitude - segStart.longitude) * dx + (point.latitude - segStart.latitude) * dy) /
        (dx * dx + dy * dy),
    ),
  );

  const projection: Coordinates = {
    latitude: segStart.latitude + t * dy,
    longitude: segStart.longitude + t * dx,
  };

  return calculateDistance(point, projection);
}
