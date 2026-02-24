# Product Requirements Document — Outbound Scan Compliance

> **Project Name:** Outbound Scan Compliance Tracker
> **Author:** Supply Chain Engineering
> **Date:** 2026-02-24
> **Status:** Draft
> **Squad:** Scan Compliance Squad

---

## 1. Product Overview

### Vision
Provide real-time visibility into outbound scan compliance at Supply Chain fulfillment centers, ensuring every pallet and LPN is scanned when loaded into trailers, and enabling rapid remediation when scans are missed.

### Problem Statement
In Supply Chain outbound operations, pallets and Licensed Plate Numbers (LPNs) must be scanned when loaded into trailers to maintain inventory accuracy, enable shipment tracking, and comply with retailer requirements. Currently, scan compliance is tracked via delayed batch reports from the Warehouse Management System (WMS), which means missed scans aren't discovered until hours after the trailer has departed. This leads to inventory discrepancies, shipment tracking failures, customer impact, and costly manual reconciliation. Operations supervisors have no real-time view of loading compliance and cannot intervene during the loading process.

### Target Users
| Persona | Role | Key Need |
|---------|------|----------|
| Dock Associate | Loads pallets/LPNs into trailers, performs scans | See real-time scan status for their assigned trailer to catch missed scans before the trailer departs |
| Dock Supervisor | Oversees loading operations for a shift | View compliance across all active trailers and doors on their shift; receive alerts for missed scans |
| Operations Manager | Manages fulfillment center operations | View compliance dashboards by shift, by facility, and over time; identify systemic issues |
| Inventory Control | Reconciles inventory discrepancies | Access missed scan details to perform targeted remediation instead of full physical counts |

---

## 2. Goals & Success Metrics

### Goals
1. **Primary:** Enable real-time scan compliance visibility during outbound loading operations
2. **Secondary:** Reduce time to detect and remediate missed scans from hours to minutes
3. **Tertiary:** Improve overall scan compliance rate across fulfillment centers

### Success Metrics
| Metric | Current State | Target | Measurement Method |
|--------|--------------|--------|-------------------|
| Scan compliance rate | ~92% (estimated) | ≥ 99% within 3 months of launch | Scanned LPNs / Total LPNs loaded per trailer |
| Time to detect missed scan | 4-8 hours (batch report) | ≤ 5 minutes (real-time) | Time between load event and missed scan alert |
| Remediation completion rate | ~60% (manual tracking) | ≥ 95% within 24 hours | Remediated scans / Total missed scans |
| Inventory reconciliation effort | 40 hours/week per facility | ≤ 10 hours/week per facility | Hours logged for reconciliation tasks |

---

## 3. Scope

### In Scope
- Real-time scan compliance dashboard showing status per trailer, per door, per shift
- Integration with WMS for scan events (Kafka event stream)
- Comparison of expected vs. actual scans per trailer
- Missed scan detection and alerting within 5 minutes of loading completion
- Remediation workflow: mark missed scans as remediated with reason and action taken
- Compliance reporting by trailer, shift, facility, and date range
- Historical compliance data (rolling 30 days for real-time, 1 year for reporting)
- Mobile-responsive web interface for dock floor use (tablets)

### Out of Scope
- Modifying the WMS scan process itself (we consume events, not change the scanning workflow)
- Handheld scanner firmware or hardware changes
- Automated remediation (system shows what needs to be done; humans take the action)
- Cross-facility aggregated dashboards (v1 is per-facility; cross-facility in future)
- Carrier/retailer-facing compliance reports (internal use only for v1)

### Future Considerations
- Cross-facility compliance dashboard for SC leadership
- Predictive analytics for scan compliance (identify at-risk trailers before loading completes)
- Integration with carrier systems for end-to-end tracking
- Automated remediation workflows (e.g., triggering re-scan events in WMS)

---

## 4. User Stories (High Level)

### Dock Associate
- As a dock associate, I want to see the scan status of every LPN for the trailer I'm loading, so that I can catch and fix missed scans before the trailer departs.
- As a dock associate, I want to be alerted immediately when a scan is missed on my trailer, so that I can rescan the item right away.

### Dock Supervisor
- As a dock supervisor, I want a real-time view of scan compliance across all active trailers on my shift, so that I can prioritize attention to trailers with compliance issues.
- As a dock supervisor, I want to assign remediation tasks to dock associates when scans are missed, so that issues are resolved promptly.
- As a dock supervisor, I want to see end-of-shift compliance summary, so that I can hand off any outstanding issues to the next shift.

### Operations Manager
- As an operations manager, I want to see compliance trends over time by shift and by facility, so that I can identify systemic issues and measure improvement.
- As an operations manager, I want to be alerted when a shift's compliance rate drops below threshold, so that I can investigate and intervene.

### Inventory Control
- As an inventory control analyst, I want to see all missed scans with trailer, LPN, and timestamp details, so that I can perform targeted remediation instead of broad physical counts.
- As an inventory control analyst, I want to mark missed scans as remediated with an action record, so that there's an audit trail of how each issue was resolved.

---

## 5. Functional Requirements

### Workflows

**Workflow 1: Real-Time Scan Monitoring**
1. WMS publishes scan events to Kafka (topic: `outbound.scan.events`)
2. System consumes scan events and correlates them with expected shipment manifest
3. For each trailer, system calculates: expected scans, completed scans, missing scans
4. Dashboard updates in real-time (≤ 30 second refresh)
5. Color coding: Green (100% scanned), Yellow (≥ 95% scanned), Red (< 95% scanned)

**Workflow 2: Missed Scan Detection and Alert**
1. When a trailer's loading is marked complete in WMS (via Kafka event: `outbound.trailer.sealed`)
2. System compares expected scans (from shipment manifest) vs. actual scans received
3. If any scans are missing, system generates a missed scan alert
4. Alert sent to dock supervisor via in-app notification and Slack
5. Alert includes: trailer ID, door number, count of missed scans, list of missed LPN IDs

**Workflow 3: Remediation**
1. Dock supervisor or inventory control views missed scans for a trailer
2. For each missed scan, they can:
   - **Rescan** — LPN was rescanned; mark as remediated with scan timestamp
   - **Manual Verify** — LPN was physically verified; mark as remediated with verifier name
   - **Exception** — LPN was damaged, short-shipped, etc.; mark as exception with reason
3. Remediation action recorded with user, timestamp, and action type
4. Trailer compliance status updates after remediation

**Workflow 4: Compliance Reporting**
1. Operations manager selects date range and filters (facility, shift, door, trailer)
2. System displays: compliance rate over time, missed scan trends, remediation rates
3. Can drill down: facility → shift → door → trailer → individual LPNs
4. Can export reports as CSV for further analysis
5. End-of-shift summary auto-generated and available for supervisor handoff

### Business Rules
- A trailer is "compliant" when 100% of expected LPNs have been scanned
- Expected LPN list comes from the shipment manifest (WMS event: `outbound.manifest.published`)
- Scan events must be correlated by trailer ID and LPN ID
- A trailer's compliance window starts when the first scan for that trailer is received and ends 30 minutes after the trailer sealed event
- If no sealed event is received within 8 hours of first scan, the trailer is flagged as "loading incomplete"
- Remediation must be completed within 24 hours of missed scan detection; after that, it escalates to operations manager
- Shift boundaries are configurable per facility (default: Day 6AM-2PM, Swing 2PM-10PM, Night 10PM-6AM)
- Compliance rate calculation: (Scanned LPNs + Remediated LPNs) / Expected LPNs × 100

### Data Requirements
- **Manifest data:** trailer ID, door number, facility ID, expected LPN list, shift, timestamp (from WMS Kafka events)
- **Scan events:** LPN ID, trailer ID, scan timestamp, scanner ID, facility ID (from WMS Kafka events)
- **Trailer events:** trailer ID, event type (loading started, sealed, departed), timestamp (from WMS Kafka events)
- **Remediation data:** missed scan ID, trailer ID, LPN ID, action type, action by (user), action timestamp, reason/notes
- **Reference data:** facility list, shift schedules, compliance thresholds (configurable)

---

## 6. Non-Functional Requirements

### Security
- Authentication via Nordstrom SSO (SAML/OIDC)
- RBAC with 4 roles: Dock Associate (read own trailers), Dock Supervisor (read/write for shift), Operations Manager (read all, configure), Inventory Control (read all, remediate)
- No PII in this system (LPN IDs, trailer IDs, and scanner IDs are not PII)
- Audit logging for all remediation actions
- API endpoints require authenticated session

### Performance
- Scan event processing latency: ≤ 5 seconds from Kafka event to dashboard update
- Dashboard load: ≤ 3 seconds for facility-wide view (up to 50 active trailers)
- Support 200 concurrent users per facility (dock associates + supervisors)
- Kafka consumer must handle burst of up to 1,000 scan events per second per facility

### Scalability
- Support 10 fulfillment centers simultaneously
- Support up to 500 trailers loaded per facility per day
- Support up to 50,000 LPN scans per facility per day
- 30-day hot data retention, 1-year warm storage for reporting

### Observability
- Structured JSON logging with correlation IDs (correlate by trailer ID across events)
- Health and readiness endpoints
- SLIs: event processing latency, dashboard response time, error rate
- Business metrics: scan compliance rate, missed scan count, remediation rate
- Alerts: Kafka consumer lag > 1000, event processing latency > 10s, error rate > 1%

---

## 7. Technical Constraints

### Existing Systems
- **WMS (Warehouse Management System)** — Source of truth for scan events, manifests, and trailer events. Publishes to Kafka topics. We consume only — no write access.
- **Kafka Cluster** — Standard Nordstrom Kafka platform. Topics are pre-defined by WMS team. We create our own consumer group.
- **Nordstrom SSO** — Standard authentication integration.
- **Notification Service** — For Slack alerts. Standard REST API.

### Tech Stack
- **Frontend:** React 18+ with TypeScript, responsive design for tablets, WebSocket for real-time updates
- **Backend:** Node.js 20+ with Express/Fastify (aligns with team expertise)
- **Database:** PostgreSQL 15+ for relational data, Redis for real-time dashboard state
- **Messaging:** Kafka consumer for WMS events, Kafka producer for internal events
- **Infrastructure:** Standard Kubernetes with Helm charts

### Infrastructure
- Deploy to standard Nordstrom K8s platform
- CI/CD via GitHub Actions
- Staging and production environments per facility
- Redis cluster for real-time state caching
- WebSocket support for real-time dashboard updates

---

## 8. Dependencies & Risks

### Dependencies
| Dependency | Owner | Status | Impact if Delayed |
|-----------|-------|--------|-------------------|
| WMS Kafka scan events access | WMS Team | Available | Cannot receive scan data — blocks core functionality |
| WMS Kafka manifest events access | WMS Team | Needs configuration | Cannot determine expected scans — blocks compliance calculation |
| WMS trailer sealed events | WMS Team | Available | Cannot trigger missed scan detection — blocks alerting |
| Kafka consumer group provisioning | Platform Team | Needs provisioning | Cannot consume events — blocks all functionality |
| Redis cluster provisioning | Cloud Platform | Needs provisioning | No real-time caching — degrades dashboard performance |
| PostgreSQL database | Data Platform | Needs provisioning | Cannot persist data — blocks all functionality |

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WMS event schema changes without notice | Medium | High | Implement schema validation; subscribe to WMS team change notifications |
| Kafka consumer lag during peak loading hours | Medium | Medium | Auto-scaling consumer pods; monitor lag with alerts |
| Inaccurate manifests from WMS (wrong expected LPN count) | Low | High | Display manifest source and timestamp; allow supervisor override |
| Dock associates resistant to new tablet-based workflow | Medium | Medium | Involve dock team in UX design; make interface dead simple |
| Network connectivity issues on dock floor | Medium | Medium | Offline-capable dashboard with sync; use facility WiFi assessment |

---

## 9. Timeline & Milestones

| Milestone | Target Sprint | Description |
|-----------|--------------|-------------|
| M1: Foundation | Sprint 1-2 | Infrastructure, CI/CD, Kafka consumer, core data model, health endpoints |
| M2: Real-Time Dashboard | Sprint 3-4 | Scan event processing, real-time trailer compliance view, WebSocket updates |
| M3: Alerting & Detection | Sprint 5 | Missed scan detection, notifications, supervisor alert workflow |
| M4: Remediation | Sprint 6 | Remediation workflow, audit trail, status tracking |
| M5: Reporting | Sprint 7 | Historical compliance reports, shift summaries, data export |
| M6: Hardening | Sprint 8 | Performance testing, failure handling, monitoring, dock floor UX testing |

---

## 10. Open Questions

| # | Question | Owner | Status | Answer |
|---|----------|-------|--------|--------|
| 1 | What is the exact Kafka topic schema for scan events? Do we have an Avro schema? | WMS Team | Open | — |
| 2 | How do we determine which dock associate is assigned to which trailer/door? | Operations | Open | — |
| 3 | Should the system support multiple facilities from day 1, or roll out one at a time? | Product Owner | Open | — |
| 4 | What is the WiFi reliability on the dock floor? Do we need offline support? | Facilities/IT | Open | — |
| 5 | Can we get historical scan data for backfill and testing? | WMS Team | Open | — |
| 6 | What compliance threshold triggers an alert to operations manager? (95%? 90%?) | Operations Manager | Open | — |
