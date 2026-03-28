// __tests__/services/multiCityHandler.test.ts
// Tests for multi-city itinerary handling

import {
  detectMultiCity,
  splitIntoSegments,
  getRecommendationsForDay,
} from 'services/multiCityHandler';
import {
  PARIS_DAY,
  ROME_DAY,
  MULTI_CITY_DAY,
  MULTI_CITY_SEGMENTS,
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  VENICE_RESTAURANTS,
  PARIS_COORDS,
  ROME_COORDS,
  VENICE_COORDS,
  MOCK_RECOMMENDATION_RESULT,
} from '__tests__/fixtures/index';

// Mock restaurant data for recommendation engine dependencies
jest.mock('data/restaurants/paris', () => ({
  getParisRestaurants: () => {
    const { PARIS_RESTAURANTS } = require('__tests__/fixtures/index');
    return PARIS_RESTAURANTS;
  },
}));
jest.mock('data/restaurants/rome', () => ({
  getRomeRestaurants: () => {
    const { ROME_RESTAURANTS } = require('__tests__/fixtures/index');
    return ROME_RESTAURANTS;
  },
}));
jest.mock('data/restaurants/venice', () => ({
  getVeniceRestaurants: () => {
    const { VENICE_RESTAURANTS } = require('__tests__/fixtures/index');
    return VENICE_RESTAURANTS;
  },
}));
jest.mock('data/landmarks/paris', () => ({ PARIS_LANDMARKS: [] }));
jest.mock('data/landmarks/rome', () => ({ ROME_LANDMARKS: [] }));
jest.mock('data/landmarks/venice', () => ({ VENICE_LANDMARKS: [] }));

// Mock fetch for AI calls (should not be called in manual-only path)
global.fetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;

describe('detectMultiCity', () => {
  it('returns false for single-city itinerary', () => {
    expect(detectMultiCity(PARIS_DAY)).toBe(false);
  });

  it('returns true for multi-city itinerary with segments', () => {
    expect(detectMultiCity(MULTI_CITY_DAY)).toBe(true);
  });

  it('returns true when attractions have different cityIds', () => {
    const mixed = {
      ...PARIS_DAY,
      attractions: [
        { ...PARIS_DAY.attractions[0], cityId: 'paris' },
        { ...PARIS_DAY.attractions[1], cityId: 'rome' },
      ],
    };
    expect(detectMultiCity(mixed)).toBe(true);
  });

  it('returns false for empty itinerary', () => {
    const empty = { ...PARIS_DAY, attractions: [], segments: undefined };
    expect(detectMultiCity(empty)).toBe(false);
  });
});

describe('splitIntoSegments', () => {
  it('returns existing segments for multi-city itinerary', () => {
    const segments = splitIntoSegments(MULTI_CITY_DAY);
    expect(segments.length).toBe(2);
    expect(segments[0].cityId).toBe('venice');
    expect(segments[1].cityId).toBe('rome');
  });

  it('returns single segment for single-city itinerary', () => {
    const segments = splitIntoSegments(PARIS_DAY);
    expect(segments.length).toBe(1);
    expect(segments[0].cityId).toBe('paris');
  });

  it('groups attractions by cityId when no segments defined', () => {
    const mixed = {
      ...PARIS_DAY,
      segments: undefined,
      attractions: [
        { ...PARIS_DAY.attractions[0], cityId: 'paris' },
        { ...PARIS_DAY.attractions[2], cityId: 'paris' },
        { ...ROME_DAY.attractions[0], cityId: 'rome' },
      ],
    };
    const segments = splitIntoSegments(mixed);
    expect(segments.length).toBe(2);
  });

  it('maintains chronological order within segments', () => {
    const segments = splitIntoSegments(MULTI_CITY_DAY);
    // Venice segment attractions should be in time order
    const veniceTimes = segments[0].attractions.map((a) => a.estimatedTime);
    expect(veniceTimes[0]).toBe('8:00 AM');
  });
});

describe('getRecommendationsForDay', () => {
  it('returns recommendations map with meal types as keys', async () => {
    const results = await getRecommendationsForDay(PARIS_DAY);
    expect(results).toBeInstanceOf(Map);
    // Should have at least one meal type
    expect(results.size).toBeGreaterThan(0);
  });

  it('handles multi-city itinerary', async () => {
    const results = await getRecommendationsForDay(MULTI_CITY_DAY);
    expect(results).toBeInstanceOf(Map);
    expect(results.size).toBeGreaterThan(0);
  });

  it('returns empty map for empty itinerary', async () => {
    const empty = { ...PARIS_DAY, attractions: [] };
    const results = await getRecommendationsForDay(empty);
    expect(results.size).toBe(0);
  });
});
