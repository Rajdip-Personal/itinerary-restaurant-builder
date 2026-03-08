# User Stories — Phase 2: Manager View + Drill-down (Sprint 3)

## Summary
- **Total Stories:** 9
- **Total Story Points:** 34
- **Sprint:** 3
- **Work Packages Covered:** WP-2.1, WP-2.2, WP-2.3, WP-2.4
- **Requirements Covered:** TR-008, TR-002, FR-022, FR-023, FR-012, FR-013, FR-014, FR-015, FR-016, FR-024, FR-033 (hierarchy aspect), FR-034 (pending counts), FR-011, NFR-012, NFR-002

## Requirements Coverage

| Requirement | Stories | Status |
|------------|---------|--------|
| TR-008 | S-2.1.1, S-2.1.2 | Covered |
| TR-002 | S-2.1.1 | Covered (hierarchy aspect) |
| FR-022 | S-2.1.2, S-2.4.1 | Covered |
| FR-023 | S-2.1.2, S-2.4.2 | Covered |
| FR-012 | S-2.2.1, S-2.3.1 | Covered |
| FR-013 | S-2.2.1, S-2.3.1 | Covered |
| FR-014 | S-2.2.2, S-2.3.2 | Covered |
| FR-015 | S-2.2.2, S-2.3.2 | Covered |
| FR-016 | S-2.2.2, S-2.3.2 | Covered |
| FR-024 | S-2.2.2 | Covered (read-only enforcement) |
| FR-011 | S-2.3.1 | Covered |
| FR-033 | S-2.1.1 | Covered (hierarchy tree construction) |
| FR-034 | S-2.2.1 | Covered (pending counts) |
| NFR-012 | S-2.2.1 | Covered |
| NFR-002 | S-2.2.1 | Covered (manager endpoint RBAC) |

---

## [EPIC-4] Epic: Manager View & Org Drill-Down

### S-2.1.1: Build org hierarchy service from worker data

**Story:**
As a manager,
I want the system to build an org hierarchy tree from worker data,
So that I can view my direct reports and navigate through sub-managers' teams.

**Priority:** P0
**Story Points:** 5
**Sprint:** 3
**Requirements:** TR-008, TR-002, FR-033 (hierarchy aspect)

**Acceptance Criteria:**

```gherkin
Given the workers table is populated with 783 rows of worker/org data,
When the HierarchyService builds the parent-child tree from the manager_email column,
Then every worker with a manager_email value is linked to their manager node.

Given a manager with work email "alice@nordstrom.com" has 5 direct reports in the workers table,
When getDirectReports("alice-worker-id") is called,
Then exactly 5 worker records are returned, each with worker_id, name, is_manager flag, and email.

Given a worker record has is_manager = false,
When getDirectReports() is called with that worker's ID,
Then an empty list is returned (no direct reports).

Given a manager_email value that does not match any worker's work_email in the dataset,
When the hierarchy is built,
Then the orphaned workers are logged as warnings and excluded from the tree (not causing a crash).

Given a circular reference in manager data (A manages B, B manages A),
When the hierarchy is built,
Then the cycle is detected, logged as an error, and the tree is built with the cycle broken.

Given the worker/org data is re-uploaded via admin upload,
When the HierarchyService rebuilds the tree,
Then the in-memory cache is refreshed with the new hierarchy data.
```

**Technical Notes:**
- **Service:** `HierarchyService` (design-inventory 1.1.8) — exposes `getDirectReports(managerId)`, `getHierarchyPath(workerId)`, `isManagerOf(managerId, employeeId)`, `getBreadcrumbs(workerId)`
- **Data Model:** `workers` table — `manager_email` column creates the parent-child adjacency, `is_manager` flag identifies managers, `level_01` through `level_08` columns store hierarchy levels
- **Implementation:** Build adjacency list in memory from `workers` table on startup and on worker data upload. Use `manager_email → work_email` join to link parent-child. Cache the tree in a singleton/module-level dict.
- **Edge Cases:** Handle orphan workers (manager not in dataset), self-referencing managers, and circular references
- **Testing:** Unit tests with known sample data (46 managers, 8 hierarchy levels). Test tree construction, direct report lookup, orphan handling, and cache refresh.

**Definition of Done:**
- [ ] HierarchyService builds parent-child adjacency tree from workers table
- [ ] `getDirectReports()` returns correct reports for any manager ID
- [ ] Edge cases (orphans, cycles) handled gracefully with logging
- [ ] Cache rebuilds on worker data re-upload
- [ ] Unit tests cover tree construction, lookups, and edge cases (≥80% coverage)
- [ ] Code review approved

---

### S-2.1.2: Implement hierarchy path and breadcrumb generation

**Story:**
As a manager,
I want breadcrumb navigation showing the org hierarchy path,
So that I can see where I am in the org tree and quickly navigate back up.

**Priority:** P1
**Story Points:** 3
**Sprint:** 3
**Requirements:** FR-023, TR-008, FR-022 (hierarchy traversal)

**Acceptance Criteria:**

```gherkin
Given a worker at hierarchy level 3 with Level 01 = "VP Engineering", Level 02 = "Dir Platform", Level 03 = "Sr Mgr Tools",
When getBreadcrumbs(workerId) is called,
Then it returns [{level: 1, name: "VP Engineering"}, {level: 2, name: "Dir Platform"}, {level: 3, name: "Sr Mgr Tools"}].

Given a worker with Level 01 = "CTO" and Level 02-08 all null,
When getBreadcrumbs(workerId) is called,
Then it returns [{level: 1, name: "CTO"}] — only populated levels included.

Given a manager drills from Level 2 to Level 4,
When getHierarchyPath(workerId) is called at Level 4,
Then the path includes all levels from Level 01 through Level 04 with worker IDs resolvable at each level.

Given managerId A and employeeId B where B is a direct report of A,
When isManagerOf(A, B) is called,
Then it returns true.

Given managerId A and employeeId C where C is NOT in A's org tree,
When isManagerOf(A, C) is called,
Then it returns false.
```

**Technical Notes:**
- **Service:** `HierarchyService` (1.1.8) — `getBreadcrumbs(workerId)` and `getHierarchyPath(workerId)` methods
- **Data Model:** `workers.level_01` through `workers.level_08` columns — these contain org hierarchy labels, not worker IDs. The breadcrumb text comes from these columns; the clickable navigation links resolve worker IDs via the adjacency tree.
- **API:** `GET /api/manager/reports/{workerId}/breadcrumbs` → returns `{"breadcrumbs": [{id, name, level}]}` (design-inventory 3.1.3)
- **Testing:** Test with workers at various depths (level 1 to level 8). Verify null level columns are excluded.

**Definition of Done:**
- [ ] `getBreadcrumbs()` returns correct hierarchy path from Level 01–08 columns
- [ ] `isManagerOf()` correctly validates manager-report relationships
- [ ] Breadcrumbs API endpoint returns structured response
- [ ] Unit tests for various hierarchy depths and null levels
- [ ] Code review approved

---

### S-2.2.1: Implement manager dashboard API (direct reports summary)

**Story:**
As a manager,
I want an API that returns a summary of my direct reports' compliance status,
So that I can quickly see which team members need attention.

**Priority:** P0
**Story Points:** 5
**Sprint:** 3
**Requirements:** FR-012, FR-013, FR-034 (pending counts), NFR-012, NFR-002

**Acceptance Criteria:**

```gherkin
Given a manager with 5 direct reports, each having 13 weeks of compliance data,
When GET /api/manager/reports is called with the manager's JWT,
Then the response contains exactly 5 entries, each with: id, name, compliance_pct, status, pending_exceptions, pending_disputes, pending_pto.

Given a direct report has 10 compliant weeks out of 13 total weeks,
When the compliance_pct is computed,
Then it returns 76.9 (rounded to 1 decimal).

Given a direct report has 2 pending exceptions and 1 pending dispute,
When the summary is returned,
Then pending_exceptions = 2, pending_disputes = 1, pending_pto = 0.

Given the filter query parameter is set to "non_compliant",
When GET /api/manager/reports?filter=non_compliant is called,
Then only direct reports whose current overall status is Non-Compliant are returned.

Given the filter query parameter is set to "pending",
When GET /api/manager/reports?filter=pending is called,
Then direct reports with Pending (Yellow) status are returned.

Given the filter parameter is set to "multiple_pending",
When GET /api/manager/reports?filter=multiple_pending is called,
Then direct reports with Multiple Actions Pending (Orange) status are returned.

Given a user with Employee role (not a manager),
When GET /api/manager/reports is called,
Then a 403 Forbidden response is returned.

Given a manager with 15 direct reports,
When the dashboard API is called,
Then the response is returned in under 3 seconds.
```

**Technical Notes:**
- **API:** `GET /api/manager/reports` with optional `filter` query param (all|compliant|non_compliant|pending|multiple_pending) — see design-inventory 3.1.3
- **Service:** `ComplianceService.getDirectReportsSummary(managerId)` (design-inventory 1.1.6) — computes compliance_pct, status, and pending counts per report
- **Auth:** RBAC middleware must enforce Manager role. JWT `role` must be "manager" (NFR-002)
- **Data:** Joins `workers` → `compliance_weeks` → `exceptions`/`disputes`/`pto_additions` tables to compute aggregates
- **Performance:** Use a single query with GROUP BY to compute all summary fields in one pass (NFR-012: <3s)
- **Pending counts:** Count records where `status = 'pending'` across exceptions, disputes, and pto_additions tables for each direct report

**Definition of Done:**
- [ ] API returns correct summary for all direct reports
- [ ] Compliance percentage computed accurately
- [ ] Pending counts (exceptions, disputes, PTO) accurate
- [ ] Filter parameter works for all 5 status values + "all"
- [ ] RBAC enforced — non-managers get 403
- [ ] Response time <3s for 15 direct reports
- [ ] Integration tests cover happy path, filtering, and auth rejection
- [ ] Code review approved

---

### S-2.2.2: Implement manager drill-down API (employee detail + sub-manager reports)

**Story:**
As a manager,
I want to drill into a specific direct report's compliance detail,
So that I can review their weekly data and pending actions before making approval decisions.

**Priority:** P0
**Story Points:** 5
**Sprint:** 3
**Requirements:** FR-014, FR-015, FR-016, FR-022, FR-024 (read-only enforcement)

**Acceptance Criteria:**

```gherkin
Given a manager drills into direct report "Bob" (worker ID = bob-uuid),
When GET /api/manager/reports/bob-uuid/compliance?weeks=13 is called,
Then it returns the same data shape as the employee's own compliance view — weekly records with day_actions, status colors, exception text, dispute flags — but in read-only context (no action submission endpoints exposed).

Given direct report "Bob" has a Yellow week with an exception explanation "Doctor appointment on Tuesday",
When the manager views that week's detail,
Then the exception explanation text "Doctor appointment on Tuesday" is included in the response.

Given direct report "Bob" has a week with a disputed badge count on Wednesday,
When the manager views that week's detail,
Then the day_actions array includes an entry with type="dispute", day="wednesday", and status="pending".

Given a manager tries to view employee "Eve" who is NOT their direct report (or recursive sub-report),
When GET /api/manager/reports/eve-uuid/compliance is called,
Then a 403 Forbidden response is returned.

Given direct report "Carol" is also a manager (is_manager = true),
When GET /api/manager/reports/carol-uuid/reports is called,
Then it returns Carol's direct reports in the same summary format as the manager's own dashboard.

Given a manager drills from their reports to sub-manager Carol's reports, then to sub-sub-manager Dave's reports,
When each level's /reports endpoint is called,
Then each returns the correct direct reports for that manager level.
```

**Technical Notes:**
- **API Endpoints:**
  - `GET /api/manager/reports/{workerId}/compliance?weeks=13` — returns employee detail with day_actions (design-inventory 3.1.3)
  - `GET /api/manager/reports/{workerId}/reports` — returns sub-manager's direct reports in same shape as `/api/manager/reports` (FR-022)
- **Auth:** Must verify the requesting manager is a direct or recursive ancestor of the target employee using `HierarchyService.isManagerOf()`. Non-ancestors get 403.
- **Service:** Uses `ComplianceService` for detail data and `HierarchyService` for relationship verification and sub-manager drill-down
- **Data:** Response includes exception explanation text (FR-015), dispute flags (FR-016), and PTO indicators for each week's day_actions
- **Security:** This is a read-only API — no mutation endpoints. Approval/rejection endpoints are separate (Phase 3).

**Definition of Done:**
- [ ] Employee detail API returns compliance data with day_actions
- [ ] Exception text and dispute flags visible in response
- [ ] Sub-manager drill-down returns correct reports recursively
- [ ] Manager-report relationship verified server-side (403 for non-reports)
- [ ] Integration tests cover direct report detail, sub-manager drill, and auth rejection
- [ ] Code review approved

---

### S-2.3.1: Build manager dashboard UI with direct reports table

**Story:**
As a manager,
I want to see my own compliance view and a summary table of my direct reports,
So that I can monitor my team's RTO compliance at a glance.

**Priority:** P0
**Story Points:** 5
**Sprint:** 3
**Requirements:** FR-011, FR-012, FR-013, FR-033 (compliance %), FR-034 (pending counts)

**Acceptance Criteria:**

```gherkin
Given a manager logs in with a valid work email,
When the Manager View loads,
Then their own Employee View is displayed at the top with full employee functionality (view compliance table, pie chart).

Given the manager's own Employee View renders,
When they scroll below it,
Then a "Direct Reports" section shows a summary table with columns: Name, Compliance %, Status, Pending Exceptions, Pending Disputes, Pending PTO.

Given a manager has 8 direct reports,
When the dashboard loads,
Then all 8 reports appear in the table with correct compliance percentages and pending counts.

Given the status filter dropdown is set to "Non-Compliant",
When the filter is applied,
Then only direct reports with Non-Compliant status are shown in the table.

Given the status filter dropdown is changed back to "All",
When the filter clears,
Then all direct reports reappear in the table.

Given a direct report "Carol" has is_manager = true,
When the table renders,
Then Carol's row has a visual sub-manager indicator (e.g., link icon or "Manager" badge) distinguishing her from non-managers.

Given the dashboard has 15 direct reports,
When the page loads,
Then the entire view (own compliance + direct reports table) renders in under 3 seconds.
```

**Technical Notes:**
- **Components:** `ManagerView` (1.2.3) — contains own `EmployeeView` (reused, 1.2.2) + `DirectReportsDashboard`
- **Sub-components:** `StatusFilter` (dropdown: All/Compliant/Non-Compliant/Pending/Multiple Pending), `ReportRow` (click to drill)
- **API:** Calls `GET /api/manager/reports` with optional `?filter=` query param
- **Reuse:** The manager's own compliance section reuses the `EmployeeView` component with the manager's own data — no duplication
- **Styling:** Tailwind CSS for layout. Use `@tanstack/react-table` for the direct reports summary table. Status column uses `StatusBadge` component (5-state colors + text labels per NFR-018)
- **Routing:** `/manager` route — React Router v6 handles navigation

**Definition of Done:**
- [ ] Manager's own Employee View renders correctly at top of page
- [ ] Direct reports summary table shows all required columns
- [ ] Status filter dropdown works for all filter values
- [ ] Sub-manager indicator visible on manager reports
- [ ] Page renders in <3s with 15 reports
- [ ] Frontend unit tests (vitest + testing-library) for table rendering and filtering
- [ ] Code review approved

---

### S-2.3.2: Build employee detail drill-down view for managers

**Story:**
As a manager,
I want to click a direct report's name and see their weekly compliance detail,
So that I can review their status, exception explanations, and dispute flags.

**Priority:** P0
**Story Points:** 3
**Sprint:** 3
**Requirements:** FR-014, FR-015, FR-016

**Acceptance Criteria:**

```gherkin
Given the manager is viewing the direct reports table,
When they click on a report's name "Bob",
Then the view navigates to Bob's weekly compliance detail showing the same table layout as the Employee View.

Given the manager is viewing Bob's detail view,
When they look at the compliance table,
Then no action buttons (Submit Exception, Dispute, Add PTO) are visible — the view is read-only.

Given Bob has a Yellow (Pending) week with exception explanation "Doctor appointment",
When the manager clicks or hovers on that week row,
Then the exception explanation text "Doctor appointment" is displayed (e.g., in an expandable panel or tooltip).

Given Bob has a week with a badge dispute on Monday,
When the manager views that week,
Then a dispute indicator (icon or label) is visible on the Monday column/day area.

Given the manager is in Bob's detail view,
When they click "Back" or use browser back,
Then they return to the direct reports dashboard with their previous filter/scroll state preserved.
```

**Technical Notes:**
- **Component:** `ReportDetail` (design-architecture frontend component tree) — wraps `ComplianceTable` in read-only mode
- **Sub-components:** Read-only `ComplianceTable` (1.2.2 reused without action buttons), `Exception Detail Panel`, `Dispute Indicator`, `PTO Indicator`
- **API:** Calls `GET /api/manager/reports/{workerId}/compliance?weeks=13`
- **Routing:** `/manager/reports/:workerId` — React Router v6 nested route
- **State preservation:** Use React Router's state or URL params to preserve the dashboard filter/scroll position on back navigation
- **Read-only mode:** Pass a `readOnly={true}` prop to `ComplianceTable` to suppress action buttons

**Definition of Done:**
- [ ] Click on report name navigates to detail view
- [ ] Compliance table renders in read-only mode (no action buttons)
- [ ] Exception explanation text visible for Yellow/Orange weeks
- [ ] Dispute and PTO indicators visible for relevant weeks
- [ ] Back navigation preserves dashboard state
- [ ] Frontend tests for read-only rendering and navigation
- [ ] Code review approved

---

### S-2.4.1: Implement recursive org drill-down navigation

**Story:**
As a manager,
I want to click on a sub-manager in the dashboard and see their direct reports,
So that I can navigate through multiple levels of the org hierarchy.

**Priority:** P0
**Story Points:** 3
**Sprint:** 3
**Requirements:** FR-022, FR-015 (read-only detail at each level)

**Acceptance Criteria:**

```gherkin
Given a manager's direct report "Carol" has is_manager = true,
When the manager clicks the sub-manager indicator on Carol's row,
Then the view loads Carol's direct reports in the same dashboard table layout.

Given the manager has drilled into sub-manager Carol's team,
When Carol's direct report "Dave" is also a manager (is_manager = true),
Then Dave also has a sub-manager indicator, and clicking it loads Dave's direct reports.

Given the manager has drilled from their own reports → Carol's reports → Dave's reports (3 levels deep),
When they click on a non-manager employee in Dave's team,
Then that employee's read-only compliance detail view is shown.

Given the manager is 3 levels deep in the drill-down,
When they use the browser back button,
Then they return to the previous level (Dave's reports → Carol's reports → own reports).

Given the manager drills into sub-manager Carol's team,
When the dashboard for Carol's reports loads,
Then it includes the same columns (Name, Compliance %, Status, Pending counts) and the status filter works identically.
```

**Technical Notes:**
- **Component:** `SubManagerLink` (design-architecture frontend component tree) — click triggers navigation to `/manager/reports/:workerId/reports`
- **API:** `GET /api/manager/reports/{workerId}/reports` — returns sub-manager's direct reports in the same response shape as `/api/manager/reports`
- **Routing:** Nested route `/manager/reports/:managerId/reports` — the `DirectReportsDashboard` component is reused at each level, receiving a different `managerId` from the URL
- **Implementation:** The `DirectReportsDashboard` component should accept a `managerId` prop (defaults to current user if not provided). This enables reuse at every drill-down level without code duplication.
- **Performance:** Each drill-down level triggers a fresh API call. Consider prefetching on hover for sub-manager links.

**Definition of Done:**
- [ ] Sub-manager click navigates to that manager's direct reports
- [ ] Dashboard component reused at every hierarchy level
- [ ] Drill-down works across 3+ levels
- [ ] Back navigation works correctly through all levels
- [ ] Status filter works at every drill-down level
- [ ] Frontend tests verify drill-down across multiple levels
- [ ] Code review approved

---

### S-2.4.2: Implement breadcrumb navigation component

**Story:**
As a manager,
I want breadcrumbs showing my current position in the org hierarchy,
So that I can quickly navigate back to any level without repeated back-button clicks.

**Priority:** P1
**Story Points:** 3
**Sprint:** 3
**Requirements:** FR-023, TR-008

**Acceptance Criteria:**

```gherkin
Given a manager is at their own dashboard (top level),
When the breadcrumb component renders,
Then it shows only the manager's own name (no clickable links, since this is the root).

Given a manager has drilled into sub-manager "Carol" at Level 3,
When the breadcrumbs render,
Then they show: [Manager Name] > [Carol's Level 02 label] > Carol — with Manager Name and Level 02 as clickable links.

Given a manager has drilled 3 levels deep (own → Carol → Dave),
When the breadcrumbs render,
Then they show: [Manager Name] > Carol > Dave — with all previous levels clickable.

Given the manager clicks the first breadcrumb (their own name),
When the navigation completes,
Then the view returns to the manager's own direct reports dashboard.

Given the manager clicks a middle breadcrumb (Carol),
When the navigation completes,
Then the view shows Carol's direct reports — not the employee detail of Carol.

Given a worker has Level 01 = "VP Engineering", Level 02 = "Dir Platform", Level 03 is null,
When the breadcrumb labels are generated,
Then only "VP Engineering" and "Dir Platform" appear — null levels are excluded.
```

**Technical Notes:**
- **Component:** `Breadcrumbs` (design-architecture shared component, design-inventory 1.2.6)
- **API:** `GET /api/manager/reports/{workerId}/breadcrumbs` → `{"breadcrumbs": [{id, name, level}]}`
- **Data:** Breadcrumb labels come from `workers.level_01` through `workers.level_08`. Worker IDs at each level are resolved via the hierarchy tree for navigation targets.
- **Implementation:** Breadcrumb component renders a horizontal list of `<button>` or `<a>` elements. Each click navigates to `/manager/reports/:managerId/reports` for that level's manager ID. Use React Router `<Link>` for navigation.
- **Accessibility:** Use `<nav aria-label="Org hierarchy breadcrumb">` with `<ol>` for semantic markup (NFR-018)

**Definition of Done:**
- [ ] Breadcrumbs render at every drill-down level
- [ ] Each breadcrumb is clickable and navigates to the correct level
- [ ] Null hierarchy levels excluded from breadcrumbs
- [ ] Breadcrumb component uses semantic HTML (`nav > ol > li`)
- [ ] Frontend tests verify breadcrumb rendering and click navigation
- [ ] Code review approved

---

### S-2.3.3: Integrate manager view routing and role-based navigation

**Story:**
As a manager,
I want to be automatically routed to the Manager View after login,
So that I see the appropriate dashboard for my role without manual navigation.

**Priority:** P0
**Story Points:** 2
**Sprint:** 3
**Requirements:** FR-011, FR-031, NFR-002

**Acceptance Criteria:**

```gherkin
Given a user logs in with an email that maps to a worker with is_manager = "Yes",
When authentication succeeds and JWT is issued with role = "manager",
Then the frontend routes to /manager (Manager View) by default.

Given a user with Employee role (is_manager = "No") attempts to navigate to /manager,
When the frontend route guard checks the JWT role,
Then the user is redirected to /employee with an appropriate message.

Given the top navigation bar renders for a manager,
When the nav items are displayed,
Then both "My Compliance" (Employee View) and "My Team" (Manager Dashboard) tabs/links are visible.

Given the top navigation bar renders for a non-manager employee,
When the nav items are displayed,
Then only "My Compliance" is visible — no "My Team" link.
```

**Technical Notes:**
- **Routing:** React Router v6 protected routes. `/manager` route checks JWT role = "manager" before rendering `ManagerView`. Redirect to `/employee` if role mismatch.
- **Component:** Top Nav Bar (design-inventory 1.2.6) — role-aware tab rendering. Read role from `AuthProvider` context.
- **Auth Context:** `AuthProvider` (design-architecture frontend component tree) must expose `user.role` and `user.is_manager` for route guards and conditional rendering.
- **Navigation tabs:** Manager sees: "My Compliance" → `/employee`, "My Team" → `/manager`. Employee sees only "My Compliance" → `/employee`.

**Definition of Done:**
- [ ] Manager role routes to /manager after login
- [ ] Employee role cannot access /manager (redirected with message)
- [ ] Navigation bar is role-aware (shows/hides "My Team" tab)
- [ ] Frontend tests verify route guards and nav rendering per role
- [ ] Code review approved
