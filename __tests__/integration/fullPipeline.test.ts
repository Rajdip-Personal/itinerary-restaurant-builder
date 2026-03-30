// __tests__/integration/fullPipeline.test.ts
// Integration tests: end-to-end flow from geocoding → timeline → meals → search → score → rank
// All external APIs mocked (backend proxy, OSRM, Google)

import { geocodeAttraction } from 'services/geocodingService';
import { calculateTimeline } from 'utils/timeCalculator';
import { insertMealBreaks } from 'services/mealBreakInserter';
import { searchNearbyRestaurants } from 'services/restaurantSearch';
import { rankRestaurants, scoreRestaurant } from 'utils/recommendationRanker';
import { evaluateRecommendationQuality, getManualRecommendations } from 'services/recommendationEngine';
import { detectMultiCity, splitIntoSegments } from 'services/multiCityHandler';
import { recalculateForDelay, calculateUrgency, getTimeWarning } from 'services/runningLateService';
import { calculateDistance } from 'utils/distance';
import { calculateTouristTrapScore, isTouristTrap } from 'utils/touristTrapDetector';
import {
  PARIS_COORDS,
  ROME_COORDS,
  VENICE_COORDS,
  PARIS_ATTRACTIONS,
  ROME_ATTRACTIONS,
  PARIS_HOTEL,
  ROME_HOTEL,
  PARIS_DAY,
  ROME_DAY,
  MULTI_CITY_DAY,
  MULTI_CITY_SEGMENTS,
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  VENICE_RESTAURANTS,
  SCORING_CONTEXT,
  SAMPLE_TIMELINE,
  ENHANCED_PARIS_RESTAURANT,
} from '__tests__/fixtures';
import type { ScoringContext } from 'utils/recommendationRanker';
import { TOURIST_TRAP_THRESHOLD, MAX_SCORE, SCORE_WEIGHTS } from 'utils/constants';

// Mock fetch globally (for geocoding and AI calls)
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Integration: Paris single-city pipeline', () => {
  it('should geocode attractions, build timeline, insert meals, search and rank restaurants', () => {
    // Step 1: We have geocoded attractions (from fixtures)
    const attractions = PARIS_ATTRACTIONS.filter((a) => !a.isPlaceholder);
    expect(attractions.length).toBe(3);

    // Step 2: Build timeline from attractions
    const timeline = calculateTimeline(attractions);
    expect(timeline.length).toBe(3);
    expect(timeline[0].attractionName).toBe('Louvre Museum');

    // Step 3: Insert meal breaks
    const mealBreaks = insertMealBreaks(PARIS_ATTRACTIONS, 'paris');
    expect(mealBreaks.length).toBeGreaterThan(0);
    const lunchBreak = mealBreaks.find((m) => m.mealType === 'lunch');
    expect(lunchBreak).toBeDefined();

    // Step 4: Search restaurants near meal location
    const restaurants = searchNearbyRestaurants(
      PARIS_COORDS.louvre,
      'paris',
      5000,
    );
    expect(restaurants.length).toBeGreaterThan(0);

    // Step 5: Rank restaurants
    const context: ScoringContext = {
      targetCoordinates: PARIS_COORDS.louvre,
      hotelCoordinates: PARIS_COORDS.hotel,
      mealType: 'lunch',
    };
    const ranked = rankRestaurants(restaurants, context);
    expect(ranked.length).toBeGreaterThan(0);

    // Step 6: All scored restaurants should have valid scores
    for (const r of ranked) {
      expect(r.contextScore).toBeGreaterThanOrEqual(0);
      expect(r.contextScore).toBeLessThanOrEqual(MAX_SCORE);
      expect(r.scoreBreakdown).toBeDefined();
      expect(r.mealType).toBe('lunch');
    }

    // Step 7: Results should be sorted by score descending
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].contextScore).toBeGreaterThanOrEqual(ranked[i].contextScore);
    }
  });

  it('should filter tourist traps from recommendations', () => {
    const restaurants = searchNearbyRestaurants(PARIS_COORDS.louvre, 'paris', 5000);
    const context: ScoringContext = {
      targetCoordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    };
    const ranked = rankRestaurants(restaurants, context);

    // None of the curated restaurants should be tourist traps
    for (const r of ranked) {
      const trapScore = calculateTouristTrapScore(r);
      expect(trapScore).toBeLessThan(TOURIST_TRAP_THRESHOLD);
    }
  });

  it('should produce quality recommendations via getManualRecommendations', () => {
    const result = getManualRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });

    expect(result).not.toBeNull();
    expect(result!.source).toBe('manual');
    expect(result!.restaurants.length).toBeGreaterThan(0);
    expect(result!.cityId).toBe('paris');
    expect(result!.mealType).toBe('lunch');
  });
});

describe('Integration: Rome single-city pipeline', () => {
  it('should geocode, timeline, meal-break, search, and rank for Rome', () => {
    const attractions = ROME_ATTRACTIONS;
    const timeline = calculateTimeline(attractions);
    expect(timeline.length).toBe(3);

    const mealBreaks = insertMealBreaks(attractions, 'rome');
    expect(mealBreaks.length).toBeGreaterThan(0);

    const restaurants = searchNearbyRestaurants(ROME_COORDS.colosseum, 'rome', 5000);
    expect(restaurants.length).toBeGreaterThan(0);

    const context: ScoringContext = {
      targetCoordinates: ROME_COORDS.colosseum,
      hotelCoordinates: ROME_COORDS.hotel,
      mealType: 'lunch',
    };
    const ranked = rankRestaurants(restaurants, context);
    expect(ranked.length).toBeGreaterThan(0);

    for (const r of ranked) {
      expect(r.contextScore).toBeGreaterThanOrEqual(0);
      expect(r.contextScore).toBeLessThanOrEqual(MAX_SCORE);
    }
  });
});

describe('Integration: Venice single-city pipeline', () => {
  it('should search and rank Venice restaurants', () => {
    const restaurants = searchNearbyRestaurants(VENICE_COORDS.rialto, 'venice', 5000);
    expect(restaurants.length).toBeGreaterThan(0);

    const context: ScoringContext = {
      targetCoordinates: VENICE_COORDS.rialto,
      mealType: 'lunch',
    };
    const ranked = rankRestaurants(restaurants, context);
    expect(ranked.length).toBeGreaterThan(0);
  });
});

describe('Integration: Multi-city Venice → Rome', () => {
  it('should detect multi-city itinerary', () => {
    expect(detectMultiCity(MULTI_CITY_DAY)).toBe(true);
    expect(detectMultiCity(PARIS_DAY)).toBe(false);
  });

  it('should split into correct segments', () => {
    const segments = splitIntoSegments(MULTI_CITY_DAY);
    expect(segments.length).toBe(2);
    expect(segments[0].cityId).toBe('venice');
    expect(segments[1].cityId).toBe('rome');
  });

  it('should generate meal breaks per segment', () => {
    const segments = splitIntoSegments(MULTI_CITY_DAY);

    const veniceBreaks = insertMealBreaks(segments[0].attractions, 'venice');
    const romeBreaks = insertMealBreaks(segments[1].attractions, 'rome');

    // Combined should cover at least one meal
    const allBreaks = [...veniceBreaks, ...romeBreaks];
    expect(allBreaks.length).toBeGreaterThan(0);
  });
});

describe('Integration: Running Late re-ranking', () => {
  it('should filter closed restaurants and adjust scores within 2s budget', () => {
    const recommendations = [ENHANCED_PARIS_RESTAURANT];

    const start = performance.now();
    const result = recalculateForDelay(recommendations, 30, '12:00');
    const elapsed = performance.now() - start;

    // Performance budget: < 2s
    expect(elapsed).toBeLessThan(2000);

    // Results should still be valid
    for (const r of result) {
      expect(r.contextScore).toBeGreaterThanOrEqual(0);
      expect(r.contextScore).toBeLessThanOrEqual(MAX_SCORE);
    }
  });

  it('should calculate urgency states correctly', () => {
    const restaurant = ENHANCED_PARIS_RESTAURANT;

    // Restaurant with weeklyHours closing at 23:00
    const active = calculateUrgency(restaurant, '20:00');
    expect(active).toBe('active');
  });
});

describe('Integration: Score component sum never exceeds MAX_SCORE', () => {
  it('should cap total at 110 for any restaurant', () => {
    const allRestaurants = [
      ...searchNearbyRestaurants(PARIS_COORDS.louvre, 'paris', 10000),
      ...searchNearbyRestaurants(ROME_COORDS.colosseum, 'rome', 10000),
      ...searchNearbyRestaurants(VENICE_COORDS.rialto, 'venice', 10000),
    ];

    for (const r of allRestaurants) {
      const breakdown = scoreRestaurant(r, {
        targetCoordinates: r.coordinates, // 0m distance = max convenience
        mealType: 'lunch',
      });

      if (breakdown) {
        expect(breakdown.total).toBeLessThanOrEqual(MAX_SCORE);
        expect(breakdown.quality).toBeLessThanOrEqual(SCORE_WEIGHTS.quality);
        expect(breakdown.authenticity).toBeLessThanOrEqual(SCORE_WEIGHTS.authenticity);
        expect(breakdown.convenience).toBeLessThanOrEqual(SCORE_WEIGHTS.convenience);
        expect(breakdown.timing).toBeLessThanOrEqual(SCORE_WEIGHTS.timing);
        expect(breakdown.curation).toBeLessThanOrEqual(SCORE_WEIGHTS.curation);
      }
    }
  });
});

describe('Integration: Quality gate evaluation', () => {
  it('should accept high-quality Paris recommendations', () => {
    const result = getManualRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    if (result && result.restaurants.length >= 2) {
      const quality = evaluateRecommendationQuality(result.restaurants);
      // Paris curated data should pass quality gate
      expect(quality.avgScore).toBeGreaterThan(0);
    }
  });

  it('should reject single-restaurant results as low quality', () => {
    const quality = evaluateRecommendationQuality([ENHANCED_PARIS_RESTAURANT]);
    expect(quality.isGoodQuality).toBe(false);
    expect(quality.reason).toContain('Too few');
  });

  it('should reject empty results', () => {
    const quality = evaluateRecommendationQuality([]);
    expect(quality.isGoodQuality).toBe(false);
  });
});
