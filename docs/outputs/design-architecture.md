# Technical Design: RTO Compliance Tracker — Architecture

## Document Info
- **Version:** 1.1
- **Date:** 2026-03-07
- **Status:** Draft
- **Author:** design-agent-arch
- **Requirements Baseline:** docs/outputs/requirements-bf.md, docs/outputs/requirements-tn.md

---

## 1. Executive Summary

The RTO Compliance Tracker is an internal web application that replaces Nordstrom's manual Excel-based Return-to-Office compliance tracking with a centralized, self-service system. It serves three user personas — employees who view their own weekly compliance status and submit exceptions/disputes, managers who monitor their direct reports and approve or reject those requests through an org hierarchy drill-down, and HR admins who upload badge data via Excel files. The system implements a **5-state compliance model** (Compliant, Exception Pending, Non-Compliant, Excused, and Multiple Actions Pending) with server-side enforcement of business rules including self-approval prevention and a 5-week edit window. Actions (exceptions, disputes, PTO) are tracked at the **day level** within each week, enabling employees to have different action types on different days of the same week.

The architecture follows a standard SPA + REST API pattern with a React/TypeScript frontend, a Python FastAPI backend, and SQLite for embedded persistence. This stack was chosen for rapid POC development: React provides a rich component ecosystem for dashboards and data tables, FastAPI offers async performance with automatic OpenAPI documentation, and SQLite eliminates all database infrastructure setup. The system is designed to run entirely on a developer's local machine — no containers, no cloud services, no external dependencies beyond the installed toolchain.

Key architectural decisions include a monorepo structure to simplify development and testing, **dual authentication paths** (employee email lookup from worker data + dedicated admin credentials via .env), JWT-based session tokens for stateless authorization, a deterministic state machine for compliance state transitions with day-level granularity, and in-memory Excel parsing for file uploads. The design prioritizes correctness of business rules (especially the compliance state machine, re-submission after rejection, and self-approval prevention) over scalability, as this is a POC targeting ~328 employees and 50 concurrent users.

---

## 2. Tech Stack Decision

The PRD marks the tech stack as "TBD". Based on analysis of the functional requirements, non-functional requirements, and deployment constraints, the following stack is selected:

### Frontend: React 18 + TypeScript + Vite

| Factor | Justification |
|--------|---------------|
| Dashboard UI (FR-001, FR-012) | React's component model maps cleanly to the compliance table, pie chart, and manager dashboard |
| Pie chart (FR-005) | Rich charting libraries (Recharts, Chart.js) available in the React ecosystem |
| Recursive drill-down (FR-022) | React Router handles nested navigation; component reuse for employee detail at each hierarchy level |
| Type safety | TypeScript catches data model mismatches at compile time — critical for the 12-column/35-column Excel schemas |
| Build speed (TR-017) | Vite provides sub-second HMR and fast builds for local development |
| Accessibility (NFR-018) | React has mature accessibility libraries (react-aria, radix-ui) |

### Backend: Python 3.11+ with FastAPI

**Why FastAPI over Node.js Express:**

| Factor | FastAPI (Python) | Express (Node.js) |
|--------|-----------------|-------------------|
| Excel parsing | `openpyxl` is the gold standard for .xlsx — mature, battle-tested, handles all edge cases | `xlsx`/`exceljs` work but are less robust for complex workbooks |
| Data processing | Pandas available for data filtering (CW exclusion, At Home exclusion, hierarchy building) — handles the 783-row worker dataset naturally | Would require manual array manipulation or lodash |
| API documentation | Auto-generates OpenAPI/Swagger from type hints — zero extra effort (TR-013) | Requires additional setup (swagger-jsdoc) |
| Type validation | Pydantic models validate request/response schemas declaratively — matches the structured error requirement (NFR-010) | Requires Joi/Zod plus manual wiring |
| Async performance | Native async/await for concurrent request handling (NFR-014: 50 users) | Also async-native; comparable |
| State machine | Python enums + match statements map naturally to the 5-state compliance model (TR-004) | Equally capable |

FastAPI wins on Excel parsing quality and data processing ergonomics — the two most complex backend tasks in this application.

### Database: SQLite 3

| Factor | Justification |
|--------|---------------|
| Zero setup (TR-017) | No installation, no server process, no configuration — just a file |
| Local deployment | Perfect for the "local only" constraint — single file, no credentials needed |
| Data volume | ~4,264 compliance records (328 employees x 13 weeks) + 783 worker records — well within SQLite's comfortable range |
| Concurrent reads (NFR-014) | SQLite handles 50 concurrent readers with WAL mode enabled |
| ACID compliance (NFR-017) | Full transaction support for data integrity during upload upserts |
| Performance (NFR-011, NFR-012) | Sub-millisecond queries for the data volumes in this POC |

**Why not PostgreSQL or MySQL:** These require a running server process, installation, configuration, and credentials — unnecessary complexity for a local-only POC with <10,000 records.

### Excel Parsing: openpyxl

| Factor | Justification |
|--------|---------------|
| Format support (TR-005, TR-006) | Native .xlsx read/write — matches the RTO_Sample.xlsx requirement |
| Validation | Can inspect column headers, data types, and sheet structure before processing |
| Memory efficiency | Supports read-only mode for large files (though our ~4K rows fit comfortably in memory) |
| Python ecosystem | Integrates naturally with FastAPI and Pandas |

### Supporting Libraries

| Library | Purpose | Requirement |
|---------|---------|-------------|
| `pydantic` | Request/response validation, settings management | NFR-006, NFR-010 |
| `python-jose` (or `PyJWT`) | JWT token creation and validation | NFR-001 |
| `structlog` | Structured JSON logging with PII masking | NFR-007, NFR-003 |
| `uvicorn` | ASGI server for local development | TR-017 |
| `aiosqlite` | Async SQLite access for FastAPI | NFR-014 |
| `alembic` | Database migrations | TR-001, TR-002, TR-003 |
| `pytest` + `httpx` | Testing framework + async test client | NFR-015 |
| `recharts` | React charting library for pie chart | FR-005 |
| `@tanstack/react-table` | Data table component for compliance tables | FR-001, FR-012 |
| `react-router` | SPA routing and navigation | FR-022, FR-023 |
| `tailwindcss` | Utility-first CSS for rapid UI development | General |
| `eslint` + `prettier` | Frontend linting and formatting | NFR-016 |
| `ruff` | Python linting and formatting | NFR-016 |

### Full Stack Summary

```
┌─────────────────────────────────────────────────────┐
│                    TECH STACK                        │
├─────────────────────────────────────────────────────┤
│  Frontend:  React 18 + TypeScript + Vite             │
│  Styling:   Tailwind CSS                             │
│  Charts:    Recharts                                 │
│  Tables:    @tanstack/react-table                    │
│  Routing:   React Router v6                          │
│                                                      │
│  Backend:   Python 3.11+ + FastAPI                   │
│  Server:    Uvicorn (ASGI)                           │
│  ORM:       SQLAlchemy 2.0 (async) + aiosqlite      │
│  Auth:      JWT (python-jose / PyJWT)                │
│  Excel:     openpyxl                                 │
│  Logging:   structlog                                │
│  Migrations: Alembic                                 │
│                                                      │
│  Database:  SQLite 3 (WAL mode)                      │
│  Testing:   pytest + httpx (backend)                 │
│             vitest + testing-library (frontend)      │
│  Linting:   ruff (Python) + ESLint + Prettier (TS)   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Current State

There is no existing software system for RTO compliance tracking. The current process is entirely manual and Excel-based:

**As-Is Process:**
1. HR generates Excel files containing weekly badge swipe data from the corporate badge system
2. HR distributes these Excel files to managers or makes them available on a shared drive
3. Employees who want to check their compliance must ask HR directly or wait for a manager to share the data
4. Exception handling is done via email or verbal requests — no structured workflow, no audit trail
5. Managers track exceptions and approvals in their own spreadsheets or email threads
6. Org hierarchy visibility is limited to the immediate team — no recursive drill-down capability

**Pain Points Driving This Project:**
- No self-service: employees cannot check their own status without contacting HR
- No structured exception workflow: requests are lost in email, decisions are untracked
- No audit trail: approvals have no timestamp, no record of who approved what
- No hierarchy visibility: senior managers cannot see compliance across their full org
- Data staleness: compliance data is only as current as the last Excel distribution

**Data Assets Available:**
- `RTO_Sample.xlsx` — Sample badge data (12 columns, 4 rows for 1 employee over 4 weeks)
- `tech_workers_with_manager_email.xlsx` — Full worker/org dataset (35 columns, 783 rows including 328 employees, 455 CWs, 46 managers, 8 hierarchy levels)

The application will ingest both of these formats as its primary data sources.

---

## 4. Target State Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOCAL MACHINE                             │
│                                                                  │
│  ┌──────────┐         ┌──────────────────┐      ┌────────────┐  │
│  │  Browser  │ ◄─────►│  Vite Dev Server  │      │  Excel     │  │
│  │  (User)   │  HTTP   │  (localhost:5173) │      │  Files     │  │
│  └──────────┘         └────────┬─────────┘      └─────┬──────┘  │
│                                │                       │         │
│                           Static                  File Upload    │
│                           Assets                       │         │
│                                │                       │         │
│  ┌─────────────────────────────┴───────────────────────┴──────┐  │
│  │                  FastAPI Backend                             │  │
│  │                  (localhost:8000)                            │  │
│  │                                                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │  Auth    │ │  RBAC    │ │  CORS    │ │  Correlation  │  │  │
│  │  │Middleware│ │Middleware│ │Middleware│ │  ID Middleware │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │  │
│  │       └─────────────┴────────────┴───────────────┘          │  │
│  │                          │                                   │  │
│  │  ┌──────────────────────┴──────────────────────────────┐    │  │
│  │  │                  API Router Layer                     │    │  │
│  │  │  /api/auth/*   /api/employees/*   /api/managers/*    │    │  │
│  │  │  /api/admin/*  /health            /ready             │    │  │
│  │  └──────────────────────┬──────────────────────────────┘    │  │
│  │                          │                                   │  │
│  │  ┌──────────────────────┴──────────────────────────────┐    │  │
│  │  │                 Service Layer                         │    │  │
│  │  │  ComplianceService   ManagerService   UploadService  │    │  │
│  │  │  AuthService         HierarchyService                │    │  │
│  │  └──────────────────────┬──────────────────────────────┘    │  │
│  │                          │                                   │  │
│  │  ┌──────────────────────┴──────────────────────────────┐    │  │
│  │  │              State Machine Engine (5-state)           │    │  │
│  │  │  Compliant ── Non-Compliant ── Pending ── Excused    │    │  │
│  │  │                          └── Multiple Actions Pending │    │  │
│  │  │  (day-level actions → week-level state derivation)    │    │  │
│  │  └──────────────────────┬──────────────────────────────┘    │  │
│  │                          │                                   │  │
│  │  ┌──────────────────────┴──────────────────────────────┐    │  │
│  │  │              Data Access Layer (SQLAlchemy)           │    │  │
│  │  │  Repository pattern: ComplianceRepo, WorkerRepo,     │    │  │
│  │  │  ExceptionRepo, ApprovalRepo, UploadRepo             │    │  │
│  │  └──────────────────────┬──────────────────────────────┘    │  │
│  └──────────────────────────┼──────────────────────────────────┘  │
│                              │                                    │
│  ┌──────────────────────────┴──────────────────────────────────┐  │
│  │                  SQLite Database (WAL mode)                  │  │
│  │                  rto_compliance.db                           │  │
│  │                                                              │  │
│  │  Tables: workers, compliance_records, day_actions,            │  │
│  │          exceptions, pto_additions, disputes, approvals,     │  │
│  │          upload_log                                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Authentication Flow (Dual Path):**

The system has two distinct auth paths:
- **Employee/Manager login:** Email lookup against worker data (no password for POC)
- **Admin login:** Dedicated credentials configured in `.env` (username + password)

Admin is NOT derived from worker data — it is a completely separate authentication path.

```
Browser                    Frontend (React)           Backend (FastAPI)          SQLite/.env
  │                             │                          │                      │
  │  ── EMPLOYEE/MANAGER PATH ──│                          │                      │
  │  Enter work email ─────────►│                          │                      │
  │                             │  POST /api/auth/login    │                      │
  │                             │  { email }  ────────────►│                      │
  │                             │                          │  SELECT worker       │
  │                             │                          │  WHERE email = ?  ──►│ (SQLite)
  │                             │                          │◄── worker record ────│
  │                             │                          │                      │
  │                             │                          │  Check: not CW,      │
  │                             │                          │  not At Home         │
  │                             │                          │  Is Manager? → role  │
  │                             │                          │                      │
  │                             │◄── JWT {role: employee   │                      │
  │                             │     or manager} ─────────│                      │
  │                             │                          │                      │
  │  ── ADMIN PATH ────────────►│                          │                      │
  │  Enter admin credentials ──►│                          │                      │
  │                             │  POST /api/auth/admin    │                      │
  │                             │  { username, password }──►│                      │
  │                             │                          │  Verify against      │
  │                             │                          │  ADMIN_USERNAME +    │
  │                             │                          │  ADMIN_PASSWORD ────►│ (.env)
  │                             │                          │                      │
  │                             │◄── JWT {role: admin} ────│                      │
  │                             │                          │                      │
  │  Store token (memory)       │                          │                      │
  │  Route to role-based view   │                          │                      │
```

**Data Upload Flow:**
```
Admin                      Frontend                    Backend                    SQLite
  │                            │                          │                        │
  │  Select .xlsx file ───────►│                          │                        │
  │                            │  POST /api/admin/upload  │                        │
  │                            │  (multipart file)  ─────►│                        │
  │                            │                          │  Validate format       │
  │                            │                          │  Parse with openpyxl   │
  │                            │                          │  Filter CW + At Home   │
  │                            │                          │  Check worker matches  │
  │                            │                          │                        │
  │                            │                          │  BEGIN TRANSACTION ───►│
  │                            │                          │  UPSERT compliance ───►│
  │                            │                          │  Preserve exceptions ─►│
  │                            │                          │  Preserve disputes ───►│
  │                            │                          │  COMMIT ──────────────►│
  │                            │                          │                        │
  │                            │◄── Upload summary ───────│                        │
  │  See results (rows,        │    (processed, new,      │                        │
  │   updated, skipped)        │     updated, skipped)    │                        │
```

**Exception / PTO / Dispute Workflow Flow:**

All three action types (exception, PTO addition, badge dispute) follow the same approval workflow.
Actions are submitted at the **day level** — the employee selects which day(s) the action covers.
The same day cannot have both a dispute and an exception (enforced server-side).
Rejected exceptions can be **re-submitted** — the old rejection is preserved for audit.

```
Employee       Frontend         Backend            SQLite         Manager       Frontend
   │               │                │                 │              │              │
   │ Submit ──────►│                │                 │              │              │
   │ Exception     │                │                 │              │              │
   │ (select day)  │ POST           │                 │              │              │
   │               │ /actions ─────►│                 │              │              │
   │               │ {type, week,   │ Validate:       │              │              │
   │               │  day, text}    │ - within 5 wks  │              │              │
   │               │                │ - day not used  │              │              │
   │               │                │   for other type│              │              │
   │               │                │ INSERT action ─►│              │              │
   │               │                │ Recompute week  │              │              │
   │               │                │ state ─────────►│              │              │
   │               │                │ (Red→Yellow or  │              │              │
   │               │                │  Red→Orange if  │              │              │
   │               │                │  mixed types)   │              │              │
   │               │◄── 201 Created─│                 │              │              │
   │ See updated  ◄──│              │                 │              │              │
   │ week color    │                │                 │              │              │
   │               │                │                 │              │              │
   │               │                │                 │    Login ───►│              │
   │               │                │                 │              │ GET          │
   │               │                │                 │              │ /reports ───►│
   │               │                │◄── pending ─────│              │              │
   │               │                │ count           │              │              │
   │               │                │                 │              │◄── dashboard─│
   │               │                │                 │  Drill in ──►│              │
   │               │                │                 │              │ GET detail ─►│
   │               │                │                 │              │              │
   │               │                │                 │  Approve ───►│              │
   │               │                │                 │              │ PUT          │
   │               │                │                 │              │ /approve ───►│
   │               │                │ Validate:        │              │              │
   │               │                │ - is manager     │              │              │
   │               │                │ - not self       │              │              │
   │               │                │ UPDATE action ──►│              │              │
   │               │                │ Recompute week  │              │              │
   │               │                │ state ──────────►│              │              │
   │               │                │ INSERT approval─►│              │              │
   │               │                │                  │              │◄── 200 OK ──│
   │               │                │                  │              │              │
   │ ── RE-SUBMIT AFTER REJECTION ──│                  │              │              │
   │ Submit new   ►│ POST           │                  │              │              │
   │ explanation   │ /actions ─────►│ Validate:        │              │              │
   │               │                │ - week is Red    │              │              │
   │               │                │   (after reject) │              │              │
   │               │                │ INSERT new ver ─►│              │              │
   │               │                │ (old preserved)  │              │              │
   │               │                │ Recompute state ►│              │              │
   │               │◄── 201 Created─│ (Red→Yellow)     │              │              │
```

### Frontend Component Architecture

```
App
├── AuthProvider (context: user, role, token)
├── Router
│   ├── /login ──────────── LoginPage
│   │   ├── EmployeeLoginForm (email lookup)
│   │   └── AdminLoginForm (username + password)
│   ├── /employee ───────── EmployeeView
│   │   ├── ComplianceTable (FR-001, FR-002, FR-003, FR-004)
│   │   │   ├── WeekRow (5-state color-coded, action buttons for last 5 weeks)
│   │   │   │   ├── DayActionIndicators (shows which days have actions)
│   │   │   │   └── ActionMenu (exception, dispute, PTO — context-aware)
│   │   │   ├── ActionModal (shared by exception/dispute/PTO — same approval flow)
│   │   │   │   ├── DayPicker (select which day(s) of the week)
│   │   │   │   ├── ExplanationTextField
│   │   │   │   └── SameDayConflictWarning (prevent dispute+exception on same day)
│   │   │   └── ResubmitExceptionBanner (shown on rejected weeks)
│   │   └── CompliancePieChart (FR-005, FR-006, updated for 5 states)
│   ├── /manager ────────── ManagerView
│   │   ├── EmployeeView (own data, FR-011)
│   │   ├── DirectReportsDashboard (FR-012, FR-013)
│   │   │   ├── StatusFilter (5-state aware)
│   │   │   └── ReportRow (click to drill down)
│   │   └── ReportDetail (FR-014, FR-015, FR-016)
│   │       ├── ComplianceTable (read-only, shows day-level actions)
│   │       ├── ActionReview (FR-017-FR-020, unified for exceptions/disputes/PTO)
│   │       │   ├── DayActionList (all pending actions grouped by day)
│   │       │   └── ApproveRejectControls (with optional rejection note)
│   │       └── SubManagerLink (FR-022, FR-023)
│   ├── /admin ──────────── AdminView
│   │   └── UploadPanel (FR-025, FR-029)
│   │       ├── FileDropzone
│   │       ├── UploadProgress
│   │       └── ResultsSummary
│   └── /* ──────────────── NotFound
└── Shared
    ├── Breadcrumbs (FR-023)
    ├── StatusBadge (5-state: Green/Yellow/Red/Blue/Orange + text label, NFR-018)
    └── ErrorBoundary
```

---

## 5. Architecture Decisions (ADRs)

### AD-001: Monorepo Structure

| | |
|---|---|
| **Decision** | Use a monorepo with `frontend/` and `backend/` directories in a single repository |
| **Rationale** | Simplifies local development — one clone, one branch, coordinated PRs. The frontend and backend are tightly coupled (shared data models, same team). No benefit to separate repos at POC scale. |
| **Alternatives Considered** | Separate repos (rejected — adds coordination overhead for a 2-person-max POC team) |
| **Requirement** | TR-017 (local dev environment) |

**Repository structure:**
```
rto-compliance-tracker/
├── frontend/           # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/   # API client
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/            # Python + FastAPI
│   ├── app/
│   │   ├── api/        # Route handlers
│   │   ├── models/     # SQLAlchemy models
│   │   ├── schemas/    # Pydantic request/response
│   │   ├── services/   # Business logic
│   │   ├── middleware/  # Auth, RBAC, correlation ID
│   │   └── core/       # Config, state machine, logging
│   ├── tests/
│   ├── alembic/
│   ├── pyproject.toml
│   └── .env.example
├── data/               # Sample Excel files for development
├── README.md
└── Makefile            # Convenience commands (make run, make test)
```

### AD-002: Single Page Application (SPA)

| | |
|---|---|
| **Decision** | Build the frontend as a SPA with React Router for client-side navigation |
| **Rationale** | The application has 4 main views (Login, Employee, Manager, Admin) with heavy interaction within each view (expanding tables, modals for exceptions, drill-down navigation). SPA provides instant navigation between views without page reloads, which is essential for the recursive manager drill-down (FR-022) and the table/pie-chart sync (FR-006). |
| **Alternatives Considered** | Server-rendered MPA (rejected — drill-down navigation would require full page reloads, breaking the hierarchy browsing experience); HTMX (rejected — while simpler, the pie chart and interactive table components benefit from React's component model) |
| **Requirement** | FR-022 (recursive drill-down), FR-006 (synced chart), NFR-011 (2s page load) |

### AD-003: REST API over GraphQL

| | |
|---|---|
| **Decision** | Use RESTful API endpoints with JSON request/response bodies |
| **Rationale** | The data access patterns are well-defined and predictable: employee gets their own data, manager gets their reports' data, admin uploads files. There is no need for flexible field selection (GraphQL's primary advantage). REST is simpler to implement, test, and debug. FastAPI auto-generates OpenAPI/Swagger documentation for REST endpoints. |
| **Alternatives Considered** | GraphQL (rejected — adds schema complexity and resolver overhead for predictable queries; the manager drill-down is better served by nested REST calls than a single deep GraphQL query that could over-fetch hierarchy data) |
| **Requirement** | TR-013 (RESTful API design) |

### AD-004: SQLite with WAL Mode over Other Embedded DBs

| | |
|---|---|
| **Decision** | Use SQLite 3 in WAL (Write-Ahead Logging) mode as the embedded database |
| **Rationale** | SQLite is the most widely deployed database engine, requires zero configuration, and supports full SQL including transactions (needed for atomic upload upserts). WAL mode enables concurrent reads during writes — critical for handling the 50-user concurrency target while an admin upload is processing. The data volume (~5K records) is orders of magnitude below SQLite's limits. |
| **Alternatives Considered** | DuckDB (rejected — optimized for analytics, not OLTP; no mature async Python driver); H2 (rejected — Java-based, not native to Python ecosystem); JSON files (rejected — no transaction support, no SQL queries, concurrent access issues) |
| **Requirement** | TR-017 (local dev), NFR-014 (50 concurrent users), NFR-017 (data integrity) |

**SQLite configuration:**
```python
# Enable WAL mode for concurrent read access
PRAGMA journal_mode=WAL;
# Enable foreign key enforcement
PRAGMA foreign_keys=ON;
# Set busy timeout to 5 seconds for write contention
PRAGMA busy_timeout=5000;
```

### AD-005: JWT Tokens for Authentication (Dual Auth Paths)

| | |
|---|---|
| **Decision** | Use JWT (JSON Web Tokens) for session management, issued via two distinct auth paths: employee email lookup and admin credential login |
| **Rationale** | JWTs are stateless — the backend does not need to maintain a session store (no Redis needed, aligns with local-only deployment). The token encodes the user's ID, role (Employee/Manager/Admin), and expiration. This simplifies RBAC middleware: each request's token contains the role, so authorization checks don't require a database lookup. Token expiration (8 hours per NFR-001) is built into the JWT spec. The dual auth path separates concerns: employee/manager identity comes from worker data, while admin identity comes from dedicated credentials — this means Admin is NOT tied to the worker dataset and can be changed independently. |
| **Alternatives Considered** | Server-side sessions with cookies (rejected — requires session store, adds state management complexity for a local POC); Single auth path with admin emails in .env (rejected — human clarified that admin should have dedicated login, not email lookup from worker data) |
| **Requirement** | NFR-001 (authentication security), TR-009 (email-based auth), TR-010 (RBAC) |

**Auth paths:**
- `POST /api/auth/login` — Employee/Manager: accepts `{ email }`, looks up in worker data, returns JWT with `role: "employee"` or `role: "manager"`
- `POST /api/auth/admin` — Admin: accepts `{ username, password }`, verifies against `ADMIN_USERNAME` + `ADMIN_PASSWORD` from .env, returns JWT with `role: "admin"`

**JWT payload structure (employee/manager):**
```json
{
  "sub": "worker-uuid-here",
  "role": "manager",
  "is_manager": true,
  "auth_type": "employee",
  "exp": 1709856000,
  "iat": 1709827200
}
```

**JWT payload structure (admin):**
```json
{
  "sub": "admin",
  "role": "admin",
  "auth_type": "admin",
  "exp": 1709856000,
  "iat": 1709827200
}
```

### AD-006: 5-State Compliance Model with Day-Level Tracking

| | |
|---|---|
| **Decision** | Implement a **5-state compliance model** with actions tracked at the **day level** within each week, using a two-layer state system: day-level actions feed into a week-level derived state |
| **Rationale** | The compliance model evolved from 4 states to 5 during design review. Key clarifications from the human: (1) PTO additions follow the same approval workflow as exceptions — they are NOT auto-excusing, (2) employees can have both a dispute and an exception on the same week but NOT on the same day, creating a 5th "Multiple Actions Pending" state, (3) rejected exceptions can be re-submitted with a new explanation. Day-level tracking is required to enforce the same-day constraint and properly derive the week-level state from the combination of day-level actions. The state machine remains deterministic but now operates at two levels. |
| **Alternatives Considered** | Week-level-only state machine (rejected — cannot enforce the "no dispute + exception on same day" constraint, cannot support mixed action types within a week); Implicit state derivation from action history without explicit states (rejected — harder to reason about, harder to test) |
| **Requirement** | TR-004 (compliance state machine), BR-010 (compliance model), BR-011 (manager approval required) |

**5 Compliance States:**

| State | Color | Meaning |
|-------|-------|---------|
| Compliant | Green | Badge data shows "Meets 4-Day Requirement = Yes" |
| Non-Compliant | Red | Not meeting requirement, no pending actions |
| Pending | Yellow | Single action type pending (exception OR dispute OR PTO, not mixed) |
| Multiple Actions Pending | Orange | Both exception/PTO AND dispute pending on different days in same week |
| Excused | Blue | Manager approved exception, dispute, or PTO |

**Two-Layer State Architecture:**

```
LAYER 1: Day-Level Actions
─────────────────────────────────────────────────────────
Each day within a week can have AT MOST ONE action:
  - exception (with explanation text)
  - dispute (badge count dispute)
  - pto (PTO addition)
  - none

Constraint: same day CANNOT have both a dispute AND an exception/PTO.
Enforced server-side on INSERT.

LAYER 2: Week-Level Derived State
─────────────────────────────────────────────────────────
The week's compliance state is COMPUTED from its day-level actions:

  IF badge data says "Meets 4-Day = Yes"
    AND no pending/approved actions exist
    → COMPLIANT (Green)

  IF ALL pending actions on all days are of ONE type (only exceptions, or only disputes, or only PTO)
    → PENDING (Yellow)

  IF pending actions exist of MULTIPLE types (e.g., exception on Monday + dispute on Wednesday)
    → MULTIPLE_ACTIONS_PENDING (Orange)

  IF all actions on all days are approved (Blue) or no actions remain pending
    AND badge data says "No"
    AND at least one approved action
    → EXCUSED (Blue)

  IF badge data says "No"
    AND no pending or approved actions
    → NON_COMPLIANT (Red)
```

**Day-Level Action State Machine:**

```
Day Action State     Action                    Actor      New State           Condition
─────────────────────────────────────────────────────────────────────────────────────────
(no action)          Submit exception          Employee   Pending             Within 5-week window; day has no dispute
(no action)          Submit PTO                Employee   Pending             Within 5-week window; day has no dispute
(no action)          Submit dispute            Employee   Pending             Within 5-week window; day has no exception/PTO
Pending              Approve                   Manager    Approved            Manager ≠ employee
Pending              Reject                    Manager    Rejected            Manager ≠ employee
Rejected             Re-submit (new version)   Employee   Pending             Within 5-week window; old rejection preserved
Approved             — (terminal)              —          Approved            No further transitions
```

**Re-submission support:** When an action is rejected, the employee can submit a new version with updated explanation text. The old action record is preserved with `status=rejected` for audit trail. The new submission creates a fresh record linked to the same employee+week+day. Only the latest active action per day is used for week-level state computation.

**PTO = Exception (same workflow):** PTO additions trigger the exact same Yellow→approval flow as exceptions. When an employee adds PTO days, the week goes to Pending (Yellow) and requires manager approval to become Excused (Blue). This is architecturally significant because it means all three action types share the same state machine, approval endpoints, and UI components.

**Implementation approach:**
```python
class ComplianceState(str, Enum):
    COMPLIANT = "compliant"                       # Green
    NON_COMPLIANT = "non_compliant"               # Red
    PENDING = "pending"                           # Yellow — single action type
    MULTIPLE_ACTIONS_PENDING = "multiple_pending" # Orange — mixed action types
    EXCUSED = "excused"                           # Blue

class ActionType(str, Enum):
    EXCEPTION = "exception"
    DISPUTE = "dispute"
    PTO = "pto"

class ActionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

def compute_week_state(
    meets_requirement: bool,
    day_actions: list[DayAction],
) -> ComplianceState:
    """Derive week-level state from badge data + day-level actions."""
    if meets_requirement and not any(a.status == ActionStatus.PENDING for a in day_actions):
        return ComplianceState.COMPLIANT

    pending_actions = [a for a in day_actions if a.status == ActionStatus.PENDING]
    approved_actions = [a for a in day_actions if a.status == ActionStatus.APPROVED]

    if pending_actions:
        pending_types = {a.action_type for a in pending_actions}
        if len(pending_types) > 1:
            return ComplianceState.MULTIPLE_ACTIONS_PENDING  # Orange
        return ComplianceState.PENDING  # Yellow

    if approved_actions and not meets_requirement:
        return ComplianceState.EXCUSED  # Blue

    return ComplianceState.NON_COMPLIANT  # Red
```

**Pie chart mapping (4 slices):**

| Slice | Color | Includes |
|-------|-------|----------|
| Compliant | Green | Weeks in COMPLIANT state |
| Excused | Blue | Weeks in EXCUSED state |
| Pending | Yellow/Orange | Weeks in PENDING or MULTIPLE_ACTIONS_PENDING state |
| Non-Compliant | Red | Weeks in NON_COMPLIANT state |

The pie chart groups Yellow and Orange into a single "Pending" slice to maintain the 3-4 slice simplicity per the original PRD. The table view shows the full 5-state color coding.

### AD-007: In-Memory File Upload Processing

| | |
|---|---|
| **Decision** | Process uploaded Excel files entirely in memory (no streaming, no temp files) |
| **Rationale** | The maximum expected file size is ~4,264 rows (328 employees x 13 weeks) with 12 columns — this is approximately 500KB to 2MB in .xlsx format. This fits comfortably in memory. In-memory processing is simpler (no temp file cleanup, no streaming complexity) and faster (openpyxl's read-only mode can parse the entire file in under a second). The PRD explicitly states "no file size limit for POC" — but the realistic data volume is small. |
| **Alternatives Considered** | Streaming/chunked processing (rejected — unnecessary complexity for files under 5MB; would add streaming state management for no practical benefit); Background job queue (rejected — processing completes in <30 seconds per NFR-013, no need for async job infrastructure) |
| **Requirement** | NFR-013 (upload processing <30s), TR-005 (Excel parsing) |

**Upload processing pipeline:**
```
File received → Validate extension (.xlsx) → Parse with openpyxl
→ Validate column headers → Filter rows (exclude CW, At Home)
→ Cross-reference worker data → Build upsert batch
→ Execute in single transaction → Return summary
```

### AD-008: Dedicated Admin Login via .env Credentials

| | |
|---|---|
| **Decision** | Admin authentication uses dedicated credentials (username + password) stored in `.env`, completely separate from the employee email lookup path. Admin is NOT derived from worker data. |
| **Rationale** | The human clarified that Admin should have a **dedicated login**, not be identified from the worker/org data. This makes sense: (1) Admin users may not be in the worker dataset at all (e.g., external HR contractors), (2) the admin role is operational, not organizational — it shouldn't depend on the employee hierarchy, (3) dedicated credentials are simpler to manage and rotate. For production, this would be replaced with Okta user IDs for admin access. |
| **Alternatives Considered** | Admin emails in .env with shared employee login path (rejected — human explicitly requested separate admin login); Database column in worker table (rejected — admin not tied to worker data); Hardcoded in source (rejected — violates secrets management standards) |
| **Requirement** | FR-031 (role determination), NFR-005 (secrets management) |

**Configuration:**
```env
# .env file (git-ignored)
ADMIN_USERNAME=rto-admin
ADMIN_PASSWORD=your-admin-password-here
JWT_SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./rto_compliance.db
SESSION_TIMEOUT_HOURS=8
```

**Production migration path:** Replace `ADMIN_USERNAME`/`ADMIN_PASSWORD` with Okta user IDs that are granted the Admin role through the identity platform.

---

## 6. Local Development Setup

Since the deployment target is local, the following describes how the application runs on a developer's machine:

### Prerequisites
- Python 3.11+
- Node.js 18+ (LTS)
- npm or yarn

### Quick Start
```bash
# Clone repository
git clone <repo-url>
cd rto-compliance-tracker

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env      # Edit with admin credentials and JWT secret
alembic upgrade head       # Create SQLite database + tables
uvicorn app.main:app --reload --port 8000

# Frontend setup (separate terminal)
cd frontend
npm install
npm run dev                # Vite dev server on port 5173
```

### Development Commands
```bash
# Run all tests
make test                  # Runs both backend and frontend tests

# Backend tests
cd backend && pytest --cov=app --cov-report=term-missing

# Frontend tests
cd frontend && npm test

# Linting
cd backend && ruff check .
cd frontend && npm run lint

# Format
cd backend && ruff format .
cd frontend && npm run format
```

### Environment Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | SQLite connection string | `sqlite:///./rto_compliance.db` |
| `JWT_SECRET_KEY` | Token signing key | (required, no default) |
| `SESSION_TIMEOUT_HOURS` | JWT expiration | `8` |
| `ADMIN_USERNAME` | Admin login username | (required, no default) |
| `ADMIN_PASSWORD` | Admin login password | (required, no default) |
| `LOG_LEVEL` | Application log level | `INFO` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |
