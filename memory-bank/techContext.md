# Technical Context

## Tech Stack
TBD — to be decided during /generate-design phase.

## Infrastructure
**Local only** — installed and run on the developer's machine. No server deployment, no containers, no CI/CD pipeline.

## Technical Constraints
- Authentication: Two auth paths — (1) Employee/Manager: email-based lookup from worker data for POC (Okta SSO deferred); (2) Admin: dedicated login with separate credentials (.env username/password for POC, Okta user IDs for production)
- Manager identification: "Is Manager" = "Yes" in worker data file
- Data input: Excel file uploads matching RTO_Sample.xlsx format
- Org hierarchy: Parent-child adjacency tree via Manager column, Level 01–08 columns for breadcrumbs
- Self-approval restriction: Managers cannot approve their own exceptions/disputes (server-side enforcement)
- PII handling (POC): Mask in logs, HTTPS, no PII in URLs. Full encryption at rest deferred.
- Concurrent users: Up to 50 (POC scale)
- Page load: < 2s for Employee View, < 3s for Manager Dashboard
- Upload processing: < 30s for full dataset (~328 employees x 13 weeks)
- Day-level tracking: Disputes and exceptions tracked at day level within weeks (employee can dispute one day and submit exception for a different day in the same week, but not the same day)
- Exception versioning: Multiple exception records per employee+week supported (for re-submission after rejection). Most recent record is active; prior records preserved for audit trail.
- PTO workflow: PTO additions follow same approval flow as exceptions (Yellow pending → manager approval → Blue Excused or Red rejected). PTO is NOT auto-excusing.
- Unified state machine: Exceptions, PTO, and disputes all trigger pending state requiring manager approval. Simplifies to one approval pattern.
- 5-state compliance model: Green (Compliant), Blue (Excused), Yellow (Single Action Pending), Orange/Purple (Multiple Actions Pending), Red (Non-Compliant). Week-level state computed from day-level actions.
- Week state computation: Derived from all day-level actions — if both dispute and exception pending on different days → 5th state (Multiple Actions Pending). Single pending type → Yellow. All approved → Blue. No actions + non-compliant → Red.
- Date selection required: Exception and dispute submission forms must require employee to select specific day(s) of the week the action covers.
- Same-day constraint: Same day within a week cannot have both a dispute and an exception — only different days allowed.

## Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| RTO badge swipe data (Excel) | HR / Admin uploads | Available (sample: RTO_Sample.xlsx) |
| Worker/Org hierarchy data (Excel) | HR | Available (sample: tech_workers_with_manager_email.xlsx) |
| Okta SSO | Identity team | Deferred — email lookup used as interim for POC |
