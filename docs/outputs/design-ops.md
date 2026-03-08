# Technical Design: RTO Compliance Tracker — Security, Observability & Deployment

## Document Info
- **Version:** 1.2
- **Date:** 2026-03-07
- **Status:** Draft
- **Requirements Baseline:** docs/outputs/requirements-bf.md, docs/outputs/requirements-tn.md

---

# Section 1: Security Model

## 1.1 Authentication Flow

**Implements:** NFR-001, TR-009, FR-030

The POC supports **two authentication paths**: employee/manager login via email lookup against worker data, and a dedicated admin login with separate credentials.

### Auth Path 1: Employee/Manager Login (Email Lookup)

```
Client                         Backend                       Database
  |                              |                              |
  |  POST /api/auth/login        |                              |
  |  { "email": "j.doe@..." }   |                              |
  |----------------------------->|                              |
  |                              |  SELECT * FROM workers       |
  |                              |  WHERE work_email = ?        |
  |                              |----------------------------->|
  |                              |         worker record        |
  |                              |<-----------------------------|
  |                              |                              |
  |                              |  Validate:                   |
  |                              |  - Email exists              |
  |                              |  - Worker Type = "Employee"  |
  |                              |  - Not excluded (At Home)    |
  |                              |                              |
  |                              |  Determine role:             |
  |                              |  - Is Manager = "Yes" → mgr  |
  |                              |  - Else → employee           |
  |                              |                              |
  |                              |  Generate JWT token:         |
  |                              |  { sub: worker_uuid,         |
  |                              |    role: "manager",          |
  |                              |    email_hash: sha256(...),  |
  |                              |    exp: now + 8h }           |
  |                              |                              |
  |  200 { token, role, name }   |                              |
  |<-----------------------------|                              |
  |                              |                              |
  |  Subsequent requests:        |                              |
  |  Authorization: Bearer <jwt> |                              |
  |----------------------------->|                              |
  |                              |  Verify JWT signature        |
  |                              |  Check expiration            |
  |                              |  Extract sub + role          |
```

### Auth Path 2: Dedicated Admin Login

Admin is a **separate auth path** — not derived from worker data. For the POC, admin credentials are stored in environment variables. In production, admin role will be defined by specific user IDs in Okta.

```
Client                         Backend
  |                              |
  |  POST /api/auth/admin-login  |
  |  { "username": "...",        |
  |    "password": "..." }       |
  |----------------------------->|
  |                              |  Validate:
  |                              |  - username === ADMIN_USERNAME (env)
  |                              |  - password === ADMIN_PASSWORD (env)
  |                              |  (compare using timing-safe equality)
  |                              |
  |                              |  Generate JWT token:
  |                              |  { sub: "admin-<hash>",
  |                              |    role: "admin",
  |                              |    exp: now + 8h }
  |                              |
  |  200 { token, role: "admin" }|
  |<-----------------------------|
```

**Key design decisions:**
- Admin login is a **separate endpoint** (`/api/auth/admin-login`) from employee login (`/api/auth/login`)
- Admin credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) are stored in `.env` — never in source code
- The admin JWT uses `sub: "admin-<hash>"` (not a worker UUID, since the admin may not exist in worker data)
- The admin has access to the upload screen only — they do not have employee/manager views (they have no worker record)
- If a worker who is also an admin needs employee/manager views, they log in via the employee path; admin upload is a separate session
- Password comparison uses `hmac.compare_digest` (Python stdlib) to prevent timing attacks

### Token Design

| Field | Value | Purpose |
|-------|-------|---------|
| `sub` | Worker UUID (employee/manager) or `admin-<hash>` (admin) | Identifies the user without PII |
| `role` | `employee` / `manager` / `admin` | RBAC enforcement |
| `iat` | Unix timestamp | Token creation time |
| `exp` | `iat` + 8 hours (configurable) | Token expiration |

- **Signing algorithm:** HS256 using `JWT_SECRET` from environment
- **Token delivery:** Returned in login response body; client stores in memory (not localStorage for XSS mitigation) or httpOnly cookie
- **JWT library:** `python-jose` or `PyJWT`
- **Token validation:** FastAPI dependency (`Depends(get_current_user)`) checks signature, expiration, and extracts claims on every protected request
- **Rejected logins:** Email not found → 401; Contingent Worker → 401; At Home worker → 401; Bad admin credentials → 401

### Denied Login Responses

| Condition | HTTP Status | Error Code | Message |
|-----------|-------------|------------|---------|
| Email not in worker data | 401 | `AUTH_USER_NOT_FOUND` | "No account found for this email address" |
| Contingent Worker | 401 | `AUTH_EXCLUDED_WORKER_TYPE` | "Access is not available for this account" |
| At Home worker | 401 | `AUTH_EXCLUDED_LOCATION` | "Access is not available for this account" |
| Malformed email | 400 | `AUTH_INVALID_EMAIL` | "Please enter a valid work email address" |
| Invalid admin credentials | 401 | `AUTH_INVALID_CREDENTIALS` | "Invalid username or password" |
| Expired token | 401 | `AUTH_TOKEN_EXPIRED` | "Session expired. Please log in again" |

Note: Error messages are intentionally vague for excluded workers to avoid leaking policy details.

## 1.2 Authorization Model (RBAC)

**Implements:** NFR-002, TR-010, FR-031

### Role Definitions

| Role | Source | Permissions |
|------|--------|-------------|
| Employee | Default for all authenticated workers (email login) | View own compliance data, submit exceptions, add PTO, dispute badge counts |
| Manager | `Is Manager = "Yes"` in worker data (email login) | All Employee permissions + view direct reports dashboard, drill into reports, approve/reject exceptions and disputes |
| Admin | Dedicated admin login (`ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars) | Upload Excel data files. No employee/manager views (separate auth path) |

Note: Employee and Manager roles come from the email-based login path. Admin is a **separate, dedicated login**. A person who is both a worker and an admin logs in twice via different paths if they need both capabilities. In production (Okta), a single SSO session will unify roles.

### Dependency Injection Enforcement

Authorization is enforced via FastAPI dependencies that run before any route handler:

```
Request → get_current_user (JWT verify) → require_role (role check) → Route Handler
```

**`get_current_user` dependency:**
1. Extract `Authorization: Bearer <token>` header via `HTTPBearer` security scheme
2. Verify JWT signature and expiration using `python-jose`
3. Return decoded claims (`sub`, `role`) as a `CurrentUser` Pydantic model
4. If invalid/missing → raise `HTTPException(401)`

**`require_role(required_roles)` dependency factory:**
1. Read user role from the `CurrentUser` object returned by `get_current_user`
2. Check if user's role is in `required_roles` list
3. If not authorized → raise `HTTPException(403)` and log the attempt
4. If authorized → return user to route handler

**Usage in routes:**
```python
@router.get("/api/manager/reports")
async def get_reports(user: CurrentUser = Depends(require_role(["manager"]))):
    ...
```

### Endpoint Authorization Matrix

| Endpoint Pattern | Employee | Manager | Admin | Public |
|-----------------|----------|---------|-------|--------|
| `POST /api/auth/login` | — | — | — | Yes |
| `POST /api/auth/admin-login` | — | — | — | Yes |
| `GET /api/compliance/me` | Yes | Yes | No | No |
| `POST /api/compliance/me/weeks/{week_id}/exception` | Yes | Yes | No | No |
| `POST /api/compliance/me/weeks/{week_id}/dispute` | Yes | Yes | No | No |
| `POST /api/compliance/me/weeks/{week_id}/pto` | Yes | Yes | No | No |
| `GET /api/manager/reports` | No | Yes | No | No |
| `GET /api/manager/reports/{id}/compliance` | No | Yes | No | No |
| `POST /api/manager/reports/{id}/weeks/{week_id}/approve` | No | Yes | No | No |
| `POST /api/manager/reports/{id}/weeks/{week_id}/reject` | No | Yes | No | No |
| `POST /api/admin/upload` | No | No | Yes | No |
| `GET /health` | — | — | — | Yes |
| `GET /ready` | — | — | — | Yes |

Note: Admin role can ONLY access `/api/admin/*` endpoints. Employee/Manager roles cannot access admin endpoints. The two auth paths are fully separated.

### Authorization Audit Logging

Every authorization decision is logged:

```json
{
  "timestamp": "2026-03-07T10:30:00.000Z",
  "level": "INFO",
  "message": "Authorization check",
  "service": "rto-compliance-api",
  "correlationId": "abc-123",
  "userId": "uuid-worker-id",
  "role": "employee",
  "endpoint": "GET /api/manager/reports",
  "action": "DENIED",
  "reason": "Insufficient role: required=manager, actual=employee"
}
```

## 1.3 Admin Role Assignment

**Implements:** FR-031 (Admin role), Gap #1 from requirements

**Resolved:** Admin role uses a **dedicated admin login** — a separate account with its own credentials, not derived from worker data.

```
# .env
ADMIN_USERNAME=rto-admin
ADMIN_PASSWORD=change-me-to-a-secure-password
```

**How it works:**
1. The admin navigates to a separate login form (or a "Login as Admin" link on the login page)
2. They enter the admin username and password
3. The backend validates credentials against `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars
4. On success, a JWT with `role: "admin"` and `sub: "admin-<hash>"` is issued
5. The admin can only access the upload screen — no employee/manager views

**Why a dedicated login (not email-based):**
- The worker/org data file has no "Is Admin" field
- Admin is a system role, not a worker attribute — it should be independent of worker data
- For production, admin role will be defined by specific user IDs in Okta
- A dedicated account is simplest for POC and cleanly separates concerns

**Security considerations:**
- `ADMIN_PASSWORD` must be changed from the default placeholder before use
- The application refuses to start if `ADMIN_PASSWORD` is the placeholder value
- Password comparison uses `hmac.compare_digest` (Python stdlib) to prevent timing attacks
- Failed admin login attempts are logged at WARN level with rate limiting potential

## 1.4 Self-Approval Prevention

**Implements:** NFR-002, TR-011, FR-024, BR-012

Self-approval prevention is enforced **server-side** in the approval/rejection route handlers. It cannot be bypassed by the UI.

**Implementation:**

```
POST /api/manager/reports/{employee_id}/weeks/{week_id}/approve
POST /api/manager/reports/{employee_id}/weeks/{week_id}/reject

FastAPI dependency check (before business logic):
  1. Extract acting user ID from JWT: current_user.sub
  2. Extract target employee ID from path: employee_id
  3. If current_user.sub == employee_id → raise HTTPException(403)
     Error: { code: "SELF_APPROVAL_FORBIDDEN", message: "Cannot approve or reject your own requests" }
  4. Log the self-approval attempt at WARN level
```

**Additional validation:**
- The backend also verifies that the acting manager is the **direct manager** of the target employee (via the hierarchy data), preventing managers from approving requests for employees outside their reporting chain
- Both checks (self-approval and hierarchy) happen in a dedicated `require_approval_auth` FastAPI dependency

## 1.5 PII Handling

**Implements:** NFR-003, NFR-004

### PII Fields Identified

| Field | Source | Classification |
|-------|--------|---------------|
| Worker name | Worker data, RTO data | PII — mask in logs |
| Work email | Worker data | PII — mask in logs |
| Manager name | Worker data | PII — mask in logs |
| Manager email | Worker data | PII — mask in logs |
| Badge swipe count (per individual) | RTO data | PII when tied to individual — mask in logs |
| Location | Worker data | Sensitive — mask in logs |

### PII Masking Approach

**Strategy:** Redaction in logs, internal UUIDs everywhere else.

**Logging middleware:**
A `piiMask` utility function wraps all log output. It scans known PII fields and applies masking before writing:

| PII Type | Masking Rule | Example |
|----------|-------------|---------|
| Email | Show first 2 chars + domain | `ja***@nordstrom.com` |
| Name | First initial + `***` | `J***` |
| Badge count | Redact entirely in logs | `[REDACTED]` |
| Location | Redact entirely in logs | `[REDACTED]` |

**Implementation approach:**
- Define a `PII_FIELDS` constant listing field names that contain PII (e.g., `worker`, `email`, `manager`, `managerEmail`, `location`)
- The structured logger automatically scans log metadata objects for these fields and applies masking before serialization
- Request/response body logging (if enabled) runs through the same masking filter

### PII in URLs (NFR-004)

- All API endpoints use **internal UUIDs** for resource identification, never names or emails
- Example: `/api/manager/reports/550e8400-e29b-41d4-a716-446655440000/compliance` (not `/api/manager/reports/jane.smith/compliance`)
- The login endpoint accepts email in the POST body (never as a query parameter or URL path segment)
- Frontend routes use UUIDs or opaque IDs for navigation state

## 1.6 Input Validation

**Implements:** NFR-006, TR-005

### Excel Upload Validation

Validation runs in stages — early rejection before expensive processing:

| Stage | Check | Failure Action |
|-------|-------|---------------|
| 1. File extension | Must be `.xlsx` | Reject: "Only .xlsx files are accepted" |
| 2. File content | Must be valid OOXML (parse with `openpyxl`) | Reject: "File is corrupted or not a valid Excel file" |
| 3. Required columns | All 12 RTO columns present (by header name match) | Reject: "Missing required columns: [list]" |
| 4. Data types | Badge swipe = integer, Week Range = date pattern, etc. | Skip row + warn: "Row N: invalid value in column X" |
| 5. Business rules | Worker Type, Work Location Type values are recognized | Skip row + warn: "Row N: unrecognized Worker Type" |

### Text Input Sanitization (XSS Prevention)

All user text input (exception explanations, rejection notes) is sanitized:

- **Server-side:** Strip HTML tags using `bleach` library; Pydantic models validate input types and lengths at the API boundary
- **Database:** All queries use SQLAlchemy ORM or parameterized statements — no string concatenation
- **Frontend:** React's default JSX escaping prevents XSS for rendered content; `dangerouslySetInnerHTML` is never used

### Parameterized Queries

All database operations use SQLAlchemy ORM or parameterized queries:

```python
# CORRECT (SQLAlchemy ORM):
worker = session.query(Worker).filter(Worker.work_email == email).first()

# CORRECT (parameterized raw SQL):
session.execute(text("SELECT * FROM workers WHERE work_email = :email"), {"email": email})

# FORBIDDEN (string concatenation):
session.execute(f"SELECT * FROM workers WHERE work_email = '{email}'")
```

## 1.7 CORS Configuration

**Implements:** TR-017 (local dev)

For local development, CORS is configured via FastAPI's `CORSMiddleware` to allow the frontend dev server to communicate with the backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # ["http://localhost:5173", "http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Correlation-ID"],
    expose_headers=["X-Correlation-ID"],
    max_age=86400,
)
```

- In development, the frontend runs on `localhost:5173` (Vite default) and the backend on `localhost:8000`
- Only these specific origins are allowed — no wildcard `*`
- `X-Correlation-ID` is exposed so the frontend can read it from responses

## 1.8 Security Requirements Traceability

| Requirement | Design Section | How Addressed |
|-------------|---------------|---------------|
| NFR-001 (Auth Security) | 1.1 Authentication Flow | Dual auth paths: email lookup for employees/managers + dedicated admin login. JWT with 8h expiry, 401 on all protected endpoints |
| NFR-002 (Authorization) | 1.2 RBAC, 1.4 Self-Approval | Middleware enforcement, audit logging, self-approval check, separated admin/employee auth paths |
| NFR-003 (PII in Logs) | 1.5 PII Handling | Logging middleware with field-level masking, UUIDs for traceability |
| NFR-004 (PII in URLs) | 1.5 PII in URLs | UUID-based resource paths, email only in POST body |
| NFR-005 (Secrets Mgmt) | 1.3 Admin Role, 3.3 Env Vars | All secrets (JWT_SECRET, ADMIN_PASSWORD) in .env (git-ignored), startup validation |
| NFR-006 (Input Validation) | 1.6 Input Validation | Multi-stage upload validation, XSS sanitization, parameterized queries, day-selection validation |

---

# Section 2: Observability Model

## 2.1 Structured JSON Logging Format

**Implements:** NFR-007

All application logs are emitted as structured JSON. No free-text log lines.

### Log Schema

```json
{
  "timestamp": "2026-03-07T10:30:00.123Z",
  "level": "INFO",
  "message": "Request processed",
  "service": "rto-compliance-api",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "environment": "development",
  "version": "1.0.0",
  "method": "GET",
  "path": "/api/compliance/me",
  "statusCode": 200,
  "durationMs": 45,
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Standard Fields (every log line)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `timestamp` | ISO 8601 string | System clock | When the log was emitted |
| `level` | Enum | Code | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `message` | String | Code | Human-readable description of the event |
| `service` | String | Config | Always `"rto-compliance-api"` for backend, `"rto-compliance-ui"` for frontend |
| `correlationId` | UUID string | Request header / generated | Links all logs for a single request |
| `environment` | String | Env var `APP_ENV` | `"development"` / `"test"` / `"production"` |
| `version` | String | `pyproject.toml` | Application version |

### Request-Scoped Fields (added by request logging middleware)

| Field | Type | Description |
|-------|------|-------------|
| `method` | String | HTTP method (GET, POST, etc.) |
| `path` | String | Request URL path (no query params) |
| `statusCode` | Integer | HTTP response status code |
| `durationMs` | Integer | Request processing time in ms |
| `userId` | UUID | Authenticated user's internal ID (from JWT `sub`) |

### Log Levels Usage

| Level | When to Use | Example |
|-------|-------------|---------|
| `DEBUG` | Detailed diagnostic info (disabled in prod) | "Parsed 4264 rows from Excel upload" |
| `INFO` | Normal operations | "Request processed", "User authenticated", "Upload complete" |
| `WARN` | Unexpected but recoverable | "Worker not found in org data, skipping", "Self-approval attempt blocked" |
| `ERROR` | Failures requiring attention | "Database connection failed", "Excel parse error", "Unhandled exception" |

### Logger Implementation

Use **`structlog`** (Python structured logging library) configured with:
- JSON renderer for output (no pretty-printing in production; `ConsoleRenderer` for local dev)
- Minimum level configurable via `LOG_LEVEL` env var (default: `INFO`)
- PII masking processor in the structlog processor chain (see Section 1.5)
- Automatic request context injection via `contextvars` (Python stdlib)

**structlog processor chain:**
```python
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,  # Inject correlation ID, user ID
        add_service_info,                          # Add service name, version, env
        pii_masking_processor,                     # Mask PII fields (Section 1.5)
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),       # JSON output
    ],
)
```

## 2.2 Correlation ID Propagation

**Implements:** NFR-008

### Middleware Approach

A FastAPI middleware runs as the first middleware in the ASGI pipeline:

```
Incoming Request
  │
  ├─ Has X-Correlation-ID header?
  │   ├─ Yes → Use provided value
  │   └─ No  → Generate UUID v4
  │
  ├─ Store in contextvars (request context)
  │
  ├─ Set X-Correlation-ID on response headers
  │
  └─ All downstream code reads from contextvars
```

**Header name:** `X-Correlation-ID`

**Generation:** UUID v4 via `uuid.uuid4()` (Python stdlib)

**Propagation mechanism:**
- `contextvars` (Python stdlib) provides request-scoped context for async code
- structlog's `merge_contextvars` processor automatically reads the correlation ID for every log line
- Error responses include `correlationId` in the response body

**FastAPI middleware implementation:**
```python
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    return response
```

**Frontend integration:**
- The frontend reads `X-Correlation-ID` from API response headers
- On subsequent requests in the same user action, the frontend passes the correlation ID back via the request header
- This creates an end-to-end trace from UI action through all API calls

## 2.3 PII Masking in Logs

**Implements:** NFR-003

PII masking is applied automatically by the structured logger's serializer before any log output is written.

### Masking Rules

| Field Pattern | Masking Approach | Example Input | Masked Output |
|--------------|-----------------|---------------|---------------|
| `email`, `workEmail`, `managerEmail` | Partial redaction: first 2 chars + `***@` + domain | `jane.smith@nordstrom.com` | `ja***@nordstrom.com` |
| `name`, `worker`, `manager`, `employeeName` | First initial + `***` | `Jane Smith` | `J***` |
| `badgeSwipes`, `totalBadgeSwipe` | Full redaction | `23` | `[REDACTED]` |
| `location` | Full redaction | `865 CORPORATE TOWER II` | `[REDACTED]` |

### Implementation

The structlog processor chain includes a `pii_masking_processor` that:

1. Receives the event dict before JSON rendering
2. Iterates over known PII field names (`PII_FIELDS` constant)
3. Applies the appropriate masking function for each matched field
4. Returns the masked event dict for JSON serialization

**Request/response body logging:**
- Request bodies are NOT logged by default (they may contain PII)
- If enabled for debugging, the same PII serializer processes the body before logging
- Response bodies are NOT logged (they contain employee data)

### What is Never Logged

- Full email addresses
- Full employee names
- Badge swipe counts tied to individuals
- Exception explanation text (may contain personal details)
- Physical locations tied to individuals

## 2.4 Health Check Endpoints

**Implements:** NFR-009

### GET /health

**Purpose:** Liveness check — is the process running?

```json
// 200 OK
{
  "status": "healthy",
  "timestamp": "2026-03-07T10:30:00.000Z",
  "version": "1.0.0"
}
```

- **Does NOT** check database, file system, or any dependencies
- **Does NOT** require authentication
- Returns 200 if the process can respond to HTTP requests
- Response time target: < 10ms

### GET /ready

**Purpose:** Readiness check — can the application serve requests?

```json
// 200 OK
{
  "status": "ready",
  "timestamp": "2026-03-07T10:30:00.000Z",
  "checks": {
    "database": "connected",
    "workerDataLoaded": true
  }
}
```

```json
// 503 Service Unavailable
{
  "status": "not ready",
  "timestamp": "2026-03-07T10:30:00.000Z",
  "checks": {
    "database": "disconnected",
    "workerDataLoaded": false
  }
}
```

- **Checks:** SQLite database connection, worker/org data loaded in memory
- **Does NOT** require authentication
- Returns 503 if any critical dependency is unavailable

## 2.5 Error Response Format

**Implements:** NFR-010

All API errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing required column: Worker",
    "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

### Error Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error.code` | String | Yes | Machine-readable error code (uppercase snake_case) |
| `error.message` | String | Yes | Human-readable message safe for display to users |
| `error.correlationId` | UUID | Yes | Links to server-side logs for debugging |

### Error Code Catalog

| HTTP Status | Error Code | When Used |
|-------------|------------|-----------|
| 400 | `VALIDATION_FAILED` | Missing or invalid input fields |
| 400 | `INVALID_FILE_FORMAT` | Upload file is not valid .xlsx |
| 400 | `MISSING_COLUMNS` | Upload file missing required columns |
| 400 | `EDIT_WINDOW_EXPIRED` | Action on a week outside the 5-week edit window |
| 400 | `DAY_SELECTION_REQUIRED` | Exception/dispute/PTO submission missing day selection |
| 400 | `SAME_DAY_CONFLICT` | Attempting dispute + exception on the same day within a week |
| 401 | `AUTH_USER_NOT_FOUND` | Email not found in worker data |
| 401 | `AUTH_EXCLUDED_WORKER_TYPE` | Contingent worker attempting login |
| 401 | `AUTH_EXCLUDED_LOCATION` | At Home worker attempting login |
| 401 | `AUTH_INVALID_CREDENTIALS` | Invalid admin username or password |
| 401 | `AUTH_TOKEN_EXPIRED` | JWT token has expired |
| 401 | `AUTH_TOKEN_INVALID` | JWT signature verification failed |
| 403 | `FORBIDDEN` | Role does not have access to this endpoint |
| 403 | `SELF_APPROVAL_FORBIDDEN` | Manager trying to approve own request |
| 403 | `NOT_DIRECT_MANAGER` | Manager trying to act on non-report's data |
| 404 | `RESOURCE_NOT_FOUND` | Requested employee or week record not found |
| 409 | `EXCEPTION_ALREADY_PENDING` | Active exception already pending for the same day(s) in this week |
| 500 | `INTERNAL_ERROR` | Unhandled server error (details logged, not returned) |

### Security: What Errors Never Expose

- Stack traces
- SQL queries or database errors
- File system paths
- Internal class/function names
- Third-party library version info

Server-side, the full error (including stack trace) is logged at `ERROR` level with the correlation ID for debugging.

## 2.6 Audit Logging

**Implements:** NFR-002 (authorization audit), BR-003 (audit trail)

### Audited Actions

Every state-changing action is recorded as a structured audit log entry:

| Action | Log Level | Key Fields |
|--------|-----------|------------|
| Employee login (success) | INFO | `userId`, `role`, `action: "LOGIN_SUCCESS"` |
| Employee login (failure) | WARN | `emailHash`, `action: "LOGIN_FAILED"`, `reason` |
| Admin login (success) | INFO | `action: "ADMIN_LOGIN_SUCCESS"` |
| Admin login (failure) | WARN | `action: "ADMIN_LOGIN_FAILED"`, `reason` |
| Exception submitted | INFO | `userId`, `weekId`, `dayDates`, `action: "EXCEPTION_SUBMITTED"` |
| Exception re-submitted (after rejection) | INFO | `userId`, `weekId`, `dayDates`, `version`, `action: "EXCEPTION_RESUBMITTED"` |
| Exception approved | INFO | `managerId`, `employeeId`, `weekId`, `action: "EXCEPTION_APPROVED"` |
| Exception rejected | INFO | `managerId`, `employeeId`, `weekId`, `action: "EXCEPTION_REJECTED"` |
| Badge dispute submitted | INFO | `userId`, `weekId`, `dayDates`, `action: "DISPUTE_SUBMITTED"` |
| Badge dispute approved | INFO | `managerId`, `employeeId`, `weekId`, `action: "DISPUTE_APPROVED"` |
| Badge dispute rejected | INFO | `managerId`, `employeeId`, `weekId`, `action: "DISPUTE_REJECTED"` |
| PTO submitted (pending approval) | INFO | `userId`, `weekId`, `dayDates`, `ptoDays`, `action: "PTO_SUBMITTED"` |
| PTO approved | INFO | `managerId`, `employeeId`, `weekId`, `action: "PTO_APPROVED"` |
| PTO rejected | INFO | `managerId`, `employeeId`, `weekId`, `action: "PTO_REJECTED"` |
| Data upload started | INFO | `adminId`, `fileName`, `action: "UPLOAD_STARTED"` |
| Data upload completed | INFO | `adminId`, `rowsProcessed`, `rowsSkipped`, `action: "UPLOAD_COMPLETED"` |
| Authorization denied | WARN | `userId`, `role`, `endpoint`, `action: "AUTH_DENIED"` |
| Self-approval blocked | WARN | `userId`, `targetEmployeeId`, `action: "SELF_APPROVAL_BLOCKED"` |
| Same-day dual action blocked | WARN | `userId`, `weekId`, `dayDate`, `action: "SAME_DAY_DUAL_ACTION_BLOCKED"` |

**Notes on gap resolutions reflected in audit:**
- **Gap #3 (Re-submission):** `EXCEPTION_RESUBMITTED` tracks when an employee submits a new exception after a prior rejection. The `version` field indicates the submission attempt number. Old rejection records are preserved for full audit trail.
- **Gap #4 (PTO approval workflow):** PTO additions now follow the same approval workflow as exceptions (`PTO_SUBMITTED` → `PTO_APPROVED`/`PTO_REJECTED`). PTO does NOT auto-excuse.
- **Gap #5 (Day-level tracking):** `dayDates` field in submission audit entries records which specific day(s) of the week the action covers. `SAME_DAY_DUAL_ACTION_BLOCKED` logs attempts to submit both a dispute and exception for the same day.

### Audit Log Format

```json
{
  "timestamp": "2026-03-07T10:30:00.000Z",
  "level": "INFO",
  "message": "Audit: Exception approved",
  "service": "rto-compliance-api",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "audit": {
    "action": "EXCEPTION_APPROVED",
    "actorId": "mgr-uuid-here",
    "targetId": "emp-uuid-here",
    "resourceType": "compliance_week",
    "resourceId": "week-uuid-here",
    "metadata": {
      "weekRange": "03/03/2026 - 03/09/2026"
    }
  }
}
```

Note: The `audit` sub-object uses only internal UUIDs — no PII.

## 2.7 Compliance State Logging (5-State Model)

**Implements:** BR-010 (updated to 5-state), Gap #5

The compliance model has been expanded from 4 states to 5 states. All state transitions are logged as audit events.

### 5-State Model for Logging

| State | Color | Log Action on Entry |
|-------|-------|-------------------|
| Compliant | Green | (Set from badge data — no action log, logged during upload processing) |
| Non-Compliant | Red | `STATE_CHANGE` with `newState: "non_compliant"` (on rejection, or from badge data) |
| Exception Pending | Yellow | `STATE_CHANGE` with `newState: "exception_pending"` (single action type pending) |
| Multiple Actions Pending | Orange | `STATE_CHANGE` with `newState: "multiple_pending"` (both dispute + exception on different days) |
| Excused | Blue | `STATE_CHANGE` with `newState: "excused"` (manager approved) |

### State Transition Audit Entry

```json
{
  "timestamp": "2026-03-07T10:30:00.000Z",
  "level": "INFO",
  "message": "Audit: Compliance state change",
  "service": "rto-compliance-api",
  "correlationId": "...",
  "audit": {
    "action": "STATE_CHANGE",
    "actorId": "uuid",
    "targetId": "employee-uuid",
    "resourceType": "compliance_week",
    "resourceId": "week-uuid",
    "metadata": {
      "previousState": "non_compliant",
      "newState": "exception_pending",
      "trigger": "exception_submitted",
      "dayDates": ["2026-03-03", "2026-03-04"],
      "version": 1
    }
  }
}
```

Key metadata fields:
- `previousState` / `newState`: The 5-state values
- `trigger`: What caused the transition (exception_submitted, exception_resubmitted, dispute_submitted, pto_submitted, approved, rejected)
- `dayDates`: Which specific days within the week the action covers (Gap #5)
- `version`: For re-submissions after rejection (Gap #3), tracks the attempt number

## 2.8 Observability Requirements Traceability

| Requirement | Design Section | How Addressed |
|-------------|---------------|---------------|
| NFR-007 (Structured Logging) | 2.1 Logging Format | JSON format with standard fields, structlog with processor chain |
| NFR-008 (Correlation IDs) | 2.2 Correlation IDs | FastAPI middleware generates/propagates via X-Correlation-ID, contextvars |
| NFR-009 (Health Endpoints) | 2.4 Health Checks | /health (liveness) + /ready (readiness with DB check) |
| NFR-010 (Error Responses) | 2.5 Error Format | Consistent JSON error structure with code, message, correlationId |
| NFR-003 (PII in Logs) | 2.3 PII Masking | structlog processor-based automatic masking of known PII fields |

---

# Section 3: Deployment Model (Local Development)

**Implements:** TR-017

## 3.1 Project Structure

```
rto-compliance-tracker/
├── frontend/                  # React + TypeScript (Vite)
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Route-level pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client functions
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                   # Python 3.11+ FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app setup, middleware registration
│   │   ├── config.py          # Pydantic Settings (env loading)
│   │   ├── dependencies.py    # Auth, RBAC, correlation ID dependencies
│   │   ├── middleware/        # CORS, logging, error handler middleware
│   │   │   ├── __init__.py
│   │   │   ├── correlation.py
│   │   │   ├── logging.py
│   │   │   └── error_handler.py
│   │   ├── routes/            # FastAPI router definitions
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── compliance.py
│   │   │   ├── manager.py
│   │   │   ├── admin.py
│   │   │   └── health.py
│   │   ├── services/          # Business logic layer
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   └── utils/             # Logger, PII masking, Excel parser
│   ├── alembic/               # Database migrations
│   │   ├── versions/          # Migration scripts
│   │   ├── env.py
│   │   └── alembic.ini
│   ├── tests/                 # pytest test suite
│   │   ├── conftest.py        # Fixtures (test DB, test client)
│   │   ├── test_auth.py
│   │   ├── test_compliance.py
│   │   ├── test_manager.py
│   │   ├── test_admin.py
│   │   └── test_upload.py
│   ├── seeds/                 # Sample data seed scripts
│   │   └── seed_data.py
│   ├── pyproject.toml         # Python project config (dependencies, tools)
│   └── requirements.txt       # Pinned dependencies (generated from pyproject.toml)
│
├── data/                      # Sample Excel files for development
│   ├── RTO_Sample.xlsx
│   └── tech_workers_with_manager_email.xlsx
│
├── .env.example               # Template for environment variables
├── .gitignore                 # Includes .env, __pycache__, .venv, *.sqlite, node_modules
├── Makefile                   # Convenience commands for dev workflow
└── README.md
```

**Project layout:** Separate frontend (npm) and backend (Python/pip) directories. A `Makefile` at the root provides convenience commands to start both, run tests, and manage migrations. No npm workspaces needed — the backend is pure Python.

## 3.2 Local Dev Startup

### Single Command Start

From the project root:

```bash
# Start both frontend and backend in parallel
make dev
```

The `Makefile` orchestrates both processes:

```makefile
.PHONY: dev dev-backend dev-frontend install install-backend install-frontend
.PHONY: test test-backend test-frontend lint migrate seed

# Start both frontend and backend
dev:
	@echo "Starting backend (FastAPI) and frontend (Vite)..."
	$(MAKE) dev-backend & $(MAKE) dev-frontend & wait

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# Install all dependencies
install: install-backend install-frontend

install-backend:
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"

install-frontend:
	cd frontend && npm install

# Testing
test: test-backend test-frontend

test-backend:
	cd backend && . .venv/bin/activate && pytest --cov=app --cov-report=term-missing

test-frontend:
	cd frontend && npm run test

# Linting
lint:
	cd backend && . .venv/bin/activate && ruff check app/ tests/
	cd frontend && npm run lint

# Database
migrate:
	cd backend && . .venv/bin/activate && alembic upgrade head

rollback:
	cd backend && . .venv/bin/activate && alembic downgrade -1

seed:
	cd backend && . .venv/bin/activate && python -m seeds.seed_data
```

### What Starts

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | `http://localhost:8000` | FastAPI server with auto-reload (uvicorn) |
| API Docs | `http://localhost:8000/docs` | Swagger UI (auto-generated by FastAPI) |
| Frontend Dev | `http://localhost:5173` | Vite dev server with HMR |

### First-Time Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd rto-compliance-tracker

# 2. Copy environment template
cp .env.example .env
# Edit .env with your settings (see Section 3.3)

# 3. Install all dependencies (Python venv + npm)
make install

# 4. Run database migrations (creates SQLite file)
make migrate

# 5. Seed sample data (optional — loads sample Excel files)
make seed

# 6. Start development
make dev
```

**Python version requirement:** Python 3.11+ must be installed. The backend uses a local virtual environment (`.venv/`) created during `make install`.

## 3.3 Environment Variables

**Implements:** NFR-005

### .env.example Template

```bash
# ===== Application =====
APP_ENV=development
PORT=8000
LOG_LEVEL=DEBUG

# ===== Authentication =====
JWT_SECRET=change-me-to-a-random-string-at-least-32-chars
JWT_EXPIRY_HOURS=8

# ===== Admin Account (Dedicated Login) =====
ADMIN_USERNAME=rto-admin
ADMIN_PASSWORD=change-me-to-a-secure-password

# ===== Database =====
DATABASE_URL=sqlite:///./data/rto-compliance.sqlite

# ===== Frontend =====
VITE_API_URL=http://localhost:8000/api

# ===== CORS =====
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Variable Descriptions

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_ENV` | No | `development` | Environment name (development/test/production) |
| `PORT` | No | `8000` | Backend API server port (uvicorn) |
| `LOG_LEVEL` | No | `INFO` | Minimum log level (DEBUG/INFO/WARN/ERROR) |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing (min 32 characters) |
| `JWT_EXPIRY_HOURS` | No | `8` | JWT token expiration time in hours |
| `ADMIN_USERNAME` | Yes | — | Username for the dedicated admin account |
| `ADMIN_PASSWORD` | Yes | — | Password for the dedicated admin account |
| `DATABASE_URL` | No | `sqlite:///./data/rto-compliance.sqlite` | SQLAlchemy database URL |
| `VITE_API_URL` | No | `http://localhost:8000/api` | API base URL for frontend |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Allowed CORS origins (comma-separated) |

**Configuration loading:** Uses Pydantic `BaseSettings` which reads from `.env` automatically:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    port: int = 8000
    log_level: str = "INFO"
    jwt_secret: str  # Required — no default
    jwt_expiry_hours: int = 8
    admin_username: str  # Required
    admin_password: str  # Required
    database_url: str = "sqlite:///./data/rto-compliance.sqlite"
    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
```

### Security Notes

- `.env` is listed in `.gitignore` — never committed
- `.env.example` contains placeholder values only (no real secrets)
- `JWT_SECRET` must be changed from the placeholder before use
- `ADMIN_PASSWORD` must be changed from the placeholder before use
- The application fails to start if `JWT_SECRET` or `ADMIN_PASSWORD` is the default placeholder value

## 3.4 Database Initialization

**Implements:** TR-017, FR-034

### SQLite Configuration

- **Database file:** `./data/rto-compliance.sqlite` (configurable via `DATABASE_URL`)
- **Why SQLite:** Zero-configuration, file-based, no separate server process — ideal for local development
- **ORM:** SQLAlchemy 2.0+ with `aiosqlite` driver for async support
- **Migrations:** Alembic (SQLAlchemy's migration tool)

### Migration Approach

Migrations are managed via Alembic:

```bash
# Run all pending migrations
make migrate
# Or directly: cd backend && alembic upgrade head

# Rollback last migration
make rollback
# Or directly: cd backend && alembic downgrade -1

# Generate a new migration from model changes
cd backend && alembic revision --autogenerate -m "description of change"

# Check migration status
cd backend && alembic current
```

Migration files live in `backend/alembic/versions/` with timestamped filenames:

```
20260307_001_create_workers_table.py
20260307_002_create_compliance_records_table.py
20260307_003_create_exceptions_table.py
20260307_004_create_disputes_table.py
20260307_005_create_pto_additions_table.py
20260307_006_create_manager_actions_table.py
```

### Schema Creation

The migrations create all tables defined in the data model (covered in the architecture section of the design). Key points:
- All tables use UUID primary keys (not auto-increment integers) for PII protection in URLs
- Foreign keys are enforced via SQLAlchemy (`PRAGMA foreign_keys = ON` configured in engine connect event)
- Indexes on frequently queried columns: `workers.work_email`, `compliance_records.worker_id + week_start`, `exceptions.worker_id`
- SQLAlchemy models define the schema; Alembic auto-generates migrations from model diffs

## 3.5 Sample Data Seeding

**Implements:** TR-017

### Seed Command

```bash
# Load sample data from Excel files in data/ directory
make seed
# Or directly: cd backend && python -m seeds.seed_data
```

### What the Seeder Does

1. **Reads `data/tech_workers_with_manager_email.xlsx`** (via `openpyxl`):
   - Parses all 783 rows
   - Filters to eligible employees (Worker Type = "Employee", Work Location Type != "At Home")
   - Inserts worker records with generated UUIDs
   - Builds the org hierarchy (manager relationships)

2. **Reads `data/RTO_Sample.xlsx`** (via `openpyxl`):
   - Parses all compliance rows
   - Matches workers by name to the loaded worker records
   - Creates compliance records for each employee-week combination

3. **Creates sample application data (optional):**
   - Sample exceptions in various states (pending, approved, rejected, re-submitted after rejection)
   - A sample badge dispute (with specific day selection)
   - A sample PTO addition in pending-approval state (PTO follows the same approval workflow as exceptions per Gap #4)
   - A week with both a dispute and exception on different days (5th state: Multiple Actions Pending, per Gap #5)
   - This allows developers to immediately see all 5 compliance states in the UI

### Idempotency

- The seeder checks if data already exists before inserting
- Running `make seed` multiple times does not create duplicates
- To reset: delete the SQLite file and re-run `make migrate && make seed`

## 3.6 Build and Test Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies (Python venv + npm) |
| `make dev` | Start frontend + backend in development mode |
| `make test` | Run all tests (backend pytest + frontend Vitest) |
| `make test-backend` | Run backend tests with coverage report |
| `make test-frontend` | Run frontend tests |
| `make lint` | Run ruff (backend) + ESLint (frontend) |
| `make migrate` | Run Alembic database migrations |
| `make rollback` | Rollback last Alembic migration |
| `make seed` | Seed database with sample data |
| `cd frontend && npm run build` | Build frontend for production |
| `cd frontend && npm run typecheck` | Run TypeScript type checking (frontend only) |
| `cd backend && ruff format app/ tests/` | Auto-format Python code |
| `cd frontend && npm run format` | Run Prettier on frontend code |

### Test Strategy (Local)

- **Backend unit tests:** `pytest` with `pytest-cov` for coverage, run with `make test-backend`
- **Backend integration tests:** `httpx.AsyncClient` (FastAPI's `TestClient`) for API endpoint testing against a test SQLite database
- **Frontend tests:** Vitest + React Testing Library for component tests
- **Coverage target:** 80% minimum (NFR-015), enforced via `pytest --cov-fail-under=80`
- **Test database:** In-memory SQLite (`sqlite:///:memory:`) created fresh per test session via pytest fixtures
- **Linting:** `ruff` for Python (backend), ESLint for TypeScript (frontend)
- **Formatting:** `ruff format` for Python, Prettier for TypeScript

## 3.7 Deployment Requirements Traceability

| Requirement | Design Section | How Addressed |
|-------------|---------------|---------------|
| TR-017 (Local Dev Environment) | 3.1-3.6 | Frontend (Vite/npm) + Backend (FastAPI/pip), Makefile orchestration, SQLite via SQLAlchemy |
| NFR-005 (Secrets Management) | 3.3 Environment Variables | .env file (git-ignored), Pydantic Settings validation, fail on missing JWT_SECRET/ADMIN_PASSWORD |
| NFR-015 (Test Coverage) | 3.6 Build and Test | pytest + React Testing Library + httpx TestClient, 80% coverage enforced |
| NFR-016 (Code Quality) | 3.6 Build and Test | ruff (Python) + ESLint (TS) for linting; ruff format + Prettier for formatting |
