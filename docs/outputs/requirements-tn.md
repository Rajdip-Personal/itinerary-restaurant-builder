# Requirements: RTO Compliance Tracker — Technical & Non-Functional

## Summary
- Total Requirements: 35
- Technical: 17 | Non-Functional: 18
- Must Have: 24 | Should Have: 8 | Nice to Have: 3

---

## Technical Requirements

### TR-001: Data Model — Employee-Week Compliance Record
- **Description:** The system must store a compliance record per employee per week containing: worker name, worker type, work location type, location, on-leave status, week range (Mon–Sun), meets-4-day-requirement flag, total badge swipes, total PTO requested, and computed compliance state.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given an uploaded Excel file, When badge data is processed, Then each row creates or updates an employee-week record with all 12 source columns mapped correctly.
  - Given an employee-week record, When queried, Then all fields including computed compliance state are returned.
- **Source:** PRD Section 10.1 (RTO Compliance Data)

### TR-002: Data Model — Worker/Org Hierarchy
- **Description:** The system must store worker/org data including: worker name, work email, manager name, manager email, is-manager flag, number of direct reports, worker type, work location type, and 8 levels of org hierarchy (Level 01–08).
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the worker/org Excel file (35 columns, 783 rows), When imported, Then all key fields (Worker, Email-Work, Manager, Manager E-mail, Is Manager, Number of Direct Reports, Worker Type, Work Location Type, Level 01–08) are stored and queryable.
  - Given a worker record, When queried by email, Then the full hierarchy chain (Level 01–08) is returned.
- **Source:** PRD Section 10.2 (Worker/Org Data)

### TR-003: Data Model — Application-Generated Data
- **Description:** The system must persist application-generated data separately from uploaded data: exceptions (employee ID, week, explanation, timestamp), PTO additions (employee ID, week, days, timestamp), badge disputes (employee ID, week, flag, timestamp), manager approvals (manager ID, employee ID, week, action type, timestamp), and computed compliance state per employee-week.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given an employee submits an exception, When a new data upload occurs for that same employee+week, Then the exception data is preserved and not overwritten.
  - Given application-generated records exist, When the database is queried, Then each record type has its own storage with timestamps and foreign keys to the employee-week record.
- **Source:** PRD Section 10.3 (Application-Generated Data)

### TR-004: Compliance State Machine
- **Description:** Each employee-week must have a computed compliance state following this state machine: Compliant (Green) — from badge data "Meets 4-Day = Yes"; Non-Compliant (Red) — from badge data "Meets 4-Day = No" and no approved exception; Exception Pending (Yellow) — employee submitted exception, awaiting manager action; Excused (Blue) — manager approved exception or badge dispute.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given badge data says "Meets 4-Day = Yes", When compliance is computed, Then state = Compliant (Green).
  - Given badge data says "Meets 4-Day = No" and no exception submitted, Then state = Non-Compliant (Red).
  - Given an employee submits an exception on a Red week, Then state transitions to Exception Pending (Yellow).
  - Given a manager approves an exception, Then state transitions from Yellow to Excused (Blue).
  - Given a manager rejects an exception, Then state transitions from Yellow back to Red.
  - Given a manager approves a badge dispute, Then state transitions to Excused (Blue) without modifying badge count.
- **Source:** PRD Section 5, Business Rules 3-6

### TR-005: Excel File Parsing — RTO Badge Data
- **Description:** The system must parse Excel files (.xlsx) matching the RTO_Sample.xlsx format (12 columns). Parsing must handle: column name matching, data type coercion (string/integer), date range parsing ("MM/DD/YYYY - MM/DD/YYYY"), and graceful handling of missing or malformed values.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a valid RTO Excel file, When uploaded, Then all 12 columns are parsed with correct types.
  - Given a file with a missing required column, When uploaded, Then the upload is rejected with a clear error message naming the missing column.
  - Given a row with a malformed date range, When parsed, Then the row is skipped and a warning is logged identifying the row number and issue.
- **Source:** PRD Section 5.3, Section 10.1

### TR-006: Excel File Parsing — Worker/Org Data
- **Description:** The system must parse the worker/org Excel file (35 columns, 783 rows) and extract the key fields needed for authentication, hierarchy, and role determination. Contingent Workers (455) and At Home workers (280) must be filtered appropriately.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the worker/org file, When imported, Then 783 rows are processed and key fields extracted.
  - Given a row with Worker Type = "Contingent Worker", When filtered, Then that worker is excluded from RTO compliance tracking.
  - Given a row with Work Location Type = "At Home", When filtered, Then that worker is excluded from RTO compliance tracking.
- **Source:** PRD Section 10.2, Business Rules 1-2, Section 12

### TR-007: Upload Append/Upsert Behavior
- **Description:** Data uploads must follow append/upsert semantics: new employee+week combinations are inserted; existing employee+week combinations are updated with the latest upload data; all employee-generated data (exceptions, PTO additions, disputes, approvals) is preserved across uploads.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given existing data for Employee A, Week 1, When a new upload contains Employee A, Week 1 with different badge count, Then the badge data is updated but any exception/PTO/dispute submitted by the employee is preserved.
  - Given a new upload with Employee B, Week 5 that doesn't exist, When processed, Then a new record is created.
  - Given Employee C appears in badge data but NOT in worker/org data, When processed, Then Employee C is skipped and a warning is logged for admin review.
- **Source:** PRD Section 5.3.1, Business Rule 10

### TR-008: Org Hierarchy Tree
- **Description:** The system must build a parent-child adjacency tree from the Manager column in worker data. The tree must support recursive traversal for manager drill-down (a manager can see their reports, and if a report is also a manager, drill further). Level 01–08 columns must be used for breadcrumb navigation.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the worker/org data, When the hierarchy is built, Then every employee with a Manager value is linked to their manager node.
  - Given a manager at Level 3, When they drill into a sub-manager, Then they see that sub-manager's direct reports and can continue drilling.
  - Given any point in the hierarchy, When breadcrumbs are displayed, Then Level 01 through the current level are shown as clickable navigation links.
- **Source:** PRD Section 5.2.5, Section 10.2

### TR-009: Email-Based Authentication
- **Description:** For the POC, authentication uses email-based lookup against the worker/org data. When a user provides their work email, the system looks up their worker record to determine identity and role (Employee, Manager based on "Is Manager" flag, or Admin via a configured list).
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a valid work email in the worker data, When the user logs in, Then they are authenticated and their role is determined from the worker record.
  - Given an email not found in worker data, When login is attempted, Then access is denied with a clear error message.
  - Given a worker with "Is Manager" = "Yes", When authenticated, Then they receive the Manager role with access to the Manager View.
- **Source:** PRD Section 6 (Security), Section 11 (Deferred Items)

### TR-010: Role-Based Access Control (RBAC)
- **Description:** The API layer must enforce three roles: Employee (view own data, submit exceptions/disputes/PTO), Manager (all Employee permissions + view/manage direct reports, approve/reject exceptions and disputes), Admin/HR (upload data files). Authorization must be checked on every API endpoint before business logic executes.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a user with Employee role, When they attempt to access the Manager dashboard API, Then they receive a 403 Forbidden response.
  - Given a user with Employee role, When they attempt to upload a file via the Admin API, Then they receive a 403 Forbidden response.
  - Given a user with Manager role, When they access the direct reports API, Then only their direct reports (and recursive sub-reports) are returned.
- **Source:** PRD Section 3 (Scope), Section 6 (Security)

### TR-011: Self-Approval Prevention
- **Description:** Managers must not be able to approve their own exceptions or badge disputes. This must be enforced server-side — the API must reject any approval request where the approving manager's ID matches the employee ID on the exception/dispute.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given Manager A submits an exception for their own week, When Manager A attempts to approve it via the API, Then the request is rejected with a 403 error.
  - Given Manager A submits an exception, When Manager A's manager (Manager B) approves it, Then the approval succeeds.
- **Source:** PRD Business Rule 7, Section 6 (Security)

### TR-012: 5-Week Edit Window
- **Description:** Employee actions (submit exception, add PTO, dispute badge count) are limited to the 5 most recent weeks. Weeks older than the 5 most recent must be read-only. This must be enforced server-side.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the current date, When an employee attempts to submit an exception for a week older than the 5th most recent, Then the API returns a 400 error indicating the week is outside the edit window.
  - Given the 5 most recent weeks, When an employee submits an exception on any of them, Then the action succeeds.
- **Source:** PRD Section 5.1.3, Business Rule 9

### TR-013: API Design — RESTful Endpoints
- **Description:** The backend must expose RESTful API endpoints for all operations: employee compliance data retrieval, exception/dispute/PTO submission, manager dashboard and drill-down, approval/rejection actions, file upload, and health checks. All endpoints must return structured JSON responses.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the API specification, When each endpoint is called with valid parameters, Then it returns a JSON response with appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500).
  - Given any API error, When the error response is returned, Then it includes an error code, human-readable message, and correlation ID.
- **Source:** PRD Section 5 (all screens imply API endpoints), Section 6 (Observability)

### TR-014: Pie Chart Data Computation
- **Description:** The system must compute pie chart data as a 3-slice breakdown (Compliant / Excused / Non-Compliant) matching the current table view's date range. Pending exceptions count as Non-Compliant until approved.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given an employee with 10 Compliant weeks, 2 Excused weeks, and 1 Non-Compliant week in the 13-week view, When pie chart data is requested, Then the response returns counts {compliant: 10, excused: 2, nonCompliant: 1}.
  - Given an employee with 1 Exception Pending week, When pie chart data is computed, Then that week is counted as Non-Compliant.
  - Given the table view is expanded to 1 year, When pie chart data is requested, Then it reflects the full year's data.
- **Source:** PRD Section 5.1.2, Business Rule 12

### TR-015: Manager Drill-Down Enforcement
- **Description:** Managers must drill into an employee's weekly detail view before approving or rejecting exceptions/disputes. The API must not allow approval/rejection without a prior detail view access for that employee+week.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Given a manager has not viewed Employee X's weekly detail, When they attempt to approve an exception for Employee X via API, Then the request is rejected or a warning is returned requiring detail review first.
  - Given a manager has viewed Employee X's weekly detail in the current session, When they approve an exception, Then the approval proceeds.
- **Source:** PRD Section 5.2.4, Business Rule 8

### TR-016: Upload Processing Results
- **Description:** After processing a file upload, the system must return a summary to the admin: total rows processed, new weeks added, existing records updated, rows skipped (with reasons), and any warnings (e.g., employees not found in worker data).
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a file with 100 rows (80 new, 15 updates, 5 unknown employees), When processed, Then the response shows: processed=100, new=80, updated=15, skipped=5, warnings=[list of unknown employees].
- **Source:** PRD Workflow 3 (step 6), Section 5.3.1

### TR-017: Local Development Environment
- **Description:** The application must run entirely on a developer's local machine with no external infrastructure dependencies. This includes an embedded or file-based database, a local web server, and local build/test toolchain. Installation must be achievable via standard package managers (npm, pip, etc.).
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a fresh developer machine with the standard toolchain installed, When the developer follows the README setup instructions, Then the application starts locally within 5 minutes.
  - Given the running application, When the developer accesses it via localhost, Then all features work without any external service dependencies.
- **Source:** PRD Section 7 (Infrastructure), techContext.md

---

## Non-Functional Requirements

### NFR-001: Authentication Security — Email Lookup
- **Description:** The POC authentication system must securely look up users by work email against the worker/org dataset. Authentication must be required for all non-health-check endpoints. Session tokens must be generated upon successful login and validated on every subsequent request.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given an unauthenticated request to any protected endpoint, When the request is processed, Then a 401 Unauthorized response is returned.
  - Given a valid login, When a session token is issued, Then it expires after a configurable timeout (default: 8 hours).
  - Given an expired session token, When used in a request, Then a 401 Unauthorized response is returned.
- **Category:** Security
- **Source:** PRD Section 6 (Security), Nordstrom Standards Section 1

### NFR-002: Authorization Enforcement at API Layer
- **Description:** All API endpoints must enforce role-based authorization before executing business logic. Roles (Employee, Manager, Admin) must be checked at the middleware layer. Authorization decisions (who accessed what, when) must be logged.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a user with Employee role, When they call a Manager-only endpoint, Then a 403 Forbidden is returned and the attempt is logged.
  - Given any successful authorization check, When the request is processed, Then an audit log entry is created with user ID, role, endpoint, timestamp, and action.
- **Category:** Security
- **Source:** PRD Section 6 (Security), Nordstrom Standards Section 1 (RBAC)

### NFR-003: PII Protection in Logs
- **Description:** All log output must mask PII data including: employee names, work emails, badge data, and manager emails. Logs must use internal record IDs (UUIDs or database IDs) instead of PII for traceability. A logging middleware or utility must automatically mask known PII patterns.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given any log line generated by the application, When inspected, Then no employee names, emails, badge swipe counts tied to identifiable individuals, or other PII appear in plaintext.
  - Given a request involving employee "Jane Smith" (jane.smith@nordstrom.com), When logged, Then the log shows a masked or hashed identifier instead.
- **Category:** Security
- **Source:** PRD Section 6 (PII Handling), Nordstrom Standards Section 1 (PII Protection), Section 3 (PII in Logs)

### NFR-004: PII Protection in URLs and Query Parameters
- **Description:** No PII (names, emails, employee IDs) may appear in URLs, query parameters, or browser history. API endpoints must use opaque internal IDs for resource identification.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given any API endpoint URL, When inspected, Then no employee names, emails, or other PII appear in the URL path or query string.
  - Given an employee detail request, When the URL is constructed, Then it uses an internal ID (e.g., `/api/employees/{uuid}/compliance`) not a name or email.
- **Category:** Security
- **Source:** PRD Section 6 (PII Handling)

### NFR-005: Secrets Management (Local)
- **Description:** Secrets (database credentials, session signing keys, admin user list) must never be stored in source code or committed to version control. For the POC, secrets must be managed via environment variables or a local `.env` file (git-ignored).
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the source repository, When all files are inspected, Then no secrets, passwords, or signing keys appear in any committed file.
  - Given the application, When it starts, Then it reads secrets from environment variables or a `.env` file.
  - Given the `.env` file, When `.gitignore` is checked, Then `.env` is listed and will not be committed.
- **Category:** Security
- **Source:** Nordstrom Standards Section 1 (Secrets Management), adapted for local deployment

### NFR-006: Input Validation — File Uploads
- **Description:** All file uploads must be validated for: file extension (.xlsx only), file content (valid Excel format), required columns present, data types correct per column specification. Malformed files must be rejected with clear error messages. All user text input (exception explanations, rejection notes) must be sanitized to prevent XSS and injection attacks.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a file with extension .csv, When uploaded, Then it is rejected with message "Only .xlsx files are accepted".
  - Given a .xlsx file missing the "Worker" column, When uploaded, Then it is rejected with message "Missing required column: Worker".
  - Given user input containing `<script>alert('xss')</script>`, When submitted as exception text, Then the script tags are sanitized and stored as plain text.
  - Given user input used in a database query, When executed, Then parameterized queries are used (no string concatenation).
- **Category:** Security
- **Source:** PRD Section 6 (Input Validation), Nordstrom Standards Section 1 (Input Validation)

### NFR-007: Structured JSON Logging
- **Description:** All application logs must be structured JSON format with standard fields: timestamp, level (DEBUG/INFO/WARN/ERROR), message, service name, correlation ID, and environment. Free-text log lines are not permitted.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given any log output, When parsed as JSON, Then it contains at minimum: timestamp, level, message, service, and correlationId fields.
  - Given a request entering the system, When processed through any code path, Then all log lines for that request share the same correlationId.
- **Category:** Observability
- **Source:** PRD Section 6 (Observability), Nordstrom Standards Section 3 (Structured JSON Logging)

### NFR-008: Correlation IDs
- **Description:** Every incoming HTTP request must receive or propagate a correlation ID. The correlation ID must appear in every log line, API response header, and error response body for that request. Use the `X-Correlation-ID` header.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a request without `X-Correlation-ID` header, When received, Then the system generates a UUID and attaches it.
  - Given a request with `X-Correlation-ID` header, When received, Then the system propagates the provided ID.
  - Given any API response, When headers are inspected, Then `X-Correlation-ID` is present.
- **Category:** Observability
- **Source:** Nordstrom Standards Section 3 (Correlation IDs)

### NFR-009: Health Check Endpoint
- **Description:** The application must expose a `GET /health` endpoint that returns 200 OK with `{"status": "healthy"}` if the process is running, and a `GET /ready` endpoint that returns 200 OK with `{"status": "ready"}` if the database is connected and the application can serve requests (503 if not).
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the application is running, When `GET /health` is called, Then it returns 200 with `{"status": "healthy"}`.
  - Given the database is connected, When `GET /ready` is called, Then it returns 200 with `{"status": "ready"}`.
  - Given the database is disconnected, When `GET /ready` is called, Then it returns 503 with `{"status": "not ready"}`.
- **Category:** Observability
- **Source:** Nordstrom Standards Section 4 (Health Endpoints)

### NFR-010: Error Handling — Structured Error Responses
- **Description:** All API errors must return structured JSON responses with: HTTP status code, error code (application-specific), human-readable message, and correlation ID. Error responses must not expose internal implementation details (stack traces, database errors) to the client.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given any API error, When the response is inspected, Then it contains `{"error": {"code": "...", "message": "...", "correlationId": "..."}}`.
  - Given an internal server error, When the response is sent, Then no stack trace, SQL query, or file path appears in the response body.
  - Given a 500 error, When logged server-side, Then the full error details (including stack trace) are logged at ERROR level with the correlation ID.
- **Category:** Observability
- **Source:** PRD Section 6 (Observability), Nordstrom Standards Section 3

### NFR-011: Employee View Page Load Performance
- **Description:** The Employee View (13-week compliance table + pie chart) must load within 2 seconds for a single employee's data.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a logged-in employee, When they navigate to the Employee View with 13 weeks of data, Then the page (including table and pie chart) renders in < 2 seconds.
  - Given the employee expands to 1 year of data (52 weeks), When the view refreshes, Then the page renders in < 3 seconds.
- **Category:** Performance
- **Source:** PRD Section 6 (Performance)

### NFR-012: Manager Dashboard Load Performance
- **Description:** The Manager Dashboard (direct reports summary table) must load within 3 seconds for a manager's full set of direct reports.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a manager with 15 direct reports, When they navigate to the Manager Dashboard, Then the summary table renders in < 3 seconds.
  - Given a manager drills into a sub-manager's team, When the view loads, Then it renders in < 3 seconds.
- **Category:** Performance
- **Source:** PRD Section 6 (Performance)

### NFR-013: File Upload Processing Performance
- **Description:** File upload processing (parse, validate, upsert) must complete within 30 seconds for a full dataset of approximately 328 employees x 13 weeks (~4,264 rows).
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given a file with ~4,264 rows (328 employees x 13 weeks), When uploaded and processed, Then processing completes in < 30 seconds.
  - Given a file being processed, When the admin is waiting, Then a progress indication is shown (or the upload completes fast enough that no spinner is needed).
- **Category:** Performance
- **Source:** PRD Section 6 (Performance)

### NFR-014: Concurrent User Support
- **Description:** The application must support up to 50 concurrent users without degradation of the performance targets defined in NFR-011 through NFR-013.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Given 50 concurrent users accessing the application, When performance is measured, Then Employee View loads in < 2 seconds and Manager Dashboard loads in < 3 seconds.
- **Category:** Performance
- **Source:** PRD Section 6 (Performance)

### NFR-015: Test Coverage
- **Description:** The codebase must achieve a minimum of 80% unit test coverage. Unit tests must cover happy paths, error cases, edge cases, and boundary conditions. Integration tests must cover all API endpoints and database operations.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given the test suite, When coverage is measured, Then unit test coverage is >= 80%.
  - Given each API endpoint, When integration tests run, Then every endpoint has at least one happy path and one error case test.
  - Given the compliance state machine, When unit tests run, Then all state transitions (Compliant, Non-Compliant, Exception Pending, Excused, rejection) are tested.
  - Given Excel parsing logic, When unit tests run, Then valid files, malformed files, missing columns, and edge cases are tested.
- **Category:** Code Quality
- **Source:** Nordstrom Standards Section 5 (Test Coverage)

### NFR-016: Code Quality Standards
- **Description:** The codebase must enforce linting and formatting standards via automated tooling. No committed code may have linting errors. Variable and function names must be meaningful and self-documenting.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Given the project, When a linter is run, Then zero errors are reported.
  - Given the project, When a formatter is run, Then zero files need reformatting.
- **Category:** Code Quality
- **Source:** Nordstrom Standards Section 5 (Code Standards)

### NFR-017: Data Integrity — Upload Preservation
- **Description:** Employee-submitted data (exceptions, PTO additions, disputes, manager approvals) must never be lost or overwritten by data uploads. The system must maintain referential integrity between uploaded badge data and application-generated data.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Given Employee A has submitted an exception for Week 3, When a new data upload includes Employee A, Week 3, Then the exception record, explanation text, and approval status are fully preserved.
  - Given a sequence of 5 data uploads, When the database is queried, Then all employee-generated data from every prior period is intact.
- **Category:** Data Integrity
- **Source:** PRD Section 5.3.1, Business Rule 10

### NFR-018: Accessibility — Basic Web Accessibility
- **Description:** The web application should follow basic accessibility standards: proper semantic HTML, color-coded statuses supplemented with text labels (not color alone), keyboard navigability for primary workflows, and adequate color contrast.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Given the compliance status display, When viewed, Then each color-coded status also has a text label (e.g., "Compliant", "Non-Compliant", "Pending", "Excused").
  - Given the Employee View, When navigated by keyboard only, Then all primary actions (view weeks, submit exception, add PTO, dispute) are reachable.
  - Given any text on the UI, When tested for contrast, Then it meets WCAG 2.1 AA minimum contrast ratio (4.5:1 for normal text).
- **Category:** Accessibility
- **Source:** Nordstrom Standards (implicit best practice), PRD Section 5.1 (color-coded states)

---

## Traceability Matrix

| Req ID | Title | Priority | Category | PRD Section |
|--------|-------|----------|----------|-------------|
| TR-001 | Employee-Week Compliance Record | Must Have | Technical | 10.1 |
| TR-002 | Worker/Org Hierarchy Data Model | Must Have | Technical | 10.2 |
| TR-003 | Application-Generated Data | Must Have | Technical | 10.3 |
| TR-004 | Compliance State Machine | Must Have | Technical | 5, Business Rules |
| TR-005 | Excel Parsing — RTO Badge Data | Must Have | Technical | 5.3, 10.1 |
| TR-006 | Excel Parsing — Worker/Org Data | Must Have | Technical | 10.2, Business Rules |
| TR-007 | Upload Append/Upsert Behavior | Must Have | Technical | 5.3.1, Rule 10 |
| TR-008 | Org Hierarchy Tree | Must Have | Technical | 5.2.5, 10.2 |
| TR-009 | Email-Based Authentication | Must Have | Technical | 6, 11 |
| TR-010 | Role-Based Access Control | Must Have | Technical | 3, 6 |
| TR-011 | Self-Approval Prevention | Must Have | Technical | Rule 7, 6 |
| TR-012 | 5-Week Edit Window | Must Have | Technical | 5.1.3, Rule 9 |
| TR-013 | RESTful API Design | Must Have | Technical | 5 (all), 6 |
| TR-014 | Pie Chart Data Computation | Must Have | Technical | 5.1.2, Rule 12 |
| TR-015 | Manager Drill-Down Enforcement | Should Have | Technical | 5.2.4, Rule 8 |
| TR-016 | Upload Processing Results | Must Have | Technical | Workflow 3, 5.3.1 |
| TR-017 | Local Development Environment | Must Have | Technical | 7, techContext |
| NFR-001 | Authentication Security | Must Have | Security | 6 |
| NFR-002 | Authorization Enforcement | Must Have | Security | 6 |
| NFR-003 | PII Protection in Logs | Must Have | Security | 6 |
| NFR-004 | PII Protection in URLs | Must Have | Security | 6 |
| NFR-005 | Secrets Management (Local) | Must Have | Security | Standards §1 |
| NFR-006 | Input Validation | Must Have | Security | 6 |
| NFR-007 | Structured JSON Logging | Must Have | Observability | 6, Standards §3 |
| NFR-008 | Correlation IDs | Must Have | Observability | Standards §3 |
| NFR-009 | Health Check Endpoint | Must Have | Observability | Standards §4 |
| NFR-010 | Structured Error Responses | Must Have | Observability | 6 |
| NFR-011 | Employee View Performance | Must Have | Performance | 6 |
| NFR-012 | Manager Dashboard Performance | Must Have | Performance | 6 |
| NFR-013 | Upload Processing Performance | Must Have | Performance | 6 |
| NFR-014 | Concurrent User Support | Should Have | Performance | 6 |
| NFR-015 | Test Coverage | Must Have | Code Quality | Standards §5 |
| NFR-016 | Code Quality Standards | Should Have | Code Quality | Standards §5 |
| NFR-017 | Data Integrity — Upload Preservation | Must Have | Data Integrity | 5.3.1, Rule 10 |
| NFR-018 | Basic Web Accessibility | Should Have | Accessibility | Best practice |
