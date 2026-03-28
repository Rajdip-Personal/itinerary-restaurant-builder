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
│   ├── routeContextBuilder.ts # Build RouteContext for restaurant-to-itinerary positioning
│   ├── tokenTracker.ts       # AI token usage tracking against budget limits
│   ├── errorLogger.ts       # Centralized error logging with 5 severity levels
│   ├── retryHandler.ts      # Retry, timeout, and fallback utilities
│   └── performanceMonitor.ts # Operation timing and performance budget tracking
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
│   ├── restaurantSearch.ts   # Search curated data by location + route corridor
│   ├── recommendationEngine.ts   # 3-tier recommendation engine (manual→cache→AI)
│   ├── recommendationCache.ts    # In-memory recommendation cache with TTL + version tracking
│   ├── aiReviewAnalyzer.ts       # AI-powered restaurant insights via backend proxy
│   ├── itineraryParser.ts        # Parse itinerary text (AI + local regex fallback)
│   ├── multiCityHandler.ts       # Multi-city itinerary detection and segmentation
│   ├── storageService.ts        # Unified in-memory storage with TTL
│   ├── networkMonitor.ts        # Network connectivity monitoring
│   └── runningLateService.ts    # Running Late / GPS re-ranking (zero API cost)
├── hooks/                    # Custom hooks (planned)
├── __tests__/
│   ├── fixtures/
│   │   └── index.ts          # Shared test fixtures (itineraries, restaurants, mocks)
│   ├── services/
│   │   ├── geocodingService.test.ts      # 23 tests: 4-tier pipeline, batch, edge cases
│   │   ├── restaurantSearch.test.ts      # 15 tests: nearby search, route search, filters
│   │   ├── recommendationEngine.test.ts  # 22 tests: 3-tier fallback, manual/cache/AI
│   │   ├── recommendationCache.test.ts   # 12 tests: set/get, TTL, stale, stats
│   │   ├── aiReviewAnalyzer.test.ts      # 11 tests: analysis, batch, error handling
│   │   ├── itineraryParser.test.ts       # 17 tests: AI parsing, local fallback, city detection
│   │   ├── multiCityHandler.test.ts      # 11 tests: detection, segmentation, recommendations
│   │   ├── storageService.test.ts       # 14 tests: get/set, TTL, prefix search, stats
│   │   ├── networkMonitor.test.ts       # 9 tests: connectivity, status change, PRD offline rule
│   │   └── runningLateService.test.ts   # 17 tests: delay filter, urgency, time warnings, GPS adjust
│   ├── data/
│   │   └── landmarks.test.ts # 22 tests: landmark data validation, fuzzy matching
│   ├── utils/
│   │   ├── constants.test.ts             # Constants verification tests
│   │   ├── recommendationRanker.test.ts  # 30 tests: sub-scores, full scoring, ranking
│   │   ├── touristTrapDetector.test.ts   # 13 tests: trap scoring, threshold, warnings
│   │   ├── routeContextBuilder.test.ts   # 8 tests: position, walk time, route fit
│   │   ├── tokenTracker.test.ts          # 13 tests: tracking, budget, warning, reset
│   │   ├── errorLogger.test.ts          # 21 tests: severity routing, FIFO buffer, stats
│   │   ├── retryHandler.test.ts         # 10 tests: retry, timeout, fallback
│   │   └── performanceMonitor.test.ts   # 10 tests: timing, budget tracking, stats
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
Phase 4 (done): 3-tier recommendation engine + AI review analysis + multi-city
Phase 5 (done): Error logging, retry/timeout, performance monitoring, storage, network, running late
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

## 3-Tier Recommendation Engine + AI Reviews + Multi-City (Phase 4)

### Recommendation Engine (`services/recommendationEngine.ts`)

3-tier fallback chain: manual curation → cache → AI → stale cache → empty (never crash)

- `getRecommendations(params)` → `Promise<RecommendationResult>` — orchestrates the full chain
- `getManualRecommendations(params)` → `RecommendationResult | null` — Tier 1: curated data + scoring + tourist trap filter
- `getCachedRecommendations(cacheKey)` → `RecommendationResult | null` — Tier 2: in-memory cache
- `generateAIRecommendations(params)` → `Promise<RecommendationResult | null>` — Tier 3: backend proxy AI

**RecommendationParams:**
`{ cityId, coordinates, mealType, routePoints?, hotelCoordinates?, previousCuisines?, forceRefresh? }`

### Recommendation Cache (`services/recommendationCache.ts`)

In-memory cache with TTL and scoring version tracking.

- `buildRecommendationCacheKey(cityId, mealType, lat, lon)` → string (coordinates rounded to 4 decimals)
- `getCachedRecommendation(key)` → `RecommendationResult | null` (checks TTL and SCORING_VERSION)
- `setCachedRecommendation(key, result)` → void
- `getStaleRecommendation(key)` → `RecommendationResult | null` (returns expired entries as fallback, source: 'stale_cache')
- `clearRecommendationCache()` → void
- `getCacheStats()` → `{ total, fresh, stale, hitRate }`

TTL: `CACHE_TTLS.ai` (7 days) for AI source, `CACHE_TTLS.lowQuality` (24h) for other sources.

### AI Review Analyzer (`services/aiReviewAnalyzer.ts`)

- `analyzeRestaurant(restaurant)` → `Promise<RestaurantInsights | null>` — calls `POST /api/ai/analyze-review`
- `generateInsights(restaurants)` → `Promise<Map<string, RestaurantInsights>>` — sequential batch analysis
- `buildAnalysisPrompt(restaurant)` → string — constructs prompt with name, cuisine, rating, dishes

### Itinerary Parser (`services/itineraryParser.ts`)

- `parseItinerary(text, cityName?)` → `Promise<DailyItinerary>` — AI parsing via `POST /api/ai/parse-itinerary` with local fallback
- `parseItineraryLocal(text)` → `DailyItinerary` — regex-based parsing (times, durations, attractions)
- `detectCity(text)` → string — case-insensitive city detection from SUPPORTED_CITIES

### Multi-City Handler (`services/multiCityHandler.ts`)

- `detectMultiCity(itinerary)` → boolean — checks segments or mixed cityId values
- `splitIntoSegments(itinerary)` → `ItinerarySegment[]` — groups by city, maintains order
- `getRecommendationsForDay(itinerary, routePoints?, hotelLocation?)` → `Promise<Map<MealType, RecommendationResult>>` — per-meal recommendations for single or multi-city days

### Token Tracker (`utils/tokenTracker.ts`)

- `trackTokenUsage(usage)` → void — accumulates toward TOKEN_BUDGET.limit (2M tokens)
- `getTokenUsage()` → `{ total, remaining, percentUsed, isWarning, isOverBudget }`
- `resetTokenUsage()` → void
- `canAffordRequest(estimatedTokens)` → boolean

Warning at 75% (1.5M tokens), over budget at 2M tokens.

### New Fixtures Added (Phase 4)

- `MOCK_TOKEN_USAGE` — sample TokenUsage response
- `MOCK_AI_INSIGHTS_RESPONSE` — sample RestaurantInsights
- `MOCK_AI_PARSE_RESPONSE` — sample parsed itinerary with usage
- `MOCK_RECOMMENDATION_RESULT` — complete RecommendationResult
- `MULTI_CITY_ITINERARY_TEXT` — Venice→Rome day text
- `PARIS_ITINERARY_TEXT` — Paris full day text

## Resilience — Error Logging, Retry, Performance, Storage, Network, GPS (Phase 5)

### Error Logger (`utils/errorLogger.ts`)

Centralized logging with 5 severity levels and FIFO buffer (max 1000 entries).

- `log(severity, message, context?, stack?)` → void — routes to console.error/warn/log
- `getRecentErrors(count?, severity?)` → `ErrorLogEntry[]` — last N entries, optional filter
- `clearLog()` → void
- `getErrorStats()` → `{ total, bySeverity: Record<ErrorSeverity, number> }`
- Shortcuts: `logFatal()`, `logError()`, `logWarning()`, `logInfo()`, `logDebug()`

### Retry Handler (`utils/retryHandler.ts`)

- `withRetry(fn, options?)` → `Promise<T>` — default 1 retry with 2s delay (PRD spec)
- `withTimeout(fn, timeoutMs)` → `Promise<T>` — throws on timeout
- `withFallback(fn, fallback)` → `Promise<T>` — returns fallback on any error

### Performance Monitor (`utils/performanceMonitor.ts`)

- `startTimer(operationName)` → `() => number` — returns stop function yielding elapsed ms
- `trackOperation(operation, durationMs)` → `{ withinBudget, budget, actual }` — checks against PERFORMANCE_BUDGETS
- `getPerformanceStats()` → `Record<string, { count, min, max, avg, overBudget }>`
- `resetPerformanceStats()` → void

### Storage Service (`services/storageService.ts`)

Unified in-memory key-value store with optional TTL.

- `setItem(key, value, ttlMs?)` → void
- `getItem<T>(key)` → `T | null` — returns null if expired or missing
- `removeItem(key)` → void
- `clear()` → void
- `getStorageStats()` → `{ totalItems, expiredItems }`
- `findByPrefix<T>(prefix)` → `Map<string, T>` — excludes expired items

### Network Monitor (`services/networkMonitor.ts`)

PRD rule: assume online on detection failure (avoid false offline blocking).

- `checkConnectivity()` → `Promise<boolean>` — pings `GET /health` with 3s timeout
- `getNetworkStatus()` → `NetworkStatus` — `{ isOnline, lastChecked, connectionType? }`
- `isOnline()` → boolean
- `onStatusChange(callback)` → unsubscribe function
- `resetNetworkMonitor()` → void

### Running Late Service (`services/runningLateService.ts`)

Zero API cost re-ranking for delay and GPS scenarios. Completes within 2s performance budget.

- `recalculateForDelay(restaurants, delayMinutes, currentTime)` → `EnhancedRestaurant[]` — filters closed, adjusts timing scores, re-sorts
- `calculateUrgency(restaurant, currentTime)` → `UrgencyState` — upcoming/active/closing_soon/closed
- `getTimeWarning(restaurant, currentTime, mealType)` → `string | undefined` — "Closes in X minutes" or "Opens at HH:MM"
- `adjustForCurrentLocation(restaurants, currentCoordinates)` → `EnhancedRestaurant[]` — re-scores convenience by GPS distance

### New Fixtures Added (Phase 5)

- `MOCK_ERROR_ENTRIES` — 5 sample ErrorLogEntry at each severity level
- `MOCK_NETWORK_ONLINE` / `MOCK_NETWORK_OFFLINE` — NetworkStatus fixtures
- `CLOSING_SOON_RESTAURANT` — EnhancedRestaurant closing at 14:30 (for Running Late tests)
- `DELAYED_TIMELINE` — SAMPLE_TIMELINE shifted by 30 minutes

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
