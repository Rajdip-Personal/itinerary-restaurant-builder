# Technical Design — Component Inventory, Data Model & Integration Patterns

## Document Info
- **Version:** 2.0
- **Date:** 2026-03-07
- **Status:** Draft (Updated — all 5 gaps resolved)
- **Requirements Baseline:** docs/outputs/requirements-bf.md, docs/outputs/requirements-tn.md
- **Scope:** Component Inventory, Data Model, Integration Patterns

---

# 1. Component Inventory

## 1.1 Backend Components

### 1.1.1 Auth Middleware
- **Responsibility:** Validate session tokens on every incoming request (except `/health`, `/ready`, `/api/auth/login`, `/api/auth/admin-login`). Support TWO auth paths: (1) worker email lookup for Employee/Manager roles, (2) dedicated admin credentials from `.env` for Admin role. Generate session tokens on successful login. Enforce session expiration (8-hour default).
- **Interfaces:**
  - **Consumes:** `Authorization: Bearer <token>` header from HTTP requests; sessions table for token validation; `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars for admin auth
  - **Exposes:** `req.user` context (user ID, role, is_manager flag; for workers: worker_id and email; for admin: admin flag) attached to every authenticated request
- **Requirements:** FR-030, NFR-001, TR-009

### 1.1.2 RBAC Middleware
- **Responsibility:** Check the authenticated user's role against the endpoint's required role(s). Enforce Employee / Manager / Admin access boundaries. Log all authorization decisions.
- **Interfaces:**
  - **Consumes:** `req.user` context from Auth Middleware; endpoint role annotations
  - **Exposes:** Pass-through on success; 403 Forbidden structured error on failure
- **Requirements:** TR-010, NFR-002, FR-031

### 1.1.3 Correlation ID Middleware
- **Responsibility:** Extract `X-Correlation-ID` from incoming requests or generate a new UUID if absent. Attach to request context and include in all log entries and response headers.
- **Interfaces:**
  - **Consumes:** `X-Correlation-ID` request header (optional)
  - **Exposes:** `req.correlationId` on request context; `X-Correlation-ID` response header
- **Requirements:** NFR-008, NFR-007

### 1.1.4 PII Masking Utility
- **Responsibility:** Provide a logging wrapper that automatically masks known PII patterns (employee names, emails, badge data) before writing to log output. Used by all components that emit logs.
- **Interfaces:**
  - **Consumes:** Raw log data containing potential PII fields
  - **Exposes:** `mask(value)` function; configured logger instance that auto-masks PII fields
- **Requirements:** NFR-003, NFR-004

### 1.1.5 Upload Service
- **Responsibility:** Accept multipart Excel file uploads, validate file format (.xlsx), parse RTO badge data (12 columns), validate column presence and data types, execute append/upsert logic against the database, return processing summary.
- **Interfaces:**
  - **Consumes:** Multipart file upload via `POST /api/admin/upload`; worker data for cross-referencing
  - **Exposes:** Upload result summary (rows processed, new, updated, skipped, warnings)
- **Requirements:** FR-025, FR-026, FR-027, FR-028, FR-029, FR-032, TR-005, TR-007, TR-016, NFR-006, NFR-013

### 1.1.6 Compliance Service
- **Responsibility:** Core business logic for computing compliance state per employee-week. Implements the **5-state compliance model** (Compliant / Exception Pending / Non-Compliant / Excused / Multiple Actions Pending). Computes week-level state from day-level actions. Provides employee compliance data retrieval (13-week default, expandable to 52 weeks), pie chart computation, and manager dashboard aggregation. Enforces 5-week edit window.
- **Interfaces:**
  - **Consumes:** compliance_weeks table, exceptions table, disputes table, pto_additions table, manager_actions table
  - **Exposes:** `getEmployeeCompliance(workerId, weeks)`, `getPieChartData(workerId, weeks)`, `getDirectReports(managerId)`, `getDirectReportsSummary(managerId)`
- **Requirements:** FR-001–FR-006, FR-010–FR-014, FR-016, TR-001, TR-004, TR-012, TR-014, BR-009, BR-010

### 1.1.7 Exception / Dispute / PTO Service
- **Responsibility:** Handle employee submissions (exceptions, badge disputes, PTO additions) and manager actions (approve/reject). All three action types follow the same Yellow→approval workflow. Enforce business rules: 5-week edit window, self-approval prevention, day-level granularity, same-day constraint (no dispute + exception on same day), state transitions. Record all actions with timestamps for audit trail.
- **Interfaces:**
  - **Consumes:** Employee/manager requests; compliance_weeks, exceptions, disputes, pto_additions, manager_actions tables
  - **Exposes:** `submitException(workerId, weekId, dayDate, explanation)`, `submitDispute(workerId, weekId, dayDate, reason)`, `addPto(workerId, weekId, dayDate, days)`, `approveException(managerId, exceptionId)`, `rejectException(managerId, exceptionId, note)`, `approveDispute(managerId, disputeId)`, `rejectDispute(managerId, disputeId, note)`, `approvePto(managerId, ptoId)`, `rejectPto(managerId, ptoId, note)`
- **Requirements:** FR-007–FR-009, FR-017–FR-020, FR-024, TR-003, TR-004, TR-011, TR-012, BR-011, BR-012

### 1.1.8 Hierarchy Service
- **Responsibility:** Build and query the org hierarchy tree from worker data. Support recursive drill-down traversal (manager → direct reports → sub-manager's reports). Generate breadcrumb paths from Level 01–08 columns. Determine manager-report relationships.
- **Interfaces:**
  - **Consumes:** workers table (manager_email, is_manager, level_01–level_08 columns)
  - **Exposes:** `getDirectReports(managerId)`, `getHierarchyPath(workerId)`, `isManagerOf(managerId, employeeId)`, `getBreadcrumbs(workerId)`
- **Requirements:** FR-022, FR-023, TR-002, TR-008

### 1.1.9 Health Service
- **Responsibility:** Expose liveness and readiness endpoints. Liveness (`/health`) confirms the process is running. Readiness (`/ready`) confirms the database is connected and queryable.
- **Interfaces:**
  - **Consumes:** Database connection pool
  - **Exposes:** `GET /health` → `{"status": "healthy"}`, `GET /ready` → `{"status": "ready"}` or 503
- **Requirements:** NFR-009

### 1.1.10 Worker Data Loader
- **Responsibility:** Parse the worker/org Excel file (35 columns, 783 rows), extract key fields, filter out Contingent Workers and At Home employees, and populate the workers table. Also used to refresh worker data when a new org file is uploaded.
- **Interfaces:**
  - **Consumes:** Worker/org Excel file via admin upload
  - **Exposes:** Load result summary (total parsed, eligible employees, excluded CWs, excluded At Home)
- **Requirements:** FR-033, TR-002, TR-006, BR-007, BR-008

---

## 1.2 Frontend Components

### 1.2.1 Login Page
- **Responsibility:** Provide two login paths: (1) Employee/Manager login via work email, (2) Admin login via username/password. Handle success (redirect to appropriate view) and failure (display error). Store session token in memory or httpOnly cookie.
- **Sub-components:**
  - **Email Login Form** — For employees and managers
  - **Admin Login Form** — For admin users (toggle or separate tab)
- **Requirements:** FR-030, NFR-001

### 1.2.2 Employee View (Screen 1)
- **Responsibility:** Display the logged-in employee's weekly compliance table (13-week default, expandable to 52 weeks) with color-coded status rows using the 5-state model. Show the pie chart synced with the table date range. Provide action buttons (Dispute, Add PTO, Submit Exception) on the 5 most recent weeks. Each action requires selecting a specific day within the week.
- **Sub-components:**
  - **Compliance Table** — Renders week rows with columns: Week Range, Badge Swipes, System PTO, Added PTO, Meets 4-Day, Status, Pending Actions
  - **Pie Chart** — 4-slice chart (Compliant/Excused/Pending/Non-Compliant) with counts and percentages
  - **Date Range Toggle** — Switch between 13-week and 1-year view
  - **Day Indicators** — Within each week row, show which days have actions (exceptions, disputes, PTO)
- **Requirements:** FR-001–FR-006, FR-010, TR-014, NFR-011, NFR-018

### 1.2.3 Manager Dashboard (Screen 2)
- **Responsibility:** Display the manager's own Employee View (with full actions), plus a Direct Reports summary table showing: name, compliance %, status indicator, pending exceptions count, pending disputes count, pending PTO count. Support filtering by status (compliant, non-compliant, pending, multiple-pending).
- **Sub-components:**
  - **Own Compliance Section** — Reuses Employee View component
  - **Direct Reports Table** — Summary of all direct reports
  - **Status Filter** — Filter direct reports by compliance status
- **Requirements:** FR-011–FR-013, NFR-012

### 1.2.4 Employee Detail (Drill-Down View)
- **Responsibility:** When a manager clicks a direct report, show that employee's weekly compliance table in read-only mode (no action buttons). Display exception explanation text for Yellow/Orange weeks. Show badge dispute and PTO flags. Provide approve/reject action buttons for all pending items (exceptions, disputes, PTO).
- **Sub-components:**
  - **Read-Only Compliance Table** — Same layout as Employee View, no edit actions
  - **Exception Detail Panel** — Shows explanation text for pending exceptions
  - **Dispute Indicator** — Visual flag for disputed days within weeks
  - **PTO Indicator** — Visual flag for pending PTO additions
  - **Action Buttons** — Approve/Reject for exceptions, disputes, AND PTO additions (only visible after drill-down)
- **Requirements:** FR-014–FR-021, TR-015

### 1.2.5 Admin Upload (Screen 3)
- **Responsibility:** Provide a file upload form accepting .xlsx files. Show upload progress. Display processing results summary (rows processed, new, updated, skipped, warnings). Show list of skipped employees with reasons.
- **Sub-components:**
  - **File Picker** — Accept .xlsx files only
  - **Upload Progress** — Visual indicator during processing
  - **Results Summary** — Counts and status after processing
  - **Warnings List** — Skipped employees and format issues
- **Requirements:** FR-025, FR-028, FR-029, TR-016, NFR-006

### 1.2.6 Navigation / Breadcrumbs
- **Responsibility:** Provide top-level navigation between Employee View, Manager Dashboard (if manager), and Admin Upload (if admin). Render breadcrumb trail during org hierarchy drill-down using Level 01–08 data. Support click-to-navigate on any breadcrumb.
- **Sub-components:**
  - **Top Nav Bar** — Role-aware navigation tabs
  - **Breadcrumb Trail** — Shows hierarchy path during drill-down
- **Requirements:** FR-022, FR-023, TR-008

### 1.2.7 Action Modals
- **Responsibility:** Provide modal dialogs for all user actions. All modals require day selection within the week:
  - **Submit Exception Modal** — Day picker, text area for explanation, Submit/Cancel buttons
  - **Dispute Badge Count Modal** — Day picker, optional reason text area, Submit/Cancel buttons
  - **Add PTO Modal** — Day picker, number input for PTO days, Submit/Cancel. Triggers Yellow (pending) state like exceptions.
  - **Approve Modal** — Confirmation with summary of what's being approved (works for exceptions, disputes, AND PTO)
  - **Reject Modal** — Optional rejection note text area, Confirm/Cancel (works for exceptions, disputes, AND PTO)
- **Validation:** Same-day constraint — if a day already has a dispute, cannot submit exception for that day (and vice versa). PTO can coexist with either.
- **Requirements:** FR-007–FR-009, FR-017–FR-020

---

# 2. Data Model

## 2.1 Entity-Relationship Diagram (ASCII)

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│   workers    │───1:N─│ compliance_weeks  │───1:N─│  exceptions  │
│             │       │                  │       │              │
│ PK: id      │       │ PK: id           │       │ PK: id       │
│ email (UQ)  │       │ FK: worker_id    │       │ FK: week_id  │
│ manager_email│       │ UQ: worker_id +  │       │ FK: worker_id│
│ is_manager  │       │     week_start   │       │ day_date     │
│ level_01-08 │       └────────┬─────────┘       └──────┬───────┘
└──────┬──────┘               │                         │
       │                      │                  ┌──────┴───────┐
       │ (self-ref            │                  │manager_actions│
       │  via manager_email)  │                  │              │
       │                      ├──────1:N────────│ PK: id       │
       │                      │                  │ FK: week_id  │
       │                      │                  │ FK: actor_id │
       │                      │                  │ target_type  │
       │                      │                  │ target_id    │
       │                      ├──────1:N─────┐  └──────────────┘
       │                      │              │
       │               ┌──────┴──────┐  ┌────┴──────────┐
       │               │  disputes   │  │ pto_additions  │
       │               │             │  │               │
       │               │ PK: id      │  │ PK: id        │
       │               │ FK: week_id │  │ FK: week_id   │
       │               │ FK: worker_id│  │ FK: worker_id │
       │               │ day_date    │  │ day_date      │
       │               └─────────────┘  │ status (pending│
       │                                │  /approved/    │
       │                                │  rejected)     │
       ├──────1:N─────┐                └───────────────┘
       │              │
  ┌────┴─────┐
  │ sessions │
  │          │
  │ PK: id   │
  │ FK: user_id │  (worker_id for employees/managers, admin user id for admins)
  │ token (UQ) │
  │ user_type  │  ('worker' or 'admin')
  └──────────┘
```

## 2.2 Table Definitions

### 2.2.1 `workers`

Stores all eligible employee records from the worker/org data file. Contingent Workers and At Home employees are NOT stored — they are filtered out during import. **Admin users do NOT have worker records** — they authenticate separately.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT (UUID) | PRIMARY KEY | Internal opaque identifier |
| name | TEXT | NOT NULL | Worker full name (from "Worker" column) |
| email | TEXT | NOT NULL, UNIQUE | Work email (from "Email - Work") — used for auth |
| manager_email | TEXT | NULLABLE | Manager's email (from "Manager E-mail Address") — hierarchy link |
| manager_name | TEXT | NULLABLE | Manager's name (from "Manager" column) |
| is_manager | BOOLEAN | NOT NULL, DEFAULT FALSE | TRUE if "Is Manager" = "Yes" in source data |
| num_direct_reports | INTEGER | DEFAULT 0 | Count of direct reports |
| worker_type | TEXT | NOT NULL | "Employee" (CWs filtered out at import) |
| work_location_type | TEXT | NOT NULL | "Hybrid" or "In Office" (At Home filtered out) |
| location | TEXT | NULLABLE | Physical office location |
| et_org | TEXT | NULLABLE | Top-level org |
| supervisory_org | TEXT | NULLABLE | Direct supervisory org |
| level_01 | TEXT | NULLABLE | Org hierarchy Level 01 |
| level_02 | TEXT | NULLABLE | Org hierarchy Level 02 |
| level_03 | TEXT | NULLABLE | Org hierarchy Level 03 |
| level_04 | TEXT | NULLABLE | Org hierarchy Level 04 |
| level_05 | TEXT | NULLABLE | Org hierarchy Level 05 |
| level_06 | TEXT | NULLABLE | Org hierarchy Level 06 |
| level_07 | TEXT | NULLABLE | Org hierarchy Level 07 |
| level_08 | TEXT | NULLABLE | Org hierarchy Level 08 |
| created_at | TEXT (ISO 8601) | NOT NULL | Record creation timestamp |
| updated_at | TEXT (ISO 8601) | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_workers_email` — UNIQUE index on `email` (login lookup)
- `idx_workers_manager_email` — Index on `manager_email` (direct reports query)
- `idx_workers_is_manager` — Index on `is_manager` (role filtering)

### 2.2.2 `compliance_weeks`

Stores per-employee, per-week badge compliance data from RTO Excel uploads. One row per employee per week.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT (UUID) | PRIMARY KEY | Internal opaque identifier |
| worker_id | TEXT | NOT NULL, FK → workers.id | Employee reference |
| week_start | TEXT (ISO date) | NOT NULL | Monday of the week (parsed from "Week Range") |
| week_end | TEXT (ISO date) | NOT NULL | Sunday of the week (parsed from "Week Range") |
| week_range_raw | TEXT | NOT NULL | Original "MM/DD/YYYY - MM/DD/YYYY" string |
| badge_swipes | INTEGER | NOT NULL, CHECK >= 0 | Total badge swipes for the week |
| system_pto_days | INTEGER | NOT NULL, DEFAULT 0 | PTO days from uploaded data |
| meets_four_day | BOOLEAN | NOT NULL | TRUE if "Meets 4-Day Requirement" = "Yes" |
| on_leave | BOOLEAN | NOT NULL, DEFAULT FALSE | On-leave status from upload |
| et_org | TEXT | NULLABLE | ET Org from upload row |
| elg_org | TEXT | NULLABLE | ELG Org from upload row |
| supervisory_org | TEXT | NULLABLE | Supervisory Org from upload row |
| location | TEXT | NULLABLE | Location from upload row |
| uploaded_at | TEXT (ISO 8601) | NOT NULL | When this data was uploaded |
| created_at | TEXT (ISO 8601) | NOT NULL | Record creation timestamp |
| updated_at | TEXT (ISO 8601) | NOT NULL | Last update timestamp |

**Constraints:**
- `uq_worker_week` — UNIQUE constraint on `(worker_id, week_start)` — enforces one record per employee per week for upsert behavior

**Indexes:**
- `idx_cw_worker_id` — Index on `worker_id` (employee compliance lookup)
- `idx_cw_week_start` — Index on `week_start` (date range queries)
- `idx_cw_worker_week` — Covering index on `(worker_id, week_start DESC)` (sorted compliance queries)

### 2.2.3 `exceptions`

Stores employee-submitted exception explanations with **day-level granularity**. Multiple exceptions may exist for the same week (on different days, or re-submission after rejection for the same day — creates a new record; old records preserved).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT (UUID) | PRIMARY KEY | Internal opaque identifier |
| worker_id | TEXT | NOT NULL, FK → workers.id | Employee who submitted |
| week_id | TEXT | NOT NULL, FK → compliance_weeks.id | Which week this exception covers |
| day_date | TEXT (ISO date) | NOT NULL | Specific day within the week this exception is for |
| explanation | TEXT | NOT NULL | Employee's explanation text (sanitized) |
| status | TEXT | NOT NULL, DEFAULT 'pending' | 'pending', 'approved', 'rejected' |
| created_at | TEXT (ISO 8601) | NOT NULL | Submission timestamp |
| updated_at | TEXT (ISO 8601) | NOT NULL | Last status change timestamp |

**Constraints:**
- `CHECK (status IN ('pending', 'approved', 'rejected'))`
- `CHECK (day_date >= week.week_start AND day_date <= week.week_end)` — enforced at application layer (SQLite FK limitation)

**Indexes:**
- `idx_exc_worker_id` — Index on `worker_id`
- `idx_exc_week_id` — Index on `week_id`
- `idx_exc_status` — Index on `status` (pending exceptions query for manager dashboard)
- `idx_exc_day` — Index on `(week_id, day_date)` (same-day constraint check)

**Re-submission after rejection (Gap #3):** When an employee's exception is rejected, they may submit a new exception for the same week and day. This creates a new `exceptions` row with status='pending'. The previous rejected record is preserved (never deleted/overwritten). The compliance state transitions from Red back to Yellow. Only the latest pending exception per day is actionable; prior records serve as audit history.

### 2.2.4 `disputes`

Stores employee-submitted badge count disputes with **day-level granularity**. Like exceptions, re-submission after rejection creates a new record.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT (UUID) | PRIMARY KEY | Internal opaque identifier |
| worker_id | TEXT | NOT NULL, FK → workers.id | Employee who submitted |
| week_id | TEXT | NOT NULL, FK → compliance_weeks.id | Which week is disputed |
| day_date | TEXT (ISO date) | NOT NULL | Specific day within the week this dispute is for |
| reason | TEXT | NULLABLE | Optional reason text (sanitized) |
| status | TEXT | NOT NULL, DEFAULT 'pending' | 'pending', 'approved', 'rejected' |
| created_at | TEXT (ISO 8601) | NOT NULL | Submission timestamp |
| updated_at | TEXT (ISO 8601) | NOT NULL | Last status change timestamp |

**Constraints:**
- `CHECK (status IN ('pending', 'approved', 'rejected'))`

**Indexes:**
- `idx_disp_worker_id` — Index on `worker_id`
- `idx_disp_week_id` — Index on `week_id`
- `idx_disp_status` — Index on `status`
- `idx_disp_day` — Index on `(week_id, day_date)` (same-day constraint check)

**Same-day constraint (Gap #2):** An employee CANNOT submit both a dispute AND an exception for the **same day** within a week. The backend must check: before creating a dispute, verify no pending/approved exception exists for that `(week_id, day_date)`; before creating an exception, verify no pending/approved dispute exists for that `(week_id, day_date)`. Different days within the same week CAN have different action types.

### 2.2.5 `pto_additions`

Stores employee-added PTO days with **day-level granularity**. **PTO additions follow the same approval workflow as exceptions** — they trigger Yellow (pending) state and require manager approval to become Excused (Blue).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT (UUID) | PRIMARY KEY | Internal opaque identifier |
| worker_id | TEXT | NOT NULL, FK → workers.id | Employee who added PTO |
| week_id | TEXT | NOT NULL, FK → compliance_weeks.id | Which week |
| day_date | TEXT (ISO date) | NOT NULL | Specific day within the week |
| days_added | INTEGER | NOT NULL, CHECK > 0 | Number of PTO days added |
| status | TEXT | NOT NULL, DEFAULT 'pending' | 'pending', 'approved', 'rejected' |
| created_at | TEXT (ISO 8601) | NOT NULL | When PTO was added |
| updated_at | TEXT (ISO 8601) | NOT NULL | Last status change timestamp |

**Constraints:**
- `CHECK (status IN ('pending', 'approved', 'rejected'))`

**Indexes:**
- `idx_pto_week_id` — Index on `week_id`
- `idx_pto_worker_id` — Index on `worker_id`
- `idx_pto_status` — Index on `status`
- `idx_pto_day` — Index on `(week_id, day_date)`

**PTO approval workflow (Gap #4):** PTO additions are NOT just annotations — they follow the same Yellow→approval workflow as exceptions. When an employee adds PTO, the week goes Yellow (pending). Manager must approve to change the week to Blue (Excused). PTO can coexist on the same day as either an exception or a dispute (no same-day constraint between PTO and exception/dispute).

**PTO display:** Employee-added PTO is shown as a separate column (`Added PTO`) alongside the system PTO (`System PTO` from uploaded data). Both values are displayed independently.

### 2.2.6 `manager_actions`

Stores all manager approval/rejection actions for audit trail. One record per action. Covers exceptions, disputes, AND PTO additions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT (UUID) | PRIMARY KEY | Internal opaque identifier |
| actor_id | TEXT | NOT NULL, FK → workers.id | Manager who took the action |
| week_id | TEXT | NOT NULL, FK → compliance_weeks.id | Which compliance week |
| target_type | TEXT | NOT NULL | 'exception', 'dispute', or 'pto' |
| target_id | TEXT | NOT NULL | FK → exceptions.id, disputes.id, or pto_additions.id |
| action | TEXT | NOT NULL | 'approved' or 'rejected' |
| note | TEXT | NULLABLE | Optional rejection note text (sanitized) |
| created_at | TEXT (ISO 8601) | NOT NULL | Action timestamp |

**Constraints:**
- `CHECK (target_type IN ('exception', 'dispute', 'pto'))`
- `CHECK (action IN ('approved', 'rejected'))`

**Indexes:**
- `idx_ma_actor_id` — Index on `actor_id` (manager's action history)
- `idx_ma_week_id` — Index on `week_id` (actions per week)
- `idx_ma_target` — Index on `(target_type, target_id)` (lookup by target)

### 2.2.7 `sessions`

Stores active user sessions for both worker (email-based) and admin (credential-based) auth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT (UUID) | PRIMARY KEY | Session identifier |
| user_id | TEXT | NOT NULL | Worker ID (for employees/managers) or 'admin' (for admin users) |
| user_type | TEXT | NOT NULL | 'worker' or 'admin' |
| token | TEXT | NOT NULL, UNIQUE | Session token (opaque string) |
| expires_at | TEXT (ISO 8601) | NOT NULL | Session expiration (default: login + 8 hours) |
| created_at | TEXT (ISO 8601) | NOT NULL | Login timestamp |

**Constraints:**
- `CHECK (user_type IN ('worker', 'admin'))`

**Indexes:**
- `idx_sessions_token` — UNIQUE index on `token` (token lookup on every request)
- `idx_sessions_expires` — Index on `expires_at` (cleanup of expired sessions)

---

## 2.3 Admin Authentication Design (Gap #1 Resolution)

**Admin users authenticate via dedicated credentials, NOT from worker data.**

- Admin username and password are stored in environment variables: `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Admin login uses a separate endpoint: `POST /api/auth/admin-login`
- Admin sessions have `user_type = 'admin'` and `user_id = 'admin'`
- Admin users do NOT need a record in the `workers` table
- Admin role grants access to the Upload screen only (no employee/manager views)
- For POC, a single admin account is sufficient; multiple admins can be supported by adding `ADMIN_USERNAME_2`, `ADMIN_PASSWORD_2` etc., or a JSON config file

**Why dedicated credentials (not worker data):**
- HR/Admin users may not be in the worker/org data file (they could be external contractors, HR systems team, etc.)
- Separating admin auth from worker auth simplifies role management
- In production, admin access would be via Okta SSO with specific group memberships

---

## 2.4 Compliance State Computation (5-State Model)

The compliance state is **derived, not stored as a single column**. It is computed at query time from the combination of badge data, exceptions, disputes, and PTO additions — with **day-level granularity** rolled up to week level.

### 2.4.1 Day-Level State

Each day within a week can have at most one of: exception, dispute, or PTO pending/approved. The day-level state is:

```
function computeDayState(day, exceptions, disputes, ptos):
    # Check for approved actions first
    if any exception for this day has status = 'approved': return EXCUSED
    if any dispute for this day has status = 'approved': return EXCUSED
    if any PTO for this day has status = 'approved': return EXCUSED

    # Check for pending actions
    if any exception for this day has status = 'pending': return PENDING_EXCEPTION
    if any dispute for this day has status = 'pending': return PENDING_DISPUTE
    if any PTO for this day has status = 'pending': return PENDING_PTO

    # No actions on this day
    return NO_ACTION
```

### 2.4.2 Week-Level State (5 states)

The week-level compliance state is derived from badge data AND all day-level actions:

```
function computeWeekComplianceState(week, allDayStates):
    # 1. If badge data says compliant AND no overriding actions → Green
    if week.meets_four_day = TRUE and no pending/approved actions exist:
        return COMPLIANT (Green)

    # 2. If any day has an approved action → Excused (takes priority)
    if any day has EXCUSED state:
        return EXCUSED (Blue)

    # 3. Count pending action TYPES across all days in the week
    pending_types = set()
    for day in week:
        if day state = PENDING_EXCEPTION: pending_types.add('exception')
        if day state = PENDING_DISPUTE: pending_types.add('dispute')
        if day state = PENDING_PTO: pending_types.add('pto')

    # 4. Multiple distinct action types pending → Orange
    if len(pending_types) >= 2:
        return MULTIPLE_ACTIONS_PENDING (Orange)

    # 5. Single action type pending → Yellow
    if len(pending_types) == 1:
        return EXCEPTION_PENDING (Yellow)

    # 6. Badge data says compliant (with no pending actions remaining)
    if week.meets_four_day = TRUE:
        return COMPLIANT (Green)

    # 7. Default: non-compliant
    return NON_COMPLIANT (Red)
```

### 2.4.3 Five Compliance States

| State | Color | Meaning | Trigger |
|-------|-------|---------|---------|
| Compliant | Green | Met 4-day badge requirement | `meets_four_day = TRUE`, no overriding actions |
| Excused | Blue | Manager approved an exception, dispute, or PTO | Any day-level action approved by manager |
| Exception Pending | Yellow | Single action type pending | One type of action pending (exception OR dispute OR PTO) |
| Multiple Actions Pending | Orange | Multiple action types pending | Two or more distinct action types pending on different days |
| Non-Compliant | Red | Did not meet requirement, no pending actions | `meets_four_day = FALSE`, no pending or approved actions |

### 2.4.4 State Transitions

| Current State | Trigger | New State |
|--------------|---------|-----------|
| Red | Employee submits exception (on a day) | Yellow |
| Red | Employee submits dispute (on a day) | Yellow |
| Red | Employee submits PTO (on a day) | Yellow |
| Yellow (exception only) | Employee also submits dispute (different day) | Orange |
| Yellow (dispute only) | Employee also submits exception (different day) | Orange |
| Yellow (any) | Employee also submits PTO (different day, if another type pending) | Orange |
| Yellow | Manager approves the pending action | Blue |
| Yellow | Manager rejects the pending action | Red |
| Orange | Manager approves any one pending action | Blue* |
| Orange | Manager rejects one action (other still pending) | Yellow |
| Orange | Manager rejects all pending actions | Red |
| Red (after rejection) | Employee re-submits new exception/dispute/PTO | Yellow |
| Green | — | No transitions (already compliant) |
| Blue | — | No transitions (already excused) |

*Once any action is approved, the week becomes Excused regardless of other pending actions. The remaining pending actions can still be individually approved/rejected for completeness, but the week stays Blue.

### 2.4.5 Pie Chart Computation

The pie chart uses **4 slices** (Orange pending is grouped with Yellow pending for simplicity):

| Slice | Color | Includes |
|-------|-------|----------|
| Compliant | Green | Weeks with `meets_four_day = TRUE` and no overriding actions |
| Excused | Blue | Weeks with at least one approved exception/dispute/PTO |
| Pending | Yellow | Weeks with any pending actions (both Yellow and Orange states) |
| Non-Compliant | Red | Weeks with `meets_four_day = FALSE` and no pending or approved actions |

Note: Per original Business Rule #12, pending actions were counted as Non-Compliant in the pie chart. With the new 5-state model, we show "Pending" as a distinct 4th slice to give better visibility into actionable items. This is a design choice — if the business prefers the original 3-slice (pending counted as red), the pie chart computation can be adjusted without schema changes.

---

# 3. Integration Patterns

## 3.1 API Endpoint Catalog

All endpoints return structured JSON. All protected endpoints require `Authorization: Bearer <token>` header. All responses include `X-Correlation-ID` header.

### 3.1.1 Authentication

| Method | Path | Auth | Request | Response | Requirements |
|--------|------|------|---------|----------|-------------|
| POST | `/api/auth/login` | None | `{"email": "user@nordstrom.com"}` | `{"token": "...", "user": {"id": "uuid", "name": "...", "role": "employee\|manager", "is_manager": bool}}` | FR-030, TR-009, NFR-001 |
| POST | `/api/auth/admin-login` | None | `{"username": "...", "password": "..."}` | `{"token": "...", "user": {"id": "admin", "role": "admin"}}` | FR-031, NFR-001 |
| POST | `/api/auth/logout` | Bearer | _(empty)_ | `{"message": "Logged out"}` | NFR-001 |

### 3.1.2 Employee Compliance

| Method | Path | Auth | Request | Response | Requirements |
|--------|------|------|---------|----------|-------------|
| GET | `/api/compliance/me?weeks=13` | Bearer | Query: `weeks` (13 or 52) | See response shape below | FR-001–FR-006, TR-014, NFR-011 |
| POST | `/api/compliance/me/weeks/{weekId}/exception` | Bearer | `{"day_date": "2026-03-02", "explanation": "..."}` | `{"id": "uuid", "status": "pending", "day_date": "...", "week_status": "exception_pending"}` | FR-009, TR-004, TR-012 |
| POST | `/api/compliance/me/weeks/{weekId}/dispute` | Bearer | `{"day_date": "2026-03-02", "reason": "..."}` | `{"id": "uuid", "status": "pending", "day_date": "...", "week_status": "exception_pending"}` | FR-007, TR-004, TR-012 |
| POST | `/api/compliance/me/weeks/{weekId}/pto` | Bearer | `{"day_date": "2026-03-02", "days": 1}` | `{"id": "uuid", "status": "pending", "day_date": "...", "week_status": "exception_pending"}` | FR-008, TR-012 |

**GET `/api/compliance/me` response shape:**

```json
{
  "employee": {
    "id": "uuid",
    "name": "Jane Smith"
  },
  "weeks": [
    {
      "id": "uuid",
      "week_start": "2026-02-23",
      "week_end": "2026-03-01",
      "badge_swipes": 3,
      "system_pto": 1,
      "added_pto": 0,
      "meets_four_day": false,
      "status": "exception_pending",
      "is_editable": true,
      "day_actions": [
        {
          "day_date": "2026-02-25",
          "type": "exception",
          "id": "uuid",
          "status": "pending",
          "explanation": "Business travel"
        }
      ],
      "pending_exceptions": 1,
      "pending_disputes": 0,
      "pending_pto": 0
    }
  ],
  "pie_chart": {
    "compliant": 8,
    "excused": 2,
    "pending": 2,
    "non_compliant": 1
  }
}
```

### 3.1.3 Manager Dashboard & Actions

| Method | Path | Auth | Request | Response | Requirements |
|--------|------|------|---------|----------|-------------|
| GET | `/api/manager/reports` | Bearer (Manager) | Query: `filter` (all\|compliant\|non_compliant\|pending\|multiple_pending) | `{"reports": [{id, name, compliance_pct, status, pending_exceptions, pending_disputes, pending_pto}]}` | FR-012, FR-013, NFR-012 |
| GET | `/api/manager/reports/{workerId}/compliance?weeks=13` | Bearer (Manager) | Query: `weeks` | Same shape as `/api/compliance/me` but for the target employee (read-only, includes day_actions) | FR-014, FR-015, FR-016 |
| GET | `/api/manager/reports/{workerId}/reports` | Bearer (Manager) | _(none)_ | Same shape as `/api/manager/reports` but for a sub-manager's direct reports | FR-022 |
| GET | `/api/manager/reports/{workerId}/breadcrumbs` | Bearer (Manager) | _(none)_ | `{"breadcrumbs": [{id, name, level}]}` | FR-023, TR-008 |
| POST | `/api/manager/exceptions/{exceptionId}/approve` | Bearer (Manager) | _(empty)_ | `{"action": "approved", "week_status": "excused"}` | FR-017, TR-011, BR-012 |
| POST | `/api/manager/exceptions/{exceptionId}/reject` | Bearer (Manager) | `{"note": "..."}` (optional) | `{"action": "rejected", "week_status": "..."}` | FR-018, TR-011 |
| POST | `/api/manager/disputes/{disputeId}/approve` | Bearer (Manager) | _(empty)_ | `{"action": "approved", "week_status": "excused"}` | FR-019, TR-011, BR-012 |
| POST | `/api/manager/disputes/{disputeId}/reject` | Bearer (Manager) | `{"note": "..."}` (optional) | `{"action": "rejected", "week_status": "..."}` | FR-020, TR-011 |
| POST | `/api/manager/pto/{ptoId}/approve` | Bearer (Manager) | _(empty)_ | `{"action": "approved", "week_status": "excused"}` | FR-017 (extended), TR-011, BR-012 |
| POST | `/api/manager/pto/{ptoId}/reject` | Bearer (Manager) | `{"note": "..."}` (optional) | `{"action": "rejected", "week_status": "..."}` | FR-018 (extended), TR-011 |

### 3.1.4 Admin Upload

| Method | Path | Auth | Request | Response | Requirements |
|--------|------|------|---------|----------|-------------|
| POST | `/api/admin/upload/badge-data` | Bearer (Admin) | Multipart form: `file` (.xlsx) | `{"summary": {total_rows, new_records, updated_records, skipped_records, warnings: [{employee, reason}]}}` | FR-025–FR-029, TR-005, TR-007, TR-016, NFR-006, NFR-013 |
| POST | `/api/admin/upload/worker-data` | Bearer (Admin) | Multipart form: `file` (.xlsx) | `{"summary": {total_rows, eligible_employees, excluded_cw, excluded_at_home}}` | FR-033, TR-006, BR-007, BR-008 |

### 3.1.5 Health & Observability

| Method | Path | Auth | Request | Response | Requirements |
|--------|------|------|---------|----------|-------------|
| GET | `/health` | None | _(none)_ | `{"status": "healthy"}` | NFR-009 |
| GET | `/ready` | None | _(none)_ | `{"status": "ready"}` or 503 `{"status": "not ready"}` | NFR-009 |

### 3.1.6 Error Response Format

All error responses follow this structure (per NFR-010):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Week is outside the 5-week edit window",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Standard error codes:**

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Bad input (missing fields, invalid format, outside edit window) |
| 400 | INVALID_FILE | Upload file format invalid |
| 400 | SAME_DAY_CONFLICT | Cannot submit dispute + exception on the same day |
| 401 | UNAUTHORIZED | Missing or invalid session token |
| 401 | INVALID_CREDENTIALS | Admin login with wrong username/password |
| 403 | FORBIDDEN | Role insufficient for endpoint |
| 403 | SELF_APPROVAL | Manager attempting to approve own exception/dispute/PTO |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Duplicate action (e.g., active pending action already exists for this day) |
| 500 | INTERNAL_ERROR | Unexpected server error (details logged, not exposed) |

---

## 3.2 File Upload Flow

```
Admin (Browser)                Frontend              Backend (Upload Service)         Database
     │                           │                          │                           │
     │  Select .xlsx file        │                          │                           │
     │ ─────────────────────────>│                          │                           │
     │                           │  POST /api/admin/upload  │                           │
     │                           │  multipart/form-data     │                           │
     │                           │ ────────────────────────>│                           │
     │                           │                          │  1. Validate file ext     │
     │                           │                          │  2. Parse .xlsx           │
     │                           │                          │  3. Validate 12 columns   │
     │                           │                          │  4. For each row:         │
     │                           │                          │     a. Filter CW/At Home  │
     │                           │                          │     b. Match worker by    │
     │                           │                          │        name in workers    │
     │                           │                          │     c. Skip if no match   │
     │                           │                          │        (add to warnings)  │
     │                           │                          │     d. Parse week range   │
     │                           │                          │     e. UPSERT into        │
     │                           │                          │        compliance_weeks   │
     │                           │                          │        (key: worker_id +  │
     │                           │                          │         week_start)       │
     │                           │                          │  5. Employee edits        │
     │                           │                          │     (exceptions, PTO,     │
     │                           │                          │     disputes) are in      │
     │                           │                          │     separate tables —     │
     │                           │                          │     NOT touched by upload │
     │                           │                          │ ────────────────────────> │
     │                           │                          │                           │
     │                           │  200 OK + summary        │                           │
     │                           │ <────────────────────────│                           │
     │  Display results          │                          │                           │
     │ <─────────────────────────│                          │                           │
```

**Key behaviors:**
- UPSERT on `(worker_id, week_start)` — existing badge data is replaced, new weeks are inserted
- Employee-generated data (exceptions, disputes, PTO additions, manager actions) lives in separate tables and is NEVER modified by uploads (FR-027, NFR-017)
- Unmatched employees (in badge data but not in workers table) are skipped with a warning (FR-028)

---

## 3.3 Authentication Flow

### 3.3.1 Worker Login (Employee / Manager)

```
User (Browser)               Frontend                Backend (Auth)              Database
     │                          │                          │                       │
     │  Enter work email        │                          │                       │
     │ ────────────────────────>│                          │                       │
     │                          │  POST /api/auth/login    │                       │
     │                          │  {"email": "..."}        │                       │
     │                          │ ────────────────────────>│                       │
     │                          │                          │  SELECT from workers   │
     │                          │                          │  WHERE email = ?       │
     │                          │                          │ ─────────────────────>│
     │                          │                          │                       │
     │                          │                          │  If not found → 401   │
     │                          │                          │                       │
     │                          │                          │  Determine role:       │
     │                          │                          │  - is_manager=TRUE →  │
     │                          │                          │    role=manager        │
     │                          │                          │  - else → role=employee│
     │                          │                          │                       │
     │                          │                          │  Generate session token│
     │                          │                          │  INSERT into sessions  │
     │                          │                          │  (user_type='worker',  │
     │                          │                          │   expires_at=now+8h)   │
     │                          │                          │ ─────────────────────>│
     │                          │                          │                       │
     │                          │  200 {token, user}       │                       │
     │                          │ <────────────────────────│                       │
     │  Store token, redirect   │                          │                       │
     │  to role-appropriate view│                          │                       │
     │ <────────────────────────│                          │                       │
```

### 3.3.2 Admin Login

```
Admin (Browser)              Frontend                Backend (Auth)
     │                          │                          │
     │  Enter username/password │                          │
     │ ────────────────────────>│                          │
     │                          │  POST /api/auth/         │
     │                          │  admin-login             │
     │                          │  {"username":"...",      │
     │                          │   "password":"..."}      │
     │                          │ ────────────────────────>│
     │                          │                          │  Compare against
     │                          │                          │  ADMIN_USERNAME and
     │                          │                          │  ADMIN_PASSWORD env vars
     │                          │                          │
     │                          │                          │  If mismatch → 401
     │                          │                          │
     │                          │                          │  Generate session token
     │                          │                          │  INSERT into sessions
     │                          │                          │  (user_type='admin',
     │                          │                          │   user_id='admin')
     │                          │                          │
     │                          │  200 {token, user}       │
     │                          │ <────────────────────────│
     │  Redirect to Upload page │                          │
     │ <────────────────────────│                          │
```

**Session validation (on every subsequent request):**
1. Extract `Authorization: Bearer <token>` header
2. Lookup token in `sessions` table
3. Check `expires_at` > current time
4. If `user_type = 'worker'` → load worker record, attach `req.user` (id, email, role, is_manager)
5. If `user_type = 'admin'` → attach `req.user` (id='admin', role='admin')
6. If invalid/expired → return 401

---

## 3.4 State Transition Flow (Day-Level Granularity)

```
Employee Action                                Manager Action
     │                                              │
     │  Submit Exception                            │
     │  (Red week, last 5 weeks,                    │
     │   select specific day)                       │
     │                                              │
     ▼                                              │
┌──────────────────────┐                           │
│ Validate:            │                           │
│ - Week in 5-week     │                           │
│   window             │                           │
│ - Day within week    │                           │
│ - No dispute on      │                           │
│   same day           │                           │
│                      │                           │
│ Create exception     │                           │
│ record (pending)     │                           │
│ Week → Yellow        │                           │
│ (or Orange if other  │                           │
│  action type pending │                           │
│  on different day)   │                           │
└────────┬─────────────┘                           │
         │                                          │
         │        Manager views pending             │
         │ <───────── items on dashboard ──────────│
         │                                          │
         │                              ┌───────────┴──────────┐
         │                              │                      │
         │                        Approve                 Reject
         │                              │                      │
         │                    ┌─────────▼──────┐    ┌──────────▼─────┐
         │                    │target.status    │    │target.status   │
         │                    │= 'approved'     │    │= 'rejected'   │
         │                    │Week → Blue*     │    │Week → Red**    │
         │                    │Create mgr_action│    │Create mgr_action│
         │                    └────────────────┘    │(with opt. note)│
         │                                          └────────────────┘

* Blue takes priority: once ANY action on any day is approved, week = Blue.
  Other pending actions remain and can be individually approved/rejected,
  but the week stays Blue.

** Red only if NO other pending actions remain on other days.
   If another action type is still pending on a different day → Yellow.
   Recomputed from all day-level states.
```

**Same-day constraint enforcement:**
- Before creating an exception for day D: check no pending/approved dispute exists for `(week_id, day_date = D)`
- Before creating a dispute for day D: check no pending/approved exception exists for `(week_id, day_date = D)`
- PTO additions do NOT have this constraint — PTO can be added for any day regardless of existing exceptions/disputes
- If constraint violated → 400 SAME_DAY_CONFLICT error

**Self-approval prevention (BR-012, TR-011):**
- On any approve/reject API call, the backend checks: `actor_id != target.worker_id`
- If they match → 403 SELF_APPROVAL error
- This applies to exceptions, disputes, AND PTO approvals

**5-week edit window (TR-012):**
- On any exception/dispute/PTO submission, the backend:
  1. Gets the 5 most recent distinct `week_start` values from `compliance_weeks` for that worker
  2. Checks that the target week's `week_start` is in that set
  3. If not → 400 VALIDATION_ERROR

---

# 4. Requirements Traceability

| Requirement | Type | Design Section | How Addressed |
|-------------|------|----------------|---------------|
| FR-001 | Functional | 1.1.6, 1.2.2, 3.1.2 | Compliance Service retrieves weekly data with day-level actions; Employee View renders table; GET /api/compliance/me |
| FR-002 | Functional | 3.1.2 | `weeks=13` default query parameter |
| FR-003 | Functional | 3.1.2 | `weeks=52` query parameter option |
| FR-004 | Functional | 2.4, 1.2.2 | 5-state compliance computed at query time; frontend renders color-coded rows |
| FR-005 | Functional | 2.4.5, 3.1.2 | 4-slice pie chart in compliance response |
| FR-006 | Functional | 3.1.2 | Pie chart data computed from same weeks parameter as table |
| FR-007 | Functional | 1.1.7, 2.2.4, 3.1.2 | POST /api/.../dispute with day_date; disputes table |
| FR-008 | Functional | 1.1.7, 2.2.5, 3.1.2 | POST /api/.../pto with day_date; pto_additions table with approval workflow |
| FR-009 | Functional | 1.1.7, 2.2.3, 3.1.2 | POST /api/.../exception with day_date; exceptions table |
| FR-010 | Functional | 1.1.7, 3.4 | 5-week edit window enforced server-side |
| FR-011 | Functional | 1.2.3 | Manager Dashboard includes own Employee View |
| FR-012 | Functional | 1.1.6, 1.2.3, 3.1.3 | GET /api/manager/reports including pending_pto count |
| FR-013 | Functional | 3.1.3 | `filter` query parameter includes `multiple_pending` option |
| FR-014 | Functional | 1.2.4, 3.1.3 | GET /api/manager/reports/{workerId}/compliance with day_actions |
| FR-015 | Functional | 1.2.4 | Exception Detail Panel in drill-down view |
| FR-016 | Functional | 1.2.4 | Dispute Indicator in drill-down view |
| FR-017 | Functional | 1.1.7, 2.2.6, 3.1.3 | POST /api/manager/exceptions/{id}/approve + /pto/{id}/approve |
| FR-018 | Functional | 1.1.7, 2.2.6, 3.1.3 | POST /api/manager/exceptions/{id}/reject + /pto/{id}/reject |
| FR-019 | Functional | 1.1.7, 2.2.6, 3.1.3 | POST /api/manager/disputes/{id}/approve |
| FR-020 | Functional | 1.1.7, 2.2.6, 3.1.3 | POST /api/manager/disputes/{id}/reject |
| FR-021 | Functional | 1.2.4, 3.1.3 | Approve/reject buttons only available in drill-down detail view |
| FR-022 | Functional | 1.1.8, 3.1.3 | GET /api/manager/reports/{workerId}/reports for recursive drill-down |
| FR-023 | Functional | 1.1.8, 1.2.6, 3.1.3 | GET /api/manager/reports/{workerId}/breadcrumbs |
| FR-024 | Functional | 1.1.7, 3.4 | Server-side actor_id != worker_id check on approve/reject |
| FR-025 | Functional | 1.1.5, 3.1.4, 3.2 | POST /api/admin/upload/badge-data with multipart form |
| FR-026 | Functional | 1.1.5, 2.2.2, 3.2 | UPSERT on (worker_id, week_start) unique constraint |
| FR-027 | Functional | 2.2, 3.2 | Employee data in separate tables, untouched by upload |
| FR-028 | Functional | 1.1.5, 3.2 | Skip unmatched workers, add to warnings list |
| FR-029 | Functional | 1.1.5, 1.2.5, 3.1.4 | Upload response includes summary counts |
| FR-030 | Functional | 1.1.1, 1.2.1, 3.1.1, 3.3 | Dual auth: email login + admin credential login |
| FR-031 | Functional | 1.1.2, 3.3 | Role determined from is_manager flag (workers) or admin credentials |
| FR-032 | Functional | 1.1.5, 3.2 | Upload Service parses 12-column Excel format |
| FR-033 | Functional | 1.1.10 | Worker Data Loader parses 35-column org file |
| FR-034 | Functional | 2.2.3–2.2.6 | Separate tables for exceptions, disputes, PTO additions, manager actions |
| TR-001 | Technical | 2.2.2 | compliance_weeks table stores all badge data fields |
| TR-002 | Technical | 2.2.1 | workers table stores hierarchy and role fields |
| TR-003 | Technical | 2.2.3–2.2.6 | Separate tables with FKs, day-level granularity |
| TR-004 | Technical | 2.4 | 5-state machine computed from badge data + day-level actions |
| TR-005 | Technical | 1.1.5, 3.2 | Upload Service validates columns and data types |
| TR-006 | Technical | 1.1.10 | Worker Data Loader filters CW and At Home |
| TR-007 | Technical | 1.1.5, 2.2.2, 3.2 | UPSERT behavior via unique constraint |
| TR-008 | Technical | 1.1.8, 2.2.1 | Level 01–08 columns in workers table; Hierarchy Service |
| TR-009 | Technical | 1.1.1, 2.2.7, 3.3 | sessions table with token lookup, supports both user types |
| TR-010 | Technical | 1.1.2 | RBAC Middleware checks role on every endpoint |
| TR-011 | Technical | 1.1.7, 3.4 | actor_id != worker_id server-side check (exceptions, disputes, PTO) |
| TR-012 | Technical | 1.1.7, 3.4 | 5-week window validated before any employee action |
| TR-013 | Technical | 3.1 | Full REST API catalog with structured JSON responses |
| TR-014 | Technical | 2.4.5, 3.1.2 | 4-slice pie chart computation in compliance response |
| TR-015 | Technical | 1.2.4 | Approve/reject only in drill-down view (UI enforcement) |
| TR-016 | Technical | 1.1.5, 3.1.4 | Upload response summary |
| TR-017 | Technical | All | Runs locally with SQLite, no external dependencies |
| NFR-001 | Non-Functional | 1.1.1, 2.2.7, 3.3 | Session-based auth with 8-hour expiry, dual login paths |
| NFR-002 | Non-Functional | 1.1.2 | RBAC middleware with audit logging |
| NFR-003 | Non-Functional | 1.1.4 | PII Masking Utility for all log output |
| NFR-004 | Non-Functional | 3.1 | All API paths use UUIDs, no PII in URLs |
| NFR-006 | Non-Functional | 1.1.5, 3.2 | File validation; input sanitization; same-day constraint |
| NFR-007 | Non-Functional | 1.1.3 | Structured JSON logging with standard fields |
| NFR-008 | Non-Functional | 1.1.3 | Correlation ID middleware |
| NFR-009 | Non-Functional | 1.1.9, 3.1.5 | /health and /ready endpoints |
| NFR-010 | Non-Functional | 3.1.6 | Structured error response format with error codes |
| NFR-017 | Non-Functional | 2.2, 3.2 | Employee data in separate tables, upload only touches compliance_weeks |

---

# 5. Gap Resolutions (All 5 Resolved)

| Gap # | Question | Resolution | Design Impact |
|-------|----------|------------|---------------|
| 1 | Admin role — no "Is Admin" field in worker data | **Dedicated admin login** with credentials in `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`). Admin does NOT need a worker record. Separate login endpoint `/api/auth/admin-login`. | New admin login endpoint; sessions table has `user_type` column; Login page has two auth paths; workers table has no `is_admin` column |
| 2 | Dispute + exception on same week | **Allowed on different days, NOT on the same day.** All action tables have `day_date` column. Same-day constraint enforced: cannot have dispute + exception on the same day. Different days within a week can have different action types. | `day_date` column on exceptions, disputes, pto_additions; same-day validation; new SAME_DAY_CONFLICT error code |
| 3 | Re-submission after rejection | **Allowed.** Creates new record (old preserved for audit). Week transitions Red → Yellow again. Only latest pending action per day is actionable. | Multiple rows allowed per worker+week+day in exceptions/disputes; state computation checks for latest pending |
| 4 | PTO additions follow same approval workflow as exceptions | **PTO triggers Yellow state and requires manager approval.** PTO is NOT auto-excusing. Same Red → Yellow → Blue (approved) or Yellow → Red (rejected) flow. | `status` column added to pto_additions; new manager PTO approve/reject endpoints; PTO included in pending counts on dashboard |
| 5 | Dual dispute + exception pending simultaneously | **5th compliance state: "Multiple Actions Pending" (Orange).** When 2+ distinct action types are pending on different days within the same week → Orange. Pie chart groups Orange with Yellow as "Pending" slice. | New 5-state model; week-level state computed from day-level rollup; pie chart uses 4 slices (pending combines Yellow+Orange) |
