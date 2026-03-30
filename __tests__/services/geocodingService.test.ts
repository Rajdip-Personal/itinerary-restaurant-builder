// __tests__/services/geocodingService.test.ts
// Tests for the 4-tier geocoding pipeline

import {
  PARIS_COORDS,
  ROME_COORDS,
  VENICE_COORDS,
  FIXED_TIMESTAMPS,
  GEOCODED_LOUVRE,
  GEOCODED_NOTRE_DAME,
  PARIS_ATTRACTIONS,
} from '__tests__/fixtures/index';
import type { GeocodedLocation, ItineraryAttraction } from 'types/index';

// Mock the cache module before importing the service
jest.mock('services/geocodingCache', () => {
  const cache: Record<string, { data: any; timestamp: number }> = {};
  return {
    buildCacheKey: jest.fn((name: string, cityId: string) => `${cityId}:${name.toLowerCase().trim()}`),
    getCachedGeocode: jest.fn((key: string) => {
      const entry = cache[key];
      if (!entry) return null;
      // Check TTL (30 days)
      const age = FIXED_TIMESTAMPS.created - entry.timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) return null;
      return entry.data;
    }),
    setCachedGeocode: jest.fn((key: string, data: any) => {
      cache[key] = { data, timestamp: FIXED_TIMESTAMPS.created };
    }),
    clearCache: jest.fn(() => {
      Object.keys(cache).forEach((k) => delete cache[k]);
    }),
    _getCache: () => cache,
  };
});

// Mock the Google geocoding service
jest.mock('services/googleGeocodingService', () => ({
  geocodeWithGoogle: jest.fn(),
}));

// Import after mocks
import { geocodeAttraction, geocodeAttractions } from 'services/geocodingService';
import { getCachedGeocode, setCachedGeocode, clearCache } from 'services/geocodingCache';
import { geocodeWithGoogle } from 'services/googleGeocodingService';

const mockGetCachedGeocode = getCachedGeocode as jest.MockedFunction<typeof getCachedGeocode>;
const mockSetCachedGeocode = setCachedGeocode as jest.MockedFunction<typeof setCachedGeocode>;
const mockClearCache = clearCache as jest.MockedFunction<typeof clearCache>;
const mockGeocodeWithGoogle = geocodeWithGoogle as jest.MockedFunction<typeof geocodeWithGoogle>;

beforeEach(() => {
  jest.clearAllMocks();
  mockClearCache();
});

describe('Geocoding Service', () => {
  // ─── Tier 1: Landmark Resolution ──────────────────────────────────────────

  describe('Tier 1 — Landmark resolution', () => {
    it('should resolve "Louvre Museum" from Paris landmarks', async () => {
      const result = await geocodeAttraction('Louvre Museum', 'paris');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Louvre Museum');
      expect(result!.source).toBe('landmark');
      expect(result!.confidence).toBe(1.0);
      expect(result!.coordinates.latitude).toBeCloseTo(PARIS_COORDS.louvre.latitude, 2);
      expect(result!.coordinates.longitude).toBeCloseTo(PARIS_COORDS.louvre.longitude, 2);
    });

    it('should resolve alias "The Louvre" to Louvre Museum', async () => {
      const result = await geocodeAttraction('The Louvre', 'paris');
      expect(result).not.toBeNull();
      expect(result!.source).toBe('landmark');
      expect(result!.coordinates.latitude).toBeCloseTo(PARIS_COORDS.louvre.latitude, 2);
    });

    it('should be case-insensitive for landmark matching', async () => {
      const result = await geocodeAttraction('louvre museum', 'paris');
      expect(result).not.toBeNull();
      expect(result!.source).toBe('landmark');
    });

    it('should resolve Rome landmarks correctly', async () => {
      const result = await geocodeAttraction('Colosseum', 'rome');
      expect(result).not.toBeNull();
      expect(result!.source).toBe('landmark');
      expect(result!.coordinates.latitude).toBeCloseTo(ROME_COORDS.colosseum.latitude, 2);
    });

    it('should resolve Venice landmarks correctly', async () => {
      const result = await geocodeAttraction("St. Mark's Square", 'venice');
      expect(result).not.toBeNull();
      expect(result!.source).toBe('landmark');
      expect(result!.coordinates.latitude).toBeCloseTo(VENICE_COORDS.sanMarco.latitude, 2);
    });

    it('should return null for unknown landmark (falls through)', async () => {
      // Unknown landmark + no cache + no Google mock → null
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue(null);

      const result = await geocodeAttraction('Zxyqkw Totally Fake 99', 'paris');
      expect(result).toBeNull();
    });

    it('should not call cache or Google API when landmark found', async () => {
      await geocodeAttraction('Eiffel Tower', 'paris');
      expect(mockGetCachedGeocode).not.toHaveBeenCalled();
      expect(mockGeocodeWithGoogle).not.toHaveBeenCalled();
    });
  });

  // ─── Tier 2: Cache ────────────────────────────────────────────────────────

  describe('Tier 2 — Cache', () => {
    it('should return cached result with source="cache" and confidence=0.9', async () => {
      const cachedResult: GeocodedLocation = {
        name: 'Zxyqkw Custom 11',
        coordinates: { latitude: 48.86, longitude: 2.35 },
        source: 'cache',
        confidence: 0.9,
      };
      mockGetCachedGeocode.mockReturnValue(cachedResult);

      const result = await geocodeAttraction('Zxyqkw Custom 11', 'paris');
      expect(result).not.toBeNull();
      expect(result!.source).toBe('cache');
      expect(result!.confidence).toBe(0.9);
    });

    it('should fall through to Tier 3 on cache miss', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue(null);

      const result = await geocodeAttraction('Zxyqkw Cafe 33', 'paris');
      expect(mockGetCachedGeocode).toHaveBeenCalled();
      expect(mockGeocodeWithGoogle).toHaveBeenCalled();
    });

    it('should cache successful geocoding results for reuse', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue({
        latitude: 48.85,
        longitude: 2.34,
        formattedAddress: 'Zxyqkw Place 22, Paris',
      });

      await geocodeAttraction('Zxyqkw Place 22', 'paris');
      expect(mockSetCachedGeocode).toHaveBeenCalled();
    });
  });

  // ─── Tier 3: Google API ───────────────────────────────────────────────────

  describe('Tier 3 — Google API', () => {
    it('should return coordinates with source="google" from Google', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue({
        latitude: 48.8580,
        longitude: 2.2945,
        formattedAddress: 'Zxyqkw Hotel 55, Paris, France',
      });

      const result = await geocodeAttraction('Zxyqkw Hotel 55', 'paris');
      expect(result).not.toBeNull();
      expect(result!.source).toBe('google');
      expect(result!.confidence).toBe(0.8);
    });

    it('should return null when Google API fails gracefully', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue(null);

      const result = await geocodeAttraction('Zxyqkw Nowhere 42', 'paris');
      expect(result).toBeNull();
    });

    it('should cache Google API result after success', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue({
        latitude: 48.85,
        longitude: 2.35,
        formattedAddress: 'Zxyqkw Spot 44, Paris',
      });

      await geocodeAttraction('Zxyqkw Spot 44', 'paris');
      expect(mockSetCachedGeocode).toHaveBeenCalledTimes(1);
    });

    it('should handle Google API throwing an error', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockRejectedValue(new Error('Network error'));

      const result = await geocodeAttraction('Zxyqkw Error 77', 'paris');
      expect(result).toBeNull();
    });
  });

  // ─── Full Pipeline ────────────────────────────────────────────────────────

  describe('Full pipeline', () => {
    it('should skip cache and API when landmark is found (Tier 1 hit)', async () => {
      const result = await geocodeAttraction('Colosseum', 'rome');
      expect(result!.source).toBe('landmark');
      expect(mockGetCachedGeocode).not.toHaveBeenCalled();
      expect(mockGeocodeWithGoogle).not.toHaveBeenCalled();
    });

    it('should skip API when cache hit occurs (Tier 2 hit)', async () => {
      const cached: GeocodedLocation = {
        name: 'Zxyqkw Cached 66',
        coordinates: { latitude: 41.89, longitude: 12.49 },
        source: 'cache',
        confidence: 0.9,
      };
      mockGetCachedGeocode.mockReturnValue(cached);

      const result = await geocodeAttraction('Zxyqkw Cached 66', 'rome');
      expect(result!.source).toBe('cache');
      expect(mockGeocodeWithGoogle).not.toHaveBeenCalled();
    });

    it('should return null when all tiers miss', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue(null);

      const result = await geocodeAttraction('Zxyqkw Unknown 88', 'paris');
      expect(result).toBeNull();
    });
  });

  // ─── Batch Geocoding ──────────────────────────────────────────────────────

  describe('Batch geocoding (geocodeAttractions)', () => {
    it('should process an array of attractions', async () => {
      const attractions: ItineraryAttraction[] = [
        {
          id: 'test-louvre',
          name: 'Louvre Museum',
          estimatedTime: '9:00 AM',
          estimatedDuration: 180,
          isPlaceholder: false,
          cityId: 'paris',
          // No coordinates — forces geocoding pipeline
        },
        {
          id: 'test-unknown',
          name: 'Zxyqkw Cafe 33',
          estimatedTime: '12:00 PM',
          estimatedDuration: 60,
          isPlaceholder: false,
          cityId: 'paris',
        },
      ];

      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue(null);

      const results = await geocodeAttractions(attractions, 'paris');
      expect(results.length).toBe(2);
      // First should be landmark hit
      expect(results[0]).not.toBeNull();
      expect(results[0]!.source).toBe('landmark');
      // Second should be null (all tiers missed)
      expect(results[1]).toBeNull();
    });

    it('should skip geocoding for attractions with pre-existing coordinates', async () => {
      const attractions: ItineraryAttraction[] = [
        {
          id: 'pre-geocoded',
          name: 'Already Geocoded Place',
          estimatedTime: '10:00 AM',
          estimatedDuration: 60,
          isPlaceholder: false,
          cityId: 'paris',
          coordinates: { latitude: 48.86, longitude: 2.35 },
        },
      ];

      const results = await geocodeAttractions(attractions, 'paris');
      expect(results.length).toBe(1);
      expect(results[0]).not.toBeNull();
      expect(results[0]!.coordinates.latitude).toBe(48.86);
      expect(results[0]!.source).toBe('pre_existing');
      // Should not have called any geocoding tiers
      expect(mockGetCachedGeocode).not.toHaveBeenCalled();
      expect(mockGeocodeWithGoogle).not.toHaveBeenCalled();
    });

    it('should return results with correct source and confidence', async () => {
      const attractions: ItineraryAttraction[] = [
        {
          id: 'test-louvre-2',
          name: 'Louvre Museum',
          estimatedTime: '9:00 AM',
          estimatedDuration: 180,
          isPlaceholder: false,
          cityId: 'paris',
          // No coordinates — forces geocoding pipeline
        },
      ];

      const results = await geocodeAttractions(attractions, 'paris');
      expect(results[0]!.source).toBe('landmark');
      expect(results[0]!.confidence).toBe(1.0);
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should return null for empty string name', async () => {
      const result = await geocodeAttraction('', 'paris');
      expect(result).toBeNull();
    });

    it('should handle special characters in name', async () => {
      mockGetCachedGeocode.mockReturnValue(null);
      mockGeocodeWithGoogle.mockResolvedValue(null);

      // Should not throw
      const result = await geocodeAttraction("Café l'Étoile & Bar", 'paris');
      expect(result).toBeNull(); // No match, but no crash
    });

    it('should handle whitespace-only name', async () => {
      const result = await geocodeAttraction('   ', 'paris');
      expect(result).toBeNull();
    });
  });
});
