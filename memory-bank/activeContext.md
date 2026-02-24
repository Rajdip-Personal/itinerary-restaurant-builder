# Active Context

## Current Focus
PRD refinement for RTO Compliance App. PRD has been through 3 iterations and is nearing readiness for the next pipeline stage (/plan or /requirements).

## Recent Decisions
- (2026-02-24) Dropped sprint-level timelines — milestones only, squad determines pacing
- (2026-02-24) Switched from custom Org Hierarchy API to OKTA + Microsoft Graph for org structure
- (2026-02-24) Flipped from daily employee check-in model to exception-only model with badge data as source of truth
- (2026-02-24) Added Workday as auto-sync data source for formal leave (PTO, sick)
- (2026-02-24) Added Outlook calendar OOO as supplementary auto-sync data source
- (2026-02-24) Established 5-source priority: Badge > Workday > Calendar > Holiday > Manual
- (2026-02-24) Employee can backfill past dates (up to 30 days)
- (2026-02-24) 4-day RTO policy confirmed as default

## Open Questions
1. Which OKTA scopes/claims needed for manager relationships? Is SCIM enabled?
2. What is the exact format of the badge scan Excel? Need sample file.
3. What Workday API access is available — REST, RaaS, SOAP?
4. What leave types exist in Workday? Which count as "Excused"?
5. Should HR Partners have write access or read-only?
6. Are there groups with different RTO targets?
7. Where does the company holiday calendar live?
8. How far back should backfill be allowed? (Currently 30 days)
9. Manager delegation when manager is on PTO?
10. Workday data latency — near-real-time or nightly batch?
11. Admin consent needed for Microsoft Graph Calendars.Read?
12. What Outlook OOO patterns do employees actually use?

## Blockers
- None currently — PRD is in refinement, not blocked

<!-- Updated: 2026-02-24 -->
