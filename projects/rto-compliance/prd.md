# Product Requirements Document — RTO Compliance App

> **Project Name:** Return-to-Office Compliance Tracker
> **Author:** Supply Chain Engineering
> **Date:** 2026-02-24
> **Status:** Draft
> **Squad:** RTO Squad

---

## 1. Product Overview

### Vision
Give Supply Chain leadership a single view of return-to-office compliance by combining company-tracked badge scan data, HRIS leave records (Workday), employee calendar events (Outlook OOO/PTO), company holidays, and employee-reported exceptions — so compliance is measured automatically and employees only interact with the system for the rare absence not already captured by existing company systems.

### Problem Statement
Nordstrom Supply Chain has a 4-day-per-week return-to-office policy. The company already tracks badge scans at office entries, and executive leadership periodically shares this data as Excel files. However, there is no system that reconciles badge data against the leave data that already exists in Workday, the OOO/PTO events employees put on their Outlook calendars, company holidays, and other legitimate exceptions. Managers have no consolidated view. Leadership manually cross-references spreadsheets. Even though PTO and sick leave are already tracked in Workday, and employees routinely mark OOO on their calendars, nobody is connecting any of that data to badge scans — so employees who were on approved PTO or had an OOO block on their calendar show up as "non-compliant" in raw badge reports. The result: compliance reporting is manual, inaccurate, and time-consuming.

### Target Users
| Persona | Role | Key Need |
|---------|------|----------|
| Employee | Individual contributor in Supply Chain | Only interact when needed — PTO/sick auto-pulled from Workday, OOO auto-pulled from Outlook calendar. Fix past missed entries for edge cases only. |
| Manager | Direct manager with reports | View team compliance combining badge data + Workday leave + calendar OOO + exceptions. Approve/reject manual exceptions. |
| Director/VP | Senior leadership over multiple teams | Upload badge scan Excel, view compliance dashboards reconciling badge data vs. exceptions by org |
| HR Partner | HR business partner supporting SC teams | Access compliance data for policy discussions with accurate, reconciled data |

---

## 2. Goals & Success Metrics

### Goals
1. **Primary:** Reconcile company badge scan data, Workday leave records, Outlook calendar OOO events, company holidays, and manual exceptions to produce accurate RTO compliance reporting
2. **Secondary:** Minimize employee effort — PTO/sick auto-pulled from Workday, OOO auto-detected from Outlook calendar; employees only interact for the rare gap not already covered
3. **Tertiary:** Give leadership self-service dashboards with drill-down from org to individual

### Success Metrics
| Metric | Current State | Target | Measurement Method |
|--------|--------------|--------|-------------------|
| Compliance data accuracy | Unknown (manual spreadsheets) | ≥ 95% of employee-days have a resolved status (badge scan OR exception) | Resolved days / total business days |
| Employee friction | N/A | Exceptions submitted in ≤ 30 seconds | Frontend timing metrics |
| Leadership reporting effort | Hours per week (manual Excel) | ≤ 5 minutes (upload + refresh) | Self-reported |
| Exception backfill rate | 0% (no system) | ≥ 90% of missed exceptions backfilled within 1 week | Backfilled entries / total unresolved gaps |

---

## 3. Scope

### In Scope
- **Badge data upload:** Leadership uploads an Excel file with badge scan data; system ingests and stores it
- **Workday leave data integration:** Automatically pull approved PTO, sick leave, and other leave types from Workday — employees do NOT need to manually re-enter leave
- **Outlook calendar integration:** Read employee calendar via Microsoft Graph to detect OOO (Out of Office) and PTO events — covers cases where employees mark time off on their calendar but it isn't yet in Workday
- **Exception-only employee input:** Employees only submit manual exceptions for the rare absence not captured by Workday or their calendar — no daily check-in required
- **Past date backfill:** Employees can submit exceptions for past dates they missed
- **Company calendar integration:** Fetch company holidays automatically so holiday days are excluded from compliance calculations
- **Org structure from OKTA / Microsoft Graph:** Pull manager-report relationships, team, and department from identity provider — no custom org API
- **Reconciliation engine:** Match badge scan data + Workday leave + Outlook calendar OOO + company holidays + manual exceptions to determine each employee-day status (In Office / Excused / Non-Compliant / Unresolved)
- **Manager approval workflow:** Managers approve/reject manual exception submissions (WFH, Other) for their direct reports
- **Compliance dashboards:** Drill-down from org → department → team → individual, showing reconciled compliance
- **Refresh on upload:** When leadership uploads a new badge scan file, dashboards recalculate immediately
- **4-day RTO policy** as the default (configurable)

### Out of Scope
- Real-time badge scan integration (we ingest Excel uploads, not live badge streams)
- Automated policy enforcement or consequences
- Mobile native app (responsive web only)
- Workday leave balance display (we pull leave dates, not remaining balances)

### Future Considerations
- Real-time badge scan API integration to eliminate Excel uploads
- Predictive compliance analytics
- Desk booking integration
- Google Calendar support (for teams not on Outlook)

---

## 4. User Stories (High Level)

### Employee
- As an employee, I want my PTO and sick days automatically pulled from Workday so that I don't have to re-enter leave I've already requested.
- As an employee, I want my OOO and PTO calendar events automatically detected from Outlook so that absences I've marked on my calendar are accounted for without extra work.
- As an employee, I want to only interact with the app for the rare absence not in Workday or my calendar, so that my day isn't disrupted.
- As an employee, I want to submit an exception for a past date I missed, so that my compliance record is accurate even if I forgot to log it at the time.
- As an employee, I want to see my own compliance calendar showing badge scans, Workday leave, calendar OOO, holidays, and my manual exceptions, so that I know where I stand.

### Manager
- As a manager, I want to see my team's compliance combining badge scans, Workday leave, calendar OOO, and manual exceptions, so that I have the full picture without cross-referencing spreadsheets.
- As a manager, I want to approve or reject manual exception submissions (WFH, Other) from my direct reports, so that I can validate legitimacy.
- As a manager, I want to be notified when a report has unresolved days (no badge scan, no Workday leave, no calendar OOO, and no exception), so that I can follow up.

### Director/VP
- As a director, I want to upload a badge scan Excel file and click refresh to see updated compliance across my org, so that reporting is self-service.
- As a VP, I want to drill down from org-level compliance to individual employee detail, so that I can identify patterns and address issues.
- As a director, I want the system to show me where badge data and employee records (Workday + calendar + exceptions) don't align, so that I can investigate discrepancies.

### HR Partner
- As an HR partner, I want to view an employee's full compliance history (badge scans + Workday leave + calendar OOO + manual exceptions + approvals), so that I have accurate data for policy discussions.

---

## 5. Functional Requirements

### Workflows

**Workflow 1: Badge Data Upload & Reconciliation**
1. Director/VP logs in and navigates to "Upload Badge Data"
2. Selects an Excel file (.xlsx) containing badge scan records
3. Expected columns: Employee ID, Date, Badge Scan Timestamp (one row per scan event)
4. System validates the file format and displays a preview (row count, date range, employee count)
5. User confirms upload; system ingests data and stores it
6. System runs reconciliation against **all data sources** for each employee-day in the uploaded range:
   - **Check 1: Badge scan data** — Did the employee badge in?
   - **Check 2: Workday leave data** — Does Workday show approved PTO, sick, or other leave for this date?
   - **Check 3: Outlook calendar** — Does the employee's calendar show an OOO or PTO event for this date?
   - **Check 4: Company calendar** — Is this date a company holiday?
   - **Check 5: Manual exceptions** — Did the employee submit a manual exception (WFH, Other)?
7. Based on reconciliation, each employee-day gets a status:
   - **In Office** — Badge scan exists for that day
   - **Excused (Workday)** — Workday shows approved leave (auto-resolved, no employee action needed)
   - **Excused (Calendar)** — Outlook calendar shows OOO/PTO event (auto-resolved, no employee action needed)
   - **Excused (Holiday)** — Company holiday (auto-resolved)
   - **Excused (Manual)** — Approved manual exception (WFH, Other)
   - **Pending** — Manual exception submitted but not yet approved by manager
   - **Non-Compliant** — No data from any source justifies the absence
   - **Unresolved** — Data gap that may need employee to backfill
8. Dashboards refresh with reconciled data
9. Subsequent uploads for overlapping date ranges update (not duplicate) existing data

**Workflow 1a: Workday Leave Data Sync**
1. System syncs approved leave data from Workday on a scheduled basis (daily) and on-demand during reconciliation
2. For each employee, pulls: leave type (PTO, Sick, Bereavement, etc.), start date, end date, approval status
3. Only approved/completed leave records are used — pending Workday requests are ignored
4. Workday data is stored locally and refreshed daily to capture new approvals and cancellations
5. If an employee has both a badge scan and Workday leave on the same day, badge scan takes precedence (they came in despite having leave — counts as In Office)

**Workflow 1b: Outlook Calendar OOO Sync**
1. System reads employee calendars via Microsoft Graph API on a scheduled basis (daily) and on-demand during reconciliation
2. Looks for calendar events with: Show As = "Out of Office" or "Away", or events with keywords "PTO", "OOO", "Vacation", "Out of Office" in the subject
3. All-day OOO events count as a full-day absence; partial-day OOO events are flagged but not auto-excused (employee may have been in office part of the day)
4. Calendar data is stored locally and refreshed daily
5. Calendar OOO is treated as a **supplementary source** — it fills gaps where Workday doesn't have a record (e.g., employee marked OOO on calendar for a same-day sick call but hasn't entered it in Workday yet)
6. If both Workday and calendar have data for the same day, Workday is the authoritative source (calendar is the fallback)

**Workflow 2: Employee Exception Submission (Manual — Only When Needed)**
1. Employee logs in; landing page shows their compliance calendar view
2. Calendar highlights:
   - **Green** — In office (badge scanned)
   - **Blue** — Workday leave (PTO/sick auto-pulled — no action needed)
   - **Teal** — Calendar OOO (auto-detected from Outlook — no action needed)
   - **Gray** — Company holiday (auto-resolved — no action needed)
   - **Yellow** — Manual exception submitted (pending or approved)
   - **Red** — Unresolved (no badge scan, no Workday leave, no calendar OOO, no exception — action may be needed)
3. Employee clicks on a red day (or any past/current date) to submit a manual exception
4. Selects exception type: WFH, Other (PTO and Sick are normally covered by Workday and calendar — if both are missing a record, employee can select PTO/Sick here as a manual override)
5. If "Other," a reason field appears (required, max 500 characters)
6. Employee submits; status changes to Pending (yellow) until manager approves
7. Employee can submit exceptions for **past dates** (backfill) and **current date** — not future dates
8. Employee can edit a pending or rejected exception and resubmit
9. **Key point:** On days where Workday or Outlook calendar already shows approved leave / OOO, the calendar shows blue or teal and the employee does NOT need to take any action

**Workflow 3: Manager Approval (Manual Exceptions Only)**
1. Manager logs in; sees team dashboard with pending manual exceptions highlighted
2. HRIS-sourced leave (PTO, Sick) does NOT require manager approval in this app (it was already approved in the HRIS)
3. For each pending manual exception (WFH, Other), manager can: Approve or Reject (with reason)
4. Approved exceptions change the employee-day status to "Excused (Manual)"
5. Rejected exceptions change status back to "Non-Compliant" (employee can resubmit with different info)
6. Manager is notified (email/Teams) when new manual exceptions are submitted by their reports

**Workflow 4: Compliance Dashboard**
1. Director/VP logs in and sees org-wide compliance dashboard
2. Summary cards: overall compliance rate, exception breakdown, unresolved count
3. Table view: by team, by department — showing compliance rate, in-office days, excused days, non-compliant days
4. Drill down: org → department → team → individual employee calendar view
5. Date range filter (default: current week, options: last week, last month, custom range)
6. Export as CSV

### Business Rules
- **4-day RTO policy:** Employees are expected in the office 4 days per week (Monday–Friday). This is configurable per group if needed.
- **Compliance calculation:** Compliance % = (In Office days + Excused days) / (Business days − Company holidays) × 100 per week
- **Weekly compliance:** An employee is "compliant" for a week if they were in office ≥ 4 days (or the configured target, minus holidays that week)
- **Data source priority (highest to lowest):**
  1. **Badge scan** — Always counts as "In Office," even if other sources show leave that day
  2. **Workday leave** — Approved PTO/sick from Workday automatically counts as "Excused" — no employee or manager action needed
  3. **Outlook calendar OOO** — All-day OOO/PTO event on employee's calendar counts as "Excused" — catches absences not yet in Workday
  4. **Company holiday** — Automatically counts as "Excused"
  5. **Manual exception** — Employee-submitted WFH/Other, requires manager approval
  6. **Nothing** — No data from any source → "Unresolved" (employee should backfill)
- **Workday leave is auto-excused.** PTO and sick leave pulled from Workday require no action from the employee or manager in this app.
- **Calendar OOO is auto-excused.** Full-day OOO events detected from Outlook require no action. Partial-day OOO events are flagged for review but not auto-excused.
- **Deduplication:** If both Workday and Outlook calendar show an absence for the same day, only one "Excused" record is created. Workday is the authoritative label.
- **Manual approval required** only for WFH and Other exception types submitted by employees.
- **Backfill allowed:** Employees can submit manual exceptions for any past date within the last 30 days
- **No future exceptions:** Employees cannot pre-submit exceptions for future dates
- **Manager hierarchy** determines visibility: managers see direct reports; directors see all employees in their org tree
- **Upload replaces date range:** When badge data is uploaded for a date range that already has data, the new upload replaces the old data for that range
- **Sync frequency:** Daily automated sync of both Workday leave data and Outlook calendar OOO events; on-demand refresh during badge data upload reconciliation

### Data Requirements
- **Badge scan data** (from Excel upload): employee ID, date, scan timestamp
- **Employee data** (from OKTA / Microsoft Graph): employee ID, display name, email, manager, department, team
- **Workday leave data** (from Workday API): employee ID, leave type (PTO/Sick/Bereavement/etc.), start date, end date, approval status, last synced timestamp
- **Calendar OOO data** (from Microsoft Graph — Outlook): employee ID, event date, event subject, show-as status (OOO/Away), all-day flag, last synced timestamp
- **Exception data** (manual, user-submitted): exception ID, employee ID, date, type (WFH/Other — PTO/Sick also allowed as manual override if both Workday and calendar are missing the record), reason, submitted timestamp, status (pending/approved/rejected), reviewer ID, review timestamp, review notes
- **Holiday calendar** (from company calendar API): date, holiday name, applicable locations
- **Reconciled compliance data** (computed): employee ID, date, status (In Office/Excused-Workday/Excused-Calendar/Excused-Holiday/Excused-Manual/Pending/Non-Compliant/Unresolved), source (badge/workday/calendar/holiday/manual-exception)

---

## 6. Non-Functional Requirements

### Security
- Authentication via Nordstrom SSO (SAML/OIDC) backed by OKTA
- RBAC with 4 roles: Employee, Manager, Director/VP, HR Partner
- Role assignments derived from OKTA / Microsoft Graph (managers = anyone with direct reports)
- PII protection: employee names and emails masked in logs, encrypted at rest
- Uploaded Excel files must be scanned for malware and validated before processing
- Manager can only see data for employees in their direct org tree
- Audit log for all approvals, rejections, uploads, and data changes

### Performance
- Exception submission API: ≤ 200ms p95
- Badge data upload processing: ≤ 60 seconds for 10,000 rows
- Dashboard load: ≤ 2 seconds for org-wide view (up to 5,000 employees)
- Support 500 concurrent users

### Scalability
- Support up to 10,000 employees
- 1 year of compliance data retention
- Dashboard aggregations pre-computed for sub-second response

### Observability
- Structured JSON logging with correlation IDs
- Health and readiness endpoints
- SLIs: availability, latency, error rate
- Alerts for: upload processing failure, error rate > 1%, dashboard latency > 3s

---

## 7. Technical Constraints

### Existing Systems & Integrations
| System | Integration Method | What It Provides |
|--------|--------------------|------------------|
| **OKTA** | OIDC/SCIM API | Authentication, user profiles, manager-report relationships |
| **Microsoft Graph API** | REST (OAuth2) | Org hierarchy, Outlook calendar OOO events, Teams notifications |
| **Workday** | REST API (RaaS / SOAP) | Approved PTO, sick leave, bereavement, and other leave records per employee |
| **Company Calendar** | REST API or iCal feed | Company holidays and office closures |
| **Nordstrom SSO** | SAML 2.0 / OIDC | Single sign-on for all users |
| **Email / Microsoft Teams** | Microsoft Graph API | Notifications for approvals, pending exceptions, compliance alerts |
| **Badge Scan Data** | Excel file upload (.xlsx) | Historical badge entry records per employee per day |

### Tech Stack
- **Frontend:** React 18+ with TypeScript, standard Nordstrom component library
- **Backend:** Java 17+ with Spring Boot 3.x
- **Database:** PostgreSQL 15+
- **File Processing:** Apache POI (Excel parsing) or similar
- **Infrastructure:** Standard Kubernetes with Helm charts
- **Messaging:** Kafka for async processing (upload ingestion, report generation)

### Infrastructure
- Deploy to standard Nordstrom K8s platform
- CI/CD via GitHub Actions
- Secrets via Vault / K8s secrets

---

## 8. Dependencies & Risks

### Dependencies
| Dependency | What We Need | Impact if Unavailable |
|-----------|-------------|----------------------|
| OKTA API access | Read user profiles and manager relationships via SCIM | Cannot determine org hierarchy — must fall back to Microsoft Graph |
| Microsoft Graph API access | Org hierarchy, Outlook calendar OOO events, Teams notifications | Cannot read employee calendars or send Teams notifications — calendar OOO source lost, fall back to email |
| Workday API access | Read approved leave records (PTO, sick, etc.) per employee | Workday leave source lost — calendar OOO still works as partial fallback; employees must manually enter PTO/sick for gaps |
| Microsoft Graph calendar permissions | Calendars.Read (application) or delegated per-user consent | Cannot read employee OOO events — Workday still covers formal leave; manual entry for same-day absences |
| Company Calendar API/feed | Holiday dates for compliance calculations | Must manually configure holidays — tedious but not blocking |
| SSO integration | User authentication | Blocks all access — hard dependency |
| PostgreSQL database | Data persistence | Blocks all functionality — hard dependency |
| K8s namespace | Deployment target | Blocks deployment — hard dependency |

**Note:** OKTA and Microsoft Graph both provide org hierarchy. We need access to at least one. Having both gives us redundancy and richer data.

**Note:** Workday and Outlook calendar are **complementary** leave sources. Workday has formal approved leave. Outlook catches informal/same-day absences (employee marks OOO on calendar before Workday is updated). Together they cover nearly all absences. If only one is available, the app still works — the other source plus manual exceptions fills the gap.

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Badge scan Excel format varies across uploads | Medium | Medium | Strict column validation with clear error messages; provide template |
| OKTA org data doesn't match actual reporting structure | Medium | Medium | Allow admin override of manager assignments in the app |
| Employees don't backfill past exceptions | Medium | Low | Reduced impact since Workday + calendar cover most absences; very few unresolved days remain. Manager nudge notifications. |
| Workday leave data incomplete or delayed | Medium | Medium | Outlook calendar OOO fills the gap; employees can also manually submit as fallback; reconciliation deduplicates when Workday catches up |
| Workday API access delayed or unavailable | Medium | Medium | Outlook calendar OOO still covers many absences; manual entry as last resort — app is functional, just more friction |
| Calendar OOO events inconsistent (employees don't mark OOO) | Medium | Low | Calendar is supplementary — Workday is primary; employees who don't mark OOO and don't have Workday leave get flagged as unresolved |
| Graph API calendar permissions require admin consent | Medium | Medium | Work with IT to get Calendars.Read application permission; fall back to delegated per-user consent if needed |
| Large Excel uploads slow down processing | Low | Low | Async processing with progress indicator; chunked parsing |

---

## 9. Milestones

Milestones represent deliverable increments. Sprint count and velocity are squad-dependent — the squad determines pacing during sprint planning.

| Milestone | What's Delivered |
|-----------|-----------------|
| **M1: Foundation** | Infrastructure, CI/CD, SSO auth, OKTA/Graph org sync, database schema, health endpoints, structured logging |
| **M2: Badge Upload & Reconciliation** | Excel upload, parsing, storage, Workday leave data sync, Outlook calendar OOO sync, company calendar holiday integration, reconciliation engine combining all data sources, basic compliance calculation |
| **M3: Employee Exceptions** | Manual exception submission (WFH, Other, and PTO/sick fallback for gaps), past-date backfill, employee compliance calendar view, manager approval workflow, notifications |
| **M4: Dashboards & Reporting** | Leadership compliance dashboards, drill-down by org/team/individual, date filtering, CSV export, upload-triggered refresh |
| **M5: Hardening** | Performance testing, security review, monitoring/alerting, edge case handling, documentation |

---

## 10. Open Questions

| # | Question | Owner | Status | Answer |
|---|----------|-------|--------|--------|
| 1 | Which OKTA scopes/claims do we need for manager relationships, and is SCIM provisioning already enabled? | Identity Team | Open | — |
| 2 | What is the exact format of the badge scan Excel that leadership currently uses? Can we get a sample file? | Executive Leadership | Open | — |
| 3 | What Workday API access is available for leave records — REST, RaaS, SOAP? Do we need a Workday integration partner? | HRIS / HR Technology Team | Open | — |
| 4 | What leave types exist in Workday? (PTO, Sick, Bereavement, Jury Duty, etc.) Which should count as "Excused"? | HR Leadership | Open | — |
| 5 | Should HR Partners have write access (e.g., add accommodations) or read-only? | HR Leadership | Open | — |
| 6 | Are there employee groups with different RTO targets (e.g., 3 days instead of 4)? | VP of SC Operations | Open | — |
| 7 | Where does the company holiday calendar live — is there an API, an iCal feed, or a SharePoint list? | HR / IT | Open | — |
| 8 | How far back should backfill be allowed? (Current: 30 days) | Product Owner | Open | — |
| 9 | Should the system support delegation (when a manager is on PTO, can their backup approve)? | Product Owner | Open | — |
| 10 | Is Workday leave data available in near-real-time, or is there a delay (e.g., nightly batch)? This affects same-day PTO accuracy. | HRIS / HR Technology Team | Open | — |
| 11 | Do we need admin consent for Microsoft Graph Calendars.Read permission, or can we use delegated per-user consent? | IT / Identity Team | Open | — |
| 12 | What Outlook calendar event patterns do employees actually use for OOO? (Show As = OOO? Keywords in subject? Automatic replies?) | Product Owner / Sample survey | Open | — |
