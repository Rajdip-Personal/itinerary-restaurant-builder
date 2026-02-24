# Project Brief

## Vision
RTO Compliance Tracker — reconcile badge scan data, Workday leave, Outlook calendar OOO, company holidays, and manual exceptions to give Supply Chain leadership accurate return-to-office compliance reporting with minimal employee effort.

## Goals
1. Reconcile 5 data sources (badge scans, Workday, Outlook calendar, holidays, manual exceptions) into a single compliance view
2. Minimize employee interaction — only needed for absences not already in Workday or their calendar
3. Self-service dashboards for leadership with drill-down from org to individual

## Scope

### In Scope
- Badge scan data ingestion via Excel upload
- Workday leave data sync (PTO, sick, bereavement, etc.)
- Outlook calendar OOO event detection via Microsoft Graph
- Company holiday calendar integration
- Manual exception submission (WFH, Other) with past-date backfill
- Manager approval workflow for manual exceptions only
- Reconciliation engine with 5-source priority: Badge > Workday > Calendar > Holiday > Manual
- Compliance dashboards with org drill-down
- 4-day RTO policy (configurable)

### Out of Scope
- Real-time badge scan integration (Excel upload only)
- Automated policy enforcement
- Mobile native app
- Workday leave balance display

## Target Users
- Employee — logs exceptions only when needed (rare)
- Manager — views team compliance, approves manual exceptions
- Director/VP — uploads badge data, views dashboards
- HR Partner — accesses compliance data for policy discussions

## Success Metrics
- ≥ 95% of employee-days resolved (badge scan OR excused)
- Exceptions submitted in ≤ 30 seconds
- Leadership reporting effort ≤ 5 minutes (upload + refresh)
- ≥ 90% of missed exceptions backfilled within 1 week

<!-- Updated: 2026-02-24 -->
