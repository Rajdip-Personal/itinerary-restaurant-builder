// services/timeCalculator.ts
// Time calculation utilities: Haversine distance, walking time, time parsing

import type { Coordinates, ItineraryAttraction } from 'types/index';

const EARTH_RADIUS_M = 6_371_000; // meters
const DEFAULT_WALKING_SPEED_KMH = 5;

/**
 * Calculate the great-circle distance between two coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  if (a.latitude === b.latitude && a.longitude === b.longitude) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLon = Math.sin(dLon / 2);
  const h = sinHalfDLat * sinHalfDLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDLon * sinHalfDLon;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Estimate walking time in minutes for a given distance in meters.
 * Default walking speed: 5 km/h.
 */
export function walkingTime(distanceMeters: number, speedKmh: number = DEFAULT_WALKING_SPEED_KMH): number {
  if (distanceMeters <= 0) return 0;
  const speedMPerMin = (speedKmh * 1000) / 60;
  return Math.round(distanceMeters / speedMPerMin);
}

/**
 * Parse a time string to minutes since midnight.
 * Supports: "9:00 AM", "2:00 PM", "14:30", "07:00"
 */
export function parseTimeToMinutes(time: string): number {
  const trimmed = time.trim();

  // Try 12-hour format: "9:00 AM", "12:30 PM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;

    return hours * 60 + minutes;
  }

  // Try 24-hour format: "14:30", "07:00"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  console.log(`[TimeCalc] Could not parse time: "${time}"`);
  return 0;
}

/**
 * Convert minutes since midnight to "HH:MM" 24-hour format string.
 */
export function minutesToTimeString(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440; // handle overflow
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Add minutes to a time string and return a new time string in HH:MM format.
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const base = parseTimeToMinutes(time);
  return minutesToTimeString(base + minutesToAdd);
}

/**
 * Calculate sequential arrival times for a list of attractions.
 * Each non-placeholder attraction's arrival = previous end time + walk time.
 * First attraction keeps its original start time.
 * Placeholder attractions retain their original time.
 */
export function calculateArrivalTimes(
  attractions: ItineraryAttraction[],
): ItineraryAttraction[] {
  if (attractions.length === 0) return [];

  const result: ItineraryAttraction[] = [];
  let currentMinutes = parseTimeToMinutes(attractions[0].estimatedTime);

  for (let i = 0; i < attractions.length; i++) {
    const attr = attractions[i];

    if (attr.isPlaceholder) {
      // Placeholders keep their original time; advance current time past them
      const placeholderStart = parseTimeToMinutes(attr.estimatedTime);
      result.push({ ...attr, estimatedTime: minutesToTimeString(placeholderStart) });
      currentMinutes = placeholderStart + attr.estimatedDuration;
      continue;
    }

    if (i === 0) {
      // First attraction: normalize time format
      result.push({ ...attr, estimatedTime: minutesToTimeString(currentMinutes) });
      currentMinutes += attr.estimatedDuration;
    } else {
      // Calculate walk time from previous non-placeholder attraction
      let walk = 0;
      const prevReal = findPreviousNonPlaceholder(result);
      if (prevReal?.coordinates && attr.coordinates) {
        const dist = haversineDistance(prevReal.coordinates, attr.coordinates);
        walk = walkingTime(dist);
      }

      const arrivalTime = currentMinutes + walk;
      result.push({ ...attr, estimatedTime: minutesToTimeString(arrivalTime) });
      currentMinutes = arrivalTime + attr.estimatedDuration;
    }
  }

  return result;
}

function findPreviousNonPlaceholder(
  processed: ItineraryAttraction[],
): ItineraryAttraction | undefined {
  for (let i = processed.length - 1; i >= 0; i--) {
    if (!processed[i].isPlaceholder) return processed[i];
  }
  return undefined;
}
