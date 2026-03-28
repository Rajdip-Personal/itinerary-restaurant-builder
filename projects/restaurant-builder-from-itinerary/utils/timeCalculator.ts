// utils/timeCalculator.ts
// Calculate a full timeline with arrival/departure times and transit info

import type { ItineraryAttraction, TimelineEntry, Coordinates } from 'types/index';
import { calculateDistance } from 'utils/distance';
import { parseTimeToMinutes, minutesToTimeString } from 'services/timeCalculator';

const WALKING_SPEED_M_PER_MIN = (5 * 1000) / 60; // 5 km/h → ~83 m/min
const WALKING_THRESHOLD_MIN = 15;
const TRANSIT_BASE_MIN = 20;
const TRANSIT_PER_KM = 5;
const DEFAULT_TRANSIT_MIN = 10;

/**
 * Calculate transit time between two coordinates.
 * If walking time <= 15 min → walking. Otherwise → transit (20 min base + 5 min/km).
 */
function calculateTransitTime(
  from: Coordinates,
  to: Coordinates,
): { minutes: number; mode: 'walking' | 'transit'; distanceMeters: number } {
  const distanceMeters = calculateDistance(from, to);
  const walkingMinutes = distanceMeters / WALKING_SPEED_M_PER_MIN;

  if (walkingMinutes <= WALKING_THRESHOLD_MIN) {
    return {
      minutes: Math.ceil(walkingMinutes),
      mode: 'walking',
      distanceMeters,
    };
  }

  const transitMinutes = TRANSIT_BASE_MIN + (distanceMeters / 1000) * TRANSIT_PER_KM;
  return {
    minutes: Math.ceil(transitMinutes),
    mode: 'transit',
    distanceMeters,
  };
}

/**
 * Build a full timeline from parsed itinerary attractions.
 *
 * Each entry gets:
 * - arrivalTime / departureTime in HH:MM
 * - transitToNextMinutes / distanceToNextMeters / travelMode (for non-last entries)
 */
export function calculateTimeline(attractions: ItineraryAttraction[]): TimelineEntry[] {
  if (attractions.length === 0) return [];

  console.log(`[TimeCalc] Building timeline for ${attractions.length} attractions`);

  const entries: TimelineEntry[] = [];
  let currentMinutes = parseTimeToMinutes(attractions[0].estimatedTime);

  for (let i = 0; i < attractions.length; i++) {
    const attr = attractions[i];
    const arrivalMinutes = i === 0
      ? currentMinutes
      : currentMinutes;

    const departureMinutes = arrivalMinutes + attr.estimatedDuration;

    const entry: TimelineEntry = {
      attractionId: attr.id,
      attractionName: attr.name,
      arrivalTime: minutesToTimeString(arrivalMinutes),
      departureTime: minutesToTimeString(departureMinutes),
      durationMinutes: attr.estimatedDuration,
    };

    // Calculate transit to next attraction
    if (i < attractions.length - 1) {
      const next = attractions[i + 1];

      if (attr.coordinates && next.coordinates) {
        const transit = calculateTransitTime(attr.coordinates, next.coordinates);
        entry.transitToNextMinutes = transit.minutes;
        entry.distanceToNextMeters = Math.round(transit.distanceMeters);
        entry.travelMode = transit.mode;
        currentMinutes = departureMinutes + transit.minutes;
      } else {
        entry.transitToNextMinutes = DEFAULT_TRANSIT_MIN;
        currentMinutes = departureMinutes + DEFAULT_TRANSIT_MIN;
      }

      console.log(
        `[TimeCalc] ${attr.name}: ${entry.arrivalTime}→${entry.departureTime}, transit ${entry.transitToNextMinutes}min (${entry.travelMode ?? 'default'})`,
      );
    } else {
      currentMinutes = departureMinutes;
      console.log(
        `[TimeCalc] ${attr.name}: ${entry.arrivalTime}→${entry.departureTime} (last)`,
      );
    }

    entries.push(entry);
  }

  return entries;
}
