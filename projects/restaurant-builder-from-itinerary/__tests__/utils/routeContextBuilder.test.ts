// __tests__/utils/routeContextBuilder.test.ts
// Tests for route context builder — position detection, walk time, route fit

import { buildRouteContext } from 'utils/routeContextBuilder';
import {
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  PARIS_ATTRACTIONS,
  SAMPLE_TIMELINE,
  PARIS_COORDS,
} from '__tests__/fixtures/index';

describe('buildRouteContext', () => {
  const attractions = PARIS_ATTRACTIONS.filter((a) => !a.isPlaceholder);
  const timeline = SAMPLE_TIMELINE;

  it('assigns position "before" for restaurant near first attraction', () => {
    // Restaurant very close to Louvre (first attraction)
    const restaurant = {
      ...PARIS_RESTAURANTS[0],
      coordinates: { latitude: 48.8610, longitude: 2.3380 },
    };
    const ctx = buildRouteContext(restaurant, attractions, timeline);
    expect(ctx.position).toBe('before');
    expect(ctx.nearbyAttraction).toBe('Louvre Museum');
  });

  it('assigns position "after" for restaurant near last attraction', () => {
    // Restaurant very close to Eiffel Tower (last attraction)
    const restaurant = {
      ...PARIS_RESTAURANTS[0],
      coordinates: { latitude: 48.8580, longitude: 2.2950 },
    };
    const ctx = buildRouteContext(restaurant, attractions, timeline);
    expect(ctx.position).toBe('after');
    expect(ctx.nearbyAttraction).toBe('Eiffel Tower');
  });

  it('assigns position "between" for restaurant between attractions', () => {
    // Restaurant between Louvre and Notre-Dame
    const restaurant = {
      ...PARIS_RESTAURANTS[0],
      coordinates: { latitude: 48.8560, longitude: 2.3440 },
    };
    const ctx = buildRouteContext(restaurant, attractions, timeline);
    expect(ctx.position).toBe('between');
  });

  it('calculates walkTime as a positive number of minutes', () => {
    const ctx = buildRouteContext(PARIS_RESTAURANTS[0], attractions, timeline);
    expect(ctx.walkTime).toBeGreaterThan(0);
    expect(Number.isFinite(ctx.walkTime)).toBe(true);
  });

  it('identifies the nearest attraction name', () => {
    const ctx = buildRouteContext(PARIS_RESTAURANTS[0], attractions, timeline);
    expect(typeof ctx.nearbyAttraction).toBe('string');
    expect(ctx.nearbyAttraction.length).toBeGreaterThan(0);
  });

  it('generates a routeFit string with walk time', () => {
    const ctx = buildRouteContext(PARIS_RESTAURANTS[0], attractions, timeline);
    expect(ctx.routeFit).toContain('min');
    expect(ctx.routeFit).toContain('walk');
  });

  it('handles restaurant exactly at an attraction coordinate', () => {
    const restaurant = {
      ...PARIS_RESTAURANTS[0],
      coordinates: PARIS_COORDS.louvre,
    };
    const ctx = buildRouteContext(restaurant, attractions, timeline);
    expect(ctx.walkTime).toBeLessThanOrEqual(1);
    expect(ctx.nearbyAttraction).toBe('Louvre Museum');
  });

  it('handles single attraction in the list', () => {
    const single = [attractions[0]];
    const singleTimeline = [timeline[0]];
    const ctx = buildRouteContext(PARIS_RESTAURANTS[0], single, singleTimeline);
    expect(['before', 'after']).toContain(ctx.position);
    expect(ctx.nearbyAttraction).toBe('Louvre Museum');
  });
});
