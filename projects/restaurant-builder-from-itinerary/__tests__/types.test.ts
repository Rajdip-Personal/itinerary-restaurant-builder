// __tests__/types.test.ts
// Smoke tests verifying type definitions compile and basic object creation works

import {
  Coordinates,
  HotelLocation,
  DailyItinerary,
  ItineraryAttraction,
  Restaurant,
  EnhancedRestaurant,
  GeocodedLocation,
  RouteSegment,
  MealBreak,
  MealTimeWindow,
  RecommendationResult,
  NetworkStatus,
  ErrorLogEntry,
  TokenUsage,
  ScoreBreakdown,
  RouteContext,
  RestaurantInsights,
  ReservationUrgency,
} from 'types/index';

import {
  PARIS_DAY,
  ROME_DAY,
  MULTI_CITY_DAY,
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  VENICE_RESTAURANTS,
  ENHANCED_PARIS_RESTAURANT,
  FIXED_TIMESTAMPS,
} from '__tests__/fixtures/index';

describe('Type definitions', () => {
  describe('Coordinates', () => {
    it('should create a valid Coordinates object', () => {
      const coords: Coordinates = { latitude: 48.8566, longitude: 2.3522 };
      expect(coords.latitude).toBe(48.8566);
      expect(coords.longitude).toBe(2.3522);
    });
  });

  describe('HotelLocation', () => {
    it('should create a valid HotelLocation with user_provided source', () => {
      const hotel: HotelLocation = {
        name: 'Test Hotel',
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
        source: 'user_provided',
      };
      expect(hotel.name).toBe('Test Hotel');
      expect(hotel.source).toBe('user_provided');
    });

    it('should create a valid HotelLocation with inferred source', () => {
      const hotel: HotelLocation = {
        name: 'Inferred Hotel',
        coordinates: { latitude: 41.9028, longitude: 12.4964 },
        source: 'inferred_from_first_attraction',
      };
      expect(hotel.source).toBe('inferred_from_first_attraction');
    });
  });

  describe('DailyItinerary', () => {
    it('should have correct structure for Paris day', () => {
      expect(PARIS_DAY.id).toBe('paris-2025-04-15');
      expect(PARIS_DAY.cityId).toBe('paris');
      expect(PARIS_DAY.attractions.length).toBe(4);
      expect(PARIS_DAY.hotelLocation).toBeDefined();
      expect(PARIS_DAY.createdAt).toBe(FIXED_TIMESTAMPS.created);
    });

    it('should have correct structure for Rome day', () => {
      expect(ROME_DAY.cityId).toBe('rome');
      expect(ROME_DAY.attractions.length).toBe(3);
    });

    it('should support multi-city day with segments', () => {
      expect(MULTI_CITY_DAY.segments).toBeDefined();
      expect(MULTI_CITY_DAY.segments!.length).toBe(2);
      expect(MULTI_CITY_DAY.segments![0].cityId).toBe('venice');
      expect(MULTI_CITY_DAY.segments![1].cityId).toBe('rome');
    });
  });

  describe('ItineraryAttraction', () => {
    it('should distinguish placeholder meal breaks from real attractions', () => {
      const realAttraction = PARIS_DAY.attractions[0];
      const mealBreak = PARIS_DAY.attractions[1];

      expect(realAttraction.isPlaceholder).toBe(false);
      expect(realAttraction.name).toBe('Louvre Museum');

      expect(mealBreak.isPlaceholder).toBe(true);
      expect(mealBreak.name).toBe('Lunch Break');
    });
  });

  describe('Restaurant', () => {
    it('should create Paris restaurants with correct fields', () => {
      const restaurant = PARIS_RESTAURANTS[0];
      expect(restaurant.cityId).toBe('paris');
      expect(restaurant.rating).toBeGreaterThanOrEqual(0);
      expect(restaurant.rating).toBeLessThanOrEqual(5);
      expect(restaurant.priceLevel).toBeGreaterThanOrEqual(1);
      expect(restaurant.priceLevel).toBeLessThanOrEqual(4);
      expect(restaurant.cuisineTypes.length).toBeGreaterThan(0);
    });

    it('should have restaurants for all supported cities', () => {
      expect(PARIS_RESTAURANTS.length).toBeGreaterThanOrEqual(3);
      expect(ROME_RESTAURANTS.length).toBeGreaterThanOrEqual(3);
      expect(VENICE_RESTAURANTS.length).toBeGreaterThanOrEqual(3);
    });

    it('should include safeDishes with at least vegetarian options', () => {
      for (const r of [...PARIS_RESTAURANTS, ...ROME_RESTAURANTS, ...VENICE_RESTAURANTS]) {
        expect(r.safeDishes).toBeDefined();
        expect(r.safeDishes.vegetarian).toBeDefined();
        expect(r.safeDishes.vegan).toBeDefined();
      }
    });
  });

  describe('EnhancedRestaurant', () => {
    it('should extend Restaurant with scoring and route context', () => {
      expect(ENHANCED_PARIS_RESTAURANT.contextScore).toBe(82);
      expect(ENHANCED_PARIS_RESTAURANT.mealType).toBe('lunch');
      expect(ENHANCED_PARIS_RESTAURANT.routeContext).toBeDefined();
      expect(ENHANCED_PARIS_RESTAURANT.routeContext.walkTime).toBe(8);
    });

    it('should have a score breakdown that sums correctly', () => {
      const sb = ENHANCED_PARIS_RESTAURANT.scoreBreakdown!;
      const componentSum = sb.quality + sb.authenticity + sb.convenience + sb.timing + sb.curation;
      expect(componentSum).toBe(sb.total);
    });

    it('should include optional insights', () => {
      expect(ENHANCED_PARIS_RESTAURANT.insights).toBeDefined();
      expect(ENHANCED_PARIS_RESTAURANT.insights!.bestDishes).toContain('steak tartare');
    });
  });

  describe('ScoreBreakdown', () => {
    it('should create a valid score breakdown within limits', () => {
      const sb: ScoreBreakdown = {
        quality: 25,
        authenticity: 20,
        convenience: 43,
        timing: 15,
        curation: 5,
        total: 108,
        distanceScore: 43,
        progressionScore: 5,
        hotelBonus: 5,
      };
      expect(sb.total).toBeLessThanOrEqual(110);
    });
  });

  describe('GeocodedLocation', () => {
    it('should create with different source types', () => {
      const sources: GeocodedLocation['source'][] = ['landmark', 'cache', 'google', 'ai'];
      sources.forEach((source) => {
        const loc: GeocodedLocation = {
          name: 'Test',
          coordinates: { latitude: 0, longitude: 0 },
          source,
          confidence: 0.9,
        };
        expect(loc.source).toBe(source);
      });
    });
  });

  describe('MealBreak', () => {
    it('should create a valid meal break', () => {
      const mb: MealBreak = {
        mealType: 'lunch',
        suggestedTime: '12:30',
        window: { start: '12:00', end: '14:30' },
        nearAttraction: 'Louvre Museum',
      };
      expect(mb.mealType).toBe('lunch');
      expect(mb.nearAttraction).toBe('Louvre Museum');
    });
  });

  describe('MealTimeWindow', () => {
    it('should define start and end times', () => {
      const window: MealTimeWindow = { start: '12:00', end: '14:30' };
      expect(window.start).toBe('12:00');
      expect(window.end).toBe('14:30');
    });
  });

  describe('RecommendationResult', () => {
    it('should create with all source types', () => {
      const sources: RecommendationResult['source'][] = ['manual', 'cache', 'ai', 'stale_cache'];
      sources.forEach((source) => {
        const result: RecommendationResult = {
          restaurants: [],
          source,
          mealType: 'lunch',
          cityId: 'paris',
          generatedAt: FIXED_TIMESTAMPS.created,
        };
        expect(result.source).toBe(source);
      });
    });
  });

  describe('TokenUsage', () => {
    it('should track token costs', () => {
      const usage: TokenUsage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        estimatedCost: 0.0003,
      };
      expect(usage.totalTokens).toBe(usage.promptTokens + usage.completionTokens);
    });
  });

  describe('ErrorLogEntry', () => {
    it('should support all severity levels', () => {
      const severities: ErrorLogEntry['severity'][] = ['fatal', 'error', 'warning', 'info', 'debug'];
      severities.forEach((severity) => {
        const entry: ErrorLogEntry = {
          timestamp: FIXED_TIMESTAMPS.created,
          message: `Test ${severity}`,
          severity,
        };
        expect(entry.severity).toBe(severity);
      });
    });
  });
});
