# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CultureGuide — transforms free-form tourist itineraries into structured daily plans with route-aware restaurant recommendations for European cities (Paris, Venice, Rome). Two-tier architecture: TypeScript services (compiled to `dist/`) + Express backend proxy (Node.js).

## Commands

```bash
# Tests (581+ tests across node and jsdom environments)
npx jest                          # Run all tests
npx jest --testPathPattern=ranker # Run tests matching pattern
npx jest __tests__/utils/recommendationRanker.test.ts  # Run single test file

# TypeScript
npx tsc --noEmit                  # Type-check without emitting
npm run build                     # Compile TS + resolve path aliases (tsc && tsc-alias)

# Backend server (from backend/ directory)
cd backend && npm start           # Start Express server on port 3000
cd backend && npm run dev         # Start with nodemon (auto-restart)

# Backend requires .env with OPENAI_API_KEY and GOOGLE_PLACES_API_KEY
```

## Architecture

### Two-Tier Runtime

1. **TypeScript services** (`services/`, `utils/`, `data/`) — compiled to `dist/` via `tsc && tsc-alias`. Path aliases (`utils/*`, `services/*`, etc.) are resolved at compile time by `tsc-alias` and at runtime in `backend/server.js` via a `Module._resolveFilename` hook.

2. **Express backend** (`backend/server.js`) — single-file Node.js server that proxies to OpenAI, Google Places, and OSRM. Serves as the API gateway for all external calls. Auth via `X-API-Key` header; self-calls from the recommendation engine use `X-Internal: recommendation-engine` to bypass auth.

### Path Aliases

Defined in `tsconfig.json` `paths` and mirrored in `jest.config.js` `moduleNameMapper`:
- `types/*`, `utils/*`, `services/*`, `hooks/*`, `components/*`, `data/*`, `__tests__/*`

When adding new top-level directories, update all three: `tsconfig.json`, `jest.config.js`, and the `aliases` array in `backend/server.js` line ~11.

### 3-Tier Recommendation Engine (`services/recommendationEngine.ts`)

Fallback chain that never crashes:
1. **Manual curation** (Tier 1) — curated `data/restaurants/{city}.ts` → scored by `utils/recommendationRanker.ts` → filtered by tourist trap detector → quality gate
2. **Cache** (Tier 2) — in-memory cache with 7-day TTL, keyed by `{cityId}:{mealType}:{lat}:{lon}:v{SCORING_VERSION}`
3. **AI generation** (Tier 3) — `POST /api/ai/recommend-restaurants` → GPT returns restaurants → geocoded via Google Places → scored by ranker
4. **Stale cache** → low-quality manual → empty result (always returns something)

AI restaurants are geocoded via Google Places before ranking because GPT returns hallucinated coordinates. The 800m distance cutoff in the ranker is directional along the route, not a simple radius.

### Scoring Engine (`utils/recommendationRanker.ts`)

Composite score 0-110: Quality (25) + Authenticity (20) + Convenience (43) + Timing (15) + Curation (5) + Accessibility (2). Restaurants >800m from target are hard-excluded (return null). `SCORING_VERSION` is exported and must always be imported, never hardcoded.

### Geocoding Pipeline (`services/geocodingService.ts`)

4-tier: landmark DB → cache → Google Places → AI (disabled). Hotel geocoding skips Tier 1 (landmark DB) via `skipLandmark: true` to avoid false matches.

### Frontend Pages

Static HTML pages with inline CSS/JS (no bundler):
- `index.html` — landing page
- `itinerary.html` — itinerary input and parsing
- `restaurants.html` — restaurant recommendations display
- `trips.html` — saved trips

### Backend API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/parse-itinerary` | Parse itinerary text via GPT |
| POST | `/api/ai/analyze-review` | Analyze restaurant reviews via GPT |
| POST | `/api/ai/recommend-restaurants` | Generate restaurant recommendations via GPT (neighborhood-aware) |
| POST | `/api/recommendations/generate` | Full recommendation pipeline (used by frontend) |
| POST | `/api/places/search` | Google Places nearby search |
| GET | `/api/places/details/:placeId` | Google Places details |
| POST | `/api/geocoding/lookup` | Google Geocoding API |

## Test Configuration

Jest uses two projects: `node` (for `.test.ts`) and `jsdom` (for `.test.tsx`). Fixtures live in `__tests__/fixtures/`. Test files mirror the source structure: `__tests__/services/`, `__tests__/utils/`, `__tests__/integration/`, `__tests__/components/`, `__tests__/hooks/`.

## Code Conventions

- All console.log must use `[BracketedPrefix]` format (e.g., `[Engine]`, `[Ranker]`, `[Geocoding]`)
- No `as any` in source files (tests excluded for mocking)
- Always import `SCORING_VERSION` from `utils/recommendationRanker.ts`, never hardcode (current: 7)
- Max composite score: 110 points — never inflate
- Mock all external APIs in tests (Google Places, OpenAI, OSRM)
- No `new Date()` in tests — use fixed timestamps
- Import test data from `__tests__/fixtures/`, never inline
- Update `ARCHITECTURE.md` after code changes that add/modify features, services, types, or endpoints

## Design System

- **Fonts**: Cormorant Garamond (display) + Outfit (body)
- **Colors**: `--charcoal: #1a1a2e`, `--terracotta: #c4704b`, `--ochre: #d4a574`, `--cream: #f5f0eb`, `--sage: #8a9a7b`
- **Aesthetic**: Editorial luxury travel magazine — warm Mediterranean tones, grain overlay, generous whitespace
- All new pages must use the same CSS variables and design patterns

## Source Protection Rule

Never modify files outside this project directory. Never modify agent definitions in the agentic-ai-workshop `.claude/` directory. Read external code for reference only — all writes must be within this project.

## Edit Approval Rule

The main terminal session must never make code changes without user approval. Explain planned changes and wait for approval. Agents spawned via Agent Teams may edit without per-change approval.
