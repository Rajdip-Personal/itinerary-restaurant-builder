// data/landmarks/paris.ts
// Paris landmark database for Tier 1 geocoding
// Covers ~90% of tourist itineraries

import type { Coordinates } from 'types/index';

export interface Landmark {
  id: string;
  name: string;
  coordinates: Coordinates;
  aliases: string[];
  touristMagnitude: number; // 0-100, used for tourist trap detection
}

export const PARIS_LANDMARKS: Landmark[] = [
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    coordinates: { latitude: 48.8584, longitude: 2.2945 },
    aliases: ['Tour Eiffel', 'Eiffel', 'La Tour Eiffel', 'eiffel'],
    touristMagnitude: 100,
  },
  {
    id: 'louvre-museum',
    name: 'Louvre Museum',
    coordinates: { latitude: 48.8606, longitude: 2.3376 },
    aliases: ['Louvre', 'Musée du Louvre', 'Le Louvre', 'louvre museum', 'the louvre'],
    touristMagnitude: 95,
  },
  {
    id: 'notre-dame',
    name: 'Notre-Dame Cathedral',
    coordinates: { latitude: 48.8530, longitude: 2.3499 },
    aliases: ['Notre Dame', 'Notre-Dame', 'Cathédrale Notre-Dame', 'notre dame cathedral'],
    touristMagnitude: 90,
  },
  {
    id: 'arc-de-triomphe',
    name: 'Arc de Triomphe',
    coordinates: { latitude: 48.8738, longitude: 2.2950 },
    aliases: ['Arc de Triomphe de l\'Étoile', 'Triomphe', 'arc de triomphe', 'arch de triomphe', 'arc de triumph', 'arch de triumph', 'arc triomphe', 'arch', 'the arc'],
    touristMagnitude: 85,
  },
  {
    id: 'sacre-coeur',
    name: 'Sacré-Cœur Basilica',
    coordinates: { latitude: 48.8867, longitude: 2.3431 },
    aliases: ['Sacré-Cœur', 'Sacre Coeur', 'Basilique du Sacré-Cœur', 'sacre coeur', 'sacred heart'],
    touristMagnitude: 80,
  },
  {
    id: 'palace-of-versailles',
    name: 'Palace of Versailles',
    coordinates: { latitude: 48.8049, longitude: 2.1204 },
    aliases: ['Versailles', 'Château de Versailles', 'Versailles Palace', 'versailles'],
    touristMagnitude: 90,
  },
  {
    id: 'musee-dorsay',
    name: "Musée d'Orsay",
    coordinates: { latitude: 48.8599, longitude: 2.3266 },
    aliases: ['Orsay', "Musée d'Orsay", 'Orsay Museum', "d'orsay", "musee d'orsay"],
    touristMagnitude: 75,
  },
  {
    id: 'champs-elysees',
    name: 'Champs-Élysées',
    coordinates: { latitude: 48.8698, longitude: 2.3078 },
    aliases: ['Champs Elysees', 'Avenue des Champs-Élysées', 'champs elysees'],
    touristMagnitude: 70,
  },
  {
    id: 'pantheon-paris',
    name: 'Panthéon',
    coordinates: { latitude: 48.8462, longitude: 2.3464 },
    aliases: ['Pantheon', 'Le Panthéon', 'pantheon'],
    touristMagnitude: 65,
  },
  {
    id: 'sainte-chapelle',
    name: 'Sainte-Chapelle',
    coordinates: { latitude: 48.8554, longitude: 2.3450 },
    aliases: ['Sainte Chapelle', 'La Sainte-Chapelle', 'holy chapel', 'sainte chapelle'],
    touristMagnitude: 70,
  },
  {
    id: 'luxembourg-gardens',
    name: 'Luxembourg Gardens',
    coordinates: { latitude: 48.8462, longitude: 2.3372 },
    aliases: ['Jardin du Luxembourg', 'Luxembourg', 'luxembourg gardens'],
    touristMagnitude: 55,
  },
  {
    id: 'montmartre',
    name: 'Montmartre',
    coordinates: { latitude: 48.8867, longitude: 2.3431 },
    aliases: ['Montmartre Hill', 'montmartre', 'butte montmartre'],
    touristMagnitude: 75,
  },
  {
    id: 'tuileries-garden',
    name: 'Tuileries Garden',
    coordinates: { latitude: 48.8634, longitude: 2.3275 },
    aliases: ['Jardin des Tuileries', 'Tuileries', 'tuileries garden'],
    touristMagnitude: 60,
  },
  {
    id: 'place-de-la-concorde',
    name: 'Place de la Concorde',
    coordinates: { latitude: 48.8656, longitude: 2.3212 },
    aliases: ['Concorde', 'place de la concorde'],
    touristMagnitude: 65,
  },
  {
    id: 'hotel-des-invalides',
    name: 'Hôtel des Invalides',
    coordinates: { latitude: 48.8567, longitude: 2.3125 },
    aliases: ['Les Invalides', 'Invalides', "Napoleon's Tomb", 'hotel des invalides'],
    touristMagnitude: 60,
  },
  {
    id: 'palais-royal',
    name: 'Palais Royal',
    coordinates: { latitude: 48.8638, longitude: 2.3373 },
    aliases: ['Palais-Royal', 'palais royal'],
    touristMagnitude: 50,
  },
];

/**
 * Simple string similarity for fuzzy matching.
 * Returns a score 0-1 based on containment and character overlap.
 */
function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;
  if (longer.includes(shorter)) return 0.95;

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

/**
 * Find a landmark by name (case-insensitive, supports aliases, fuzzy matching)
 */
export function findLandmarkByName(name: string): Landmark | null {
  const normalized = name.toLowerCase().trim();
  if (!normalized) return null;

  // Exact match on name or alias
  const exactMatch = PARIS_LANDMARKS.find((landmark) => {
    if (landmark.name.toLowerCase() === normalized) return true;
    return landmark.aliases.some((alias) => alias.toLowerCase() === normalized);
  });
  if (exactMatch) return exactMatch;

  // Fuzzy match with threshold
  let bestMatch: Landmark | null = null;
  let bestScore = 0;

  for (const landmark of PARIS_LANDMARKS) {
    const nameScore = similarity(normalized, landmark.name.toLowerCase());
    if (nameScore > bestScore && nameScore > 0.8) {
      bestScore = nameScore;
      bestMatch = landmark;
    }
    for (const alias of landmark.aliases) {
      const aliasScore = similarity(normalized, alias.toLowerCase());
      if (aliasScore > bestScore && aliasScore > 0.8) {
        bestScore = aliasScore;
        bestMatch = landmark;
      }
    }
  }

  return bestMatch;
}

/**
 * Find a landmark in a specific city's database.
 */
export function findLandmarkInCity(name: string, cityId: string, landmarks: Landmark[]): Landmark | null {
  const normalized = name.toLowerCase().trim();
  if (!normalized) return null;

  // Exact match
  const exactMatch = landmarks.find((landmark) => {
    if (landmark.name.toLowerCase() === normalized) return true;
    return landmark.aliases.some((alias) => alias.toLowerCase() === normalized);
  });
  if (exactMatch) return exactMatch;

  // Fuzzy match
  let bestMatch: Landmark | null = null;
  let bestScore = 0;

  for (const landmark of landmarks) {
    const nameScore = similarity(normalized, landmark.name.toLowerCase());
    if (nameScore > bestScore && nameScore > 0.8) {
      bestScore = nameScore;
      bestMatch = landmark;
    }
    for (const alias of landmark.aliases) {
      const aliasScore = similarity(normalized, alias.toLowerCase());
      if (aliasScore > bestScore && aliasScore > 0.8) {
        bestScore = aliasScore;
        bestMatch = landmark;
      }
    }
  }

  return bestMatch;
}
