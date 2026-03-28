// __tests__/utils/routeCorridorSearch.test.ts
// Tests for route corridor bounding box and proximity filtering

import {
  calculateRouteBoundingBox,
  filterByRouteProximity,
} from 'utils/routeCorridorSearch';
import { PARIS_COORDS, ROME_COORDS } from '__tests__/fixtures/index';
import type { RoutePoint, Coordinates } from 'types/index';

// Simple route through Paris: Louvre → Notre Dame → Eiffel Tower
const parisRoute: RoutePoint[] = [
  { latitude: PARIS_COORDS.louvre.latitude, longitude: PARIS_COORDS.louvre.longitude },
  { latitude: PARIS_COORDS.notreDame.latitude, longitude: PARIS_COORDS.notreDame.longitude },
  { latitude: PARIS_COORDS.eiffelTower.latitude, longitude: PARIS_COORDS.eiffelTower.longitude },
];

describe('calculateRouteBoundingBox', () => {
  it('bounding box contains all route points', () => {
    const bbox = calculateRouteBoundingBox(parisRoute, 0);

    for (const point of parisRoute) {
      expect(point.latitude).toBeLessThanOrEqual(bbox.north);
      expect(point.latitude).toBeGreaterThanOrEqual(bbox.south);
      expect(point.longitude).toBeLessThanOrEqual(bbox.east);
      expect(point.longitude).toBeGreaterThanOrEqual(bbox.west);
    }
  });

  it('bounding box expands with padding', () => {
    const noPadding = calculateRouteBoundingBox(parisRoute, 0);
    const withPadding = calculateRouteBoundingBox(parisRoute, 400);

    expect(withPadding.north).toBeGreaterThan(noPadding.north);
    expect(withPadding.south).toBeLessThan(noPadding.south);
    expect(withPadding.east).toBeGreaterThan(noPadding.east);
    expect(withPadding.west).toBeLessThan(noPadding.west);
  });

  it('returns tight box for single point with no padding', () => {
    const singleRoute: RoutePoint[] = [
      { latitude: PARIS_COORDS.louvre.latitude, longitude: PARIS_COORDS.louvre.longitude },
    ];

    const bbox = calculateRouteBoundingBox(singleRoute, 0);

    expect(bbox.north).toBe(PARIS_COORDS.louvre.latitude);
    expect(bbox.south).toBe(PARIS_COORDS.louvre.latitude);
    expect(bbox.east).toBe(PARIS_COORDS.louvre.longitude);
    expect(bbox.west).toBe(PARIS_COORDS.louvre.longitude);
  });

  it('returns empty bounding box for empty route', () => {
    const bbox = calculateRouteBoundingBox([], 400);

    expect(bbox.north).toBe(0);
    expect(bbox.south).toBe(0);
    expect(bbox.east).toBe(0);
    expect(bbox.west).toBe(0);
  });
});

describe('filterByRouteProximity', () => {
  it('includes points close to route', () => {
    // Paris hotel is near the route (between Louvre and Notre Dame)
    const candidates: Coordinates[] = [PARIS_COORDS.hotel];

    const filtered = filterByRouteProximity(candidates, parisRoute, 1000);

    expect(filtered).toHaveLength(1);
  });

  it('excludes points far from route', () => {
    // Rome Colosseum is far from Paris route
    const candidates: Coordinates[] = [ROME_COORDS.colosseum];

    const filtered = filterByRouteProximity(candidates, parisRoute, 1000);

    expect(filtered).toHaveLength(0);
  });

  it('filters mixed candidates correctly', () => {
    const candidates: Coordinates[] = [
      PARIS_COORDS.hotel,       // Close to route
      ROME_COORDS.colosseum,    // Far from route
    ];

    const filtered = filterByRouteProximity(candidates, parisRoute, 1000);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(PARIS_COORDS.hotel);
  });

  it('returns empty array for empty candidates', () => {
    const filtered = filterByRouteProximity([], parisRoute, 1000);
    expect(filtered).toHaveLength(0);
  });

  it('returns empty array for empty route', () => {
    const candidates: Coordinates[] = [PARIS_COORDS.hotel];
    const filtered = filterByRouteProximity(candidates, [], 1000);
    expect(filtered).toHaveLength(0);
  });
});
