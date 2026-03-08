# User Stories — Phase 3: Approvals + Actions

## Summary
- **Phase:** 3 (Approvals + Actions)
- **Work Packages:** WP-3.1 through WP-3.9
- **Total Stories:** 20
- **Sprint Distribution:** Sprint 4 (12 stories) | Sprint 5 (8 stories)
- **Effort Distribution:** S: 6 | M: 8 | L: 6

## Story Map

| Work Package | Sprint 4 | Sprint 5 |
|-------------|----------|----------|
| WP-3.1 State Machine | S-3.1.1, S-3.1.2 | |
| WP-3.2 Exception API | S-3.2.1, S-3.2.2 | |
| WP-3.3 PTO API | S-3.3.1 | |
| WP-3.4 Dispute API | S-3.4.1 | |
| WP-3.5 Approval API | S-3.5.1, S-3.5.2, S-3.5.3 | |
| WP-3.6 Employee Action UI | S-3.6.1, S-3.6.2, S-3.6.3 | |
| WP-3.7 Manager Review UI | | S-3.7.1, S-3.7.2 |
| WP-3.8 Pie Chart Update | | S-3.8.1 |
| WP-3.9 E2E Testing | | S-3.9.1, S-3.9.2, S-3.9.3, S-3.9.4, S-3.9.5 |

## Requirements Coverage

| Requirement | Stories | Status |
|------------|---------|--------|
| TR-004 (5-state state machine) | S-3.1.1, S-3.1.2 | Covered |
| TR-001 (day-level tracking) | S-3.1.1 | Covered |
| TR-018 (same-day constraint) | S-3.1.1, S-3.2.1, S-3.4.1 | Covered |
| TR-003 (versioned data) | S-3.2.2 | Covered |
| TR-012 (5-week window) | S-3.2.1, S-3.3.1, S-3.4.1 | Covered |
| TR-011 (self-approval prevention) | S-3.5.2 | Covered |
| TR-014 (pie chart computation) | S-3.8.1 | Covered |
| TR-015 (drill-down enforcement) | S-3.7.1 | Covered |
| BR-010 (5-state model) | S-3.1.1 | Covered |
| BR-011 (manager approval) | S-3.5.1 | Covered |
| BR-012 (no self-approve) | S-3.5.2 | Covered |
| FR-007 (submit exception) | S-3.2.1, S-3.6.1 | Covered |
| FR-008 (exception text) | S-3.2.1, S-3.6.1 | Covered |
| FR-009 (add PTO) | S-3.3.1, S-3.6.1 | Covered |
| FR-010 (PTO adjustment) | S-3.3.1 | Covered |
| FR-016 (badge dispute) | S-3.4.1, S-3.6.1 | Covered |
| FR-017 (approve exception) | S-3.5.1, S-3.7.1 | Covered |
| FR-018 (reject exception) | S-3.5.1, S-3.7.1 | Covered |
| FR-019 (approve dispute) | S-3.5.1, S-3.7.1 | Covered |
| FR-020 (reject dispute) | S-3.5.1, S-3.7.1 | Covered |
| FR-021 (resubmission) | S-3.2.2, S-3.6.2 | Covered |
| FR-024 (self-approval prevention) | S-3.5.2 | Covered |
| FR-035 (day selection) | S-3.2.1, S-3.3.1, S-3.4.1, S-3.6.1 | Covered |
| FR-036 (same-day constraint) | S-3.2.1, S-3.4.1, S-3.6.2 | Covered |
| FR-037 (week-level computation) | S-3.1.1, S-3.1.2 | Covered |
| FR-005 (pie chart) | S-3.8.1 | Covered |
| FR-006 (chart syncs) | S-3.8.1 | Covered |
| NFR-015 (80% coverage) | S-3.9.1 | Covered |
| NFR-016 (code quality) | S-3.9.2 | Covered |
| NFR-011 (employee <2s) | S-3.9.3 | Covered |
| NFR-012 (manager <3s) | S-3.9.3 | Covered |
| NFR-013 (upload <30s) | S-3.9.3 | Covered |
| NFR-014 (50 concurrent) | S-3.9.3 | Covered |
| NFR-017 (data integrity) | S-3.9.4 | Covered |
| NFR-018 (accessibility) | S-3.6.3 | Covered |
| BR-001 (replace manual tracking) | S-3.9.5 | Covered |
| BR-002 (manager visibility) | S-3.9.5 | Covered |
| BR-003 (single source of truth) | S-3.9.5 | Covered |
| BR-004 (employee engagement) | S-3.9.5 | Covered |
| BR-005 (manager review time) | S-3.5.1, S-3.9.5 | Covered |

---

## WP-3.1: 5-State Compliance State Machine

### S-3.1.1: Implement day-level action state and week-level compliance state derivation

**Story:**
As a developer,
I want a pure-function compliance state machine that computes week-level state from day-level actions,
So that the 5-state compliance model is deterministic, testable, and reusable across all features.

**Priority:** P0
**Effort:** L (2-3 days)
**Sprint:** 4
**Requirements:** TR-004, TR-001, TR-018, BR-010, FR-037

**Acceptance Criteria:**

```gherkin
Given badge data says "Meets 4-Day = Yes" and no pending or approved actions exist for the week
When compliance state is computed
Then the week state is COMPLIANT (Green)

Given badge data says "Meets 4-Day = No" and no exception, dispute, or PTO has been submitted for the week
When compliance state is computed
Then the week state is NON_COMPLIANT (Red)

Given an employee has pending exception(s) on one or more days and NO other action types pending
When compliance state is computed
Then the week state is PENDING (Yellow)

Given an employee has pending PTO addition(s) on one or more days and NO other action types pending
When compliance state is computed
Then the week state is PENDING (Yellow)

Given an employee has ONLY pending dispute(s) and no pending exceptions or PTO
When compliance state is computed
Then the week state is PENDING (Yellow)

Given an employee has a pending exception on Tuesday AND a pending dispute on Thursday (different days, same week)
When compliance state is computed
Then the week state is MULTIPLE_ACTIONS_PENDING (Orange)

Given all day-level actions within a week have status "approved" and badge data says "No"
When compliance state is computed
Then the week state is EXCUSED (Blue)

Given some day-level actions are approved and at least one is still pending
When compliance state is computed
Then the week state reflects the pending status (Yellow or Orange), NOT Blue

Given a day already has a pending exception
When an attempt is made to create a dispute for that same day
Then the same-day constraint check returns a conflict error

Given a day already has a pending dispute
When an attempt is made to create an exception for that same day
Then the same-day constraint check returns a conflict error

Given a day has a rejected exception (status='rejected')
When the same-day constraint is checked for a new exception on that day
Then the day is available (rejected actions do not block new submissions)
```

**Technical Notes:**
- Implement as pure functions in `backend/app/core/state_machine.py` per AD-006 (design-architecture.md)
- Use `ComplianceState` enum: COMPLIANT, NON_COMPLIANT, PENDING, MULTIPLE_ACTIONS_PENDING, EXCUSED
- Use `ActionType` enum: EXCEPTION, DISPUTE, PTO
- Use `ActionStatus` enum: PENDING, APPROVED, REJECTED
- `compute_week_state(meets_requirement: bool, day_actions: list[DayAction]) -> ComplianceState` — main entry point
- `check_same_day_constraint(week_id, day_date, new_action_type) -> bool` — validates no conflict
- Day-level state is intermediate; only week-level state is exposed to API consumers
- Tables involved: `compliance_weeks`, `exceptions`, `disputes`, `pto_additions` (read from, not written to)
- Must have 100% unit test coverage — test all 5 states, all transitions, edge cases (empty actions, mixed approved+pending)

**Dependencies:** WP-0.2 (schema with day_actions tables)

**Definition of Done:**
- [ ] `compute_week_state` pure function implemented with all 5 states
- [ ] `check_same_day_constraint` validation function implemented
- [ ] All 11 acceptance criteria have passing unit tests
- [ ] 100% branch coverage on state machine module
- [ ] No database side effects in state computation functions

---

### S-3.1.2: Implement state recomputation service on action changes

**Story:**
As a developer,
I want the week-level compliance state to be automatically recomputed whenever a day-level action is submitted, approved, or rejected,
So that the displayed compliance status is always accurate and up-to-date.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 4
**Requirements:** TR-004, FR-037, BR-010

**Acceptance Criteria:**

```gherkin
Given an employee submits a new exception on a Red (Non-Compliant) week
When the action is saved to the database
Then the week state is recomputed and stored/returned as Yellow (Pending)

Given a manager approves the only pending action on a Yellow week
When the approval is saved
Then the week state is recomputed and becomes Blue (Excused)

Given a manager rejects the only pending action on a Yellow week
When the rejection is saved
Then the week state is recomputed and becomes Red (Non-Compliant)

Given an employee has a pending exception on Monday and submits a dispute on Wednesday
When the dispute is saved
Then the week state transitions from Yellow to Orange (Multiple Actions Pending)

Given a manager approves one of two pending actions (exception on Monday approved, dispute on Wednesday still pending)
When the approval is saved
Then the week state remains Yellow (single action type still pending) or stays Orange depending on remaining types

Given a rejected action is resubmitted with a new version
When the new action is saved
Then the week state transitions from Red back to Yellow or Orange as appropriate
```

**Technical Notes:**
- Implement `recompute_week_state(week_id)` in `backend/app/services/compliance_service.py`
- This function queries all active day-level actions for the week, calls `compute_week_state`, and updates the cached/returned state
- Called by: exception submission, PTO submission, dispute submission, approval, rejection
- Must handle the case where approval of one action type leaves another type still pending
- Uses SQLAlchemy async queries against `exceptions`, `disputes`, `pto_additions` tables
- Return the new `ComplianceState` to the caller so API responses include the updated state

**Dependencies:** S-3.1.1 (pure state machine functions)

**Definition of Done:**
- [ ] `recompute_week_state` service function implemented
- [ ] Integration tests covering all transition trigger points
- [ ] State is correctly recomputed after submit, approve, reject, and resubmit actions

---

## WP-3.2: Exception Submission API

### S-3.2.1: Implement exception submission endpoint with day-level selection and validation

**Story:**
As an employee,
I want to submit an exception for specific days within a non-compliant week,
So that my manager can review and potentially excuse my compliance gap.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 4
**Requirements:** FR-007, FR-008, FR-035, FR-036, TR-012, TR-018, TR-003

**Acceptance Criteria:**

```gherkin
Given I am an authenticated employee viewing a non-compliant (Red) week within the last 5 weeks
When I submit an exception with day_dates=["2026-02-25","2026-02-26"] and explanation="Business travel to NYC"
Then a new exception record is created in the exceptions table with status="pending" for each selected day
And the week state is recomputed from Red to Yellow (Pending)
And the API returns 201 with the new exception IDs and updated week state

Given I am an authenticated employee
When I attempt to submit an exception for a week that is the 6th most recent or older
Then the API returns 400 with error code "EDIT_WINDOW_EXPIRED" and message "Week is outside the 5-week edit window"

Given I am an authenticated employee and Tuesday already has a pending dispute
When I attempt to submit an exception that includes Tuesday in the day selection
Then the API returns 400 with error code "SAME_DAY_CONFLICT" and message "Tuesday already has a pending dispute; cannot add an exception for the same day"

Given I am an authenticated employee
When I submit an exception without selecting any days
Then the API returns 400 with error code "VALIDATION_ERROR" and message "At least one day must be selected"

Given I am an authenticated employee
When I submit an exception with an empty explanation text
Then the API returns 400 with error code "VALIDATION_ERROR" and message "Explanation text is required"

Given I am an authenticated employee and the week is already Compliant (Green)
When I attempt to submit an exception
Then the API returns 400 with error code "INVALID_STATE" and message "Cannot submit exception for a compliant week"

Given the exception is successfully created
When the database is queried
Then the exception record contains: worker_id, week_id, day_date, explanation (sanitized), status="pending", created_at timestamp
```

**Technical Notes:**
- **Endpoint:** `POST /api/employees/me/actions` with body `{ "type": "exception", "week_id": "uuid", "day_dates": ["YYYY-MM-DD"], "explanation": "text" }`
- Route handler in `backend/app/api/employee_routes.py`
- Service logic in `backend/app/services/compliance_service.py` → calls `submitException()`
- Validation order: (1) auth check, (2) 5-week window (TR-012), (3) week state check, (4) same-day constraint per day (TR-018), (5) explanation not empty
- Sanitize explanation text to prevent XSS (NFR-006)
- Use parameterized queries (SQLAlchemy ORM) — never string concatenation
- After insert, call `recompute_week_state(week_id)` from S-3.1.2
- Table: `exceptions` — columns: id, worker_id, week_id, day_date, explanation, status, created_at, updated_at

**Dependencies:** S-3.1.1, S-3.1.2, WP-0.3 (auth)

**Definition of Done:**
- [ ] POST endpoint implemented with all validations
- [ ] Unit tests for each validation path (6 error cases + 1 success)
- [ ] Integration test: submit → DB record created → state recomputed
- [ ] Input sanitization applied to explanation text

---

### S-3.2.2: Implement exception resubmission after rejection with audit trail

**Story:**
As an employee,
I want to resubmit an exception with a new explanation after my previous one was rejected,
So that I can provide additional context for my manager to reconsider.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 4
**Requirements:** FR-021, TR-003, FR-009, NFR-017

**Acceptance Criteria:**

```gherkin
Given my exception for Tuesday of Week 3 was rejected by my manager (with rejection note "Need more detail")
When I submit a new exception for Tuesday of Week 3 with updated explanation "Client meeting in Portland, attached email confirmation"
Then a NEW exception record is created with status="pending"
And the original rejected exception record is preserved with status="rejected" and the manager's rejection note intact
And the week state transitions from Red back to Yellow (Pending)

Given I have had an exception rejected for Week 3 Tuesday
When I query all exception records for Week 3 Tuesday
Then both the original rejected record and the new pending record are returned in chronological order
And the most recent (pending) record is identified as the active one

Given I have had an exception rejected and I resubmit
When the resubmission is saved
Then the old rejection record retains its original created_at, updated_at, and rejection note
And the new record has a fresh created_at timestamp

Given I have a pending (not yet reviewed) exception for Tuesday
When I attempt to submit another exception for Tuesday
Then the API returns 400 with error code "ALREADY_PENDING" and message "An exception is already pending for this day"

Given my PTO addition for Wednesday was rejected
When I resubmit PTO for Wednesday
Then the same resubmission flow applies (new record, old preserved, state recomputes)
```

**Technical Notes:**
- Resubmission creates a new row in `exceptions` table — never updates the rejected row
- The `exceptions` table supports multiple rows per (worker_id, week_id, day_date) — differentiated by created_at
- Active exception per day = latest record that is NOT status='rejected' (or the latest pending if any)
- Resubmission validation: must check there is no existing pending exception for the same day
- The rejected record and its linked `manager_actions` record are both preserved for audit (NFR-017)
- Same pattern applies for PTO resubmission (pto_additions table)

**Dependencies:** S-3.2.1 (exception submission)

**Definition of Done:**
- [ ] Resubmission creates new record; old preserved
- [ ] API prevents duplicate pending exception on same day
- [ ] Audit trail query returns all versions in chronological order
- [ ] Integration tests cover: reject → resubmit → new pending record

---

## WP-3.3: PTO Addition API

### S-3.3.1: Implement PTO addition endpoint with approval workflow

**Story:**
As an employee,
I want to add PTO days for specific days within a non-compliant week,
So that my manager can approve the PTO and my compliance status can be updated to Excused.

**Priority:** P0
**Effort:** S (0.5 day)
**Sprint:** 4
**Requirements:** FR-008, FR-009, FR-010, FR-035, FR-036, TR-012, BR-011

**Acceptance Criteria:**

```gherkin
Given I am an authenticated employee viewing a non-compliant (Red) week within the last 5 weeks
When I submit PTO for day_dates=["2026-02-27"] with days_added=1
Then a new pto_additions record is created with status="pending"
And the week state is recomputed from Red to Yellow (Pending)
And the API returns 201 with the new PTO record ID and updated week state

Given PTO is added for a week
When the week state is computed
Then PTO is treated identically to an exception — it triggers Yellow (Pending) and requires manager approval
And PTO does NOT auto-excuse the week

Given I have a pending exception on Monday and I add PTO for Wednesday (different day)
When both actions are saved
Then the week state is Orange (Multiple Actions Pending) because two action types are pending on different days

Given I attempt to add PTO for a week older than the 5 most recent
When the API processes the request
Then it returns 400 with error code "EDIT_WINDOW_EXPIRED"

Given a day already has a pending dispute
When I attempt to add PTO for that same day
Then the API returns 400 with error code "SAME_DAY_CONFLICT"

Given PTO is added successfully
When the database record is queried
Then it contains: worker_id, week_id, day_date, days_added, status="pending", created_at
```

**Technical Notes:**
- **Endpoint:** `POST /api/employees/me/actions` with body `{ "type": "pto", "week_id": "uuid", "day_dates": ["YYYY-MM-DD"], "days_added": 1 }`
- Shares the same endpoint as exceptions — discriminated by `type` field per AD-006
- PTO uses the `pto_additions` table (columns: id, worker_id, week_id, day_date, days_added, status, created_at, updated_at)
- Same validation pipeline as exceptions: 5-week window, same-day constraint, state check
- PTO follows identical approval workflow — manager must approve for Blue (Excused)
- Resubmission after rejection follows same pattern as S-3.2.2

**Dependencies:** S-3.1.1, S-3.1.2, S-3.2.1 (shared action model/endpoint)

**Definition of Done:**
- [ ] PTO submission endpoint implemented sharing exception infrastructure
- [ ] PTO creates pending record requiring approval
- [ ] All validation rules enforced (5-week window, same-day constraint)
- [ ] Tests verify PTO does NOT auto-excuse

---

## WP-3.4: Badge Dispute API

### S-3.4.1: Implement badge dispute submission endpoint

**Story:**
As an employee,
I want to dispute my badge count for specific days within a week,
So that my manager can review the dispute and potentially excuse my compliance gap without modifying the badge count.

**Priority:** P0
**Effort:** S (0.5 day)
**Sprint:** 4
**Requirements:** FR-007, FR-035, FR-036, TR-018, TR-012

**Acceptance Criteria:**

```gherkin
Given I am an authenticated employee viewing a week within the last 5 weeks
When I submit a dispute for day_dates=["2026-02-24"] with optional reason "Badge reader was broken on Monday"
Then a new disputes record is created with status="pending"
And the week state is recomputed — if only disputes are pending, state is Yellow

Given I have a pending exception on Tuesday and I submit a dispute for Thursday (different day)
When both actions exist
Then the week state is Orange (Multiple Actions Pending)

Given I attempt to submit a dispute for Tuesday and Tuesday already has a pending exception
When the API processes the request
Then it returns 400 with error code "SAME_DAY_CONFLICT" and message "Tuesday already has a pending exception; cannot add a dispute for the same day"

Given a dispute is approved by a manager
When the badge count is queried for that day
Then the original badge swipe count is NOT modified — only the compliance status changes

Given I attempt to submit a dispute for a week older than the 5 most recent
When the API processes the request
Then it returns 400 with error code "EDIT_WINDOW_EXPIRED"

Given the dispute is saved
When the record is queried
Then it contains: worker_id, week_id, day_date, reason (nullable), status="pending", created_at
```

**Technical Notes:**
- **Endpoint:** `POST /api/employees/me/actions` with body `{ "type": "dispute", "week_id": "uuid", "day_dates": ["YYYY-MM-DD"], "reason": "optional text" }`
- Shares the unified action endpoint — discriminated by `type` field
- Table: `disputes` (columns: id, worker_id, week_id, day_date, reason, status, created_at, updated_at)
- Reason text is optional (unlike exception explanation which is required)
- Same-day constraint enforced: cannot have dispute AND exception/PTO on same day (TR-018)
- Dispute approval does NOT change badge_swipes count — it only changes compliance state to Excused

**Dependencies:** S-3.1.1, S-3.1.2

**Definition of Done:**
- [ ] Dispute submission endpoint implemented
- [ ] Same-day constraint enforced against exceptions and PTO
- [ ] Badge count preserved after dispute approval
- [ ] Tests cover all validation paths

---

## WP-3.5: Manager Approval/Rejection API

### S-3.5.1: Implement manager approve and reject endpoints for all action types

**Story:**
As a manager,
I want to approve or reject pending exceptions, PTO additions, and badge disputes for my direct reports,
So that I can manage my team's compliance status and provide timely feedback.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 4
**Requirements:** FR-017, FR-018, FR-019, FR-020, BR-011, BR-005

**Acceptance Criteria:**

```gherkin
Given I am an authenticated manager and my direct report has a pending exception (ID: "exc-123")
When I call POST /api/manager/exceptions/exc-123/approve
Then the exception status changes to "approved"
And a manager_actions record is created with actor_id=my_id, target_type="exception", target_id="exc-123", action="approved", created_at timestamp
And the week state is recomputed (may become Blue if all actions resolved)
And the API returns 200 with {"action": "approved", "week_status": "<new_state>"}

Given I am a manager and my direct report has a pending exception (ID: "exc-456")
When I call POST /api/manager/exceptions/exc-456/reject with body {"note": "Please provide more detail"}
Then the exception status changes to "rejected"
And a manager_actions record is created with action="rejected", note="Please provide more detail"
And the week state is recomputed toward Red
And the API returns 200 with {"action": "rejected", "week_status": "<new_state>"}

Given I am a manager and my direct report has a pending dispute (ID: "disp-789")
When I approve the dispute
Then the dispute status changes to "approved"
And a manager_actions audit record is created with target_type="dispute"
And the badge swipe count value remains unchanged

Given I am a manager and my direct report has a pending PTO addition (ID: "pto-101")
When I approve the PTO
Then the PTO status changes to "approved"
And a manager_actions audit record is created with target_type="pto"

Given I attempt to approve an action for an employee who is NOT my direct report
When the API processes the request
Then it returns 403 with error code "NOT_DIRECT_REPORT"

Given the action ID does not exist or is not in "pending" status
When I attempt to approve or reject it
Then the API returns 404 or 400 respectively
```

**Technical Notes:**
- **Endpoints per design-inventory.md Section 3.1.3:**
  - `POST /api/manager/exceptions/{exceptionId}/approve`
  - `POST /api/manager/exceptions/{exceptionId}/reject` (body: `{"note": "optional"}`)
  - `POST /api/manager/disputes/{disputeId}/approve`
  - `POST /api/manager/disputes/{disputeId}/reject` (body: `{"note": "optional"}`)
  - `POST /api/manager/pto/{ptoId}/approve`
  - `POST /api/manager/pto/{ptoId}/reject` (body: `{"note": "optional"}`)
- Route handlers in `backend/app/api/manager_routes.py`
- Service logic in `backend/app/services/compliance_service.py` per component 1.1.7
- Validation: (1) auth + manager role, (2) isManagerOf check via HierarchyService, (3) action exists + is pending
- After approval/reject: update action status, create manager_actions audit record, call recompute_week_state
- `manager_actions` table columns: id, actor_id, week_id, target_type, target_id, action, note, created_at
- Rejection note stored in manager_actions.note — the note is associated with the action, not the exception itself
- Timestamp tracking enables BR-005 (manager review time measurement)

**Dependencies:** S-3.1.1, S-3.1.2, WP-2.2 (manager API with report verification)

**Definition of Done:**
- [ ] All 6 endpoints implemented (3 types x approve/reject)
- [ ] Manager_actions audit record created on every action
- [ ] Direct report validation enforced
- [ ] Integration tests: approve → state change, reject → state change + note preserved
- [ ] Tests cover all 3 action types

---

### S-3.5.2: Enforce self-approval prevention server-side

**Story:**
As a system administrator,
I want the API to reject any attempt by a manager to approve their own exceptions, disputes, or PTO,
So that the self-approval business rule is enforced regardless of UI behavior.

**Priority:** P0
**Effort:** S (0.5 day)
**Sprint:** 4
**Requirements:** TR-011, BR-012, FR-024

**Acceptance Criteria:**

```gherkin
Given Manager A (worker_id="mgr-a") has a pending exception (worker_id="mgr-a")
When Manager A calls POST /api/manager/exceptions/{id}/approve
Then the API returns 403 with error code "SELF_APPROVAL_FORBIDDEN" and message "Managers cannot approve their own actions"
And no manager_actions record is created
And the exception status remains "pending"

Given Manager A has a pending badge dispute (worker_id="mgr-a")
When Manager A calls POST /api/manager/disputes/{id}/approve
Then the API returns 403 with error code "SELF_APPROVAL_FORBIDDEN"

Given Manager A has a pending PTO addition (worker_id="mgr-a")
When Manager A calls POST /api/manager/pto/{id}/approve
Then the API returns 403 with error code "SELF_APPROVAL_FORBIDDEN"

Given Manager A has a pending exception
When Manager B (Manager A's manager) calls POST /api/manager/exceptions/{id}/approve
Then the approval succeeds (Manager B is not the exception owner)

Given Manager A attempts to reject their own exception
When the API processes the request
Then it returns 403 (self-approval prevention applies to both approve AND reject)
```

**Technical Notes:**
- Validation in the approval service: compare `request.user.worker_id` with the `worker_id` on the exception/dispute/PTO record
- This is a server-side check — UI may also hide self-approval buttons, but the API must enforce independently
- Applies to ALL action types: exceptions, disputes, PTO additions
- Applies to both approve AND reject actions (managers cannot make any decision on their own items)
- Design reference: design-ops.md Section 1.3 (self-approval prevention), AD-005

**Dependencies:** S-3.5.1 (approval endpoints)

**Definition of Done:**
- [ ] Self-approval check in approval service before any action processing
- [ ] Returns 403 for all 3 action types (exception, dispute, PTO)
- [ ] Returns 403 for both approve and reject
- [ ] Unit tests verify the check uses server-side comparison, not UI

---

### S-3.5.3: Validate action exists and is pending before approval

**Story:**
As a developer,
I want the approval API to validate that the target action exists and is in "pending" status,
So that managers cannot approve already-resolved or nonexistent actions.

**Priority:** P0
**Effort:** S (0.5 day)
**Sprint:** 4
**Requirements:** TR-013, FR-017, FR-019

**Acceptance Criteria:**

```gherkin
Given a manager attempts to approve an exception with a nonexistent ID
When the API processes the request
Then it returns 404 with error code "ACTION_NOT_FOUND"

Given a manager attempts to approve an exception that has already been approved
When the API processes the request
Then it returns 400 with error code "ACTION_ALREADY_RESOLVED" and message "This action has already been approved"

Given a manager attempts to reject an exception that has already been rejected
When the API processes the request
Then it returns 400 with error code "ACTION_ALREADY_RESOLVED" and message "This action has already been rejected"

Given a manager attempts to approve a dispute with an ID that belongs to an exception (wrong type)
When the API processes the request
Then it returns 404 (the dispute ID lookup finds nothing)
```

**Technical Notes:**
- Each endpoint looks up the action by ID and type-specific table (exceptions, disputes, pto_additions)
- Validation order in the approval chain: (1) action exists → 404 if not, (2) action.status == 'pending' → 400 if not, (3) self-approval check → 403, (4) direct report check → 403, (5) execute
- Return the current status in the error response so the client knows why it failed

**Dependencies:** S-3.5.1

**Definition of Done:**
- [ ] 404 returned for nonexistent actions
- [ ] 400 returned for already-resolved actions
- [ ] Tests cover each validation scenario per action type

---

## WP-3.6: Employee Action UI

### S-3.6.1: Implement unified action modal with day picker for exception, PTO, and dispute

**Story:**
As an employee,
I want a unified action modal where I can select days and submit exceptions, PTO additions, or badge disputes,
So that I can take corrective actions on my non-compliant weeks through a consistent interface.

**Priority:** P0
**Effort:** L (2-3 days)
**Sprint:** 4
**Requirements:** FR-007, FR-008, FR-009, FR-016, FR-035

**Acceptance Criteria:**

```gherkin
Given I view my compliance table and a week is within the last 5 weeks and is Red (Non-Compliant)
When I click an action button on that week row
Then a modal opens with: (1) day picker showing Mon-Sun for that week, (2) action type selector (Exception / Add PTO / Dispute Badge), (3) explanation text field

Given I select "Exception" as the action type
When the modal form is displayed
Then the explanation text field is required (cannot submit empty)

Given I select "Dispute Badge" as the action type
When the modal form is displayed
Then the reason text field is optional (can submit empty)

Given I select "Add PTO" as the action type
When the modal form is displayed
Then a PTO days input is shown and the field is required

Given I do not select any days in the day picker
When I click Submit
Then the form shows a validation error "Please select at least one day"

Given I select valid days and fill required fields
When I click Submit
Then the API is called and on success the modal closes, the table row updates its color to reflect the new state (Yellow or Orange), and a success message is shown

Given I view a week older than the 5 most recent
When the week row is rendered
Then no action button is displayed for that week

Given I view a week that is Green (Compliant) or Blue (Excused)
When the week row is rendered
Then no action button is displayed (or the button is disabled)
```

**Technical Notes:**
- Frontend components per design-architecture.md: `ActionModal`, `DayPicker`, `ExplanationTextField`
- Located in `frontend/src/components/` — ActionModal.tsx, DayPicker.tsx
- API call: `POST /api/employees/me/actions` with type discriminator
- After successful submission, refetch compliance data to update table colors
- Use React state to manage modal visibility, selected days, and action type
- Day picker renders Mon-Sun checkboxes based on week_start date from the compliance record
- 5-week window check: compare week_start against current date, disable action buttons for old weeks

**Dependencies:** S-3.2.1, S-3.3.1, S-3.4.1, WP-1.6 (employee view)

**Definition of Done:**
- [ ] Unified modal with day picker, action type selector, text field
- [ ] Form validation (at least one day, required fields per type)
- [ ] API integration with success/error handling
- [ ] Table row color updates after submission
- [ ] 5-week window enforced in UI (no buttons on old weeks)

---

### S-3.6.2: Implement same-day conflict prevention and resubmission UI

**Story:**
As an employee,
I want the action form to visually indicate days that have conflicts and allow me to resubmit after rejection,
So that I can understand which actions are available and correct rejected submissions.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 4
**Requirements:** FR-036, FR-021, FR-037

**Acceptance Criteria:**

```gherkin
Given Monday has a pending exception
When I open the action modal and select "Dispute Badge"
Then Monday is disabled/greyed out in the day picker with tooltip "Exception already pending for Monday"
And other days (Tue-Sun) remain selectable

Given Tuesday has a pending dispute
When I open the action modal and select "Exception"
Then Tuesday is disabled/greyed out with tooltip "Dispute already pending for Tuesday"

Given my exception for Wednesday was rejected with note "Need receipts"
When I view that week in my compliance table
Then a "Resubmit Exception" banner or button is visible on the week row
And the previous rejection note "Need receipts" is displayed

Given I click "Resubmit Exception" on a rejected week
When the action modal opens
Then it is pre-configured for exception type with the previously-rejected day pre-selected
And the explanation field is empty (I must write a new explanation)

Given a day's action was previously rejected (resolved)
When the day picker renders
Then that day is available for selection (rejected = resolved, not blocking)
```

**Technical Notes:**
- `SameDayConflictWarning` component per design-architecture.md
- `ResubmitExceptionBanner` component shown on weeks where status returned to Red after rejection
- Day picker queries existing actions for the week via the compliance API response (which includes `day_actions` array)
- Disable logic: for each day, check if there's a pending action of a conflicting type
- Resubmit flow: same API endpoint as new submission — the backend handles versioning (S-3.2.2)
- Display previous rejection note from `manager_actions` record linked to the rejected exception

**Dependencies:** S-3.6.1, S-3.2.2

**Definition of Done:**
- [ ] Conflicting days disabled in day picker with explanatory tooltips
- [ ] Resubmit banner shown on rejected weeks with rejection note
- [ ] Resubmit modal pre-configured correctly
- [ ] Rejected days available for new submissions
- [ ] Tests verify conflict detection and resubmit flow

---

### S-3.6.3: Ensure action modal accessibility and keyboard navigation

**Story:**
As an employee using keyboard navigation or assistive technology,
I want the action modal and day picker to be fully accessible,
So that I can submit exceptions, PTO, and disputes without requiring a mouse.

**Priority:** P1
**Effort:** S (0.5 day)
**Sprint:** 4
**Requirements:** NFR-018

**Acceptance Criteria:**

```gherkin
Given I press Tab from the compliance table action button
When the modal opens
Then focus moves to the first interactive element in the modal (day picker or action type selector)

Given the modal is open
When I press Escape
Then the modal closes without submitting

Given the day picker checkboxes are rendered
When I use Tab and Space/Enter keys
Then I can navigate between day checkboxes and toggle selection

Given a day is disabled due to a same-day conflict
When I Tab to it
Then the screen reader announces "Monday - disabled - Exception already pending"

Given the compliance status colors are displayed
When viewed
Then each color has an accompanying text label ("Compliant", "Non-Compliant", "Pending", "Multiple Pending", "Excused")
```

**Technical Notes:**
- Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on modal container
- Day picker checkboxes: `role="checkbox"`, `aria-checked`, `aria-disabled` with `aria-label` for each day
- Trap focus within modal while open (use react-focus-lock or equivalent)
- Status badges: use `StatusBadge` component with both color and text per design-architecture.md Shared components
- Color contrast must meet WCAG 2.1 AA (4.5:1 ratio)

**Dependencies:** S-3.6.1

**Definition of Done:**
- [ ] Modal is keyboard-navigable (Tab, Escape, Space/Enter)
- [ ] ARIA attributes on modal, day picker, and status badges
- [ ] Focus trapped within modal when open
- [ ] All status colors have text labels

---

## WP-3.7: Manager Action Review UI

### S-3.7.1: Implement action review panel in manager drill-down view

**Story:**
As a manager,
I want to see all pending actions (exceptions, PTO, disputes) grouped by day when I drill into a direct report's weekly detail,
So that I can review the context and approve or reject each action individually.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 5
**Requirements:** FR-017, FR-018, FR-019, FR-020, FR-021, FR-024, TR-015

**Acceptance Criteria:**

```gherkin
Given I am a manager and I drill into a direct report's weekly detail for a Yellow/Orange week
When the detail view loads
Then I see all pending actions grouped by day (e.g., "Monday: Exception - 'Business travel'", "Wednesday: Dispute")
And each pending action has Approve and Reject buttons

Given I click "Approve" on a pending exception
When a confirmation prompt appears and I confirm
Then the API is called, the action status updates to "approved"
And the week status badge updates in real-time (may change to Blue if all resolved)

Given I click "Reject" on a pending exception
When the rejection form appears
Then I can optionally enter a rejection note
And after confirming, the API is called and the action status updates to "rejected"

Given I am viewing the direct reports summary dashboard
When I look at the summary rows
Then NO approve/reject buttons are visible (approval only available after drill-down per FR-021)

Given an action has already been approved or rejected
When I view the detail
Then the resolved action shows its status and timestamp (no further action buttons)

Given I approve a pending action and the report also has another pending action of a different type
When the week state is recomputed
Then the dashboard pending count updates to reflect the remaining pending actions
```

**Technical Notes:**
- Frontend components per design-architecture.md: `ActionReview`, `DayActionList`, `ApproveRejectControls`
- Located in `frontend/src/components/` within the ReportDetail view
- API calls: `POST /api/manager/{type}/{id}/approve` or `/reject` per design-inventory.md Section 3.1.3
- After approval/rejection, refetch the employee detail data to update displayed state
- Rejection note field: `<textarea>` with optional text, submitted in the reject request body
- Group actions by day_date for clear visual hierarchy
- TR-015 enforcement: approve/reject buttons only render in the drill-down detail view component, not in the summary table component

**Dependencies:** S-3.5.1 (approval API), WP-2.4 (drill-down UI)

**Definition of Done:**
- [ ] Pending actions displayed grouped by day in drill-down view
- [ ] Approve/Reject buttons functional with confirmation
- [ ] Rejection note input captured and sent to API
- [ ] No approval buttons on summary dashboard view
- [ ] Real-time UI update after approval/rejection

---

### S-3.7.2: Display resolved action history and rejection notes in drill-down

**Story:**
As a manager,
I want to see the history of resolved actions (approved, rejected) including rejection notes,
So that I can understand the full context of an employee's compliance journey for a week.

**Priority:** P1
**Effort:** S (0.5 day)
**Sprint:** 5
**Requirements:** FR-018, FR-020, NFR-017, TR-003

**Acceptance Criteria:**

```gherkin
Given an employee had an exception rejected and then resubmitted
When I view the week detail
Then I see both the original rejection (with rejection note and timestamp) and the new pending exception
And they are ordered chronologically

Given an employee had a dispute approved last week
When I view that week's detail
Then I see the resolved dispute with status "Approved", approver name, and timestamp

Given an employee has multiple actions across different days (exception approved on Monday, dispute pending on Wednesday)
When I view the week detail
Then each day shows its action history separately with clear visual distinction between resolved and pending
```

**Technical Notes:**
- Query all exception/dispute/PTO records for the week (not just active ones) to build history
- Include linked `manager_actions` records to show who approved/rejected and when
- Display: action type, day, status, explanation/reason, manager note (if rejected), timestamps
- Resolved actions shown in a muted/collapsed style; pending actions highlighted
- PII consideration: manager name shown only to other managers (not in employee view)

**Dependencies:** S-3.7.1

**Definition of Done:**
- [ ] Full action history displayed per day in drill-down
- [ ] Rejection notes visible alongside rejected actions
- [ ] Chronological ordering of action versions
- [ ] Visual distinction between pending and resolved actions

---

## WP-3.8: Updated Pie Chart (5-State Grouping)

### S-3.8.1: Update pie chart to handle 5-state compliance model with proper grouping

**Story:**
As an employee or manager,
I want the compliance pie chart to correctly reflect the 5-state model by grouping Pending and Multiple Actions Pending into a single slice,
So that I can see an accurate visual summary of my compliance distribution.

**Priority:** P0
**Effort:** S (0.5 day)
**Sprint:** 5
**Requirements:** FR-005, FR-006, TR-014

**Acceptance Criteria:**

```gherkin
Given I have 10 Compliant weeks, 2 Excused weeks, 1 Non-Compliant week, 1 Pending (Yellow) week, and 1 Multiple Actions Pending (Orange) week in the 13-week view
When the pie chart renders
Then it shows 4 slices: Compliant=10, Excused=2, Pending=2 (Yellow+Orange combined), Non-Compliant=1

Given I expand the table to show 1 year of data (52 weeks)
When the pie chart re-renders
Then it reflects the full year data, not just the default 13 weeks

Given the pie chart legend is displayed
When I read the labels
Then each slice has a text label ("Compliant", "Excused", "Pending", "Non-Compliant") — not just color

Given I have 13 weeks all Compliant and no actions
When the pie chart renders
Then the Pending and Non-Compliant slices show 0 or are omitted (no empty wedges)

Given I submit an exception and the table refreshes
When the pie chart re-renders
Then the pie chart data reflects the updated week state (one fewer Non-Compliant, one more Pending)
```

**Technical Notes:**
- Update `CompliancePieChart` component in `frontend/src/components/CompliancePieChart.tsx`
- Backend pie chart API already returns grouped data per design-inventory.md: `{compliant, excused, pending, non_compliant}` where pending includes both Yellow and Orange
- If frontend computes pie data from table data, ensure PENDING and MULTIPLE_ACTIONS_PENDING map to the same "Pending" slice
- Pie chart uses Recharts library per tech stack
- Sync with table date range: pie chart data source must match the current `weeks` query parameter
- Accessible: legend with text labels, not just colors (NFR-018)
- Chart colors: Green (Compliant), Blue (Excused), Yellow (Pending combined), Red (Non-Compliant)

**Dependencies:** S-3.1.1 (all 5 states now active)

**Definition of Done:**
- [ ] Pie chart groups Yellow + Orange into single "Pending" slice
- [ ] Chart syncs with table date range (13-week default, expandable)
- [ ] Legend has accessible text labels
- [ ] Chart updates when compliance data changes

---

## WP-3.9: End-to-End Testing & Polish

### S-3.9.1: Implement end-to-end workflow tests for exception, PTO, and dispute flows

**Story:**
As a developer,
I want comprehensive end-to-end tests covering the full lifecycle of exception, PTO, and dispute workflows,
So that I can verify all state transitions, approvals, and rejections work correctly across the entire stack.

**Priority:** P0
**Effort:** L (2-3 days)
**Sprint:** 5
**Requirements:** NFR-015, NFR-017

**Acceptance Criteria:**

```gherkin
Given the test suite runs the "exception approval" e2e test
When the test executes: (1) employee logs in, (2) submits exception for Tuesday with explanation, (3) manager logs in, (4) drills into report, (5) approves exception
Then the final state is Blue (Excused) and an audit record exists with manager ID + timestamp

Given the test suite runs the "PTO rejection and resubmission" e2e test
When the test executes: (1) employee adds PTO for Wednesday, (2) manager rejects with note "Insufficient notice", (3) employee resubmits with new explanation, (4) manager approves
Then the final state is Blue (Excused), the rejection record (with note) is preserved, and the new approval record exists

Given the test suite runs the "upload preserves employee actions" e2e test
When the test executes: (1) employee submits exception, (2) admin uploads new badge data for the same week, (3) employee queries their compliance
Then the exception record is intact and the badge data is updated

Given the test suite runs the "concurrent actions → Orange state" e2e test
When the test executes: (1) employee submits exception for Monday, (2) employee submits dispute for Wednesday
Then the week state is Orange (Multiple Actions Pending)

Given the test suite runs the "self-approval prevention" e2e test
When a manager attempts to approve their own exception via API
Then the request is rejected with 403

Given the test suite runs the "5-week window enforcement" e2e test
When an employee attempts to submit an exception for the 6th most recent week
Then the request is rejected with 400

Given the test suite runs the "recursive drill-down" e2e test
When a Level 3 manager drills through 3 levels of hierarchy
Then each level loads correctly with proper breadcrumbs
```

**Technical Notes:**
- Backend e2e tests in `backend/tests/test_e2e_workflows.py` using pytest + httpx async test client
- Frontend e2e tests in `frontend/src/__tests__/e2e/` using vitest + testing-library (or Playwright if available)
- 7 distinct e2e workflow tests covering the major paths
- Each test creates its own test data (seed within test setup), authenticates as appropriate users, and verifies database state
- Use test fixtures that set up specific compliance states (Red, Yellow, Orange, Blue, Green)

**Dependencies:** All Phase 3 WPs

**Definition of Done:**
- [ ] All 7 e2e workflow tests implemented and passing
- [ ] Tests are independent (can run in any order)
- [ ] Each test verifies both API response AND database state

---

### S-3.9.2: Achieve code quality standards — linting and formatting pass

**Story:**
As a developer,
I want zero linting errors and zero formatting issues across the entire codebase,
So that the code meets Nordstrom engineering quality standards.

**Priority:** P1
**Effort:** S (0.5 day)
**Sprint:** 5
**Requirements:** NFR-016

**Acceptance Criteria:**

```gherkin
Given the backend codebase
When `ruff check .` is run from the backend/ directory
Then zero errors are reported

Given the backend codebase
When `ruff format --check .` is run
Then zero files need reformatting

Given the frontend codebase
When `npm run lint` is run from the frontend/ directory
Then zero ESLint errors are reported

Given the frontend codebase
When `npm run format -- --check` (Prettier) is run
Then zero files need reformatting
```

**Technical Notes:**
- Fix any linting/formatting issues introduced during Phase 3 development
- Run `ruff check . --fix` and `ruff format .` for auto-fixable Python issues
- Run `npx eslint --fix .` and `npx prettier --write .` for auto-fixable frontend issues
- Verify no new lint rules need to be configured for Phase 3 patterns (e.g., async generators, enum patterns)

**Dependencies:** All Phase 3 implementation stories

**Definition of Done:**
- [ ] `ruff check .` reports zero errors
- [ ] `ruff format --check .` reports zero changes needed
- [ ] `npm run lint` reports zero errors
- [ ] `npm run format -- --check` reports zero changes needed

---

### S-3.9.3: Verify performance benchmarks for all views

**Story:**
As a developer,
I want to verify that the application meets performance targets after Phase 3 additions,
So that the action submission and approval features don't degrade the user experience.

**Priority:** P0
**Effort:** M (1 day)
**Sprint:** 5
**Requirements:** NFR-011, NFR-012, NFR-013, NFR-014

**Acceptance Criteria:**

```gherkin
Given a logged-in employee with 13 weeks of data including weeks with day-level actions (exceptions, disputes, PTO)
When the Employee View loads
Then the page (table + pie chart + action buttons + day indicators) renders in < 2 seconds

Given the employee expands to 52 weeks of data
When the view refreshes
Then the page renders in < 3 seconds

Given a manager with 15 direct reports (some with pending actions)
When the Manager Dashboard loads
Then the summary table with pending counts renders in < 3 seconds

Given an admin uploads a file with ~4,264 rows
When the file is processed
Then processing completes in < 30 seconds including state recomputation for affected weeks

Given 50 simulated concurrent users
When accessing the application simultaneously
Then Employee View < 2s and Manager Dashboard < 3s targets are maintained
```

**Technical Notes:**
- Use pytest-benchmark or manual timing with httpx for API response times
- Use browser dev tools (Performance tab) or Lighthouse for frontend rendering times
- Performance concern: state recomputation adds queries per week — verify it doesn't create N+1 issues
- Consider adding `day_actions` to the compliance API response as a single join query rather than N separate queries
- Test with seed data that has the full ~328 employees x 13 weeks with mixed compliance states

**Dependencies:** All Phase 3 implementation stories

**Definition of Done:**
- [ ] Employee View < 2s with day-level action data
- [ ] Manager Dashboard < 3s with pending counts
- [ ] Upload < 30s with state recomputation
- [ ] Performance results documented

---

### S-3.9.4: Verify data integrity — uploads preserve employee actions and audit trail

**Story:**
As an HR admin,
I want confidence that uploading new badge data never destroys employee-submitted exceptions, disputes, PTO, or manager approval records,
So that the system maintains a complete and accurate compliance history.

**Priority:** P0
**Effort:** M (1 day)
**Sprint:** 5
**Requirements:** NFR-017, TR-007

**Acceptance Criteria:**

```gherkin
Given Employee A has submitted an exception for Week 3 (status: pending)
When a new badge data upload includes Employee A Week 3 with updated badge counts
Then the exception record (with explanation text, status, timestamp) is fully preserved
And the badge data is updated with the new values

Given Employee B had an exception rejected for Week 2 (manager note: "Need documentation") and then resubmitted
When a badge data upload runs for Week 2
Then all exception versions (rejected + pending) AND the manager_actions rejection record are preserved

Given a sequence of 5 badge data uploads occurs over time
When the database is queried for Employee C Week 1
Then all employee-generated data (exceptions, disputes, PTO, approvals) from every prior period is intact

Given Employee D appears in badge data but NOT in worker data
When the upload processes
Then Employee D's row is skipped and a warning is logged
And no other records are affected

Given an audit query for Employee B Week 2
When all records are retrieved
Then exception versions are in chronological order with version numbers, statuses, and timestamps
And manager_actions records link to the correct exception versions
```

**Technical Notes:**
- Upload uses UPSERT on `compliance_weeks` (keyed on worker_id + week_start) — only badge data fields are updated
- Employee-generated data lives in separate tables (exceptions, disputes, pto_additions, manager_actions) — untouched by upload
- Verify with integration tests: create action → upload → query action → assert preserved
- Test with the actual upload API endpoint, not just unit tests
- Verify foreign key integrity: after upload, all FKs from exceptions/disputes/pto to compliance_weeks still resolve

**Dependencies:** S-3.9.1 (uses similar test patterns)

**Definition of Done:**
- [ ] Upload integration tests verify action preservation
- [ ] Multi-upload sequence test passes
- [ ] Audit trail query returns complete history
- [ ] FK integrity maintained after upload

---

### S-3.9.5: Achieve minimum 80% test coverage and create README

**Story:**
As a developer,
I want the combined codebase to have at least 80% unit test coverage and a comprehensive README,
So that the project meets quality standards and is easy for new developers to set up and run.

**Priority:** P0
**Effort:** M (1-2 days)
**Sprint:** 5
**Requirements:** NFR-015, BR-001, BR-002, BR-003, BR-004

**Acceptance Criteria:**

```gherkin
Given the backend test suite
When `pytest --cov=app --cov-report=term-missing` is run
Then overall coverage is >= 80%
And the state machine module (core/state_machine.py) has 100% coverage

Given the frontend test suite
When `npm test -- --coverage` is run
Then overall coverage is >= 80%

Given each API endpoint
When integration tests are counted
Then every endpoint has at least one happy-path test and one error-case test

Given the project README.md
When it is read
Then it includes: project description, prerequisites, installation steps (backend + frontend), how to run locally, how to run tests, how to lint, and a brief usage guide

Given a new developer follows the README
When they execute the setup commands
Then the application starts locally within 5 minutes (per TR-017)
```

**Technical Notes:**
- Use `pytest --cov` for backend coverage and `vitest --coverage` for frontend
- Gaps to focus on: ensure Phase 3 services (state machine, approval, submission) have comprehensive tests
- State machine module should have 100% coverage — it's the business logic core
- README.md at project root — include: description, prerequisites, setup, running, testing, linting, usage examples
- Reference design-architecture.md Section 6 for setup commands
- BR-001/002/003 are verified by the existence of the working application itself
- BR-004 (employee engagement) verified by the existence of action submission tracking with timestamps

**Dependencies:** All Phase 3 stories

**Definition of Done:**
- [ ] Backend >= 80% coverage
- [ ] Frontend >= 80% coverage
- [ ] State machine module at 100% coverage
- [ ] README.md created with complete setup instructions
- [ ] New developer can follow README to run app in < 5 minutes
