# Execution Plan: RTO Compliance Tracker

## Executive Summary

The RTO Compliance Tracker replaces Nordstrom's manual Excel-based Return-to-Office tracking with a self-service web application for employees, managers, and HR admins. The system implements a 5-state compliance model with day-level action tracking, org hierarchy drill-down, and exception/dispute approval workflows.

**Total scope:** 85 requirements (12 BR, 37 FR, 18 TR, 18 NFR)
**Phases:** 4 (Phase 0 Bootstrap + 3 milestone phases)
**Work packages:** 26
**Sprints:** 5 (2-week sprints, 10 weeks total)
**Tech stack:** React 18 + TypeScript + Vite | Python 3.11+ FastAPI | SQLite WAL | SQLAlchemy 2.0, Alembic, PyJWT, structlog, openpyxl, Recharts, Tailwind CSS
**Deployment:** Local only — no CI/CD, no containers, no cloud

---

## Phase 0: Project Bootstrap (Sprint 1)

**Milestone:** Development environment operational, database schema deployed, auth working, middleware stack in place, sample data loaded.

### WP-0.1: Monorepo Scaffold & Toolchain

- **Description:** Create the monorepo structure with `frontend/` (React 18 + TypeScript + Vite) and `backend/` (Python 3.11+ FastAPI). Configure build tools, linters (ruff, ESLint, Prettier), formatters, test frameworks (pytest + httpx, vitest + testing-library), and a root Makefile with convenience commands (`make run`, `make test`, `make lint`). Create `.env.example`, `.gitignore`, `README.md` with setup instructions.
- **Requirements:** TR-017 (local dev environment), NFR-016 (code quality standards)
- **Design Components:** AD-001 (monorepo structure), Section 6 (local dev setup)
- **Dependencies:** None (first WP)
- **Effort:** S (1 day)
- **Sprint:** 1
- **Exit Criteria:**
  - `frontend/`: `npm run dev` starts Vite on :5173
  - `backend/`: `uvicorn app.main:app --reload` starts FastAPI on :8000
  - `make test` runs (empty) test suites for both
  - `ruff check .` and `npm run lint` pass with zero errors

### WP-0.2: Database Schema & Alembic Migrations

- **Description:** Define all 7 SQLAlchemy models (workers, compliance_records, day_actions, exceptions, disputes, approvals, upload_log) and generate Alembic migration scripts. Enable WAL mode, foreign key enforcement, and busy timeout. Create initial migration that builds the full schema. All tables include UUID primary keys and timestamp columns.
- **Requirements:** TR-001 (employee-week record + day-level tracking), TR-002 (worker/org hierarchy), TR-003 (application-generated data — versioned, day-level)
- **Design Components:** Data model (design-inventory.md Section 2), AD-004 (SQLite WAL), AD-006 (5-state + day-level)
- **Dependencies:** WP-0.1
- **Effort:** M (2 days)
- **Sprint:** 1
- **Exit Criteria:**
  - `alembic upgrade head` creates `rto_compliance.db` with all 7 tables
  - Foreign key constraints enforced (PRAGMA foreign_keys=ON)
  - WAL mode enabled
  - `alembic downgrade base` and `alembic upgrade head` round-trip clean
  - Unit tests verify model relationships and constraints

### WP-0.3: Authentication Foundation (Dual Path)

- **Description:** Implement dual authentication: (1) Employee/Manager email lookup via `POST /api/auth/login` — looks up worker record by email, determines role from `is_manager` flag, filters CW and At Home workers; (2) Admin login via `POST /api/auth/admin` — verifies against `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `.env`. Both paths issue JWT tokens with role, sub, auth_type, expiration (8h default). JWT validation middleware on all protected endpoints.
- **Requirements:** TR-009 (email-based auth), TR-010 (RBAC), NFR-001 (auth security), NFR-005 (secrets management), FR-030 (email-based auth + admin auth), FR-031 (role determination)
- **Design Components:** AD-005 (JWT dual auth), AD-008 (dedicated admin login), Auth Middleware (1.1.1), RBAC Middleware (1.1.2), Security Model (design-ops.md Section 1)
- **Dependencies:** WP-0.1, WP-0.2
- **Effort:** M (2–3 days)
- **Sprint:** 1
- **Exit Criteria:**
  - Employee login: valid email → JWT with role=employee or role=manager; invalid/CW/AtHome email → 401
  - Admin login: correct credentials → JWT with role=admin; wrong credentials → 401
  - Protected endpoints return 401 without token, 403 with wrong role
  - JWT expiration enforced; expired token → 401
  - Secrets read from `.env` only (not in source code)
  - Tests cover both auth paths, role assignment, and edge cases

### WP-0.4: Core Middleware Stack (Correlation IDs, Logging, PII Masking, Error Handling)

- **Description:** Implement middleware chain: (1) Correlation ID middleware — generates UUID for `X-Correlation-ID` if absent, propagates if present, attaches to response header; (2) Structured JSON logging with structlog — timestamp, level, message, service, correlationId in every line; (3) PII masking processor — masks employee names, emails, badge data in all log output; (4) Global error handler — structured error responses `{error: {code, message, correlationId}}`, no stack traces in responses, full details in server logs.
- **Requirements:** NFR-007 (structured JSON logging), NFR-008 (correlation IDs), NFR-003 (PII in logs), NFR-004 (PII in URLs), NFR-010 (structured error responses), NFR-002 (authorization audit logging)
- **Design Components:** Correlation ID Middleware (1.1.3), PII Masking Middleware (1.1.4), Error Handler (1.1.5), Observability (design-ops.md Section 2)
- **Dependencies:** WP-0.1
- **Effort:** M (2 days)
- **Sprint:** 1
- **Exit Criteria:**
  - Every log line is valid JSON with required fields
  - Correlation ID appears in every request/response/log
  - No PII (names, emails) appears in any log output
  - Error responses are structured JSON without internal details
  - Tests verify PII masking, correlation propagation, and error format

### WP-0.5: Health Check Endpoints

- **Description:** Implement `GET /health` (returns 200 `{status: "healthy"}` if process running) and `GET /ready` (returns 200 `{status: "ready"}` if DB connected, 503 `{status: "not ready"}` if not). Both endpoints are unauthenticated.
- **Requirements:** NFR-009 (health check endpoints)
- **Design Components:** Health endpoints (design-ops.md Section 2.4)
- **Dependencies:** WP-0.1, WP-0.2
- **Effort:** S (0.5 day)
- **Sprint:** 1
- **Exit Criteria:**
  - `/health` returns 200 when server is running
  - `/ready` returns 200 when DB is connected, 503 when disconnected
  - No auth required for either endpoint
  - Tests cover both healthy and unhealthy states

### WP-0.6: Sample Data Seeding

- **Description:** Create a `seed` command (or script) that loads both sample Excel files into the database: (1) `tech_workers_with_manager_email.xlsx` → workers table (783 rows, with CW/AtHome filtering); (2) `RTO_Sample.xlsx` → compliance_records table (4 rows sample). Use the same parsing logic that will later power the upload API (shared code). Generate additional synthetic compliance data for all eligible employees across 13 weeks for development/demo purposes.
- **Requirements:** BR-006 (data completeness on upload), BR-007 (exclude CW), BR-008 (exclude At Home)
- **Design Components:** Data model (design-inventory.md Section 2), Excel parsing (AD-007)
- **Dependencies:** WP-0.2
- **Effort:** M (2 days)
- **Sprint:** 1
- **Exit Criteria:**
  - `make seed` loads worker data and sample compliance data
  - Workers table has 783 records; eligible employees (~328) flagged correctly
  - CW (455) and At Home (280) workers excluded from compliance tracking
  - Synthetic 13-week data generated for development use
  - Seed is idempotent (can re-run safely)

---

## Phase 1: Employee View + Data Upload (Sprint 2) — Milestone M1

**Milestone:** Employees can log in, view their weekly compliance table and pie chart. Admins can upload Excel files. End-to-end data flow from upload to display.

### WP-1.1: Excel Parsing Engine (RTO Badge Data + Worker/Org Data)

- **Description:** Implement reusable Excel parsing services: (1) RTO badge data parser — validates 12 required columns, coerces types, parses date ranges ("MM/DD/YYYY - MM/DD/YYYY"), skips malformed rows with warnings; (2) Worker/Org parser — extracts key fields (Worker, Email-Work, Manager, Manager E-mail, Is Manager, Worker Type, Work Location Type, Level 01–08), filters CW and At Home. Both parsers return structured results with validation errors and warnings. Input validation: .xlsx extension only, column header verification, XSS sanitization on text fields.
- **Requirements:** TR-005 (RTO Excel parsing), TR-006 (Worker/Org parsing), NFR-006 (input validation — file uploads)
- **Design Components:** Excel Parsing Service (1.1.8), AD-007 (in-memory processing)
- **Dependencies:** WP-0.2
- **Effort:** M (2–3 days)
- **Sprint:** 2
- **Exit Criteria:**
  - Valid .xlsx files parsed correctly with all columns mapped
  - Non-.xlsx files rejected with clear error
  - Missing columns → rejection with specific column name in error
  - Malformed rows skipped with row-number warnings
  - CW and At Home workers filtered
  - Tests cover valid files, malformed files, missing columns, edge cases

### WP-1.2: Upload API & Processing

- **Description:** Implement `POST /api/admin/upload` endpoint (Admin role required). Accepts multipart .xlsx file upload. Uses the parsing engine (WP-1.1) to process badge data. Implements append/upsert: new employee+week → insert; existing → update badge data while preserving all employee-generated data (exceptions, PTO, disputes, approvals). Cross-references workers table — skips employees not in worker data with warning. Returns structured upload summary (rows processed, new, updated, skipped, warnings). Handles unmatched employees.
- **Requirements:** TR-007 (append/upsert), TR-016 (upload processing results), FR-025 (Excel upload), FR-026 (append behavior), FR-027 (preserve employee edits), FR-028 (skip/log unmatched), FR-029 (upload results summary), NFR-013 (upload <30s), NFR-017 (data integrity)
- **Design Components:** Upload Service (1.1.9), Upload Processing Pipeline (AD-007)
- **Dependencies:** WP-0.3 (auth), WP-1.1 (parsing)
- **Effort:** L (3 days)
- **Sprint:** 2
- **Exit Criteria:**
  - Admin can upload .xlsx; non-admin gets 403
  - New employee+week records created; existing updated
  - Employee-generated data (exceptions, disputes, PTO) preserved across uploads
  - Unmatched employees skipped with warning in response
  - Upload summary returned with accurate counts
  - Processing completes in <30s for ~4,264 rows
  - Tests cover upsert logic, preservation, unmatched employees, error cases

### WP-1.3: Employee Compliance API

- **Description:** Implement REST endpoints for employee compliance data: (1) `GET /api/employees/me/compliance` — returns weekly compliance records for the authenticated employee, default 13 weeks, with `?weeks=52` for 1-year view. Each record includes week range, badge swipes, PTO, meets-requirement flag, and computed compliance state. (2) `GET /api/employees/me/compliance/chart` — returns pie chart data aggregated from the same date range (Compliant/Excused/Non-Compliant counts). At this phase, only Compliant and Non-Compliant states are possible (no actions yet).
- **Requirements:** FR-001 (compliance table), FR-002 (13-week default), FR-003 (1-year expandable), FR-004 (color-coded status), FR-005 (pie chart), FR-006 (chart syncs with table), TR-014 (pie chart computation), BR-009 (4-day threshold), NFR-011 (page load <2s)
- **Design Components:** Compliance Service (1.1.6), Compliance Repository
- **Dependencies:** WP-0.3 (auth), WP-0.2 (schema)
- **Effort:** M (2 days)
- **Sprint:** 2
- **Exit Criteria:**
  - Authenticated employee gets their own compliance data (13-week default)
  - `?weeks=52` returns up to 1 year
  - Each record has correct compliance state (Compliant if meets-4-day, else Non-Compliant)
  - Pie chart endpoint returns correct counts matching table range
  - Response time <2s for 13 weeks, <3s for 52 weeks
  - Employee cannot see other employees' data

### WP-1.4: Login Pages (Employee + Admin)

- **Description:** Build the login UI with two paths: (1) Employee/Manager login — email input field, submits to `POST /api/auth/login`; (2) Admin login — username + password fields, submits to `POST /api/auth/admin`. Store JWT in memory (not localStorage). Route to role-appropriate view after login (Employee View, Manager View, or Admin View). Handle login errors with clear messages.
- **Requirements:** FR-030 (email-based auth), NFR-001 (auth security)
- **Design Components:** LoginPage, EmployeeLoginForm, AdminLoginForm (frontend architecture)
- **Dependencies:** WP-0.3 (auth API)
- **Effort:** S (1–2 days)
- **Sprint:** 2
- **Exit Criteria:**
  - Employee can log in with work email
  - Admin can log in with username/password
  - Invalid credentials show clear error messages
  - JWT stored in memory; redirect to appropriate view
  - Tests verify both login paths and error handling

### WP-1.5: Frontend Routing & Auth Context

- **Description:** Set up React Router v6 with protected routes: `/login`, `/employee` (Employee role), `/manager` (Manager role), `/admin` (Admin role). Implement AuthProvider context with user info, role, and token. Add route guards that redirect unauthenticated users to login and unauthorized users to their correct view. Shared layout with navigation header showing user name and logout.
- **Requirements:** FR-031 (role determination), NFR-004 (no PII in URLs)
- **Design Components:** AuthProvider, Router (frontend architecture), AD-002 (SPA)
- **Dependencies:** WP-1.4
- **Effort:** S (1 day)
- **Sprint:** 2
- **Exit Criteria:**
  - Unauthenticated users redirected to /login
  - Employee role → /employee; Manager → /manager; Admin → /admin
  - Wrong-role access redirects to correct view
  - URLs use opaque IDs, no PII in paths or query params
  - Logout clears token and redirects to login

### WP-1.6: Employee View UI (Compliance Table + Pie Chart)

- **Description:** Build the Employee View page: (1) Weekly compliance table with columns: Week Range, Badge Swipes, PTO Days, Meets 4-Day Requirement, Status (color-coded badge with text label), Exception column. Default 13-week view with "Show More" to expand to 1 year. (2) Compliance pie chart (Recharts) showing Compliant/Non-Compliant breakdown, synced with table date range. Status badges use 5-state color coding with text labels for accessibility. Table uses @tanstack/react-table.
- **Requirements:** FR-001 (compliance table), FR-002 (13-week default), FR-003 (1-year expand), FR-004 (color-coded rows), FR-005 (pie chart), FR-006 (chart syncs), FR-032 (status indicator colors), NFR-018 (accessibility — text labels, keyboard nav, contrast), NFR-011 (page load <2s)
- **Design Components:** ComplianceTable, WeekRow, CompliancePieChart, StatusBadge (frontend architecture)
- **Dependencies:** WP-1.3 (compliance API), WP-1.5 (routing)
- **Effort:** L (3 days)
- **Sprint:** 2
- **Exit Criteria:**
  - Table displays 13 weeks of compliance data with correct color coding
  - "Show More" expands to 1 year
  - Pie chart reflects table data range
  - Color-coded statuses have text labels (accessibility)
  - Keyboard navigable for primary interactions
  - Page renders in <2s with 13 weeks
  - Responsive layout on standard screen sizes

### WP-1.7: Admin Upload UI

- **Description:** Build the Admin Upload page: file dropzone (.xlsx only), upload progress indicator, and results summary display (rows processed, new, updated, skipped, warnings list). Clear error messages for invalid files.
- **Requirements:** FR-025 (Excel upload), FR-029 (upload results summary)
- **Design Components:** AdminView, UploadPanel, FileDropzone, UploadProgress, ResultsSummary
- **Dependencies:** WP-1.2 (upload API), WP-1.5 (routing)
- **Effort:** M (2 days)
- **Sprint:** 2
- **Exit Criteria:**
  - Admin can drag-and-drop or browse for .xlsx file
  - Upload progress shown during processing
  - Results summary displays all counts and warnings
  - Non-.xlsx files rejected with clear error in UI
  - Non-admin users cannot access the page

---

## Phase 2: Manager View + Drill-down (Sprint 3) — Milestone M2

**Milestone:** Managers can see their own compliance, view direct reports dashboard with filtering, and drill down through the full org hierarchy with breadcrumb navigation.

### WP-2.1: Org Hierarchy Service

- **Description:** Build the hierarchy service that constructs a parent-child adjacency tree from the Manager column in worker data. Support recursive traversal — given a manager, return all direct reports; if a report is also a manager, support further drill-down. Extract Level 01–08 for breadcrumb generation. Cache the hierarchy tree in memory (rebuilds on worker data upload).
- **Requirements:** TR-008 (org hierarchy tree), FR-022 (recursive drill-down), FR-023 (breadcrumb navigation)
- **Design Components:** HierarchyService (1.1.7)
- **Dependencies:** WP-0.2 (schema), WP-0.6 (seed data)
- **Effort:** M (2 days)
- **Sprint:** 3
- **Exit Criteria:**
  - Given a manager, returns all direct reports
  - Sub-manager drill-down works recursively to any depth
  - Breadcrumbs generated from Level 01–08 columns
  - Hierarchy handles edge cases (managers not in data, circular references detected)
  - Tests verify hierarchy with known sample data (46 managers, 8 levels)

### WP-2.2: Manager Dashboard API

- **Description:** Implement manager-specific API endpoints: (1) `GET /api/managers/me/reports` — returns direct reports summary: employee name (masked UUID in URL), compliance percentage, overall status indicator, pending exception count, pending dispute count. Supports filtering by status (`?status=compliant|non_compliant|pending`). (2) `GET /api/managers/me/reports/{worker_id}/compliance` — returns full weekly detail for a specific report (same format as employee compliance, read-only). (3) `GET /api/managers/me/reports/{worker_id}/reports` — if the report is also a manager, returns their direct reports (enables recursive drill-down).
- **Requirements:** FR-012 (direct reports dashboard), FR-013 (dashboard filtering), FR-014 (drill-down to detail), FR-015 (read-only detail for manager), FR-024 (pending counts visible), FR-033 (compliance percentage), FR-034 (pending counts), NFR-012 (dashboard load <3s)
- **Design Components:** Manager Service, ManagerRouter (API catalog)
- **Dependencies:** WP-0.3 (auth/RBAC), WP-2.1 (hierarchy), WP-1.3 (compliance data)
- **Effort:** L (3 days)
- **Sprint:** 3
- **Exit Criteria:**
  - Manager gets only their direct reports (not all employees)
  - Compliance percentage computed correctly
  - Status filtering works for all states
  - Pending exception/dispute counts accurate
  - Drill-down to employee detail returns correct data
  - Sub-manager drill-down returns that manager's reports
  - Non-managers get 403 on all manager endpoints
  - Dashboard loads in <3s for 15 direct reports

### WP-2.3: Manager Dashboard UI

- **Description:** Build the Manager View page: (1) Manager's own compliance view (reuse EmployeeView component); (2) Direct Reports Dashboard — summary table with employee name, compliance %, status indicator, pending counts. Status filter dropdown (All/Compliant/Non-Compliant/Pending). Click row to drill into report detail. Sub-manager indicator (link icon) for reports who are also managers.
- **Requirements:** FR-011 (manager's own view), FR-012 (direct reports dashboard), FR-013 (filtering), FR-033 (compliance %), FR-034 (pending counts)
- **Design Components:** ManagerView, EmployeeView (reused), DirectReportsDashboard, StatusFilter, ReportRow
- **Dependencies:** WP-2.2 (manager API), WP-1.6 (employee view component — reused)
- **Effort:** L (3 days)
- **Sprint:** 3
- **Exit Criteria:**
  - Manager sees own compliance at top
  - Direct reports table shows all required columns
  - Filtering by status works correctly
  - Click drills into report detail
  - Sub-managers identified with visual indicator
  - Dashboard renders in <3s

### WP-2.4: Recursive Drill-Down & Breadcrumbs

- **Description:** Implement recursive org hierarchy navigation: clicking a sub-manager in the dashboard loads that manager's reports. Breadcrumb component shows the hierarchy path using Level 01–08 data. Each breadcrumb level is clickable to navigate back up. Read-only employee detail view for manager drill-down (same compliance table, no action buttons).
- **Requirements:** FR-022 (recursive drill-down), FR-023 (breadcrumb navigation), FR-015 (read-only detail)
- **Design Components:** SubManagerLink, Breadcrumbs, ReportDetail
- **Dependencies:** WP-2.2 (manager API — recursive endpoint), WP-2.3 (dashboard UI)
- **Effort:** M (2 days)
- **Sprint:** 3
- **Exit Criteria:**
  - Drill from manager → sub-manager → sub-sub-manager works
  - Breadcrumbs update at each level, clickable to navigate up
  - Employee detail view is read-only (no action buttons)
  - Back navigation preserves state
  - Tests verify drill-down across 3+ hierarchy levels

---

## Phase 3: Approvals + Actions (Sprint 4–5) — Milestone M3

**Milestone:** Full exception/dispute/PTO workflows with day-level tracking, 5-state compliance model, manager approval/rejection, resubmission after rejection, and end-to-end testing.

### WP-3.1: 5-State Compliance State Machine

- **Description:** Implement the deterministic compliance state machine as a pure-function service. Two-layer architecture: (1) Day-level actions (exception, dispute, PTO — each with pending/approved/rejected status); (2) Week-level derived state computed from all day actions (Compliant/Non-Compliant/Pending/Multiple Actions Pending/Excused). State recomputed on every action submission, approval, or rejection. Same-day constraint enforced (cannot have both dispute and exception on the same day).
- **Requirements:** TR-004 (5-state state machine), BR-010 (5-state compliance model), BR-011 (manager approval required), TR-018 (same-day constraint), TR-001 (day-level tracking)
- **Design Components:** AD-006 (5-state + day-level), State Machine Engine (design-architecture.md)
- **Dependencies:** WP-0.2 (schema with day_actions table)
- **Effort:** L (3 days)
- **Sprint:** 4
- **Exit Criteria:**
  - All 5 states computed correctly from day-level actions
  - State transitions match the defined state machine exactly
  - Same-day constraint prevents dispute + exception on same day
  - Recomputation after approval/rejection produces correct state
  - 100% unit test coverage on state machine (all transitions, edge cases)
  - Pure function — no side effects, fully deterministic

### WP-3.2: Exception Submission API

- **Description:** Implement `POST /api/employees/me/actions` for exception submissions. Employee selects day(s) within a week, provides explanation text. Validates: within 5-week edit window (server-side), no conflict with existing dispute on same day, week must be non-compliant or previously rejected. Creates versioned exception record. Triggers week-level state recomputation (Red → Yellow, or Red → Orange if mixed types). Supports resubmission after rejection — creates new version, preserves old record with rejection note for audit.
- **Requirements:** FR-007 (submit exception with day selection), FR-008 (exception explanation text), FR-021 (resubmission after rejection), FR-035 (5-week edit window), FR-036 (same-day constraint), TR-003 (versioned data), TR-012 (5-week window enforcement), TR-018 (same-day constraint)
- **Design Components:** ComplianceService (1.1.6), ExceptionRepository
- **Dependencies:** WP-3.1 (state machine), WP-0.3 (auth)
- **Effort:** M (2–3 days)
- **Sprint:** 4
- **Exit Criteria:**
  - Employee can submit exception for non-compliant week (last 5 weeks)
  - Day selection required; explanation text required
  - Week older than 5th most recent → 400 error
  - Same-day conflict with existing dispute → 400 error
  - Resubmission after rejection creates new version; old preserved
  - Week state recomputes correctly (Red → Yellow)
  - Tests cover all validation paths and version creation

### WP-3.3: PTO Addition API

- **Description:** Implement PTO addition as a variant of exception submission (same endpoint, `type=pto`). Employee adds PTO days for specific day(s) within a week. Same validation rules as exceptions (5-week window, same-day constraint). PTO follows identical approval workflow — does NOT auto-excuse. Creates pending record, triggers state recomputation.
- **Requirements:** FR-009 (add PTO days with day selection), FR-010 (PTO adjustment), FR-035 (5-week window), FR-036 (same-day constraint), BR-011 (manager approval required for PTO)
- **Design Components:** ComplianceService — shared with exception (unified model per AD-006)
- **Dependencies:** WP-3.1 (state machine), WP-3.2 (shared action model)
- **Effort:** S (1 day — leverages WP-3.2 infrastructure)
- **Sprint:** 4
- **Exit Criteria:**
  - Employee can add PTO for specific days (last 5 weeks)
  - PTO creates pending record requiring manager approval
  - PTO does NOT auto-excuse the week
  - Same validation as exceptions (5-week window, same-day constraint)
  - Week state recomputes (Non-Compliant → Pending)

### WP-3.4: Badge Dispute API

- **Description:** Implement badge dispute submission (same endpoint, `type=dispute`). Employee flags specific day(s) within a week as disputed. Validates 5-week window and same-day constraint (no exception/PTO on same day). Creates dispute record. Triggers state recomputation — if only disputes pending → Yellow; if both dispute and exception/PTO on different days → Orange.
- **Requirements:** FR-016 (badge dispute with day selection), FR-035 (5-week window), FR-036 (same-day constraint), TR-018 (same-day constraint)
- **Design Components:** ComplianceService — shared dispute handling
- **Dependencies:** WP-3.1 (state machine)
- **Effort:** S (1 day — leverages shared action model)
- **Sprint:** 4
- **Exit Criteria:**
  - Employee can dispute badge count for specific days
  - Dispute on same day as existing exception → 400 error
  - Dispute + exception on different days → Orange state
  - Only dispute pending → Yellow state
  - 5-week window enforced

### WP-3.5: Manager Approval/Rejection API

- **Description:** Implement manager action endpoints: `PUT /api/managers/me/reports/{worker_id}/actions/{action_id}/approve` and `PUT /api/managers/me/reports/{worker_id}/actions/{action_id}/reject`. Validates: (1) manager is authenticated; (2) target employee is a direct report; (3) self-approval prevented (manager ≠ employee); (4) action exists and is pending. Approve → Excused (action.status=approved, recompute week state). Reject → back toward Non-Compliant (action.status=rejected, optional rejection note, recompute). Creates approval/rejection audit record with timestamp. Works identically for exceptions, PTO, and disputes.
- **Requirements:** FR-017 (approve exception), FR-018 (reject exception with note), FR-019 (approve dispute), FR-020 (reject dispute with note), TR-011 (self-approval prevention), TR-015 (drill-down before approval), BR-011 (manager approval required), BR-012 (cannot self-approve)
- **Design Components:** Manager Service, Approval Repository, design-ops.md Section 1.3 (self-approval)
- **Dependencies:** WP-3.1 (state machine), WP-2.2 (manager API — report verification)
- **Effort:** L (3 days)
- **Sprint:** 4
- **Exit Criteria:**
  - Manager can approve/reject exceptions, PTO, and disputes
  - Self-approval → 403 error (manager's own items go to their manager)
  - Non-direct-report → 403 error
  - Approval: action→approved, week may transition to Excused (Blue)
  - Rejection: action→rejected with optional note, week recomputes toward Red
  - Audit record created with manager ID, action type, timestamp
  - Tests cover all 3 action types × approve/reject × validation paths

### WP-3.6: Employee Action UI (Exception, PTO, Dispute Forms)

- **Description:** Add action buttons to the Employee View compliance table for the last 5 weeks. Three action types share a unified modal: (1) Day picker (Mon–Sun checkboxes), (2) Action type selector (Exception / Add PTO / Dispute Badge), (3) Explanation text field (required for exception/PTO, optional for dispute), (4) Same-day conflict warning (disable days already used for conflicting action type). "Resubmit" banner shown on rejected weeks with previous rejection note visible. Weeks older than 5 most recent show no action buttons.
- **Requirements:** FR-007 (submit exception), FR-008 (explanation text), FR-009 (add PTO), FR-010 (PTO days), FR-016 (badge dispute), FR-021 (resubmission), FR-035 (5-week window UI), FR-036 (same-day constraint UI), FR-037 (day-level action indicators), NFR-018 (accessibility — keyboard nav for actions)
- **Design Components:** WeekRow (action buttons), ActionModal, DayPicker, SameDayConflictWarning, ResubmitExceptionBanner
- **Dependencies:** WP-3.2 (exception API), WP-3.3 (PTO API), WP-3.4 (dispute API), WP-1.6 (employee view)
- **Effort:** L (3 days)
- **Sprint:** 4
- **Exit Criteria:**
  - Action buttons visible on last 5 weeks only
  - Modal with day picker, action type, and explanation text
  - Same-day conflicts visually indicated and prevented
  - Successful submission updates table color in real-time
  - Rejected weeks show resubmit option with previous note
  - Keyboard accessible
  - Tests verify form validation, submission flow, and UI state updates

### WP-3.7: Manager Action Review UI

- **Description:** Extend the manager drill-down detail view with action review capabilities. When viewing a report's weekly detail: (1) Pending actions shown with day indicators and employee explanation; (2) Approve/Reject buttons with optional rejection note field; (3) Badge disputes flagged distinctly from exceptions/PTO; (4) All pending actions grouped by day within the week. Manager must be in the detail view (drill-down) to take action — no bulk approval from summary. Action review component shared across exception, PTO, and dispute types.
- **Requirements:** FR-017 (approve exception), FR-018 (reject with note), FR-019 (approve dispute), FR-020 (reject dispute), FR-024 (pending items visible), TR-015 (drill-down before approval)
- **Design Components:** ReportDetail, ActionReview, DayActionList, ApproveRejectControls
- **Dependencies:** WP-3.5 (approval API), WP-2.4 (drill-down UI)
- **Effort:** M (2–3 days)
- **Sprint:** 5
- **Exit Criteria:**
  - Pending actions visible in employee detail drill-down
  - Approve/Reject buttons functional with confirmation
  - Optional rejection note captured and displayed
  - Action resolution updates dashboard counts in real-time
  - No approval possible from summary view (must drill down)
  - Tests verify approval flow end-to-end

### WP-3.8: Updated Pie Chart (5-State Grouping)

- **Description:** Update the pie chart component to handle all 5 compliance states. Pie chart groups into 4 slices: Compliant (Green), Excused (Blue), Pending (Yellow + Orange combined), Non-Compliant (Red). Ensure chart syncs with current table date range. Update both employee and manager detail views.
- **Requirements:** FR-005 (pie chart — 5-state aware), TR-014 (pie chart computation), FR-006 (chart syncs)
- **Design Components:** CompliancePieChart (updated), AD-006 (pie chart mapping)
- **Dependencies:** WP-3.1 (state machine — all 5 states now active)
- **Effort:** S (1 day)
- **Sprint:** 5
- **Exit Criteria:**
  - Pie chart correctly groups 5 states into 4 slices
  - Pending (Yellow) and Multiple Pending (Orange) merged into one slice
  - Chart updates when table range changes
  - Legend labels are accessible (text, not just color)

### WP-3.9: End-to-End Testing & Polish

- **Description:** Comprehensive end-to-end testing of all workflows: (1) Employee submits exception → Manager approves → state transitions verified; (2) Employee submits PTO → Manager rejects → resubmission → approval; (3) Admin uploads data → employee data preserved → new data appears; (4) Concurrent actions (dispute + exception on different days → Orange state); (5) Self-approval prevention; (6) 5-week window enforcement; (7) Recursive drill-down through 3+ levels. Code coverage check (>= 80%). Linting pass. Performance benchmarks.
- **Requirements:** NFR-015 (80% test coverage), NFR-016 (code quality), NFR-014 (50 concurrent users), NFR-011 (employee <2s), NFR-012 (manager <3s), NFR-013 (upload <30s), NFR-017 (data integrity), BR-001 (replace manual tracking), BR-002 (manager visibility), BR-003 (single source of truth), BR-004 (employee engagement — tracking hooks), BR-005 (manager review time — timestamp tracking)
- **Design Components:** All — integration verification
- **Dependencies:** All WPs in Phase 3
- **Effort:** L (3 days)
- **Sprint:** 5
- **Exit Criteria:**
  - All 3 end-to-end workflows pass
  - Unit test coverage >= 80% (backend and frontend)
  - Linting: zero errors (ruff, ESLint)
  - Employee View loads in <2s; Manager Dashboard in <3s
  - Upload processes ~4,264 rows in <30s
  - All 85 requirements verified traceable to at least one passing test
  - README with complete setup and run instructions

---

## Dependency Graph

```
WP-0.1 (Monorepo)
  ├──► WP-0.2 (Schema) ──────► WP-0.5 (Health)
  │       ├──► WP-0.3 (Auth) ──────────────────────────────────────────────┐
  │       │       ├──► WP-1.2 (Upload API) ◄── WP-1.1 (Excel Parsing) ◄───┤
  │       │       ├──► WP-1.3 (Employee API) ──► WP-1.6 (Employee UI)     │
  │       │       └──► WP-2.2 (Manager API) ◄── WP-2.1 (Hierarchy)       │
  │       ├──► WP-0.6 (Seed) ──► WP-2.1 (Hierarchy)                      │
  │       └──► WP-3.1 (State Machine)                                     │
  └──► WP-0.4 (Middleware)                                                │
                                                                           │
  WP-1.4 (Login UI) ──► WP-1.5 (Routing) ──► WP-1.6 (Employee UI)       │
                                   └──► WP-1.7 (Admin Upload UI) ◄────────┘
                                   └──► WP-2.3 (Manager Dashboard UI)
                                            └──► WP-2.4 (Drill-down + Breadcrumbs)

  WP-3.1 (State Machine)
    ├──► WP-3.2 (Exception API) ──┐
    ├──► WP-3.3 (PTO API) ────────┤──► WP-3.6 (Employee Action UI)
    ├──► WP-3.4 (Dispute API) ────┘
    └──► WP-3.5 (Approval API) ──────► WP-3.7 (Manager Action Review UI)
                                         └──► WP-3.8 (Updated Pie Chart)

  ALL Phase 3 WPs ──► WP-3.9 (E2E Testing)
```

### Critical Path

```
WP-0.1 → WP-0.2 → WP-0.3 → WP-1.3 → WP-1.6 (M1 Employee View)
WP-0.2 → WP-0.6 → WP-2.1 → WP-2.2 → WP-2.3 → WP-2.4 (M2 Manager View)
WP-0.2 → WP-3.1 → WP-3.2 → WP-3.6 → WP-3.9 (M3 Approvals)
```

---

## Sprint Mapping

### Sprint 1 (Weeks 1–2): Phase 0 — Bootstrap

| WP | Name | Effort | Parallel? |
|----|------|--------|-----------|
| WP-0.1 | Monorepo Scaffold | S (1d) | Start immediately |
| WP-0.4 | Core Middleware | M (2d) | After WP-0.1 |
| WP-0.2 | Database Schema | M (2d) | After WP-0.1 |
| WP-0.5 | Health Endpoints | S (0.5d) | After WP-0.2 |
| WP-0.3 | Auth Foundation | M (2–3d) | After WP-0.2 |
| WP-0.6 | Sample Data Seeding | M (2d) | After WP-0.2 |

**Parallelism:** WP-0.4 (middleware) and WP-0.2 (schema) can run in parallel after WP-0.1. WP-0.5, WP-0.3, WP-0.6 can start as soon as WP-0.2 completes (parallel).

**Sprint Goal:** Backend runs with auth, middleware, database, health checks, and sample data.

### Sprint 2 (Weeks 3–4): Phase 1 — Employee View + Upload (M1)

| WP | Name | Effort | Parallel? |
|----|------|--------|-----------|
| WP-1.1 | Excel Parsing Engine | M (2–3d) | Start immediately |
| WP-1.3 | Employee Compliance API | M (2d) | Start immediately (parallel with WP-1.1) |
| WP-1.2 | Upload API | L (3d) | After WP-1.1 |
| WP-1.4 | Login Pages | S (1–2d) | Start immediately |
| WP-1.5 | Frontend Routing | S (1d) | After WP-1.4 |
| WP-1.6 | Employee View UI | L (3d) | After WP-1.3, WP-1.5 |
| WP-1.7 | Admin Upload UI | M (2d) | After WP-1.2, WP-1.5 |

**Parallelism:** Developer A: WP-1.1 → WP-1.2 → WP-1.7 (backend upload pipeline). Developer B: WP-1.3 + WP-1.4 → WP-1.5 → WP-1.6 (employee view pipeline).

**Sprint Goal:** Employee can log in and view compliance. Admin can upload Excel files.

### Sprint 3 (Weeks 5–6): Phase 2 — Manager View + Drill-down (M2)

| WP | Name | Effort | Parallel? |
|----|------|--------|-----------|
| WP-2.1 | Org Hierarchy Service | M (2d) | Start immediately |
| WP-2.2 | Manager Dashboard API | L (3d) | After WP-2.1 |
| WP-2.3 | Manager Dashboard UI | L (3d) | After WP-2.2 |
| WP-2.4 | Drill-down + Breadcrumbs | M (2d) | After WP-2.3 |

**Parallelism:** Limited — this is a sequential chain. However, WP-2.1 backend work can overlap with Sprint 2 UI polish if Sprint 2 finishes early.

**Sprint Goal:** Managers can view their team, filter by status, and drill down through the org hierarchy.

### Sprint 4 (Weeks 7–8): Phase 3a — Actions + State Machine

| WP | Name | Effort | Parallel? |
|----|------|--------|-----------|
| WP-3.1 | 5-State State Machine | L (3d) | Start immediately |
| WP-3.2 | Exception Submission API | M (2–3d) | After WP-3.1 |
| WP-3.3 | PTO Addition API | S (1d) | After WP-3.2 (shared model) |
| WP-3.4 | Badge Dispute API | S (1d) | After WP-3.1 (parallel with WP-3.2) |
| WP-3.5 | Manager Approval API | L (3d) | After WP-3.1 |
| WP-3.6 | Employee Action UI | L (3d) | After WP-3.2, WP-3.3, WP-3.4 |

**Parallelism:** Developer A: WP-3.1 → WP-3.2 → WP-3.3 → WP-3.6 (employee action pipeline). Developer B: WP-3.1 (review) → WP-3.4 → WP-3.5 (dispute + approval pipeline). WP-3.4 and WP-3.2 can run in parallel after WP-3.1.

**Sprint Goal:** Employees can submit exceptions, PTO, and disputes. Managers can approve/reject.

### Sprint 5 (Weeks 9–10): Phase 3b — Polish + Testing

| WP | Name | Effort | Parallel? |
|----|------|--------|-----------|
| WP-3.7 | Manager Action Review UI | M (2–3d) | Start immediately |
| WP-3.8 | Updated Pie Chart | S (1d) | After WP-3.1 (can start immediately) |
| WP-3.9 | E2E Testing & Polish | L (3d) | After WP-3.7, WP-3.8 |

**Sprint Goal:** All workflows complete, tested, polished. Application ready for demo.

---

## Risk Register

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| R1 | 5-state state machine complexity causes bugs | High | Medium | WP-3.1 is pure-function with 100% unit test coverage; all transitions tested before integration |
| R2 | Day-level tracking adds data model complexity | Medium | Medium | Schema designed upfront in WP-0.2; Alembic migrations tested early |
| R3 | Excel parsing edge cases (malformed dates, missing columns) | Medium | High | Dedicated parsing WP (1.1) with comprehensive error handling; test with real sample files |
| R4 | Org hierarchy data quality issues (missing managers, circular refs) | Medium | Medium | WP-2.1 includes validation and error logging; hierarchy built from actual sample data |
| R5 | Same-day constraint enforcement across concurrent requests | Low | Low | Server-side validation with database transaction isolation; SQLite serialized writes |
| R6 | JWT token storage in browser memory lost on refresh | Medium | High | Acceptable for POC (re-login required on refresh); document as known limitation; production uses Okta SSO with persistent sessions |
| R7 | SQLite concurrent write contention during uploads | Low | Low | WAL mode + 5s busy timeout; only admin uploads write heavily; reads unaffected |
| R8 | Sprint 4 is the densest sprint (state machine + all action APIs) | Medium | Medium | WP-3.1 (state machine) is the linchpin — if it slips, all actions slip. Prioritize it as first WP in Sprint 4. |
| R9 | Scope creep from additional compliance states or action types | Medium | Low | Stick strictly to 5-state model per design. Any additions deferred to future iteration. |
| R10 | Sample data may not cover all edge cases (only 4 rows) | Low | High | WP-0.6 generates synthetic data covering all 5 states, multiple action types, rejection/resubmission scenarios |

---

## Requirements Traceability

### Business Requirements (BR-001 to BR-012)

| Req | WP Coverage |
|-----|------------|
| BR-001 (Replace manual tracking) | WP-1.6, WP-1.7, WP-3.9 |
| BR-002 (Manager visibility) | WP-2.2, WP-2.3, WP-3.9 |
| BR-003 (Single source of truth) | WP-1.2, WP-3.9 |
| BR-004 (Employee engagement rate) | WP-3.9 (tracking hooks) |
| BR-005 (Manager review time) | WP-3.5, WP-3.9 (timestamp tracking) |
| BR-006 (Data completeness) | WP-0.6, WP-1.2 |
| BR-007 (Exclude CW) | WP-0.6, WP-1.1 |
| BR-008 (Exclude At Home) | WP-0.6, WP-1.1 |
| BR-009 (4-day threshold) | WP-1.3 |
| BR-010 (5-state model) | WP-3.1 |
| BR-011 (Manager approval required) | WP-3.5, WP-3.1 |
| BR-012 (No self-approval) | WP-3.5 |

### Functional Requirements (FR-001 to FR-037)

| Req | WP Coverage |
|-----|------------|
| FR-001 (Compliance table) | WP-1.3, WP-1.6 |
| FR-002 (13-week default) | WP-1.3, WP-1.6 |
| FR-003 (1-year expand) | WP-1.3, WP-1.6 |
| FR-004 (Color-coded rows) | WP-1.6 |
| FR-005 (Pie chart) | WP-1.6, WP-3.8 |
| FR-006 (Chart syncs range) | WP-1.6, WP-3.8 |
| FR-007 (Submit exception) | WP-3.2, WP-3.6 |
| FR-008 (Exception text) | WP-3.2, WP-3.6 |
| FR-009 (Add PTO) | WP-3.3, WP-3.6 |
| FR-010 (PTO adjustment) | WP-3.3, WP-3.6 |
| FR-011 (Manager own view) | WP-2.3 |
| FR-012 (Direct reports dashboard) | WP-2.2, WP-2.3 |
| FR-013 (Dashboard filtering) | WP-2.2, WP-2.3 |
| FR-014 (Drill-down to detail) | WP-2.2, WP-2.4 |
| FR-015 (Read-only detail) | WP-2.4 |
| FR-016 (Badge dispute) | WP-3.4, WP-3.6 |
| FR-017 (Approve exception) | WP-3.5, WP-3.7 |
| FR-018 (Reject exception) | WP-3.5, WP-3.7 |
| FR-019 (Approve dispute) | WP-3.5, WP-3.7 |
| FR-020 (Reject dispute) | WP-3.5, WP-3.7 |
| FR-021 (Resubmission) | WP-3.2, WP-3.6 |
| FR-022 (Recursive drill-down) | WP-2.1, WP-2.2, WP-2.4 |
| FR-023 (Breadcrumbs) | WP-2.4 |
| FR-024 (Pending items visible) | WP-2.2, WP-3.7 |
| FR-025 (Excel upload) | WP-1.2, WP-1.7 |
| FR-026 (Append behavior) | WP-1.2 |
| FR-027 (Preserve edits) | WP-1.2 |
| FR-028 (Skip unmatched) | WP-1.2 |
| FR-029 (Upload summary) | WP-1.2, WP-1.7 |
| FR-030 (Email auth + admin) | WP-0.3, WP-1.4 |
| FR-031 (Role determination) | WP-0.3, WP-1.5 |
| FR-032 (Status colors) | WP-1.6 |
| FR-033 (Compliance %) | WP-2.2, WP-2.3 |
| FR-034 (Pending counts) | WP-2.2, WP-2.3 |
| FR-035 (5-week window) | WP-3.2, WP-3.3, WP-3.4, WP-3.6 |
| FR-036 (Same-day constraint) | WP-3.2, WP-3.4, WP-3.6 |
| FR-037 (Day-level indicators) | WP-3.6 |

### Technical Requirements (TR-001 to TR-018)

| Req | WP Coverage |
|-----|------------|
| TR-001 (Employee-week + day-level) | WP-0.2, WP-3.1 |
| TR-002 (Worker/Org hierarchy) | WP-0.2 |
| TR-003 (App-generated data, versioned) | WP-0.2, WP-3.2 |
| TR-004 (5-state state machine) | WP-3.1 |
| TR-005 (RTO Excel parsing) | WP-1.1 |
| TR-006 (Worker/Org parsing) | WP-1.1 |
| TR-007 (Upload upsert) | WP-1.2 |
| TR-008 (Org hierarchy tree) | WP-2.1 |
| TR-009 (Email-based auth) | WP-0.3 |
| TR-010 (RBAC) | WP-0.3 |
| TR-011 (Self-approval prevention) | WP-3.5 |
| TR-012 (5-week edit window) | WP-3.2 |
| TR-013 (RESTful API) | WP-1.2, WP-1.3, WP-2.2, WP-3.2, WP-3.5 |
| TR-014 (Pie chart computation) | WP-1.3, WP-3.8 |
| TR-015 (Drill-down enforcement) | WP-3.5, WP-3.7 |
| TR-016 (Upload results) | WP-1.2 |
| TR-017 (Local dev environment) | WP-0.1 |
| TR-018 (Same-day constraint) | WP-3.1, WP-3.2, WP-3.4 |

### Non-Functional Requirements (NFR-001 to NFR-018)

| Req | WP Coverage |
|-----|------------|
| NFR-001 (Auth security) | WP-0.3, WP-1.4 |
| NFR-002 (Authorization enforcement) | WP-0.3, WP-0.4 |
| NFR-003 (PII in logs) | WP-0.4 |
| NFR-004 (PII in URLs) | WP-0.4, WP-1.5 |
| NFR-005 (Secrets management) | WP-0.3 |
| NFR-006 (Input validation) | WP-1.1 |
| NFR-007 (Structured JSON logging) | WP-0.4 |
| NFR-008 (Correlation IDs) | WP-0.4 |
| NFR-009 (Health endpoints) | WP-0.5 |
| NFR-010 (Structured errors) | WP-0.4 |
| NFR-011 (Employee <2s) | WP-1.3, WP-1.6, WP-3.9 |
| NFR-012 (Manager <3s) | WP-2.2, WP-2.3, WP-3.9 |
| NFR-013 (Upload <30s) | WP-1.2, WP-3.9 |
| NFR-014 (50 concurrent users) | WP-3.9 |
| NFR-015 (80% test coverage) | WP-3.9 |
| NFR-016 (Code quality) | WP-0.1, WP-3.9 |
| NFR-017 (Data integrity) | WP-1.2, WP-3.9 |
| NFR-018 (Accessibility) | WP-1.6, WP-3.6 |

---

## Assumptions

1. A team of 2 developers can work in parallel on backend and frontend tasks.
2. Python 3.11+ and Node.js 18+ are available on developer machines.
3. The sample Excel files (RTO_Sample.xlsx, tech_workers_with_manager_email.xlsx) are representative of production data formats.
4. The 5-state compliance model as defined in the design is final — no additional states will be added during implementation.
5. SQLite WAL mode is sufficient for 50 concurrent users (POC scale).
6. JWT stored in memory (not localStorage) is acceptable for POC — users re-login on page refresh.
7. No email notifications — managers discover pending items on login.
8. The org hierarchy in sample data (8 levels, 46 managers) is representative.
9. Admin role is separate from Employee/Manager — admin users may not appear in worker data.
10. Sprints are 2 weeks with approximately 8 productive developer-days per sprint per developer.
