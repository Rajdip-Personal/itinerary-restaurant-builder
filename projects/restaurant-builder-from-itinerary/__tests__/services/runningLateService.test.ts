// __tests__/services/runningLateService.test.ts
// Tests for Running Late / GPS re-ranking service

import {
  recalculateForDelay,
  calculateUrgency,
  getTimeWarning,
  adjustForCurrentLocation,
} from 'services/runningLateService';
import {
  ENHANCED_PARIS_RESTAURANT,
  CLOSING_SOON_RESTAURANT,
  PARIS_RESTAURANTS,
  PARIS_COORDS,
  FIXED_TIMESTAMPS,
} from '__tests__/fixtures/index';
import type { EnhancedRestaurant, UrgencyState } from 'types/index';
import { PERFORMANCE_BUDGETS } from 'utils/constants';

// Build a set of test enhanced restaurants
const baseRouteContext = {
  position: 'between' as const,
  nearbyAttraction: 'Louvre Museum',
  estimatedTime: '12:30',
  walkTime: 8,
  routeFit: '8 min walk toward next stop',
};

const testRestaurants: EnhancedRestaurant[] = [
  {
    ...PARIS_RESTAURANTS[0],
    contextScore: 85,
    mealType: 'lunch',
    routeContext: baseRouteContext,
    weeklyHours: {
      monday: [{ open: '12:00', close: '23:00' }],
      tuesday: [{ open: '12:00', close: '23:00' }],
      wednesday: [{ open: '12:00', close: '23:00' }],
      thursday: [{ open: '12:00', close: '23:00' }],
      friday: [{ open: '12:00', close: '23:00' }],
      saturday: [{ open: '12:00', close: '23:00' }],
      sunday: 'closed',
    },
  },
  {
    ...PARIS_RESTAURANTS[1],
    contextScore: 78,
    mealType: 'lunch',
    routeContext: baseRouteContext,
    // No weeklyHours — will use isOpenNow fallback
  },
  CLOSING_SOON_RESTAURANT, // Closes at 14:30
];

describe('recalculateForDelay', () => {
  it('filters out restaurants closed after delay', () => {
    // Current time 14:00, delay 45 min → arrival 14:45
    // CLOSING_SOON closes at 14:30 → should be filtered
    const result = recalculateForDelay(testRestaurants, 45, '14:00');
    const closingIds = result.map((r) => r.id);
    expect(closingIds).not.toContain(CLOSING_SOON_RESTAURANT.id);
  });

  it('keeps restaurants open after delay', () => {
    // Current time 12:00, delay 30 min → arrival 12:30
    // Restaurant with close at 23:00 should remain
    const result = recalculateForDelay(testRestaurants, 30, '12:00');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r) => r.id === PARIS_RESTAURANTS[0].id)).toBe(true);
  });

  it('returns results sorted by adjusted score', () => {
    const result = recalculateForDelay(testRestaurants, 10, '12:00');
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].contextScore).toBeGreaterThanOrEqual(result[i].contextScore);
    }
  });

  it('returns empty array when all restaurants are closed', () => {
    // All close by 14:30 or have no hours, delay pushes past midnight
    const closingRestaurants: EnhancedRestaurant[] = [CLOSING_SOON_RESTAURANT];
    const result = recalculateForDelay(closingRestaurants, 60, '14:00');
    expect(result).toHaveLength(0);
  });

  it('completes within 2s performance budget', () => {
    const start = Date.now();
    // Run with a large set (repeat restaurants to simulate load)
    const manyRestaurants = Array.from({ length: 100 }, (_, i) => ({
      ...testRestaurants[0],
      id: `perf-${i}`,
    }));
    recalculateForDelay(manyRestaurants, 30, '12:00');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(PERFORMANCE_BUDGETS.rerank);
  });

  it('does not make any API calls (zero cost)', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    recalculateForDelay(testRestaurants, 30, '12:00');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('calculateUrgency', () => {
  it('returns upcoming when meal time > 30 min away', () => {
    const urgency = calculateUrgency(testRestaurants[0], '11:00');
    expect(urgency).toBe('upcoming');
  });

  it('returns active within meal window', () => {
    const urgency = calculateUrgency(testRestaurants[0], '13:00');
    expect(urgency).toBe('active');
  });

  it('returns closing_soon when < 30 min until close', () => {
    const urgency = calculateUrgency(CLOSING_SOON_RESTAURANT, '14:05');
    expect(urgency).toBe('closing_soon');
  });

  it('returns closed past closing time', () => {
    const urgency = calculateUrgency(CLOSING_SOON_RESTAURANT, '15:00');
    expect(urgency).toBe('closed');
  });

  it('falls back to isOpenNow when no weeklyHours', () => {
    const restaurant: EnhancedRestaurant = {
      ...testRestaurants[1],
      isOpenNow: false,
    };
    const urgency = calculateUrgency(restaurant, '13:00');
    expect(urgency).toBe('closed');
  });
});

describe('getTimeWarning', () => {
  it('returns closing warning when < 30 min until close', () => {
    const warning = getTimeWarning(CLOSING_SOON_RESTAURANT, '14:05', 'lunch');
    expect(warning).toMatch(/close|Closes/i);
  });

  it('returns undefined when restaurant has ample time', () => {
    const warning = getTimeWarning(testRestaurants[0], '12:30', 'lunch');
    expect(warning).toBeUndefined();
  });

  it('returns opening info for not-yet-open restaurants', () => {
    const restaurant: EnhancedRestaurant = {
      ...testRestaurants[0],
      weeklyHours: {
        monday: [{ open: '19:00', close: '23:00' }],
        tuesday: [{ open: '19:00', close: '23:00' }],
        wednesday: [{ open: '19:00', close: '23:00' }],
        thursday: [{ open: '19:00', close: '23:00' }],
        friday: [{ open: '19:00', close: '23:00' }],
        saturday: [{ open: '19:00', close: '23:00' }],
        sunday: 'closed',
      },
    };
    const warning = getTimeWarning(restaurant, '12:00', 'dinner');
    expect(warning).toMatch(/open|Opens/i);
  });
});

describe('adjustForCurrentLocation', () => {
  it('re-sorts by distance from current location', () => {
    // Current location is very close to restaurant[2] (closing soon)
    const result = adjustForCurrentLocation(
      testRestaurants,
      PARIS_RESTAURANTS[0].coordinates, // same as restaurant[0]
    );
    // Restaurant[0] should be first (closest to its own coordinates)
    expect(result[0].id).toBe(PARIS_RESTAURANTS[0].id);
  });

  it('returns same number of restaurants', () => {
    const result = adjustForCurrentLocation(testRestaurants, PARIS_COORDS.hotel);
    expect(result).toHaveLength(testRestaurants.length);
  });
});
