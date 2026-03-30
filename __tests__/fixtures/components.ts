// __tests__/fixtures/components.ts
// Shared test fixtures for React component and hook tests
// RULE: Never use new Date() — all timestamps are fixed constants

import type {
  DailyItinerary,
  EnhancedRestaurant,
  MealType,
  RecommendationResult,
  RecommendationSource,
  ScoreBreakdown,
  RouteContext,
} from 'types/index';
import {
  FIXED_TIMESTAMPS,
  PARIS_ATTRACTIONS,
  PARIS_HOTEL,
  PARIS_COORDS,
  PARIS_RESTAURANTS,
} from '__tests__/fixtures/index';

// ---------------------------------------------------------------------------
// Mock itinerary text for parsing
// ---------------------------------------------------------------------------

export const MOCK_ITINERARY_TEXT = `Day 1 - Paris

9:00 AM - Louvre Museum (3 hours)
12:30 PM - Lunch break
2:00 PM - Notre-Dame Cathedral (1.5 hours)
4:30 PM - Eiffel Tower (2 hours)
`;

// ---------------------------------------------------------------------------
// Mock parsed itinerary
// ---------------------------------------------------------------------------

export const MOCK_PARSED_ITINERARY: DailyItinerary = {
  id: 'paris-2025-04-15',
  date: '2025-04-15',
  cityId: 'paris',
  attractions: PARIS_ATTRACTIONS,
  hotelLocation: PARIS_HOTEL,
  createdAt: FIXED_TIMESTAMPS.created,
  updatedAt: FIXED_TIMESTAMPS.updated,
};

// ---------------------------------------------------------------------------
// Enhanced restaurants for recommendations
// ---------------------------------------------------------------------------

const baseBreakdown: ScoreBreakdown = {
  quality: 20,
  authenticity: 15,
  convenience: 30,
  timing: 10,
  curation: 5,
  total: 80,
  distanceScore: 30,
  progressionScore: 3,
  hotelBonus: 0,
};

const baseRouteCtx: RouteContext = {
  position: 'between',
  nearbyAttraction: 'Louvre Museum',
  estimatedTime: '12:30',
  walkTime: 8,
  routeFit: '8 min walk toward next stop',
};

export const MOCK_ENHANCED_LUNCH: EnhancedRestaurant = {
  ...PARIS_RESTAURANTS[0],
  contextScore: 82,
  scoreBreakdown: { ...baseBreakdown, total: 82, quality: 22 },
  mealType: 'lunch',
  routeContext: { ...baseRouteCtx },
  insights: {
    summary: 'Classic Parisian bistro',
    atmosphere: 'Cozy neighborhood bistro',
    bestDishes: ['steak tartare', 'croque monsieur'],
    localTip: 'Go before 12:30 to avoid the queue',
    touristTrapScore: 15,
  },
};

export const MOCK_ENHANCED_LUNCH_2: EnhancedRestaurant = {
  ...PARIS_RESTAURANTS[1],
  contextScore: 75,
  scoreBreakdown: { ...baseBreakdown, total: 75, quality: 20, authenticity: 18 },
  mealType: 'lunch',
  routeContext: {
    ...baseRouteCtx,
    nearbyAttraction: 'Notre-Dame Cathedral',
    walkTime: 12,
    routeFit: '12 min walk toward next stop',
  },
  insights: {
    summary: 'Famous crepe house',
    atmosphere: 'Bustling and popular',
    bestDishes: ['buckwheat galettes'],
    localTip: 'Try the salted butter caramel crepe',
    touristTrapScore: 20,
  },
};

export const MOCK_ENHANCED_DINNER: EnhancedRestaurant = {
  ...PARIS_RESTAURANTS[0],
  id: 'paris-rest-dinner-1',
  contextScore: 78,
  scoreBreakdown: { ...baseBreakdown, total: 78, timing: 12 },
  mealType: 'dinner',
  routeContext: {
    ...baseRouteCtx,
    nearbyAttraction: 'Eiffel Tower',
    estimatedTime: '19:30',
    walkTime: 10,
    routeFit: '10 min walk from Eiffel Tower',
  },
};

export const MOCK_ENHANCED_BREAKFAST: EnhancedRestaurant = {
  ...PARIS_RESTAURANTS[2],
  contextScore: 70,
  scoreBreakdown: { ...baseBreakdown, total: 70, timing: 8, curation: 3 },
  mealType: 'breakfast',
  routeContext: {
    position: 'before',
    nearbyAttraction: 'Louvre Museum',
    estimatedTime: '08:30',
    walkTime: 5,
    routeFit: '5 min walk to first stop',
  },
};

// ---------------------------------------------------------------------------
// Mock meal recommendations map
// ---------------------------------------------------------------------------

export const MOCK_LUNCH_RESULT: RecommendationResult = {
  restaurants: [MOCK_ENHANCED_LUNCH, MOCK_ENHANCED_LUNCH_2],
  source: 'manual' as RecommendationSource,
  mealType: 'lunch',
  generatedAt: FIXED_TIMESTAMPS.noon,
  cityId: 'paris',
};

export const MOCK_DINNER_RESULT: RecommendationResult = {
  restaurants: [MOCK_ENHANCED_DINNER],
  source: 'cache' as RecommendationSource,
  mealType: 'dinner',
  generatedAt: FIXED_TIMESTAMPS.evening,
  cityId: 'paris',
};

export const MOCK_BREAKFAST_RESULT: RecommendationResult = {
  restaurants: [MOCK_ENHANCED_BREAKFAST],
  source: 'manual' as RecommendationSource,
  mealType: 'breakfast',
  generatedAt: FIXED_TIMESTAMPS.morning,
  cityId: 'paris',
};

export function createMockRecommendationsMap(): Map<MealType, RecommendationResult> {
  const map = new Map<MealType, RecommendationResult>();
  map.set('breakfast', MOCK_BREAKFAST_RESULT);
  map.set('lunch', MOCK_LUNCH_RESULT);
  map.set('dinner', MOCK_DINNER_RESULT);
  return map;
}

// ---------------------------------------------------------------------------
// Tourist trap enhanced restaurant (score > 70)
// ---------------------------------------------------------------------------

export const MOCK_TOURIST_TRAP_ENHANCED: EnhancedRestaurant = {
  id: 'trap-enhanced-1',
  name: 'Ristorante Bella Vista',
  address: 'Piazza Navona 12, Roma',
  cityId: 'rome',
  coordinates: { latitude: 41.8992, longitude: 12.4731 },
  rating: 3.5,
  reviewCount: 2500,
  priceLevel: 3,
  cuisineTypes: ['italian', 'pizza'],
  isOpenNow: true,
  famousFor: [],
  safeDishes: { vegetarian: ['margherita'], vegan: [] },
  type: 'restaurant',
  contextScore: 45,
  scoreBreakdown: { ...baseBreakdown, total: 45, authenticity: 5 },
  mealType: 'lunch',
  routeContext: { ...baseRouteCtx },
  insights: {
    summary: 'Generic tourist restaurant',
    atmosphere: 'Busy and loud',
    bestDishes: ['margherita'],
    localTip: 'Avoid — overpriced for the quality',
    touristTrapScore: 75,
  },
};
