# RTO Compliance Tracker

## Product Requirements Document

**Version:** 1.2
**Date:** March 7, 2026
**Status:** Draft — Requirements Refinement
**Confidential**
**Project:** RTO POC
**Branch:** rto-poc

---

## 1. Product Overview

### Vision
An internal web application that provides a single source of truth for Return-to-Office compliance, enabling employees to track their own status, managers to monitor their teams, and HR to manage compliance data — replacing manual Excel-based tracking.

### Problem Statement
Nordstrom requires employees to badge into the office a minimum of 4 days per week. Currently there is no centralized tool for employees to view their compliance status, for managers to monitor their teams and act on exceptions, or for HR to manage the compliance data workflow. Data lives in Excel files with no self-service visibility, no exception workflow, and no audit trail.

### Target Users

| Persona | Role | Key Need |
|---------|------|----------|
| Employee | Individual contributor subject to RTO policy | View own weekly compliance, dispute badge counts, add PTO, submit exceptions |
| Manager | People manager with direct reports | Monitor direct reports' compliance, approve exceptions/disputes, drill into org hierarchy |
| Admin / HR | HR administrator | Upload RTO compliance data (Excel files) into the system |

---

## 2. Goals & Success Metrics

### Goals
1. **Reduce manual compliance tracking effort** — Replace spreadsheet-based tracking with a self-service web application
2. **Improve manager visibility into team compliance** — Give managers a real-time dashboard of direct reports' RTO status with actionable exception/dispute workflows
3. **Provide a single source of truth for RTO data** — Centralize compliance data, exceptions, disputes, and approvals in one system with audit trail

### Success Metrics

| Metric | Current State | Target | Measurement Method |
|--------|--------------|--------|-------------------|
| Employee weekly engagement rate | N/A (no tool exists) | 70% of tracked employees check their status weekly | Login/view analytics |
| Average manager exception review time | Unknown (manual process) | < 48 hours from submission to approval/rejection | Timestamp difference between exception submission and manager action |
| Data completeness | Manual Excel tracking | 100% of eligible employees have compliance data within 24 hours of upload | Upload processing verification |

---

## 3. Scope

### In Scope
- Employee View: weekly compliance table (13-week default, expandable to 1 year), pie chart, dispute/exception/PTO actions (last 5 weeks)
- Manager View: own compliance + direct reports dashboard with recursive drill-down and exception/dispute approval
- Admin Upload Screen: Excel file upload with append/upsert behavior
- 4-state compliance model (Compliant / Exception Pending / Non-Compliant / Excused)
- Role-based access (Employee, Manager, Admin/HR)
- Email-based authentication (interim for POC; Okta SSO deferred)
- Org hierarchy navigation with breadcrumbs (Level 01–08)

### Out of Scope
- Contingent Workers (excluded from all RTO tracking)
- Exempt employees (Work Location Type = "At Home")
- HR View (Screen 4) — deferred to future iteration
- Okta SSO integration — deferred (POC uses email-based lookup)
- Notifications (email or in-app) — deferred
- Live badge data feed (API integration) — deferred

### Future Considerations
- Okta SSO integration for production authentication
- HR View with curated manager assignments
- Email/in-app notifications for new exceptions and disputes
- API integration with badge system for real-time data
- Configurable compliance threshold (currently 4 days, may vary by group)

---

## 4. User Stories (High Level)

### Employee
- As an employee, I want to view my weekly RTO compliance status for the last 13 weeks, so that I know whether I'm meeting the 4-day requirement.
- As an employee, I want to dispute a badge count that I believe is incorrect, so that my manager can review and correct it.
- As an employee, I want to add PTO days that weren't captured in the system, so that my compliance record is accurate.
- As an employee, I want to submit an exception explanation for a non-compliant week, so that my manager can review and potentially excuse it.
- As an employee, I want to see a pie chart of my compliance history, so that I can quickly understand my overall compliance trend.

### Manager
- As a manager, I want to see a dashboard of all my direct reports' compliance status, so that I can identify who needs attention.
- As a manager, I want to drill into a direct report's weekly detail, so that I can review their compliance history before taking action.
- As a manager, I want to approve or review exception requests from my reports, so that legitimate absences are properly excused.
- As a manager, I want to review badge disputes from my reports, so that I can grant excused status if warranted.
- As a manager, I want to recursively drill into sub-managers' teams, so that I have visibility across my full org hierarchy.

### Admin / HR
- As an admin, I want to upload an RTO compliance Excel file, so that the system has the latest badge swipe data.
- As an admin, I want uploads to preserve employee-submitted exceptions and PTO additions, so that user data is never lost during updates.

---

## 5. Functional Requirements

### 5.1 Screen 1 — Employee View

**Purpose:** Allow employees to view their own RTO compliance and take action on recent weeks.

#### 5.1.1 Data Display
- Weekly compliance table showing: Week Range, Badge Swipes, PTO Days, Meets 4-Day Requirement (Yes/No), Status (color-coded), Exception (if submitted)
- Default view: Last 13 weeks
- Expandable to: Up to 1 year of historical data
- Each week row is color-coded per the compliance states above

#### 5.1.2 Pie Chart
- 3-slice pie chart showing the count/percentage of weeks in each state:
  - Green = Compliant weeks
  - Blue = Excused weeks (manager-approved exceptions)
  - Red = Non-compliant weeks (includes pending exceptions in the count until approved)
- Pie chart date range always matches the table view (13-week default or expanded range)

#### 5.1.3 Employee Actions (Last 5 Weeks Only)
For the 5 most recent weeks, the employee can:
- **Dispute Badge Count:** Employee indicates they believe the badge swipe count is incorrect. This flags the week for manager review. The employee does NOT directly change the count.
- **Add PTO Days:** Employee can record PTO days that may not have been captured in the system. All employees can do this regardless of level.
- **Submit Exception:** A button on any non-compliant week that opens a text field for the employee to write an explanation (e.g., business travel, illness, personal emergency). Submitting changes the week's color from Red to Yellow (pending).

Weeks older than the 5 most recent are read-only.

### 5.2 Screen 2 — Manager View

**Purpose:** Allow managers to monitor direct reports' compliance and take action on exceptions/disputes.
**Access:** Only available to users where Is Manager = "Yes" in the worker data.

#### 5.2.1 Manager's Own View
The manager first sees their own Employee View (Screen 1) with all the same capabilities. Their own exceptions/disputes escalate to their manager — they cannot self-approve.

#### 5.2.2 Direct Reports Dashboard
A summary table of all direct reports showing:
- Employee name
- Compliance percentage (compliant weeks / total weeks in view)
- Color-coded overall status indicator
- Count of pending exceptions and badge disputes
- Filtering: Ability to filter by compliant, non-compliant, or exception-pending

#### 5.2.3 Drill-Down Behavior
- Clicking a direct report opens that person's weekly detail view (same layout as Employee View, but read-only for the manager — no editing).
- Clicking a Yellow (exception pending) week shows the exception explanation text submitted by the employee.
- If a week has a badge dispute, the manager sees this flagged.

#### 5.2.4 Manager Actions
- **Approve Exception:** Manager reviews the exception explanation, and if approved, the week's state changes from Yellow (pending) to Blue (excused). This is a distinct state from Green (compliant).
- **Reject Exception:** Manager reviews the exception explanation and rejects it. The week's state changes from Yellow (pending) back to Red (non-compliant). Manager may optionally add a rejection note.
- **Approve Badge Dispute:** Manager reviews the dispute. If approved, the week flips to Blue (excused). The badge count itself is not modified — the approval grants an excused status.
- **Reject Badge Dispute:** Manager reviews the dispute and rejects it. The week remains Red (non-compliant). Manager may optionally add a rejection note.

Managers must drill into the employee's weekly detail before approving or rejecting. There is no bulk/quick approval from the summary view. This ensures the manager reviews the situation before acting.

#### 5.2.5 Recursive Drill-Down
If a direct report is also a manager (Is Manager = "Yes"), the viewing manager can further drill into that sub-manager's direct reports, and so on down the hierarchy. This is powered by the Manager column in the worker data, which creates a parent-child adjacency tree. The Level 01–08 hierarchy columns can be used for breadcrumb navigation.

### 5.3 Screen 3 — Admin / Upload Screen

**Purpose:** Allow HR or Admin users to upload RTO compliance data into the system.

#### 5.3.1 Upload Behavior
- Admin uploads an Excel file in the same format as RTO_Sample.xlsx. No file size limit for POC.
- Data is appended to the existing dataset. New weeks are added; existing data is preserved.
- If the same employee + week combination appears in both the existing data and the new upload, the new upload's data replaces the old (latest wins).
- All employee edits (exceptions, PTO additions, disputes) from prior uploads are preserved and not overwritten by new uploads.
- If an employee appears in badge data but NOT in the worker/org data, that employee is skipped and a warning is logged for admin review.

### 5.4 Screen 4 — HR View (Deferred)

An HR-specific view where designated HR users can see and drill into a curated subset of managers (not all managers). This includes managers explicitly assigned to them, plus optionally some managers outside their natural org hierarchy. Access is controlled via a configurable HR-to-Manager mapping. This screen will be designed and built in a future iteration.

### Workflows

**Workflow 1: Employee Submits Exception**
1. Employee logs in and views their weekly compliance table
2. Employee identifies a non-compliant (Red) week within the last 5 weeks
3. Employee clicks "Submit Exception" on that week
4. Employee enters explanation text and submits
5. Week status changes from Red to Yellow (Exception Pending)
6. Manager sees the pending exception on their next login

**Workflow 2: Manager Reviews Exception**
1. Manager logs in and views their Direct Reports Dashboard
2. Manager sees pending exceptions count for a direct report
3. Manager clicks the direct report to drill into their weekly detail
4. Manager clicks the Yellow (pending) week to see the exception explanation
5. Manager approves or rejects the exception (with optional note on rejection)
6. If approved: week status changes from Yellow to Blue (Excused)
7. If rejected: week status changes from Yellow back to Red (Non-Compliant)

**Workflow 3: Admin Uploads Data**
1. Admin navigates to the Upload screen
2. Admin selects an Excel file in RTO_Sample.xlsx format
3. System validates the file format and fields
4. System appends new data; overwrites matching employee+week records
5. All employee edits (exceptions, PTO, disputes) from prior uploads are preserved
6. Admin sees confirmation of upload results (rows processed, new weeks added, records updated)

### Business Rules

| # | Rule | Notes |
|---|------|-------|
| 1 | Only Employees (not CW) in RTO dataset are tracked | 455 CWs excluded |
| 2 | Exempt employees (At Home) are not tracked | 280 At Home workers excluded |
| 3 | Compliance = Meets 4-Day Requirement = Yes (from badge data) | 4 days in office per week |
| 4 | PTO / exceptions do NOT auto-flip to compliant | Only manager approval changes state |
| 5 | Manager approval → Excused (distinct from Compliant) | Tracked separately in pie chart |
| 6 | Badge dispute approval → Excused (count not changed) | Same outcome as exception approval |
| 7 | Managers cannot self-approve; their items go to their manager | Hierarchy enforced |
| 8 | Managers must drill into weekly detail before approving | No bulk approval from summary |
| 9 | Employee edits limited to 5 most recent weeks | Older weeks are read-only |
| 10 | Data upload appends; same employee+week → latest wins | Employee edits preserved |
| 11 | No notifications; managers see pending items on next login | Future enhancement candidate |
| 12 | Pie chart: 3-slice (Compliant / Excused / Non-Compliant) | Pending exceptions count as non-compliant until approved |

---

## 6. Non-Functional Requirements

### Security
- **Authentication:** Email-based lookup from worker data for POC. Okta SSO deferred — only authorized Okta users will be able to login in production.
- **Authorization:** Role-based access control (Employee, Manager, Admin/HR) enforced at the API layer.
- **Self-approval restriction:** Managers cannot approve their own exceptions or disputes; enforced server-side.
- **PII Handling (POC):** Basic PII protections — mask PII (employee names, emails, badge data) in all log output; use HTTPS for all connections; no PII in URLs or query parameters. Full encryption at rest deferred to production.
- **Input Validation:** All file uploads validated for format, size, and content. All user inputs sanitized (parameterized queries, XSS prevention).

### Performance
- **Page load time:** < 2 seconds for Employee View (13-week data)
- **Manager dashboard load:** < 3 seconds for direct reports summary
- **File upload processing:** < 30 seconds for a full dataset upload (~328 employees x 13 weeks)
- **Concurrent users:** Support up to 50 concurrent users (POC scale)

### Observability
- **Structured logging:** All application logs in structured JSON format with correlation IDs.
- **PII masking:** Employee names, emails, and badge data masked in all log output.
- **Health endpoint:** Application exposes a health check endpoint for monitoring.
- **Error handling:** All errors return structured responses with error codes and user-friendly messages.

---

## 7. Technical Constraints

### Existing Systems
- **RTO badge data:** Provided as Excel files (RTO_Sample.xlsx format) — no live API available for POC
- **Worker/Org data:** Provided as Excel file (tech_workers_with_manager_email.xlsx) — defines hierarchy and roles

### Tech Stack
TBD — to be decided during technical design phase (`/generate-design`).

### Infrastructure
- **Local only** — installed and run on the developer's machine
- No server deployment, no containers, no CI/CD pipeline
- Installation and run instructions for local development

---

## 8. Dependencies & Risks

### Dependencies

| Dependency | Owner | Status | Impact if Delayed |
|-----------|-------|--------|-------------------|
| RTO badge swipe data (Excel) | HR / Admin uploads | Available (sample: RTO_Sample.xlsx) | Cannot display compliance data |
| Worker/Org hierarchy data (Excel) | HR | Available (sample: tech_workers_with_manager_email.xlsx) | Cannot determine roles or hierarchy |
| Okta SSO integration | Identity team | Deferred for POC | POC uses email-based auth; production blocked until available |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data quality issues in Excel uploads | Medium | High | Validate file format, required fields, data types on upload; show clear error messages for malformed files |
| Org hierarchy accuracy | Medium | Medium | Cross-reference Manager column with worker data; flag inconsistencies; allow manual hierarchy corrections in future |
| User adoption resistance | Low | Medium | Simple, intuitive UI; clear value prop (self-service vs. asking HR); manager training materials |
| PII exposure risk | Low | High | Basic PII handling in POC (masked logs, HTTPS, no PII in URLs); Okta SSO for production — only authorized users can access |

---

## 9. Timeline & Milestones

| Milestone | Description | Key Deliverables |
|-----------|-------------|-----------------|
| M1: Employee View + Data Upload | Core employee experience and data pipeline | Employee weekly compliance table, pie chart, Admin upload screen, data validation |
| M2: Manager View + Drill-down | Manager monitoring capabilities | Direct reports dashboard, recursive drill-down, org hierarchy breadcrumbs |
| M3: Approvals + Actions | Complete exception/dispute workflow | Exception submission, badge dispute, manager approval actions, status state machine |

---

## 10. Data Sources & Model

### 10.1 RTO Compliance Data (uploaded periodically)

Source file format matches RTO_Sample.xlsx (12 columns, verified from sample file):

| # | Column Name | Type | Description |
|---|-------------|------|-------------|
| 1 | ET Org | String | Top-level org (e.g., "Technology (Jason Morris)") |
| 2 | ELG Org | String | Eligibility org (may be null) |
| 3 | Supervisory Org | String | Direct supervisory org |
| 4 | Worker | String | Employee name (e.g., "Isabelle Gonn") |
| 5 | Worker Type | String | "Employee" or "Contingent Worker" |
| 6 | Work Location Type | String | "Hybrid" / "In Office" / "At Home" |
| 7 | Location | String | Physical office location (e.g., "865 CORPORATE TOWER II") |
| 8 | On Leave | String | "true" / "false" |
| 9 | Week Range | String | "MM/DD/YYYY - MM/DD/YYYY" (Monday–Sunday) |
| 10 | Meets 4-Day Requirement | String | "Yes" / "No" |
| 11 | Total Badge Swipe | Integer | Number of badge swipes in the week |
| 12 | Total PTO Requested | Integer | PTO days recorded for the week |

Sample data: 4 rows for 1 employee (Isabelle Gonn), 4 weeks of data.

### 10.2 Worker / Org Data

Source file: tech_workers_with_manager_email.xlsx (35 columns, 783 rows, verified from sample file).

**Key fields used by the application:**

| # | Column Name | Type | Usage |
|---|-------------|------|-------|
| 5 | Worker | String | Employee name — join key with RTO data |
| 27 | Email - Work | String | Login matching (email-based auth for POC) |
| 23 | Manager | String | Manager name — defines reporting hierarchy |
| 24 | Manager E-mail Address | String | Manager identification |
| 13 | Is Manager | String/null | "Yes" or null — determines manager role access |
| 14 | Number of Direct Reports | Integer | Count of direct reports |
| 11 | Worker Type | String | "Employee" or "Contingent Worker" — filters eligibility |
| 26 | Work Location Type | String | Identifies exempt workers ("At Home") |
| 28-35 | Level 01–08 from the Top | String | Full org hierarchy for breadcrumb navigation |

**Additional fields available but not primary:**
Sub-Organization, Supervisory Organization, Location, Department, Exempt Status, Job Profile, Business Title, Job Family, Job Family Group, Position Worker Type, Region, Business Unit, Store, Cost Center, Time Type, Pay Rate Type, Management Level, FTE, Works from Home

### 10.3 Application-Generated Data (stored in database)

The following data is created within the app and must persist across data uploads:
- Employee-submitted exceptions (employee ID, week, explanation text, timestamp)
- Employee-added PTO (employee ID, week, PTO days added, timestamp)
- Badge disputes (employee ID, week, dispute flag, timestamp)
- Manager approvals (manager ID, employee ID, week, action type [exception approved / dispute approved], timestamp)
- Computed compliance state per employee-week (Compliant / Exception Pending / Non-Compliant / Excused)

---

## 11. Deferred Items

| Item | Current Approach | Future State |
|------|-----------------|--------------|
| Authentication | Email lookup from worker data | Okta SSO integration (only authorized users can access) |
| HR View (Screen 4) | Not built | Curated manager list per HR user with drill-down |
| Notifications | None; managers check on login | Email or in-app notifications for new exceptions/disputes |
| Live data feed | Periodic Excel upload by Admin | API integration with badge system |

---

## 12. Current Data Profile

Based on the sample files provided:
- **Total workers in org data:** 783
- **Employees:** 328 | **Contingent Workers:** 455 (excluded)
- **Work Location Types:** Hybrid (300), At Home (280, excluded), In Office (124)
- **Managers (Is Manager = Yes):** 46
- **Unique managers in hierarchy:** 48
- **Org hierarchy depth:** 8 levels
- **RTO sample:** 4 weeks of data for 1 employee (Isabelle Gonn)

In production, the RTO dataset will contain weekly records for all eligible employees.

---

## 13. Open Questions

| # | Question | Owner | Status | Answer |
|---|----------|-------|--------|--------|
| 1 | What is the exact Excel column mapping for the worker/org data file? | HR / Data team | Answered | Verified from sample files: RTO_Sample.xlsx has 12 columns, tech workers file has 35 columns. Exact mappings documented in Section 10. |
| 2 | How should the system handle employees who appear in badge data but not in worker/org data? | Product | Answered | Skip and log a warning. Exclude unmatched employees from compliance tracking but log them for admin review. |
| 3 | Should there be a "Reject Exception" action for managers (in addition to Approve)? | Product | Answered | Yes. Manager can Approve (Yellow→Blue) or Reject (Yellow→Red) with optional rejection note. Same for badge disputes. |
| 4 | What is the maximum file size for Excel uploads? | Engineering | Answered | No file size limit for POC. Limits to be added in production. |
| 5 | Should the pie chart be configurable by date range, or always match the table view? | Product | Answered | Always matches the table view (13-week default or expanded range). No separate date picker. |
