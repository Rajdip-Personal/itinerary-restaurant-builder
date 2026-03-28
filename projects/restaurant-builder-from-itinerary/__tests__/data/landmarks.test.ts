// __tests__/data/landmarks.test.ts
// Tests for landmark databases across all supported cities

import { PARIS_LANDMARKS, findLandmarkByName as findParisLandmark } from 'data/landmarks/paris';
import { ROME_LANDMARKS } from 'data/landmarks/rome';
import { VENICE_LANDMARKS } from 'data/landmarks/venice';
import type { Landmark } from 'data/landmarks/paris';

// Paris bounding box (approximate)
const PARIS_BOUNDS = { minLat: 48.80, maxLat: 48.92, minLon: 2.05, maxLon: 2.47 };
// Rome bounding box
const ROME_BOUNDS = { minLat: 41.85, maxLat: 41.96, minLon: 12.40, maxLon: 12.55 };
// Venice bounding box (includes Murano/Burano)
const VENICE_BOUNDS = { minLat: 45.40, maxLat: 45.50, minLon: 12.28, maxLon: 12.42 };

function isInBounds(
  coords: { latitude: number; longitude: number },
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
): boolean {
  return (
    coords.latitude >= bounds.minLat &&
    coords.latitude <= bounds.maxLat &&
    coords.longitude >= bounds.minLon &&
    coords.longitude <= bounds.maxLon
  );
}

describe('Landmark databases', () => {
  describe('Paris landmarks', () => {
    it('should have at least 10 landmarks', () => {
      expect(PARIS_LANDMARKS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid coordinates within Paris bounding box', () => {
      for (const landmark of PARIS_LANDMARKS) {
        expect(isInBounds(landmark.coordinates, PARIS_BOUNDS)).toBe(true);
      }
    });

    it('should have name and coordinates for all landmarks', () => {
      for (const landmark of PARIS_LANDMARKS) {
        expect(landmark.name).toBeTruthy();
        expect(landmark.coordinates.latitude).toBeDefined();
        expect(landmark.coordinates.longitude).toBeDefined();
        expect(typeof landmark.coordinates.latitude).toBe('number');
        expect(typeof landmark.coordinates.longitude).toBe('number');
      }
    });

    it('should have no duplicate landmark names', () => {
      const names = PARIS_LANDMARKS.map((l) => l.name.toLowerCase());
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have no alias conflicts with other landmark names in same city', () => {
      const allNames = PARIS_LANDMARKS.map((l) => l.name.toLowerCase());
      for (const landmark of PARIS_LANDMARKS) {
        for (const alias of landmark.aliases) {
          const aliasLower = alias.toLowerCase();
          // Alias should not match another landmark's primary name (unless it's the same landmark)
          const matchingNames = allNames.filter(
            (n) => n === aliasLower && n !== landmark.name.toLowerCase(),
          );
          expect(matchingNames.length).toBe(0);
        }
      }
    });

    it('should have aliases array for every landmark', () => {
      for (const landmark of PARIS_LANDMARKS) {
        expect(Array.isArray(landmark.aliases)).toBe(true);
      }
    });

    it('should include key tourist landmarks', () => {
      const names = PARIS_LANDMARKS.map((l) => l.name.toLowerCase());
      expect(names).toContain('eiffel tower');
      expect(names).toContain('louvre museum');
      expect(names.some((n) => n.includes('notre-dame') || n.includes('notre dame'))).toBe(true);
    });
  });

  describe('Rome landmarks', () => {
    it('should have at least 10 landmarks', () => {
      expect(ROME_LANDMARKS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid coordinates within Rome bounding box', () => {
      for (const landmark of ROME_LANDMARKS) {
        expect(isInBounds(landmark.coordinates, ROME_BOUNDS)).toBe(true);
      }
    });

    it('should have name and coordinates for all landmarks', () => {
      for (const landmark of ROME_LANDMARKS) {
        expect(landmark.name).toBeTruthy();
        expect(typeof landmark.coordinates.latitude).toBe('number');
        expect(typeof landmark.coordinates.longitude).toBe('number');
      }
    });

    it('should have no duplicate landmark names', () => {
      const names = ROME_LANDMARKS.map((l) => l.name.toLowerCase());
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should include key tourist landmarks', () => {
      const names = ROME_LANDMARKS.map((l) => l.name.toLowerCase());
      expect(names).toContain('colosseum');
      expect(names.some((n) => n.includes('trevi'))).toBe(true);
      expect(names.some((n) => n.includes('pantheon'))).toBe(true);
    });
  });

  describe('Venice landmarks', () => {
    it('should have at least 10 landmarks', () => {
      expect(VENICE_LANDMARKS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid coordinates within Venice bounding box', () => {
      for (const landmark of VENICE_LANDMARKS) {
        expect(isInBounds(landmark.coordinates, VENICE_BOUNDS)).toBe(true);
      }
    });

    it('should have name and coordinates for all landmarks', () => {
      for (const landmark of VENICE_LANDMARKS) {
        expect(landmark.name).toBeTruthy();
        expect(typeof landmark.coordinates.latitude).toBe('number');
        expect(typeof landmark.coordinates.longitude).toBe('number');
      }
    });

    it('should have no duplicate landmark names', () => {
      const names = VENICE_LANDMARKS.map((l) => l.name.toLowerCase());
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should include key tourist landmarks', () => {
      const names = VENICE_LANDMARKS.map((l) => l.name.toLowerCase());
      expect(names.some((n) => n.includes('mark') || n.includes('marco'))).toBe(true);
      expect(names.some((n) => n.includes('rialto'))).toBe(true);
    });
  });

  describe('findLandmarkByName (Paris)', () => {
    it('should find a landmark by exact name', () => {
      const result = findParisLandmark('Louvre Museum');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Louvre Museum');
    });

    it('should find a landmark by alias', () => {
      const result = findParisLandmark('The Louvre');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Louvre Museum');
    });

    it('should be case-insensitive', () => {
      const result = findParisLandmark('louvre museum');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Louvre Museum');
    });

    it('should return null for unknown landmark', () => {
      const result = findParisLandmark('Some Random Place That Does Not Exist');
      expect(result).toBeNull();
    });

    it('should find by partial/fuzzy match when contained', () => {
      // "Louvre" is contained in "Louvre Museum" — should find via fuzzy
      const result = findParisLandmark('Louvre');
      expect(result).not.toBeNull();
    });
  });
});
