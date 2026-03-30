// CultureGuide Constants
// Based on PRD Sections 10, 14, 17, 18, 19, 22

import type { MealTimeWindow } from '../types';

// ─── Scoring ────────────────────────────────────────────────────────────────

export const SCORING_VERSION = 7;

export const MAX_SCORE = 110;

export const SCORE_WEIGHTS = {
  quality: 25,
  authenticity: 20,
  convenience: 43,
  timing: 15,
  curation: 5,
} as const;

// ─── Meal Time Windows (European Standard) ──────────────────────────────────

export const MEAL_TIME_WINDOWS: Record<string, MealTimeWindow> = {
  breakfast: { start: '07:00', end: '10:30' },
  lunch: { start: '12:00', end: '14:30' },
  dinner: { start: '19:00', end: '22:00' },
};

// ─── Cache TTLs (milliseconds) ──────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

export const CACHE_TTLS = {
  ai: 7 * DAY_MS,                     // 7 days
  lowQuality: 1 * DAY_MS,             // 24 hours
  osrm: 30 * DAY_MS,                  // 30 days
  geocoding: 30 * DAY_MS,             // 30 days
  location: 5 * 60 * 1000,            // 5 minutes
} as const;

// ─── Tourist Trap Detection ─────────────────────────────────────────────────

export const TOURIST_TRAP_THRESHOLD = 70;

// ─── Token Budget ───────────────────────────────────────────────────────────

export const TOKEN_BUDGET = {
  limit: 2_000_000,
  warning: 1_500_000,
  resetDays: 30,
} as const;

// ─── Performance Budgets (milliseconds) ─────────────────────────────────────

export const PERFORMANCE_BUDGETS = {
  parse: 10_000,
  manual: 500,
  cached: 1_000,
  ai: 60_000,
  rerank: 2_000,
  osrm: 5_000,
} as const;

// ─── Nearby Search Defaults ─────────────────────────────────────────────────

export const NEARBY_SEARCH = {
  radius: 5000,                        // meters
  minRating: 4.2,
  minReviews: 100,
  max: 20,
} as const;

// ─── Supported Cities ───────────────────────────────────────────────────────

export const SUPPORTED_CITIES = ['paris', 'rome', 'venice'] as const;

export const CITY_RESTAURANT_COUNTS: Record<string, number> = {
  paris: 51,
  rome: 40,
  venice: 15,
};
