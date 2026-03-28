// CultureGuide Core Type Definitions
// Based on PRD Section 16: Data Model & Type Definitions

// ─── Primitives & Aliases ───────────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface HotelLocation {
  name: string;
  coordinates: Coordinates;
  source: 'user_provided' | 'inferred_from_first_attraction';
}

export type RestaurantType =
  | 'restaurant'
  | 'bakery'
  | 'patisserie'
  | 'gelateria'
  | 'bacaro'
  | 'trattoria'
  | 'osteria'
  | 'pizzeria';

export type ReservationLevel = 'none' | 'recommended' | 'essential';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type UrgencyState = 'upcoming' | 'active' | 'closing_soon' | 'closed';
export type RecommendationSource = 'manual' | 'cache' | 'ai' | 'stale_cache';
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

// ─── Weekly Hours & Safe Dishes ─────────────────────────────────────────────

export interface WeeklyHours {
  [day: string]: { open: string; close: string }[] | 'closed';
}

export interface SafeDishes {
  vegetarian: string[];
  vegan: string[];
  glutenFree?: string[];
  dairyFree?: string[];
}

// ─── Itinerary Types ────────────────────────────────────────────────────────

export interface DailyItinerary {
  id: string;                          // "${cityId}-${date}"
  date: string;                        // "2025-04-15"
  cityId: string;
  attractions: ItineraryAttraction[];
  segments?: ItinerarySegment[];       // Multi-city only
  hotelLocation?: HotelLocation;
  createdAt: number;
  updatedAt: number;
}

export interface ItineraryAttraction {
  id: string;
  name: string;
  estimatedTime: string;               // "10:00 AM"
  estimatedDuration: number;           // minutes
  isPlaceholder: boolean;              // meal break entries
  isHotel?: boolean;
  cityId?: string;                     // AI-detected city
  coordinates?: Coordinates;
  notes?: string;
}

export interface ItinerarySegment {
  cityId: string;
  attractions: ItineraryAttraction[];
  departureTime?: string;              // HH:MM 24h
  hotelLocation?: HotelLocation;
}

// ─── Restaurant Types ───────────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cityId: string;
  coordinates: Coordinates;
  rating: number;                      // 0-5
  reviewCount: number;
  priceLevel: number;                  // 1-4
  cuisineTypes: string[];
  isOpenNow: boolean;
  famousFor: string[];
  safeDishes: SafeDishes;
  weeklyHours?: WeeklyHours;
  reservationRequired?: ReservationLevel;
  reservationLeadDays?: number;
  type?: RestaurantType;
}

export interface RestaurantInsights {
  summary: string;
  atmosphere: string;
  bestDishes: string[];
  localTip: string;
  touristTrapScore: number;            // 0-100
}

export interface ScoreBreakdown {
  quality: number;                     // 0-25
  authenticity: number;                // 0-20
  convenience: number;                 // 0-43
  timing: number;                      // 0-15
  curation: number;                    // 0-5
  total: number;                       // 0-110
  distanceScore: number;               // 0-43
  progressionScore: number;            // -15 to +5
  hotelBonus: number;                  // 0 or +5
}

export interface RouteContext {
  position: 'before' | 'after' | 'between';
  nearbyAttraction: string;
  estimatedTime?: string;
  walkTime: number;                    // minutes
  routeFit: string;                    // "5 min walk toward next stop"
}

export interface ReservationUrgency {
  level: ReservationLevel;
  leadDays: number;
  message: string;
}

export interface EnhancedRestaurant extends Restaurant {
  insights?: RestaurantInsights;
  contextScore: number;                // 0-110
  scoreBreakdown?: ScoreBreakdown;
  mealType: MealType;
  routeContext: RouteContext;
  timeWarning?: string;
  urgency?: UrgencyState;
  reservationUrgency?: ReservationUrgency;
  validationWarning?: string;
  validationScore?: number;
}

// ─── Geocoding & Route Types ────────────────────────────────────────────────

export interface GeocodedLocation {
  name: string;
  coordinates: Coordinates;
  source: 'landmark' | 'google' | 'ai' | 'cache';
  confidence: number;                  // 0-1
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  from: string;
  to: string;
  distance: number;                    // meters
  duration: number;                    // seconds
  geometry: RoutePoint[];
}

// ─── Time Calculation Types ─────────────────────────────────────────────────

export interface TimelineEntry {
  attractionId: string;
  attractionName: string;
  arrivalTime: string;                 // "HH:MM"
  departureTime: string;               // "HH:MM"
  durationMinutes: number;
  transitToNextMinutes?: number;
  distanceToNextMeters?: number;
  travelMode?: 'walking' | 'transit';
}

// ─── Bounding Box ───────────────────────────────────────────────────────────

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ─── Meal & Recommendation Types ────────────────────────────────────────────

export interface MealTimeWindow {
  start: string;                       // "HH:MM"
  end: string;                         // "HH:MM"
}

export interface MealBreak {
  mealType: MealType;
  suggestedTime: string;               // "HH:MM"
  window: MealTimeWindow;
  nearAttraction: string;
  nearCoordinates?: Coordinates;
}

export interface RecommendationResult {
  restaurants: EnhancedRestaurant[];
  source: RecommendationSource;
  mealType: MealType;
  generatedAt: number;
  cityId: string;
}

// ─── Network & Error Types ──────────────────────────────────────────────────

export interface NetworkStatus {
  isOnline: boolean;
  lastChecked: number;
  connectionType?: string;
}

export interface ErrorLogEntry {
  timestamp: number;
  severity: ErrorSeverity;
  message: string;
  context?: string;
  stack?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}
