// __tests__/fixtures/index.ts
// Shared test fixtures for CultureGuide tests
// RULE: Never use new Date() — all timestamps are fixed constants

import {
  DailyItinerary,
  ItineraryAttraction,
  ItinerarySegment,
  Restaurant,
  EnhancedRestaurant,
  Coordinates,
  HotelLocation,
  GeocodedLocation,
  MealBreak,
  ScoreBreakdown,
  RouteContext,
  TokenUsage,
  MealTimeWindow,
} from 'types/index';

// ---------------------------------------------------------------------------
// Fixed timestamps (deterministic — never use new Date())
// ---------------------------------------------------------------------------

export const FIXED_TIMESTAMPS = {
  created: 1744675200000,   // 2025-04-15T00:00:00Z
  updated: 1744675200000,
  morning: 1744693200000,   // 2025-04-15T05:00:00Z
  noon: 1744718400000,      // 2025-04-15T12:00:00Z
  evening: 1744743600000,   // 2025-04-15T19:00:00Z
} as const;

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

export const PARIS_COORDS: Record<string, Coordinates> = {
  louvre: { latitude: 48.8606, longitude: 2.3376 },
  notreDame: { latitude: 48.8530, longitude: 2.3499 },
  eiffelTower: { latitude: 48.8584, longitude: 2.2945 },
  hotel: { latitude: 48.8566, longitude: 2.3522 },
};

export const ROME_COORDS: Record<string, Coordinates> = {
  colosseum: { latitude: 41.8902, longitude: 12.4922 },
  trevi: { latitude: 41.9009, longitude: 12.4833 },
  pantheon: { latitude: 41.8986, longitude: 12.4769 },
  hotel: { latitude: 41.9028, longitude: 12.4964 },
};

export const VENICE_COORDS: Record<string, Coordinates> = {
  sanMarco: { latitude: 45.4343, longitude: 12.3388 },
  rialto: { latitude: 45.4381, longitude: 12.3360 },
  dorsoduro: { latitude: 45.4305, longitude: 12.3270 },
  hotel: { latitude: 45.4370, longitude: 12.3345 },
};

// ---------------------------------------------------------------------------
// Hotel locations
// ---------------------------------------------------------------------------

export const PARIS_HOTEL: HotelLocation = {
  name: 'Hotel Le Marais',
  coordinates: PARIS_COORDS.hotel,
  source: 'user_provided',
};

export const ROME_HOTEL: HotelLocation = {
  name: 'Hotel Termini',
  coordinates: ROME_COORDS.hotel,
  source: 'user_provided',
};

// ---------------------------------------------------------------------------
// Itinerary attractions
// ---------------------------------------------------------------------------

export const PARIS_ATTRACTIONS: ItineraryAttraction[] = [
  {
    id: 'paris-attr-1',
    name: 'Louvre Museum',
    estimatedTime: '9:00 AM',
    estimatedDuration: 180,
    isPlaceholder: false,
    cityId: 'paris',
    coordinates: PARIS_COORDS.louvre,
  },
  {
    id: 'paris-attr-lunch',
    name: 'Lunch Break',
    estimatedTime: '12:30 PM',
    estimatedDuration: 60,
    isPlaceholder: true,
    cityId: 'paris',
  },
  {
    id: 'paris-attr-2',
    name: 'Notre-Dame Cathedral',
    estimatedTime: '2:00 PM',
    estimatedDuration: 90,
    isPlaceholder: false,
    cityId: 'paris',
    coordinates: PARIS_COORDS.notreDame,
  },
  {
    id: 'paris-attr-3',
    name: 'Eiffel Tower',
    estimatedTime: '4:30 PM',
    estimatedDuration: 120,
    isPlaceholder: false,
    cityId: 'paris',
    coordinates: PARIS_COORDS.eiffelTower,
  },
];

export const ROME_ATTRACTIONS: ItineraryAttraction[] = [
  {
    id: 'rome-attr-1',
    name: 'Colosseum',
    estimatedTime: '9:30 AM',
    estimatedDuration: 120,
    isPlaceholder: false,
    cityId: 'rome',
    coordinates: ROME_COORDS.colosseum,
  },
  {
    id: 'rome-attr-2',
    name: 'Trevi Fountain',
    estimatedTime: '12:00 PM',
    estimatedDuration: 30,
    isPlaceholder: false,
    cityId: 'rome',
    coordinates: ROME_COORDS.trevi,
  },
  {
    id: 'rome-attr-3',
    name: 'Pantheon',
    estimatedTime: '1:00 PM',
    estimatedDuration: 60,
    isPlaceholder: false,
    cityId: 'rome',
    coordinates: ROME_COORDS.pantheon,
  },
];

// ---------------------------------------------------------------------------
// Multi-city segments (Venice morning -> Rome evening)
// ---------------------------------------------------------------------------

export const MULTI_CITY_SEGMENTS: ItinerarySegment[] = [
  {
    cityId: 'venice',
    attractions: [
      {
        id: 'venice-attr-1',
        name: 'Dorsoduro Walk',
        estimatedTime: '8:00 AM',
        estimatedDuration: 120,
        isPlaceholder: false,
        cityId: 'venice',
        coordinates: VENICE_COORDS.dorsoduro,
      },
      {
        id: 'venice-attr-2',
        name: 'Accademia Bridge',
        estimatedTime: '10:30 AM',
        estimatedDuration: 30,
        isPlaceholder: false,
        cityId: 'venice',
        coordinates: VENICE_COORDS.rialto,
      },
    ],
    departureTime: '12:00',
    hotelLocation: {
      name: 'Venice B&B',
      coordinates: VENICE_COORDS.hotel,
      source: 'user_provided',
    },
  },
  {
    cityId: 'rome',
    attractions: [
      {
        id: 'rome-mc-attr-1',
        name: 'Trevi Fountain',
        estimatedTime: '3:00 PM',
        estimatedDuration: 30,
        isPlaceholder: false,
        cityId: 'rome',
        coordinates: ROME_COORDS.trevi,
      },
      {
        id: 'rome-mc-attr-2',
        name: 'Pantheon',
        estimatedTime: '4:00 PM',
        estimatedDuration: 60,
        isPlaceholder: false,
        cityId: 'rome',
        coordinates: ROME_COORDS.pantheon,
      },
    ],
    hotelLocation: {
      name: 'Hotel Termini',
      coordinates: ROME_COORDS.hotel,
      source: 'user_provided',
    },
  },
];

// ---------------------------------------------------------------------------
// Daily itineraries
// ---------------------------------------------------------------------------

export const PARIS_DAY: DailyItinerary = {
  id: 'paris-2025-04-15',
  date: '2025-04-15',
  cityId: 'paris',
  attractions: PARIS_ATTRACTIONS,
  hotelLocation: PARIS_HOTEL,
  createdAt: FIXED_TIMESTAMPS.created,
  updatedAt: FIXED_TIMESTAMPS.updated,
};

export const ROME_DAY: DailyItinerary = {
  id: 'rome-2025-04-16',
  date: '2025-04-16',
  cityId: 'rome',
  attractions: ROME_ATTRACTIONS,
  hotelLocation: ROME_HOTEL,
  createdAt: FIXED_TIMESTAMPS.created,
  updatedAt: FIXED_TIMESTAMPS.updated,
};

export const MULTI_CITY_DAY: DailyItinerary = {
  id: 'venice-rome-2025-04-17',
  date: '2025-04-17',
  cityId: 'venice',
  attractions: [
    ...MULTI_CITY_SEGMENTS[0].attractions,
    ...MULTI_CITY_SEGMENTS[1].attractions,
  ],
  segments: MULTI_CITY_SEGMENTS,
  createdAt: FIXED_TIMESTAMPS.created,
  updatedAt: FIXED_TIMESTAMPS.updated,
};

// ---------------------------------------------------------------------------
// Mock restaurants
// ---------------------------------------------------------------------------

const baseScoreBreakdown: ScoreBreakdown = {
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

const baseRouteContext: RouteContext = {
  position: 'between',
  nearbyAttraction: 'Louvre Museum',
  estimatedTime: '12:30',
  walkTime: 8,
  routeFit: '8 min walk toward next stop',
};

export const PARIS_RESTAURANTS: Restaurant[] = [
  {
    id: 'paris-rest-1',
    name: 'Le Comptoir du Pantheon',
    address: '5 Rue Soufflot, 75005 Paris',
    cityId: 'paris',
    coordinates: { latitude: 48.8462, longitude: 2.3444 },
    rating: 4.5,
    reviewCount: 320,
    priceLevel: 2,
    cuisineTypes: ['french', 'bistro'],
    isOpenNow: true,
    famousFor: ['steak tartare', 'croque monsieur'],
    safeDishes: {
      vegetarian: ['ratatouille', 'cheese plate'],
      vegan: ['mixed salad'],
    },
    weeklyHours: {
      monday: [{ open: '12:00', close: '23:00' }],
      tuesday: [{ open: '12:00', close: '23:00' }],
      wednesday: [{ open: '12:00', close: '23:00' }],
      thursday: [{ open: '12:00', close: '23:00' }],
      friday: [{ open: '12:00', close: '23:00' }],
      saturday: [{ open: '12:00', close: '23:00' }],
      sunday: 'closed',
    },
    reservationRequired: 'recommended',
    type: 'restaurant',
  },
  {
    id: 'paris-rest-2',
    name: 'Breizh Cafe',
    address: '109 Rue Vieille du Temple, 75003 Paris',
    cityId: 'paris',
    coordinates: { latitude: 48.8632, longitude: 2.3612 },
    rating: 4.6,
    reviewCount: 1200,
    priceLevel: 2,
    cuisineTypes: ['french', 'crepes'],
    isOpenNow: true,
    famousFor: ['buckwheat galettes', 'salted butter caramel crepe'],
    safeDishes: {
      vegetarian: ['cheese galette', 'mushroom galette'],
      vegan: ['vegetable galette'],
      glutenFree: ['buckwheat galettes'],
    },
    reservationRequired: 'essential',
    reservationLeadDays: 3,
    type: 'restaurant',
  },
  {
    id: 'paris-rest-3',
    name: 'Du Pain et des Idees',
    address: '34 Rue Yves Toudic, 75010 Paris',
    cityId: 'paris',
    coordinates: { latitude: 48.8710, longitude: 2.3615 },
    rating: 4.7,
    reviewCount: 2500,
    priceLevel: 1,
    cuisineTypes: ['bakery', 'pastry'],
    isOpenNow: true,
    famousFor: ['pain des amis', 'escargot pastry'],
    safeDishes: {
      vegetarian: ['croissant', 'pain au chocolat'],
      vegan: [],
    },
    type: 'bakery',
  },
];

export const ROME_RESTAURANTS: Restaurant[] = [
  {
    id: 'rome-rest-1',
    name: 'Da Enzo al 29',
    address: 'Via dei Vascellari, 29, 00153 Roma',
    cityId: 'rome',
    coordinates: { latitude: 41.8872, longitude: 12.4735 },
    rating: 4.6,
    reviewCount: 4500,
    priceLevel: 2,
    cuisineTypes: ['roman', 'trattoria'],
    isOpenNow: true,
    famousFor: ['cacio e pepe', 'carbonara'],
    safeDishes: {
      vegetarian: ['cacio e pepe', 'fried artichokes'],
      vegan: ['bruschetta'],
    },
    reservationRequired: 'essential',
    reservationLeadDays: 1,
    type: 'trattoria',
  },
  {
    id: 'rome-rest-2',
    name: 'Roscioli',
    address: 'Via dei Giubbonari, 21, 00186 Roma',
    cityId: 'rome',
    coordinates: { latitude: 41.8947, longitude: 12.4740 },
    rating: 4.5,
    reviewCount: 3200,
    priceLevel: 3,
    cuisineTypes: ['roman', 'deli'],
    isOpenNow: true,
    famousFor: ['carbonara', 'burrata'],
    safeDishes: {
      vegetarian: ['burrata', 'eggplant parm'],
      vegan: ['bruschetta pomodoro'],
    },
    reservationRequired: 'essential',
    reservationLeadDays: 7,
    type: 'restaurant',
  },
  {
    id: 'rome-rest-3',
    name: 'Antico Forno Roscioli',
    address: 'Via dei Chiavari, 34, 00186 Roma',
    cityId: 'rome',
    coordinates: { latitude: 41.8950, longitude: 12.4738 },
    rating: 4.4,
    reviewCount: 1800,
    priceLevel: 1,
    cuisineTypes: ['bakery', 'pizza'],
    isOpenNow: true,
    famousFor: ['pizza bianca', 'supplì'],
    safeDishes: {
      vegetarian: ['margherita', 'pizza bianca'],
      vegan: ['focaccia'],
    },
    type: 'bakery',
  },
];

export const VENICE_RESTAURANTS: Restaurant[] = [
  {
    id: 'venice-rest-1',
    name: 'Osteria Al Portego',
    address: 'Calle della Malvasia, 6015, Venice',
    cityId: 'venice',
    coordinates: { latitude: 45.4385, longitude: 12.3405 },
    rating: 4.3,
    reviewCount: 900,
    priceLevel: 2,
    cuisineTypes: ['venetian', 'cicchetti'],
    isOpenNow: true,
    famousFor: ['cicchetti', 'baccalà mantecato'],
    safeDishes: {
      vegetarian: ['vegetable cicchetti'],
      vegan: ['grilled vegetables'],
    },
    reservationRequired: 'none',
    type: 'bacaro',
  },
  {
    id: 'venice-rest-2',
    name: 'Trattoria Alla Madonna',
    address: 'Calle della Madonna, 594, Venice',
    cityId: 'venice',
    coordinates: { latitude: 45.4370, longitude: 12.3350 },
    rating: 4.2,
    reviewCount: 2100,
    priceLevel: 2,
    cuisineTypes: ['venetian', 'seafood'],
    isOpenNow: true,
    famousFor: ['fritto misto', 'spaghetti alle vongole'],
    safeDishes: {
      vegetarian: ['risotto primavera'],
      vegan: ['grilled vegetables'],
    },
    reservationRequired: 'recommended',
    type: 'trattoria',
  },
  {
    id: 'venice-rest-3',
    name: 'Gelateria Nico',
    address: 'Dorsoduro 922, Venice',
    cityId: 'venice',
    coordinates: { latitude: 45.4299, longitude: 12.3262 },
    rating: 4.5,
    reviewCount: 1500,
    priceLevel: 1,
    cuisineTypes: ['gelato', 'dessert'],
    isOpenNow: true,
    famousFor: ['gianduiotto', 'pistachio gelato'],
    safeDishes: {
      vegetarian: ['all gelato flavors'],
      vegan: ['sorbetto'],
    },
    type: 'gelateria',
  },
];

// ---------------------------------------------------------------------------
// Enhanced restaurants (with scores and route context)
// ---------------------------------------------------------------------------

export const ENHANCED_PARIS_RESTAURANT: EnhancedRestaurant = {
  ...PARIS_RESTAURANTS[0],
  contextScore: 82,
  scoreBreakdown: { ...baseScoreBreakdown, total: 82, quality: 22 },
  mealType: 'lunch',
  routeContext: { ...baseRouteContext },
  insights: {
    summary: 'Classic Parisian bistro with excellent steak tartare',
    atmosphere: 'Cozy neighborhood bistro with sidewalk seating',
    bestDishes: ['steak tartare', 'croque monsieur'],
    localTip: 'Go before 12:30 to avoid the queue',
    touristTrapScore: 15,
  },
};

// ---------------------------------------------------------------------------
// Mock API responses
// ---------------------------------------------------------------------------

export const MOCK_OPENAI_PARSE_RESPONSE = {
  parsed: {
    cityId: 'paris',
    date: '2025-04-15',
    attractions: PARIS_ATTRACTIONS.filter((a) => !a.isPlaceholder),
    hotelName: 'Hotel Le Marais',
  },
  usage: {
    promptTokens: 245,
    completionTokens: 380,
    totalTokens: 625,
    estimatedCost: 0.0004,
  } satisfies TokenUsage,
};

export const MOCK_GOOGLE_PLACES_RESPONSE = {
  results: PARIS_RESTAURANTS.map((r) => ({
    place_id: `gp_${r.id}`,
    name: r.name,
    geometry: {
      location: {
        lat: r.coordinates.latitude,
        lng: r.coordinates.longitude,
      },
    },
    rating: r.rating,
    user_ratings_total: r.reviewCount,
    price_level: r.priceLevel,
    types: ['restaurant', 'food', 'establishment'],
    opening_hours: { open_now: r.isOpenNow },
  })),
  status: 'OK',
};

export const MOCK_GEOCODING_RESPONSE = {
  results: [
    {
      formatted_address: 'Musee du Louvre, Paris, France',
      geometry: {
        location: {
          lat: PARIS_COORDS.louvre.latitude,
          lng: PARIS_COORDS.louvre.longitude,
        },
      },
      place_id: 'geo_louvre',
    },
  ],
  status: 'OK',
};

// ---------------------------------------------------------------------------
// Geocoded locations
// ---------------------------------------------------------------------------

export const GEOCODED_LOUVRE: GeocodedLocation = {
  name: 'Louvre Museum',
  coordinates: PARIS_COORDS.louvre,
  source: 'landmark',
  confidence: 1.0,
};

export const GEOCODED_NOTRE_DAME: GeocodedLocation = {
  name: 'Notre-Dame Cathedral',
  coordinates: PARIS_COORDS.notreDame,
  source: 'landmark',
  confidence: 1.0,
};

// ---------------------------------------------------------------------------
// Meal breaks
// ---------------------------------------------------------------------------

export const PARIS_LUNCH_BREAK: MealBreak = {
  mealType: 'lunch',
  suggestedTime: '12:30',
  window: { start: '12:00', end: '14:30' },
  nearAttraction: 'Louvre Museum',
  nearCoordinates: PARIS_COORDS.louvre,
};

export const PARIS_DINNER_BREAK: MealBreak = {
  mealType: 'dinner',
  suggestedTime: '19:30',
  window: { start: '19:00', end: '22:00' },
  nearAttraction: 'Eiffel Tower',
  nearCoordinates: PARIS_COORDS.eiffelTower,
};

// ---------------------------------------------------------------------------
// Phase 3: Tourist Trap & Scoring Fixtures
// ---------------------------------------------------------------------------

import type { TimelineEntry, MealType } from 'types/index';

/** Restaurant with tourist-trap-like attributes: high reviews, mediocre rating, generic cuisine, high price, no famous dishes */
export const TOURIST_TRAP_RESTAURANT: Restaurant = {
  id: 'trap-rest-1',
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
};

/** Clearly authentic local restaurant: local type, good rating, moderate reviews, local cuisine, famous dishes */
export const AUTHENTIC_RESTAURANT: Restaurant = {
  id: 'auth-rest-1',
  name: 'Osteria del Nonno',
  address: 'Vicolo del Bologna 8, Roma',
  cityId: 'rome',
  coordinates: { latitude: 41.8910, longitude: 12.4780 },
  rating: 4.7,
  reviewCount: 350,
  priceLevel: 2,
  cuisineTypes: ['roman', 'trattoria'],
  isOpenNow: true,
  famousFor: ['cacio e pepe', 'supplì al telefono'],
  safeDishes: {
    vegetarian: ['cacio e pepe', 'fried artichokes'],
    vegan: ['bruschetta'],
  },
  weeklyHours: {
    monday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    tuesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    wednesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    thursday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    friday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    saturday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    sunday: 'closed',
  },
  reservationRequired: 'recommended',
  reservationLeadDays: 1,
  type: 'osteria',
};

/** Reusable scoring context for recommendation ranker tests */
export const SCORING_CONTEXT = {
  targetCoordinates: ROME_COORDS.colosseum,
  hotelCoordinates: ROME_COORDS.hotel,
  mealType: 'lunch' as MealType,
  currentTime: '12:30',
  previousCuisines: [] as string[],
};

/** Sample timeline for route context builder tests */
export const SAMPLE_TIMELINE: TimelineEntry[] = [
  {
    attractionId: 'paris-attr-1',
    attractionName: 'Louvre Museum',
    arrivalTime: '09:00',
    departureTime: '12:00',
    durationMinutes: 180,
    transitToNextMinutes: 15,
    distanceToNextMeters: 1200,
  },
  {
    attractionId: 'paris-attr-2',
    attractionName: 'Notre-Dame Cathedral',
    arrivalTime: '14:00',
    departureTime: '15:30',
    durationMinutes: 90,
    transitToNextMinutes: 25,
    distanceToNextMeters: 4000,
  },
  {
    attractionId: 'paris-attr-3',
    attractionName: 'Eiffel Tower',
    arrivalTime: '16:30',
    departureTime: '18:30',
    durationMinutes: 120,
  },
];
