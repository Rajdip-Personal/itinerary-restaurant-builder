# CLAUDE.md — CultureGuide: Restaurant Builder from Itinerary

## Project Overview

CultureGuide web app — transforms free-form tourist itineraries into structured daily plans with route-aware restaurant recommendations for European cities (Paris, Venice, Rome).

## Source Protection Rule (MANDATORY)

**Never modify files outside this project directory.** Specifically:

- **NEVER modify anything in `/Users/x7c6/museum _guide/CultureGuideWeb/`** or any other external project
- If you need code, data, or patterns from CultureGuideWeb or any other project, **copy the files into this project first**, then make changes to the copy
- This applies to ALL agents (coding-agent, backend-services-dev, design-agent, etc.)
- If an agent needs to read external code for reference, reading is fine — but all writes/edits MUST be within `/Users/x7c6/agentic-ai-workshop/projects/restaurant-builder-from-itinerary/`

**Similarly, never modify agent definitions in the agentic-ai-workshop `.claude/` directory.** If an agent definition needs customization for this project, copy it into this project's folder first, then modify the copy.

## Project Location

`/Users/x7c6/agentic-ai-workshop/projects/restaurant-builder-from-itinerary/`

## Tech Stack

- **Frontend**: Plain HTML/CSS/JS (single-file pages) — will migrate to React/Next.js later
- **Backend**: Node.js/Express proxy server (port 3000)
- **AI**: OpenAI GPT-3.5-turbo via backend proxy
- **Routing**: OSRM (Open Source Routing Machine)
- **Geocoding**: Manual landmarks + Google Places API (tiered fallback)
- **Data**: Curated restaurant data for Paris (43), Rome (40), Venice (15)

## Design System

- **Fonts**: Cormorant Garamond (display) + Outfit (body) — Google Fonts
- **Colors**: `--charcoal: #1a1a2e`, `--terracotta: #c4704b`, `--ochre: #d4a574`, `--cream: #f5f0eb`, `--sage: #8a9a7b`
- **Aesthetic**: Editorial luxury travel magazine — warm Mediterranean tones, grain overlay, generous whitespace
- All new pages MUST use the same CSS variables and design patterns as existing pages

## Backend API

- **URL**: `http://localhost:3000`
- **Auth**: `X-API-Key` header required
- **Endpoints**:
  - `POST /api/ai/parse-itinerary` — `{ itineraryText, cityName }` → `{ parsed, usage }`
  - `POST /api/ai/analyze-review` — `{ reviewText }` → `{ analysis, usage }`
  - `POST /api/places/search` — `{ latitude, longitude, radius, type, keyword }`
  - `GET /api/places/details/:placeId`
  - `POST /api/geocoding/lookup` — `{ address }`

## TDD Workflow (MANDATORY)

All development follows strict Test-Driven Development:

1. **New feature**: Write failing tests FIRST, then implement until tests pass
2. **Bug fix**: Write a test that reproduces the bug FIRST, then fix it
3. **Refactor**: All existing tests must pass BEFORE and AFTER
4. **Task completion**: Task is NOT complete until `npx jest` shows all green
5. Run `npx jest` before and after every change

## Code Quality Rules (Non-Negotiable)

| Rule | Detail |
|------|--------|
| No `as any` | Never use `as any` in source files (tests excluded for mocking) |
| Console.log format | All logs must use `[BracketedPrefix]` format (e.g., `[Ranker]`, `[Geocoding]`) |
| SCORING_VERSION | Always import from `utils/recommendationRanker.ts`, never hardcode. Current value: 7 |
| Max score | Never inflate beyond 110 points |
| No real APIs in tests | Mock Google Places, OpenAI, OSRM in all test files |
| No `new Date()` in tests | Use fixed time values for deterministic results |
| Never delete tests | Update with comments explaining changes |
| Fixtures | Import from `__tests__/fixtures/`, never inline test data |
| ARCHITECTURE.md | Update after every code change that adds/modifies features, services, types, endpoints |

## Performance Budgets

| Operation | Target |
|-----------|--------|
| Itinerary parsing | < 10s |
| Manual recommendation load | < 500ms |
| Cached recommendation load | < 1s |
| AI recommendation generation | 30-60s |
| Running Late re-rank | < 2s (zero API cost) |
| OSRM route fetch | < 5s |

## Token Budget

- Per-trip limit: 2,000,000 tokens (30-day rolling window)
- Warning at 75% (1,500,000 tokens)
- Cost: ~$0.48 per full day (3 meals)

## Error & Resilience

- Centralized `errorLogger.ts` with 5 severity levels (fatal, error, warning, info, debug)
- Retry: 1 retry with 2s delay for AI failures
- Fallback chain: manual curation → cache → AI → stale cache → empty (never crash)
- Network: assume online on detection failure (avoid false offline blocking)

## Excluded Integrations

These are NOT used in this project:
- Jira (no jira-agent)
- Confluence (no confluence agents)
- Sprint-agent
- Story-generator
- No GitHub pushes — user has a personal repo for that

## Edit Approval Rule (MANDATORY)

**The main terminal session (team lead / direct Claude) must NEVER make code changes without user approval.** Always explain what you plan to change and wait for the user to approve before editing any file. Only agents spawned via Agent Teams may edit files without per-change approval.

## City Detection

Cities are detected automatically from itinerary text by the AI parser. There is NO city selector UI. The backend `cityName` parameter serves as a fallback only.
