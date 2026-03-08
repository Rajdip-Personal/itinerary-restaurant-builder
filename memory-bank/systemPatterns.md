# System Patterns

## Architecture Style


## API Conventions


## Data Model


## Integration Patterns


## Testing Patterns


## Deployment Patterns


## Architecture Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-07 | 5-state compliance model with day-level granularity | Supports concurrent dispute+exception on different days within same week. Week state derived from day-level actions. States: Green (Compliant), Blue (Excused), Yellow (Single Pending), Orange/Purple (Multiple Pending), Red (Non-Compliant). |
| 2026-03-07 | Unified approval workflow for exceptions, PTO, and disputes | All three action types follow same pattern: submit → Yellow/pending → manager approve (Blue) or reject (Red). Reduces state machine complexity. |
| 2026-03-07 | Versioned exception records | Multiple exception records per employee+week to support re-submission after rejection. Most recent is active; prior preserved for audit. |
| 2026-03-07 | Two authentication paths | Employee/Manager: email-based lookup (POC), Okta SSO (production). Admin: dedicated credentials (.env for POC, Okta user IDs for production). |
