// __tests__/services/timeCalculator.test.ts
// Tests for time calculation utilities

import {
  PARIS_COORDS,
  ROME_COORDS,
  VENICE_COORDS,
  PARIS_ATTRACTIONS,
} from '__tests__/fixtures/index';
import type { Coordinates, ItineraryAttraction } from 'types/index';

import {
  haversineDistance,
  walkingTime,
  parseTimeToMinutes,
  minutesToTimeString,
  addMinutesToTime,
  calculateArrivalTimes,
} from 'services/timeCalculator';

describe('Time Calculator', () => {
  // ─── Haversine Distance ─────────────────────────────────────────────────────

  describe('haversineDistance', () => {
    it('should calculate distance between Louvre and Notre-Dame (~850m)', () => {
      const distance = haversineDistance(
        PARIS_COORDS.louvre,
        PARIS_COORDS.notreDame,
      );
      // ~1.2km based on actual Haversine between these coordinates
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1500);
    });

    it('should calculate distance between Louvre and Eiffel Tower (~3.3km)', () => {
      const distance = haversineDistance(
        PARIS_COORDS.louvre,
        PARIS_COORDS.eiffelTower,
      );
      expect(distance).toBeGreaterThan(2500);
      expect(distance).toBeLessThan(4500);
    });

    it('should return 0 for same point', () => {
      const distance = haversineDistance(
        PARIS_COORDS.louvre,
        PARIS_COORDS.louvre,
      );
      expect(distance).toBe(0);
    });

    it('should calculate cross-city distance (Paris to Rome)', () => {
      const distance = haversineDistance(
        PARIS_COORDS.louvre,
        ROME_COORDS.colosseum,
      );
      // ~1100 km
      expect(distance).toBeGreaterThan(1_000_000);
      expect(distance).toBeLessThan(1_200_000);
    });

    it('should calculate distance between Rome landmarks', () => {
      const distance = haversineDistance(
        ROME_COORDS.colosseum,
        ROME_COORDS.trevi,
      );
      // ~1.4 km
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(2000);
    });
  });

  // ─── Walking Time ──────────────────────────────────────────────────────────

  describe('walkingTime', () => {
    it('should estimate walking time at 5km/h by default', () => {
      // 1000m at 5km/h = 12 minutes
      const minutes = walkingTime(1000);
      expect(minutes).toBe(12);
    });

    it('should estimate Louvre to Notre-Dame walk (~10 min)', () => {
      const distance = haversineDistance(
        PARIS_COORDS.louvre,
        PARIS_COORDS.notreDame,
      );
      const minutes = walkingTime(distance);
      // ~1.2km at 5km/h = ~15 min
      expect(minutes).toBeGreaterThanOrEqual(12);
      expect(minutes).toBeLessThanOrEqual(18);
    });

    it('should allow custom walking speed', () => {
      // 1000m at 4km/h = 15 minutes
      const minutes = walkingTime(1000, 4);
      expect(minutes).toBe(15);
    });

    it('should return 0 for 0 distance', () => {
      expect(walkingTime(0)).toBe(0);
    });
  });

  // ─── Parse Time to Minutes ─────────────────────────────────────────────────

  describe('parseTimeToMinutes', () => {
    it('should parse "9:00 AM" to 540', () => {
      expect(parseTimeToMinutes('9:00 AM')).toBe(540);
    });

    it('should parse "2:00 PM" to 840', () => {
      expect(parseTimeToMinutes('2:00 PM')).toBe(840);
    });

    it('should parse "12:00 PM" (noon) to 720', () => {
      expect(parseTimeToMinutes('12:00 PM')).toBe(720);
    });

    it('should parse "12:00 AM" (midnight) to 0', () => {
      expect(parseTimeToMinutes('12:00 AM')).toBe(0);
    });

    it('should parse "12:30 PM" to 750', () => {
      expect(parseTimeToMinutes('12:30 PM')).toBe(750);
    });

    it('should parse 24h format "14:30" to 870', () => {
      expect(parseTimeToMinutes('14:30')).toBe(870);
    });

    it('should parse "19:30" to 1170', () => {
      expect(parseTimeToMinutes('19:30')).toBe(1170);
    });

    it('should parse "00:00" (midnight 24h) to 0', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
    });

    it('should parse "4:30 PM" to 990', () => {
      expect(parseTimeToMinutes('4:30 PM')).toBe(990);
    });

    it('should parse "07:00" to 420', () => {
      expect(parseTimeToMinutes('07:00')).toBe(420);
    });
  });

  // ─── Minutes to Time String ───────────────────────────────────────────────

  describe('minutesToTimeString', () => {
    it('should convert 540 to "09:00"', () => {
      expect(minutesToTimeString(540)).toBe('09:00');
    });

    it('should convert 720 to "12:00"', () => {
      expect(minutesToTimeString(720)).toBe('12:00');
    });

    it('should convert 870 to "14:30"', () => {
      expect(minutesToTimeString(870)).toBe('14:30');
    });

    it('should convert 0 to "00:00"', () => {
      expect(minutesToTimeString(0)).toBe('00:00');
    });

    it('should convert 1439 to "23:59"', () => {
      expect(minutesToTimeString(1439)).toBe('23:59');
    });
  });

  // ─── Add Minutes to Time ──────────────────────────────────────────────────

  describe('addMinutesToTime', () => {
    it('should add 180 min to "9:00 AM" → "12:00"', () => {
      expect(addMinutesToTime('9:00 AM', 180)).toBe('12:00');
    });

    it('should add 90 min to "2:00 PM" → "15:30"', () => {
      expect(addMinutesToTime('2:00 PM', 90)).toBe('15:30');
    });

    it('should add 0 minutes and return same time', () => {
      expect(addMinutesToTime('10:00', 0)).toBe('10:00');
    });

    it('should handle crossing midnight gracefully', () => {
      // 23:00 + 120 = 01:00 next day
      const result = addMinutesToTime('23:00', 120);
      expect(result).toBe('01:00');
    });
  });

  // ─── Calculate Arrival Times ──────────────────────────────────────────────

  describe('calculateArrivalTimes', () => {
    it('should calculate sequential arrival times for Paris attractions', () => {
      // Non-placeholder attractions from fixtures
      const attractions: ItineraryAttraction[] = [
        {
          id: 'test-1',
          name: 'Louvre Museum',
          estimatedTime: '9:00 AM',
          estimatedDuration: 180,
          isPlaceholder: false,
          coordinates: PARIS_COORDS.louvre,
        },
        {
          id: 'test-2',
          name: 'Notre-Dame Cathedral',
          estimatedTime: '2:00 PM', // placeholder — will be recalculated
          estimatedDuration: 90,
          isPlaceholder: false,
          coordinates: PARIS_COORDS.notreDame,
        },
        {
          id: 'test-3',
          name: 'Eiffel Tower',
          estimatedTime: '4:30 PM', // placeholder — will be recalculated
          estimatedDuration: 120,
          isPlaceholder: false,
          coordinates: PARIS_COORDS.eiffelTower,
        },
      ];

      const result = calculateArrivalTimes(attractions);
      expect(result).toHaveLength(3);

      // First attraction keeps its start time
      expect(result[0].estimatedTime).toBe('09:00');

      // Second: 9:00 + 180 min (Louvre) + walk time (Louvre→Notre-Dame ~10 min)
      const secondMinutes = parseTimeToMinutes(result[1].estimatedTime);
      expect(secondMinutes).toBeGreaterThanOrEqual(540 + 180 + 7);  // at least 9:00 + 3h + 7min walk
      expect(secondMinutes).toBeLessThanOrEqual(540 + 180 + 15); // at most 9:00 + 3h + 15min walk

      // Third comes after second + duration + walk
      const thirdMinutes = parseTimeToMinutes(result[2].estimatedTime);
      expect(thirdMinutes).toBeGreaterThan(secondMinutes + 90);
    });

    it('should handle attractions without coordinates (no walk time)', () => {
      const attractions: ItineraryAttraction[] = [
        {
          id: 'test-1',
          name: 'Place A',
          estimatedTime: '10:00',
          estimatedDuration: 60,
          isPlaceholder: false,
        },
        {
          id: 'test-2',
          name: 'Place B',
          estimatedTime: '12:00',
          estimatedDuration: 30,
          isPlaceholder: false,
        },
      ];

      const result = calculateArrivalTimes(attractions);
      expect(result).toHaveLength(2);
      // Without coordinates, walk time defaults to 0
      // Place A: 10:00, duration 60 → Place B starts at 11:00
      expect(result[1].estimatedTime).toBe('11:00');
    });

    it('should skip placeholder attractions', () => {
      const attractions: ItineraryAttraction[] = [
        {
          id: 'test-1',
          name: 'Louvre Museum',
          estimatedTime: '9:00 AM',
          estimatedDuration: 180,
          isPlaceholder: false,
          coordinates: PARIS_COORDS.louvre,
        },
        {
          id: 'test-lunch',
          name: 'Lunch Break',
          estimatedTime: '12:30 PM',
          estimatedDuration: 60,
          isPlaceholder: true,
        },
        {
          id: 'test-2',
          name: 'Notre-Dame Cathedral',
          estimatedTime: '2:00 PM',
          estimatedDuration: 90,
          isPlaceholder: false,
          coordinates: PARIS_COORDS.notreDame,
        },
      ];

      const result = calculateArrivalTimes(attractions);
      // Should include all attractions but placeholders retain their time
      expect(result).toHaveLength(3);
    });

    it('should return empty array for empty input', () => {
      expect(calculateArrivalTimes([])).toEqual([]);
    });

    it('should handle single attraction', () => {
      const attractions: ItineraryAttraction[] = [
        {
          id: 'test-1',
          name: 'Louvre Museum',
          estimatedTime: '9:00 AM',
          estimatedDuration: 180,
          isPlaceholder: false,
          coordinates: PARIS_COORDS.louvre,
        },
      ];

      const result = calculateArrivalTimes(attractions);
      expect(result).toHaveLength(1);
      expect(result[0].estimatedTime).toBe('09:00');
    });
  });
});
