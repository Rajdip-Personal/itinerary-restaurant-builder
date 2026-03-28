// __tests__/services/routeService.test.ts
// Tests for route calculation service (OSRM + Haversine fallback)

import {
  PARIS_COORDS,
  ROME_COORDS,
} from '__tests__/fixtures/index';
import type { RouteSegment, Coordinates } from 'types/index';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import {
  calculateRoute,
  calculateRoutes,
  clearRouteCache,
} from 'services/routeService';

// Mock OSRM response for Louvre → Notre-Dame
const MOCK_OSRM_RESPONSE = {
  routes: [
    {
      distance: 1423,    // meters
      duration: 1068,    // seconds (~18 min)
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.3376, 48.8606],  // Louvre [lng, lat]
          [2.3430, 48.8560],
          [2.3499, 48.8530],  // Notre-Dame [lng, lat]
        ],
      },
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  clearRouteCache();
});

describe('Route Service', () => {
  // ─── OSRM Route Calculation ────────────────────────────────────────────────

  describe('calculateRoute with OSRM', () => {
    it('should return route segment from OSRM', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_OSRM_RESPONSE,
      });

      const result = await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      expect(result).toBeDefined();
      expect(result!.from).toBe('Louvre Museum');
      expect(result!.to).toBe('Notre-Dame Cathedral');
      expect(result!.distance).toBe(1423);
      expect(result!.duration).toBe(1068);
      expect(result!.geometry).toHaveLength(3);
    });

    it('should convert GeoJSON [lng,lat] to RoutePoint {latitude, longitude}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_OSRM_RESPONSE,
      });

      const result = await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      // GeoJSON is [lng, lat], RoutePoint is { latitude, longitude }
      expect(result!.geometry[0]).toEqual({
        latitude: 48.8606,
        longitude: 2.3376,
      });
      expect(result!.geometry[2]).toEqual({
        latitude: 48.8530,
        longitude: 2.3499,
      });
    });

    it('should call backend proxy with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_OSRM_RESPONSE,
      });

      await calculateRoute(
        'A',
        PARIS_COORDS.louvre,
        'B',
        PARIS_COORDS.notreDame,
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/routing/osrm');
      expect(callArgs[1]).toMatchObject({
        method: 'POST',
      });
    });
  });

  // ─── Fallback to Haversine ────────────────────────────────────────────────

  describe('Haversine fallback', () => {
    it('should fall back to Haversine when OSRM fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      expect(result).toBeDefined();
      expect(result!.from).toBe('Louvre Museum');
      expect(result!.to).toBe('Notre-Dame Cathedral');
      // Haversine distance should be reasonable (~1.2km)
      expect(result!.distance).toBeGreaterThan(1000);
      expect(result!.distance).toBeLessThan(1500);
      // Walking time at 5km/h
      expect(result!.duration).toBeGreaterThan(0);
      // Geometry should be just start and end points
      expect(result!.geometry).toHaveLength(2);
    });

    it('should fall back when OSRM returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      expect(result).toBeDefined();
      // Should still compute via Haversine
      expect(result!.distance).toBeGreaterThan(0);
      expect(result!.geometry).toHaveLength(2);
    });

    it('should fall back when OSRM returns empty routes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [] }),
      });

      const result = await calculateRoute(
        'A',
        PARIS_COORDS.louvre,
        'B',
        PARIS_COORDS.notreDame,
      );

      expect(result).toBeDefined();
      expect(result!.geometry).toHaveLength(2);
    });
  });

  // ─── Caching ──────────────────────────────────────────────────────────────

  describe('caching', () => {
    it('should cache OSRM results and reuse on second call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_OSRM_RESPONSE,
      });

      // First call — hits OSRM
      const result1 = await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      // Second call — should use cache
      const result2 = await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      // Only one fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Both results should be identical
      expect(result2).toEqual(result1);
    });

    it('should not cache fallback results', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_OSRM_RESPONSE,
        });

      // First call — fallback
      await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      // Second call — should try OSRM again (not use cached fallback)
      const result2 = await calculateRoute(
        'Louvre Museum',
        PARIS_COORDS.louvre,
        'Notre-Dame Cathedral',
        PARIS_COORDS.notreDame,
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Second call used OSRM
      expect(result2!.distance).toBe(1423);
    });

    it('should clear cache with clearRouteCache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => MOCK_OSRM_RESPONSE,
      });

      await calculateRoute(
        'A',
        PARIS_COORDS.louvre,
        'B',
        PARIS_COORDS.notreDame,
      );

      clearRouteCache();

      await calculateRoute(
        'A',
        PARIS_COORDS.louvre,
        'B',
        PARIS_COORDS.notreDame,
      );

      // Should have fetched twice (cache was cleared)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Batch Routes ─────────────────────────────────────────────────────────

  describe('calculateRoutes (batch)', () => {
    it('should calculate routes between sequential attractions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => MOCK_OSRM_RESPONSE,
      });

      const attractions = [
        { name: 'Louvre Museum', coordinates: PARIS_COORDS.louvre },
        { name: 'Notre-Dame Cathedral', coordinates: PARIS_COORDS.notreDame },
        { name: 'Eiffel Tower', coordinates: PARIS_COORDS.eiffelTower },
      ];

      const routes = await calculateRoutes(attractions);

      // 3 points = 2 segments
      expect(routes).toHaveLength(2);
      expect(routes[0].from).toBe('Louvre Museum');
      expect(routes[0].to).toBe('Notre-Dame Cathedral');
      expect(routes[1].from).toBe('Notre-Dame Cathedral');
      expect(routes[1].to).toBe('Eiffel Tower');
    });

    it('should return empty array for less than 2 points', async () => {
      const routes = await calculateRoutes([
        { name: 'Only One', coordinates: PARIS_COORDS.louvre },
      ]);
      expect(routes).toEqual([]);
    });

    it('should return empty array for empty input', async () => {
      const routes = await calculateRoutes([]);
      expect(routes).toEqual([]);
    });
  });
});
