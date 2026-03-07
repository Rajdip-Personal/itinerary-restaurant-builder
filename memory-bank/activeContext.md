# Active Context

## Current Focus
PRD refinement for RTO Compliance Tracker (RTO POC) — PRD updated with goals, metrics, user stories, NFRs, risks, milestones, and open questions.
<!-- Updated: 2026-03-07 -->

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
| 2026-03-07 | All 4 risks acknowledged | Data quality, hierarchy accuracy, adoption, PII |

## Open Questions
1. What is the exact Excel column mapping for the worker/org data file?
2. How should the system handle employees in badge data but not in worker/org data?
3. Should there be a "Reject Exception" action for managers?
4. What is the maximum file size for Excel uploads?
5. Should the pie chart be configurable by date range, or always match the table view?

## Blockers
None.

## Next Steps
1. Run readiness check for /refine-prd
2. Proceed to /review-prd to address open questions
