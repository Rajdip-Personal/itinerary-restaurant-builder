// __tests__/data/restaurants.test.ts
// Data validation tests for curated restaurant data files
// Validates structure, completeness, and correctness of all city datasets

import { getParisRestaurants } from 'data/restaurants/paris';
import { getRomeRestaurants } from 'data/restaurants/rome';
import { getVeniceRestaurants } from 'data/restaurants/venice';
import { CITY_RESTAURANT_COUNTS, SUPPORTED_CITIES } from 'utils/constants';

// Coordinate bounding boxes for each city (approximate)
// Wider bounding boxes to account for suburban restaurants (e.g., Versailles for Paris)
const CITY_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  paris: { lat: [48.5, 49.0], lng: [2.0, 2.5] },
  rome: { lat: [41.8, 42.0], lng: [12.4, 12.6] },
  venice: { lat: [45.4, 45.55], lng: [12.28, 12.45] },
};

describe('Curated Restaurant Data', () => {
  const datasets = [
    { city: 'paris', getter: getParisRestaurants, expectedCount: CITY_RESTAURANT_COUNTS.paris },
    { city: 'rome', getter: getRomeRestaurants, expectedCount: CITY_RESTAURANT_COUNTS.rome },
    { city: 'venice', getter: getVeniceRestaurants, expectedCount: CITY_RESTAURANT_COUNTS.venice },
  ];

  describe.each(datasets)('$city restaurants', ({ city, getter, expectedCount }) => {
    const restaurants = getter();

    it(`should have exactly ${expectedCount} restaurants`, () => {
      expect(restaurants).toHaveLength(expectedCount);
    });

    it('should have unique IDs', () => {
      const ids = restaurants.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required base fields on every restaurant', () => {
      for (const r of restaurants) {
        expect(r.id).toBeTruthy();
        expect(r.name).toBeTruthy();
        expect(r.coordinates).toBeDefined();
        expect(typeof r.coordinates.latitude).toBe('number');
        expect(typeof r.coordinates.longitude).toBe('number');
        expect(r.rating).toBeGreaterThanOrEqual(0);
        expect(r.rating).toBeLessThanOrEqual(5);
        expect(r.priceLevel).toBeGreaterThanOrEqual(1);
        expect(r.priceLevel).toBeLessThanOrEqual(4);
        expect(Array.isArray(r.cuisineTypes)).toBe(true);
        expect(r.cuisineTypes.length).toBeGreaterThan(0);
        expect(r.safeDishes).toBeDefined();
        expect(Array.isArray(r.safeDishes.vegetarian)).toBe(true);
        expect(Array.isArray(r.safeDishes.vegan)).toBe(true);
      }
    });

    it(`should have coordinates within ${city} bounding box`, () => {
      const bounds = CITY_BOUNDS[city];
      for (const r of restaurants) {
        expect(r.coordinates.latitude).toBeGreaterThanOrEqual(bounds.lat[0]);
        expect(r.coordinates.latitude).toBeLessThanOrEqual(bounds.lat[1]);
        expect(r.coordinates.longitude).toBeGreaterThanOrEqual(bounds.lng[0]);
        expect(r.coordinates.longitude).toBeLessThanOrEqual(bounds.lng[1]);
      }
    });

    it(`should have cityId set to '${city}'`, () => {
      for (const r of restaurants) {
        expect(r.cityId).toBe(city);
      }
    });

    it('should have a valid restaurant type', () => {
      const validTypes = ['restaurant', 'bakery', 'patisserie', 'gelateria', 'bacaro', 'trattoria', 'osteria', 'pizzeria'];
      for (const r of restaurants) {
        if (r.type) {
          expect(validTypes).toContain(r.type);
        }
      }
    });

    it('should have weeklyHours defined', () => {
      for (const r of restaurants) {
        expect(r.weeklyHours).toBeDefined();
      }
    });

    it('should have valid rating range (most curated restaurants >= 4.0)', () => {
      const avgRating = restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length;
      expect(avgRating).toBeGreaterThan(4.0);
    });

    it('should have insights with correct RestaurantInsights shape', () => {
      for (const r of restaurants) {
        if (r.insights) {
          expect(typeof r.insights.summary).toBe('string');
          expect(typeof r.insights.atmosphere).toBe('string');
          expect(Array.isArray(r.insights.bestDishes)).toBe(true);
          expect(typeof r.insights.localTip).toBe('string');
          expect(typeof r.insights.touristTrapScore).toBe('number');
          expect(r.insights.touristTrapScore).toBeGreaterThanOrEqual(0);
          expect(r.insights.touristTrapScore).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  it('should have no duplicate IDs across all cities', () => {
    const allIds: string[] = [];
    for (const { getter } of datasets) {
      allIds.push(...getter().map((r) => r.id));
    }
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('should have correct total count across all cities', () => {
    const total = datasets.reduce((sum, { getter }) => sum + getter().length, 0);
    const expectedTotal = CITY_RESTAURANT_COUNTS.paris + CITY_RESTAURANT_COUNTS.rome + CITY_RESTAURANT_COUNTS.venice;
    expect(total).toBe(expectedTotal);
  });

  it('should cover all supported cities', () => {
    const coveredCities = datasets.map((d) => d.city);
    for (const city of SUPPORTED_CITIES) {
      expect(coveredCities).toContain(city);
    }
  });
});
