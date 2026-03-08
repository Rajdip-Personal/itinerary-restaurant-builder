# Active Context

## Current Focus
Requirements extraction complete (81 requirements, human-approved). Proceeding to technical design phase.
<!-- Updated: 2026-03-07 by orchestrator -->

## Recent Decisions

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-07 | Selected RTO POC project | New project based on RTO Compliance Tracker PRD v1 |
| 2026-03-07 | Keep 13-week view, 5-week edit window | User confirmed during PRD reading |
| 2026-03-07 | Goals: reduce manual effort, improve visibility, single source of truth | User approved suggested goals |
| 2026-03-07 | Metrics: engagement rate + review time (no upload processing time) | User removed upload processing time metric |
| 2026-03-07 | Basic PII handling for POC | Mask in logs, HTTPS, no PII in URLs |
| 2026-03-07 | Okta SSO for production, email-based for POC | Only authorized Okta users will access in production |
| 2026-03-07 | 3 milestones: Employee+Upload → Manager+Drill-down → Approvals+Actions | Incremental delivery |
| 2026-03-07 | Column mappings verified from sample files | RTO_Sample: 12 cols, Worker data: 35 cols (see PRD Section 10) |
| 2026-03-07 | Unmatched employees: skip + log warning | Employees in badge data but not worker/org data are excluded, logged for admin |
| 2026-03-07 | Add Reject action for managers | Approve (Yellow→Blue) or Reject (Yellow→Red) with optional note |
| 2026-03-07 | No file size limit for POC | Upload limits deferred to production |
| 2026-03-07 | Pie chart matches table view | No separate date picker, always synced with table range |
| 2026-03-07 | Admin auth: dedicated login with separate credentials | POC uses admin username/password in .env. Production uses Okta user IDs. Two auth paths (employee email-lookup vs admin credentials). (from orchestrator) |
| 2026-03-07 | Dispute + exception on same week: allowed on different days | Not on same day. Requires day-level tracking for disputes and exceptions. Affects data model and state machine. (from orchestrator) |
| 2026-03-07 | Re-submission after rejection: allowed | Red → Yellow on resubmission. Exceptions table versioned (multiple records per employee+week). Most recent is active, prior are historical audit trail. (from orchestrator) |
| 2026-03-07 | PTO follows same workflow as exceptions | PTO additions go Yellow (pending) and require manager approval → Blue (Excused). NOT auto-excusing. Same state machine as exceptions: Red → Yellow → Blue/Red. Simplifies state machine. (from orchestrator) |
| 2026-03-07 | 5-state compliance model (was 4-state) | Added 5th state (Orange/Purple = Multiple Actions Pending) for weeks with both dispute AND exception on different days. Week state computed from day-level actions. Pie chart must show 5th state. (from orchestrator) |

## Open Questions
All 5 PRD open questions resolved. 3 remaining design-time gaps to address in /generate-design:
1. ~~Admin role assignment mechanism~~ — RESOLVED: Dedicated admin login with .env credentials (2026-03-07)
2. ~~Concurrent dispute + exception handling~~ — RESOLVED: Allowed on different days within same week, day-level tracking (2026-03-07)
3. ~~Re-submission workflow after rejection~~ — RESOLVED: Allowed. Red → Yellow on resubmit. Versioned exception records for audit. (2026-03-07)
4. ~~PTO display behavior~~ — RESOLVED: PTO uses same approval workflow as exceptions (Yellow → Blue/Red). Not auto-excusing. (2026-03-07)
5. ~~Dual dispute + exception state machine transitions~~ — RESOLVED: Added 5th compliance state (Orange/Purple = Multiple Actions Pending). Week state derived from day-level actions. Same-day constraint enforced. (2026-03-07)

**ALL 5 DESIGN-TIME GAPS RESOLVED.**

## Blockers
None.

## Next Steps
1. Technical Design (`/generate-design`) — all 5 gaps resolved, design in progress
2. Execution Plan → Stories → Validation → Implementation
