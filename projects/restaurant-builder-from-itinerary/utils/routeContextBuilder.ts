// utils/routeContextBuilder.ts
// Build RouteContext for each restaurant relative to itinerary attractions

import type {
  Restaurant,
  RouteContext,
  ItineraryAttraction,
  TimelineEntry,
  Coordinates,
} from 'types/index';
import { calculateDistance } from 'utils/distance';

const WALKING_SPEED_MPS = 1.4; // ~5 km/h average walking speed

/**
 * Build a RouteContext describing a restaurant's position relative to attractions and timeline.
 */
export function buildRouteContext(
  restaurant: Restaurant,
  attractions: ItineraryAttraction[],
  timeline: TimelineEntry[],
): RouteContext {
  if (attractions.length === 0) {
    return {
      position: 'before',
      nearbyAttraction: 'Unknown',
      walkTime: 0,
      routeFit: 'No attractions in itinerary',
    };
  }

  // Find nearest attraction
  let nearestIdx = 0;
  let nearestDist = Infinity;

  for (let i = 0; i < attractions.length; i++) {
    const attr = attractions[i];
    if (!attr.coordinates) continue;
    const dist = calculateDistance(restaurant.coordinates, attr.coordinates);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestIdx = i;
    }
  }

  const nearestAttraction = attractions[nearestIdx];
  const walkTimeMinutes = Math.round(nearestDist / WALKING_SPEED_MPS / 60);

  // Determine position relative to itinerary
  const position = determinePosition(nearestIdx, attractions.length);

  // Build route fit description
  const routeFit = buildRouteFitString(walkTimeMinutes, position, nearestAttraction.name);

  // Get estimated time from timeline if available
  const timelineEntry = timeline.find((t) => t.attractionId === nearestAttraction.id);
  const estimatedTime = timelineEntry?.arrivalTime;

  return {
    position,
    nearbyAttraction: nearestAttraction.name,
    estimatedTime,
    walkTime: walkTimeMinutes,
    routeFit,
  };
}

function determinePosition(
  nearestIdx: number,
  totalAttractions: number,
): 'before' | 'after' | 'between' {
  if (totalAttractions <= 1) return 'before';
  if (nearestIdx === 0) return 'before';
  if (nearestIdx === totalAttractions - 1) return 'after';
  return 'between';
}

function buildRouteFitString(
  walkTime: number,
  position: 'before' | 'after' | 'between',
  attractionName: string,
): string {
  const timeStr = walkTime <= 1 ? '1 min' : `${walkTime} min`;

  switch (position) {
    case 'before':
      return `${timeStr} walk from ${attractionName}`;
    case 'after':
      return `${timeStr} walk from ${attractionName}`;
    case 'between':
      return `${timeStr} walk toward next stop`;
  }
}
