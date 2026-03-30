// __tests__/utils/timeCalculator.test.ts
// Tests for timeline calculation from parsed itinerary attractions

import { calculateTimeline } from 'utils/timeCalculator';
import { PARIS_COORDS } from '__tests__/fixtures/index';
import type { ItineraryAttraction } from 'types/index';

// Three Paris attractions without placeholders, with coordinates
const threeAttractions: ItineraryAttraction[] = [
  {
    id: 'attr-1',
    name: 'Louvre Museum',
    estimatedTime: '9:00 AM',
    estimatedDuration: 180,
    isPlaceholder: false,
    cityId: 'paris',
    coordinates: PARIS_COORDS.louvre,
  },
  {
    id: 'attr-2',
    name: 'Notre-Dame Cathedral',
    estimatedTime: '2:00 PM',
    estimatedDuration: 90,
    isPlaceholder: false,
    cityId: 'paris',
    coordinates: PARIS_COORDS.notreDame,
  },
  {
    id: 'attr-3',
    name: 'Eiffel Tower',
    estimatedTime: '4:30 PM',
    estimatedDuration: 120,
    isPlaceholder: false,
    cityId: 'paris',
    coordinates: PARIS_COORDS.eiffelTower,
  },
];

describe('calculateTimeline', () => {
  it('calculates timeline from 3 attractions with sequential times', () => {
    const timeline = calculateTimeline(threeAttractions);

    expect(timeline).toHaveLength(3);

    // First attraction arrives at its estimated time
    expect(timeline[0].attractionId).toBe('attr-1');
    expect(timeline[0].attractionName).toBe('Louvre Museum');
    expect(timeline[0].arrivalTime).toBe('09:00');
    expect(timeline[0].durationMinutes).toBe(180);

    // Departure = arrival + duration
    expect(timeline[0].departureTime).toBe('12:00');

    // Transit info to next should exist
    expect(timeline[0].transitToNextMinutes).toBeDefined();
    expect(timeline[0].distanceToNextMeters).toBeDefined();
    expect(timeline[0].distanceToNextMeters).toBeGreaterThan(0);
  });

  it('produces sequential arrival/departure times', () => {
    const timeline = calculateTimeline(threeAttractions);

    // Each arrival should be >= previous departure + transit
    for (let i = 1; i < timeline.length; i++) {
      const prevDeparture = timeToMinutes(timeline[i - 1].departureTime);
      const transit = timeline[i - 1].transitToNextMinutes ?? 0;
      const currentArrival = timeToMinutes(timeline[i].arrivalTime);

      expect(currentArrival).toBeGreaterThanOrEqual(prevDeparture + transit);
    }
  });

  it('assigns walking mode for short distances', () => {
    const timeline = calculateTimeline(threeAttractions);

    // Louvre to Notre Dame is ~1.2km, walking ~15 min — should be walking
    expect(timeline[0].travelMode).toBe('walking');
  });

  it('assigns transit mode for long distances', () => {
    const timeline = calculateTimeline(threeAttractions);

    // Notre Dame to Eiffel Tower is ~4km, walking ~48 min — should be transit
    expect(timeline[1].travelMode).toBe('transit');
  });

  it('handles single attraction (no transit)', () => {
    const single: ItineraryAttraction[] = [threeAttractions[0]];
    const timeline = calculateTimeline(single);

    expect(timeline).toHaveLength(1);
    expect(timeline[0].attractionId).toBe('attr-1');
    expect(timeline[0].transitToNextMinutes).toBeUndefined();
    expect(timeline[0].distanceToNextMeters).toBeUndefined();
  });

  it('uses estimated time from attractions', () => {
    const timeline = calculateTimeline(threeAttractions);

    // First attraction should use its estimatedTime
    expect(timeline[0].arrivalTime).toBe('09:00');
  });

  it('last entry has no transit info', () => {
    const timeline = calculateTimeline(threeAttractions);
    const last = timeline[timeline.length - 1];

    expect(last.transitToNextMinutes).toBeUndefined();
    expect(last.distanceToNextMeters).toBeUndefined();
    expect(last.travelMode).toBeUndefined();
  });

  it('handles attractions without coordinates using default transit time', () => {
    const noCoords: ItineraryAttraction[] = [
      {
        id: 'nc-1',
        name: 'Place A',
        estimatedTime: '10:00 AM',
        estimatedDuration: 60,
        isPlaceholder: false,
      },
      {
        id: 'nc-2',
        name: 'Place B',
        estimatedTime: '11:30 AM',
        estimatedDuration: 60,
        isPlaceholder: false,
      },
    ];

    const timeline = calculateTimeline(noCoords);
    expect(timeline).toHaveLength(2);
    // Default transit of 10 min when no coordinates
    expect(timeline[0].transitToNextMinutes).toBe(10);
  });

  it('returns empty array for empty input', () => {
    const timeline = calculateTimeline([]);
    expect(timeline).toHaveLength(0);
  });
});

// Helper to convert HH:MM to minutes for comparison
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
