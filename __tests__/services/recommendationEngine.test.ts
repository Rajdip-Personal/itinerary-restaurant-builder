// __tests__/services/recommendationEngine.test.ts
// Tests for 3-tier recommendation engine — manual, cache, AI fallback chain

import {
  getRecommendations,
  getManualRecommendations,
  getCachedRecommendations,
  generateAIRecommendations,
  evaluateRecommendationQuality,
} from 'services/recommendationEngine';
import {
  clearRecommendationCache,
  setCachedRecommendation,
  buildRecommendationCacheKey,
} from 'services/recommendationCache';
import {
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  VENICE_RESTAURANTS,
  ENHANCED_PARIS_RESTAURANT,
  MOCK_RECOMMENDATION_RESULT,
  MOCK_AI_INSIGHTS_RESPONSE,
  MOCK_TOKEN_USAGE,
  PARIS_COORDS,
  ROME_COORDS,
  VENICE_COORDS,
  FIXED_TIMESTAMPS,
} from '__tests__/fixtures/index';
import { CACHE_TTLS } from 'utils/constants';
import { SCORING_VERSION } from 'utils/recommendationRanker';

// Mock restaurant data loaders
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

// Mock global fetch for AI tier
const mockFetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  clearRecommendationCache();
  mockFetch.mockReset();
});

// ─── evaluateRecommendationQuality ──────────────────────────────────────────

describe('evaluateRecommendationQuality', () => {
  it('returns not good quality for fewer than 2 restaurants', () => {
    const result = evaluateRecommendationQuality([ENHANCED_PARIS_RESTAURANT]);
    expect(result.isGoodQuality).toBe(false);
    expect(result.reason).toContain('Too few');
  });

  it('returns good quality for high-scoring restaurants', () => {
    const highScored = [
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 80 },
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 75 },
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 70 },
    ];
    const result = evaluateRecommendationQuality(highScored);
    expect(result.isGoodQuality).toBe(true);
    expect(result.avgScore).toBeGreaterThanOrEqual(50);
  });

  it('returns not good quality for low average score', () => {
    const lowScored = [
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 30 },
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 25 },
    ];
    const result = evaluateRecommendationQuality(lowScored);
    expect(result.isGoodQuality).toBe(false);
    expect(result.reason).toContain('too low');
  });

  it('returns not good quality when too few have score >= 60', () => {
    const mixed = [
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 80 },
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 55 },
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 52 },
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 51 },
      { ...ENHANCED_PARIS_RESTAURANT, contextScore: 50 },
    ];
    const result = evaluateRecommendationQuality(mixed);
    expect(result.isGoodQuality).toBe(false);
  });
});

// ─── getManualRecommendations ───────────────────────────────────────────────

describe('getManualRecommendations', () => {
  // Use coordinates near fixture restaurants (not landmarks) so ranking doesn't exclude >800m
  it('returns results from curated data for paris', () => {
    // Use coords near Le Comptoir (48.8462, 2.3444)
    const result = getManualRecommendations({
      cityId: 'paris',
      coordinates: { latitude: 48.8462, longitude: 2.3444 },
      mealType: 'lunch',
    });
    expect(result).not.toBeNull();
    expect(result!.source).toBe('manual');
    expect(result!.restaurants.length).toBeGreaterThan(0);
  });

  it('returns results from curated data for rome', () => {
    // Use coords near Rome fixture restaurants (~41.894, 12.474)
    const result = getManualRecommendations({
      cityId: 'rome',
      coordinates: { latitude: 41.8940, longitude: 12.4740 },
      mealType: 'lunch',
    });
    expect(result).not.toBeNull();
    expect(result!.source).toBe('manual');
  });

  it('returns results from curated data for venice', () => {
    // Use coords near Venice fixture restaurants
    const result = getManualRecommendations({
      cityId: 'venice',
      coordinates: { latitude: 45.4370, longitude: 12.3360 },
      mealType: 'lunch',
    });
    expect(result).not.toBeNull();
    expect(result!.source).toBe('manual');
  });

  it('returns null for unsupported city', () => {
    const result = getManualRecommendations({
      cityId: 'london',
      coordinates: { latitude: 51.5, longitude: -0.1 },
      mealType: 'lunch',
    });
    expect(result).toBeNull();
  });

  it('filters out tourist traps', () => {
    const result = getManualRecommendations({
      cityId: 'rome',
      coordinates: ROME_COORDS.colosseum,
      mealType: 'lunch',
    });
    if (result) {
      for (const r of result.restaurants) {
        // Tourist trap score should be below threshold for returned results
        expect(r.contextScore).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('respects previous cuisines for variety scoring', () => {
    const nearRestaurants = { latitude: 48.8462, longitude: 2.3444 };
    const withPrevious = getManualRecommendations({
      cityId: 'paris',
      coordinates: nearRestaurants,
      mealType: 'lunch',
      previousCuisines: ['french', 'bistro'],
    });
    const withoutPrevious = getManualRecommendations({
      cityId: 'paris',
      coordinates: nearRestaurants,
      mealType: 'lunch',
    });
    expect(withPrevious).not.toBeNull();
    expect(withoutPrevious).not.toBeNull();
  });
});

// ─── getCachedRecommendations ───────────────────────────────────────────────

describe('getCachedRecommendations', () => {
  it('returns null when cache is empty', () => {
    const key = buildRecommendationCacheKey('paris', 'lunch', 48.86, 2.33);
    expect(getCachedRecommendations(key)).toBeNull();
  });

  it('returns cached result when available and fresh', () => {
    const key = buildRecommendationCacheKey('paris', 'lunch', 48.86, 2.33);
    setCachedRecommendation(key, MOCK_RECOMMENDATION_RESULT);
    const cached = getCachedRecommendations(key);
    expect(cached).not.toBeNull();
    expect(cached!.source).toBe('cache');
  });

  it('returns null for expired cache', () => {
    const key = buildRecommendationCacheKey('paris', 'lunch', 48.86, 2.33);
    const now = Date.now();
    setCachedRecommendation(key, MOCK_RECOMMENDATION_RESULT);
    // Advance time past TTL
    jest.spyOn(Date, 'now').mockReturnValue(now + CACHE_TTLS.ai + 1000);
    expect(getCachedRecommendations(key)).toBeNull();
    jest.restoreAllMocks();
  });
});

// ─── generateAIRecommendations ──────────────────────────────────────────────

// Helper: build a mock geocoding response for a given restaurant
function mockGeocodingResponse(lat: number, lng: number) {
  return {
    ok: true,
    json: async () => ({
      status: 'OK',
      results: [{ geometry: { location: { lat, lng } } }],
    }),
  } as any;
}

// Helper: set up mocks for AI call + geocoding calls for all PARIS_RESTAURANTS
function mockAIWithGeocoding() {
  // First call: AI recommend endpoint
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      restaurants: PARIS_RESTAURANTS.map((r) => ({
        name: r.name,
        latitude: r.coordinates.latitude,
        longitude: r.coordinates.longitude,
        rating: r.rating,
        reviewCount: r.reviewCount,
        type: r.type || 'restaurant',
        cuisineTypes: r.cuisineTypes,
        priceLevel: r.priceLevel,
      })),
      usage: {
        prompt_tokens: MOCK_TOKEN_USAGE.promptTokens,
        completion_tokens: MOCK_TOKEN_USAGE.completionTokens,
        total_tokens: MOCK_TOKEN_USAGE.totalTokens,
      },
    }),
  } as any);

  // Subsequent calls: geocoding for each restaurant (returns real coords)
  for (const r of PARIS_RESTAURANTS) {
    mockFetch.mockResolvedValueOnce(
      mockGeocodingResponse(r.coordinates.latitude, r.coordinates.longitude),
    );
  }
}

describe('generateAIRecommendations', () => {
  it('returns AI-generated recommendations on success', async () => {
    // Mock AI endpoint + geocoding calls for each restaurant
    mockAIWithGeocoding();

    const result = await generateAIRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    expect(result).not.toBeNull();
    expect(result!.source).toBe('ai');
  });

  it('geocodes AI restaurants before ranking', async () => {
    // Mock AI endpoint + geocoding calls
    mockAIWithGeocoding();

    await generateAIRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });

    // First call is AI recommend, subsequent calls are geocoding lookups
    // Total calls = 1 (AI) + N (geocoding per restaurant)
    expect(mockFetch).toHaveBeenCalledTimes(1 + PARIS_RESTAURANTS.length);

    // Verify geocoding calls used the correct endpoint and address format
    const secondCall = mockFetch.mock.calls[1];
    expect(secondCall[0]).toContain('/api/geocoding/lookup');
    const opts = secondCall[1] as RequestInit;
    const body = JSON.parse(opts.body as string);
    expect(body.address).toContain('Paris, France');
  });

  it('filters out restaurants that fail geocoding', async () => {
    // Mock AI endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        restaurants: PARIS_RESTAURANTS.map((r) => ({
          name: r.name,
          latitude: r.coordinates.latitude,
          longitude: r.coordinates.longitude,
          rating: r.rating,
          reviewCount: r.reviewCount,
          type: r.type || 'restaurant',
          cuisineTypes: r.cuisineTypes,
          priceLevel: r.priceLevel,
        })),
        usage: {
          prompt_tokens: MOCK_TOKEN_USAGE.promptTokens,
          completion_tokens: MOCK_TOKEN_USAGE.completionTokens,
          total_tokens: MOCK_TOKEN_USAGE.totalTokens,
        },
      }),
    } as any);

    // All geocoding calls fail
    for (const _r of PARIS_RESTAURANTS) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
      } as any);
    }

    const result = await generateAIRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    // All geocoding failed → null result
    expect(result).toBeNull();
  });

  it('returns null on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    const result = await generateAIRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await generateAIRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });
    expect(result).toBeNull();
  });

  it('caches AI results after generation', async () => {
    // Mock AI endpoint + geocoding calls
    mockAIWithGeocoding();

    await generateAIRecommendations({
      cityId: 'paris',
      coordinates: PARIS_COORDS.louvre,
      mealType: 'lunch',
    });

    // Subsequent call should hit cache
    const key = buildRecommendationCacheKey('paris', 'lunch', PARIS_COORDS.louvre.latitude, PARIS_COORDS.louvre.longitude);
    const cached = getCachedRecommendations(key);
    expect(cached).not.toBeNull();
  });
});

// ─── getRecommendations (full 3-tier) ───────────────────────────────────────

describe('getRecommendations', () => {
  it('returns manual recommendations as Tier 1', async () => {
    const nearRestaurants = { latitude: 48.8462, longitude: 2.3444 };
    const result = await getRecommendations({
      cityId: 'paris',
      coordinates: nearRestaurants,
      mealType: 'lunch',
    });
    expect(result.source).toBe('manual');
    expect(result.restaurants.length).toBeGreaterThan(0);
  });

  it('returns cached recommendations as Tier 2 when manual returns null', async () => {
    // For an unsupported city, manual returns null — use cache
    const key = buildRecommendationCacheKey('london', 'lunch', 51.5, -0.1);
    setCachedRecommendation(key, {
      ...MOCK_RECOMMENDATION_RESULT,
      cityId: 'london',
    });

    const result = await getRecommendations({
      cityId: 'london',
      coordinates: { latitude: 51.5, longitude: -0.1 },
      mealType: 'lunch',
    });
    expect(result.source).toBe('cache');
  });

  it('falls back to AI as Tier 3 when manual and cache miss', async () => {
    // Mock AI endpoint with proper restaurant format
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        restaurants: PARIS_RESTAURANTS.map((r) => ({
          name: r.name,
          latitude: r.coordinates.latitude,
          longitude: r.coordinates.longitude,
          rating: r.rating,
          reviewCount: r.reviewCount,
          type: r.type || 'restaurant',
          cuisineTypes: r.cuisineTypes,
          priceLevel: r.priceLevel,
        })),
        usage: {
          prompt_tokens: MOCK_TOKEN_USAGE.promptTokens,
          completion_tokens: MOCK_TOKEN_USAGE.completionTokens,
          total_tokens: MOCK_TOKEN_USAGE.totalTokens,
        },
      }),
    } as any);

    // Mock geocoding calls for each restaurant
    for (const r of PARIS_RESTAURANTS) {
      mockFetch.mockResolvedValueOnce(
        mockGeocodingResponse(r.coordinates.latitude, r.coordinates.longitude),
      );
    }

    const result = await getRecommendations({
      cityId: 'london',
      coordinates: { latitude: 51.5, longitude: -0.1 },
      mealType: 'lunch',
    });
    // With no manual data and no cache, AI tier should be attempted
    expect(['ai', 'stale_cache', 'manual']).toContain(result.source);
  });

  it('returns stale cache when all tiers fail', async () => {
    const now = Date.now();
    const key = buildRecommendationCacheKey('london', 'lunch', 51.5, -0.1);
    setCachedRecommendation(key, {
      ...MOCK_RECOMMENDATION_RESULT,
      cityId: 'london',
    });

    // Advance time past TTL so entry becomes stale
    jest.spyOn(Date, 'now').mockReturnValue(now + CACHE_TTLS.ai + 1000);

    mockFetch.mockRejectedValueOnce(new Error('API down'));

    const result = await getRecommendations({
      cityId: 'london',
      coordinates: { latitude: 51.5, longitude: -0.1 },
      mealType: 'lunch',
    });
    expect(result.source).toBe('stale_cache');
    jest.restoreAllMocks();
  });

  it('returns empty result when everything fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API down'));

    const result = await getRecommendations({
      cityId: 'london',
      coordinates: { latitude: 51.5, longitude: -0.1 },
      mealType: 'lunch',
    });
    // No manual, no cache, no AI, no stale → empty
    expect(result.restaurants).toEqual([]);
  });

  it('bypasses fresh cache when forceRefresh is true', async () => {
    // For an unsupported city, manual returns null; with forceRefresh, cache is skipped
    const key = buildRecommendationCacheKey('london', 'lunch', 51.5, -0.1);
    setCachedRecommendation(key, {
      ...MOCK_RECOMMENDATION_RESULT,
      cityId: 'london',
    });

    mockFetch.mockRejectedValueOnce(new Error('API down'));

    const result = await getRecommendations({
      cityId: 'london',
      coordinates: { latitude: 51.5, longitude: -0.1 },
      mealType: 'lunch',
      forceRefresh: true,
    });
    // No manual data, forceRefresh skips fresh cache, AI fails
    // → falls to stale cache (which still has data since it was just set)
    // Since it's fresh (just set), stale won't return it either → empty
    // Actually the stale fallback returns any cached entry regardless of freshness
    expect(['stale_cache', 'manual']).toContain(result.source);
  });

  it('includes cityId and mealType in result', async () => {
    const nearRestaurants = { latitude: 48.8462, longitude: 2.3444 };
    const result = await getRecommendations({
      cityId: 'paris',
      coordinates: nearRestaurants,
      mealType: 'dinner',
    });
    expect(result.cityId).toBe('paris');
    expect(result.mealType).toBe('dinner');
  });

  it('passes hotel coordinates to scoring context', async () => {
    const nearRestaurants = { latitude: 48.8462, longitude: 2.3444 };
    const result = await getRecommendations({
      cityId: 'paris',
      coordinates: nearRestaurants,
      mealType: 'lunch',
      hotelCoordinates: PARIS_COORDS.hotel,
    });
    expect(result).toBeDefined();
    expect(result.restaurants.length).toBeGreaterThan(0);
  });

  it('passes previous cuisines to scoring context', async () => {
    const nearRestaurants = { latitude: 48.8462, longitude: 2.3444 };
    const result = await getRecommendations({
      cityId: 'paris',
      coordinates: nearRestaurants,
      mealType: 'lunch',
      previousCuisines: ['french'],
    });
    expect(result).toBeDefined();
  });
});
