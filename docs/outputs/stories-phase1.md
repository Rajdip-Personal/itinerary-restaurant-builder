# User Stories — Phase 1: Employee View + Data Upload (Sprint 2)

## Summary

- **Phase:** 1 — Employee View + Data Upload
- **Sprint:** 2
- **Total Stories:** 14
- **Effort Breakdown:** S=4, M=6, L=4
- **Milestone:** M1 — Employees can log in, view their weekly compliance table and pie chart. Admins can upload Excel files. End-to-end data flow from upload to display.

## Story Index

| ID | Title | WP | Effort | Dependencies |
|----|-------|----|--------|--------------|
| S-1.1.1 | RTO badge data Excel parser | WP-1.1 | M | — |
| S-1.1.2 | Worker/org data Excel parser with CW/At Home filtering | WP-1.1 | M | — |
| S-1.2.1 | Admin upload API endpoint with upsert logic | WP-1.2 | L | S-1.1.1 |
| S-1.2.2 | Upload processing results and error reporting | WP-1.2 | M | S-1.2.1 |
| S-1.3.1 | Employee compliance data API (13-week + 1-year) | WP-1.3 | M | — |
| S-1.3.2 | Employee pie chart data API | WP-1.3 | S | S-1.3.1 |
| S-1.4.1 | Employee/manager email login page | WP-1.4 | S | — |
| S-1.4.2 | Admin credential login page | WP-1.4 | S | — |
| S-1.5.1 | Frontend routing, auth context, and route guards | WP-1.5 | M | S-1.4.1, S-1.4.2 |
| S-1.6.1 | Weekly compliance table component | WP-1.6 | L | S-1.3.1, S-1.5.1 |
| S-1.6.2 | Compliance pie chart component | WP-1.6 | M | S-1.3.2, S-1.6.1 |
| S-1.6.3 | Status badge component with 5-state color coding and accessibility | WP-1.6 | S | — |
| S-1.7.1 | Admin file upload UI with drag-and-drop | WP-1.7 | L | S-1.2.1, S-1.5.1 |
| S-1.7.2 | Upload results summary display | WP-1.7 | M | S-1.7.1, S-1.2.2 |

## Requirements Coverage

| Requirement | Stories | Status |
|------------|---------|--------|
| TR-005 (RTO Excel parsing) | S-1.1.1 | Covered |
| TR-006 (Worker/Org parsing) | S-1.1.2 | Covered |
| TR-007 (Append/upsert) | S-1.2.1 | Covered |
| TR-014 (Pie chart computation) | S-1.3.2 | Covered |
| TR-016 (Upload processing results) | S-1.2.2 | Covered |
| NFR-006 (Input validation — uploads) | S-1.1.1, S-1.1.2, S-1.2.1 | Covered |
| NFR-011 (Employee view <2s) | S-1.3.1, S-1.6.1 | Covered |
| NFR-013 (Upload <30s) | S-1.2.1 | Covered |
| NFR-017 (Data integrity) | S-1.2.1 | Covered |
| NFR-018 (Accessibility) | S-1.6.3, S-1.6.1 | Covered |
| FR-001 (Compliance table) | S-1.6.1 | Covered |
| FR-002 (13-week default) | S-1.3.1, S-1.6.1 | Covered |
| FR-003 (1-year expand) | S-1.3.1, S-1.6.1 | Covered |
| FR-004 (Color-coded status) | S-1.6.1, S-1.6.3 | Covered |
| FR-005 (Pie chart) | S-1.3.2, S-1.6.2 | Covered |
| FR-006 (Chart syncs with table) | S-1.6.2 | Covered |
| FR-025 (Excel upload) | S-1.2.1, S-1.7.1 | Covered |
| FR-026 (Append behavior) | S-1.2.1 | Covered |
| FR-027 (Preserve employee edits) | S-1.2.1 | Covered |
| FR-028 (Skip unmatched) | S-1.2.1, S-1.2.2 | Covered |
| FR-029 (Upload results summary) | S-1.2.2, S-1.7.2 | Covered |
| FR-030 (Email-based auth) | S-1.4.1 | Covered |
| FR-031 (Role determination) | S-1.5.1 | Covered |
| FR-032 (Parse RTO Excel) | S-1.1.1 | Covered |
| BR-006 (Data completeness) | S-1.2.1 | Covered |
| BR-007 (Exclude CW) | S-1.1.2 | Covered |
| BR-008 (Exclude At Home) | S-1.1.2 | Covered |
| BR-009 (4-day threshold) | S-1.3.1 | Covered |
| NFR-004 (No PII in URLs) | S-1.5.1 | Covered |

---

## [EPIC-1] Epic: Excel Parsing Engine

### S-1.1.1: RTO Badge Data Excel Parser

**Story:**
As an admin,
I want the system to parse uploaded RTO badge data Excel files and validate their format,
So that only correctly formatted compliance data enters the system.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 2
**Requirements:** TR-005, FR-032, NFR-006

**Acceptance Criteria:**

```gherkin
Given a valid .xlsx file matching the RTO_Sample.xlsx format (12 columns: Worker, Worker Type, Work Location Type, Location, On Leave, Week Range, Meets 4-Day Requirement, Total Badge Swipes, Total PTO Requested, ET Org, ELG Org, Supervisory Organization),
When the parser processes it,
Then all 12 columns are extracted with correct types (strings for names, integers for badge swipes and PTO, date ranges parsed from "MM/DD/YYYY - MM/DD/YYYY" into week_start and week_end ISO dates).

Given a file with extension .csv or .xls (not .xlsx),
When the parser receives it,
Then it rejects the file with error message "Only .xlsx files are accepted" before any parsing begins.

Given a .xlsx file missing the "Worker" column,
When the parser validates headers,
Then it rejects the file with error "Missing required column: Worker" listing the specific missing column name(s).

Given a .xlsx file with a row where the Week Range value is "INVALID",
When the parser processes that row,
Then the row is skipped with a warning logged: "Row {N}: malformed date range 'INVALID'" and processing continues for remaining rows.

Given a .xlsx file with a row where Total Badge Swipes is a non-integer string "abc",
When the parser processes that row,
Then the row is skipped with a warning identifying the row number and column.

Given user-submitted text fields within parsed data,
When sanitization runs,
Then any HTML tags (e.g., <script>) are stripped and stored as plain text.
```

**Technical Notes:**
- **Service:** `backend/app/services/excel_parser.py` — `RtoBadgeParser` class
- **Library:** `openpyxl` in read-only mode for memory efficiency (AD-007)
- **Data Model:** Returns list of `RtoBadgeRow` Pydantic models matching `compliance_weeks` table schema (design-inventory Section 2.2.2)
- **Date Parsing:** Split "MM/DD/YYYY - MM/DD/YYYY" on " - ", parse each half, store as ISO date strings (week_start, week_end)
- **Validation:** Column header matching is case-insensitive; return structured result with `rows: list[RtoBadgeRow]`, `errors: list[str]`, `warnings: list[str]`
- **Testing:** Test with valid file, missing columns, malformed dates, non-numeric badge counts, empty file, file with only headers

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] Valid files parse correctly with all 12 columns mapped
- [ ] Invalid files produce specific, actionable error messages
- [ ] Malformed rows skipped with warnings (not fatal)
- [ ] Code review approved

---

### S-1.1.2: Worker/Org Data Excel Parser with CW/At Home Filtering

**Story:**
As an admin,
I want the system to parse worker/org Excel files and automatically exclude Contingent Workers and At Home employees,
So that only eligible employees are tracked for RTO compliance.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 2
**Requirements:** TR-006, BR-007, BR-008, NFR-006

**Acceptance Criteria:**

```gherkin
Given the worker/org Excel file (35 columns, 783 rows),
When the parser processes it,
Then key fields are extracted: Worker, Email-Work, Manager, Manager E-mail Address, Is Manager, Number of Direct Reports, Worker Type, Work Location Type, Level 01 through Level 08.

Given a row with Worker Type = "Contingent Worker",
When the parser filters the row,
Then that worker is excluded from the result set and counted in the "excluded_cw" metric.

Given a row with Work Location Type = "At Home",
When the parser filters the row,
Then that worker is excluded from the result set and counted in the "excluded_at_home" metric.

Given the full 783-row dataset with 455 CWs and 280 At Home workers,
When fully processed,
Then the result contains only employees with Worker Type = "Employee" and Work Location Type != "At Home" (approximately 328 eligible employees).

Given a row with Is Manager = "Yes",
When parsed,
Then the `is_manager` field is set to True in the resulting worker record.

Given the parser completes,
When results are returned,
Then a summary includes: total_parsed, eligible_employees, excluded_cw, excluded_at_home.
```

**Technical Notes:**
- **Service:** `backend/app/services/excel_parser.py` — `WorkerOrgParser` class
- **Library:** `openpyxl` read-only mode
- **Data Model:** Returns list of `WorkerRecord` Pydantic models matching `workers` table schema (design-inventory Section 2.2.1)
- **Filtering:** Two-pass: first exclude Worker Type = "Contingent Worker", then exclude Work Location Type = "At Home"
- **Hierarchy Fields:** Extract Level 01–08 for breadcrumb navigation (TR-008); store as nullable TEXT columns
- **Key Indexes:** email (UNIQUE for auth lookup), manager_email (for hierarchy building)
- **Testing:** Test with full dataset, verify exact CW/At Home exclusion counts, test missing email fields, test is_manager flag

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] CW and At Home workers excluded correctly
- [ ] All key fields extracted including Level 01-08
- [ ] Summary statistics returned accurately
- [ ] Code review approved

---

## [EPIC-2] Epic: Admin Data Upload

### S-1.2.1: Admin Upload API Endpoint with Upsert Logic

**Story:**
As an admin,
I want to upload RTO badge data Excel files through a protected API endpoint that inserts new records and updates existing ones without destroying employee-submitted data,
So that compliance data stays current while preserving all employee actions.

**Priority:** P0
**Effort:** L (2-3 days)
**Sprint:** 2
**Requirements:** TR-007, FR-025, FR-026, FR-027, FR-028, NFR-006, NFR-013, NFR-017, BR-006

**Acceptance Criteria:**

```gherkin
Given an authenticated admin user,
When they POST to /api/admin/upload with a multipart .xlsx file,
Then the file is accepted and processing begins.

Given a user with role "employee" or "manager",
When they POST to /api/admin/upload,
Then the API returns 403 Forbidden with structured error response.

Given a new upload contains Employee A, Week 5 which does not exist in the database,
When the upload is processed,
Then a new compliance_weeks record is created for Employee A, Week 5 with all badge data fields populated.

Given existing data for Employee B, Week 3 with badge_swipes=3,
When a new upload contains Employee B, Week 3 with badge_swipes=5,
Then the badge data is updated to badge_swipes=5 while the record's id and any linked exceptions/disputes/PTO are preserved intact.

Given Employee B has a pending exception for Week 3,
When a new upload updates Employee B's Week 3 badge data,
Then the exception record (including explanation text, status, and timestamps) is fully preserved and the week's compliance state still reflects the pending exception.

Given the upload contains Employee C who does NOT exist in the workers table,
When the upload processes that row,
Then Employee C is skipped (not inserted) and a warning is added: "Employee not found in worker data: [masked ID]".

Given a file with approximately 4,264 rows (328 employees x 13 weeks),
When the upload processes,
Then processing completes in less than 30 seconds.

Given the upload processes rows,
When the operation executes,
Then all inserts/updates happen within a single database transaction (atomic — all succeed or all fail).
```

**Technical Notes:**
- **API Endpoint:** `POST /api/admin/upload` — multipart file upload, Admin role required (RBAC middleware)
- **Service:** `backend/app/services/upload_service.py` — `UploadService.process_badge_upload()`
- **Upsert Logic:** Use SQLAlchemy's `INSERT ... ON CONFLICT (worker_id, week_start) DO UPDATE` on the `compliance_weeks` table's `uq_worker_week` unique constraint
- **Data Integrity:** All employee-generated data (exceptions, disputes, pto_additions, manager_actions) references compliance_weeks.id via FK — upsert updates the badge columns but preserves the row ID, so all FKs remain valid (design-inventory Section 2.2.2)
- **Cross-Reference:** For each parsed row, look up worker by name/email in workers table; skip if not found
- **Transaction:** Wrap entire upsert batch in a single SQLAlchemy `async with session.begin()` block
- **Performance:** Batch upsert with `executemany` for bulk operations (NFR-013)
- **Testing:** Test insert new, update existing, preserve exceptions across upload, skip unmatched, transaction rollback on error, performance with 4K+ rows

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing (auth, upsert, preservation, errors)
- [ ] Upload completes in <30s for full dataset
- [ ] Employee-generated data verified preserved after upload
- [ ] Code review approved

---

### S-1.2.2: Upload Processing Results and Error Reporting

**Story:**
As an admin,
I want to see a detailed summary after uploading a file showing how many records were processed, added, updated, and skipped with reasons,
So that I can verify the upload was successful and investigate any issues.

**Priority:** P1
**Effort:** M (1-2 days)
**Sprint:** 2
**Requirements:** TR-016, FR-029, FR-028

**Acceptance Criteria:**

```gherkin
Given a file with 100 rows: 80 new employee+week combinations, 15 updates to existing records, and 5 employees not found in worker data,
When the upload completes,
Then the API response returns: { processed: 100, new: 80, updated: 15, skipped: 5, warnings: ["Employee not found: [id1]", ...] }.

Given a file with 0 valid rows (all rows have malformed data),
When the upload completes,
Then the response returns processed=0 with a list of all row-level warnings.

Given a file that is rejected at the validation stage (wrong format, missing columns),
When the rejection occurs,
Then the response returns HTTP 400 with a structured error listing the specific validation failure(s) — no partial processing occurs.

Given the upload summary includes employee identifiers in warnings,
When the response is constructed,
Then employee names and emails are NOT included — only opaque IDs or masked identifiers are used (NFR-003/NFR-004).
```

**Technical Notes:**
- **Response Schema:** Pydantic model `UploadResult` with fields: `processed: int`, `new_records: int`, `updated_records: int`, `skipped: int`, `warnings: list[str]`, `errors: list[str]`, `duration_ms: int`
- **PII Masking:** Warning messages must use worker UUIDs, not names/emails (NFR-003, NFR-004)
- **Error vs Warning:** Validation failures (missing columns, wrong format) → HTTP 400 error. Row-level issues (malformed date, missing worker) → warnings in 200 response
- **Logging:** Log full upload summary at INFO level with correlation ID; log each warning at WARN level
- **Testing:** Test various combinations of new/update/skip; test PII not leaking in response

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] Upload summary accurately reflects all processing outcomes
- [ ] No PII in API response or log output
- [ ] Code review approved

---

## [EPIC-3] Epic: Employee Compliance API

### S-1.3.1: Employee Compliance Data API (13-Week and 1-Year)

**Story:**
As an employee,
I want to retrieve my weekly compliance data defaulting to the last 13 weeks with an option to expand to 1 year,
So that I can see my RTO compliance status over time.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 2
**Requirements:** FR-001, FR-002, FR-003, FR-004, BR-009, NFR-011, NFR-004

**Acceptance Criteria:**

```gherkin
Given an authenticated employee with 20 weeks of compliance data,
When they GET /api/employees/me/compliance (no query params),
Then the response contains exactly the 13 most recent weeks sorted by week_start descending.

Given an authenticated employee,
When they GET /api/employees/me/compliance?weeks=52,
Then the response contains up to 52 weeks of data.

Given an authenticated employee with only 8 weeks of data,
When they GET /api/employees/me/compliance,
Then the response contains all 8 available weeks.

Given a compliance_weeks record with meets_four_day = true and no pending/approved actions,
When the compliance state is computed,
Then the record shows state = "compliant" (Green).

Given a compliance_weeks record with meets_four_day = false and no pending actions,
When the compliance state is computed,
Then the record shows state = "non_compliant" (Red).

Given an employee with ID "abc-123",
When another employee authenticated as "xyz-789" tries GET /api/employees/abc-123/compliance,
Then the API returns 403 Forbidden (employees can only see their own data).

Given the employee has 13 weeks of data,
When the API responds,
Then the response time is under 2 seconds.
```

**Technical Notes:**
- **API Endpoint:** `GET /api/employees/me/compliance` — Employee/Manager role required
- **Query Params:** `weeks` (optional, default=13, max=52)
- **Service:** `backend/app/services/compliance_service.py` — `ComplianceService.get_employee_compliance(worker_id, weeks)`
- **State Computation:** At this phase, only Compliant (Green) and Non-Compliant (Red) states are possible (no action submission yet). State derived from `meets_four_day` boolean on `compliance_weeks` table. Full 5-state computation will be added in Phase 3.
- **Response Schema:** List of `ComplianceWeekResponse` Pydantic models with: week_start, week_end, badge_swipes, system_pto_days, meets_four_day, compliance_state, on_leave
- **Security:** `me` endpoint uses JWT sub claim to identify the worker — no worker ID in URL (NFR-004)
- **Performance:** Query uses `idx_cw_worker_week` covering index on `(worker_id, week_start DESC)` with LIMIT
- **Testing:** Test 13-week default, 52-week expansion, fewer-than-13 weeks, state computation, access control

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Response time <2s for 13 weeks, <3s for 52 weeks
- [ ] Employees cannot access other employees' data
- [ ] Code review approved

---

### S-1.3.2: Employee Pie Chart Data API

**Story:**
As an employee,
I want to see a pie chart summarizing my compliance status distribution across the same date range as my table,
So that I can quickly understand my overall compliance standing.

**Priority:** P0
**Effort:** S (0.5 day)
**Sprint:** 2
**Requirements:** FR-005, FR-006, TR-014

**Acceptance Criteria:**

```gherkin
Given an employee with 10 Compliant weeks, 2 Non-Compliant weeks, and 1 Excused week in the 13-week view,
When they GET /api/employees/me/compliance/chart,
Then the response returns { compliant: 10, excused: 1, pending: 0, non_compliant: 2, total: 13 }.

Given the employee requests chart data with ?weeks=52,
When the API computes the chart,
Then it aggregates data from the same 52-week range as the table endpoint.

Given an employee with 13 weeks all showing Compliant,
When the pie chart data is returned,
Then { compliant: 13, excused: 0, pending: 0, non_compliant: 0, total: 13 }.

Given the chart endpoint is called,
When the response is constructed,
Then the total of all categories equals the total number of weeks returned.
```

**Technical Notes:**
- **API Endpoint:** `GET /api/employees/me/compliance/chart` — Employee/Manager role required
- **Query Params:** `weeks` (optional, default=13, max=52) — must match table endpoint range
- **Service:** `ComplianceService.get_pie_chart_data(worker_id, weeks)` — aggregates compliance states into 4 buckets
- **Pie Chart Grouping (TR-014):** Compliant (Green), Excused (Blue), Pending (Yellow + Orange grouped), Non-Compliant (Red). At Phase 1, only Compliant and Non-Compliant are possible.
- **Response Schema:** `PieChartResponse` with: compliant, excused, pending, non_compliant, total
- **Testing:** Test various state distributions, verify totals, test weeks parameter sync

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] Chart data matches table data range exactly
- [ ] All category counts sum to total weeks
- [ ] Code review approved

---

## [EPIC-4] Epic: Authentication UI

### S-1.4.1: Employee/Manager Email Login Page

**Story:**
As an employee or manager,
I want to log in by entering my work email address,
So that I can access my compliance data without needing a password.

**Priority:** P0
**Effort:** S (0.5-1 day)
**Sprint:** 2
**Requirements:** FR-030, NFR-001

**Acceptance Criteria:**

```gherkin
Given the login page is loaded,
When the employee enters a valid work email (e.g., "j.doe@nordstrom.com") and clicks "Sign In",
Then the app calls POST /api/auth/login with { email: "j.doe@nordstrom.com" } and receives a JWT token.

Given the email exists in the workers table with is_manager = false,
When login succeeds,
Then the JWT contains role="employee" and the user is redirected to /employee.

Given the email exists in the workers table with is_manager = true,
When login succeeds,
Then the JWT contains role="manager" and the user is redirected to /manager.

Given the email does not exist in the workers table,
When login is attempted,
Then the UI displays "Email not found. Please check your work email address." without revealing whether the email exists in other systems.

Given the email belongs to a Contingent Worker or At Home employee,
When login is attempted,
Then the UI displays "You are not required to track RTO compliance" (these workers are filtered at import so won't be found).

Given the JWT token is received,
When stored by the app,
Then it is kept in memory (React state/context) only — NOT in localStorage or sessionStorage.
```

**Technical Notes:**
- **Component:** `frontend/src/pages/LoginPage.tsx` → `EmployeeLoginForm` sub-component
- **API Call:** `POST /api/auth/login` with `{ email: string }` — see AD-005 (JWT dual auth)
- **Token Storage:** In-memory via AuthProvider React context (never persisted to storage)
- **UI:** Single email input field + "Sign In" button. Toggle or tab to switch to Admin login (S-1.4.2).
- **Error Display:** Generic error messages that don't leak PII or user existence info
- **Testing:** Test successful login (employee + manager roles), invalid email, CW/At Home rejection, error display

**Definition of Done:**
- [ ] Code complete with unit tests
- [ ] Both employee and manager login paths work
- [ ] Error messages are user-friendly and secure
- [ ] JWT stored in memory only
- [ ] Code review approved

---

### S-1.4.2: Admin Credential Login Page

**Story:**
As an admin,
I want to log in with dedicated admin credentials (username and password),
So that I can access the upload functionality without needing a worker data record.

**Priority:** P0
**Effort:** S (0.5-1 day)
**Sprint:** 2
**Requirements:** FR-030, NFR-001, NFR-005

**Acceptance Criteria:**

```gherkin
Given the login page is loaded and the admin login tab/toggle is selected,
When the admin enters correct username and password (matching ADMIN_USERNAME/ADMIN_PASSWORD from .env),
Then the app calls POST /api/auth/admin with { username, password } and receives a JWT with role="admin".

Given a successful admin login,
When the JWT is received,
Then the user is redirected to /admin.

Given incorrect admin credentials,
When login is attempted,
Then the UI displays "Invalid admin credentials" without specifying whether the username or password was wrong.

Given the admin login form,
When rendered,
Then the password field masks input (type="password").
```

**Technical Notes:**
- **Component:** `frontend/src/pages/LoginPage.tsx` → `AdminLoginForm` sub-component
- **API Call:** `POST /api/auth/admin` with `{ username: string, password: string }` — see AD-008 (dedicated admin login)
- **Backend Verification:** Credentials checked against `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables (NFR-005 — secrets in .env only)
- **JWT Payload:** `{ sub: "admin", role: "admin", auth_type: "admin" }` (design-architecture Section 5, AD-005)
- **UI:** Username + password fields, separate tab/section from employee login
- **Testing:** Test successful admin login, wrong username, wrong password, missing fields

**Definition of Done:**
- [ ] Code complete with unit tests
- [ ] Admin login works with .env credentials
- [ ] Error messages don't leak which field was wrong
- [ ] Code review approved

---

## [EPIC-5] Epic: Frontend Routing & Auth

### S-1.5.1: Frontend Routing, Auth Context, and Route Guards

**Story:**
As a user of the application,
I want to be automatically routed to the correct view based on my role and be prevented from accessing views I'm not authorized for,
So that each user type has a secure, tailored experience.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 2
**Requirements:** FR-031, NFR-004

**Acceptance Criteria:**

```gherkin
Given an unauthenticated user navigates to /employee, /manager, or /admin,
When the route guard evaluates,
Then the user is redirected to /login.

Given an authenticated user with role="employee" navigates to /manager,
When the route guard evaluates,
Then the user is redirected to /employee (their correct view).

Given an authenticated user with role="admin" navigates to /employee,
When the route guard evaluates,
Then the user is redirected to /admin.

Given an authenticated user clicks "Logout" in the navigation header,
When logout is processed,
Then the JWT is cleared from memory, AuthProvider state resets, and the user is redirected to /login.

Given any page URL in the application,
When inspected,
Then no employee names, emails, or other PII appear in the URL path or query string — only opaque IDs are used.

Given a user is authenticated,
When the navigation header renders,
Then it shows the user's display name (for employees/managers) or "Admin" (for admin) and a "Logout" button.
```

**Technical Notes:**
- **Components:** `frontend/src/providers/AuthProvider.tsx`, `frontend/src/router/AppRouter.tsx`, `frontend/src/router/ProtectedRoute.tsx`
- **Routing:** React Router v6 with routes: `/login`, `/employee`, `/manager`, `/admin`, `/*` → NotFound (design-architecture Section 4, AD-002)
- **AuthProvider:** React context storing `{ user, role, token, isAuthenticated }`. Token stored in state only. Provides `login()`, `logout()`, and `getAuthHeaders()` methods.
- **Route Guards:** `ProtectedRoute` wrapper checks `isAuthenticated` and `role` — redirects unauthenticated to /login, wrong-role to correct view
- **PII in URLs:** No `/employees/{email}` or `/employees/{name}` routes; use `/employees/me` pattern (NFR-004)
- **Testing:** Test all redirect scenarios, logout flow, PII-free URLs, role-based routing

**Definition of Done:**
- [ ] Code complete with unit tests
- [ ] All role-based redirects work correctly
- [ ] Logout clears all auth state
- [ ] No PII in any URL
- [ ] Code review approved

---

## [EPIC-6] Epic: Employee View UI

### S-1.6.1: Weekly Compliance Table Component

**Story:**
As an employee,
I want to see a table of my weekly RTO compliance data with color-coded status rows defaulting to 13 weeks and expandable to 1 year,
So that I can track my compliance history at a glance.

**Priority:** P0
**Effort:** L (2-3 days)
**Sprint:** 2
**Requirements:** FR-001, FR-002, FR-003, FR-004, NFR-011, NFR-018

**Acceptance Criteria:**

```gherkin
Given an employee navigates to /employee after login,
When the compliance table renders,
Then it displays columns: Week Range, Badge Swipes, PTO Days, Meets 4-Day Requirement (Yes/No), and Status (color-coded badge with text label).

Given the employee has 20 weeks of data,
When the table initially loads,
Then exactly the 13 most recent weeks are shown with a "Show More" button visible.

Given the "Show More" button is clicked,
When the table re-renders,
Then it expands to show up to 52 weeks of data and the button changes to "Show Less".

Given a week with compliance state "compliant",
When the status cell renders,
Then it displays a Green badge with text "Compliant".

Given a week with compliance state "non_compliant",
When the status cell renders,
Then it displays a Red badge with text "Non-Compliant".

Given the page loads with 13 weeks of data,
When performance is measured,
Then the full page (table + chart) renders in under 2 seconds.

Given the table is navigated by keyboard only,
When a user tabs through the rows,
Then focus indicators are visible and all interactive elements (Show More button) are reachable.
```

**Technical Notes:**
- **Component:** `frontend/src/components/ComplianceTable.tsx` using `@tanstack/react-table`
- **Page:** `frontend/src/pages/EmployeeView.tsx` — contains ComplianceTable + CompliancePieChart
- **Data Fetching:** Call `GET /api/employees/me/compliance` (S-1.3.1) on mount with weeks=13, re-fetch with weeks=52 on expand
- **Status Rendering:** Uses `StatusBadge` component (S-1.6.3) for 5-state color coding with text labels
- **Table Columns:** Configured via @tanstack/react-table column definitions; week_range displayed as-is, badge_swipes and system_pto_days as numbers, meets_four_day as "Yes"/"No" text
- **Accessibility (NFR-018):** Semantic `<table>` element, proper `<th>` headers, ARIA labels on status badges, visible focus indicators, keyboard navigation
- **Testing:** Test 13-week render, expand/collapse, correct column data, status badge colors, keyboard navigation, responsive layout

**Definition of Done:**
- [ ] Code complete with unit tests (vitest + testing-library)
- [ ] Table displays all required columns with correct data
- [ ] 13-week default and 1-year expansion work
- [ ] Color-coded statuses with text labels (accessibility)
- [ ] Keyboard navigable
- [ ] Page renders in <2s
- [ ] Code review approved

---

### S-1.6.2: Compliance Pie Chart Component

**Story:**
As an employee,
I want to see a pie chart summarizing my compliance status distribution that stays in sync with my table's date range,
So that I can quickly understand my overall compliance standing.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 2
**Requirements:** FR-005, FR-006, TR-014, NFR-018

**Acceptance Criteria:**

```gherkin
Given the employee view loads with 13 weeks of data (10 Compliant, 3 Non-Compliant),
When the pie chart renders,
Then it shows: Green slice = 10 (76.9%), Red slice = 3 (23.1%), with counts and percentages labeled.

Given the table is expanded to 52 weeks,
When the pie chart re-renders,
Then it reflects data from all 52 weeks (not just the original 13).

Given the pie chart renders,
When inspected,
Then it has exactly 4 possible slices: Compliant (Green), Excused (Blue), Pending (Yellow), Non-Compliant (Red) — though some may be 0 and hidden.

Given the pie chart is viewed with a screen reader,
When the chart data is read,
Then accessible text alternatives describe each slice's label, count, and percentage.

Given all 13 weeks are Compliant,
When the pie chart renders,
Then only the Green slice is shown at 100%.
```

**Technical Notes:**
- **Component:** `frontend/src/components/CompliancePieChart.tsx` using `recharts` library (`PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`)
- **Data Source:** Calls `GET /api/employees/me/compliance/chart?weeks={N}` (S-1.3.2) where N matches the table's current weeks parameter
- **Sync Mechanism:** Both table and chart share a `weeks` state variable in EmployeeView parent; changing weeks re-fetches both
- **Color Mapping:** Compliant=#22c55e (Green), Excused=#3b82f6 (Blue), Pending=#eab308 (Yellow), Non-Compliant=#ef4444 (Red) — matches StatusBadge colors
- **Accessibility:** Include `<title>` and `<desc>` SVG elements; provide data table fallback for screen readers
- **Testing:** Test render with various distributions, verify sync with table weeks, test all-one-status edge case

**Definition of Done:**
- [ ] Code complete with unit tests
- [ ] Pie chart renders with correct slices and colors
- [ ] Syncs with table date range on expand/collapse
- [ ] Accessible alternatives provided
- [ ] Code review approved

---

### S-1.6.3: Status Badge Component with 5-State Color Coding and Accessibility

**Story:**
As an employee,
I want compliance statuses displayed with both color coding and text labels,
So that I can understand my status even if I have difficulty distinguishing colors.

**Priority:** P0
**Effort:** S (0.5 day)
**Sprint:** 2
**Requirements:** FR-004, FR-032, NFR-018

**Acceptance Criteria:**

```gherkin
Given a compliance state of "compliant",
When the StatusBadge renders,
Then it displays a Green background with text "Compliant".

Given a compliance state of "non_compliant",
When the StatusBadge renders,
Then it displays a Red background with text "Non-Compliant".

Given a compliance state of "pending" (single action pending),
When the StatusBadge renders,
Then it displays a Yellow background with text "Pending".

Given a compliance state of "multiple_pending" (multiple action types pending),
When the StatusBadge renders,
Then it displays an Orange background with text "Multiple Pending".

Given a compliance state of "excused",
When the StatusBadge renders,
Then it displays a Blue background with text "Excused".

Given any status badge,
When tested for contrast ratio,
Then the text meets WCAG 2.1 AA minimum (4.5:1 contrast ratio for normal text).
```

**Technical Notes:**
- **Component:** `frontend/src/components/StatusBadge.tsx` — shared component used by ComplianceTable, ManagerDashboard (Phase 2)
- **Props:** `state: ComplianceState` (enum: compliant, non_compliant, pending, multiple_pending, excused)
- **Styling:** Tailwind CSS classes per state — `bg-green-100 text-green-800`, `bg-red-100 text-red-800`, `bg-yellow-100 text-yellow-800`, `bg-orange-100 text-orange-800`, `bg-blue-100 text-blue-800`
- **Accessibility:** `role="status"`, `aria-label="Compliance status: {text}"`, high-contrast color pairs verified against WCAG 2.1 AA
- **Design Reference:** Frontend Component Architecture in design-architecture.md — StatusBadge under Shared components
- **Testing:** Render test for each of 5 states, verify ARIA attributes, snapshot tests for visual regression

**Definition of Done:**
- [ ] Code complete with unit tests
- [ ] All 5 states render correctly with color + text
- [ ] WCAG 2.1 AA contrast ratios verified
- [ ] ARIA labels present
- [ ] Code review approved

---

## [EPIC-7] Epic: Admin Upload UI

### S-1.7.1: Admin File Upload UI with Drag-and-Drop

**Story:**
As an admin,
I want to upload Excel files by dragging them onto the page or browsing my file system, with clear validation feedback for unsupported file types,
So that I can quickly and confidently upload compliance data.

**Priority:** P0
**Effort:** L (2-3 days)
**Sprint:** 2
**Requirements:** FR-025, NFR-006

**Acceptance Criteria:**

```gherkin
Given an admin navigates to /admin,
When the page loads,
Then a file upload dropzone is displayed with text "Drop .xlsx file here or click to browse".

Given an admin drags a .xlsx file onto the dropzone,
When the file is dropped,
Then the upload begins and a progress indicator is shown.

Given an admin selects a .csv file via the file browser,
When the file is selected,
Then the UI rejects it immediately with "Only .xlsx files are accepted" before any server call.

Given an upload is in progress,
When the file is being processed,
Then the dropzone is disabled (no second upload) and a spinner or progress bar is visible.

Given a non-admin user somehow navigates to /admin,
When the route guard evaluates,
Then they are redirected to their correct role-based view (handled by S-1.5.1).
```

**Technical Notes:**
- **Component:** `frontend/src/pages/AdminView.tsx` → `UploadPanel` → `FileDropzone`
- **File Upload:** Use HTML5 drag-and-drop API + `<input type="file" accept=".xlsx">` fallback
- **API Call:** `POST /api/admin/upload` with `FormData` containing the file, Authorization header with JWT
- **Progress:** Use `XMLHttpRequest` or `fetch` with upload progress events for the progress indicator. If file is small (<5MB), a simple spinner suffices.
- **Client-Side Validation:** Check file extension before upload; check file size (warn if >10MB though no hard limit)
- **Design Reference:** AdminView > UploadPanel > FileDropzone in frontend component architecture (design-architecture.md)
- **Testing:** Test drag-and-drop, file browser, file type rejection, progress display, auth guard

**Definition of Done:**
- [ ] Code complete with unit tests
- [ ] Drag-and-drop and browse both work
- [ ] Non-.xlsx files rejected client-side
- [ ] Progress indicator shown during upload
- [ ] Non-admin access prevented
- [ ] Code review approved

---

### S-1.7.2: Upload Results Summary Display

**Story:**
As an admin,
I want to see a clear summary after uploading showing how many records were added, updated, and skipped along with any warnings,
So that I can verify the upload was processed correctly.

**Priority:** P1
**Effort:** M (1-2 days)
**Sprint:** 2
**Requirements:** FR-029, TR-016

**Acceptance Criteria:**

```gherkin
Given an upload completes successfully with 80 new, 15 updated, and 5 skipped records,
When the results display renders,
Then it shows: "Processed: 100 | New: 80 | Updated: 15 | Skipped: 5" in a clear summary card.

Given the upload produced warnings (e.g., 5 unmatched employees),
When the results display renders,
Then a collapsible warnings section lists each warning message.

Given the upload failed validation (wrong format),
When the error response is received,
Then the UI shows an error banner with the specific validation failure and a "Try Again" button.

Given a successful upload,
When the admin wants to upload another file,
Then a "Upload Another File" button resets the dropzone to its initial state.
```

**Technical Notes:**
- **Component:** `frontend/src/components/ResultsSummary.tsx` (child of UploadPanel)
- **Data Source:** Reads the `UploadResult` JSON response from S-1.2.2
- **Layout:** Summary card with counts in large text + collapsible warnings list below
- **States:** Initial (dropzone) → Uploading (progress) → Success (summary) → Error (error banner) — state machine in UploadPanel
- **PII Safety:** Warnings from the API already have PII masked (S-1.2.2); the UI renders them as-is
- **Testing:** Test success display, warnings display, error display, reset flow

**Definition of Done:**
- [ ] Code complete with unit tests
- [ ] Summary displays all count fields accurately
- [ ] Warnings are visible and collapsible
- [ ] Error states show actionable messages
- [ ] "Upload Another" resets correctly
- [ ] Code review approved
