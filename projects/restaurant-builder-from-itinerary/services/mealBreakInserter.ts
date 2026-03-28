// services/mealBreakInserter.ts
// Inserts meal breaks at appropriate European meal windows

import type { ItineraryAttraction, MealBreak, MealType, TimelineEntry } from 'types/index';
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

/**
 * Given a timeline of entries, determine where meal breaks should be inserted.
 * Accepts either TimelineEntry[] (new) or ItineraryAttraction[] (legacy).
 * Returns MealBreak[] — one per meal window that the itinerary spans.
 */
export function insertMealBreaks(
  entries: TimelineEntry[] | ItineraryAttraction[],
  cityId?: string,
): MealBreak[] {
  if (entries.length === 0) return [];

  // Normalize to a common shape: { name, start, end }
  const timeline = normalizeToTimeline(entries);
  if (timeline.length === 0) return [];

  const itineraryStart = timeline[0].start;
  const itineraryEnd = timeline[timeline.length - 1].end;

  const breaks: MealBreak[] = [];

  for (const window of MEAL_WINDOWS) {
    // Does the itinerary span this meal window?
    if (itineraryEnd < window.startMin) continue;
    if (itineraryStart >= window.endMin) continue;

    let suggestedMinutes: number;
    let nearEntry: NormalizedEntry;

    if (window.type === 'breakfast') {
      // Breakfast: suggest before the first attraction if there's a gap
      if (itineraryStart <= window.startMin) continue;
      // Suggest breakfast at window start or 1h before first attraction
      suggestedMinutes = Math.max(window.startMin, itineraryStart - 60);
      if (suggestedMinutes > window.endMin) continue;
      nearEntry = timeline[0];
    } else if (window.type === 'dinner') {
      // Dinner: suggest after the last attraction if timeline extends to evening
      const lastEntry = timeline[timeline.length - 1];
      suggestedMinutes = Math.max(window.startMin, lastEntry.end);
      if (suggestedMinutes > window.endMin) continue;
      nearEntry = lastEntry;
    } else {
      // Lunch: find the best gap near the lunch window
      nearEntry = timeline[0];

      for (const entry of timeline) {
        if (entry.end <= window.startMin) {
          nearEntry = entry;
        } else if (entry.start < window.startMin) {
          nearEntry = entry;
        }
      }

      suggestedMinutes = Math.max(window.startMin, nearEntry.end);
      if (suggestedMinutes > window.endMin) continue;
    }

    const mealWindow = MEAL_TIME_WINDOWS[window.type];

    const mealBreak: MealBreak = {
      mealType: window.type,
      suggestedTime: minutesToTimeString(suggestedMinutes),
      window: { start: mealWindow.start, end: mealWindow.end },
      nearAttraction: nearEntry.name,
      nearCoordinates: nearEntry.coordinates,
    };

    console.log(
      `[MealBreak] ${window.type} at ${mealBreak.suggestedTime} near ${mealBreak.nearAttraction}`,
    );

    breaks.push(mealBreak);
  }

  return breaks;
}

interface NormalizedEntry {
  name: string;
  start: number;
  end: number;
  coordinates?: { latitude: number; longitude: number };
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
    };
  });
}
