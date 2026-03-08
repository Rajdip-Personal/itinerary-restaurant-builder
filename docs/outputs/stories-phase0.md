# User Stories — Phase 0: Project Bootstrap (Sprint 1)

## Summary

- **Total Stories:** 13
- **Total Effort:** ~16.5 developer-days
- **Sprint:** 1
- **Phase Milestone:** Development environment operational, database schema deployed, auth working, middleware stack in place, sample data loaded.

## Story Map

| Work Package | Stories | Effort |
|---|---|---|
| WP-0.1: Monorepo Scaffold & Toolchain | S-0.1.1, S-0.1.2 | S + S |
| WP-0.2: Database Schema & Migrations | S-0.2.1, S-0.2.2 | M + M |
| WP-0.3: Authentication Foundation | S-0.3.1, S-0.3.2, S-0.3.3 | M + M + S |
| WP-0.4: Core Middleware Stack | S-0.4.1, S-0.4.2 | M + M |
| WP-0.5: Health Check Endpoints | S-0.5.1 | S |
| WP-0.6: Sample Data Seeding | S-0.6.1, S-0.6.2 | M + S |

## Requirements Coverage

| Requirement | Stories | Status |
|---|---|---|
| TR-017 (Local dev environment) | S-0.1.1 | Covered |
| NFR-016 (Code quality standards) | S-0.1.2 | Covered |
| TR-001 (Employee-week record + day-level) | S-0.2.1 | Covered |
| TR-002 (Worker/org hierarchy) | S-0.2.1 | Covered |
| TR-003 (Application-generated data) | S-0.2.2 | Covered |
| TR-009 (Email-based auth) | S-0.3.1 | Covered |
| TR-010 (RBAC) | S-0.3.2 | Covered |
| NFR-001 (Auth security) | S-0.3.1, S-0.3.3 | Covered |
| NFR-005 (Secrets management) | S-0.3.3 | Covered |
| FR-030 (Email-based auth + admin auth) | S-0.3.1 | Covered |
| FR-031 (Role determination) | S-0.3.2 | Covered |
| NFR-007 (Structured JSON logging) | S-0.4.1 | Covered |
| NFR-008 (Correlation IDs) | S-0.4.1 | Covered |
| NFR-003 (PII in logs) | S-0.4.1 | Covered |
| NFR-004 (PII in URLs) | S-0.4.1 | Covered |
| NFR-010 (Structured error responses) | S-0.4.2 | Covered |
| NFR-002 (Authorization audit logging) | S-0.4.1, S-0.3.2 | Covered |
| NFR-009 (Health check endpoints) | S-0.5.1 | Covered |
| BR-006 (Data completeness on upload) | S-0.6.1 | Covered |
| BR-007 (Exclude CW) | S-0.6.1 | Covered |
| BR-008 (Exclude At Home) | S-0.6.1 | Covered |

---

## [WP-0.1] Monorepo Scaffold & Toolchain

### S-0.1.1: Bootstrap monorepo with frontend and backend project scaffolds

**Story:**
As a developer,
I want a monorepo with a React 18 + TypeScript + Vite frontend and a Python 3.11+ FastAPI backend, each with working dev servers and a root Makefile,
So that I can begin feature development with a consistent, reproducible project structure.

**Priority:** P0
**Story Points:** 3
**Sprint:** 1
**Requirements:** TR-017

**Acceptance Criteria:**

```gherkin
Given a freshly cloned repository,
When I run `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"`,
Then all backend dependencies install without errors.

Given the backend virtual environment is active,
When I run `uvicorn app.main:app --reload --port 8000`,
Then the FastAPI server starts on localhost:8000 and the root endpoint returns a response.

Given a freshly cloned repository,
When I run `cd frontend && npm install`,
Then all frontend dependencies install without errors.

Given frontend dependencies are installed,
When I run `npm run dev`,
Then the Vite dev server starts on localhost:5173 and serves the React app.

Given the repository root,
When I run `make run`,
Then both frontend and backend dev servers start (or instructions are printed for running them in separate terminals).

Given the repository root,
When I run `make test`,
Then both backend (pytest) and frontend (vitest) test suites execute and report results (0 tests initially is acceptable).

Given the repository,
When I check for `.env.example`,
Then it exists in `backend/` with placeholder values for DATABASE_URL, JWT_SECRET_KEY, SESSION_TIMEOUT_HOURS, ADMIN_USERNAME, ADMIN_PASSWORD, LOG_LEVEL, CORS_ORIGINS.

Given the repository,
When I check `.gitignore`,
Then it excludes `.env`, `__pycache__/`, `.venv/`, `node_modules/`, `rto_compliance.db`, `*.pyc`, `.vite/`, and `dist/`.
```

**Technical Notes:**
- **Monorepo structure:** Follow AD-001 from design-architecture.md — `frontend/` and `backend/` at repo root
- **Backend:** Python 3.11+, FastAPI, `pyproject.toml` with `[dev]` extras (pytest, httpx, ruff)
- **Frontend:** React 18, TypeScript, Vite, `package.json` with vitest, @testing-library/react, eslint, prettier, tailwindcss
- **Makefile targets:** `run`, `test`, `lint`, `format`, `seed` (placeholder for WP-0.6)
- **CORS:** Configure FastAPI CORS middleware to allow `http://localhost:5173`
- **Backend app entry:** `backend/app/main.py` with FastAPI app instance
- **Reference:** design-architecture.md Section 6 (Local Development Setup)

**Definition of Done:**
- [ ] Repository structure matches AD-001
- [ ] Both dev servers start successfully
- [ ] Makefile convenience commands work
- [ ] `.env.example` and `.gitignore` configured
- [ ] README.md has setup instructions

---

### S-0.1.2: Configure linting, formatting, and test toolchain

**Story:**
As a developer,
I want automated linting (ruff, ESLint) and formatting (ruff format, Prettier) enforced across the codebase,
So that all code follows consistent quality standards from the start.

**Priority:** P1
**Story Points:** 2
**Sprint:** 1
**Requirements:** NFR-016
**Dependencies:** S-0.1.1

**Acceptance Criteria:**

```gherkin
Given the backend source code,
When I run `cd backend && ruff check .`,
Then the linter reports zero errors.

Given the backend source code,
When I run `cd backend && ruff format --check .`,
Then the formatter reports zero files need reformatting.

Given the frontend source code,
When I run `cd frontend && npm run lint`,
Then ESLint reports zero errors.

Given the frontend source code,
When I run `cd frontend && npm run format:check` (or equivalent Prettier check),
Then Prettier reports zero formatting issues.

Given the Makefile,
When I run `make lint`,
Then both backend ruff and frontend ESLint run and return combined results.

Given the Makefile,
When I run `make format`,
Then both backend ruff format and frontend Prettier run and auto-fix formatting.
```

**Technical Notes:**
- **Backend:** `ruff` configured in `pyproject.toml` with Python 3.11 target, line-length 99
- **Frontend:** ESLint with `@typescript-eslint` plugin, Prettier with Tailwind plugin, configured in `eslint.config.js` and `.prettierrc`
- **Vitest:** configured in `vite.config.ts` with `@testing-library/react` and `jsdom` environment
- **Pytest:** configured in `pyproject.toml` with `httpx` for async test client, `--cov` for coverage
- **Reference:** NFR-016 acceptance criteria

**Definition of Done:**
- [ ] Linters pass with zero errors on all existing code
- [ ] Formatters report zero changes needed
- [ ] `make lint` and `make format` work from repo root

---

## [WP-0.2] Database Schema & Alembic Migrations

### S-0.2.1: Define SQLAlchemy models for workers and compliance_records tables

**Story:**
As a developer,
I want SQLAlchemy 2.0 models for the `workers` and `compliance_records` tables with proper relationships and constraints,
So that uploaded badge data and org hierarchy data can be stored and queried.

**Priority:** P0
**Story Points:** 5
**Sprint:** 1
**Requirements:** TR-001, TR-002
**Dependencies:** S-0.1.1

**Acceptance Criteria:**

```gherkin
Given the workers model,
When I inspect its columns,
Then it has: id (UUID PK), worker_name (string), work_email (string, unique, indexed), manager_name (string nullable), manager_email (string nullable), is_manager (boolean), num_direct_reports (integer), worker_type (string), work_location_type (string), level_01 through level_08 (string nullable), is_excluded (boolean, computed from worker_type/location), created_at (datetime), updated_at (datetime).

Given the compliance_records model,
When I inspect its columns,
Then it has: id (UUID PK), worker_id (FK to workers.id), week_start (date), week_end (date), badge_swipes (integer), pto_requested (integer), meets_4_day (boolean), compliance_state (string enum: compliant/non_compliant/pending/multiple_pending/excused), upload_id (FK to upload_log.id nullable), created_at (datetime), updated_at (datetime).

Given the compliance_records model,
When I check constraints,
Then there is a unique constraint on (worker_id, week_start) to enforce one record per employee per week.

Given the workers model,
When I check indexes,
Then work_email has a unique index and manager_email has a non-unique index (for hierarchy lookups).

Given Alembic is configured,
When I run `alembic upgrade head`,
Then the SQLite database `rto_compliance.db` is created with workers and compliance_records tables.

Given the database exists,
When I run `alembic downgrade base` then `alembic upgrade head`,
Then the migration round-trips cleanly without errors.

Given the SQLite database,
When I check PRAGMA settings,
Then journal_mode=WAL, foreign_keys=ON, and busy_timeout=5000 are set.
```

**Technical Notes:**
- **ORM:** SQLAlchemy 2.0 async with `aiosqlite` driver
- **Models location:** `backend/app/models/`
- **Alembic config:** `backend/alembic.ini` + `backend/alembic/` directory
- **UUID PKs:** Use `uuid.uuid4()` as default for all primary keys
- **Timestamps:** `created_at` and `updated_at` with server defaults
- **SQLite pragmas:** Set in engine `connect` event listener (design-architecture.md AD-004)
- **Data model reference:** design-inventory.md Section 2.1 (workers), Section 2.2 (compliance_records)

**Definition of Done:**
- [ ] SQLAlchemy models defined with all columns and constraints
- [ ] Alembic initial migration generated and tested
- [ ] WAL mode and foreign keys enabled
- [ ] Unit tests verify model creation and constraints

---

### S-0.2.2: Define SQLAlchemy models for day_actions, exceptions, disputes, approvals, and upload_log

**Story:**
As a developer,
I want SQLAlchemy models for application-generated data (day_actions, exceptions, disputes, approvals) and the upload_log table,
So that employee actions, manager approvals, and upload history can be tracked with full audit trail.

**Priority:** P0
**Story Points:** 5
**Sprint:** 1
**Requirements:** TR-003
**Dependencies:** S-0.2.1

**Acceptance Criteria:**

```gherkin
Given the day_actions model,
When I inspect its columns,
Then it has: id (UUID PK), compliance_record_id (FK to compliance_records.id), day_of_week (string enum: mon/tue/wed/thu/fri/sat/sun), action_type (string enum: exception/dispute/pto), action_status (string enum: pending/approved/rejected), version (integer, default 1), explanation_text (string nullable), created_at (datetime), updated_at (datetime).

Given the day_actions model,
When I check constraints,
Then there is logic to support multiple versions per (compliance_record_id, day_of_week, action_type) — only the latest version is active.

Given the approvals model,
When I inspect its columns,
Then it has: id (UUID PK), day_action_id (FK to day_actions.id), manager_id (FK to workers.id), action (string enum: approve/reject), note (string nullable), created_at (datetime).

Given the upload_log model,
When I inspect its columns,
Then it has: id (UUID PK), filename (string), uploaded_by (string), rows_processed (integer), rows_new (integer), rows_updated (integer), rows_skipped (integer), warnings (JSON/text nullable), created_at (datetime).

Given an Alembic migration,
When I run `alembic upgrade head`,
Then all 7 tables (workers, compliance_records, day_actions, approvals, upload_log, plus any junction tables) exist with correct foreign keys.

Given the day_actions table,
When I insert two records for the same compliance_record + day + action_type with different versions,
Then both records exist, and the higher version number is retrievable as the active record.

Given the approvals table,
When I insert an approval where manager_id equals the worker_id on the compliance_record,
Then the application layer can detect and reject this (self-approval prevention is enforced in service layer, not DB constraint).
```

**Technical Notes:**
- **Versioning:** day_actions supports multiple versions per (compliance_record_id, day_of_week). Rejected actions are preserved; new submissions create version+1. Query for active = highest version per grouping.
- **PTO as exception type:** PTO additions are stored as day_actions with `action_type='pto'` — same table, same approval workflow.
- **Same-day constraint:** The same day within a week cannot have both a dispute AND an exception/PTO. Enforced at service layer (TR-018), not as DB constraint.
- **Data model reference:** design-inventory.md Section 2.3 (day_actions), Section 2.4 (approvals), Section 2.5 (upload_log)
- **Audit trail:** Old rejection records are never deleted, only superseded by newer versions.

**Definition of Done:**
- [ ] All 7 models defined with relationships
- [ ] Alembic migration includes all tables
- [ ] Foreign key relationships verified in tests
- [ ] Versioning scheme for day_actions verified in tests

---

## [WP-0.3] Authentication Foundation (Dual Path)

### S-0.3.1: Implement dual-path authentication (employee email + admin credentials)

**Story:**
As a developer,
I want two authentication endpoints — email lookup for employees/managers and credential-based login for admins — both issuing JWT tokens,
So that all three roles can securely authenticate through the appropriate path.

**Priority:** P0
**Story Points:** 5
**Sprint:** 1
**Requirements:** TR-009, NFR-001, FR-030
**Dependencies:** S-0.2.1

**Acceptance Criteria:**

```gherkin
Given a valid work email that exists in the workers table with worker_type != "Contingent Worker" and work_location_type != "At Home",
When POST /api/auth/login is called with {"email": "<valid_email>"},
Then a 200 response is returned with a JWT token containing sub (worker UUID), role ("employee" or "manager"), auth_type ("employee"), and exp (8 hours from now).

Given a work email that exists in the workers table with is_manager = true,
When POST /api/auth/login is called with that email,
Then the JWT token contains role = "manager".

Given a work email not found in the workers table,
When POST /api/auth/login is called,
Then a 401 Unauthorized response is returned with a structured error message.

Given a work email for a Contingent Worker (worker_type = "Contingent Worker"),
When POST /api/auth/login is called,
Then a 401 Unauthorized response is returned indicating the user is not eligible for RTO tracking.

Given a work email for an At Home worker (work_location_type = "At Home"),
When POST /api/auth/login is called,
Then a 401 Unauthorized response is returned indicating the user is not eligible for RTO tracking.

Given the correct ADMIN_USERNAME and ADMIN_PASSWORD from .env,
When POST /api/auth/admin is called with {"username": "<correct>", "password": "<correct>"},
Then a 200 response is returned with a JWT token containing sub = "admin", role = "admin", auth_type = "admin".

Given incorrect admin credentials,
When POST /api/auth/admin is called,
Then a 401 Unauthorized response is returned.

Given a JWT token issued 9 hours ago (expired, given 8-hour default),
When any protected endpoint is called with that token,
Then a 401 response is returned indicating the token is expired.
```

**Technical Notes:**
- **Endpoints:** `POST /api/auth/login` (employee/manager), `POST /api/auth/admin` (admin) — design-architecture.md AD-005, AD-008
- **JWT library:** `python-jose` or `PyJWT` — sign with HS256, secret from `JWT_SECRET_KEY` env var
- **JWT payload:** `{sub, role, auth_type, is_manager, exp, iat}` — see AD-005 for exact structure
- **Admin credentials:** Read from `ADMIN_USERNAME`, `ADMIN_PASSWORD` env vars via Pydantic Settings
- **Session timeout:** Configurable via `SESSION_TIMEOUT_HOURS` env var, default 8
- **Security reference:** design-ops.md Section 1.1 (Authentication Flow)

**Definition of Done:**
- [ ] Both auth endpoints implemented and tested
- [ ] JWT tokens contain correct claims for each role
- [ ] CW and At Home workers rejected at login
- [ ] Admin credentials read from .env only
- [ ] Tests cover all auth paths and edge cases

---

### S-0.3.2: Implement RBAC middleware with role-based endpoint protection

**Story:**
As a developer,
I want a middleware layer that enforces role-based access control on every protected endpoint,
So that employees, managers, and admins can only access resources appropriate to their role.

**Priority:** P0
**Story Points:** 3
**Sprint:** 1
**Requirements:** TR-010, NFR-002, FR-031
**Dependencies:** S-0.3.1

**Acceptance Criteria:**

```gherkin
Given a request without an Authorization header,
When it hits any protected endpoint (not /health, /ready, /api/auth/*),
Then a 401 Unauthorized response is returned.

Given a valid JWT with role = "employee",
When the user calls a Manager-only endpoint (e.g., GET /api/managers/me/reports),
Then a 403 Forbidden response is returned.

Given a valid JWT with role = "employee",
When the user calls an Admin-only endpoint (e.g., POST /api/admin/upload),
Then a 403 Forbidden response is returned.

Given a valid JWT with role = "manager",
When the user calls an Employee endpoint (e.g., GET /api/employees/me/compliance),
Then the request succeeds (managers have employee permissions too).

Given any authorization decision (success or failure),
When processed,
Then an audit log entry is written with: user_id (or "anonymous"), role, endpoint, HTTP method, decision (allow/deny), and timestamp.

Given a FastAPI route decorated with a role requirement (e.g., `@require_role("admin")`),
When the middleware checks the JWT,
Then only tokens with the matching role (or higher) are permitted.
```

**Technical Notes:**
- **Implementation:** FastAPI dependency injection pattern — `Depends(require_role("admin"))` on route handlers
- **Role hierarchy:** Admin > Manager > Employee (managers can access employee endpoints)
- **Middleware location:** `backend/app/middleware/rbac.py`
- **Audit logging:** Use structlog to log authorization decisions (NFR-002)
- **Reference:** design-inventory.md Section 1.1.2 (RBAC Middleware), design-ops.md Section 1.2

**Definition of Done:**
- [ ] RBAC middleware implemented as FastAPI dependency
- [ ] Role hierarchy enforced (Admin > Manager > Employee)
- [ ] Authorization decisions logged
- [ ] Tests verify access control for each role

---

### S-0.3.3: Configure secrets management via .env with validation

**Story:**
As a developer,
I want all secrets (JWT signing key, admin credentials, database URL) loaded from environment variables or a `.env` file with startup validation,
So that no secrets are hardcoded in source code and missing secrets are caught immediately.

**Priority:** P0
**Story Points:** 2
**Sprint:** 1
**Requirements:** NFR-005
**Dependencies:** S-0.1.1

**Acceptance Criteria:**

```gherkin
Given the application starts,
When required environment variables (JWT_SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD) are missing,
Then the application fails to start with a clear error message listing the missing variables.

Given a `.env` file in the backend directory,
When the application starts,
Then it reads configuration from the .env file via Pydantic BaseSettings.

Given the repository,
When I inspect `.gitignore`,
Then `.env` is listed and will not be committed.

Given the `.env.example` file,
When I inspect it,
Then it contains placeholder values for all required variables with comments explaining each one.

Given any committed source file,
When I search for hardcoded secrets (passwords, signing keys),
Then none are found — all secrets come from environment variables.
```

**Technical Notes:**
- **Implementation:** Pydantic `BaseSettings` class in `backend/app/core/config.py`
- **Required vars:** `JWT_SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- **Optional with defaults:** `DATABASE_URL` (default: `sqlite+aiosqlite:///./rto_compliance.db`), `SESSION_TIMEOUT_HOURS` (default: 8), `LOG_LEVEL` (default: INFO), `CORS_ORIGINS` (default: `http://localhost:5173`)
- **Reference:** design-architecture.md AD-008, design-ops.md Section 1.3

**Definition of Done:**
- [ ] Pydantic Settings class validates all required secrets
- [ ] Missing secrets cause startup failure with clear error
- [ ] `.env.example` documents all variables
- [ ] No hardcoded secrets in source

---

## [WP-0.4] Core Middleware Stack

### S-0.4.1: Implement structured logging with correlation IDs and PII masking

**Story:**
As a developer,
I want all application logs emitted as structured JSON with correlation IDs propagated across the request lifecycle and PII automatically masked,
So that logs are machine-parseable, traceable, and comply with Nordstrom PII protection standards.

**Priority:** P0
**Story Points:** 5
**Sprint:** 1
**Requirements:** NFR-007, NFR-008, NFR-003, NFR-004, NFR-002
**Dependencies:** S-0.1.1

**Acceptance Criteria:**

```gherkin
Given any log line emitted by the application,
When parsed as JSON,
Then it contains at minimum: timestamp (ISO 8601), level (DEBUG/INFO/WARN/ERROR), message, service ("rto-compliance-tracker"), and correlationId fields.

Given an incoming HTTP request without an X-Correlation-ID header,
When the request is processed,
Then the middleware generates a UUID and attaches it as X-Correlation-ID to the response header and all log lines for that request.

Given an incoming HTTP request with an X-Correlation-ID header set to "abc-123",
When the request is processed,
Then all log lines for that request use correlationId = "abc-123" and the response includes X-Correlation-ID: abc-123.

Given a log event involving an employee named "Jane Smith" with email "jane.smith@nordstrom.com",
When the log line is emitted,
Then neither "Jane Smith" nor "jane.smith@nordstrom.com" appear in the log — they are replaced with masked identifiers (e.g., "worker:***" or a hashed value).

Given any API endpoint URL used in the application,
When inspected,
Then no PII (names, emails, employee IDs) appears in URL paths or query parameters — only opaque UUIDs are used for resource identification.

Given a request to any endpoint,
When the request completes,
Then an access log entry is emitted with: method, path, status_code, duration_ms, and correlationId.
```

**Technical Notes:**
- **Logging library:** `structlog` configured with JSON renderer, bound with service name
- **Correlation ID middleware:** FastAPI middleware in `backend/app/middleware/correlation.py` — generate/propagate UUID via `X-Correlation-ID` header, bind to structlog context
- **PII masking:** structlog processor in `backend/app/core/logging.py` — regex-based masking for email patterns (`*@*.*`), known name fields; mask before JSON serialization
- **Reference:** design-ops.md Section 2.1 (Structured Logging), Section 2.2 (Correlation IDs), Section 2.3 (PII Masking), design-inventory.md Section 1.1.3 (Correlation ID Middleware), Section 1.1.4 (PII Masking)

**Definition of Done:**
- [ ] All logs are structured JSON
- [ ] Correlation IDs in every request/response/log
- [ ] PII masking verified with tests
- [ ] No PII in URL patterns
- [ ] Access logging on every request

---

### S-0.4.2: Implement global error handler with structured error responses

**Story:**
As a developer,
I want a global error handler that returns structured JSON error responses with correlation IDs and never exposes internal details to clients,
So that API consumers get consistent, safe error responses while full details are logged server-side.

**Priority:** P0
**Story Points:** 3
**Sprint:** 1
**Requirements:** NFR-010
**Dependencies:** S-0.4.1

**Acceptance Criteria:**

```gherkin
Given any API error (400, 401, 403, 404, 500),
When the error response is returned,
Then it has the format: {"error": {"code": "<APP_ERROR_CODE>", "message": "<human-readable>", "correlationId": "<request-correlation-id>"}}.

Given an unhandled exception in a route handler,
When the error is caught by the global handler,
Then the client receives a 500 response with a generic message ("Internal server error") and the correlationId, but NO stack trace, SQL query, or file path.

Given the same unhandled exception,
When the error is logged server-side,
Then the full stack trace, error type, and context are logged at ERROR level with the correlationId.

Given a Pydantic validation error (e.g., missing required field in request body),
When the error is caught,
Then the client receives a 422 response with a structured error listing the specific validation failures.

Given a known application error (e.g., "Week outside edit window"),
When raised in a service,
Then the client receives the appropriate HTTP status (e.g., 400) with a specific error code (e.g., "EDIT_WINDOW_EXCEEDED") and descriptive message.
```

**Technical Notes:**
- **Implementation:** FastAPI exception handlers registered on the app instance for `HTTPException`, `RequestValidationError`, and a catch-all `Exception` handler
- **Error codes:** Define application-specific error codes as constants (e.g., `AUTH_FAILED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `EDIT_WINDOW_EXCEEDED`, `SELF_APPROVAL`, `INTERNAL_ERROR`)
- **Location:** `backend/app/middleware/error_handler.py` or `backend/app/core/exceptions.py`
- **Reference:** design-ops.md Section 2.5 (Error Handling), design-inventory.md Section 1.1.5 (Error Handler)

**Definition of Done:**
- [ ] All error responses follow structured format
- [ ] No internal details leaked to clients
- [ ] Full details logged server-side
- [ ] Validation errors return field-level detail
- [ ] Tests verify error format for 400, 401, 403, 404, 422, 500

---

## [WP-0.5] Health Check Endpoints

### S-0.5.1: Implement /health and /ready endpoints

**Story:**
As a developer,
I want `/health` and `/ready` endpoints that report application and database status,
So that local development tools and future monitoring can verify the application is running correctly.

**Priority:** P0
**Story Points:** 1
**Sprint:** 1
**Requirements:** NFR-009
**Dependencies:** S-0.2.1

**Acceptance Criteria:**

```gherkin
Given the FastAPI application is running,
When GET /health is called,
Then a 200 response is returned with body {"status": "healthy"}.

Given the SQLite database file exists and is accessible,
When GET /ready is called,
Then a 200 response is returned with body {"status": "ready"}.

Given the SQLite database is inaccessible (e.g., file deleted or connection fails),
When GET /ready is called,
Then a 503 response is returned with body {"status": "not ready"}.

Given either /health or /ready endpoint,
When called without an Authorization header,
Then the request succeeds (no authentication required).

Given the /health endpoint,
When called,
Then the response time is under 50ms (no database query needed).
```

**Technical Notes:**
- **Implementation:** Two route handlers in `backend/app/api/health.py`
- **Ready check:** Execute a simple query (`SELECT 1`) against SQLite to verify connectivity
- **Auth bypass:** Both endpoints excluded from auth middleware (design-ops.md Section 2.4)
- **Reference:** design-ops.md Section 2.4, NFR-009

**Definition of Done:**
- [ ] Both endpoints return correct status codes
- [ ] /ready properly detects database connectivity
- [ ] No authentication required
- [ ] Tests cover healthy and unhealthy states

---

## [WP-0.6] Sample Data Seeding

### S-0.6.1: Implement worker data seeding from Excel with CW/At Home filtering

**Story:**
As a developer,
I want a seed command that loads the worker/org Excel file into the workers table, filtering out Contingent Workers and marking At Home employees as excluded,
So that I have realistic org hierarchy data for authentication testing and development.

**Priority:** P0
**Story Points:** 3
**Sprint:** 1
**Requirements:** BR-006, BR-007, BR-008
**Dependencies:** S-0.2.1

**Acceptance Criteria:**

```gherkin
Given the file `data/tech_workers_with_manager_email.xlsx` exists,
When I run `make seed`,
Then the workers table is populated with all 783 rows from the Excel file.

Given the workers table is populated,
When I query for workers with worker_type = "Contingent Worker",
Then those workers have is_excluded = true (455 records).

Given the workers table is populated,
When I query for workers with work_location_type = "At Home",
Then those workers have is_excluded = true (280 records).

Given the workers table is populated,
When I query for eligible workers (is_excluded = false),
Then approximately 328 workers are returned (total minus CW minus At Home, accounting for overlap).

Given the workers table is populated,
When I query workers where is_manager = true,
Then approximately 46 records are returned with correct hierarchy level data (level_01 through level_08).

Given the seed command has already been run,
When I run `make seed` again,
Then it is idempotent — existing records are updated (upsert on work_email), not duplicated.
```

**Technical Notes:**
- **Excel parsing:** Use `openpyxl` to read `tech_workers_with_manager_email.xlsx` (35 columns, 783 rows)
- **Key columns to extract:** Worker, Email-Work, Manager, Manager E-mail, Is Manager, Number of Direct Reports, Worker Type, Work Location Type, Level 01–Level 08
- **Exclusion logic:** `is_excluded = True` if worker_type == "Contingent Worker" OR work_location_type == "At Home"
- **Seed location:** `backend/app/cli/seed.py` or `backend/scripts/seed.py`, callable via Makefile
- **Data files:** Place sample Excel files in `data/` directory at repo root
- **Reference:** design-inventory.md Section 2.1 (workers table), TR-006 (Worker/Org parsing)

**Definition of Done:**
- [ ] Seed command loads all 783 worker records
- [ ] CW and At Home workers correctly flagged
- [ ] Seed is idempotent
- [ ] Manager hierarchy data preserved
- [ ] `make seed` works from repo root

---

### S-0.6.2: Generate synthetic compliance data for development

**Story:**
As a developer,
I want synthetic 13-week compliance data generated for all eligible employees during seeding,
So that I have realistic data volumes for testing the Employee View, Manager Dashboard, and pie charts during development.

**Priority:** P1
**Story Points:** 2
**Sprint:** 1
**Requirements:** BR-006
**Dependencies:** S-0.6.1

**Acceptance Criteria:**

```gherkin
Given the seed command runs after worker data is loaded,
When synthetic compliance data is generated,
Then each eligible employee (~328) has 13 weekly compliance records in the compliance_records table.

Given the generated compliance data,
When I query the total count,
Then approximately 4,264 records exist (328 employees x 13 weeks).

Given the generated compliance data,
When I inspect the records,
Then each has realistic values: week_start (Monday), week_end (Sunday), badge_swipes (0-5 integer), pto_requested (0-3 integer), meets_4_day (boolean derived from badge_swipes >= 4), and compliance_state (compliant if meets_4_day else non_compliant).

Given the generated data,
When I check the compliance distribution,
Then roughly 70-80% of employee-weeks are Compliant and 20-30% are Non-Compliant (realistic distribution for demo purposes).

Given the sample badge data file `data/RTO_Sample.xlsx` exists,
When the seed command runs,
Then the 4 sample rows are also loaded into compliance_records (for the specific employee referenced in the sample).

Given the seed command has already populated compliance data,
When I run `make seed` again,
Then existing compliance records are updated (not duplicated) and the total count remains stable.
```

**Technical Notes:**
- **Data generation:** Python script using random module with seed for reproducibility
- **Week ranges:** Generate 13 weeks ending with the current week, each Mon-Sun
- **Badge swipes distribution:** Normal distribution centered around 4, with ~25% below threshold
- **PTO:** Random 0-2 days for ~30% of weeks
- **Compliance state:** At this phase, only `compliant` and `non_compliant` (no pending/excused until actions are submitted)
- **Sample data:** Also load `data/RTO_Sample.xlsx` 4-row sample as real compliance records
- **Reference:** design-inventory.md Section 2.2 (compliance_records)

**Definition of Done:**
- [ ] ~4,264 synthetic compliance records generated
- [ ] Realistic distribution of compliant/non-compliant
- [ ] Sample Excel data loaded alongside synthetic data
- [ ] Seed remains idempotent with synthetic data
