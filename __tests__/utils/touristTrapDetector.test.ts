// __tests__/utils/touristTrapDetector.test.ts
// Tests for tourist trap detection — landmark proximity, price-rating, quality bonus

import {
  calculateTouristTrapScore,
  calculateLandmarkProximityScore,
  calculatePriceRatingPenalty,
  calculateQualityBonus,
  isTouristTrap,
  getTouristTrapWarning,
} from 'utils/touristTrapDetector';
import {
  TOURIST_TRAP_RESTAURANT,
  AUTHENTIC_RESTAURANT,
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  ROME_COORDS,
  PARIS_COORDS,
} from '__tests__/fixtures/index';
import { TOURIST_TRAP_THRESHOLD } from 'utils/constants';

describe('calculateLandmarkProximityScore', () => {
  it('returns 40 for coordinates within 50m of a major landmark', () => {
    // Piazza Navona coordinates are in ROME_LANDMARKS at 41.8992, 12.4731
    // TOURIST_TRAP_RESTAURANT is at exactly those coordinates
    const score = calculateLandmarkProximityScore(
      { latitude: 41.8992, longitude: 12.4731 },
      'rome',
    );
    expect(score).toBe(40);
  });

  it('returns 30 for coordinates within 50-100m of a landmark', () => {
    // Slightly offset from Colosseum (41.8902, 12.4922)
    const score = calculateLandmarkProximityScore(
      { latitude: 41.8908, longitude: 12.4922 },
      'rome',
    );
    expect(score).toBe(30);
  });

  it('returns 0 for coordinates far from all landmarks', () => {
    // Far from any Rome landmark
    const score = calculateLandmarkProximityScore(
      { latitude: 41.8500, longitude: 12.5500 },
      'rome',
    );
    expect(score).toBe(0);
  });

  it('returns 0 for unsupported city', () => {
    const score = calculateLandmarkProximityScore(
      { latitude: 51.5074, longitude: -0.1278 },
      'london',
    );
    expect(score).toBe(0);
  });

  it('works for Paris landmarks', () => {
    // Very close to Louvre
    const score = calculateLandmarkProximityScore(PARIS_COORDS.louvre, 'paris');
    expect(score).toBeGreaterThanOrEqual(30);
  });
});

describe('calculatePriceRatingPenalty', () => {
  it('returns 35 for €€€€ + rating <4.0 near landmark', () => {
    const penalty = calculatePriceRatingPenalty(
      { ...TOURIST_TRAP_RESTAURANT, priceLevel: 4, rating: 3.5 },
      40, // near landmark
    );
    expect(penalty).toBe(35);
  });

  it('returns 30 for €€€ + rating <4.0 near landmark', () => {
    const penalty = calculatePriceRatingPenalty(
      { ...TOURIST_TRAP_RESTAURANT, priceLevel: 3, rating: 3.5 },
      40,
    );
    expect(penalty).toBe(30);
  });

  it('returns 0 when not near any landmark', () => {
    const penalty = calculatePriceRatingPenalty(
      { ...TOURIST_TRAP_RESTAURANT, priceLevel: 4, rating: 3.0 },
      0, // not near landmark
    );
    expect(penalty).toBe(0);
  });

  it('returns 0 for good rating + low price near landmark', () => {
    const penalty = calculatePriceRatingPenalty(
      { ...AUTHENTIC_RESTAURANT, priceLevel: 2, rating: 4.7 },
      40,
    );
    expect(penalty).toBe(0);
  });
});

describe('calculateQualityBonus', () => {
  it('returns -40 for 4.6★ + 1000+ reviews', () => {
    const bonus = calculateQualityBonus({ ...AUTHENTIC_RESTAURANT, rating: 4.7, reviewCount: 1500 });
    expect(bonus).toBe(-40);
  });

  it('returns -30 for 4.5★ + 500+ reviews', () => {
    const bonus = calculateQualityBonus({ ...AUTHENTIC_RESTAURANT, rating: 4.5, reviewCount: 600 });
    expect(bonus).toBe(-30);
  });

  it('returns 0 for mediocre restaurants', () => {
    const bonus = calculateQualityBonus(TOURIST_TRAP_RESTAURANT);
    expect(bonus).toBe(0);
  });
});

describe('calculateTouristTrapScore', () => {
  it('returns a high score for tourist trap near landmark with bad rating', () => {
    // TOURIST_TRAP_RESTAURANT: at Piazza Navona, 3.5 rating, €€€, 2500 reviews
    const score = calculateTouristTrapScore(TOURIST_TRAP_RESTAURANT);
    expect(score).toBeGreaterThanOrEqual(TOURIST_TRAP_THRESHOLD);
  });

  it('returns a low score for authentic restaurant far from landmarks', () => {
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

  it('high quality restaurants near landmarks still score low (quality bonus)', () => {
    // High-quality restaurant near a landmark should get quality bonus reduction
    const highQuality = {
      ...AUTHENTIC_RESTAURANT,
      coordinates: ROME_COORDS.colosseum, // right at landmark
      rating: 4.7,
      reviewCount: 1500,
      priceLevel: 2,
    };
    const score = calculateTouristTrapScore(highQuality);
    expect(score).toBeLessThan(TOURIST_TRAP_THRESHOLD);
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
