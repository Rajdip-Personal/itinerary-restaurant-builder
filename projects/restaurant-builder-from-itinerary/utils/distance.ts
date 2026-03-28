// utils/distance.ts
// Haversine distance calculation and distance formatting

import type { Coordinates } from 'types/index';

const EARTH_RADIUS_M = 6_371_000;

/**
 * Calculate the great-circle distance between two coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  if (from.latitude === to.latitude && from.longitude === to.longitude) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLon = Math.sin(dLon / 2);
  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfDLon * sinHalfDLon;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Format a distance in meters to a human-readable string.
 * < 1000m → "350 m", >= 1000m → "1.5 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
