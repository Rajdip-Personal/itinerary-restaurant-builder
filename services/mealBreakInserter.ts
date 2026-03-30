// services/mealBreakInserter.ts
// Smart meal break placement — time-aware, location-aware, multi-candidate

import type {
  ItineraryAttraction,
  MealBreak,
  MealType,
  TimelineEntry,
  Coordinates,
  SmartMealBreak,
  MealPlacementCandidate,
} from 'types/index';
import { MEAL_TIME_WINDOWS } from 'utils/constants';
import { parseTimeToMinutes, minutesToTimeString } from 'services/timeCalculator';

interface MealWindow {
  type: MealType;
  startMin: number;
  endMin: number;
  duration: number; // minutes
}

const MEAL_WINDOWS: MealWindow[] = [
  {
    type: 'breakfast',
    startMin: parseTimeToMinutes(MEAL_TIME_WINDOWS.breakfast.start),
    endMin: parseTimeToMinutes(MEAL_TIME_WINDOWS.breakfast.end),
    duration: 30,
  },
  {
    type: 'lunch',
    startMin: parseTimeToMinutes(MEAL_TIME_WINDOWS.lunch.start),
    endMin: parseTimeToMinutes(MEAL_TIME_WINDOWS.lunch.end),
    duration: 60,
  },
  {
    type: 'dinner',
    startMin: parseTimeToMinutes(MEAL_TIME_WINDOWS.dinner.start),
    endMin: parseTimeToMinutes(MEAL_TIME_WINDOWS.dinner.end),
    duration: 60,
  },
];

interface NormalizedEntry {
  name: string;
  start: number;
  end: number;
  coordinates?: Coordinates;
  type?: string; // 'attraction' | 'meal' | 'hotel' | etc.
  cityId?: string;
}

/**
 * Compute midpoint between two coordinates.
 */
function midpoint(a: Coordinates, b: Coordinates): Coordinates {
  return {
    latitude: (a.latitude + b.latitude) / 2,
    longitude: (a.longitude + b.longitude) / 2,
  };
}

/**
 * Legacy API — returns single MealBreak per meal (backward compatible).
 * Uses the first candidate from smart placement.
 */
export function insertMealBreaks(
  entries: TimelineEntry[] | ItineraryAttraction[],
  cityId?: string,
  options?: {
    hotelCoordinates?: Coordinates;
    existingMealTypes?: MealType[];
  },
): MealBreak[] {
  const smart = insertSmartMealBreaks(entries, cityId, options);
  const breaks: MealBreak[] = [];

  for (const sm of smart) {
    if (sm.skipReason || sm.candidates.length === 0) continue;
    const best = sm.candidates[0];
    const mealWindow = MEAL_TIME_WINDOWS[sm.mealType];
    breaks.push({
      mealType: sm.mealType,
      suggestedTime: best.suggestedTime,
      window: { start: mealWindow.start, end: mealWindow.end },
      nearAttraction: best.nearAttraction,
      nearCoordinates: best.coordinates,
    });
  }

  return breaks;
}

/**
 * Smart meal break placement — returns ranked candidates per meal.
 * Considers gaps between attractions, route positions, hotel proximity, and time windows.
 */
export function insertSmartMealBreaks(
  entries: TimelineEntry[] | ItineraryAttraction[],
  cityId?: string,
  options?: {
    hotelCoordinates?: Coordinates;
    existingMealTypes?: MealType[];
  },
): SmartMealBreak[] {
  if (entries.length === 0) return [];

  const timeline = normalizeToTimeline(entries);
  if (timeline.length === 0) return [];

  const hotelCoords = options?.hotelCoordinates;
  const existingMeals = new Set(options?.existingMealTypes || []);

  const itineraryStart = timeline[0].start;
  const itineraryEnd = timeline[timeline.length - 1].end;

  const results: SmartMealBreak[] = [];

  for (const window of MEAL_WINDOWS) {
    const mealWindow = MEAL_TIME_WINDOWS[window.type];

    // Skip if user already has this meal
    if (existingMeals.has(window.type)) {
      console.log(`[MealBreak] Skipping ${window.type} — user already has one planned`);
      results.push({
        mealType: window.type,
        window: { start: mealWindow.start, end: mealWindow.end },
        candidates: [],
        skipReason: 'user already has this meal planned',
      });
      continue;
    }

    // Does the itinerary span this meal window?
    if (itineraryEnd < window.startMin) continue;
    if (itineraryStart >= window.endMin) continue;

    let candidates: MealPlacementCandidate[];

    if (window.type === 'breakfast') {
      candidates = generateBreakfastCandidates(timeline, window, hotelCoords);
    } else if (window.type === 'lunch') {
      candidates = generateLunchCandidates(timeline, window, hotelCoords);
    } else {
      candidates = generateDinnerCandidates(timeline, window, hotelCoords);
    }

    // Fallback: if no coordinate-based candidates but timeline spans this window,
    // generate a time-only candidate (e.g., TimelineEntry[] without coordinates)
    if (candidates.length === 0) {
      const fallbackEntry = findBestEntryForMeal(timeline, window);
      if (fallbackEntry) {
        const suggestedTime = minutesToTimeString(
          Math.max(window.startMin, Math.min(fallbackEntry.end, window.endMin)),
        );
        candidates.push({
          coordinates: fallbackEntry.coordinates || { latitude: 0, longitude: 0 },
          suggestedTime,
          nearAttraction: fallbackEntry.name,
          reason: `time-based fallback near ${fallbackEntry.name}`,
          cityId: fallbackEntry.cityId,
        });
      }
    }

    if (candidates.length > 0) {
      console.log(
        `[MealBreak] ${window.type}: ${candidates.length} candidates — best: ${candidates[0].reason}`,
      );
    } else {
      console.log(`[MealBreak] ${window.type}: no viable candidates`);
    }

    results.push({
      mealType: window.type,
      window: { start: mealWindow.start, end: mealWindow.end },
      candidates,
    });
  }

  return results;
}

/**
 * BREAKFAST candidates (07:00-10:30):
 * 1. Near hotel (morning departure — most natural)
 * 2. Between hotel and first attraction (on the way)
 * 3. Near first attraction
 */
function generateBreakfastCandidates(
  timeline: NormalizedEntry[],
  window: MealWindow,
  hotelCoords?: Coordinates,
): MealPlacementCandidate[] {
  const candidates: MealPlacementCandidate[] = [];
  const first = timeline[0];

  // Only suggest breakfast if itinerary starts during or after breakfast window
  if (first.start <= window.startMin) return [];

  const suggestedTime = minutesToTimeString(
    Math.max(window.startMin, first.start - 60),
  );

  // If suggested time is past the window, skip
  if (parseTimeToMinutes(suggestedTime) > window.endMin) return [];

  // Candidate 1: Near hotel
  if (hotelCoords) {
    candidates.push({
      coordinates: hotelCoords,
      suggestedTime,
      nearAttraction: 'Hotel',
      reason: 'near hotel before departure',
      cityId: first.cityId,
    });
  }

  // Candidate 2: Between hotel and first attraction
  if (hotelCoords && first.coordinates) {
    candidates.push({
      coordinates: midpoint(hotelCoords, first.coordinates),
      suggestedTime,
      nearAttraction: first.name,
      reason: `on the way from hotel to ${first.name}`,
      cityId: first.cityId,
    });
  }

  // Candidate 3: Near first attraction
  if (first.coordinates) {
    candidates.push({
      coordinates: first.coordinates,
      suggestedTime,
      nearAttraction: first.name,
      reason: `near first attraction ${first.name}`,
      cityId: first.cityId,
    });
  }

  return candidates;
}

/**
 * LUNCH candidates (12:00-14:30):
 * 1. Gap between attractions during lunch window (natural break)
 * 2. Near attraction ending closest to lunch start
 * 3. Midpoint of route during lunch window
 * 4. Near hotel if close to lunch window attractions
 */
function generateLunchCandidates(
  timeline: NormalizedEntry[],
  window: MealWindow,
  hotelCoords?: Coordinates,
): MealPlacementCandidate[] {
  const candidates: MealPlacementCandidate[] = [];

  // Find gaps between consecutive entries that overlap with lunch window
  for (let i = 0; i < timeline.length - 1; i++) {
    const current = timeline[i];
    const next = timeline[i + 1];
    const gapStart = current.end;
    const gapEnd = next.start;
    const gapMinutes = gapEnd - gapStart;

    // Gap must overlap lunch window and be at least 45 min
    if (gapMinutes >= 45 && gapStart < window.endMin && gapEnd > window.startMin) {
      const lunchTime = Math.max(window.startMin, gapStart);
      if (lunchTime <= window.endMin) {
        // Prefer coordinates of the earlier attraction (you're leaving from there)
        if (current.coordinates) {
          candidates.push({
            coordinates: current.coordinates,
            suggestedTime: minutesToTimeString(lunchTime),
            nearAttraction: current.name,
            reason: `gap between ${current.name} and ${next.name}`,
            cityId: current.cityId,
          });
        }
        // Also consider midpoint between the two
        if (current.coordinates && next.coordinates) {
          candidates.push({
            coordinates: midpoint(current.coordinates, next.coordinates),
            suggestedTime: minutesToTimeString(lunchTime),
            nearAttraction: current.name,
            reason: `on route between ${current.name} and ${next.name}`,
            cityId: current.cityId,
          });
        }
      }
    }
  }

  // Candidate: near attraction ending closest to lunch start
  let bestEntry: NormalizedEntry | null = null;
  let bestDiff = Infinity;
  for (const entry of timeline) {
    const diff = Math.abs(entry.end - window.startMin);
    if (diff < bestDiff && entry.coordinates) {
      bestDiff = diff;
      bestEntry = entry;
    }
  }
  if (bestEntry && bestEntry.coordinates) {
    const lunchTime = Math.max(window.startMin, bestEntry.end);
    if (lunchTime <= window.endMin) {
      candidates.push({
        coordinates: bestEntry.coordinates,
        suggestedTime: minutesToTimeString(lunchTime),
        nearAttraction: bestEntry.name,
        reason: `near ${bestEntry.name} (closest to lunch time)`,
        cityId: bestEntry.cityId,
      });
    }
  }

  return candidates;
}

/**
 * DINNER candidates (19:00-22:00):
 * 1. Gap between attractions during dinner window
 * 2. Near the earlier attraction of a gap (where restaurants are)
 * 3. Between last attraction and hotel
 * 4. Near hotel (only if arrival < 22:00)
 * 5. After last attraction (fallback)
 */
function generateDinnerCandidates(
  timeline: NormalizedEntry[],
  window: MealWindow,
  hotelCoords?: Coordinates,
): MealPlacementCandidate[] {
  const candidates: MealPlacementCandidate[] = [];
  const lastEntry = timeline[timeline.length - 1];

  // Candidate type 1: Gap between attractions during dinner window
  for (let i = 0; i < timeline.length - 1; i++) {
    const current = timeline[i];
    const next = timeline[i + 1];
    const gapStart = current.end;
    const gapEnd = next.start;
    const gapMinutes = gapEnd - gapStart;

    // Gap must overlap dinner window and be at least 60 min
    if (gapMinutes >= 60 && gapStart < window.endMin && gapEnd > window.startMin) {
      const dinnerTime = Math.max(window.startMin, gapStart);
      if (dinnerTime <= window.endMin) {
        // Near the earlier attraction (more likely to have restaurants nearby)
        if (current.coordinates) {
          candidates.push({
            coordinates: current.coordinates,
            suggestedTime: minutesToTimeString(dinnerTime),
            nearAttraction: current.name,
            reason: `gap between ${current.name} and ${next.name}`,
            cityId: current.cityId,
          });
        }
        // On the route between the two attractions
        if (current.coordinates && next.coordinates) {
          candidates.push({
            coordinates: midpoint(current.coordinates, next.coordinates),
            suggestedTime: minutesToTimeString(dinnerTime),
            nearAttraction: current.name,
            reason: `on route between ${current.name} and ${next.name}`,
            cityId: current.cityId,
          });
        }
      }
    }
  }

  // Candidate type 2: Between last attraction and hotel
  if (hotelCoords && lastEntry.coordinates && lastEntry.end <= window.endMin) {
    const dinnerTime = Math.max(window.startMin, lastEntry.end);
    if (dinnerTime <= window.endMin) {
      candidates.push({
        coordinates: midpoint(lastEntry.coordinates, hotelCoords),
        suggestedTime: minutesToTimeString(dinnerTime),
        nearAttraction: lastEntry.name,
        reason: `between ${lastEntry.name} and hotel`,
        cityId: lastEntry.cityId,
      });
    }
  }

  // Candidate type 3: Near hotel (only if arrival before 22:00)
  if (hotelCoords) {
    // Estimate hotel arrival: last entry end + ~30min travel
    const estimatedHotelArrival = lastEntry.end + 30;
    if (estimatedHotelArrival < window.endMin) {
      const dinnerTime = Math.max(window.startMin, estimatedHotelArrival);
      if (dinnerTime <= window.endMin) {
        candidates.push({
          coordinates: hotelCoords,
          suggestedTime: minutesToTimeString(dinnerTime),
          nearAttraction: 'Hotel',
          reason: `near hotel (arrival before ${minutesToTimeString(window.endMin)})`,
          cityId: lastEntry.cityId,
        });
      }
    }
  }

  // Candidate type 4: After last attraction (original fallback)
  if (lastEntry.coordinates) {
    const dinnerTime = Math.max(window.startMin, lastEntry.end);
    if (dinnerTime <= window.endMin) {
      candidates.push({
        coordinates: lastEntry.coordinates,
        suggestedTime: minutesToTimeString(dinnerTime),
        nearAttraction: lastEntry.name,
        reason: `after last attraction ${lastEntry.name}`,
        cityId: lastEntry.cityId,
      });
    }
  }

  return candidates;
}

/**
 * Find the timeline entry closest to a meal window (for time-only fallback).
 */
function findBestEntryForMeal(
  timeline: NormalizedEntry[],
  window: MealWindow,
): NormalizedEntry | null {
  let best: NormalizedEntry | null = null;
  let bestDiff = Infinity;
  for (const entry of timeline) {
    // Prefer entry whose end time is closest to the window start
    const diff = Math.abs(entry.end - window.startMin);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = entry;
    }
  }
  return best;
}

function normalizeToTimeline(
  entries: TimelineEntry[] | ItineraryAttraction[],
): NormalizedEntry[] {
  if (entries.length === 0) return [];

  // Detect type by checking for TimelineEntry-specific fields
  const first = entries[0];
  if ('arrivalTime' in first && 'departureTime' in first) {
    // TimelineEntry[]
    return (entries as TimelineEntry[]).map((e) => ({
      name: e.attractionName,
      start: parseTimeToMinutes(e.arrivalTime),
      end: parseTimeToMinutes(e.departureTime),
    }));
  }

  // ItineraryAttraction[] (legacy)
  const attractions = (entries as ItineraryAttraction[]).filter((a) => !a.isPlaceholder);
  return attractions.map((a) => {
    const start = parseTimeToMinutes(a.estimatedTime);
    return {
      name: a.name,
      start,
      end: start + a.estimatedDuration,
      coordinates: a.coordinates,
      cityId: a.cityId,
    };
  });
}
