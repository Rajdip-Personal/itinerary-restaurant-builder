# Product Requirements Document (PRD)
# Itinerary Parsing & Restaurant Generation System

**Product**: CultureGuide
**Version**: 1.0
**Date**: 2026-03-28
**Author**: Auto-generated from codebase analysis

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [User Personas & Use Cases](#3-user-personas--use-cases)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Feature 1: Itinerary Input & Parsing](#5-feature-1-itinerary-input--parsing)
6. [Feature 2: Geocoding Pipeline](#6-feature-2-geocoding-pipeline)
7. [Feature 3: Time Calculation & Meal Break Insertion](#7-feature-3-time-calculation--meal-break-insertion)
8. [Feature 4: Route Path Generation](#8-feature-4-route-path-generation)
9. [Feature 5: Restaurant Discovery & Recommendation](#9-feature-5-restaurant-discovery--recommendation)
10. [Feature 6: Scoring & Ranking System](#10-feature-6-scoring--ranking-system)
11. [Feature 7: Tourist Trap Detection](#11-feature-7-tourist-trap-detection)
12. [Feature 8: AI Review Analysis & Insights](#12-feature-8-ai-review-analysis--insights)
13. [Feature 9: Multi-City Day Support](#13-feature-9-multi-city-day-support)
14. [Feature 10: Caching Strategy](#14-feature-10-caching-strategy)
15. [Backend API Proxy Server](#15-backend-api-proxy-server)
16. [Data Model & Type Definitions](#16-data-model--type-definitions)
17. [Supported Cities & Manual Data](#17-supported-cities--manual-data)
18. [Cost Model & Token Budget](#18-cost-model--token-budget)
19. [Non-Functional Requirements](#19-non-functional-requirements)
20. [Known Constraints & Limitations](#20-known-constraints--limitations)
21. [Future Enhancements](#21-future-enhancements)
22. [Development Constraints & Guidelines](#22-development-constraints--guidelines)
23. [Error Logging & Monitoring](#23-error-logging--monitoring)
24. [Network Resilience](#24-network-resilience)
25. [Location Services](#25-location-services)
26. [Retry & Fallback Recovery](#26-retry--fallback-recovery)
27. [Dual-Mode Restaurant Discovery](#27-dual-mode-restaurant-discovery)

---

## 1. Executive Summary

CultureGuide's Itinerary Parsing & Restaurant Generation system transforms free-form tourist itinerary text into structured, time-sequenced daily plans with context-aware restaurant recommendations. The system uses AI to parse natural language itineraries, geocodes attractions, generates walking routes, and recommends restaurants along the user's path -- filtered for authenticity, meal timing, and walkability.

**Key differentiator**: Restaurants are recommended based on WHERE the user will be at WHAT TIME, not just proximity to current location. A lunch recommendation appears near the middle of the route; a dinner recommendation appears near the end or near the hotel.

---

## 2. Problem Statement

Tourists visiting European cities face several restaurant-related challenges:

1. **Decision fatigue**: Hundreds of restaurant options with no context about which ones fit their route.
2. **Tourist traps**: Restaurants near major landmarks often exploit tourists with inflated prices and poor quality.
3. **Meal timing**: European meal windows are strict (lunch ends at 14:30, restaurants close between services) -- tourists often miss them.
4. **Route inefficiency**: Backtracking to eat wastes precious sightseeing time.
5. **Reservation planning**: Some restaurants require booking days or weeks in advance.

CultureGuide solves this by generating route-aware, time-sensitive restaurant recommendations that integrate seamlessly into the user's daily itinerary.

---

## 3. User Personas & Use Cases

### Primary Persona: Independent Tourist
- Travels to Paris, Venice, or Rome for 3-7 days
- Creates a rough daily itinerary (copy-paste from travel blog, manual entry, or ChatGPT-generated plan)
- Wants to eat at authentic local restaurants, not tourist traps
- Expects recommendations to be walkable from their planned route

### Use Cases

| # | Use Case | Description |
|---|----------|-------------|
| UC-1 | Parse itinerary | User pastes free-form text (e.g., "9:00 AM - Louvre (2-3 hours), Lunch, Notre Dame") and AI structures it |
| UC-2 | View timed plan | User sees a sequential timeline with arrival times, durations, and travel times between attractions |
| UC-3 | Get meal recommendations | User navigates to restaurants tab and sees breakfast/lunch/dinner recommendations along their route |
| UC-4 | Running late | User taps "I'm Running Late" to re-rank restaurants based on current GPS location (no API cost) |
| UC-5 | Multi-city day | User has a Venice-morning + Rome-evening itinerary; meals are assigned to correct cities |
| UC-6 | Hotel-aware routing | Hotel location is extracted and used as route start point; breakfast near hotel, dinner return bonus |

---

## 4. System Architecture Overview

```
                    +------------------+
                    |  User Input      |
                    |  (Free-form text)|
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Backend Server   |
                    |  (Node.js/Express)|
                    |  - OpenAI proxy   |
                    |  - Google Places   |
                    |  - Geocoding       |
                    +--------+---------+
                             |
          +------------------+------------------+
          |                  |                  |
+---------v------+  +--------v-------+  +-------v--------+
| Itinerary      |  | Geocoding      |  | Time           |
| Parser         |  | Service        |  | Calculator     |
| (AI + regex)   |  | (4-tier)       |  | (sequential)   |
+--------+-------+  +--------+-------+  +--------+-------+
         |                   |                    |
         +-------------------+--------------------+
                             |
                    +--------v---------+
                    |  Route Path      |
                    |  Generator       |
                    |  (OSRM + fallback)|
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v------+ +----v------+ +-----v-------+
     | 3-Tier Engine | | Tourist   | | Meal Time   |
     | Manual>Cache  | | Trap      | | Resolver    |
     | >AI           | | Detector  | | (European)  |
     +--------+------+ +----+------+ +------+------+
              |              |               |
              +--------------+---------------+
                             |
                    +--------v---------+
                    |  Recommendation  |
                    |  Ranker (v7)     |
                    |  Score: 0-110    |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Restaurant UI   |
                    |  (Breakfast/     |
                    |   Lunch/Dinner)  |
                    +------------------+
```

### Technology Stack (AI & Routing)

| Layer | Technology |
|-------|-----------|
| AI (Parsing) | OpenAI GPT-3.5-turbo (via backend proxy) |
| AI (Insights) | OpenAI GPT-3.5-turbo (via backend proxy) |
| Routing | OSRM (Open Source Routing Machine) |

---

## 5. Feature 1: Itinerary Input & Parsing

### 5.1 User Interface (itinerary.tsx)

**Screen**: `/cities/[cityId]/itinerary`

**Input fields**:
- **Date selector**: Today / Tomorrow / Day After quick buttons + calendar picker
- **Itinerary text area**: Free-form multiline input (accepts any format)
- **Start time**: HH:MM format (default: 09:00)
- **Parse button**: "Parse with AI" -- triggers the parsing pipeline

**Placeholder example**:
```
9:00 AM - Louvre Museum (2-3 hours)
12:30 PM - Lunch break
2:00 PM - Walk to Notre Dame (30 min)
3:00 PM - Notre-Dame Cathedral (1 hour)
Evening - Eiffel Tower
```

### 5.2 AI Parsing Pipeline (itineraryParser.ts)

**Function**: `parseItineraryWithAI(text, cityId)`

**Step-by-step flow**:

1. **Token budget check**: Verify user hasn't exceeded 2M token limit (30-day rolling window)
2. **Backend API call**: POST to `/api/ai/parse-itinerary` with itinerary text and city name
3. **JSON extraction**: Strip markdown code fences if AI wraps response in ```json blocks
4. **Entry classification**: Each entry gets a type via `resolveEntryType()`:
   - `attraction` -- visitable places (museums, landmarks, parks)
   - `transit` -- inter-city travel (flights, trains)
   - `meal` -- food/drink entries
   - `hotel` -- accommodation
   - `skip` -- logistics, tips, descriptions
5. **Hotel extraction**: Find hotel entry, geocode it, create `hotelLocation` for routing
6. **Multi-city segment building**: Group attractions by AI-provided `cityId` field
7. **Transit time extraction**: Parse departure times from transit lines (e.g., "2:00 PM Train to Rome")
8. **Attraction filtering**: Keep only `attraction` type entries for the final list

### 5.3 Backend AI Prompt (server.js)

**Model**: GPT-3.5-turbo
**Temperature**: 0.3 (low for consistent structured output)
**Max tokens**: 2500

**System prompt instructs the AI to**:
- Classify each entry as attraction/transit/meal/hotel/skip
- Detect which city each entry belongs to (using world knowledge)
- Extract clean place names (strip descriptions, tips, directions)
- Calculate estimated durations (middle value for ranges)
- Preserve full hotel names with "Hotel:" prefix
- Support multi-city itineraries across Paris, Venice, Rome

**Output format**: JSON array of objects with `name`, `type`, `cityId`, `estimatedDuration`, `isHotel` fields.

### 5.4 Sanitization (OBS-001)

**Function**: `sanitizeAttractions(attractions)`

Removes non-sightseeing entries that shouldn't appear in the UI:
- Hotel entries (via `isHotel` flag)
- Single-letter AI shorthand: `b`, `l`, `d`, `s`
- Check-in/out, freshen up, settle in, transfer to
- Taxi/shuttle entries
- Meal entries starting with "dinner", "lunch", "breakfast"

**Important**: Does NOT filter on the word "hotel" alone because "Hotel des Invalides" is a museum.

### 5.5 Hotel Extraction (OBS-004)

**Function**: `extractHotelAndSanitize(attractions)`

Hotel serves dual purpose:
1. **ROUTING**: Hotel coordinates become the route start point (PRESERVED)
2. **UI**: Hotel entry does NOT appear as a scheduled attraction (REMOVED)

Hotel coordinates are geocoded using a search query prefixed with "Hotel" for better results.

---

## 6. Feature 2: Geocoding Pipeline

### 6.1 Four-Tier Geocoding Strategy (geocodingService.ts)

**Function**: `geocodeAttraction(name, cityId)`

| Tier | Source | Latency | Cost | Coverage |
|------|--------|---------|------|----------|
| 1 | Local landmark database | 0ms | $0 | ~90% of tourist itineraries |
| 2 | AsyncStorage cache (30-day TTL) | 0ms | $0 | Previously geocoded attractions |
| 3 | AI Geocoding (OpenAI) | ~1s | $0.0002 | *Currently disabled* |
| 4 | Google Geocoding API | ~200ms | $0.005 | Universal fallback |

**Tier 1 -- Local Landmarks**: Pre-populated databases for Paris, Rome, and Venice containing coordinates and aliases for major tourist attractions. Each landmark has:
- `name`: Canonical name
- `aliases`: Alternate names (e.g., "Louvre" matches "Louvre Museum", "Musee du Louvre")
- `coordinates`: Precise lat/lon
- `touristMagnitude`: 0-100 tourist density score

**Tier 3 status**: AI geocoding is currently disabled. The system falls through directly to Google API.

### 6.2 Hotel Geocoding

Hotels are geocoded separately with a modified search query:
```
"Hotel Marco Polo" -> "Hotel Marco Polo" (search query)
```

If no hotel is found in the current day's itinerary:
1. Check preceding days for a hotel (inherited across days)
2. Last resort: Infer from first attraction coordinates

---

## 7. Feature 3: Time Calculation & Meal Break Insertion

### 7.1 Sequential Time Calculator (timeCalculator.ts)

**Function**: `calculateSequentialTimes(attractions, startTime, userTimes, segments)`

Calculates arrival times for each attraction sequentially:

1. Start from user-provided start time (default 09:00)
2. For each attraction:
   - Set arrival time = current cumulative time
   - Add attraction duration
   - Calculate travel time to next attraction:
     - Walking (< 15 min): distance / 5 km/h
     - Transit (> 15 min walk): 20 min base + 5 min/km

**User time override (OBS-020)**: If the user provides specific times in their text (e.g., "2:00 PM - Notre Dame"), those are extracted via `extractTimesFromText()` and override sequential calculation.

**Segment boundary handling**: At city transitions, the calculator uses the segment's `departureTime` (if available) instead of calculating inter-city travel time.

### 7.2 Meal Break Insertion (mealBreakInserter.ts)

**Function**: `insertMealBreaks(attractions)`

Inserts placeholder meal breaks at appropriate time slots:

| Meal | Window | Duration |
|------|--------|----------|
| Breakfast | 07:00 -- 10:00 | 45 min |
| Lunch | 12:00 -- 14:30 | 60 min |
| Dinner | 19:00 -- 22:00 | 75 min |

**Insertion rules**:
- Only inserts if the itinerary time range overlaps the meal window
- Skips if user already has a meal-related attraction in that window
- Breakfast is placed just before the first attraction
- Other meals are placed after the last attraction that ends before the window

---

## 8. Feature 4: Route Path Generation

### 8.1 Route Path Generator (routePathGenerator.ts)

**Function**: `generateRoutePath(attractions, startLocation?, hotelLocation?)`

Generates a walking route through all attractions for restaurant corridor search.

**Priority for route start**:
1. GPS location (if provided via "I'm Running Late")
2. Hotel location (if extracted from itinerary)
3. First attraction

**Two routing modes**:

| Mode | Source | Quality | Cache |
|------|--------|---------|-------|
| OSRM | Open Source Routing Machine API | Realistic walking routes with actual streets | 30-day TTL |
| Fallback | Straight-line interpolation | Transit points every 300m between attractions | None |

**OSRM integration**:
- Uses `http://router.project-osrm.org/route/v1/foot/` endpoint
- 5-second timeout
- Returns GeoJSON coordinates converted to `RoutePoint[]`
- Cached per city + attraction coordinates hash

### 8.2 Routing Profile Detection (routingProfileDetector.ts)

**Function**: `detectRoutingProfile(cityId, attractions)`

Auto-detects corridor width based on city terrain:

| City | Corridor | Walk Multiplier | Reason |
|------|----------|----------------|--------|
| Paris | 400m | 1.0x | Flat grid city |
| Rome | 250m | 1.2x | Moderate hills |
| Venice | 150m | 1.5x | Canals, bridges, forced detours |

**Detection method**: Calculates detour ratio = OSRM distance / straight-line distance:
- \> 1.8 = Complex terrain (150m corridor, 1.5x walk)
- \> 1.4 = Moderate terrain (250m corridor, 1.2x walk)
- < 1.4 = Grid city (400m corridor, 1.0x walk)

Known cities (Paris, Rome, Venice) use hardcoded overrides for consistency.

---

## 9. Feature 5: Restaurant Discovery & Recommendation

### 9.1 Three-Tier Recommendation Engine (hybridRecommendationEngine.ts)

**Function**: `getRestaurantRecommendations(cityId, routePath, attractions, mealType)`

```
Tier 1: Manual Curation  -->  Tier 2: Cache  -->  Tier 3: AI Generation
(instant, $0, best)          (instant, $0)       (30-60s, ~$0.16/meal)
```

#### Tier 1: Manual Curation
- Pre-curated restaurant data for Paris (43), Venice (15), Rome (40)
- Each restaurant has coordinates, ratings, cuisine types, famous dishes, hours, reservation info
- Requires >= 10 restaurants and good quality scores to use

#### Tier 2: Cache
- Keyed by: `@culture_guide:ai_cache:${cityId}:${routeHash}:${mealType}:v${SCORING_VERSION}`
- TTL: 7 days (valid data) or 24 hours (failed validation)
- Quality check: cache is skipped if recommendations don't meet quality thresholds

#### Tier 3: AI Generation
**Cost**: ~$0.16 per meal

Pipeline:
1. **Restaurant discovery**: Single Google Places bounding box search along route corridor ($0.02)
2. **Top restaurant selection**: Sort by rating, take top 20 (configurable via `MAX_RESTAURANTS_PER_SEARCH`)
3. **Review fetching**: Get Google Places reviews for each restaurant ($0.017/restaurant)
4. **AI insight extraction**: Batch process with GPT-3.5-turbo ($0.0002/restaurant)
5. **Ranking**: Score and rank via `recommendationRanker`
6. **Validation**: Structural + geographic checks via `aiDataValidator`
7. **Caching**: Store results for 7 days (or 24h if validation fails)

### 9.2 All-Meals Orchestrator

**Function**: `getAllMealsRecommendations(cityId, routePath, attractions, segments?, segmentRoutePaths?)`

Generates breakfast, lunch, and dinner in a single pass with:
- **Cross-meal deduplication**: Same restaurant won't appear in multiple meals
- **Dynamic counts**: Breakfast gets 3 results, lunch/dinner get 5
- **Two-pass strategy**:
  1. First pass: Try cache/manual for all meals
  2. Second pass: Generate AI for any empty meals
- **Multi-city awareness**: Each meal uses the correct city's route and attractions

### 9.3 Restaurant Search Along Route (restaurantApiService.ts)

**Function**: `searchRestaurantsAlongRoute(routePath, cityId, corridorMeters)`

1. Calculate bounding box around entire route with buffer
2. Single Google Places Nearby Search from center of bounding box
3. Filter results by perpendicular distance to route path (corridor filter)

This reduces API calls from 10-20 (per-segment) to 1 (single bounding box).

---

## 10. Feature 6: Scoring & Ranking System

### 10.1 Composite Score (recommendationRanker.ts)

**SCORING_VERSION**: 7
**Total max score**: 110 points

| Category | Max Points | Weight | Description |
|----------|-----------|--------|-------------|
| Quality | 25 | 23% | Rating (0-12.5) + Review count logarithmic scale (0-12.5) |
| Authenticity | 20 | 18% | (100 - touristTrapScore) / 5 |
| Convenience | 43 | 39% | Distance from route + route progression + hotel bonus |
| Timing | 15 | 14% | Open at meal time (10) + meal type match (5) |
| Curation | 5 | 5% | Manually curated restaurant bonus |
| Accessibility | 2 | 2% | No reservation required bonus |

### 10.2 Convenience Score Breakdown (0-43 pts)

**Distance component (0-43 pts)**:
| Distance | Score |
|----------|-------|
| < 100m | 43 |
| 100-200m | 38 |
| 200-400m | 32 |
| 400-600m | 21 |
| 600-800m | 10 |
| > 800m | **EXCLUDED** (hard cutoff) |

**Route progression component (-15 to +5 pts)**:
- **Breakfast (v6)**: Direction-aware hotel zone
  - <= 600m from hotel AND on-the-way to first attraction: +5
  - <= 1000m from hotel AND on-the-way: +3
  - Too far or wrong direction: -15
- **Lunch**: 33-66% route progression: +5; 20-80%: +3; outside: -15
- **Dinner (v7)**: 360-degree hotel proximity (<500m: +5) OR 66%+ route progression: +5

**Hotel proximity bonus (0 or +5)**:
- Breakfast/dinner within 500m of hotel: +5

### 10.3 Meal Service Filter (v5)

**Function**: `getServableMeals(restaurant)`

Filters restaurants by type suitability:

| Restaurant Type | Servable Meals |
|----------------|---------------|
| Bakery / Patisserie | Breakfast, Lunch |
| Gelateria | Snack only |
| Bacaro | Breakfast, Lunch, Snack |
| Osteria / Trattoria | Lunch, Dinner |
| Cafe | Breakfast, Lunch, Snack |
| Restaurant | Lunch, Dinner (unless opens early) |

### 10.4 Diversity Filter

Max 2 restaurants per cuisine type in final results to ensure variety.

### 10.5 Quality Evaluation

**Function**: `evaluateRecommendationQuality(recommendations)`

Quality criteria:
- At least 2 recommendations
- Average context score >= 50
- All recommendations within 800m (convenience > 0)
- At least 60% have score >= 60

---

## 11. Feature 7: Tourist Trap Detection

### 11.1 Scoring Formula (touristTrapDetector.ts)

**Score**: 0-100 (higher = more likely tourist trap)
**Threshold**: > 70 = filtered out

```
Score = Landmark Proximity + Price/Rating Penalty - Quality Bonus
```

**Landmark Proximity (0-40 pts)**:
| Distance | Score |
|----------|-------|
| < 50m | 40 |
| 50-100m | 30 |
| 100-200m | 20 |
| 200-500m | 10 |
| > 500m | 0 |

**Price/Rating Penalty (0-35 pts)**: High price + poor rating near landmarks = red flag.

**Quality Bonus (up to -40 pts)**: High-rated restaurants with many reviews get benefit of the doubt.

### 11.2 Landmark Databases

Pre-populated for Paris, Rome, Venice with:
- Name and aliases
- Precise coordinates
- Tourist magnitude score (0-100)

---

## 12. Feature 8: AI Review Analysis & Insights

### 12.1 Review Analyzer (aiReviewAnalyzer.ts)

**Function**: `extractInsightsFromReviews(restaurantName, reviews, editorialSummary)`

**Cost**: ~$0.0002 per restaurant

Extracts from Google Places reviews:
1. **Signature dish**: The one dish most frequently mentioned
2. **Local tip**: Practical advice (reservation strategy, timing, ordering)
3. **Tourist trap score**: 0-100 with reasoning

**Batch processing**: `batchExtractInsights()` processes 5 restaurants in parallel per batch with 200ms inter-batch delay.

---

## 13. Feature 9: Multi-City Day Support

### 13.1 Segment Detection

The AI parser assigns `cityId` to each entry using world knowledge. The `buildSegmentsFromCityIds()` function groups consecutive attractions by city.

**Example**: Venice morning + Rome evening:
```
Segment 1: venice (Dorsoduro, Accademia Bridge)
Segment 2: rome (Trevi Fountain, Pantheon)
```

### 13.2 Meal-to-Segment Assignment (mealBreakInserter.ts)

**Function**: `assignMealsToSegments(segments)`

| Meal | Assignment Rule |
|------|----------------|
| Breakfast | Always first segment (morning) |
| Dinner | Always last segment (evening) |
| Lunch | Depends on transition time: if first segment ends before 12:00 PM, lunch goes to second segment |

### 13.3 Per-Segment Route Generation

**Function**: `generateSegmentedRoutePaths(segments)`

Each city segment gets its own OSRM route. The restaurant engine uses the correct city's route for each meal.

### 13.4 Transit Time Extraction

**Function**: `extractTransitTime(text)`

Parses departure times from transit lines:
- "2:00 PM Train to Rome" -> `departureTime: "14:00"`
- Used to properly sequence the time calculator across segment boundaries

---

## 14. Feature 10: Caching Strategy

### 14.1 Cache Keys & TTLs

| Data | Key Pattern | TTL |
|------|------------|-----|
| AI recommendations | `@culture_guide:ai_cache:${cityId}:${routeHash}:${mealType}:v${SCORING_VERSION}` | 7 days (valid) / 24h (low quality) |
| OSRM routes | `@culture_guide:osrm_route:${cityId}:${hash}` | 30 days |
| Geocoding | `@culture_guide:geocoding_cache` | 30 days |
| Routing profiles | `@culture_guide:routing_profile:${cityId}` | Permanent |
| Itineraries | `@culture_guide:itinerary:${id}` | Permanent |
| Dietary preferences | `@culture_guide:dietary_preferences` | Permanent |
| Token usage | `@culture_guide:token_usage` | 30-day rolling window |

### 14.2 Stale Cache Fallback

When AI generation fails (network error, API timeout):
1. Retry once after 2-second delay
2. If retry fails, search for ANY cached data for this city+meal (even expired)
3. Return stale cache with warning message
4. If no cache at all, return empty result with offline error

### 14.3 Cache Invalidation

- Scoring version changes (`SCORING_VERSION` embedded in cache key)
- User can manually clear cache via "Clear Cache & Regenerate" button
- Expired caches cleaned up on restaurant screen mount

---

## 15. Backend API Proxy Server

### 15.1 Server Configuration (backend/server.js)

**Framework**: Express.js
**Port**: 3000 (configurable)
**Auth**: API key via `X-API-Key` header

### 15.2 Endpoints

| Method | Path | Purpose | External API |
|--------|------|---------|-------------|
| POST | `/api/ai/parse-itinerary` | Parse itinerary text | OpenAI GPT-3.5-turbo |
| POST | `/api/ai/analyze-review` | Analyze restaurant reviews | OpenAI GPT-3.5-turbo |
| POST | `/api/places/search` | Search nearby restaurants | Google Places Nearby Search |
| GET | `/api/places/details/:placeId` | Get restaurant details + reviews | Google Places Details |
| GET | `/api/places/photo/:photoReference` | Proxy restaurant photos | Google Places Photo |
| POST | `/api/geocoding/lookup` | Convert address to coordinates | Google Geocoding |
| GET | `/health` | Health check (no auth) | None |

### 15.3 Security

- API keys (OpenAI, Google) stored server-side only (never in client bundle)
- Input validation: text length limits, coordinate validation, place ID format check
- CORS enabled for all origins (development mode)
- Rate limiting deferred to API provider limits

---

## 16. Data Model & Type Definitions

### 16.1 Core Types (types/index.ts)

```typescript
interface DailyItinerary {
  id: string;              // "${cityId}-${date}"
  date: string;            // "2025-04-15"
  cityId: string;          // Primary city
  attractions: ItineraryAttraction[];
  segments?: ItinerarySegment[];  // Multi-city only
  hotelLocation?: {
    name: string;
    coordinates: { latitude: number; longitude: number };
    source: 'user_provided' | 'inferred_from_first_attraction';
  };
  createdAt: number;
  updatedAt: number;
}

interface ItineraryAttraction {
  id: string;
  name: string;
  estimatedTime: string;        // "10:00 AM"
  estimatedDuration: number;    // minutes
  isPlaceholder: boolean;       // meal break entries
  isHotel?: boolean;
  cityId?: string;              // AI-detected city
  coordinates?: { latitude: number; longitude: number };
  notes?: string;
}

interface ItinerarySegment {
  cityId: string;
  attractions: ItineraryAttraction[];
  departureTime?: string;       // HH:MM 24h
  hotelLocation?: { ... };
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cityId: string;
  coordinates: { latitude: number; longitude: number };
  rating: number;               // 0-5
  reviewCount: number;
  priceLevel: number;           // 1-4
  cuisineTypes: string[];
  isOpenNow: boolean;
  famousFor: string[];
  safeDishes: { vegetarian: string[]; vegan: string[]; ... };
  weeklyHours?: { [day]: { open: string; close: string }[] | 'closed' };
  reservationRequired?: 'none' | 'recommended' | 'essential';
  reservationLeadDays?: number;
  type?: 'restaurant' | 'bakery' | 'patisserie' | 'gelateria' | 'bacaro' | 'trattoria' | 'osteria' | 'pizzeria';
}

interface EnhancedRestaurant extends Restaurant {
  insights?: RestaurantInsights;
  contextScore: number;         // 0-110
  scoreBreakdown?: ScoreBreakdown;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  routeContext: {
    position: 'before' | 'after' | 'between';
    nearbyAttraction: string;
    estimatedTime?: string;
    walkTime: number;           // minutes
    routeFit: string;           // "5 min walk toward next stop"
  };
  timeWarning?: string;
  urgency?: 'upcoming' | 'active' | 'closing_soon' | 'closed';
  reservationUrgency?: { ... };
  validationWarning?: string;
  validationScore?: number;
}

interface ScoreBreakdown {
  quality: number;              // 0-25
  authenticity: number;         // 0-20
  convenience: number;          // 0-43
  timing: number;               // 0-15
  curation: number;             // 0-5
  total: number;                // 0-110
  distanceScore: number;        // 0-43
  progressionScore: number;     // -15 to +5
  hotelBonus: number;           // 0 or +5
}
```

---

## 17. Supported Cities & Manual Data

### 17.1 Restaurant Counts

| City | Manual Restaurants | Landmark Count | Types Included |
|------|-------------------|---------------|----------------|
| Paris | 43 | Full database | Restaurants, bistros, boulangeries, patisseries |
| Rome | 40 | Full database | Trattorias, osterias, pizzerias, restaurants |
| Venice | 15 | Full database | Bacari, trattorias, osterias, gelaterias |

### 17.2 Famous Dishes Database (dishesService.ts)

Maps cuisine types to signature dishes:
- 25+ cuisine categories (French, Italian, Japanese, etc.)
- 2-4 dishes per cuisine type
- Used as fallback when AI insights are unavailable

### 17.3 European Meal Time Windows (mealTimeResolver.ts)

| Meal | Window | Urgency States |
|------|--------|---------------|
| Breakfast | 07:00 -- 10:30 | upcoming (60min before), active, closing_soon (30min left), closed |
| Lunch | 12:00 -- 14:30 | Same urgency states |
| Dinner | 19:00 -- 22:00 | Same urgency states |

---

## 18. Cost Model & Token Budget

### 18.1 Per-Meal AI Generation Cost

| Step | Cost |
|------|------|
| Google Places bounding box search | $0.02 |
| Google Places reviews (per restaurant) | $0.017 |
| AI insight extraction (per restaurant) | $0.0002 |
| **Total per meal (20 restaurants)** | **~$0.16** |
| **Total per full day (3 meals)** | **~$0.48** |

### 18.2 Token Budget

| Limit | Value |
|-------|-------|
| Per-trip limit | 2,000,000 tokens |
| Warning threshold | 1,500,000 tokens (75%) |
| Auto-reset | 30 days after last reset |
| Cost estimate | $0.15/1M input + $0.60/1M output |

### 18.3 Cost Savings

| Mechanism | Savings |
|-----------|---------|
| Manual curation (Paris/Rome) | 100% (no API calls) |
| Cache hits | 100% (7-day TTL) |
| Bounding box search (vs per-segment) | 90% reduction in Google API calls |
| Local landmark geocoding | ~90% of attractions resolved at $0 |

---

## 19. Non-Functional Requirements

### 19.1 Performance

| Metric | Target |
|--------|--------|
| Itinerary parsing | < 10 seconds |
| Manual recommendation load | < 500ms |
| Cached recommendation load | < 1 second |
| AI recommendation generation | 30-60 seconds |
| Re-ranking (Running Late) | < 2 seconds (no API calls) |
| OSRM route fetch | < 5 seconds (with 5s timeout) |

### 19.2 Reliability

- Stale cache fallback when AI generation fails
- OSRM fallback to straight-line interpolation
- Google API fallback when AI geocoding is uncertain
- Empty result (no crash) when all sources fail
- Single retry with 2-second delay for AI generation

### 19.3 Data Quality

- AI validation scores restaurants 0-100 before caching
- Structural checks: required fields, valid coordinates, rating range
- Geographic checks: Venice restaurants must be within bounding box
- Logical checks: high tourist trap scores, perfect ratings with few reviews, zero walk times
- Low-quality data cached for only 24 hours (vs 7 days for valid data)

---

## 20. Known Constraints & Limitations

1. **Supported cities**: Only Paris, Venice, and Rome have manual curation and landmark databases. Other cities fall through to AI generation only.
2. **AI geocoding disabled**: Tier 3 geocoding (OpenAI) is currently disabled; all non-cached, non-landmark geocoding goes to Google API.
3. **Single-day parsing**: Each parse call handles one day. Multi-day trips require separate parses.
4. **OSRM dependency**: OSRM is a public service with no SLA. Route generation falls back to straight-line interpolation when unavailable.
5. **Token limit**: 2M tokens per 30-day window. Heavy users could hit this with many itinerary re-parses.
6. **Web platform**: CORS limitations may require backend proxy for all API calls on web.
7. **Offline mode**: No offline support for AI generation. Cached data and manual curation work offline.
8. **Restaurant hours**: Weekly hours data may be stale from Google Places API; open/closed status is re-checked at scoring time.

---

## 21. Future Enhancements

1. **AI Geocoding re-enablement**: Implement backend endpoint for GPT-based geocoding with confidence scoring
2. **Additional cities**: Expand landmark databases and manual curation to Florence, Barcelona, Amsterdam, London
3. **Real-time re-routing**: Continuous GPS tracking with live restaurant re-ranking
4. **Reservation integration**: Direct booking links via TheFork, OpenTable integration
5. **User feedback loop**: Allow users to rate recommendations, improving future scoring
6. **Multi-day planning**: Parse and optimize multi-day trips with restaurant variety across days
7. **Dietary preference integration**: Filter and re-rank based on user's dietary restrictions (data structure exists but not fully integrated into scoring)
8. **Photo AI analysis**: Use vision models to analyze restaurant photos for quality indicators
9. **Group dining**: Support for group size in recommendations (large groups need reservable restaurants)
10. **Budget mode**: Let users set daily food budget and rank by value-for-money

---

## 22. Development Constraints & Guidelines

### 22.1 Source of Truth

| Constant | Value | Source File | Rule |
|----------|-------|-------------|------|
| SCORING_VERSION | 7 | `utils/recommendationRanker.ts` | **Must always be imported**, never hardcoded in any file |
| Total Max Score | 110 points | `utils/recommendationRanker.ts` | **Must never be inflated** beyond 110 |

### 22.2 Absolute Rules ("Never Do" List)

These rules are **non-negotiable** and apply to every code change:

| # | Rule | Rationale |
|---|------|-----------|
| 1 | Never mark a task done with failing tests | Tests are the safety net; broken tests = broken product |
| 2 | Never delete a test | If behavior changed, update the test with a comment explaining why |
| 3 | Never hardcode SCORING_VERSION | Always `import { SCORING_VERSION } from 'utils/recommendationRanker'` |
| 4 | Never inflate total max score beyond 110 points | Score categories are calibrated; changing the ceiling breaks ranking |
| 5 | Never remove the 22-minute walk bug regression test | Protects against a specific historical bug in walking time calculation |
| 6 | Never call real APIs in tests | Google Places, OpenAI, and OSRM must be mocked in all test files |
| 7 | Never use `new Date()` in tests | Use fixed time values for deterministic test results |
| 8 | Never make code changes without updating ARCHITECTURE.md | Architecture documentation drift causes unmaintainable codebase |

### 22.3 TDD Workflow (Mandatory)

All development follows strict Test-Driven Development:

| Scenario | Required Workflow |
|----------|------------------|
| New feature | Write failing tests **first**, then implement until tests pass |
| Bug fix | Write a test that **reproduces the bug first**, then fix it |
| Refactor | Ensure all existing tests pass **before and after** the refactor |
| Task completion | Task is **NOT complete** until `npx jest` shows all green |

### 22.4 Pre-Change Checklist

Before making **any** code change:

1. Run `npx jest` and verify all tests pass
2. If any tests fail, fix them **before** doing anything else
3. Read `CLAUDE_CONTEXT.md` for current context
4. Never assume what a file contains — read it first

### 22.5 Post-Change Checklist

After **every** code change:

1. Run `npx jest` — all tests must pass
2. If `SCORING_VERSION` changed: update it in `CLAUDE_CONTEXT.md`
3. Update `ARCHITECTURE.md` if any of these apply:
   - New feature, component, service, or utility created
   - New type definition added to `types/index.ts`
   - Data structure changed (new data files, modified schemas)
   - API endpoint added or changed (`backend/server.js`)
   - System behavior changed (scoring, caching, routing)
   - New data flow introduced
   - Project structure modified (new directories)
4. Update "Last Session" section in `CLAUDE_CONTEXT.md`

### 22.6 ARCHITECTURE.md Update Checklists

#### New Component Added
- [ ] Add component to "Components" section
- [ ] Document purpose, props/parameters, features
- [ ] Categorize correctly (Restaurant / Museum / General UI)
- [ ] Update project structure diagram if in new directory

#### New Service/Utility Added
- [ ] Add to "Core Systems" section with numbered heading
- [ ] Document file path, purpose, algorithm/logic
- [ ] Show code examples if complex
- [ ] Document integration points with other systems

#### New Type Definition Added
- [ ] Add interface to "Type Definitions" section
- [ ] Include all fields with comments
- [ ] Group by category (Restaurant / Museum / General)

#### Behavior/Algorithm Changed
- [ ] Update algorithm documentation with new logic
- [ ] Update SCORING_VERSION references if scoring changed
- [ ] Update "Data Flow" diagrams if flow changed
- [ ] Add version history entry explaining change

#### Backend/API Changed
- [ ] Update "Backend API Proxy Server" section
- [ ] Document new endpoints with request/response examples
- [ ] Update "External APIs" if new API integrated

### 22.7 Test Suite Reference

| Test File | Covers |
|-----------|--------|
| `__tests__/scoring/recommendationRanker.test.ts` | Scoring weights, meal zones, hotel bonus |
| `__tests__/utils/routeCorridorSearch.test.ts` | Bounding box, proximity filter |
| `__tests__/utils/mealTimeResolver.test.ts` | European meal windows, urgency states |
| `__tests__/utils/hoursChecker.test.ts` | Restaurant open/closed from weeklyHours |
| `__tests__/utils/mealTimeUtils.test.ts` | Meal time labels and default times |
| `__tests__/utils/scoreExplanations.test.ts` | Human-readable score explanations |
| `__tests__/utils/timeCalculator.test.ts` | Time calculation utilities |
| `__tests__/utils/routeOptimizer.test.ts` | Museum tour route optimization |
| `__tests__/utils/touristTrapDetectorExtra.test.ts` | Tourist trap scoring edge cases |
| `__tests__/data/landmarks.test.ts` | Landmark data validation |
| `__tests__/data/parisLandmarks.test.ts` | Paris landmark data |
| `__tests__/data/romeRestaurants.test.ts` | Rome restaurant data validation |
| `__tests__/data/veniceRestaurants.test.ts` | Venice restaurant data validation |

### 22.8 Test Pattern (Required Format)

All tests must follow the Arrange/Act/Assert pattern with shared fixtures:

```typescript
test('WHAT it tests — WHY it exists', () => {
  // Arrange
  const input = FIXTURE_FROM_FIXTURES_FILE;  // Import from __tests__/fixtures
  // Act
  const result = functionBeingTested(input);
  // Assert
  expect(result).toBe(expectedValue);
});
```

**Key rules**:
- Fixtures must be imported from `__tests__/fixtures/` — never create inline test data
- Test descriptions must explain WHAT and WHY
- No real API calls — all external services must be mocked

---

## 23. Error Logging & Monitoring

### 23.1 Centralized Error Logger (errorLogger.ts)

A singleton service that captures errors, tracks user actions, and stores diagnostic data locally.

**Storage limits**:
- Last 50 errors persisted in AsyncStorage (`@culture_guide:error_logs`)
- Last 100 breadcrumbs persisted (`@culture_guide:breadcrumbs`)

### 23.2 Severity Levels

| Level | Usage |
|-------|-------|
| `fatal` | App crashes, unrecoverable failures |
| `error` | API failures, parsing errors, tier 3 failures |
| `warning` | Stale cache fallbacks, retry attempts |
| `info` | Normal operations logged for debugging |
| `debug` | Verbose diagnostic output |

### 23.3 Tracking Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `captureError(error, context?, severity?)` | Log an error with optional context | AI generation failure with cityId + mealType |
| `addBreadcrumb(category, message, data?, level?)` | Track user actions for debugging | "User tapped Parse with AI" |
| `trackAICost(cost, reason, details?)` | Monitor OpenAI spending | `$0.16: lunch generation for paris` |
| `trackPerformance(operation, durationMs, success, details?)` | Track operation timing | `getRestaurantRecommendations: 2450ms (success)` |
| `trackAction(action, details?)` | Log user interactions | `switched_to_nearby_mode` |

### 23.4 Error Statistics API

`getErrorStats()` returns:
- Total error count
- Errors grouped by severity
- Error rate per hour (last 24 hours)
- Top 5 most common error messages

### 23.5 Sentry Integration

Hooks for Sentry are included but **currently disabled** (commented out). When enabled:
- `captureError()` forwards to `Sentry.captureException()`
- `addBreadcrumb()` forwards to `Sentry.addBreadcrumb()`
- Severity levels map directly to Sentry levels

### 23.6 Debug Export

`exportErrors()` returns all stored errors as formatted JSON for manual debugging or sharing.

---

## 24. Network Resilience

### 24.1 Dual Implementation

The system has two network status implementations for different contexts:

| Component | File | Usage Context |
|-----------|------|---------------|
| `checkNetworkStatus()` | `services/networkService.ts` | Services & utilities (non-React) |
| `useNetworkStatus()` | `hooks/useNetworkStatus.ts` | React components (hook) |

### 24.2 Platform Detection

| Platform | Method |
|----------|--------|
| Web | `navigator.onLine` + `online`/`offline` event listeners |
| Native (iOS/Android) | `expo-network` → `getNetworkStateAsync()` (dynamic import) |

### 24.3 Polling & Fallback Behavior

- **Hook** polls every **10 seconds** via `setInterval`
- **Service** performs one-shot async check
- Both return `{ isConnected: boolean, isInternetReachable: boolean }`
- **Critical design decision**: On any error, both fall back to `{ true, true }` to **avoid false offline states** that would block users unnecessarily

### 24.4 Impact on Recommendation Pipeline

| Network State | System Behavior |
|---------------|----------------|
| Online | Full 3-tier engine operates normally |
| Offline | Tier 1 (manual) works; Tier 2 (cache) works; Tier 3 (AI) fails → triggers retry → stale cache fallback |
| Intermittent | Single retry with 2s delay absorbs transient failures |

---

## 25. Location Services

### 25.1 GPS & Permission Handling (locationService.ts)

**Function**: `getCurrentLocation()`

| Step | Detail |
|------|--------|
| 1. Permission check | `requestLocationPermission()` — prompts user on first use |
| 2. GPS fetch | 10-second timeout, balanced accuracy |
| 3. Cache result | Stored in AsyncStorage for 5-minute reuse |
| 4. Fallback | If GPS fails, return cached location (if fresh) |

### 25.2 Platform Implementations

| Platform | API | Permission Model |
|----------|-----|-----------------|
| Web | `navigator.geolocation.getCurrentPosition()` | Browser permission prompt |
| Native | `expo-location` → `getCurrentPositionAsync()` | `requestForegroundPermissionsAsync()` |

### 25.3 Location Caching

| Parameter | Value | Source |
|-----------|-------|--------|
| Cache key | `@culture_guide:user_location` | AsyncStorage |
| Cache TTL | 5 minutes | `API_CONFIG.LOCATION_CACHE_MINUTES` |
| Staleness threshold | 500 meters | `API_CONFIG.LOCATION_STALENESS_METERS` |

**`isLocationStale(timestamp)`**: Returns true if cached location is older than 5 minutes.

**`hasUserMoved(oldLocation, newLocation)`**: Returns true if user moved > 500m (triggers cache invalidation for restaurant results).

### 25.4 Distance Utilities

| Function | Purpose | Formula |
|----------|---------|---------|
| `calculateDistance(lat1, lon1, lat2, lon2)` | Distance in meters between two points | Haversine formula |
| `formatDistance(meters)` | Human-readable display | `< 1000m` → "350 m", `>= 1000m` → "0.8 km" |

### 25.5 Usage in Restaurant Flow

- **"Near You Now" mode**: Centers search on GPS location within 5km radius
- **"I'm Running Late" re-ranking**: Uses GPS as new route start point for zero-cost re-ranking
- **Restaurant cards**: Walk time calculated from user's current position

---

## 26. Retry & Fallback Recovery

### 26.1 Tier 3 AI Generation Recovery Flow

```
AI Generation (Attempt 1)
    |
    ├── SUCCESS → Score, validate, cache, return
    |
    └── FAILURE → Wait 2 seconds
                    |
                    AI Generation (Attempt 2 — retry)
                        |
                        ├── SUCCESS → Score, validate, cache, return
                        |
                        └── FAILURE → Log error via errorLogger
                                        |
                                        Search stale cache:
                                        storageService.findAnyCacheForMeal(cityId, mealType)
                                            |
                                            ├── FOUND → Return with source: 'stale_cache'
                                            |           + staleCacheWarning message
                                            |
                                            └── NOT FOUND → Return empty array
                                                            + offlineError message
```

### 26.2 Stale Cache Fallback Details

**`findAnyCacheForMeal(cityId, mealType)`** searches for ANY cached recommendations matching the city and meal type, regardless of:
- Cache expiration (TTL ignored)
- Scoring version (old `v5` or `v6` cache keys still match)
- Route hash (different itinerary routes still match)

This is the **last resort** before returning empty results.

### 26.3 Source Priority in Response

The `source` field in recommendation results indicates which tier served the data:

| Source | Meaning | Cost |
|--------|---------|------|
| `manual` | Tier 1: Pre-curated restaurant data | $0 |
| `cache` | Tier 2: Valid cached AI results (< 7 days) | $0 |
| `ai` | Tier 3: Fresh AI generation | ~$0.16/meal |
| `stale_cache` | Recovery: Expired/old-version cache | $0 |

### 26.4 Other Fallback Patterns

| Component | Primary | Fallback |
|-----------|---------|----------|
| Route generation | OSRM walking route | Straight-line interpolation (300m intervals) |
| Geocoding | Local landmarks DB | AsyncStorage cache → Google Geocoding API |
| Location | Live GPS | Cached location (5-min TTL) |
| Network detection | Platform API | Assume online (`{ true, true }`) |

---

## 27. Dual-Mode Restaurant Discovery

### 27.1 Overview

The restaurant screen (`app/cities/[cityId]/restaurants/index.tsx`) operates in **two distinct modes**, toggled via a tab bar:

| Mode | Tab Label | Data Source | Cost |
|------|-----------|-------------|------|
| Itinerary mode | "Today's Route" | 3-tier engine (manual → cache → AI) along parsed itinerary route | $0 – $0.48/day |
| Nearby mode | "Near You Now" | Google Places API search centered on GPS location | ~$0.02/search |

### 27.2 Itinerary Mode ("Today's Route")

**Default mode** when the user has a parsed itinerary.

- Loads saved itinerary for selected date
- Generates OSRM walking route through attractions
- Calls `getAllMealsRecommendations()` → returns breakfast, lunch, dinner sections
- Restaurants ranked by route progression (WHERE you'll be at WHAT time)
- Supports "I'm Running Late" GPS re-ranking ($0 cost)
- Cross-meal deduplication across breakfast/lunch/dinner

### 27.3 Nearby Mode ("Near You Now")

**Fallback mode** when no itinerary exists, or for spontaneous discovery.

- Requests GPS location permission
- Searches Google Places within **5km radius** of current position
- Filters by: minimum rating (4.2), minimum reviews (100)
- Returns up to 20 restaurants sorted by relevance
- No route awareness, no meal-time segmentation
- Loads lazily (only when tab is first tapped)

### 27.4 Tab Switching Behavior

- Switching to "Near You Now" triggers `loadNearbyRestaurants()` only on first switch (results cached in component state)
- "Clear Cache & Regenerate" respects current mode: clears AI cache in itinerary mode, reloads GPS results in nearby mode
- Error states and loading spinners are independent per mode

---

## Appendix: End-to-End Data Flow

```
User Input: "9:00 AM Louvre (2 hrs), Lunch, Notre Dame (1 hr), Eiffel Tower"
    |
    v
[AI Parse] -> [{"name":"Louvre","type":"attraction","duration":120},
               {"name":"Lunch","type":"meal","duration":45},
               {"name":"Notre Dame","type":"attraction","duration":60},
               {"name":"Eiffel Tower","type":"attraction","duration":90}]
    |
    v
[Filter] -> Remove meal entries -> [Louvre, Notre Dame, Eiffel Tower]
    |
    v
[Geocode] -> Tier 1 landmark match:
             Louvre: (48.8606, 2.3376)
             Notre Dame: (48.8530, 2.3499)
             Eiffel Tower: (48.8584, 2.2945)
    |
    v
[Time Calc] -> Start 09:00
               09:00 Louvre (120 min) -> depart 11:00
               11:00 + 25 min walk (2.1 km) -> arrive 11:25
               11:25 Notre Dame (60 min) -> depart 12:25
               12:25 + 35 min transit (4.3 km) -> arrive 13:00
               13:00 Eiffel Tower (90 min) -> depart 14:30
    |
    v
[Meal Breaks] -> Insert "Lunch Break" at 12:00 (between Notre Dame and Eiffel Tower)
                 Insert "Dinner Break" at 19:00 (after Eiffel Tower)
    |
    v
[Route Gen] -> OSRM walking route through all 3 attractions
               ~150 route points along actual streets
    |
    v
[3-Tier Engine]
    |-- Tier 1: Check Paris manual data (43 restaurants) -> FOUND
    |-- Rank with v7 scorer:
    |     Breakfast: 3 restaurants near hotel (start of route)
    |     Lunch: 5 restaurants at 33-66% of route (near Notre Dame)
    |     Dinner: 5 restaurants at 66-100% of route (near Eiffel Tower / hotel return)
    |-- Cross-meal dedup: Remove duplicates across meals
    |
    v
[Restaurant UI]
    Breakfast: Cafe de Flore (82 pts), Du Pain et des Idees (78 pts), ...
    Lunch: Le Comptoir (91 pts), Chez Janou (85 pts), ...
    Dinner: Le Bouillon Chartier (88 pts), Le Petit Cler (82 pts), ...
```
