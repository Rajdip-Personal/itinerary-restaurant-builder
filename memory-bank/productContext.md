# Product Context

## Problem Statement
Nordstrom requires employees to badge into the office a minimum of 4 days per week. Currently there is no centralized tool for employees to view their compliance status, for managers to monitor their teams and act on exceptions, or for HR to manage the compliance data workflow. Data lives in Excel files with no self-service visibility, no exception workflow, and no audit trail.

## User Personas

### Employee
- Views their own weekly RTO compliance data (last 13 weeks default)
- Can dispute badge counts, add PTO days, and submit exception explanations
- Actions limited to the 5 most recent weeks; older weeks are read-only
- Cannot self-approve — all exceptions go to their manager

### Manager
- Sees their own Employee View first (same capabilities)
- Has a Direct Reports Dashboard with compliance percentages and pending items
- Can drill into any direct report's weekly detail (read-only)
- Approves or rejects exceptions (Yellow → Blue or Yellow → Red) with optional rejection note
- Approves or rejects badge disputes (same pattern)
- Cannot self-approve — their items escalate to their manager
- Must drill into weekly detail before approving/rejecting (no bulk actions)
- If a direct report is also a manager, can recursively drill into sub-reports

### Admin / HR
- Uploads RTO compliance data via Excel files (no file size limit for POC)
- Data appends to existing dataset; same employee+week → latest upload wins
- Employee edits (exceptions, PTO, disputes) are preserved across uploads
- Employees in badge data but not in worker/org data are skipped with a warning log

## Business Context
- Company RTO policy: 4 days in-office per week
- Current data: 783 workers total, 328 employees tracked (455 CWs excluded, 280 At Home excluded)
- 46 managers identified, 8-level org hierarchy depth
- Compliance determined by "Meets 4-Day Requirement" field in badge data
- 5-state compliance model: Green (Compliant), Blue (Excused/approved), Yellow (Single Action Pending), Orange/Purple (Multiple Actions Pending — both dispute+exception on different days), Red (Non-Compliant)
- Excused is distinct from Compliant — tracked and reported separately
- 3 milestones: M1 (Employee View + Upload), M2 (Manager View + Drill-down), M3 (Approvals + Actions)
- Sample files verified: RTO_Sample.xlsx (12 columns, 4 rows), tech workers file (35 columns, 783 rows)

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-07 | Selected RTO POC as project | New project based on RTO Compliance Tracker PRD v1 |
| 2026-03-07 | 13-week default view, 5-week edit window | User confirmed during PRD reading |
| 2026-03-07 | Goals: reduce manual effort, improve visibility, single source of truth | User approved suggested goals |
| 2026-03-07 | Metrics: engagement rate + review time (no upload processing time) | User removed upload processing time metric |
| 2026-03-07 | Basic PII handling for POC | Mask in logs, HTTPS, no PII in URLs. Full encryption deferred to production |
| 2026-03-07 | Okta SSO for production, email-based for POC | Only authorized Okta users can access in production |
| 2026-03-07 | 3 milestones: Employee+Upload → Manager+Drill-down → Approvals+Actions | Incremental delivery approach |
| 2026-03-07 | All 4 risks acknowledged | Data quality, hierarchy accuracy, adoption, PII |
| 2026-03-07 | Column mappings verified from sample files | RTO_Sample: 12 cols (incl. ELG Org), Worker data: 35 cols |
| 2026-03-07 | Unmatched employees: skip + log warning | Badge data employees not in worker/org data excluded, logged |
| 2026-03-07 | Add Reject action for managers | Approve (Yellow→Blue) or Reject (Yellow→Red) with optional note |
| 2026-03-07 | No file size limit for POC | Limits deferred to production |
| 2026-03-07 | Pie chart always matches table view | No separate date picker |
| 2026-03-07 | Admin auth: dedicated login with separate credentials | POC: admin username/password in .env. Production: Okta user IDs. Two auth paths needed. |
| 2026-03-07 | Dispute + exception on same week: allowed on different days | Not on same day. Requires day-level tracking columns for disputes and exceptions. |
| 2026-03-07 | Re-submission after rejection: allowed | Red → Yellow on resubmit. Versioned exception records (multiple per employee+week). Most recent active, prior historical. |
| 2026-03-07 | PTO follows same approval workflow as exceptions | PTO goes Yellow (pending), requires manager approval → Blue (Excused) or Red (rejected). NOT auto-excusing. Simplifies state machine. |
| 2026-03-07 | 5-state compliance model (expanded from 4-state) | Green=Compliant, Blue=Excused, Yellow=Single Action Pending, Orange/Purple=Multiple Actions Pending, Red=Non-Compliant. Week state derived from day-level actions. |
