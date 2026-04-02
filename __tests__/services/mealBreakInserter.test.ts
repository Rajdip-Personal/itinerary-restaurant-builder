// __tests__/services/mealBreakInserter.test.ts
// Tests for meal break insertion into timelines

import { insertMealBreaks } from 'services/mealBreakInserter';
import { PARIS_COORDS } from '__tests__/fixtures/index';
import type { TimelineEntry } from 'types/index';
import { MEAL_TIME_WINDOWS } from 'utils/constants';

// A morning-to-evening Paris timeline (no meals yet)
const parisTimeline: TimelineEntry[] = [
  {
    attractionId: 'attr-1',
    attractionName: 'Louvre Museum',
    arrivalTime: '09:00',
    departureTime: '12:00',
    durationMinutes: 180,
    transitToNextMinutes: 15,
    distanceToNextMeters: 1200,
    travelMode: 'walking',
  },
  {
    attractionId: 'attr-2',
    attractionName: 'Notre-Dame Cathedral',
    arrivalTime: '12:15',
    departureTime: '13:45',
    durationMinutes: 90,
    transitToNextMinutes: 40,
    distanceToNextMeters: 4100,
    travelMode: 'transit',
  },
  {
    attractionId: 'attr-3',
    attractionName: 'Eiffel Tower',
    arrivalTime: '14:25',
    departureTime: '16:25',
    durationMinutes: 120,
  },
];

describe('insertMealBreaks', () => {
  it('inserts lunch between morning and afternoon attractions', () => {
    const breaks = insertMealBreaks(parisTimeline, 'paris');

    const lunch = breaks.find((b) => b.mealType === 'lunch');
    expect(lunch).toBeDefined();
    expect(lunch!.window).toEqual(MEAL_TIME_WINDOWS.lunch);
  });

  it('inserts dinner after last attraction if timeline extends to evening', () => {
    const eveningTimeline: TimelineEntry[] = [
      ...parisTimeline,
      {
        attractionId: 'attr-4',
        attractionName: 'Seine Cruise',
        arrivalTime: '17:00',
        departureTime: '19:00',
        durationMinutes: 120,
      },
    ];

    const breaks = insertMealBreaks(eveningTimeline, 'paris');
    const dinner = breaks.find((b) => b.mealType === 'dinner');
    expect(dinner).toBeDefined();
    expect(dinner!.window).toEqual(MEAL_TIME_WINDOWS.dinner);
  });

  it('lunch suggested time falls within lunch window', () => {
    const breaks = insertMealBreaks(parisTimeline, 'paris');
    const lunch = breaks.find((b) => b.mealType === 'lunch');

    expect(lunch).toBeDefined();
    const suggestedMinutes = timeToMinutes(lunch!.suggestedTime);
    const windowStart = timeToMinutes(MEAL_TIME_WINDOWS.lunch.start);
    const windowEnd = timeToMinutes(MEAL_TIME_WINDOWS.lunch.end);

    expect(suggestedMinutes).toBeGreaterThanOrEqual(windowStart);
    expect(suggestedMinutes).toBeLessThanOrEqual(windowEnd);
  });

  it('inserts breakfast for early-start timeline', () => {
    const earlyTimeline: TimelineEntry[] = [
      {
        attractionId: 'attr-early',
        attractionName: 'Morning Walk',
        arrivalTime: '10:00',
        departureTime: '11:30',
        durationMinutes: 90,
        transitToNextMinutes: 15,
        distanceToNextMeters: 1000,
        travelMode: 'walking',
      },
      ...parisTimeline.slice(1),
    ];

    const breaks = insertMealBreaks(earlyTimeline, 'paris');
    const breakfast = breaks.find((b) => b.mealType === 'breakfast');
    expect(breakfast).toBeDefined();
    expect(breakfast!.mealType).toBe('breakfast');
  });

  it('meal break has nearAttraction from closest timeline entry', () => {
    const breaks = insertMealBreaks(parisTimeline, 'paris');
    const lunch = breaks.find((b) => b.mealType === 'lunch');

    expect(lunch).toBeDefined();
    expect(lunch!.nearAttraction).toBeTruthy();
  });

  // Updated: all 3 meals are always suggested even for short timelines
  it('inserts all 3 meals even for a very short timeline', () => {
    const shortTimeline: TimelineEntry[] = [
      {
        attractionId: 'attr-short',
        attractionName: 'Quick Visit',
        arrivalTime: '15:00',
        departureTime: '16:00',
        durationMinutes: 60,
      },
    ];

    const breaks = insertMealBreaks(shortTimeline, 'paris');
    expect(breaks.find((b) => b.mealType === 'breakfast')).toBeDefined();
    expect(breaks.find((b) => b.mealType === 'lunch')).toBeDefined();
    expect(breaks.find((b) => b.mealType === 'dinner')).toBeDefined();
  });

  it('returns empty array for empty timeline', () => {
    const breaks = insertMealBreaks([], 'paris');
    expect(breaks).toHaveLength(0);
  });

  it('inserts dinner near hotel when itinerary ends before dinner window', () => {
    // Itinerary ends at 17:00 — before dinner window (19:00-22:00)
    // With hotel coords, dinner should still be suggested near hotel
    const earlyEndTimeline: TimelineEntry[] = [
      {
        attractionId: 'attr-1',
        attractionName: 'Louvre Museum',
        arrivalTime: '09:00',
        departureTime: '12:00',
        durationMinutes: 180,
        transitToNextMinutes: 15,
        distanceToNextMeters: 1200,
        travelMode: 'walking',
      },
      {
        attractionId: 'attr-2',
        attractionName: 'Musée d\'Orsay',
        arrivalTime: '14:00',
        departureTime: '17:00',
        durationMinutes: 180,
      },
    ];

    const breaks = insertMealBreaks(earlyEndTimeline, 'paris', {
      hotelCoordinates: PARIS_COORDS.hotel,
    });

    const dinner = breaks.find((b) => b.mealType === 'dinner');
    expect(dinner).toBeDefined();
    expect(dinner!.nearAttraction).toBe('Hotel');
    expect(dinner!.suggestedTime).toBe('19:00');
    expect(dinner!.window).toEqual(MEAL_TIME_WINDOWS.dinner);
  });

  // Updated: dinner is always suggested even without hotel — uses last attraction as fallback
  it('inserts dinner near last attraction when itinerary ends early and no hotel coords', () => {
    const earlyEndTimeline: TimelineEntry[] = [
      {
        attractionId: 'attr-1',
        attractionName: 'Louvre Museum',
        arrivalTime: '09:00',
        departureTime: '12:00',
        durationMinutes: 180,
      },
      {
        attractionId: 'attr-2',
        attractionName: 'Musée d\'Orsay',
        arrivalTime: '14:00',
        departureTime: '17:00',
        durationMinutes: 180,
      },
    ];

    const breaks = insertMealBreaks(earlyEndTimeline, 'paris');
    const dinner = breaks.find((b) => b.mealType === 'dinner');
    expect(dinner).toBeDefined();
    expect(dinner!.suggestedTime).toBe('19:00');
    expect(dinner!.nearAttraction).toBe('Musée d\'Orsay');
  });
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
