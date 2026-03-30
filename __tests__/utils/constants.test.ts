// __tests__/utils/constants.test.ts
// Tests verifying constants are correctly defined

import {
  SCORING_VERSION,
  MAX_SCORE,
  SCORE_WEIGHTS,
  MEAL_TIME_WINDOWS,
  CACHE_TTLS,
  TOURIST_TRAP_THRESHOLD,
  TOKEN_BUDGET,
  PERFORMANCE_BUDGETS,
  NEARBY_SEARCH,
  SUPPORTED_CITIES,
  CITY_RESTAURANT_COUNTS,
} from 'utils/constants';

describe('Constants', () => {
  describe('SCORING_VERSION', () => {
    it('should be version 7', () => {
      expect(SCORING_VERSION).toBe(7);
    });
  });

  describe('MAX_SCORE', () => {
    it('should be 110', () => {
      expect(MAX_SCORE).toBe(110);
    });

    it('should be at least the sum of all score weight categories', () => {
      const sum =
        SCORE_WEIGHTS.quality +
        SCORE_WEIGHTS.authenticity +
        SCORE_WEIGHTS.convenience +
        SCORE_WEIGHTS.timing +
        SCORE_WEIGHTS.curation;
      // 25 + 20 + 43 + 15 + 5 = 108; MAX_SCORE is 110 (hotel bonus + progression can add)
      expect(sum).toBe(108);
      expect(MAX_SCORE).toBeGreaterThanOrEqual(sum);
    });
  });

  describe('SCORE_WEIGHTS', () => {
    it('should define correct category maximums', () => {
      expect(SCORE_WEIGHTS.quality).toBe(25);
      expect(SCORE_WEIGHTS.authenticity).toBe(20);
      expect(SCORE_WEIGHTS.convenience).toBe(43);
      expect(SCORE_WEIGHTS.timing).toBe(15);
      expect(SCORE_WEIGHTS.curation).toBe(5);
    });
  });

  describe('MEAL_TIME_WINDOWS', () => {
    it('should define European breakfast window (07:00-10:30)', () => {
      expect(MEAL_TIME_WINDOWS.breakfast.start).toBe('07:00');
      expect(MEAL_TIME_WINDOWS.breakfast.end).toBe('10:30');
    });

    it('should define European lunch window (12:00-14:30)', () => {
      expect(MEAL_TIME_WINDOWS.lunch.start).toBe('12:00');
      expect(MEAL_TIME_WINDOWS.lunch.end).toBe('14:30');
    });

    it('should define European dinner window (19:00-22:00)', () => {
      expect(MEAL_TIME_WINDOWS.dinner.start).toBe('19:00');
      expect(MEAL_TIME_WINDOWS.dinner.end).toBe('22:00');
    });

    it('should not overlap between meal windows', () => {
      // Breakfast ends before lunch starts
      expect(MEAL_TIME_WINDOWS.breakfast.end < MEAL_TIME_WINDOWS.lunch.start).toBe(true);
      // Lunch ends before dinner starts
      expect(MEAL_TIME_WINDOWS.lunch.end < MEAL_TIME_WINDOWS.dinner.start).toBe(true);
    });
  });

  describe('CACHE_TTLS', () => {
    it('should define TTLs for all cache categories', () => {
      expect(CACHE_TTLS.ai).toBeDefined();
      expect(CACHE_TTLS.lowQuality).toBeDefined();
      expect(CACHE_TTLS.osrm).toBeDefined();
      expect(CACHE_TTLS.geocoding).toBeDefined();
      expect(CACHE_TTLS.location).toBeDefined();
    });

    it('should have AI recommendations TTL of 7 days', () => {
      const DAY_MS = 24 * 60 * 60 * 1000;
      expect(CACHE_TTLS.ai).toBe(7 * DAY_MS);
    });

    it('should have low quality TTL of 24 hours', () => {
      const DAY_MS = 24 * 60 * 60 * 1000;
      expect(CACHE_TTLS.lowQuality).toBe(1 * DAY_MS);
    });

    it('should have geocoding TTL of 30 days', () => {
      const DAY_MS = 24 * 60 * 60 * 1000;
      expect(CACHE_TTLS.geocoding).toBe(30 * DAY_MS);
    });

    it('should have OSRM routes TTL of 30 days', () => {
      const DAY_MS = 24 * 60 * 60 * 1000;
      expect(CACHE_TTLS.osrm).toBe(30 * DAY_MS);
    });

    it('should have location TTL of 5 minutes', () => {
      expect(CACHE_TTLS.location).toBe(5 * 60 * 1000);
    });

    it('should order TTLs from shortest to longest', () => {
      expect(CACHE_TTLS.location).toBeLessThan(CACHE_TTLS.lowQuality);
      expect(CACHE_TTLS.lowQuality).toBeLessThan(CACHE_TTLS.ai);
      expect(CACHE_TTLS.ai).toBeLessThan(CACHE_TTLS.osrm);
    });
  });

  describe('TOURIST_TRAP_THRESHOLD', () => {
    it('should be 70', () => {
      expect(TOURIST_TRAP_THRESHOLD).toBe(70);
    });
  });

  describe('TOKEN_BUDGET', () => {
    it('should have per-trip limit of 2,000,000', () => {
      expect(TOKEN_BUDGET.limit).toBe(2_000_000);
    });

    it('should warn at 75% (1,500,000)', () => {
      expect(TOKEN_BUDGET.warning).toBe(1_500_000);
      expect(TOKEN_BUDGET.warning).toBe(TOKEN_BUDGET.limit * 0.75);
    });

    it('should auto-reset after 30 days', () => {
      expect(TOKEN_BUDGET.resetDays).toBe(30);
    });
  });

  describe('PERFORMANCE_BUDGETS', () => {
    it('should define budgets for all operations', () => {
      expect(PERFORMANCE_BUDGETS.parse).toBe(10_000);
      expect(PERFORMANCE_BUDGETS.manual).toBe(500);
      expect(PERFORMANCE_BUDGETS.cached).toBe(1_000);
      expect(PERFORMANCE_BUDGETS.ai).toBe(60_000);
      expect(PERFORMANCE_BUDGETS.rerank).toBe(2_000);
      expect(PERFORMANCE_BUDGETS.osrm).toBe(5_000);
    });
  });

  describe('SUPPORTED_CITIES', () => {
    it('should support paris, rome, and venice', () => {
      expect(SUPPORTED_CITIES).toContain('paris');
      expect(SUPPORTED_CITIES).toContain('rome');
      expect(SUPPORTED_CITIES).toContain('venice');
      expect(SUPPORTED_CITIES.length).toBe(3);
    });
  });

  describe('CITY_RESTAURANT_COUNTS', () => {
    it('should define counts for all supported cities', () => {
      expect(CITY_RESTAURANT_COUNTS.paris).toBe(51);
      expect(CITY_RESTAURANT_COUNTS.rome).toBe(40);
      expect(CITY_RESTAURANT_COUNTS.venice).toBe(15);
    });
  });

  describe('NEARBY_SEARCH', () => {
    it('should have reasonable search defaults', () => {
      expect(NEARBY_SEARCH.radius).toBe(5000);
      expect(NEARBY_SEARCH.minRating).toBe(4.2);
      expect(NEARBY_SEARCH.minReviews).toBe(100);
      expect(NEARBY_SEARCH.max).toBe(20);
    });
  });
});
