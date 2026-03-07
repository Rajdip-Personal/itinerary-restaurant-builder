# Technical Context

## Tech Stack
TBD — to be decided during /generate-design phase.

## Infrastructure
**Local only** — installed and run on the developer's machine. No server deployment, no containers, no CI/CD pipeline.

## Technical Constraints
- Authentication: Email-based lookup from worker data for POC (Okta SSO deferred to production)
- Manager identification: "Is Manager" = "Yes" in worker data file
- Data input: Excel file uploads matching RTO_Sample.xlsx format
- Org hierarchy: Parent-child adjacency tree via Manager column, Level 01–08 columns for breadcrumbs
- Self-approval restriction: Managers cannot approve their own exceptions/disputes (server-side enforcement)
- PII handling (POC): Mask in logs, HTTPS, no PII in URLs. Full encryption at rest deferred.
- Concurrent users: Up to 50 (POC scale)
- Page load: < 2s for Employee View, < 3s for Manager Dashboard
- Upload processing: < 30s for full dataset (~328 employees x 13 weeks)

## Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| RTO badge swipe data (Excel) | HR / Admin uploads | Available (sample: RTO_Sample.xlsx) |
| Worker/Org hierarchy data (Excel) | HR | Available (sample: tech_workers_with_manager_email.xlsx) |
| Okta SSO | Identity team | Deferred — email lookup used as interim for POC |
