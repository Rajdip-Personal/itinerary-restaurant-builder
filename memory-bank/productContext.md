# Product Context

## Problem Statement
Nordstrom Supply Chain has a 4-day/week RTO policy. Badge scan data exists (shared as Excel by leadership) and leave data exists in Workday, but nothing connects them. Employees on approved PTO show as "non-compliant" in raw badge reports. Employees also mark OOO on their Outlook calendars, but that data isn't used either. Reporting is manual, inaccurate, and time-consuming.

## User Personas
- **Employee:** Doesn't want daily check-ins. PTO and sick already in Workday. OOO already on calendar. Only wants to interact for rare edge cases (approved WFH). Wants ability to backfill past dates they missed.
- **Manager:** Needs consolidated team compliance view without cross-referencing spreadsheets. Approves/rejects only manual exceptions (WFH, Other) — Workday leave is already approved.
- **Director/VP:** Uploads badge scan Excel, clicks refresh, sees dashboards. Drill-down from org to individual. Wants to spot where badge data and employee records don't align.
- **HR Partner:** Needs accurate, reconciled compliance data for policy enforcement discussions.

## Business Context
- 4-day RTO policy for majority of employees
- Badge scan data is the company source of truth for physical presence
- Workday is the company source of truth for formal leave (PTO, sick, etc.)
- Outlook calendar is where employees informally track OOO/absences
- Company calendar provides holiday dates
- Manual exceptions are the last resort for anything not in the above systems

## Key Decisions Made During PRD Refinement
- (2026-02-24) Badge data ingested via Excel upload, NOT real-time badge API
- (2026-02-24) Exception-only model — employees do NOT check in daily
- (2026-02-24) Employees CAN backfill past dates (up to 30 days)
- (2026-02-24) Org hierarchy from OKTA / Microsoft Graph — no custom org API
- (2026-02-24) HRIS = Workday. Added as auto-sync data source for leave records.
- (2026-02-24) Outlook calendar OOO added as supplementary data source via Microsoft Graph
- (2026-02-24) 5-source priority: Badge > Workday > Calendar > Holiday > Manual
- (2026-02-24) Workday and Calendar are complementary — Workday has formal leave, Calendar catches informal/same-day absences
- (2026-02-24) No sprint-level timeline estimates — milestones only, squad determines pacing

<!-- Updated: 2026-02-24 -->
