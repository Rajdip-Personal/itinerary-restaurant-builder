# Project Brief

## Vision
An internal web application that provides a single source of truth for Return-to-Office compliance, enabling employees to track their own status, managers to monitor their teams, and HR to manage compliance data — replacing manual Excel-based tracking.

## Goals
1. Reduce manual compliance tracking effort — replace spreadsheet-based tracking with self-service web app
2. Improve manager visibility into team compliance — real-time dashboard with actionable exception/dispute workflows
3. Provide a single source of truth for RTO data — centralize compliance data, exceptions, disputes, and approvals with audit trail

## Scope

### In Scope
- Employee View: weekly compliance table (13-week default), pie chart, dispute/exception/PTO actions (last 5 weeks)
- Manager View: own compliance + direct reports dashboard with recursive drill-down and approval workflows
- Admin Upload Screen: Excel file upload with append/upsert behavior
- 5-state compliance model (Compliant / Single Action Pending / Multiple Actions Pending / Non-Compliant / Excused)
<!-- Updated: 2026-03-07 — expanded from 4-state to 5-state per gap #5 resolution -->
- Role-based access (Employee, Manager, Admin/HR)
- Email-based authentication (interim for POC)

### Out of Scope
- Contingent Workers, exempt employees (At Home)
- HR View (Screen 4), Okta SSO, Notifications, Live data feed — all deferred

## Target Users

| Persona | Key Need |
|---------|----------|
| Employee | View own weekly compliance, dispute badge counts, add PTO, submit exceptions |
| Manager | Monitor direct reports' compliance, approve exceptions/disputes, drill into org hierarchy |
| Admin / HR | Upload RTO compliance data (Excel files) into the system |

## Success Metrics

| Metric | Target |
|--------|--------|
| Employee weekly engagement rate | 70% of tracked employees check status weekly |
| Average manager exception review time | < 48 hours from submission to action |
| Data completeness | 100% of eligible employees have data within 24 hours of upload |
