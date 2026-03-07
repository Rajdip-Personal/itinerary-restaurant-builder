# Requirements: RTO Compliance Tracker — Business & Functional

## Summary
- **Total Requirements:** 46
- **Business Requirements (BR):** 12
- **Functional Requirements (FR):** 34
- **P0 (Must Have):** 34 | **P1 (Should Have):** 9 | **P2 (Nice to Have):** 3

---

## Traceability Matrix

| Req ID | Title | Priority | Category | PRD Section |
|--------|-------|----------|----------|-------------|
| BR-001 | Replace manual compliance tracking | P0 | Business | 2 - Goals |
| BR-002 | Improve manager visibility into team compliance | P0 | Business | 2 - Goals |
| BR-003 | Single source of truth for RTO data | P0 | Business | 2 - Goals |
| BR-004 | Employee weekly engagement rate | P1 | Business | 2 - Success Metrics |
| BR-005 | Manager exception review time | P1 | Business | 2 - Success Metrics |
| BR-006 | Data completeness on upload | P0 | Business | 2 - Success Metrics |
| BR-007 | Exclude contingent workers from tracking | P0 | Business | 5 - Business Rules #1 |
| BR-008 | Exclude exempt (At Home) employees | P0 | Business | 5 - Business Rules #2 |
| BR-009 | 4-day office compliance threshold | P0 | Business | 5 - Business Rules #3 |
| BR-010 | 4-state compliance model | P0 | Business | 3 - Scope |
| BR-011 | Manager approval required for state changes | P0 | Business | 5 - Business Rules #4, #5 |
| BR-012 | Managers cannot self-approve | P0 | Business | 5 - Business Rules #7 |
| FR-001 | Employee weekly compliance table | P0 | Functional | 5.1.1 |
| FR-002 | Default 13-week view | P0 | Functional | 5.1.1 |
| FR-003 | Expandable to 1 year of history | P1 | Functional | 5.1.1 |
| FR-004 | Color-coded status rows | P0 | Functional | 5.1.1 |
| FR-005 | 3-slice compliance pie chart | P0 | Functional | 5.1.2 |
| FR-006 | Pie chart synced with table date range | P0 | Functional | 5.1.2 |
| FR-007 | Dispute badge count | P0 | Functional | 5.1.3 |
| FR-008 | Add PTO days | P0 | Functional | 5.1.3 |
| FR-009 | Submit exception with explanation | P0 | Functional | 5.1.3 |
| FR-010 | 5-week edit window restriction | P0 | Functional | 5.1.3 |
| FR-011 | Manager sees own employee view | P0 | Functional | 5.2.1 |
| FR-012 | Direct reports summary dashboard | P0 | Functional | 5.2.2 |
| FR-013 | Filter direct reports by status | P1 | Functional | 5.2.2 |
| FR-014 | Drill into direct report detail | P0 | Functional | 5.2.3 |
| FR-015 | View exception explanation text | P0 | Functional | 5.2.3 |
| FR-016 | View badge dispute flag | P0 | Functional | 5.2.3 |
| FR-017 | Approve exception | P0 | Functional | 5.2.4 |
| FR-018 | Reject exception with optional note | P0 | Functional | 5.2.4 |
| FR-019 | Approve badge dispute | P0 | Functional | 5.2.4 |
| FR-020 | Reject badge dispute with optional note | P0 | Functional | 5.2.4 |
| FR-021 | Mandatory drill-down before approval | P0 | Functional | 5.2.4 |
| FR-022 | Recursive org drill-down | P0 | Functional | 5.2.5 |
| FR-023 | Breadcrumb navigation (Level 01-08) | P1 | Functional | 5.2.5 |
| FR-024 | Server-side self-approval prevention | P0 | Functional | 5.2.4 / BR #7 |
| FR-025 | Excel file upload | P0 | Functional | 5.3.1 |
| FR-026 | Append/upsert upload behavior | P0 | Functional | 5.3.1 |
| FR-027 | Preserve employee edits across uploads | P0 | Functional | 5.3.1 |
| FR-028 | Skip unmatched employees with warning | P1 | Functional | 5.3.1 |
| FR-029 | Upload confirmation with results summary | P1 | Functional | 5.3.1 / Workflow 3 |
| FR-030 | Email-based authentication | P0 | Functional | 6 - Security |
| FR-031 | Role determination from worker data | P0 | Functional | 5.2 / Section 10.2 |
| FR-032 | Parse RTO compliance Excel (12 columns) | P0 | Functional | 10.1 |
| FR-033 | Parse worker/org hierarchy data | P0 | Functional | 10.2 |
| FR-034 | Persist application-generated data | P0 | Functional | 10.3 |

---

## Business Requirements

### BR-001: Replace Manual Compliance Tracking
- **Description:** Replace the existing Excel-based RTO compliance tracking process with a self-service web application, eliminating manual data distribution and individual inquiries to HR.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given the application is deployed, when an employee logs in, then they can view their own compliance status without contacting HR
  - Given data has been uploaded, when employees access the system, then they see the same data that was previously distributed via Excel
- **Dependencies:** BR-006 (data must be uploadable), FR-025 (upload capability)
- **Stakeholder:** HR / Product
- **Source:** PRD Section 2 — Goals, Goal 1

### BR-002: Improve Manager Visibility into Team Compliance
- **Description:** Provide managers with a real-time dashboard showing their direct reports' RTO compliance status, including pending exceptions and disputes, enabling proactive management without waiting for HR reports.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager logs in, when they navigate to the manager view, then they see a summary of all direct reports' compliance statuses
  - Given a direct report has a pending exception, when the manager views the dashboard, then the pending exception count is visible without drill-down
- **Dependencies:** FR-012, FR-031 (role determination)
- **Stakeholder:** People Managers
- **Source:** PRD Section 2 — Goals, Goal 2

### BR-003: Single Source of Truth for RTO Data
- **Description:** Centralize all RTO compliance data, exceptions, disputes, and approval actions in one system with a complete audit trail, replacing fragmented Excel files.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given data is uploaded and employees submit exceptions, when any user queries the system, then all data (badge swipes, PTO, exceptions, approvals) is available from a single application
  - Given a manager approves an exception, when anyone views that week's data, then the approval action and timestamp are recorded
- **Dependencies:** FR-025 (upload), FR-034 (persist app data)
- **Stakeholder:** HR / Product
- **Source:** PRD Section 2 — Goals, Goal 3

### BR-004: Employee Weekly Engagement Rate
- **Description:** Achieve 70% weekly engagement rate — measured as the percentage of tracked employees who check their compliance status at least once per week.
- **Priority:** P1 (Should Have)
- **Acceptance Criteria:**
  - Given the system is live, when engagement is measured over a 4-week period, then at least 70% of eligible employees have logged in and viewed their compliance status each week
  - Measurement method: Login/view analytics tracked per user per week
- **Dependencies:** FR-030 (authentication), FR-001 (employee view)
- **Stakeholder:** Product
- **Source:** PRD Section 2 — Success Metrics

### BR-005: Manager Exception Review Time
- **Description:** Reduce average manager exception review time to under 48 hours from submission to approval/rejection.
- **Priority:** P1 (Should Have)
- **Acceptance Criteria:**
  - Given employees submit exceptions, when measured over a 4-week period, then the average time between exception submission and manager action (approve/reject) is less than 48 hours
  - Measurement method: Timestamp difference between exception submission and manager action
- **Dependencies:** FR-009 (submit exception), FR-017/FR-018 (approve/reject)
- **Stakeholder:** Product
- **Source:** PRD Section 2 — Success Metrics

### BR-006: Data Completeness on Upload
- **Description:** Ensure 100% of eligible employees have compliance data available within 24 hours of an admin uploading a new data file.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an admin uploads a complete RTO dataset, when processing completes, then every eligible employee (Employee type, not At Home) present in both the worker data and badge data has compliance records visible in the system
  - Given upload completes, when an admin reviews results, then the system reports how many employees were processed, added, and updated
- **Dependencies:** FR-025 (upload), FR-026 (append/upsert), BR-007 (CW filter), BR-008 (At Home filter)
- **Stakeholder:** HR
- **Source:** PRD Section 2 — Success Metrics

### BR-007: Exclude Contingent Workers from Tracking
- **Description:** Contingent Workers (Worker Type = "Contingent Worker") must be excluded from all RTO compliance tracking, views, and dashboards. They do not appear in any compliance data.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given worker data contains both Employees and Contingent Workers, when data is loaded, then only records with Worker Type = "Employee" are included in compliance tracking
  - Given 783 total workers with 455 CWs, when a full dataset is loaded, then exactly 0 CW records appear in any compliance view
- **Dependencies:** FR-033 (parse worker data)
- **Stakeholder:** HR / Legal
- **Source:** PRD Section 5 — Business Rules #1, Section 12

### BR-008: Exclude Exempt (At Home) Employees
- **Description:** Employees with Work Location Type = "At Home" are exempt from RTO compliance tracking and must not appear in compliance views or dashboards.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given worker data contains employees with Work Location Type "At Home", when data is loaded, then those employees are excluded from all compliance tracking
  - Given 280 At Home workers in the dataset, when the system is loaded, then 0 At Home workers appear in compliance views
- **Dependencies:** FR-033 (parse worker data)
- **Stakeholder:** HR
- **Source:** PRD Section 5 — Business Rules #2, Section 12

### BR-009: 4-Day Office Compliance Threshold
- **Description:** The compliance standard requires employees to badge into the office a minimum of 4 days per week. Compliance is determined by the "Meets 4-Day Requirement" field in the uploaded badge data.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee's weekly record has Meets 4-Day Requirement = "Yes", when displayed, then the week shows as Compliant (Green)
  - Given an employee's weekly record has Meets 4-Day Requirement = "No" and no approved exception, when displayed, then the week shows as Non-Compliant (Red)
- **Dependencies:** FR-032 (parse RTO data)
- **Stakeholder:** HR / Policy
- **Source:** PRD Section 5 — Business Rules #3

### BR-010: 4-State Compliance Model
- **Description:** Every employee-week record must be in exactly one of four states: Compliant (Green), Exception Pending (Yellow), Non-Compliant (Red), or Excused (Blue). State transitions follow defined rules.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given any employee-week record, when viewed in the system, then it displays exactly one of the four states with the correct color coding
  - State transitions: Red → Yellow (employee submits exception), Yellow → Blue (manager approves), Yellow → Red (manager rejects), Red → Blue (badge dispute approved)
  - Given a week is Green (Compliant from badge data), then no state transition is possible (already compliant)
- **Dependencies:** BR-009, FR-009, FR-017, FR-018, FR-019, FR-020
- **Stakeholder:** Product
- **Source:** PRD Section 3 — Scope, Section 5 — Business Rules #4, #5, #6

### BR-011: Manager Approval Required for State Changes
- **Description:** PTO additions and exception submissions do NOT automatically change a week to compliant or excused status. Only explicit manager approval (of either an exception or a badge dispute) can change a week's state from non-compliant to excused.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee submits an exception, when the submission is saved, then the week moves to Yellow (pending) but NOT to Blue (excused)
  - Given an employee adds PTO, when the PTO is saved, then the week's compliance state does NOT change
  - Given a manager approves an exception, when the approval is saved, then and only then does the week move to Blue (excused)
- **Dependencies:** FR-009, FR-017, FR-019
- **Stakeholder:** HR / Policy
- **Source:** PRD Section 5 — Business Rules #4, #5

### BR-012: Managers Cannot Self-Approve
- **Description:** Managers cannot approve or reject their own exceptions or badge disputes. Their requests must be routed to their own manager in the hierarchy for review.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager submits an exception for their own week, when their own manager views the dashboard, then the pending exception appears for the manager's manager to review
  - Given a manager attempts to approve their own exception via API, when the request is processed, then the server rejects it with an authorization error
  - This restriction must be enforced server-side, not just in the UI
- **Dependencies:** FR-024, FR-031 (role/hierarchy determination)
- **Stakeholder:** HR / Compliance
- **Source:** PRD Section 5 — Business Rules #7

---

## Functional Requirements

### Screen 1 — Employee View

#### FR-001: Employee Weekly Compliance Table
- **Description:** Display a table showing the employee's weekly RTO compliance data with columns: Week Range, Badge Swipes, PTO Days, Meets 4-Day Requirement (Yes/No), Status (color-coded), and Exception (if submitted).
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee is logged in, when they view the Employee screen, then a table displays with all six columns populated from uploaded data
  - Given badge data exists for the employee, when displayed, then each row shows the correct Week Range, Total Badge Swipe count, Total PTO Requested, and Meets 4-Day Requirement value
- **Dependencies:** FR-030 (auth), FR-032 (parse RTO data)
- **User Persona:** Employee
- **Source:** PRD Section 5.1.1

#### FR-002: Default 13-Week View
- **Description:** The compliance table defaults to showing the 13 most recent weeks of data.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee has more than 13 weeks of data, when they first load the Employee View, then exactly the 13 most recent weeks are displayed
  - Given an employee has fewer than 13 weeks of data, when they load the view, then all available weeks are displayed
- **Dependencies:** FR-001
- **User Persona:** Employee
- **Source:** PRD Section 5.1.1

#### FR-003: Expandable to 1 Year of History
- **Description:** The employee can expand the compliance table to show up to 1 year (52 weeks) of historical data.
- **Priority:** P1 (Should Have)
- **Acceptance Criteria:**
  - Given an employee is viewing the 13-week default, when they click to expand, then the table shows up to 52 weeks of data
  - Given expanded view is active, when the pie chart renders, then it reflects the expanded date range
- **Dependencies:** FR-001, FR-006
- **User Persona:** Employee
- **Source:** PRD Section 5.1.1

#### FR-004: Color-Coded Status Rows
- **Description:** Each week row in the compliance table is color-coded according to the 4-state compliance model: Green (Compliant), Yellow (Exception Pending), Red (Non-Compliant), Blue (Excused).
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a week with Meets 4-Day Requirement = "Yes" and no overriding state, when displayed, then the row is Green
  - Given a week with a submitted but unreviewed exception, when displayed, then the row is Yellow
  - Given a week with Meets 4-Day Requirement = "No" and no exception, when displayed, then the row is Red
  - Given a week with an approved exception or dispute, when displayed, then the row is Blue
- **Dependencies:** BR-010 (state model), FR-001
- **User Persona:** Employee
- **Source:** PRD Section 5.1.1

#### FR-005: 3-Slice Compliance Pie Chart
- **Description:** Display a pie chart with three slices showing the count and percentage of weeks in each state: Green (Compliant), Blue (Excused), Red (Non-Compliant). Pending exceptions (Yellow) are counted as Non-Compliant (Red) in the pie chart.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee has compliance data, when the pie chart renders, then it shows exactly three slices: Compliant (Green), Excused (Blue), Non-Compliant (Red)
  - Given 3 compliant weeks, 2 excused weeks, and 8 non-compliant weeks (including 1 pending), when the pie chart renders, then Green=3, Blue=2, Red=8
  - Given the table shows 13 weeks, when the pie chart renders, then the total of all slices equals 13
- **Dependencies:** FR-001, BR-010
- **User Persona:** Employee
- **Source:** PRD Section 5.1.2, Business Rule #12

#### FR-006: Pie Chart Synced with Table Date Range
- **Description:** The pie chart date range always matches the compliance table's current view (13-week default or expanded range). There is no separate date picker for the pie chart.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given the table is showing the 13-week default, when the pie chart renders, then it covers exactly those 13 weeks
  - Given the table is expanded to 1 year, when the pie chart re-renders, then it covers the same expanded range
- **Dependencies:** FR-005, FR-002, FR-003
- **User Persona:** Employee
- **Source:** PRD Section 5.1.2, Open Question #5

#### FR-007: Dispute Badge Count
- **Description:** For the 5 most recent weeks, an employee can dispute a badge swipe count they believe is incorrect. This flags the week for manager review. The employee does NOT directly change the badge count.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee views a week within the 5 most recent weeks, when they click "Dispute Badge Count", then the week is flagged as disputed and visible to the manager
  - Given an employee views a week older than the 5 most recent, then the dispute action is not available
  - Given an employee disputes a badge count, when the dispute is saved, then the badge swipe count value is NOT modified
- **Dependencies:** FR-010 (5-week window), FR-034 (persist dispute)
- **User Persona:** Employee
- **Source:** PRD Section 5.1.3

#### FR-008: Add PTO Days
- **Description:** For the 5 most recent weeks, any employee can record PTO days that may not have been captured in the system, regardless of their level in the org hierarchy.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee views a week within the 5 most recent weeks, when they add PTO days, then the PTO addition is recorded with a timestamp
  - Given PTO is added, when the week's compliance state is calculated, then the PTO addition does NOT automatically change the compliance state (per BR-011)
  - Given an employee views a week older than 5 most recent, then the Add PTO action is not available
- **Dependencies:** FR-010 (5-week window), FR-034 (persist PTO), BR-011
- **User Persona:** Employee
- **Source:** PRD Section 5.1.3

#### FR-009: Submit Exception with Explanation
- **Description:** For the 5 most recent weeks, an employee can submit an exception on any non-compliant (Red) week by providing a text explanation (e.g., business travel, illness, personal emergency). Submitting changes the week's status from Red to Yellow (Exception Pending).
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee views a non-compliant (Red) week within the 5 most recent, when they click "Submit Exception", then a text field appears for entering an explanation
  - Given the employee submits the explanation, when saved, then the week's status changes from Red to Yellow
  - Given a week is already Yellow (pending) or Blue (excused) or Green (compliant), then the Submit Exception action is not available
  - Given an employee views a non-compliant week older than 5 most recent, then the Submit Exception action is not available
- **Dependencies:** FR-010, FR-034, BR-010
- **User Persona:** Employee
- **Source:** PRD Section 5.1.3, Workflow 1

#### FR-010: 5-Week Edit Window Restriction
- **Description:** Employee actions (dispute badge count, add PTO, submit exception) are limited to the 5 most recent weeks. Weeks older than the 5 most recent are read-only.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee's compliance table, when rendered, then only the 5 most recent week rows display action buttons
  - Given a week that is the 6th most recent or older, when displayed, then no action buttons (dispute, PTO, exception) are shown
- **Dependencies:** FR-001
- **User Persona:** Employee
- **Source:** PRD Section 5.1.3, Business Rule #9

### Screen 2 — Manager View

#### FR-011: Manager Sees Own Employee View
- **Description:** When a manager logs in, they first see their own Employee View (Screen 1) with all the same capabilities (view table, dispute, add PTO, submit exception). Their own exceptions/disputes route to their manager.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a user with Is Manager = "Yes" logs in, when the Manager View loads, then their own Employee View is displayed first with all standard employee actions available
  - Given a manager submits an exception, when saved, then it routes to the manager's own manager (not to themselves)
- **Dependencies:** FR-001 through FR-010, FR-031, BR-012
- **User Persona:** Manager
- **Source:** PRD Section 5.2.1

#### FR-012: Direct Reports Summary Dashboard
- **Description:** Display a summary table of all direct reports showing: employee name, compliance percentage (compliant weeks / total weeks), color-coded overall status indicator, and count of pending exceptions and badge disputes.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager with 5 direct reports, when they view the dashboard, then all 5 reports appear in the summary table
  - Given a direct report has 10 of 13 compliant weeks, when displayed, then the compliance percentage shows 76.9%
  - Given a direct report has 2 pending exceptions, when displayed, then the pending exceptions count shows 2
- **Dependencies:** FR-031 (role), FR-033 (hierarchy data)
- **User Persona:** Manager
- **Source:** PRD Section 5.2.2

#### FR-013: Filter Direct Reports by Status
- **Description:** The manager can filter the direct reports dashboard by compliance status: compliant, non-compliant, or exception-pending.
- **Priority:** P1 (Should Have)
- **Acceptance Criteria:**
  - Given a manager views the dashboard with 10 direct reports, when they filter by "non-compliant", then only reports with non-compliant status are shown
  - Given a filter is applied, when the manager clears it, then all direct reports are shown again
- **Dependencies:** FR-012
- **User Persona:** Manager
- **Source:** PRD Section 5.2.2

#### FR-014: Drill into Direct Report Detail
- **Description:** Clicking a direct report's name in the dashboard opens that person's weekly compliance detail view (same layout as Employee View). This is a read-only view for the manager — the manager cannot edit the report's data, only view it and take approval actions.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager clicks a direct report, when the detail view loads, then it shows the same weekly compliance table layout as the Employee View
  - Given the manager is viewing a report's detail, then no edit actions (dispute, add PTO, submit exception) are available to the manager on that view
- **Dependencies:** FR-012, FR-001
- **User Persona:** Manager
- **Source:** PRD Section 5.2.3

#### FR-015: View Exception Explanation Text
- **Description:** When viewing a direct report's detail, clicking on a Yellow (Exception Pending) week shows the exception explanation text submitted by the employee.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a direct report has a Yellow week, when the manager clicks on that week, then the exception explanation text is displayed
  - Given a direct report has a non-Yellow week, when the manager clicks it, then no exception text is shown (or appropriate message)
- **Dependencies:** FR-014, FR-009
- **User Persona:** Manager
- **Source:** PRD Section 5.2.3

#### FR-016: View Badge Dispute Flag
- **Description:** When viewing a direct report's weekly detail, if a week has a badge dispute, the manager sees it flagged visually.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a direct report has a disputed week, when the manager views the detail, then the dispute is visually indicated (icon, label, or highlight)
  - Given a week has no dispute, when displayed, then no dispute indicator is shown
- **Dependencies:** FR-014, FR-007
- **User Persona:** Manager
- **Source:** PRD Section 5.2.3

#### FR-017: Approve Exception
- **Description:** A manager can approve a pending exception after reviewing the explanation text in the drill-down view. Approval changes the week's status from Yellow (Exception Pending) to Blue (Excused).
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager is viewing a direct report's Yellow week detail, when they click "Approve", then the week's status changes to Blue (Excused)
  - Given the approval is saved, when the employee views their compliance table, then the week shows as Blue
  - Given the approval is saved, then a record is created with manager ID, employee ID, week, action type, and timestamp
- **Dependencies:** FR-015, FR-021, BR-010
- **User Persona:** Manager
- **Source:** PRD Section 5.2.4, Workflow 2

#### FR-018: Reject Exception with Optional Note
- **Description:** A manager can reject a pending exception after reviewing the explanation text. Rejection changes the week's status from Yellow (Exception Pending) back to Red (Non-Compliant). The manager may optionally add a rejection note.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager is viewing a direct report's Yellow week detail, when they click "Reject", then the week's status changes back to Red (Non-Compliant)
  - Given the manager enters a rejection note, when saved, then the note is stored with the rejection record
  - Given the manager does not enter a rejection note, when saved, then the rejection is still processed (note is optional)
- **Dependencies:** FR-015, FR-021, BR-010
- **User Persona:** Manager
- **Source:** PRD Section 5.2.4, Workflow 2

#### FR-019: Approve Badge Dispute
- **Description:** A manager can approve a badge dispute from a direct report. Approval changes the week's status to Blue (Excused). The badge swipe count itself is NOT modified — the approval grants excused status.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager views a direct report's week with a badge dispute, when they approve it, then the week status changes to Blue (Excused)
  - Given the dispute is approved, when the badge swipe count is viewed, then it remains unchanged from the original uploaded value
  - Given approval is saved, then a record is created with manager ID, employee ID, week, action type (dispute approved), and timestamp
- **Dependencies:** FR-016, FR-021, BR-010
- **User Persona:** Manager
- **Source:** PRD Section 5.2.4, Business Rule #6

#### FR-020: Reject Badge Dispute with Optional Note
- **Description:** A manager can reject a badge dispute. The week remains Red (Non-Compliant). The manager may optionally add a rejection note.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager views a direct report's week with a badge dispute, when they reject it, then the week remains Red (Non-Compliant)
  - Given the manager enters a rejection note, when saved, then the note is stored
  - Given rejection is saved, then the dispute flag is cleared (or marked as reviewed/rejected)
- **Dependencies:** FR-016, FR-021
- **User Persona:** Manager
- **Source:** PRD Section 5.2.4

#### FR-021: Mandatory Drill-Down Before Approval
- **Description:** Managers must drill into the employee's weekly detail view before they can approve or reject any exception or dispute. There is no bulk/quick approval from the summary dashboard.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager views the direct reports summary dashboard, then no approve/reject buttons are visible on the summary view
  - Given a manager drills into a direct report's detail and views a pending week, then approve/reject buttons are available
  - Given an API request attempts to approve without prior detail view access, then the server enforces the constraint (or the UI simply does not expose the action on the summary)
- **Dependencies:** FR-014, FR-012
- **User Persona:** Manager
- **Source:** PRD Section 5.2.4, Business Rule #8

#### FR-022: Recursive Org Drill-Down
- **Description:** If a direct report is also a manager (Is Manager = "Yes"), the viewing manager can further drill into that sub-manager's direct reports, and so on recursively down the hierarchy. This is powered by the Manager column creating a parent-child adjacency tree.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager has a direct report who is also a manager, when viewing that report's detail, then a link/button to view their direct reports is available
  - Given the manager clicks to view sub-reports, then the same dashboard layout appears showing the sub-manager's direct reports
  - Given 3 levels of hierarchy exist, when the top manager drills through each level, then all 3 levels are navigable
- **Dependencies:** FR-012, FR-014, FR-031, FR-033
- **User Persona:** Manager
- **Source:** PRD Section 5.2.5

#### FR-023: Breadcrumb Navigation (Level 01-08)
- **Description:** As a manager drills into nested org levels, breadcrumb navigation shows the hierarchy path using the Level 01-08 columns from the worker data, allowing quick navigation back to any level.
- **Priority:** P1 (Should Have)
- **Acceptance Criteria:**
  - Given a manager has drilled into a 3rd-level sub-manager, when the breadcrumb displays, then it shows the path: Top Manager > Sub-Manager > Sub-Sub-Manager
  - Given a manager clicks a breadcrumb, when navigated, then the view jumps to that level's dashboard
- **Dependencies:** FR-022, FR-033
- **User Persona:** Manager
- **Source:** PRD Section 5.2.5

#### FR-024: Server-Side Self-Approval Prevention
- **Description:** The system must enforce at the server/API layer that a manager cannot approve or reject their own exceptions or badge disputes. This cannot rely solely on UI hiding.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a manager's own exception is pending, when any API call attempts to approve it with the manager's own credentials, then the API returns an authorization error
  - Given a manager's own dispute is pending, when any API call attempts to approve it with the manager's own credentials, then the API returns an authorization error
  - The validation compares the acting user's identity against the target employee's identity server-side
- **Dependencies:** FR-031, BR-012
- **User Persona:** Manager
- **Source:** PRD Section 5.2.4, Business Rule #7, Section 6 — Security

### Screen 3 — Admin / Upload

#### FR-025: Excel File Upload
- **Description:** Admin users can upload an Excel file in the RTO_Sample.xlsx format through the upload screen. No file size limit for POC.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an admin navigates to the upload screen, when they select an Excel file, then the system accepts the file for processing
  - Given the file matches the expected 12-column format, when uploaded, then it is processed successfully
  - Given the file does NOT match the expected format, when uploaded, then the system rejects it with a clear error message describing what's wrong
- **Dependencies:** FR-032 (parse Excel)
- **User Persona:** Admin / HR
- **Source:** PRD Section 5.3.1, Open Question #4

#### FR-026: Append/Upsert Upload Behavior
- **Description:** Uploaded data is appended to the existing dataset. New weeks are added. If the same employee + week combination exists in both existing data and the new upload, the new upload's data replaces the old (latest wins).
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given existing data for Employee A, Week 1, when new data for Employee A, Week 2 is uploaded, then both Week 1 and Week 2 exist in the system
  - Given existing data for Employee A, Week 1 with badge count 3, when new data for Employee A, Week 1 with badge count 4 is uploaded, then the badge count updates to 4
  - Given existing data for Employee B, when no data for Employee B appears in the new upload, then Employee B's existing data is preserved unchanged
- **Dependencies:** FR-025, FR-032
- **User Persona:** Admin / HR
- **Source:** PRD Section 5.3.1, Business Rule #10

#### FR-027: Preserve Employee Edits Across Uploads
- **Description:** All employee-submitted data (exceptions, PTO additions, badge disputes) and manager actions (approvals, rejections) from prior uploads are preserved and never overwritten by new data uploads.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given Employee A submitted an exception on Week 1 from a previous upload, when a new upload includes Week 1, then the exception and its status are preserved
  - Given a manager approved a dispute on Week 2, when a new upload includes Week 2, then the approval record and Excused status are preserved
  - Given an employee added PTO on Week 3, when a new upload includes Week 3, then the PTO addition record is preserved
- **Dependencies:** FR-026, FR-034
- **User Persona:** Admin / HR
- **Source:** PRD Section 5.3.1, Business Rule #10

#### FR-028: Skip Unmatched Employees with Warning
- **Description:** If an employee appears in the uploaded badge data but does NOT exist in the worker/org data, that employee is skipped from compliance tracking and a warning is logged for admin review.
- **Priority:** P1 (Should Have)
- **Acceptance Criteria:**
  - Given badge data contains "John Doe" but worker data does not, when the upload processes, then John Doe's records are skipped
  - Given records are skipped, when the admin views upload results, then a list of skipped employees and the reason is displayed
  - Given skipped employees exist, then a warning-level log entry is created for each
- **Dependencies:** FR-025, FR-032, FR-033
- **User Persona:** Admin / HR
- **Source:** PRD Section 5.3.1, Open Question #2

#### FR-029: Upload Confirmation with Results Summary
- **Description:** After upload processing completes, the admin sees a confirmation summary including: total rows processed, new weeks added, records updated, and any warnings (skipped employees, format issues).
- **Priority:** P1 (Should Have)
- **Acceptance Criteria:**
  - Given a successful upload, when processing completes, then the admin sees a summary with counts for rows processed, new records, updated records
  - Given some employees were skipped, when the summary displays, then the skipped count and employee names are listed
  - Given an upload with no errors, when the summary displays, then a success confirmation is shown
- **Dependencies:** FR-025, FR-026, FR-028
- **User Persona:** Admin / HR
- **Source:** PRD Section 5.3.1, Workflow 3 step 6

### Authentication & Roles

#### FR-030: Email-Based Authentication
- **Description:** For the POC, authentication is performed via email-based lookup against the worker data. The user enters their work email address, and the system matches it against the "Email - Work" column in the worker/org data file. No password required for POC.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a user enters an email that exists in the worker data, when they submit, then they are authenticated and see the appropriate view
  - Given a user enters an email that does NOT exist in the worker data, when they submit, then they receive an "unauthorized" error message
  - Given a Contingent Worker's email, when they attempt to log in, then they are denied access (CWs are excluded)
- **Dependencies:** FR-033 (parse worker data)
- **User Persona:** All
- **Source:** PRD Section 6 — Security, Section 3 — Scope

#### FR-031: Role Determination from Worker Data
- **Description:** User roles (Employee, Manager, Admin/HR) are determined from the worker data file. Manager role is assigned when "Is Manager" = "Yes". Admin role assignment mechanism TBD during design (could be a config file, specific org, or flag in data).
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a user with Is Manager = "Yes" in worker data, when authenticated, then they see both the Employee View and the Manager View
  - Given a user with Is Manager = null (or not "Yes"), when authenticated, then they see only the Employee View
  - Given an Admin user, when authenticated, then they have access to the Upload screen in addition to their Employee/Manager views
- **Dependencies:** FR-030, FR-033
- **User Persona:** All
- **Source:** PRD Section 5.2 (Manager access), Section 10.2 (Is Manager field)

### Data Parsing & Persistence

#### FR-032: Parse RTO Compliance Excel (12 Columns)
- **Description:** The system must parse uploaded Excel files matching the RTO_Sample.xlsx format with 12 specific columns: ET Org, ELG Org, Supervisory Org, Worker, Worker Type, Work Location Type, Location, On Leave, Week Range, Meets 4-Day Requirement, Total Badge Swipe, Total PTO Requested.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a valid Excel file with all 12 columns, when parsed, then all column values are correctly extracted
  - Given a file missing required columns, when parsed, then a validation error is returned identifying the missing columns
  - Given a file with unexpected data types (e.g., text in Total Badge Swipe), when parsed, then a validation error is returned for the specific cells
  - Given the Week Range format "MM/DD/YYYY - MM/DD/YYYY", when parsed, then the start and end dates are correctly extracted
- **Dependencies:** None
- **User Persona:** Admin / HR (indirect — powers the upload feature)
- **Source:** PRD Section 10.1

#### FR-033: Parse Worker/Org Hierarchy Data
- **Description:** The system must load and parse the worker/org data file (tech_workers_with_manager_email.xlsx format) with 35 columns. Key fields used: Worker, Email - Work, Manager, Manager E-mail Address, Is Manager, Number of Direct Reports, Worker Type, Work Location Type, and Level 01-08.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given a valid worker data file, when loaded, then all 783 rows (or equivalent) are parsed
  - Given the Manager column, when processed, then a parent-child hierarchy tree can be constructed
  - Given Level 01-08 columns, when processed, then breadcrumb paths can be generated for any employee
  - Given the Is Manager column, when checked for a worker, then "Yes" indicates manager role and null indicates non-manager
- **Dependencies:** None
- **User Persona:** System (powers hierarchy, roles, and auth)
- **Source:** PRD Section 10.2

#### FR-034: Persist Application-Generated Data
- **Description:** The system must persist all application-generated data (exceptions, PTO additions, disputes, approvals, computed compliance states) in a database that survives across data uploads and application restarts.
- **Priority:** P0 (Must Have)
- **Acceptance Criteria:**
  - Given an employee submits an exception, when the application is restarted, then the exception is still present
  - Given a manager approves a dispute, when new data is uploaded, then the approval record and Excused state are preserved
  - The database stores: employee-submitted exceptions (employee ID, week, explanation, timestamp), PTO additions (employee ID, week, days, timestamp), badge disputes (employee ID, week, flag, timestamp), manager approvals (manager ID, employee ID, week, action type, timestamp), and computed compliance state per employee-week
- **Dependencies:** None (foundational)
- **User Persona:** System
- **Source:** PRD Section 10.3

---

## Gaps & Notes

1. **Admin role assignment:** The PRD mentions Admin/HR as a role but does not specify how Admin users are identified in the data. The worker data file does not have an "Is Admin" field. This needs to be resolved during technical design (options: config file, specific email list, or a flag).

2. **Employee actions on already-disputed weeks:** The PRD does not clarify whether an employee can submit both a dispute AND an exception on the same week, or whether submitting one blocks the other. Recommend clarifying during design.

3. **Re-submission after rejection:** The PRD does not specify whether an employee can re-submit an exception after it has been rejected by the manager. Recommend allowing re-submission (Red → Yellow again) during design.

4. **PTO display integration:** The PRD mentions employees can "Add PTO Days" but does not clarify how added PTO is visually reflected — is it added to the Total PTO Requested column, shown separately, or only used for audit?

5. **Concurrent dispute + exception:** If a week has both a badge dispute AND an exception pending, the approval workflow and state machine need clarification (which takes precedence, or are they independent actions?).
