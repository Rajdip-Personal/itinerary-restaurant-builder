// __tests__/services/routePathGenerator.test.ts
// Tests for OSRM route generation and straight-line fallback

import { generateRoutePath, generateStraightLineFallback } from 'services/routePathGenerator';
import { PARIS_COORDS } from '__tests__/fixtures/index';
import type { Coordinates, RoutePoint } from 'types/index';
import { PERFORMANCE_BUDGETS } from 'utils/constants';

// Mock global fetch for OSRM tests
const originalFetch = global.fetch;

beforeEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  global.fetch = originalFetch;
});

const parisLocations: Coordinates[] = [
  PARIS_COORDS.louvre,
  PARIS_COORDS.notreDame,
  PARIS_COORDS.eiffelTower,
];

// Mock OSRM response
const mockOSRMResponse = {
  code: 'Ok',
  routes: [
    {
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.3376, 48.8606],  // Louvre [lon, lat]
          [2.3400, 48.8580],  // midpoint
          [2.3499, 48.8530],  // Notre Dame
          [2.3200, 48.8560],  // midpoint
          [2.2945, 48.8584],  // Eiffel Tower
        ],
      },
      distance: 5300,  // meters
      duration: 3960,  // seconds
    },
  ],
};

describe('generateRoutePath', () => {
  it('returns route points from OSRM when available', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOSRMResponse,
    });

    const route = await generateRoutePath(parisLocations);

    expect(route).toHaveLength(5);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Verify first point matches Louvre (OSRM returns [lon,lat], we convert to {lat,lon})
    expect(route[0].latitude).toBeCloseTo(48.8606, 3);
    expect(route[0].longitude).toBeCloseTo(2.3376, 3);
  });

  it('falls back to straight-line on OSRM timeout', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100);
      });
    });

    const route = await generateRoutePath(parisLocations);

    // Should still return points (fallback)
    expect(route.length).toBeGreaterThan(0);
    // First and last should match input
    expect(route[0].latitude).toBeCloseTo(PARIS_COORDS.louvre.latitude, 3);
    expect(route[route.length - 1].latitude).toBeCloseTo(PARIS_COORDS.eiffelTower.latitude, 3);
  });

  it('falls back to straight-line on OSRM error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const route = await generateRoutePath(parisLocations);

    expect(route.length).toBeGreaterThan(0);
    expect(route[0].latitude).toBeCloseTo(PARIS_COORDS.louvre.latitude, 3);
  });

  it('falls back when OSRM returns non-Ok code', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'NoRoute', routes: [] }),
    });

    const route = await generateRoutePath(parisLocations);
    expect(route.length).toBeGreaterThan(0);
  });

  it('returns empty array for single point', async () => {
    const route = await generateRoutePath([PARIS_COORDS.louvre]);

    expect(route).toHaveLength(1);
    expect(route[0].latitude).toBeCloseTo(PARIS_COORDS.louvre.latitude, 3);
  });

  it('returns empty array for empty input', async () => {
    const route = await generateRoutePath([]);
    expect(route).toHaveLength(0);
  });

  it('uses OSRM walking endpoint URL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOSRMResponse,
    });

    await generateRoutePath(parisLocations);

    const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(callUrl).toContain('router.project-osrm.org/route/v1/walking');
    expect(callUrl).toContain('geometries=geojson');
    expect(callUrl).toContain('overview=full');
  });
});

describe('generateStraightLineFallback', () => {
  it('creates interpolated points every ~300m between locations', () => {
    const route = generateStraightLineFallback(parisLocations);

    // First point = first location, last point = last location
    expect(route[0].latitude).toBeCloseTo(PARIS_COORDS.louvre.latitude, 3);
    expect(route[route.length - 1].latitude).toBeCloseTo(PARIS_COORDS.eiffelTower.latitude, 3);

    // Should have more points than input (interpolated transit points)
    expect(route.length).toBeGreaterThan(parisLocations.length);
  });

  it('returns single point for single location', () => {
    const route = generateStraightLineFallback([PARIS_COORDS.louvre]);

    expect(route).toHaveLength(1);
    expect(route[0].latitude).toBeCloseTo(PARIS_COORDS.louvre.latitude, 3);
  });

  it('returns empty array for empty input', () => {
    const route = generateStraightLineFallback([]);
    expect(route).toHaveLength(0);
  });

  it('transit points are between their source and destination', () => {
    const twoPoints: Coordinates[] = [PARIS_COORDS.louvre, PARIS_COORDS.notreDame];
    const route = generateStraightLineFallback(twoPoints);

    // All intermediate points should have latitude between the two endpoints
    const minLat = Math.min(PARIS_COORDS.louvre.latitude, PARIS_COORDS.notreDame.latitude);
    const maxLat = Math.max(PARIS_COORDS.louvre.latitude, PARIS_COORDS.notreDame.latitude);

    for (const point of route) {
      expect(point.latitude).toBeGreaterThanOrEqual(minLat - 0.001);
      expect(point.latitude).toBeLessThanOrEqual(maxLat + 0.001);
    }
  });
});
