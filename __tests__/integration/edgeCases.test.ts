// __tests__/integration/edgeCases.test.ts
// Edge case tests for boundary conditions, empty inputs, and error states

import { searchNearbyRestaurants, searchAlongRoute } from 'services/restaurantSearch';
import { rankRestaurants, scoreRestaurant, calculateQualityScore, calculateConvenienceScore } from 'utils/recommendationRanker';
import { evaluateRecommendationQuality } from 'services/recommendationEngine';
import { recalculateForDelay, calculateUrgency, getTimeWarning, adjustForCurrentLocation } from 'services/runningLateService';
import { calculateTouristTrapScore, isTouristTrap } from 'utils/touristTrapDetector';
import { insertMealBreaks } from 'services/mealBreakInserter';
import { calculateTimeline } from 'utils/timeCalculator';
import { detectMultiCity, splitIntoSegments } from 'services/multiCityHandler';
import { calculateDistance } from 'utils/distance';
import { trackTokenUsage, canAffordRequest, getTokenUsage, resetTokenUsage } from 'utils/tokenTracker';
import { buildRecommendationCacheKey, getCachedRecommendation, setCachedRecommendation, clearRecommendationCache } from 'services/recommendationCache';
import { SCORING_VERSION } from 'utils/recommendationRanker';
import { MAX_SCORE, TOURIST_TRAP_THRESHOLD, TOKEN_BUDGET } from 'utils/constants';
import {
  PARIS_COORDS,
  ROME_COORDS,
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  ENHANCED_PARIS_RESTAURANT,
  FIXED_TIMESTAMPS,
} from '__tests__/fixtures';
import type { Restaurant, EnhancedRestaurant, DailyItinerary, ItineraryAttraction } from 'types/index';
import type { ScoringContext } from 'utils/recommendationRanker';

describe('Edge Cases: Empty inputs', () => {
  it('rankRestaurants with empty array returns empty', () => {
    const result = rankRestaurants([], {
      targetCoordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    expect(result).toEqual([]);
  });

  it('searchNearbyRestaurants with unsupported city returns empty', () => {
    const result = searchNearbyRestaurants(PARIS_COORDS.louvre, 'tokyo');
    expect(result).toEqual([]);
  });

  it('searchAlongRoute with empty route returns empty', () => {
    const result = searchAlongRoute([], 'paris');
    expect(result).toEqual([]);
  });

  it('insertMealBreaks with empty attractions returns empty', () => {
    const result = insertMealBreaks([], 'paris');
    expect(result).toEqual([]);
  });

  it('recalculateForDelay with empty recommendations returns empty', () => {
    const result = recalculateForDelay([], 30, '12:00');
    expect(result).toEqual([]);
  });

  it('adjustForCurrentLocation with empty recommendations returns empty', () => {
    const result = adjustForCurrentLocation([], PARIS_COORDS.louvre);
    expect(result).toEqual([]);
  });

  it('evaluateRecommendationQuality with empty array returns not good', () => {
    const result = evaluateRecommendationQuality([]);
    expect(result.isGoodQuality).toBe(false);
    expect(result.avgScore).toBe(0);
  });
});

describe('Edge Cases: Score boundaries', () => {
  it('scoreRestaurant returns null for restaurant >800m away', () => {
    // Place restaurant very far away
    const farRestaurant: Restaurant = {
      ...PARIS_RESTAURANTS[0],
      coordinates: { latitude: 49.0, longitude: 3.0 }, // ~15km from Louvre
    };
    const result = scoreRestaurant(farRestaurant, {
      targetCoordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    expect(result).toBeNull();
  });

  it('score total should never exceed MAX_SCORE (110)', () => {
    // Perfect restaurant: 0m distance, open, matching type, curated, etc.
    const perfectRestaurant: Restaurant = {
      ...PARIS_RESTAURANTS[0],
      coordinates: PARIS_COORDS.louvre, // 0m distance
      rating: 5.0,
      reviewCount: 10000,
      isOpenNow: true,
      type: 'restaurant',
    };
    const result = scoreRestaurant(perfectRestaurant, {
      targetCoordinates: PARIS_COORDS.louvre,
      hotelCoordinates: PARIS_COORDS.louvre, // also 0m from hotel
      mealType: 'lunch',
    });
    expect(result).not.toBeNull();
    expect(result!.total).toBeLessThanOrEqual(MAX_SCORE);
  });

  it('score total should be 0 or positive', () => {
    const result = scoreRestaurant(PARIS_RESTAURANTS[0], {
      targetCoordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    if (result) {
      expect(result.total).toBeGreaterThanOrEqual(0);
    }
  });

  it('quality score capped at 25', () => {
    const score = calculateQualityScore({
      ...PARIS_RESTAURANTS[0],
      rating: 5.0,
      reviewCount: 1000000,
    });
    expect(score).toBeLessThanOrEqual(25);
  });

  it('convenience returns null for exactly 800.01m', () => {
    // Create a restaurant exactly at the boundary
    // 800m north of louvre ≈ 0.0072 degrees latitude
    const borderRestaurant: Restaurant = {
      ...PARIS_RESTAURANTS[0],
      coordinates: {
        latitude: PARIS_COORDS.louvre.latitude + 0.0075,
        longitude: PARIS_COORDS.louvre.longitude,
      },
    };
    const dist = calculateDistance(PARIS_COORDS.louvre, borderRestaurant.coordinates);
    if (dist > 800) {
      const result = calculateConvenienceScore(borderRestaurant, PARIS_COORDS.louvre);
      expect(result).toBeNull();
    }
  });
});

describe('Edge Cases: Tourist trap threshold', () => {
  it('tourist trap score of exactly threshold is a trap', () => {
    expect(isTouristTrap(TOURIST_TRAP_THRESHOLD)).toBe(true);
  });

  it('tourist trap score of threshold - 1 is not a trap', () => {
    expect(isTouristTrap(TOURIST_TRAP_THRESHOLD - 1)).toBe(false);
  });

  it('tourist trap score of 0 is not a trap', () => {
    expect(isTouristTrap(0)).toBe(false);
  });

  it('tourist trap score of 100 is a trap', () => {
    expect(isTouristTrap(100)).toBe(true);
  });
});

describe('Edge Cases: Token budget', () => {
  beforeEach(() => {
    resetTokenUsage();
  });

  it('canAffordRequest returns true when budget available', () => {
    expect(canAffordRequest(1000)).toBe(true);
  });

  it('canAffordRequest returns false when budget exceeded', () => {
    trackTokenUsage({
      promptTokens: TOKEN_BUDGET.limit,
      completionTokens: 0,
      totalTokens: TOKEN_BUDGET.limit,
      estimatedCost: 0,
    });
    expect(canAffordRequest(1)).toBe(false);
  });

  it('canAffordRequest at exactly the limit', () => {
    trackTokenUsage({
      promptTokens: TOKEN_BUDGET.limit - 1,
      completionTokens: 0,
      totalTokens: TOKEN_BUDGET.limit - 1,
      estimatedCost: 0,
    });
    expect(canAffordRequest(1)).toBe(true);
    expect(canAffordRequest(2)).toBe(false);
  });
});

describe('Edge Cases: Cache version', () => {
  beforeEach(() => {
    clearRecommendationCache();
  });

  it('cache key includes SCORING_VERSION', () => {
    const key = buildRecommendationCacheKey('paris', 'lunch', 48.86, 2.34);
    expect(key).toContain(`v${SCORING_VERSION}`);
  });

  it('cache miss for non-existent key', () => {
    const result = getCachedRecommendation('nonexistent-key');
    expect(result).toBeNull();
  });

  it('cache hit after setting value', () => {
    const key = buildRecommendationCacheKey('paris', 'lunch', 48.86, 2.34);
    const mockResult = {
      restaurants: [],
      source: 'ai' as const,
      mealType: 'lunch' as const,
      generatedAt: FIXED_TIMESTAMPS.noon,
      cityId: 'paris',
    };
    setCachedRecommendation(key, mockResult);
    const cached = getCachedRecommendation(key);
    expect(cached).not.toBeNull();
    expect(cached!.cityId).toBe('paris');
  });
});

describe('Edge Cases: Multi-city detection', () => {
  it('single city with no segments is not multi-city', () => {
    const itinerary: DailyItinerary = {
      id: 'test',
      date: '2025-04-15',
      cityId: 'paris',
      attractions: [{
        id: 'a1',
        name: 'Louvre',
        estimatedTime: '9:00 AM',
        estimatedDuration: 120,
        isPlaceholder: false,
        cityId: 'paris',
      }],
      createdAt: FIXED_TIMESTAMPS.created,
      updatedAt: FIXED_TIMESTAMPS.updated,
    };
    expect(detectMultiCity(itinerary)).toBe(false);
  });

  it('attractions with different cityIds but no segments is multi-city', () => {
    const itinerary: DailyItinerary = {
      id: 'test',
      date: '2025-04-15',
      cityId: 'venice',
      attractions: [
        { id: 'a1', name: 'Rialto', estimatedTime: '9:00 AM', estimatedDuration: 60, isPlaceholder: false, cityId: 'venice' },
        { id: 'a2', name: 'Colosseum', estimatedTime: '3:00 PM', estimatedDuration: 120, isPlaceholder: false, cityId: 'rome' },
      ],
      createdAt: FIXED_TIMESTAMPS.created,
      updatedAt: FIXED_TIMESTAMPS.updated,
    };
    expect(detectMultiCity(itinerary)).toBe(true);
    const segments = splitIntoSegments(itinerary);
    expect(segments.length).toBe(2);
  });
});

describe('Edge Cases: Running Late with no hours data', () => {
  it('should keep restaurant with no weeklyHours if isOpenNow is not false', () => {
    const noHoursRestaurant: EnhancedRestaurant = {
      ...ENHANCED_PARIS_RESTAURANT,
      weeklyHours: undefined,
      isOpenNow: true,
    };
    const result = recalculateForDelay([noHoursRestaurant], 30, '12:00');
    expect(result.length).toBe(1);
  });

  it('should filter restaurant with no hours and isOpenNow=false', () => {
    const closedRestaurant: EnhancedRestaurant = {
      ...ENHANCED_PARIS_RESTAURANT,
      weeklyHours: undefined,
      isOpenNow: false,
    };
    const result = recalculateForDelay([closedRestaurant], 30, '12:00');
    expect(result.length).toBe(0);
  });

  it('getTimeWarning returns undefined when no hours data', () => {
    const noHours: EnhancedRestaurant = { ...ENHANCED_PARIS_RESTAURANT, weeklyHours: undefined };
    expect(getTimeWarning(noHours, '12:00', 'lunch')).toBeUndefined();
  });
});

describe('Edge Cases: Distance calculation', () => {
  it('distance between same point is 0', () => {
    expect(calculateDistance(PARIS_COORDS.louvre, PARIS_COORDS.louvre)).toBe(0);
  });

  it('distance is symmetric', () => {
    const d1 = calculateDistance(PARIS_COORDS.louvre, PARIS_COORDS.notreDame);
    const d2 = calculateDistance(PARIS_COORDS.notreDame, PARIS_COORDS.louvre);
    expect(d1).toBeCloseTo(d2, 0);
  });

  it('cross-city distance is very large', () => {
    const d = calculateDistance(PARIS_COORDS.louvre, ROME_COORDS.colosseum);
    expect(d).toBeGreaterThan(100000); // > 100km
  });
});
