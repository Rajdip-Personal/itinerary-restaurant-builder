# ARCHITECTURE.md — CultureGuide Restaurant Builder

## Project Structure

```
restaurant-builder-from-itinerary/
├── types/
│   └── index.ts              # All TypeScript interfaces and type aliases
├── utils/
│   ├── constants.ts          # App-wide constants (scoring, budgets, cities)
│   ├── distance.ts           # Haversine distance + formatDistance
│   ├── timeCalculator.ts     # calculateTimeline → TimelineEntry[]
│   ├── routeCorridorSearch.ts # Bounding box + proximity filtering
│   ├── recommendationRanker.ts # Scoring engine (quality, authenticity, convenience, timing, curation)
│   ├── touristTrapDetector.ts # Tourist trap detection (review patterns, cuisine, price)
│   └── routeContextBuilder.ts # Build RouteContext for restaurant-to-itinerary positioning
├── data/
│   ├── landmarks/
│   │   ├── paris.ts          # Paris landmarks (16) + Landmark type + fuzzy matching
│   │   ├── rome.ts           # Rome landmarks (14)
│   │   └── venice.ts         # Venice landmarks (13)
│   └── restaurants/
│       ├── paris.ts          # Curated Paris restaurants (43)
│       ├── rome.ts           # Curated Rome restaurants (40)
│       └── venice.ts         # Curated Venice restaurants (15)
├── services/
│   ├── geocodingService.ts   # 4-tier geocoding pipeline (landmark→cache→google→ai)
│   ├── geocodingCache.ts     # In-memory geocoding cache with 30-day TTL
│   ├── googleGeocodingService.ts  # Google Geocoding API via backend proxy
│   ├── timeCalculator.ts     # Time parsing, walking time, arrival times
│   ├── mealBreakInserter.ts  # Insert meal breaks at European meal windows
│   ├── routeService.ts       # Route calculation (OSRM proxy + Haversine)
│   ├── routePathGenerator.ts # Route path generation (direct OSRM + fallback)
│   └── restaurantSearch.ts   # Search curated data by location + route corridor
├── hooks/                    # Custom hooks (planned)
├── __tests__/
│   ├── fixtures/
│   │   └── index.ts          # Shared test fixtures (itineraries, restaurants, mocks)
│   ├── services/
│   │   ├── geocodingService.test.ts  # 23 tests: 4-tier pipeline, batch, edge cases
│   │   └── restaurantSearch.test.ts  # 15 tests: nearby search, route search, filters
│   ├── data/
│   │   └── landmarks.test.ts # 22 tests: landmark data validation, fuzzy matching
│   ├── utils/
│   │   ├── constants.test.ts # Constants verification tests
│   │   ├── recommendationRanker.test.ts  # 25 tests: sub-scores, full scoring, ranking
│   │   ├── touristTrapDetector.test.ts   # 13 tests: trap scoring, threshold, warnings
│   │   └── routeContextBuilder.test.ts   # 8 tests: position, walk time, route fit
│   └── types.test.ts         # Type compilation smoke tests
├── package.json
├── tsconfig.json
├── jest.config.js
├── CLAUDE.md                 # Project rules and conventions
├── ARCHITECTURE.md           # This file
└── prd.md                    # Product Requirements Document
```

## Type Hierarchy

```
Coordinates ─────────────┐
                         ├──▶ HotelLocation
                         ├──▶ ItineraryAttraction
                         ├──▶ Restaurant
                         ├──▶ GeocodedLocation
                         ├──▶ RoutePoint
                         └──▶ MealBreak

Restaurant ──────────────┐
  + RestaurantInsights    │
  + ScoreBreakdown        ├──▶ EnhancedRestaurant
  + RouteContext          │
  + ReservationUrgency    │
  + MealType              │
  + UrgencyState         ─┘

DailyItinerary
  ├── ItineraryAttraction[]
  ├── ItinerarySegment[]  (multi-city)
  └── HotelLocation?

RouteSegment
  ├── from/to: string
  ├── distance/duration
  └── geometry: RoutePoint[]

RecommendationResult
  ├── EnhancedRestaurant[]
  ├── source: RecommendationSource
  └── mealType: MealType
```

## Constants Reference

| Constant | Value | Source |
|----------|-------|--------|
| SCORING_VERSION | 7 | `utils/constants.ts` |
| MAX_SCORE | 110 | `utils/constants.ts` |
| SCORE_WEIGHTS | quality:25, authenticity:20, convenience:43, timing:15, curation:5 | `utils/constants.ts` |
| MEAL_TIME_WINDOWS | breakfast 07:00-10:30, lunch 12:00-14:30, dinner 19:00-22:00 | `utils/constants.ts` |
| TOURIST_TRAP_THRESHOLD | 70 | `utils/constants.ts` |
| TOKEN_BUDGET | limit:2M, warning:1.5M, reset:30d | `utils/constants.ts` |
| SUPPORTED_CITIES | paris, rome, venice | `utils/constants.ts` |
| CITY_RESTAURANT_COUNTS | paris:43, rome:40, venice:15 | `utils/constants.ts` |

## Testing Strategy

- **TDD**: Write failing tests first, then implement
- **Fixtures**: All test data in `__tests__/fixtures/index.ts` — never inline
- **No real APIs**: Google Places, OpenAI, OSRM all mocked in tests
- **No `new Date()`**: Use `FIXED_TIMESTAMPS` for determinism
- **Jest + ts-jest**: TypeScript tests with path aliases via `moduleNameMapper`
- **Coverage**: Collected from `services/`, `utils/`, `hooks/` (excluding `.d.ts`)

## Module Dependency Plan

```
Phase 0 (done): types + constants + fixtures + test infra
Phase 1 (done): Geocoding pipeline (4-tier: landmark → cache → google → ai)
Phase 2 (done): Time calculator + route path generator + corridor search
Phase 3 (done): Restaurant search + scoring engine + tourist trap detection
Phase 4: 3-tier recommendation engine + AI review analysis + multi-city
Phase 5: Caching, error logging, network resilience, GPS
Phase 6: Full validation audit
Phase 7: React/Next.js migration
```

## Geocoding Pipeline (Phase 1)

### 4-Tier Strategy

| Tier | Source | File | Confidence | Cost |
|------|--------|------|------------|------|
| 1 | Local landmark DB | `data/landmarks/{city}.ts` | 1.0 | $0 |
| 2 | In-memory cache (30-day TTL) | `services/geocodingCache.ts` | 0.9 | $0 |
| 3 | Google Geocoding API | `services/googleGeocodingService.ts` | 0.8 | $0.005 |
| 4 | AI Geocoding (DISABLED) | — | 0.6 | — |

### Landmark Data

| City | Count | Key Landmarks |
|------|-------|--------------|
| Paris | 16 | Eiffel Tower, Louvre, Notre-Dame, Arc de Triomphe, Sacré-Cœur, Versailles, Musée d'Orsay |
| Rome | 14 | Colosseum, Vatican Museums, Trevi Fountain, Pantheon, Spanish Steps, Roman Forum |
| Venice | 13 | St. Mark's Square, Rialto Bridge, Doge's Palace, Grand Canal, Murano, Burano |

### Matching Strategy

1. **Exact name match** (case-insensitive)
2. **Alias match** (case-insensitive) — each landmark has alternate names
3. **Fuzzy match** — containment-based similarity with 0.8 threshold

### Key Functions

- `geocodeAttraction(name, cityId)` → `GeocodedLocation | null`
- `geocodeAttractions(attractions[], cityId)` → `(GeocodedLocation | null)[]`
- Attractions with pre-existing coordinates are passed through as `source: 'pre_existing'`
- Empty/whitespace names return null immediately

## Time Calculation & Route Generation (Phase 2)

### Distance Utilities (`utils/distance.ts`)

- `calculateDistance(from, to)` → meters (Haversine formula)
- `formatDistance(meters)` → `"350 m"` or `"1.5 km"`

### Timeline Calculator (`utils/timeCalculator.ts`)

- `calculateTimeline(attractions[])` → `TimelineEntry[]`
- Each entry: arrivalTime, departureTime, transitToNextMinutes, distanceToNextMeters, travelMode
- Walking speed: 5 km/h (~83 m/min)
- Walking threshold: ≤15 min walk → walking mode; >15 min → transit mode (20 min base + 5 min/km)
- Default transit: 10 min when coordinates missing

### Time Calculator Service (`services/timeCalculator.ts`)

- `haversineDistance(a, b)` → meters
- `walkingTime(distance, speed?)` → minutes
- `parseTimeToMinutes(timeStr)` → minutes since midnight (supports "9:00 AM", "14:30")
- `minutesToTimeString(minutes)` → "HH:MM"
- `addMinutesToTime(time, minutes)` → "HH:MM"
- `calculateArrivalTimes(attractions)` → updated ItineraryAttraction[] with sequential times

### Meal Break Inserter (`services/mealBreakInserter.ts`)

- `insertMealBreaks(entries, cityId?)` → `MealBreak[]`
- Accepts both `TimelineEntry[]` and `ItineraryAttraction[]` (legacy)
- European meal windows: breakfast 07:00-10:30, lunch 12:00-14:30, dinner 19:00-22:00
- Breakfast: placed before first attraction if gap exists
- Lunch: placed at gap nearest to lunch window
- Dinner: placed after last attraction

### Route Path Generator (`services/routePathGenerator.ts`)

- `generateRoutePath(locations[])` → `Promise<RoutePoint[]>`
- `generateStraightLineFallback(locations[])` → `RoutePoint[]`
- Primary: OSRM public API (`router.project-osrm.org/route/v1/walking/`)
- Fallback: straight-line interpolation every ~300m
- 5-second OSRM timeout, max 10 transit points per segment

### Route Service (`services/routeService.ts`)

- `calculateRoute(fromName, fromCoords, toName, toCoords)` → `RouteSegment | null`
- `calculateRoutes(points[])` → `RouteSegment[]`
- OSRM via backend proxy with Haversine fallback
- In-memory cache with 30-day TTL

### Route Corridor Search (`utils/routeCorridorSearch.ts`)

- `calculateRouteBoundingBox(routePoints, paddingMeters)` → `BoundingBox`
- `filterByRouteProximity(candidates, routePoints, maxDistanceMeters)` → `Coordinates[]`
- Perpendicular distance to route segments
- Empty route returns empty bounding box / empty filtered results

### New Types Added

- `TimelineEntry` — arrival/departure times, transit info, travel mode
- `BoundingBox` — north/south/east/west geographic bounds

## Restaurant Search + Scoring + Tourist Trap Detection (Phase 3)

### Restaurant Search (`services/restaurantSearch.ts`)

- `searchNearbyRestaurants(coordinates, cityId, radius?, mealType?)` → `Restaurant[]`
  - Loads curated data for city (paris/rome/venice)
  - Filters by radius (default 5000m), minimum rating (4.2)
  - Limits to 20 results, sorted by distance ascending
- `searchAlongRoute(routePoints, cityId, bufferMeters?, mealType?)` → `Restaurant[]`
  - Uses `filterByRouteProximity` from routeCorridorSearch
  - Default buffer: 400m

### Scoring Engine (`utils/recommendationRanker.ts`)

Based on CultureGuideWeb reference formulas:

| Sub-Score | Max | Formula |
|-----------|-----|---------|
| Quality | 25 | `(rating/5)*12.5 + min(12.5, log10(reviewCount+1)*4.166)` |
| Authenticity | 20 | `(100 - touristTrapScore) / 5` — depends on tourist trap detection |
| Convenience | 43 | Distance tiers: <100m→43, 100-200m→38, 200-400m→32, 400-600m→21, 600-800m→10, **>800m→null (HARD EXCLUSION)** |
| Timing | 15 | Open now: +10, Meal type match: +5 (bakery→breakfast, trattoria→lunch/dinner, gelateria→snack) |
| Curation | 5 | In curated list (+3) + famous dishes (+1) + rich safe dishes (+1) |
| Progression | -15 to +5 | Route progress (breakfast start +5, lunch mid +5, dinner end +5) + cuisine variety (exact repeat -15, similar -5) |

- Hotel bonus: +5 if within 500m (separate from progression, capped at 43 total convenience)
- `scoreRestaurant(restaurant, context)` → `ScoreBreakdown | null` (null = excluded)
- `rankRestaurants(restaurants, context)` → `EnhancedRestaurant[]` (sorted desc, >800m excluded)
- `SCORING_VERSION` exported (always imported from constants, current: 7)

### Tourist Trap Detector (`utils/touristTrapDetector.ts`)

Uses landmark proximity, price-rating penalty, and quality bonus (from CultureGuideWeb reference):

- `calculateLandmarkProximityScore(coordinates, cityId)` → 0-40
  - Uses landmarks from `data/landmarks/{city}.ts`
  - Distance tiers: 0-50m→40, 50-100m→30, 100-200m→20, 200-500m→10, 500m+→0
- `calculatePriceRatingPenalty(restaurant, landmarkScore)` → 0-35
  - Only applies near landmarks (landmarkScore > 0)
  - €€€€ + rating<4.0: 35, €€€€ + rating<4.3: 30, €€€ + rating<4.0: 30, etc.
- `calculateQualityBonus(restaurant)` → -40 to 0
  - 4.6★ + 1000+ reviews: -40, 4.5★ + 500+: -30, 4.4★ + 200+: -20, 4.3★ + 100+: -10
- `calculateTouristTrapScore(restaurant)` → 0-100 (landmark + penalty + bonus)
- `isTouristTrap(score)` → boolean (threshold: 70)
- `getTouristTrapWarning(score)` → warning string or undefined

### Route Context Builder (`utils/routeContextBuilder.ts`)

- `buildRouteContext(restaurant, attractions, timeline)` → `RouteContext`
  - Finds nearest attraction by Haversine distance
  - Position: first attraction → 'before', last → 'after', middle → 'between'
  - Walk time from walking speed (1.4 m/s ≈ 5 km/h)
  - Route fit string: "{N} min walk from/toward {attraction}"

### New Fixtures Added

- `TOURIST_TRAP_RESTAURANT` — high reviews, mediocre rating, generic cuisine, no famous dishes
- `AUTHENTIC_RESTAURANT` — osteria type, good rating, local cuisine, weekly hours
- `SCORING_CONTEXT` — reusable context with Colosseum target, hotel, lunch meal type
- `SAMPLE_TIMELINE` — 3-entry timeline for Paris (Louvre → Notre-Dame → Eiffel Tower)

## Design System

| Token | Value |
|-------|-------|
| Font (display) | Cormorant Garamond |
| Font (body) | Outfit |
| --charcoal | #1a1a2e |
| --terracotta | #c4704b |
| --ochre | #d4a574 |
| --cream | #f5f0eb |
| --sage | #8a9a7b |
| Aesthetic | Editorial luxury travel magazine |
