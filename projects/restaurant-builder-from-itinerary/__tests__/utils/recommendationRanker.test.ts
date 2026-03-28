// __tests__/utils/recommendationRanker.test.ts
// Tests for scoring engine — sub-scores, full scoring, and ranking

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

describe('calculateAuthenticityScore', () => {
  it('scores local restaurant types higher', () => {
    const osteria = { ...AUTHENTIC_RESTAURANT, type: 'osteria' as const };
    const generic = { ...AUTHENTIC_RESTAURANT, type: 'restaurant' as const };
    expect(calculateAuthenticityScore(osteria)).toBeGreaterThan(
      calculateAuthenticityScore(generic),
    );
  });

  it('scores trattoria higher than generic restaurant', () => {
    const trattoria = { ...AUTHENTIC_RESTAURANT, type: 'trattoria' as const };
    const generic = { ...AUTHENTIC_RESTAURANT, type: 'restaurant' as const };
    expect(calculateAuthenticityScore(trattoria)).toBeGreaterThan(
      calculateAuthenticityScore(generic),
    );
  });

  it('scores bacaro higher than generic restaurant', () => {
    const bacaro = { ...AUTHENTIC_RESTAURANT, type: 'bacaro' as const };
    const generic = { ...AUTHENTIC_RESTAURANT, type: 'restaurant' as const };
    expect(calculateAuthenticityScore(bacaro)).toBeGreaterThan(
      calculateAuthenticityScore(generic),
    );
  });

  it('caps at max authenticity weight (20)', () => {
    const best = { ...AUTHENTIC_RESTAURANT, type: 'osteria' as const, priceLevel: 1 };
    expect(calculateAuthenticityScore(best)).toBeLessThanOrEqual(SCORE_WEIGHTS.authenticity);
  });

  it('scores lower price as more authentic (non-fine-dining)', () => {
    const cheap = { ...AUTHENTIC_RESTAURANT, priceLevel: 1 };
    const expensive = { ...AUTHENTIC_RESTAURANT, priceLevel: 4 };
    expect(calculateAuthenticityScore(cheap)).toBeGreaterThan(
      calculateAuthenticityScore(expensive),
    );
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
    expect(
      calculateConvenienceScore(near, ROME_COORDS.colosseum),
    ).toBeGreaterThan(
      calculateConvenienceScore(far, ROME_COORDS.colosseum),
    );
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
    const nearHotel = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: { latitude: 41.9030, longitude: 12.4966 },
    };
    const withBonus = calculateConvenienceScore(
      nearHotel,
      ROME_COORDS.colosseum,
      ROME_COORDS.hotel,
    );
    const withoutBonus = calculateConvenienceScore(
      nearHotel,
      ROME_COORDS.colosseum,
    );
    expect(withBonus).toBeGreaterThanOrEqual(withoutBonus);
  });

  it('caps at max convenience weight (43)', () => {
    const atTarget = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: ROME_COORDS.colosseum,
    };
    const score = calculateConvenienceScore(atTarget, ROME_COORDS.colosseum, ROME_COORDS.hotel);
    expect(score).toBeLessThanOrEqual(SCORE_WEIGHTS.convenience);
  });

  it('returns 0 for very distant restaurants', () => {
    const veryFar = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: { latitude: 48.8566, longitude: 2.3522 }, // Paris
    };
    const score = calculateConvenienceScore(veryFar, ROME_COORDS.colosseum);
    expect(score).toBe(0);
  });
});

// ─── Timing Score ───────────────────────────────────────────────────────────

describe('calculateTimingScore', () => {
  it('returns higher score for restaurant open during meal window', () => {
    const openLunch = { ...AUTHENTIC_RESTAURANT, isOpenNow: true };
    const score = calculateTimingScore(openLunch, 'lunch', '12:30');
    expect(score).toBeGreaterThan(0);
  });

  it('returns lower score for essential reservation with short lead time', () => {
    const essential = {
      ...AUTHENTIC_RESTAURANT,
      reservationRequired: 'essential' as const,
      reservationLeadDays: 7,
    };
    const none = {
      ...AUTHENTIC_RESTAURANT,
      reservationRequired: 'none' as const,
    };
    expect(calculateTimingScore(essential, 'lunch', '12:30')).toBeLessThan(
      calculateTimingScore(none, 'lunch', '12:30'),
    );
  });

  it('caps at max timing weight (15)', () => {
    const perfect = {
      ...AUTHENTIC_RESTAURANT,
      isOpenNow: true,
      reservationRequired: 'none' as const,
    };
    expect(calculateTimingScore(perfect, 'lunch', '11:30')).toBeLessThanOrEqual(
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
  it('returns positive score for new cuisine type', () => {
    const score = calculateProgressionScore(AUTHENTIC_RESTAURANT, ['french', 'bakery']);
    expect(score).toBeGreaterThan(0);
  });

  it('returns negative score for same cuisine as previous', () => {
    const score = calculateProgressionScore(AUTHENTIC_RESTAURANT, ['roman']);
    expect(score).toBeLessThan(0);
  });

  it('returns 0 for empty previous cuisines', () => {
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
    const bonus = calculateProgressionScore(AUTHENTIC_RESTAURANT, ['french', 'bakery']);
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
  it('returns a ScoreBreakdown with all required fields', () => {
    const breakdown = scoreRestaurant(AUTHENTIC_RESTAURANT, SCORING_CONTEXT);
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
    const breakdown = scoreRestaurant(AUTHENTIC_RESTAURANT, SCORING_CONTEXT);
    expect(breakdown.total).toBeLessThanOrEqual(MAX_SCORE);
  });

  it('total is non-negative', () => {
    const breakdown = scoreRestaurant(TOURIST_TRAP_RESTAURANT, SCORING_CONTEXT);
    expect(breakdown.total).toBeGreaterThanOrEqual(0);
  });

  it('scores authentic restaurant higher than tourist trap', () => {
    const authScore = scoreRestaurant(AUTHENTIC_RESTAURANT, SCORING_CONTEXT);
    const trapScore = scoreRestaurant(TOURIST_TRAP_RESTAURANT, SCORING_CONTEXT);
    expect(authScore.total).toBeGreaterThan(trapScore.total);
  });

  it('includes progression score when previous cuisines provided', () => {
    const withProgression = scoreRestaurant(AUTHENTIC_RESTAURANT, {
      ...SCORING_CONTEXT,
      previousCuisines: ['french'],
    });
    expect(withProgression.progressionScore).not.toBe(0);
  });
});

// ─── Ranking ────────────────────────────────────────────────────────────────

describe('rankRestaurants', () => {
  it('returns EnhancedRestaurant array sorted by score descending', () => {
    const ranked = rankRestaurants(ROME_RESTAURANTS, SCORING_CONTEXT);
    expect(ranked.length).toBe(ROME_RESTAURANTS.length);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].contextScore).toBeGreaterThanOrEqual(ranked[i].contextScore);
    }
  });

  it('attaches scoreBreakdown to each result', () => {
    const ranked = rankRestaurants(ROME_RESTAURANTS, SCORING_CONTEXT);
    for (const r of ranked) {
      expect(r.scoreBreakdown).toBeDefined();
      expect(r.scoreBreakdown!.total).toBeLessThanOrEqual(MAX_SCORE);
    }
  });

  it('attaches mealType to each result', () => {
    const ranked = rankRestaurants(ROME_RESTAURANTS, SCORING_CONTEXT);
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
