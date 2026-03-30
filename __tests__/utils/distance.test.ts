// __tests__/utils/distance.test.ts
// Tests for Haversine distance calculation and formatting

import { calculateDistance, formatDistance } from 'utils/distance';
import { PARIS_COORDS, ROME_COORDS } from '__tests__/fixtures/index';

describe('calculateDistance', () => {
  it('calculates Louvre to Notre Dame as approximately 1.2 km', () => {
    const distance = calculateDistance(PARIS_COORDS.louvre, PARIS_COORDS.notreDame);
    // Haversine: ~1200m based on coordinates
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1500);
  });

  it('calculates Notre Dame to Eiffel Tower as approximately 4 km', () => {
    const distance = calculateDistance(PARIS_COORDS.notreDame, PARIS_COORDS.eiffelTower);
    expect(distance).toBeGreaterThan(3500);
    expect(distance).toBeLessThan(5000);
  });

  it('returns 0 for same coordinates', () => {
    const distance = calculateDistance(PARIS_COORDS.louvre, PARIS_COORDS.louvre);
    expect(distance).toBe(0);
  });

  it('is commutative (A→B equals B→A)', () => {
    const ab = calculateDistance(PARIS_COORDS.louvre, PARIS_COORDS.notreDame);
    const ba = calculateDistance(PARIS_COORDS.notreDame, PARIS_COORDS.louvre);
    expect(ab).toBeCloseTo(ba, 5);
  });

  it('calculates cross-city distances (Paris to Rome)', () => {
    const distance = calculateDistance(PARIS_COORDS.louvre, ROME_COORDS.colosseum);
    // Paris to Rome is ~1100 km
    expect(distance).toBeGreaterThan(1_000_000);
    expect(distance).toBeLessThan(1_200_000);
  });
});

describe('formatDistance', () => {
  it('formats distances under 1000m in meters', () => {
    expect(formatDistance(350)).toBe('350 m');
  });

  it('formats distances at exactly 1000m in km', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
  });

  it('formats distances over 1000m in km with one decimal', () => {
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('rounds meters to whole numbers', () => {
    expect(formatDistance(349.7)).toBe('350 m');
  });

  it('handles zero distance', () => {
    expect(formatDistance(0)).toBe('0 m');
  });
});
