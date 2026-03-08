# Technical Design: RTO Compliance Tracker — Gap Analysis, Traceability & Appendix

## Document Info
- **Version:** 2.0
- **Date:** 2026-03-07
- **Status:** Draft — Updated with human-resolved gaps
- **Requirements Baseline:** docs/outputs/requirements-bf.md, docs/outputs/requirements-tn.md
- **Section Owner:** design-agent-gaps

---

# Part 5: Gap Analysis

## 5.1 Resolved Gaps from Requirements Phase

### Gap 1: Admin Role Assignment — RESOLVED (Human Decision)

- **Issue:** The worker data file has no "Is Admin" flag. FR-031 states Admin role mechanism is TBD.
- **Resolution:** Dedicated admin login with separate credentials, NOT derived from worker data.
  - **POC:** Admin authenticates via a separate username/password stored in environment variables.
    - `ADMIN_USERNAME=rtoadmin`
    - `ADMIN_PASSWORD=<hashed-password>` (bcrypt hash stored in .env)
  - **Production:** Admin users identified by Okta user IDs stored in configuration.
  - The admin login endpoint is separate from the employee email-based login: `POST /api/auth/admin/login`.
  - Admin role grants access to the Upload screen (Screen 3). Admins do NOT have Employee/Manager views (they are a separate persona, not necessarily employees).
  - The `.env.example` file documents these variables; actual values are in `.env` (git-ignored per NFR-005).
- **Requirements Addressed:** FR-031, TR-009, TR-010, NFR-005
- **Design Impact:**
  - Two auth flows: employee (email-based lookup) and admin (username/password).
  - Auth middleware determines persona: Employee/Manager (from worker data) or Admin (from env credentials).
  - Admin sessions return `roles: ["admin"]` — no employee or manager views.
  - Remove `ADMIN_EMAILS` env var — replaced by `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

### Gap 2: Concurrent Dispute + Exception on Same Week — RESOLVED (Human Decision)

- **Issue:** The PRD does not clarify whether an employee can have both a badge dispute AND an exception pending on the same week simultaneously.
- **Resolution:** Allowed, but NOT on the same day within the week. Day-level tracking required.
  - An employee can have a badge dispute on one day and an exception on a different day within the same week.
  - Each action (exception, dispute, PTO) must specify which day(s) of the week it covers.
  - The **same day** within a week CANNOT have both a dispute and an exception — only different days.
  - The state machine resolves at the **week level** based on all day-level actions (see Gap 5 for the 5-state model).
  - Manager reviews each action independently in the drill-down view, seeing day-level detail.
- **Requirements Addressed:** BR-010, FR-007, FR-009, FR-017, FR-019, TR-004
- **Design Impact:**
  - **Day-level tracking:** The `exceptions`, `disputes`, and `pto_additions` tables each require a `target_date` (DATE) field specifying the day within the week the action covers.
  - **Validation constraint:** API must reject attempts to submit both a dispute and an exception for the same `target_date`.
  - **Submission UI:** Exception and dispute submission forms must include a day selector showing the days of the week (Mon–Sun). Employee selects which specific day(s) the action covers.
  - **Week-level state computation:** Derived from aggregating all day-level actions within the week.

### Gap 3: Re-Submission After Rejection — RESOLVED (Human Decision)

- **Issue:** The PRD does not specify whether an employee can re-submit an exception after a manager rejects it.
- **Resolution:** Yes, re-submission is allowed. Employee can submit a new exception for the same week after rejection.
  - The old exception record is preserved for audit trail (not deleted or overwritten).
  - A new exception record is created with a new timestamp — versioned history.
  - The week transitions from Red → Yellow (Exception Pending) again upon re-submission.
  - The manager sees the new exception explanation in the drill-down view.
  - The old rejected exception remains queryable for audit, marked as `rejected`.
  - The 5-week edit window (FR-010 / TR-012) still applies — re-submission only allowed on weeks within the window.
  - **State transition:** Red (after rejection) → Yellow (new exception submitted) is a valid transition.
- **Requirements Addressed:** FR-009, FR-010, BR-010, TR-004, TR-012
- **Design Impact:**
  - The `exceptions` table supports multiple records per employee+week+day, each with status (`pending`, `approved`, `rejected`) and a `version` field.
  - The compliance state is computed from the LATEST active exception/dispute record for each day.
  - The Submit Exception button is available on Red weeks (including previously-rejected Red weeks) within the 5-week window.
  - API endpoint: `POST /api/employees/{id}/weeks/{weekId}/exceptions` creates a new version, does not overwrite the old record.

### Gap 4: PTO Display and Workflow — RESOLVED (Human Decision)

- **Issue:** The PRD says employees can "Add PTO Days" but does not clarify how added PTO appears in the UI or whether it triggers any workflow.
- **Resolution:** PTO additions follow the SAME approval workflow as exceptions. PTO is NOT just informational.
  - When an employee adds PTO days, the target day(s) go Yellow (pending) and require manager approval to become Blue (Excused).
  - PTO additions are essentially another type of exception — they trigger the same approval flow.
  - **State machine:** Red → Yellow (PTO submitted) → Blue (manager approved) or Red (manager rejected).
  - The UI shows:
    - "Total PTO Requested" column: value from uploaded badge data (read-only, from Excel).
    - "Added PTO" column: PTO days the employee manually submitted (from `pto_additions` table), with pending/approved/rejected status.
  - Manager reviews PTO additions in the same approval workflow as exceptions and disputes.
  - This simplifies the state machine: exceptions, disputes, AND PTO submissions all trigger the same Yellow → approval flow.
- **Requirements Addressed:** FR-008, BR-011, FR-001, BR-010, TR-004
- **Design Impact:**
  - The `pto_additions` table gains: `status` (pending/approved/rejected), `reviewed_at`, `reviewer_id`, `rejection_note`, and `target_date` fields — same lifecycle as exceptions.
  - PTO submissions are treated as "actions" in the state machine alongside exceptions and disputes.
  - The compliance state computation must check all three action types (exceptions, disputes, PTO) for pending/approved status.
  - Manager drill-down view shows PTO additions alongside exceptions and disputes as actionable items.
  - **BR-011 is reinterpreted:** PTO alone does NOT change state (original requirement). But PTO submission creates a pending action requiring manager approval (new resolution). The net effect: PTO → Yellow → requires manager approval → Blue. Manager approval is still required.

### Gap 5: Dual Dispute + Exception State — 5-State Model — RESOLVED (Human Decision)

- **Issue:** If a week has both a pending badge dispute AND a pending exception, the compliance state and manager workflow need clarification.
- **Resolution:** Add a **5th compliance state** for weeks with multiple types of pending actions.
  - **5-State Compliance Model:**
    1. **Compliant (Green)** — Badge data "Meets 4-Day = Yes". Terminal state.
    2. **Excused (Blue)** — Manager approved at least one action (exception, dispute, or PTO). Terminal state.
    3. **Single Action Pending (Yellow)** — Exactly one TYPE of pending action (only exceptions, only disputes, OR only PTO — not multiple types).
    4. **Multiple Actions Pending (Orange)** — Two or more TYPES of pending actions on different days within the same week (e.g., dispute on Monday + exception on Wednesday).
    5. **Non-Compliant (Red)** — No compliance, no pending actions, no approved actions.

  - **Date selection required:** Exception, dispute, and PTO submission forms must require the employee to select which specific day(s) of the week the action covers.
  - **Same-day constraint:** The same day within a week CANNOT have both a dispute and an exception — only different days. (PTO can coexist with disputes on different days.)
  - **Week-level state computation (evaluated in order):**
    1. If badge data says "Meets 4-Day = Yes" → **Green (Compliant)**
    2. If ANY approved action exists (exception, dispute, or PTO approved) → **Blue (Excused)**
    3. If pending actions exist of 2+ different types → **Orange (Multiple Actions Pending)**
    4. If pending actions exist of exactly 1 type → **Yellow (Single Action Pending)**
    5. Otherwise → **Red (Non-Compliant)**

  - **Pie chart update:** The pie chart becomes 4 slices:
    - Green = Compliant
    - Blue = Excused
    - Yellow + Orange combined = Pending (both single and multi-action pending weeks counted together)
    - Red = Non-Compliant

- **Requirements Addressed:** BR-010, TR-004, FR-005, FR-017, FR-018, FR-019, FR-020
- **Design Impact:**
  - BR-010 is now a **5-state model** (was 4-state). This supersedes the original PRD definition.
  - The `compliance_state` enum: `compliant | excused | single_pending | multi_pending | non_compliant`.
  - State computation function takes as input: `meets4Day`, `exceptions[]`, `disputes[]`, `ptoAdditions[]` — each with `target_date` and `status`.
  - Color mapping updated: Green=#28a745, Blue=#007bff, Yellow=#ffc107, Orange=#fd7e14, Red=#dc3545.
  - Pie chart aggregation groups Yellow + Orange into "Pending" for a clean 4-slice chart.
  - Frontend needs distinct styling for Orange (Multiple Actions Pending) rows vs Yellow (Single Action Pending).

## 5.2 New Gaps Discovered During Design

### Gap 6: Manager Rejection Note Display to Employee

- **Issue:** FR-018 and FR-020 allow managers to add optional rejection notes. The requirements do not specify whether employees can see these notes.
- **Resolution Recommendation:** Show rejection notes to the employee on their Employee View when they view a rejected (Red) week that was previously Yellow. This provides transparency and helps the employee write a better re-submission (per Gap 3).
- **Design Impact:** The employee compliance detail API response should include rejection notes for rejected exceptions/disputes/PTO. The frontend displays the note in an expandable section on the rejected week row.
- **Status:** Recommended — needs product confirmation.

### Gap 7: Dispute Reason Text

- **Issue:** FR-007 says an employee can "dispute a badge count" but does not specify whether the employee must provide a reason/explanation (unlike exceptions which require explanation text per FR-009).
- **Resolution Recommendation:** Require a brief reason text for disputes, similar to exception explanations. This gives the manager context when reviewing the dispute.
- **Design Impact:** The `disputes` table includes a `reason` text field. The Submit Dispute UI includes a text input.
- **Status:** Recommended — needs product confirmation.

### Gap 8: Handling "On Leave" Status

- **Issue:** The RTO badge data includes an "On Leave" column (true/false), but neither the PRD nor the requirements specify how on-leave weeks should be treated.
- **Resolution Recommendation:** On-leave weeks should be treated as informational context. The compliance state still derives from "Meets 4-Day Requirement" field. If the employee was on leave and non-compliant, they can submit an exception explaining the leave. The "On Leave" value should be displayed in the weekly detail as context for managers reviewing exceptions.
- **Design Impact:** The `on_leave` field is stored in the compliance record and displayed in the UI, but it does not automatically affect the compliance state. It is informational.
- **Status:** Recommended — aligns with existing business rules (BR-011: only manager approval changes state).

### Gap 9: Worker Data Refresh Mechanism

- **Issue:** The requirements specify how badge data is uploaded (Excel upload by admin) but do not address how the worker/org hierarchy data is updated when employees join, leave, or change managers.
- **Resolution Recommendation:** Add a second upload type on the Admin screen for worker/org data refresh. Same append/upsert semantics: new workers are added, existing workers are updated, removed workers are soft-deleted (not hard-deleted, for audit trail).
- **Design Impact:** The Admin upload screen needs a selector for upload type (Badge Data vs. Worker/Org Data). Each type has its own parser (TR-005 vs TR-006). The worker data upload updates the `workers` table using email as the key.
- **Status:** Recommended — currently the worker data is loaded once at initialization. Without a refresh mechanism, the hierarchy becomes stale.

### Gap 10: Day-Level Action UI and Badge Data Granularity

- **Issue:** Badge data is uploaded at the WEEK level (Total Badge Swipe per week), but employee actions (exceptions, disputes, PTO) are now tracked at the DAY level (per Gap 2). The UI needs to bridge this granularity mismatch — employees select specific days for their actions, but badge data doesn't tell them which specific days they badged in.
- **Resolution Recommendation:** The day selector in the submission forms shows Mon-Fri of the week. The employee selects the day(s) their action covers based on their own knowledge (they know which day they were traveling, sick, etc.). Badge swipe data remains at the week level — it doesn't need day-level detail because the "Meets 4-Day Requirement" flag is the compliance determinant, not individual day counts.
- **Design Impact:** No change to badge data parsing. Day selector is a UI component that maps selected days to `target_date` fields in the database. Validation ensures selected dates fall within the week range.
- **Status:** Recommended — natural consequence of day-level tracking decision.

---

# Part 6: Requirements Traceability Matrix

## 6.1 Business Requirements (BR-001 through BR-012)

| Req ID | Requirement Title | Design Component(s) | Design Section | Status |
|--------|-------------------|---------------------|----------------|--------|
| BR-001 | Replace manual compliance tracking | Full application (all screens), Employee View, data upload pipeline | HLD: Component Architecture, DD: API Specs (Employee endpoints) | Covered |
| BR-002 | Improve manager visibility into team compliance | Manager Dashboard, Direct Reports API, Drill-down views | DD: API Specs (Manager endpoints), Component: ManagerService | Covered |
| BR-003 | Single source of truth for RTO data | Database schema (all tables), Upload pipeline, App-generated data persistence | DD: Data Model (all entities), DD: Upload Processing | Covered |
| BR-004 | Employee weekly engagement rate (70%) | Login analytics, session tracking | DD: API Specs (login endpoint logs), NFR-007 (structured logging) | Covered (measured via logs) |
| BR-005 | Manager exception review time (<48h) | Exception timestamps, approval timestamps | DD: Data Model (exceptions, approvals tables — timestamps enable measurement) | Covered (measured via timestamp diff) |
| BR-006 | Data completeness on upload | Upload processing with results summary, validation pipeline | DD: API Specs (upload endpoint), TR-016 (upload results) | Covered |
| BR-007 | Exclude contingent workers | Worker data parser, eligibility filter | DD: Component: DataImportService (CW filter), TR-006 | Covered |
| BR-008 | Exclude exempt (At Home) employees | Worker data parser, eligibility filter | DD: Component: DataImportService (location type filter), TR-006 | Covered |
| BR-009 | 4-day office compliance threshold | Compliance state computation from "Meets 4-Day Requirement" field | DD: Component: ComplianceService (state machine), TR-004 | Covered |
| BR-010 | 5-state compliance model (updated) | 5-state machine: Green/Yellow/Orange/Red/Blue | DD: ComplianceService, TR-004, Gap 5 resolution | Covered (expanded from 4-state to 5-state per Gap 5) |
| BR-011 | Manager approval required for state changes | Approval endpoints; PTO/exceptions/disputes all require approval | DD: API Specs (approve/reject), state machine, Gap 4 resolution | Covered (PTO now also requires approval) |
| BR-012 | Managers cannot self-approve | Self-approval prevention middleware | DD: Component: AuthorizationMiddleware, TR-011 | Covered |

## 6.2 Functional Requirements (FR-001 through FR-034)

| Req ID | Requirement Title | Design Component(s) | Design Section | Status |
|--------|-------------------|---------------------|----------------|--------|
| FR-001 | Employee weekly compliance table | Employee View component, `GET /api/employees/{id}/compliance` endpoint | DD: API Specs (Employee), DD: Component: EmployeeView | Covered |
| FR-002 | Default 13-week view | Query parameter `weeks=13` default, frontend state | DD: API Specs (Employee — default query param) | Covered |
| FR-003 | Expandable to 1 year of history | Query parameter `weeks=52`, frontend toggle | DD: API Specs (Employee — weeks param max=52) | Covered |
| FR-004 | Color-coded status rows (5 colors) | Compliance state field in API response, frontend CSS mapping for 5 states | DD: ComplianceService, Appendix (Color Reference — 5 colors) | Covered (updated for 5-state model) |
| FR-005 | 4-slice compliance pie chart (updated) | `GET /api/employees/{id}/compliance/summary` — 4 slices: Compliant/Excused/Pending/Non-Compliant | DD: API Specs (pie chart), TR-014 | Covered (Pending combines Yellow+Orange) |
| FR-006 | Pie chart synced with table date range | Shared `weeks` query parameter for table and summary endpoints | DD: API Specs (shared weeks param) | Covered |
| FR-007 | Dispute badge count (day-level) | `POST /api/employees/{id}/weeks/{weekId}/disputes` with `targetDate` | DD: API Specs (Disputes), DD: Data Model (disputes), Gap 2 | Covered (updated for day-level tracking) |
| FR-008 | Add PTO days (with approval workflow) | `POST /api/employees/{id}/weeks/{weekId}/pto` — triggers Yellow pending state | DD: API Specs (PTO), DD: Data Model (pto_additions), Gap 4 | Covered (PTO now requires manager approval) |
| FR-009 | Submit exception with explanation (day-level) | `POST /api/employees/{id}/weeks/{weekId}/exceptions` with `targetDate` | DD: API Specs (Exceptions), DD: Data Model (exceptions), Gap 3 | Covered (updated for day-level + re-submission) |
| FR-010 | 5-week edit window restriction | Server-side validation middleware, TR-012 | DD: Component: EditWindowValidator, TR-012 | Covered |
| FR-011 | Manager sees own employee view | Same Employee View endpoint, role-based UI rendering | DD: API Specs (Employee endpoints serve managers too) | Covered |
| FR-012 | Direct reports summary dashboard | `GET /api/managers/{id}/reports`, Manager Dashboard component | DD: API Specs (Manager), DD: Component: ManagerService | Covered |
| FR-013 | Filter direct reports by status | Query parameter `status=compliant|non-compliant|pending|multi-pending` | DD: API Specs (Manager — filter param) | Covered (updated for 5-state) |
| FR-014 | Drill into direct report detail | `GET /api/employees/{id}/compliance` (read-only for manager context) | DD: API Specs (Employee — manager accesses same endpoint) | Covered |
| FR-015 | View exception explanation text | Exception data included in compliance detail response | DD: API Specs (compliance detail includes exception text) | Covered |
| FR-016 | View badge dispute flag | Dispute flag included in compliance detail response | DD: API Specs (compliance detail includes dispute data) | Covered |
| FR-017 | Approve exception | `PUT /api/exceptions/{id}/approve` | DD: API Specs (Approval), DD: Component: ApprovalService | Covered |
| FR-018 | Reject exception with optional note | `PUT /api/exceptions/{id}/reject` with optional `note` body field | DD: API Specs (Rejection), Gap 6 | Covered |
| FR-019 | Approve badge dispute | `PUT /api/disputes/{id}/approve` | DD: API Specs (Dispute Approval) | Covered |
| FR-020 | Reject badge dispute with optional note | `PUT /api/disputes/{id}/reject` with optional `note` body field | DD: API Specs (Dispute Rejection), Gap 6 | Covered |
| FR-021 | Mandatory drill-down before approval | UI enforcement (no approve buttons on summary), TR-015 | DD: Component: ManagerView (no action buttons on summary) | Covered |
| FR-022 | Recursive org drill-down | `GET /api/managers/{id}/reports` works for any manager in hierarchy, TR-008 | DD: API Specs (Manager — recursive), DD: Component: HierarchyService | Covered |
| FR-023 | Breadcrumb navigation (Level 01-08) | Level columns from worker data, breadcrumb component | DD: API Specs (hierarchy path in response), TR-008 | Covered |
| FR-024 | Server-side self-approval prevention | Authorization middleware comparing actor ID to target employee ID, TR-011 | DD: Component: AuthorizationMiddleware | Covered |
| FR-025 | Excel file upload | `POST /api/admin/upload/badge-data`, file handling middleware | DD: API Specs (Upload), DD: Component: DataImportService | Covered |
| FR-026 | Append/upsert upload behavior | Upsert logic keyed on employee+week, TR-007 | DD: Component: DataImportService (upsert logic) | Covered |
| FR-027 | Preserve employee edits across uploads | Separate tables for app-generated data, upload only touches badge data | DD: Data Model (separate tables), TR-007, NFR-017 | Covered |
| FR-028 | Skip unmatched employees with warning | Worker data cross-reference during upload processing | DD: Component: DataImportService (validation step), TR-007 | Covered |
| FR-029 | Upload confirmation with results summary | Upload response payload with processing stats, TR-016 | DD: API Specs (Upload response schema) | Covered |
| FR-030 | Email-based authentication (employees) | `POST /api/auth/login` with email lookup, TR-009 | DD: API Specs (Auth), DD: Component: AuthService | Covered |
| FR-031 | Role determination from worker data + admin credentials | Employee/Manager from worker data; Admin via separate login (Gap 1) | DD: Component: AuthService (dual auth flow), Gap 1 | Covered (updated for dedicated admin login) |
| FR-032 | Parse RTO compliance Excel (12 columns) | Excel parser component, TR-005 | DD: Component: ExcelParser (badge data), TR-005 | Covered |
| FR-033 | Parse worker/org hierarchy data | Excel parser component for 35-column worker data, TR-006 | DD: Component: ExcelParser (worker data), TR-006 | Covered |
| FR-034 | Persist application-generated data | Database tables for exceptions, disputes, PTO, approvals, TR-003 | DD: Data Model (all app-generated tables) | Covered |

## 6.3 Technical Requirements (TR-001 through TR-017)

| Req ID | Requirement Title | Design Component(s) | Design Section | Status |
|--------|-------------------|---------------------|----------------|--------|
| TR-001 | Employee-Week Compliance Record | `compliance_weeks` table | DD: Data Model | Covered |
| TR-002 | Worker/Org Hierarchy Data Model | `workers` table with hierarchy fields | DD: Data Model | Covered |
| TR-003 | Application-Generated Data (day-level) | `exceptions`, `disputes`, `pto_additions` tables — all with `target_date` | DD: Data Model | Covered (updated for day-level tracking) |
| TR-004 | Compliance State Machine (5-state) | ComplianceService — 5-state computation from day-level actions | DD: Component Specs, Gap 5 resolution | Covered (expanded to 5-state) |
| TR-005 | Excel Parsing — RTO Badge Data | ExcelParser component (badge data mode) | DD: Component Specs | Covered |
| TR-006 | Excel Parsing — Worker/Org Data | ExcelParser component (worker data mode) | DD: Component Specs | Covered |
| TR-007 | Upload Append/Upsert Behavior | DataImportService upsert logic | DD: Component Specs | Covered |
| TR-008 | Org Hierarchy Tree | HierarchyService with recursive query | DD: Component Specs | Covered |
| TR-009 | Email-Based Auth (employees) + Admin Auth | AuthService: dual auth flow (email lookup + admin credentials) | DD: API Specs (Auth), Gap 1 | Covered (updated for dual auth) |
| TR-010 | Role-Based Access Control | AuthorizationMiddleware — Employee, Manager, Admin | DD: Component Specs (Security) | Covered |
| TR-011 | Self-Approval Prevention | AuthorizationMiddleware self-approval check | DD: Component Specs (Security) | Covered |
| TR-012 | 5-Week Edit Window | EditWindowValidator middleware | DD: Component Specs | Covered |
| TR-013 | RESTful API Design | All API endpoints defined in DD | DD: API Specifications (all) | Covered |
| TR-014 | Pie Chart Data Computation (4-slice) | ComplianceService summary — Compliant/Excused/Pending/Non-Compliant | DD: API Specs (summary endpoint) | Covered (Pending = Yellow+Orange) |
| TR-015 | Manager Drill-Down Enforcement | UI-level enforcement (no buttons on summary view) | DD: Component Specs (ManagerView) | Covered |
| TR-016 | Upload Processing Results | Upload response schema with stats | DD: API Specs (Upload response) | Covered |
| TR-017 | Local Development Environment | Local setup instructions, embedded DB, local server | DD: Local Development Setup | Covered |

## 6.4 Non-Functional Requirements (NFR-001 through NFR-018)

| Req ID | Requirement Title | Design Component(s) | Design Section | Status |
|--------|-------------------|---------------------|----------------|--------|
| NFR-001 | Authentication Security | Dual auth: email lookup (employees) + username/password (admin); JWT sessions | DD: Security Architecture, Gap 1 | Covered (updated for dual auth) |
| NFR-002 | Authorization Enforcement at API Layer | AuthorizationMiddleware, role checking, audit logging | DD: Security Architecture, Component: AuthMiddleware | Covered |
| NFR-003 | PII Protection in Logs | Logging utility with PII masking, redaction patterns | DD: Observability Design (Logging) | Covered |
| NFR-004 | PII Protection in URLs | Opaque UUIDs in all API paths, no PII in query params | DD: API Specs (all use UUID paths) | Covered |
| NFR-005 | Secrets Management (Local) | `.env` file (git-ignored), env var loading at startup | DD: Configuration Management | Covered |
| NFR-006 | Input Validation — File Uploads | File validation pipeline (extension, content, columns, types), XSS sanitization | DD: Component: DataImportService, InputSanitizer | Covered |
| NFR-007 | Structured JSON Logging | Logger configured for JSON, standard fields | DD: Observability Design (Logging) | Covered |
| NFR-008 | Correlation IDs | Middleware to generate/propagate X-Correlation-ID | DD: Observability Design (Correlation IDs) | Covered |
| NFR-009 | Health Check Endpoint | `GET /health` and `GET /ready` endpoints | DD: API Specs (Health), Observability Design | Covered |
| NFR-010 | Structured Error Responses | Error handler middleware, standard error schema | DD: Error Handling Strategy | Covered |
| NFR-011 | Employee View Performance (<2s) | Database indexing (employee_id + week), query optimization | DD: Data Model (indexes), Performance section | Covered |
| NFR-012 | Manager Dashboard Performance (<3s) | Indexed queries on manager_email, pre-computed report counts | DD: Data Model (indexes), Performance section | Covered |
| NFR-013 | Upload Processing Performance (<30s) | Batch insert/upsert operations, transaction management | DD: Component: DataImportService (batch processing) | Covered |
| NFR-014 | Concurrent User Support (50 users) | Connection pooling, stateless API design | DD: Architecture (stateless API) | Covered |
| NFR-015 | Test Coverage (80%) | Test framework configuration, coverage reporting | DD: Local Development Setup (test toolchain) | Covered |
| NFR-016 | Code Quality Standards | Linter and formatter configuration | DD: Local Development Setup (linting/formatting) | Covered |
| NFR-017 | Data Integrity — Upload Preservation | Separate tables for app-generated data, upload-safe upsert logic | DD: Data Model (separation), TR-007 | Covered |
| NFR-018 | Basic Web Accessibility | Semantic HTML, text labels on 5 colors, keyboard navigation, contrast | DD: Component Specs (Frontend) | Covered (updated for 5 color states) |

## 6.5 Coverage Summary

| Category | Total | Covered | Partially Covered | Not Covered |
|----------|-------|---------|-------------------|-------------|
| Business (BR) | 12 | 12 | 0 | 0 |
| Functional (FR) | 34 | 34 | 0 | 0 |
| Technical (TR) | 17 | 17 | 0 | 0 |
| Non-Functional (NFR) | 18 | 18 | 0 | 0 |
| **Total** | **81** | **81** | **0** | **0** |

All 81 requirements are covered by the design. Gaps 1-5 (from requirements phase) are fully resolved with human-confirmed design decisions. Gaps 6-10 (newly discovered during design) are documented as recommendations for product confirmation.

**Key design changes from gap resolutions:**
- BR-010 expanded from 4-state to **5-state** compliance model (Gap 5)
- Day-level action tracking added for exceptions, disputes, and PTO (Gap 2)
- PTO additions now require manager approval workflow (Gap 4)
- Admin authentication is a separate credential-based flow (Gap 1)
- Exception re-submission after rejection is supported with version history (Gap 3)

---

# Part 7: Appendix

## A. Glossary of Terms

| Term | Definition |
|------|-----------|
| **Compliant (Green)** | An employee-week where "Meets 4-Day Requirement" = "Yes" from badge data. Terminal state — no actions possible. |
| **Non-Compliant (Red)** | An employee-week where "Meets 4-Day Requirement" = "No" and no approved or pending actions exist. |
| **Single Action Pending (Yellow)** | An employee-week where exactly one TYPE of pending action exists (only exceptions, only disputes, OR only PTO — not multiple types). Counts as "Pending" in the pie chart. |
| **Multiple Actions Pending (Orange)** | An employee-week where two or more TYPES of pending actions exist on different days within the same week (e.g., dispute on Monday + exception on Wednesday). Counts as "Pending" in the pie chart. |
| **Excused (Blue)** | An employee-week where a manager has approved at least one action (exception, dispute, or PTO). Terminal state — distinct from Compliant. |
| **CW (Contingent Worker)** | A non-employee worker type excluded from all RTO compliance tracking. |
| **At Home** | Work Location Type indicating an employee is exempt from RTO requirements (works remotely full-time). |
| **Badge Swipe** | A record of an employee physically entering the office via badge reader. Total count per week determines compliance. |
| **Exception** | An employee-submitted explanation for a non-compliant day within a week (e.g., business travel, illness). Triggers Yellow/Orange state pending manager review. Must specify the target day. |
| **Dispute** | An employee-initiated flag indicating they believe their badge swipe count is incorrect for a specific day. Flagged for manager review. Must specify the target day. Cannot be on the same day as an exception. |
| **PTO (Paid Time Off)** | Days the employee was on approved time off. Can be recorded by the system (from upload data) or manually added by the employee. |
| **Added PTO** | PTO days manually submitted by the employee. Triggers the same approval workflow as exceptions — goes Yellow (pending) and requires manager approval to become Blue (Excused). Must specify the target day(s). |
| **Target Date** | The specific day within a week that an action (exception, dispute, PTO) covers. Required for all employee submissions. Enables day-level tracking and the same-day constraint. |
| **Same-Day Constraint** | A validation rule: the same day within a week cannot have both a dispute and an exception. Exceptions and disputes must cover different days. |
| **Drill-Down** | The action of a manager clicking into a direct report's detail view to see their weekly compliance table. Required before approval/rejection. |
| **Breadcrumb** | Navigation trail showing the org hierarchy path (Level 01 through Level 08) as the manager drills into nested teams. |
| **Upsert** | Upload behavior: insert new records, update existing records for the same employee+week combination. |
| **Correlation ID** | A UUID attached to every HTTP request that flows through all logs and responses for request tracing. |
| **RBAC** | Role-Based Access Control — authorization model with three roles: Employee, Manager, Admin/HR. |
| **Edit Window** | The 5 most recent weeks during which employees can take actions (submit exceptions, add PTO, dispute badge counts). |
| **Org Hierarchy** | The management reporting structure defined by the Manager column in worker data, forming a parent-child tree up to 8 levels deep. |
| **POC** | Proof of Concept — this initial version of the RTO Compliance Tracker, running locally with email-based auth for employees and credential-based auth for admins. |
| **Version (Exception)** | Each re-submission of an exception for the same employee+week+day creates a new version. Prior versions are preserved for audit. The latest version determines the active state. |

## B. Compliance State Machine (5-State Model)

```
                    ┌──────────────────────────────────────────────────────┐
                    │       5-STATE COMPLIANCE STATE MACHINE                │
                    │   (Day-level actions, Week-level state)               │
                    └──────────────────────────────────────────────────────┘

     ┌─────────────────────────────────────────────────────────────────────┐
     │ ENTRY: Badge data uploaded for employee+week                        │
     └─────────────────────────┬───────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Meets 4-Day = "Yes"? │
                    └──────────┬──────────┘
                       Yes │         │ No
                           │         │
              ┌────────────▼──┐  ┌───▼─────────────────────────────────┐
              │  COMPLIANT    │  │  NON-COMPLIANT (Red)                 │
              │  (Green)      │  │                                      │
              │               │  │  Employee actions (within 5-wk       │
              │  Terminal     │  │  window, must select target day):    │
              │  state — no   │  │                                      │
              │  actions      │  │  ┌─────────────┐ ┌──────────────┐   │
              │  possible     │  │  │ Submit      │ │ Dispute      │   │
              └───────────────┘  │  │ Exception   │ │ Badge Count  │   │
                                 │  │ (day X)     │ │ (day Y≠X)    │   │
                                 │  └──────┬──────┘ └──────┬───────┘   │
                                 │         │               │           │
                                 │  ┌──────┴───┐  ┌───────┴──────┐    │
                                 │  │ Add PTO  │  │ Same-day     │    │
                                 │  │ (day Z)  │  │ constraint:  │    │
                                 │  └──────┬───┘  │ day X ≠ day Y│    │
                                 │         │      └──────────────┘    │
                                 └─────────┼──────────────────────────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
              Only 1 action type    2+ action types    PTO submitted
              submitted             on diff days       (same as exception)
                        │                  │                  │
                        ▼                  ▼                  ▼
           ┌──────────────────┐  ┌────────────────────┐  (routes to
           │ SINGLE ACTION    │  │ MULTIPLE ACTIONS    │   Yellow or
           │ PENDING (Yellow) │  │ PENDING (Orange)    │   Orange)
           │                  │  │                     │
           │ One type of      │  │ 2+ types of         │
           │ pending action   │  │ pending actions     │
           │ (exception only, │  │ on different days   │
           │ dispute only,    │  │ within the week     │
           │ or PTO only)     │  │                     │
           └────────┬─────────┘  └────────┬────────────┘
                    │                     │
                    └──────────┬──────────┘
                               │
                    Manager reviews each action
                    independently in drill-down
                               │
              ┌────────────────┼────────────────┐
              │                                 │
     ┌────────▼────────┐              ┌─────────▼─────────┐
     │  ANY APPROVED   │              │  ALL REJECTED      │
     │  (at least one  │              │  (every pending    │
     │   action        │              │   action rejected) │
     │   approved)     │              │                    │
     └────────┬────────┘              └─────────┬──────────┘
              │                                 │
     ┌────────▼────────┐              ┌─────────▼──────────┐
     │  EXCUSED (Blue) │              │  NON-COMPLIANT     │
     │                 │              │  (Red)              │
     │  Terminal       │              │                     │
     │  state          │              │  Employee may       │
     └─────────────────┘              │  re-submit on any   │
                                      │  rejected day       │
                                      │  (within 5-week     │
                                      │   window)           │
                                      │  → Yellow or Orange │
                                      └────────────────────┘

  5-STATE PRIORITY RESOLUTION (week level, evaluated in order):
  ┌──────────────────────────────────────────────────────────────┐
  │  1. Green:  Meets 4-Day = Yes (overrides everything)         │
  │  2. Blue:   ANY approved action exists on any day            │
  │  3. Orange: Pending actions of 2+ different TYPES exist      │
  │  4. Yellow: Pending actions of exactly 1 TYPE exist          │
  │  5. Red:    Default (no compliance, no pending, no approved) │
  └──────────────────────────────────────────────────────────────┘

  PIE CHART MAPPING (4 slices):
  ┌──────────────────────────────────────────────────────────────┐
  │  Green slice  = Compliant weeks (Green state)                │
  │  Blue slice   = Excused weeks (Blue state)                   │
  │  Yellow slice = Pending weeks (Yellow + Orange combined)     │
  │  Red slice    = Non-Compliant weeks (Red state)              │
  └──────────────────────────────────────────────────────────────┘
```

### State Transition Table

| Current State | Trigger | New State | Actor | Conditions |
|---------------|---------|-----------|-------|------------|
| Red | Employee submits exception (day X) | Yellow | Employee | Week within 5-week window; day X has no existing dispute |
| Red | Employee disputes badge count (day Y) | Yellow | Employee | Week within 5-week window; day Y has no existing exception |
| Red | Employee submits PTO (day Z) | Yellow | Employee | Week within 5-week window |
| Yellow | Employee submits 2nd action TYPE on different day | Orange | Employee | Different day; different action type; same-day constraint enforced |
| Orange | Manager approves any one action | Blue | Manager | Manager ≠ employee (self-approval blocked) |
| Yellow | Manager approves the pending action | Blue | Manager | Manager ≠ employee |
| Yellow | Manager rejects the pending action | Red | Manager | No other pending/approved actions on any day |
| Orange | Manager rejects one action (other still pending) | Yellow | Manager | Only one type of pending action remains |
| Orange | Manager rejects all actions | Red | Manager | No remaining pending or approved actions |
| Red (rejected) | Employee re-submits exception on same day | Yellow | Employee | Week still within 5-week window; creates new version |
| Red (rejected) | Employee submits new action on different day | Yellow or Orange | Employee | Depends on whether other pending actions exist |
| Green | — | — | — | Terminal state — no transitions possible |
| Blue | — | — | — | Terminal state — no transitions possible |

### Same-Day Constraint Examples

| Day | Exception | Dispute | PTO | Valid? |
|-----|-----------|---------|-----|--------|
| Monday | Yes | No | No | Valid |
| Monday | No | Yes | No | Valid |
| Monday | Yes | Yes | No | **INVALID** — same day |
| Monday | Yes | No | Yes | Valid (different action types, same day allowed for exception+PTO) |
| Monday (exc) + Tuesday (dispute) | — | — | — | Valid — different days |

**Note:** The same-day constraint only applies between disputes and exceptions. PTO can coexist on the same day as either.

## C. Sample API Request/Response Examples

### C.1 Employee Login (Email-Based Authentication)

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "isabelle.gonn@nordstrom.com"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Isabelle Gonn",
    "roles": ["employee"],
    "isManager": false
  },
  "expiresIn": 28800
}
```

**Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "AUTH_USER_NOT_FOUND",
    "message": "No account found for this email address.",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### C.1b Admin Login (Credential-Based Authentication)

**Request:**
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "rtoadmin",
  "password": "admin-password-here"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "name": "RTO Admin",
    "roles": ["admin"]
  },
  "expiresIn": 28800
}
```

**Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid admin username or password.",
    "correlationId": "550e8400-e29b-41d4-a716-446655440099"
  }
}
```

### C.2 Get Employee Compliance Data

**Request:**
```http
GET /api/employees/a1b2c3d4-e5f6-7890-abcd-ef1234567890/compliance?weeks=13
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "employee": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Isabelle Gonn",
    "location": "865 CORPORATE TOWER II",
    "workLocationType": "Hybrid"
  },
  "weeks": [
    {
      "id": "w-2026-09",
      "weekRange": "02/23/2026 - 03/01/2026",
      "badgeSwipes": 4,
      "totalPtoRequested": 0,
      "meets4Day": true,
      "state": "compliant",
      "onLeave": false,
      "actions": [],
      "editable": true
    },
    {
      "id": "w-2026-08",
      "weekRange": "02/16/2026 - 02/22/2026",
      "badgeSwipes": 2,
      "totalPtoRequested": 1,
      "meets4Day": false,
      "state": "multi_pending",
      "onLeave": false,
      "actions": [
        {
          "id": "exc-001",
          "type": "exception",
          "targetDate": "2026-02-18",
          "explanation": "Business travel to Seattle distribution center",
          "status": "pending",
          "submittedAt": "2026-02-23T10:30:00Z",
          "version": 1
        },
        {
          "id": "dsp-001",
          "type": "dispute",
          "targetDate": "2026-02-20",
          "reason": "Badge reader was not working at Tower II entrance",
          "status": "pending",
          "submittedAt": "2026-02-23T11:00:00Z"
        }
      ],
      "editable": true
    },
    {
      "id": "w-2026-07",
      "weekRange": "02/09/2026 - 02/15/2026",
      "badgeSwipes": 1,
      "totalPtoRequested": 0,
      "meets4Day": false,
      "state": "non_compliant",
      "onLeave": false,
      "actions": [],
      "editable": true
    }
  ],
  "summary": {
    "compliant": 8,
    "excused": 1,
    "pending": 2,
    "nonCompliant": 2,
    "total": 13
  }
}
```

### C.3 Submit Exception (with Day Selection)

**Request:**
```http
POST /api/employees/a1b2c3d4-e5f6-7890-abcd-ef1234567890/weeks/w-2026-07/exceptions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "targetDate": "2026-02-11",
  "explanation": "I was sick with the flu and worked from home."
}
```

**Response (201 Created):**
```json
{
  "exception": {
    "id": "exc-002",
    "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "weekId": "w-2026-07",
    "targetDate": "2026-02-11",
    "explanation": "I was sick with the flu and worked from home.",
    "status": "pending",
    "version": 1,
    "submittedAt": "2026-03-07T14:22:00Z"
  },
  "weekState": "single_pending"
}
```

**Response (400 Bad Request — outside edit window):**
```json
{
  "error": {
    "code": "EDIT_WINDOW_CLOSED",
    "message": "This week is outside the 5-week edit window. Only the 5 most recent weeks can be modified.",
    "correlationId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

**Response (409 Conflict — same-day constraint):**
```json
{
  "error": {
    "code": "SAME_DAY_CONFLICT",
    "message": "A badge dispute already exists for 2026-02-11. An exception and dispute cannot cover the same day.",
    "correlationId": "660e8400-e29b-41d4-a716-446655440004"
  }
}
```

### C.4 Manager Approves Exception

**Request:**
```http
PUT /api/exceptions/exc-002/approve
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (manager token)
```

**Response (200 OK):**
```json
{
  "approval": {
    "id": "appr-001",
    "exceptionId": "exc-002",
    "managerId": "m-5678-abcd",
    "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "weekId": "w-2026-07",
    "targetDate": "2026-02-11",
    "action": "exception_approved",
    "approvedAt": "2026-03-07T16:45:00Z"
  },
  "weekState": "excused"
}
```

**Response (403 Forbidden — self-approval attempt):**
```json
{
  "error": {
    "code": "SELF_APPROVAL_DENIED",
    "message": "Managers cannot approve their own exceptions. This request must be reviewed by your manager.",
    "correlationId": "770e8400-e29b-41d4-a716-446655440002"
  }
}
```

### C.5 Admin Uploads Badge Data File

**Request:**
```http
POST /api/admin/upload/badge-data
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (admin token)
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="RTO_Week10_2026.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

<binary file data>
--boundary--
```

**Response (200 OK):**
```json
{
  "upload": {
    "id": "upload-003",
    "filename": "RTO_Week10_2026.xlsx",
    "processedAt": "2026-03-07T09:00:15Z",
    "results": {
      "totalRows": 4264,
      "newRecords": 328,
      "updatedRecords": 3920,
      "skippedRecords": 16,
      "warnings": [
        {
          "type": "EMPLOYEE_NOT_FOUND",
          "message": "Employee not found in worker data — skipped 4 rows",
          "affectedRows": [102, 415, 728, 1041]
        }
      ]
    },
    "processingTimeMs": 8432
  }
}
```

**Response (400 Bad Request — invalid file):**
```json
{
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Missing required columns: 'Meets 4-Day Requirement', 'Total Badge Swipe'. Expected 12 columns per RTO data specification.",
    "correlationId": "880e8400-e29b-41d4-a716-446655440003"
  }
}
```

## D. Color Code Reference (5-State Model)

| State | Color Name | Hex Code | RGB | Usage |
|-------|-----------|----------|-----|-------|
| Compliant | Green | `#28a745` | rgb(40, 167, 69) | Table row background, pie chart slice |
| Single Action Pending | Yellow | `#ffc107` | rgb(255, 193, 7) | Table row background, counted as "Pending" in pie chart |
| Multiple Actions Pending | Orange | `#fd7e14` | rgb(253, 126, 20) | Table row background, counted as "Pending" in pie chart |
| Non-Compliant | Red | `#dc3545` | rgb(220, 53, 69) | Table row background, pie chart slice |
| Excused | Blue | `#007bff` | rgb(0, 123, 255) | Table row background, pie chart slice |

**Pie Chart Color Mapping (4 slices):**
| Pie Slice | Includes States | Color |
|-----------|----------------|-------|
| Compliant | Green | `#28a745` |
| Excused | Blue | `#007bff` |
| Pending | Yellow + Orange | `#ffc107` (Yellow) |
| Non-Compliant | Red | `#dc3545` |

**Accessibility Note (NFR-018):** All color-coded statuses must also display a text label ("Compliant", "Pending", "Multiple Pending", "Non-Compliant", "Excused") so that color is not the sole indicator. Color contrast meets WCAG 2.1 AA minimum ratios when used with white text on these backgrounds.

## E. Data Relationship Diagram (Updated for Day-Level Tracking)

```
  ┌─────────────────────┐        ┌──────────────────────────┐
  │ workers              │        │ compliance_weeks          │
  ├─────────────────────┤        ├──────────────────────────┤
  │ id (UUID) PK         │───┐   │ id (UUID) PK              │
  │ worker_name          │   │   │ worker_id (FK → workers)   │◄─┐
  │ email                │   │   │ week_start (DATE)          │  │
  │ manager_email (FK)   │   │   │ week_end (DATE)            │  │
  │ is_manager           │   │   │ badge_swipes (INT)         │  │
  │ worker_type          │   │   │ pto_requested (INT)        │  │
  │ work_location_type   │   │   │ meets_4_day (BOOL)         │  │
  │ location             │   │   │ on_leave (BOOL)            │  │
  │ level_01..level_08   │   │   │ et_org, elg_org, sup_org   │  │
  │ num_direct_reports   │   │   │ uploaded_at (TIMESTAMP)    │  │
  └─────────────────────┘   │   └──────────────────────────┘  │
                             │                                  │
                             │   ┌──────────────────────────┐  │
                             │   │ exceptions                │  │
                             │   ├──────────────────────────┤  │
                             │   │ id (UUID) PK              │  │
                             ├──►│ employee_id (FK→workers)  │  │
                             │   │ week_id (FK→comp_weeks)   │──┘
                             │   │ target_date (DATE) *NEW*  │
                             │   │ explanation (TEXT)         │
                             │   │ status (pending/approved/ │
                             │   │         rejected)         │
                             │   │ version (INT) *NEW*       │
                             │   │ submitted_at (TIMESTAMP)  │
                             │   │ reviewed_at (TIMESTAMP)   │
                             │   │ reviewer_id (FK→workers)  │
                             │   │ rejection_note (TEXT)      │
                             │   └──────────────────────────┘
                             │   UNIQUE: (employee_id, week_id,
                             │            target_date, version)
                             │
                             │   ┌──────────────────────────┐
                             │   │ disputes                  │
                             │   ├──────────────────────────┤
                             │   │ id (UUID) PK              │
                             ├──►│ employee_id (FK→workers)  │
                             │   │ week_id (FK→comp_weeks)   │
                             │   │ target_date (DATE) *NEW*  │
                             │   │ reason (TEXT)              │
                             │   │ status (pending/approved/ │
                             │   │         rejected)         │
                             │   │ submitted_at (TIMESTAMP)  │
                             │   │ reviewed_at (TIMESTAMP)   │
                             │   │ reviewer_id (FK→workers)  │
                             │   │ rejection_note (TEXT)      │
                             │   └──────────────────────────┘
                             │   CONSTRAINT: No exception on
                             │   same (employee_id, week_id,
                             │   target_date)
                             │
                             │   ┌──────────────────────────┐
                             │   │ pto_additions             │
                             │   ├──────────────────────────┤
                             │   │ id (UUID) PK              │
                             └──►│ employee_id (FK→workers)  │
                                 │ week_id (FK→comp_weeks)   │
                                 │ target_date (DATE) *NEW*  │
                                 │ days_added (INT)           │
                                 │ status (pending/approved/  │
                                 │         rejected) *NEW*    │
                                 │ submitted_at (TIMESTAMP)   │
                                 │ reviewed_at (TIMESTAMP)    │
                                 │   *NEW*                    │
                                 │ reviewer_id (FK→workers)   │
                                 │   *NEW*                    │
                                 │ rejection_note (TEXT) *NEW* │
                                 └──────────────────────────┘

  KEY CHANGES FROM v1:
  - All action tables now have target_date (DATE) for day-level tracking
  - exceptions table has version (INT) for re-submission support
  - pto_additions gains status, reviewed_at, reviewer_id, rejection_note
    (PTO now follows same approval workflow as exceptions)
  - Cross-table constraint: disputes.target_date ≠ exceptions.target_date
    for same (employee_id, week_id)
```

## F. Environment Variables Reference (Updated for Dedicated Admin Login)

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `DATABASE_URL` | Database connection string | `sqlite:///rto_compliance.db` | Yes |
| `SESSION_SECRET` | JWT/session signing key | (random 256-bit string) | Yes |
| `ADMIN_USERNAME` | Admin login username | `rtoadmin` | Yes |
| `ADMIN_PASSWORD` | Admin login password (bcrypt hash) | `$2b$12$...` | Yes |
| `SESSION_TIMEOUT` | Session expiry in seconds | `28800` (8 hours) | No (default: 28800) |
| `LOG_LEVEL` | Logging verbosity | `info` | No (default: info) |
| `PORT` | Application port | `3000` | No (default: 3000) |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` | No (default: localhost) |

**Removed:** `ADMIN_EMAILS` — replaced by `ADMIN_USERNAME` / `ADMIN_PASSWORD` per Gap 1 resolution.
