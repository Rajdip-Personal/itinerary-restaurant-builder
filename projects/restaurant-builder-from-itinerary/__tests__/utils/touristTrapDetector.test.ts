// __tests__/utils/touristTrapDetector.test.ts
// Tests for tourist trap detection logic

import {
  calculateTouristTrapScore,
  isTouristTrap,
  getTouristTrapWarning,
} from 'utils/touristTrapDetector';
import {
  TOURIST_TRAP_RESTAURANT,
  AUTHENTIC_RESTAURANT,
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  VENICE_RESTAURANTS,
} from '__tests__/fixtures/index';
import { TOURIST_TRAP_THRESHOLD } from 'utils/constants';

describe('calculateTouristTrapScore', () => {
  it('returns a high score for a tourist trap restaurant', () => {
    const score = calculateTouristTrapScore(TOURIST_TRAP_RESTAURANT);
    // High reviews + low rating + generic cuisine + high price + no famous dishes
    expect(score).toBeGreaterThanOrEqual(TOURIST_TRAP_THRESHOLD);
  });

  it('returns a low score for an authentic restaurant', () => {
    const score = calculateTouristTrapScore(AUTHENTIC_RESTAURANT);
    expect(score).toBeLessThan(TOURIST_TRAP_THRESHOLD);
  });

  it('returns a score between 0 and 100', () => {
    const trapScore = calculateTouristTrapScore(TOURIST_TRAP_RESTAURANT);
    const authScore = calculateTouristTrapScore(AUTHENTIC_RESTAURANT);
    expect(trapScore).toBeGreaterThanOrEqual(0);
    expect(trapScore).toBeLessThanOrEqual(100);
    expect(authScore).toBeGreaterThanOrEqual(0);
    expect(authScore).toBeLessThanOrEqual(100);
  });

  it('penalizes high review count with mediocre rating', () => {
    const highReviewsLowRating = {
      ...AUTHENTIC_RESTAURANT,
      reviewCount: 2000,
      rating: 3.8,
    };
    const lowReviewsHighRating = {
      ...AUTHENTIC_RESTAURANT,
      reviewCount: 200,
      rating: 4.8,
    };
    expect(calculateTouristTrapScore(highReviewsLowRating)).toBeGreaterThan(
      calculateTouristTrapScore(lowReviewsHighRating),
    );
  });

  it('penalizes generic cuisine types', () => {
    const generic = {
      ...AUTHENTIC_RESTAURANT,
      cuisineTypes: ['italian', 'pizza'],
    };
    const specific = {
      ...AUTHENTIC_RESTAURANT,
      cuisineTypes: ['roman', 'trattoria'],
    };
    expect(calculateTouristTrapScore(generic)).toBeGreaterThan(
      calculateTouristTrapScore(specific),
    );
  });

  it('penalizes high price with no local restaurant type', () => {
    const expensive = {
      ...AUTHENTIC_RESTAURANT,
      priceLevel: 4,
      type: 'restaurant' as const,
    };
    const localCheap = {
      ...AUTHENTIC_RESTAURANT,
      priceLevel: 1,
      type: 'osteria' as const,
    };
    expect(calculateTouristTrapScore(expensive)).toBeGreaterThan(
      calculateTouristTrapScore(localCheap),
    );
  });

  it('penalizes restaurants with no famous dishes', () => {
    const noFamous = { ...AUTHENTIC_RESTAURANT, famousFor: [] };
    const withFamous = { ...AUTHENTIC_RESTAURANT, famousFor: ['cacio e pepe', 'carbonara'] };
    expect(calculateTouristTrapScore(noFamous)).toBeGreaterThan(
      calculateTouristTrapScore(withFamous),
    );
  });

  it('penalizes restaurants with minimal safe dishes', () => {
    const minimal = {
      ...AUTHENTIC_RESTAURANT,
      safeDishes: { vegetarian: [], vegan: [] },
    };
    const rich = {
      ...AUTHENTIC_RESTAURANT,
      safeDishes: {
        vegetarian: ['a', 'b', 'c'],
        vegan: ['d', 'e'],
        glutenFree: ['f'],
      },
    };
    expect(calculateTouristTrapScore(minimal)).toBeGreaterThan(
      calculateTouristTrapScore(rich),
    );
  });

  it('scores existing Paris fixture restaurants below threshold', () => {
    for (const r of PARIS_RESTAURANTS) {
      expect(calculateTouristTrapScore(r)).toBeLessThan(TOURIST_TRAP_THRESHOLD);
    }
  });

  it('scores existing Rome fixture restaurants below threshold', () => {
    for (const r of ROME_RESTAURANTS) {
      expect(calculateTouristTrapScore(r)).toBeLessThan(TOURIST_TRAP_THRESHOLD);
    }
  });
});

describe('isTouristTrap', () => {
  it('returns true for scores at or above threshold', () => {
    expect(isTouristTrap(TOURIST_TRAP_THRESHOLD)).toBe(true);
    expect(isTouristTrap(TOURIST_TRAP_THRESHOLD + 10)).toBe(true);
    expect(isTouristTrap(100)).toBe(true);
  });

  it('returns false for scores below threshold', () => {
    expect(isTouristTrap(TOURIST_TRAP_THRESHOLD - 1)).toBe(false);
    expect(isTouristTrap(0)).toBe(false);
    expect(isTouristTrap(30)).toBe(false);
  });
});

describe('getTouristTrapWarning', () => {
  it('returns a warning string for scores at threshold', () => {
    const warning = getTouristTrapWarning(TOURIST_TRAP_THRESHOLD);
    expect(warning).toBeDefined();
    expect(warning).toContain(String(TOURIST_TRAP_THRESHOLD));
  });

  it('returns undefined for scores below threshold', () => {
    expect(getTouristTrapWarning(30)).toBeUndefined();
    expect(getTouristTrapWarning(0)).toBeUndefined();
  });

  it('includes the score in the warning message', () => {
    const warning = getTouristTrapWarning(85);
    expect(warning).toBeDefined();
    expect(warning).toContain('85');
  });
});
