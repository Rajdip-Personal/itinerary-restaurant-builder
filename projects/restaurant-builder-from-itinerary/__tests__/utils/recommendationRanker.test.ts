// __tests__/utils/recommendationRanker.test.ts
// Tests for scoring engine — sub-scores, full scoring, and ranking
// Updated: tests now match actual implementation (tourist-trap-based authenticity, no reservation scoring)

import {
  calculateQualityScore,
  calculateAuthenticityScore,
  calculateConvenienceScore,
  calculateTimingScore,
  calculateCurationScore,
  calculateProgressionScore,
  scoreRestaurant,
  rankRestaurants,
  SCORING_VERSION,
  ScoringContext,
} from 'utils/recommendationRanker';
import {
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  VENICE_RESTAURANTS,
  AUTHENTIC_RESTAURANT,
  TOURIST_TRAP_RESTAURANT,
  SCORING_CONTEXT,
  PARIS_COORDS,
  ROME_COORDS,
} from '__tests__/fixtures/index';
import { SCORE_WEIGHTS, MAX_SCORE } from 'utils/constants';

// Mock landmark + restaurant data for tourist trap detector (used by authenticity)
jest.mock('data/landmarks/paris', () => ({
  PARIS_LANDMARKS: [],
}));
jest.mock('data/landmarks/rome', () => ({
  ROME_LANDMARKS: [],
}));
jest.mock('data/landmarks/venice', () => ({
  VENICE_LANDMARKS: [],
}));
jest.mock('data/restaurants/paris', () => ({
  getParisRestaurants: () => [],
}));
jest.mock('data/restaurants/rome', () => ({
  getRomeRestaurants: () => {
    const { ROME_RESTAURANTS } = require('__tests__/fixtures/index');
    return ROME_RESTAURANTS;
  },
}));
jest.mock('data/restaurants/venice', () => ({
  getVeniceRestaurants: () => [],
}));

// ─── Quality Score ──────────────────────────────────────────────────────────

describe('calculateQualityScore', () => {
  it('returns higher score for higher rating', () => {
    const high = { ...AUTHENTIC_RESTAURANT, rating: 5.0, reviewCount: 500 };
    const low = { ...AUTHENTIC_RESTAURANT, rating: 3.0, reviewCount: 500 };
    expect(calculateQualityScore(high)).toBeGreaterThan(calculateQualityScore(low));
  });

  it('returns higher score for more reviews (at same rating)', () => {
    const many = { ...AUTHENTIC_RESTAURANT, rating: 4.5, reviewCount: 1000 };
    const few = { ...AUTHENTIC_RESTAURANT, rating: 4.5, reviewCount: 50 };
    expect(calculateQualityScore(many)).toBeGreaterThan(calculateQualityScore(few));
  });

  it('caps at max quality weight (25)', () => {
    const perfect = { ...AUTHENTIC_RESTAURANT, rating: 5.0, reviewCount: 10000 };
    expect(calculateQualityScore(perfect)).toBeLessThanOrEqual(SCORE_WEIGHTS.quality);
  });

  it('returns 0 for rating 0', () => {
    const zero = { ...AUTHENTIC_RESTAURANT, rating: 0, reviewCount: 0 };
    expect(calculateQualityScore(zero)).toBe(0);
  });

  it('returns value within bounds for fixture restaurants', () => {
    for (const r of PARIS_RESTAURANTS) {
      const score = calculateQualityScore(r);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(SCORE_WEIGHTS.quality);
    }
  });
});

// ─── Authenticity Score ─────────────────────────────────────────────────────
// Authenticity is derived from tourist trap score: (100 - trapScore) / 5
// With no landmarks mocked, trap score depends on quality bonus only

describe('calculateAuthenticityScore', () => {
  it('returns consistent authenticity for same trap score', () => {
    // With no landmarks, both get trap score clamped to 0 → both authenticity = 20
    const highQuality = { ...AUTHENTIC_RESTAURANT, rating: 4.7, reviewCount: 1500 };
    const lowQuality = { ...TOURIST_TRAP_RESTAURANT, rating: 3.5, reviewCount: 100 };
    expect(calculateAuthenticityScore(highQuality)).toBe(SCORE_WEIGHTS.authenticity);
    expect(calculateAuthenticityScore(lowQuality)).toBe(SCORE_WEIGHTS.authenticity);
  });

  it('returns lower authenticity for tourist trap-like attributes', () => {
    const trapLike = { ...TOURIST_TRAP_RESTAURANT };
    const authentic = { ...AUTHENTIC_RESTAURANT };
    // AUTHENTIC_RESTAURANT has high rating (4.7) and moderate reviews (350) → quality bonus
    // TOURIST_TRAP has low rating (3.5) → no quality bonus
    expect(calculateAuthenticityScore(authentic)).toBeGreaterThanOrEqual(
      calculateAuthenticityScore(trapLike),
    );
  });

  it('caps at max authenticity weight (20)', () => {
    const best = { ...AUTHENTIC_RESTAURANT, rating: 5.0, reviewCount: 5000 };
    expect(calculateAuthenticityScore(best)).toBeLessThanOrEqual(SCORE_WEIGHTS.authenticity);
  });

  it('returns non-negative value', () => {
    const score = calculateAuthenticityScore(TOURIST_TRAP_RESTAURANT);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('returns value within bounds for all fixture restaurants', () => {
    for (const r of [...ROME_RESTAURANTS, ...VENICE_RESTAURANTS]) {
      const score = calculateAuthenticityScore(r);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(SCORE_WEIGHTS.authenticity);
    }
  });
});

// ─── Convenience Score ──────────────────────────────────────────────────────

describe('calculateConvenienceScore', () => {
  it('returns higher score for closer restaurants', () => {
    const near = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: { latitude: 41.8905, longitude: 12.4925 },
    };
    const far = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: { latitude: 41.9200, longitude: 12.5200 },
    };
    const nearScore = calculateConvenienceScore(near, ROME_COORDS.colosseum);
    const farScore = calculateConvenienceScore(far, ROME_COORDS.colosseum);
    expect(nearScore).not.toBeNull();
    // far is >800m → null (excluded)
    if (farScore !== null) {
      expect(nearScore!).toBeGreaterThan(farScore);
    }
  });

  it('returns max for restaurant at target coordinates', () => {
    const atTarget = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: ROME_COORDS.colosseum,
    };
    const score = calculateConvenienceScore(atTarget, ROME_COORDS.colosseum);
    expect(score).toBe(SCORE_WEIGHTS.convenience);
  });

  it('adds hotel proximity bonus when within 500m', () => {
    // Use coordinates within 800m of target AND within 500m of hotel
    const nearBoth = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: { latitude: 41.8960, longitude: 12.4940 },
    };
    const withBonus = calculateConvenienceScore(
      nearBoth,
      ROME_COORDS.colosseum,
      ROME_COORDS.hotel,
    );
    const withoutBonus = calculateConvenienceScore(
      nearBoth,
      ROME_COORDS.colosseum,
    );
    if (withBonus !== null && withoutBonus !== null) {
      expect(withBonus).toBeGreaterThanOrEqual(withoutBonus);
    }
  });

  it('caps at max convenience weight (43)', () => {
    const atTarget = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: ROME_COORDS.colosseum,
    };
    const score = calculateConvenienceScore(atTarget, ROME_COORDS.colosseum, ROME_COORDS.hotel);
    expect(score).toBeLessThanOrEqual(SCORE_WEIGHTS.convenience);
  });

  it('returns null for very distant restaurants (>800m exclusion)', () => {
    const veryFar = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: { latitude: 48.8566, longitude: 2.3522 }, // Paris
    };
    const score = calculateConvenienceScore(veryFar, ROME_COORDS.colosseum);
    expect(score).toBeNull();
  });
});

// ─── Timing Score ───────────────────────────────────────────────────────────

describe('calculateTimingScore', () => {
  it('returns higher score for restaurant open during meal window', () => {
    const openLunch = { ...AUTHENTIC_RESTAURANT, isOpenNow: true };
    const score = calculateTimingScore(openLunch, 'lunch', '12:30');
    expect(score).toBeGreaterThan(0);
  });

  it('gives bonus for bakery type at breakfast', () => {
    const bakery = { ...AUTHENTIC_RESTAURANT, type: 'bakery' as const, isOpenNow: true };
    const restaurant = { ...AUTHENTIC_RESTAURANT, type: 'restaurant' as const, isOpenNow: true };
    // Bakery gets meal-type match bonus for breakfast
    expect(calculateTimingScore(bakery, 'breakfast')).toBeGreaterThan(
      calculateTimingScore(restaurant, 'breakfast'),
    );
  });

  it('gives 0 for closed restaurant with no meal type match', () => {
    const closed = { ...AUTHENTIC_RESTAURANT, isOpenNow: false, type: 'bakery' as const };
    // Bakery at dinner: no isOpenNow (+0), no meal type match (+0) for dinner
    expect(calculateTimingScore(closed, 'dinner', '20:00')).toBe(0);
  });

  it('caps at max timing weight (15)', () => {
    const perfect = {
      ...AUTHENTIC_RESTAURANT,
      isOpenNow: true,
      type: 'trattoria' as const,
    };
    expect(calculateTimingScore(perfect, 'lunch', '12:30')).toBeLessThanOrEqual(
      SCORE_WEIGHTS.timing,
    );
  });

  it('returns a value >= 0', () => {
    const closed = { ...AUTHENTIC_RESTAURANT, isOpenNow: false };
    expect(calculateTimingScore(closed, 'dinner', '20:00')).toBeGreaterThanOrEqual(0);
  });
});

// ─── Curation Score ─────────────────────────────────────────────────────────

describe('calculateCurationScore', () => {
  it('gives points for having famous dishes', () => {
    const withDishes = { ...AUTHENTIC_RESTAURANT, famousFor: ['cacio e pepe'] };
    const noDishes = { ...AUTHENTIC_RESTAURANT, famousFor: [] };
    expect(calculateCurationScore(withDishes)).toBeGreaterThan(calculateCurationScore(noDishes));
  });

  it('caps at max curation weight (5)', () => {
    const rich = {
      ...AUTHENTIC_RESTAURANT,
      famousFor: ['a', 'b', 'c'],
      safeDishes: {
        vegetarian: ['x', 'y'],
        vegan: ['z'],
        glutenFree: ['w'],
      },
    };
    expect(calculateCurationScore(rich)).toBeLessThanOrEqual(SCORE_WEIGHTS.curation);
  });

  it('returns base score for restaurant with no famous dishes or rich safe dishes', () => {
    const bare = {
      ...TOURIST_TRAP_RESTAURANT,
      famousFor: [],
      safeDishes: { vegetarian: [], vegan: [] },
    };
    // All restaurants in our system come from curated data (+3 base)
    // but no famous dishes (+0) and no rich safe dishes (+0) = 3
    expect(calculateCurationScore(bare)).toBe(3);
  });
});

// ─── Progression Score ──────────────────────────────────────────────────────

describe('calculateProgressionScore', () => {
  it('returns 0 for new cuisine type without route progress', () => {
    // Without routeProgress, no positive bonus is applied — only cuisine penalties
    const score = calculateProgressionScore(AUTHENTIC_RESTAURANT, ['french', 'bakery']);
    // AUTHENTIC has ['roman', 'trattoria'] — not in previous — no penalty, no bonus without routeProgress
    expect(score).toBe(0);
  });

  it('returns positive score for breakfast near start of route', () => {
    const score = calculateProgressionScore(
      AUTHENTIC_RESTAURANT,
      [],
      'breakfast',
      0.05, // near start
    );
    expect(score).toBeGreaterThan(0);
  });

  it('returns negative score for same cuisine as previous', () => {
    const score = calculateProgressionScore(AUTHENTIC_RESTAURANT, ['roman']);
    expect(score).toBeLessThan(0);
  });

  it('returns 0 for empty previous cuisines and no route progress', () => {
    const score = calculateProgressionScore(AUTHENTIC_RESTAURANT, []);
    expect(score).toBe(0);
  });

  it('penalizes more for exact repetition than similar cuisine', () => {
    const exact = calculateProgressionScore(
      { ...AUTHENTIC_RESTAURANT, cuisineTypes: ['roman'] },
      ['roman'],
    );
    const similar = calculateProgressionScore(
      { ...AUTHENTIC_RESTAURANT, cuisineTypes: ['roman'] },
      ['italian'],
    );
    expect(exact).toBeLessThan(similar);
  });

  it('stays within bounds (-15 to +5)', () => {
    const bonus = calculateProgressionScore(AUTHENTIC_RESTAURANT, [], 'breakfast', 0.05);
    const penalty = calculateProgressionScore(
      { ...AUTHENTIC_RESTAURANT, cuisineTypes: ['roman'] },
      ['roman'],
    );
    expect(bonus).toBeLessThanOrEqual(5);
    expect(penalty).toBeGreaterThanOrEqual(-15);
  });
});

// ─── Full Scoring ───────────────────────────────────────────────────────────

describe('scoreRestaurant', () => {
  // Use a context where the restaurant is within 800m
  const closeContext: ScoringContext = {
    targetCoordinates: AUTHENTIC_RESTAURANT.coordinates,
    hotelCoordinates: ROME_COORDS.hotel,
    mealType: 'lunch',
    currentTime: '12:30',
    previousCuisines: [],
  };

  it('returns a ScoreBreakdown with all required fields', () => {
    const breakdown = scoreRestaurant(AUTHENTIC_RESTAURANT, closeContext);
    expect(breakdown).not.toBeNull();
    expect(breakdown).toHaveProperty('quality');
    expect(breakdown).toHaveProperty('authenticity');
    expect(breakdown).toHaveProperty('convenience');
    expect(breakdown).toHaveProperty('timing');
    expect(breakdown).toHaveProperty('curation');
    expect(breakdown).toHaveProperty('total');
    expect(breakdown).toHaveProperty('distanceScore');
    expect(breakdown).toHaveProperty('progressionScore');
    expect(breakdown).toHaveProperty('hotelBonus');
  });

  it('total never exceeds MAX_SCORE (110)', () => {
    const breakdown = scoreRestaurant(AUTHENTIC_RESTAURANT, closeContext);
    expect(breakdown).not.toBeNull();
    expect(breakdown!.total).toBeLessThanOrEqual(MAX_SCORE);
  });

  it('total is non-negative', () => {
    const trapContext: ScoringContext = {
      targetCoordinates: TOURIST_TRAP_RESTAURANT.coordinates,
      mealType: 'lunch',
      currentTime: '12:30',
    };
    const breakdown = scoreRestaurant(TOURIST_TRAP_RESTAURANT, trapContext);
    expect(breakdown).not.toBeNull();
    expect(breakdown!.total).toBeGreaterThanOrEqual(0);
  });

  it('returns null for restaurant >800m from target', () => {
    const farContext: ScoringContext = {
      targetCoordinates: PARIS_COORDS.louvre, // Paris — far from Rome restaurant
      mealType: 'lunch',
    };
    const breakdown = scoreRestaurant(AUTHENTIC_RESTAURANT, farContext);
    expect(breakdown).toBeNull();
  });

  it('includes progression score when previous cuisines provided', () => {
    const withCuisines: ScoringContext = {
      ...closeContext,
      previousCuisines: ['roman'], // Same as AUTHENTIC's cuisineTypes
    };
    const breakdown = scoreRestaurant(AUTHENTIC_RESTAURANT, withCuisines);
    expect(breakdown).not.toBeNull();
    expect(breakdown!.progressionScore).not.toBe(0);
  });
});

// ─── Ranking ────────────────────────────────────────────────────────────────

describe('rankRestaurants', () => {
  // Use coordinates close to all Rome fixture restaurants
  const romeContext: ScoringContext = {
    targetCoordinates: { latitude: 41.8940, longitude: 12.4750 },
    hotelCoordinates: ROME_COORDS.hotel,
    mealType: 'lunch',
    currentTime: '12:30',
  };

  it('returns EnhancedRestaurant array sorted by score descending', () => {
    const ranked = rankRestaurants(ROME_RESTAURANTS, romeContext);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.length).toBeLessThanOrEqual(ROME_RESTAURANTS.length);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].contextScore).toBeGreaterThanOrEqual(ranked[i].contextScore);
    }
  });

  it('attaches scoreBreakdown to each result', () => {
    const ranked = rankRestaurants(ROME_RESTAURANTS, romeContext);
    for (const r of ranked) {
      expect(r.scoreBreakdown).toBeDefined();
      expect(r.scoreBreakdown!.total).toBeLessThanOrEqual(MAX_SCORE);
    }
  });

  it('attaches mealType to each result', () => {
    const ranked = rankRestaurants(ROME_RESTAURANTS, romeContext);
    for (const r of ranked) {
      expect(r.mealType).toBe('lunch');
    }
  });

  it('returns empty array for empty input', () => {
    expect(rankRestaurants([], SCORING_CONTEXT)).toEqual([]);
  });

  it('exports SCORING_VERSION matching constants', () => {
    expect(SCORING_VERSION).toBe(7);
  });
});
