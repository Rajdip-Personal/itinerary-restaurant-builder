# Phase 3A: Operational Readiness — User Stories

**Project:** APP00344 Enterprise Routing Service (ERS)
**Phase:** 3A — High-Priority Documentation & Cleanup
**Sprint:** Sprint 5
**Generated:** 2026-02-25

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 12 |
| Total Story Points | 28 |
| Sprint | Sprint 5 |
| Epics | 4 |
| Work Packages | WP-3.1, WP-3.2, WP-3.3, WP-2.4 (moved to 3A) |

## Story Map

| Epic | Sprint 5 |
|------|----------|
| EPIC-4: Runbook & Incident Response | US-401, US-402, US-403 |
| EPIC-5: SLI/SLO & Monitoring | US-501, US-502, US-503 |
| EPIC-6: Design Document | US-601, US-602, US-603, US-604 |
| EPIC-7: TODO/FIXME Remediation | US-701, US-702, US-703 |

## Requirements Coverage (Phase 3A)

| Requirement | Stories | Status |
|-------------|---------|--------|
| BR-004 (Reduced Incident Response Time) | US-401, US-402, US-403, US-501, US-502, US-503 | Covered |
| FR-009 (Runbook Generation) | US-401, US-402, US-403 | Covered |
| FR-010 (SLI/SLO Definition) | US-501, US-502, US-503 | Covered |
| FR-005 (Design Doc — Current State) | US-601, US-602 | Covered |
| FR-006 (Design Doc — Target State) | US-603 | Covered |
| FR-008 (Splunk Query Index) | US-401 | Covered |
| NFR-005 (SLI/SLO Monitoring) | US-501, US-502, US-503 | Covered |
| NFR-006 (Alerting with Runbooks) | US-402, US-503 | Covered |
| NFR-007 (Monitoring Dashboard) | US-502 | Covered |
| NFR-014 (Distributed Tracing) | US-604 | Covered |
| TR-009 (TODO/FIXME Remediation) | US-701, US-702, US-703 | Covered |

---

## EPIC-4: Runbook & Incident Response (WP-3.1)

### US-401: Create Alert Documentation with Splunk Queries

**Story:**
As an on-call engineer,
I want a documented runbook entry for each common ERS alert scenario with symptoms, impact, diagnosis steps, and Splunk queries,
So that I can quickly investigate and remediate production issues without relying on tribal knowledge.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 5
**Requirements:** FR-009, FR-008, BR-004, NFR-006

**Acceptance Criteria:**

```gherkin
Given the ERS runbook document exists at docs/runbook.md,
When an on-call engineer looks up the "High Error Rate" alert,
Then the entry contains: symptom ("5xx responses exceed 5% over 5 min"), impact ("customer routing failures, potential order delays"), diagnosis steps (check Splunk error logs, identify failing external service, check circuit breaker state), remediation steps, and a working Splunk query (index=prod_logs service=routing-service level=ERROR).

Given the runbook covers all 6 common alert scenarios,
When I count the documented alerts,
Then the following are each present: high latency (p95 > 1000ms), high error rate (5xx > 5%), circuit breaker open, Redis connection failure, Kafka publish failure, and pod crash loop.

Given each alert entry in the runbook,
When I review the Splunk query section,
Then each alert has at least one Splunk query that can be copied and run directly in Splunk to find relevant logs.
```

**Technical Notes:**
- **Output File:** `docs/runbook.md` (new)
- **Splunk Query Index:** Also captured in `docs/splunk-queries.md` (new)
- **Alert Scenarios:** 6 documented in detailed design Section 2.6 (Alerting table):
  - High Error Rate: 5xx > 5% over 5 min (P1, PagerDuty)
  - High Latency: p95 > 1000ms over 5 min (P1, PagerDuty)
  - Circuit Breaker Open: any CB in OPEN state (P2, Slack)
  - Redis Connection Failure: pool exhausted or timeout (P1, PagerDuty)
  - Kafka Publish Failure: publish error rate > 1% (P2, Slack)
  - Pod Crash Loop: RestartCount > 3 in 10 min (P1, PagerDuty)
- **Splunk Queries:** Base patterns from execution plan WP-3.1:
  - Error logs: `index=prod_logs service=routing-service level=ERROR`
  - Latency: `index=prod_logs service=routing-service | stats p50(duration), p95(duration), p99(duration)`
  - Correlation ID: `index=prod_logs correlationId={id}`
- **Integrations:** Splunk (log queries), DataDog/New Relic (dashboard links)
- **Security:** No credentials or secrets in runbook. Reference env var names only.

**Definition of Done:**
- [ ] `docs/runbook.md` contains all 6 alert entries with symptom/impact/diagnosis/remediation/Splunk query
- [ ] `docs/splunk-queries.md` contains indexed Splunk queries organized by use case
- [ ] Each alert entry links to the monitoring dashboard
- [ ] Peer-reviewed by at least one on-call engineer
- [ ] Published to Confluence and linked from ERS home page

---

### US-402: Write Troubleshooting Playbooks for Common Failure Modes

**Story:**
As an on-call engineer,
I want step-by-step troubleshooting playbooks for common ERS failure modes,
So that I can follow a structured investigation process and resolve incidents faster.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 5
**Requirements:** FR-009, NFR-006, BR-004

**Acceptance Criteria:**

```gherkin
Given an incident where ERS returns 500 errors,
When the on-call engineer opens the "Request returns 500 error" playbook,
Then it contains a step-by-step investigation flow: (1) check Splunk for error logs with correlation ID, (2) identify which external service call failed, (3) check circuit breaker state in metrics dashboard, (4) verify Redis connectivity, (5) check Kafka producer health, (6) escalate if root cause is external.

Given a latency spike incident,
When the on-call engineer opens the "Latency spike" playbook,
Then it includes: checking p95/p99 metrics on the dashboard, identifying which endpoint is slow, checking external service call latency breakdown (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS), checking Redis command latency for both GEO and Capacity clusters, and recommended remediation actions (restart pods, increase replicas, escalate to dependency owner).

Given any troubleshooting playbook,
When I review its structure,
Then each playbook includes a decision tree with clear branch points, Splunk queries at each investigation step, and explicit escalation criteria.
```

**Technical Notes:**
- **Output File:** `docs/runbook.md` (append troubleshooting section)
- **Playbooks to include (4 minimum):**
  1. "Request returns 500 error" — trace through controller -> processor -> external client
  2. "Latency spike" — identify bottleneck across 9 external services and 2 Redis clusters
  3. "Kafka publishing stuck" — check producer health, topic connectivity, OAuth token refresh
  4. "Redis connection pool exhausted" — check pool metrics (min 20, max 200 per cluster), connection leak diagnosis
- **Data Model:** Reference ERS architecture: Controllers (6) -> Processors -> Domain Clients -> External Services (9)
- **Integrations:** Splunk, DataDog/New Relic dashboards, PagerDuty alerts
- **External Dependencies:** PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS

**Definition of Done:**
- [ ] 4 troubleshooting playbooks written with step-by-step investigation flows
- [ ] Each playbook includes Splunk queries and dashboard references
- [ ] Decision trees have clear branch points and escalation criteria
- [ ] Peer-reviewed by at least one on-call engineer
- [ ] Published to Confluence

---

### US-403: Document Escalation Paths and Incident Response Contacts

**Story:**
As an on-call engineer,
I want documented escalation paths from L1 through L4 with contact information and escalation criteria,
So that I know exactly who to contact and when to escalate during a production incident.

**Priority:** P1
**Story Points:** 1
**Sprint:** Sprint 5
**Requirements:** FR-009, BR-004

**Acceptance Criteria:**

```gherkin
Given a production incident affecting ERS,
When the on-call engineer needs to escalate,
Then the runbook defines 4 escalation levels: L1 (on-call engineer via PagerDuty), L2 (squad lead via Slack #supply-chain-routing), L3 (platform team for K8s/Redis/Kafka infrastructure issues), L4 (external service owners for PCS/ETA/MLP dependency issues).

Given an escalation path entry,
When I review the L3 escalation for Redis issues,
Then it includes: the specific Slack channel or PagerDuty rotation for the platform team, what information to include in the escalation (cluster name — GEO or Capacity, error type, timeline, Splunk query results), and expected response time.
```

**Technical Notes:**
- **Output File:** `docs/runbook.md` (append escalation section)
- **Escalation Levels:**
  - L1: On-call engineer (PagerDuty rotation)
  - L2: Squad lead (Slack #supply-chain-routing)
  - L3: Platform team (K8s, Redis, Kafka infrastructure)
  - L4: External service owners (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS)
- **Alert Channels:** PagerDuty for P1 alerts, Slack #supply-chain-routing for P2/P3
- **Security:** No personal phone numbers or emails in committed docs — reference PagerDuty rotations and Slack channels only

**Definition of Done:**
- [ ] Escalation paths L1-L4 documented with contact channels
- [ ] Escalation criteria defined for each level
- [ ] Information requirements listed for each escalation
- [ ] Peer-reviewed by squad lead
- [ ] Published to Confluence

---

## EPIC-5: SLI/SLO Definition & Monitoring (WP-3.2)

### US-501: Define SLIs and SLOs for ERS

**Story:**
As an SRE,
I want formally defined Service Level Indicators and Objectives for ERS based on current performance baselines,
So that the team has measurable targets for availability, latency, and error rate with clear breach thresholds.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 5
**Requirements:** FR-010, NFR-005, BR-004

**Acceptance Criteria:**

```gherkin
Given the SLI/SLO definition document,
When I review the availability SLO,
Then it defines: SLI formula as "1 - (5xx_count / total_count)", SLO target of >= 99.9% (allowing 43 minutes downtime per month), measurement window of rolling 30 days, and the metric source (ers.routing.request.count and ers.routing.error.count).

Given the SLI/SLO definition document,
When I review the latency SLOs,
Then it defines: p95 latency < 500ms and p99 latency < 1000ms for all routing endpoints (/evaluateLocations, /extendRoute, /evaluateLastNode), with the metric source as ers.routing.request.duration histogram.

Given the SLI/SLO definition document,
When I review the error rate SLO,
Then it defines: error rate < 1% of requests returning 5xx, measured as a percentage of total requests over a rolling 30-day window.
```

**Technical Notes:**
- **Output File:** `docs/sli-slo-definition.md` (new)
- **SLIs and SLOs (from detailed design Section 2.6):**
  - Availability: `1 - (5xx_count / total_count)` >= 99.9%
  - Latency (p95): `ers.routing.request.duration` (p95) < 500ms
  - Latency (p99): `ers.routing.request.duration` (p99) < 1000ms
  - Error Rate: `5xx_count / total_count` < 1%
  - Throughput: `ers.routing.request.count` per second (tracked, no threshold)
- **Metrics Sources:** StatsD (DataDog) and New Relic APM (already publishing metrics)
- **Key Metrics from Design:**
  - `ers.routing.request.count` (Counter: endpoint, status, method)
  - `ers.routing.request.duration` (Histogram: endpoint, status)
  - `ers.routing.error.count` (Counter: endpoint, error_type)
- **Open Question:** OQ-004 asks whether existing DataDog dashboards exist — SRE team should confirm before building from scratch

**Definition of Done:**
- [ ] SLI/SLO document covers availability, latency (p95/p99), error rate, throughput
- [ ] Each SLI has a concrete formula, metric source, and measurement window
- [ ] Each SLO has a numeric target and error budget calculation
- [ ] Document reviewed by SRE team
- [ ] Published to Confluence

---

### US-502: Create ERS Monitoring Dashboard

**Story:**
As an SRE,
I want a monitoring dashboard in DataDog/New Relic showing RED metrics, resource utilization, and dependency health for ERS,
So that I can observe system health at a glance and detect issues before they breach SLOs.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 5
**Requirements:** NFR-005, NFR-007, BR-004

**Acceptance Criteria:**

```gherkin
Given the ERS monitoring dashboard,
When I view the RED metrics section,
Then it shows: request rate (requests per second per endpoint), error rate (5xx percentage per endpoint), and latency (p50/p95/p99 per endpoint) for all 3 routing endpoints (/evaluateLocations, /extendRoute, /evaluateLastNode).

Given the ERS monitoring dashboard,
When I view the dependency health section,
Then it shows: Redis GEO cluster connection health and command latency, Redis Capacity cluster connection health and command latency, Kafka producer lag and publish error rate, and external service call latency and error rates for each of the 9 dependencies (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS).

Given the ERS monitoring dashboard,
When I view the resource utilization section,
Then it shows: CPU utilization per pod, memory usage per pod, pod count (current vs desired), and circuit breaker state for each external service.
```

**Technical Notes:**
- **Output File:** `docs/monitoring-dashboard-config.json` (new — dashboard-as-code definition)
- **Dashboard Sections (from detailed design NFR-007):**
  1. RED Metrics: request rate, error rate, latency per endpoint
  2. Resource Utilization: CPU, memory, pod count
  3. Dependency Health: Redis (GEO + Capacity), Kafka producer, external services
  4. SLO Burn Rate: availability and latency burn rate indicators
- **Metrics (from detailed design Section 2.6):**
  - `ers.routing.request.count`, `ers.routing.request.duration`, `ers.routing.error.count`
  - `ers.external.call.duration`, `ers.external.call.error`, `ers.circuit_breaker.state`
  - `ers.redis.connection.active`, `ers.redis.command.duration`
  - `ers.kafka.publish.count`, `ers.kafka.publish.duration`, `ers.kafka.publish.error`
- **Integrations:** DataDog (StatsD metrics), New Relic APM
- **Open Question:** OQ-004 — check for existing DataDog dashboards before creating new ones

**Definition of Done:**
- [ ] Dashboard config documented or created in DataDog/New Relic
- [ ] RED metrics panels populated with live data
- [ ] Dependency health panels show all 9 external services and 2 Redis clusters
- [ ] Resource utilization panels show CPU, memory, pod count
- [ ] Dashboard URL added to runbook (`docs/runbook.md`)
- [ ] Reviewed by SRE team

---

### US-503: Configure SLO-Based Alerting Rules

**Story:**
As an SRE,
I want alert rules configured based on SLO burn rates that fire before SLOs are breached,
So that the team is notified proactively and can take corrective action within the error budget.

**Priority:** P1
**Story Points:** 1
**Sprint:** Sprint 5
**Requirements:** NFR-005, NFR-006, BR-004

**Acceptance Criteria:**

```gherkin
Given the SLO-based alerting configuration,
When the availability SLO burn rate exceeds the threshold (consuming error budget faster than the monthly allocation),
Then a P1 alert fires to PagerDuty with the message including current availability percentage, burn rate, remaining error budget, and a link to the runbook section "runbook#availability".

Given the alerting configuration,
When I review all configured alerts,
Then every alert (high error rate, high latency, circuit breaker open, Redis failure, Kafka failure, pod crash loop, low availability) includes: a link to the corresponding runbook section, the PagerDuty or Slack channel it routes to (P1 -> PagerDuty, P2/P3 -> Slack #supply-chain-routing), and the condition threshold that triggers it.
```

**Technical Notes:**
- **Output Files:** Alert rule configs in `docs/monitoring-dashboard-config.json` (append), `docs/runbook.md` (update with alert-to-runbook links)
- **Alert Rules (from detailed design Section 2.6):**
  - High Error Rate: 5xx > 5% over 5 min -> P1 PagerDuty -> `runbook#high-error-rate`
  - High Latency: p95 > 1000ms over 5 min -> P1 PagerDuty -> `runbook#high-latency`
  - Circuit Breaker Open: any CB OPEN -> P2 Slack -> `runbook#circuit-breaker`
  - Redis Connection Failure: pool exhausted/timeout -> P1 PagerDuty -> `runbook#redis-failure`
  - Kafka Publish Failure: error rate > 1% -> P2 Slack -> `runbook#kafka-failure`
  - Pod Crash Loop: RestartCount > 3 in 10 min -> P1 PagerDuty -> `runbook#pod-crash`
  - Low Availability: SLO burn rate > threshold -> P1 PagerDuty -> `runbook#availability`
- **Channels:** PagerDuty (P1), Slack #supply-chain-routing (P2/P3)
- **Integrations:** DataDog Monitors or New Relic Alert Policies

**Definition of Done:**
- [ ] All 7 alert rules documented with condition, severity, channel, and runbook link
- [ ] Burn rate alerting configured for availability SLO
- [ ] Each alert links to the correct runbook section in `docs/runbook.md`
- [ ] Alert configs reviewed by SRE team
- [ ] Tested with synthetic threshold breaches in nonprod

---

## EPIC-6: Design Document (WP-3.3)

### US-601: Document Current State Architecture

**Story:**
As a squad engineer,
I want a comprehensive document of ERS's current state architecture including system context, components, and integration patterns,
So that I have a single source of truth for understanding how the system works today.

**Priority:** P0
**Story Points:** 5
**Sprint:** Sprint 5
**Requirements:** FR-005, BR-001, BR-006

**Acceptance Criteria:**

```gherkin
Given the design document's current state section,
When I review the system context,
Then it includes a system context diagram showing ERS with all inbound callers (COM, Merch Search) and all outbound dependencies: 9 external services (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS), 2 Redis clusters (GEO, Capacity), and 3 Kafka producer topics (inventory-routing-decision-made-avro, NAP events, routing insights).

Given the design document's current state section,
When I review the component inventory,
Then it documents all 21 REST endpoints with method, path, controller, and description; all 6 controllers; the processor layer; the domain client layer; and the architecture flow: Controllers -> Processors -> Domain Clients -> External Services.

Given the design document's current state section,
When I review the technology stack,
Then it accurately states: Java 11, Spring Boot 2.7.15, Gradle 8.14.2, Log4J2 2.17.2, nordlogger 1.0.1.250, Jedis 3.7.1, Kafka Client 3.5.2, Hystrix 2.2.10, JUnit 5.9.3, Mockito 4.11.0, Spotless 2.20.2.
```

**Technical Notes:**
- **Output File:** `docs/technical-design.md` (new — or update `docs/detailed-design.md` if consolidating)
- **Architecture Diagrams Required:**
  - System context diagram (ERS + external dependencies)
  - Container diagram (Spring Boot app, Redis, Kafka, external services)
  - Component diagram (controllers, processors, domain clients)
- **Data Sources:** `docs/code-analysis.md` (source of truth for current state), `docs/detailed-design.md` (design baseline)
- **Key Components (from code analysis):**
  - 430 source files, 248 test files
  - 21 REST endpoints across 6 controllers
  - 3 Kafka producer topics
  - 9 external service dependencies
  - Dual Redis clusters (GEO: routing-geo-ci-{env}, Capacity: via env vars)
- **Publish:** Confluence, linked from ERS home page (https://confluence.nordstrom.com/spaces/SCh/pages/495622523)

**Definition of Done:**
- [ ] Current state architecture documented with all components and integrations
- [ ] At least 3 architecture diagrams (system context, container, component)
- [ ] All 21 REST endpoints listed with method, path, and controller
- [ ] All 9 external dependencies documented
- [ ] Tech stack accurately documented from code analysis
- [ ] Peer-reviewed by squad engineer
- [ ] Published to Confluence

---

### US-602: Document Data Model and Integration Patterns

**Story:**
As a squad engineer,
I want documented data models (Redis schemas, Kafka event schemas, request/response DTOs) and integration patterns used by ERS,
So that I understand the data flows and can make changes without breaking contracts.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 5
**Requirements:** FR-005, BR-006

**Acceptance Criteria:**

```gherkin
Given the design document's data model section,
When I review the Redis data structures,
Then it documents the GEO cluster data model (geographic routing data, TTL patterns) and the Capacity cluster data model (inventory capacity data, TTL patterns), including connection pool configuration (min 20, max 200 per cluster).

Given the design document's integration patterns section,
When I review external service integrations,
Then each of the 9 external services has documented: the URL environment variable, authentication method (API key for PCS, OAuth2 for MLP, none for others), circuit breaker configuration (Hystrix settings), retry policy, and expected response format.

Given the design document's data model section,
When I review the Kafka event schemas,
Then each of the 3 produced topics has documented: topic name, Avro schema reference, producer processor class, known consumers (if any), and partitioning strategy.
```

**Technical Notes:**
- **Output File:** `docs/technical-design.md` (data model and integration sections)
- **Redis Data:**
  - GEO Cluster: Nonprod `routing-geo-ci-nonprod.d9ees5.ng.0001.usw2.cache.amazonaws.com`, Prod `routing-geo-ci-prod.xsb56n.ng.0001.usw2.cache.amazonaws.com`
  - Capacity Cluster: via `${REDIS_HOST_CAPACITY}`, `${REDIS_PORT_CAPACITY}`
  - Pool: min 20, max 200 connections per cluster
- **Kafka Topics:**
  - `inventory-routing-decision-made-avro` (Avro serialized)
  - `${NAP_EVENT_TOPIC}` (NAP events)
  - `${ROUTING_INSIGHTS_EVENT_TOPIC}` (routing insights)
  - Auth: SASL_SSL with OAUTHBEARER (Okta OAuth2)
- **External Service Auth Patterns:**
  - PCS: API key (`${PCS_API_KEY}`)
  - MLP RTS/STD: OAuth2 (`${MLP_CLIENT_ID}`, `${MLP_CLIENT_SECRET}`, `${MLP_TOKEN_URL}`)
  - Others: No application-layer auth (network-level only)
- **Security:** Document env var names only. No secrets, passwords, or actual URLs in committed docs (NFR-018).

**Definition of Done:**
- [ ] Redis data model documented for both GEO and Capacity clusters
- [ ] All 3 Kafka topics documented with schema references
- [ ] All 9 external service integration patterns documented
- [ ] Authentication patterns documented per service (API key, OAuth2, network-level)
- [ ] No credentials or secrets in documentation
- [ ] Peer-reviewed by squad engineer

---

### US-603: Document Target State Architecture and Gap Summary

**Story:**
As a squad lead,
I want a target state architecture document showing ERS after all compliance remediation phases complete, with a gap summary and prioritized remediation plan,
So that the team has a clear picture of where we are going and what it takes to get there.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 5
**Requirements:** FR-006, BR-001, BR-002

**Acceptance Criteria:**

```gherkin
Given the design document's target state section,
When I review the technology changes,
Then it shows: Java 17 replacing Java 11, Spring Boot 3.3.x replacing 2.7.15, Resilience4j replacing Hystrix, GitHub Actions replacing GitLab CI, correlation IDs propagated end-to-end, PII masking via PiiMaskingUtil, separate /ready endpoint, JaCoCo 80% coverage enforcement, and mTLS/OAuth2 + RBAC for authentication.

Given the design document's gap summary,
When I review the compliance gaps,
Then all 15 gaps from the code analysis are listed with: current state, target state, priority, mapped requirements (BR/FR/TR/NFR IDs), and assigned remediation phase (Phase 1 through 3B).

Given the design document's gap summary,
When I compare it against the execution plan,
Then the remediation plan aligns with the 4-phase approach: Phase 1 (gaps 1-5, critical compliance), Phase 2 (gaps 6/10-12/14-15, modernization), Phase 3A (gaps 7-8/13, operational readiness), Phase 3B (gaps 2/9, enablement).
```

**Technical Notes:**
- **Output File:** `docs/technical-design.md` (target state and gap summary sections)
- **Target State Changes (from detailed design Section 1.1):**
  - Java 17, Spring Boot 3.3.x LTS (ADR-006)
  - Resilience4j circuit breakers (ADR-010)
  - GitHub Actions CI/CD with CodeQL SAST (ADR-005)
  - 80% JaCoCo threshold (ADR-007)
  - PiiMaskingUtil for ZIP+4 masking (ADR-008)
  - Separate /ready endpoint (ADR-009)
  - mTLS/OAuth2 + RBAC: routing-reader, routing-writer, config-admin (ADR-011)
- **Gap Inventory:** 15 gaps documented in detailed design Part 4
- **Architecture Decisions:** ADR-005 through ADR-011
- **Deployment Diagram:** Target state K8s deployment with GitHub Actions -> Nordstrom Standard Pipeline -> K8s

**Definition of Done:**
- [ ] Target state architecture documented with all planned changes
- [ ] All 15 compliance gaps listed with current/target state and priority
- [ ] Remediation plan maps gaps to phases with effort estimates
- [ ] All 7 ADRs (ADR-005 through ADR-011) referenced
- [ ] Deployment diagram shows target state infrastructure
- [ ] Peer-reviewed by squad lead
- [ ] Published to Confluence

---

### US-604: Document Observability Architecture and Distributed Tracing Target

**Story:**
As a squad engineer,
I want documented observability architecture covering logging, metrics, tracing, health endpoints, and the OpenTelemetry target design,
So that the team understands the current monitoring capabilities and the roadmap to full distributed tracing.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 5
**Requirements:** NFR-014, NFR-005, NFR-007, BR-001

**Acceptance Criteria:**

```gherkin
Given the design document's observability section,
When I review the current logging architecture,
Then it documents: Log4J2 2.17.2 with nordlogger 1.0.1.250, structured JSON format, existing fields (env, envclass, logtype, hostname, servicename, uuid, date, loglevel, class, thread, schemacheck), and missing fields (correlationId, traceId, spanId) that are part of the target state.

Given the design document's distributed tracing section,
When I review the OpenTelemetry target design,
Then it describes: OpenTelemetry SDK integration with Spring Boot, traceId and spanId in all log lines via MDC, trace context propagation to all 9 external service calls, integration with DataDog APM or New Relic, and correlation ID linked to trace for cross-reference.

Given the design document's health endpoint section,
When I review the current vs target state,
Then it shows: current state with single /enterpriseRoutingService/health endpoint, and target state with separate /health (liveness, no dependency checks) and /ready (readiness, checks Redis GEO + Capacity + Kafka producer, returns 503 with JSON body on failure).
```

**Technical Notes:**
- **Output File:** `docs/technical-design.md` (observability section)
- **Current Observability Stack:**
  - Logging: Log4J2 2.17.2 + nordlogger 1.0.1.250 (structured JSON)
  - Metrics: StatsD (DataDog) + New Relic APM
  - Health: `/enterpriseRoutingService/health` (combined liveness/readiness)
  - Tracing: None (no OpenTelemetry)
- **Target Observability Stack (from detailed design Section 2.6):**
  - Logging: Add correlationId to all log lines via MDC
  - Metrics: 11 custom metrics defined (see design Section 2.6)
  - Health: Separate `/health` and `/ready` endpoints (ADR-009)
  - Tracing: OpenTelemetry SDK with DataDog APM integration
- **Distributed Tracing (from detailed design Section 2.6, NFR-014):**
  - traceId and spanId in all log lines
  - Trace context propagated to external service calls
  - Correlation ID linked to trace
- **No implementation required** — this is documentation of the target design

**Definition of Done:**
- [ ] Current observability architecture documented (logging, metrics, health)
- [ ] Target observability architecture documented (correlation IDs, tracing, /ready)
- [ ] OpenTelemetry target design documented with integration points
- [ ] All 11 custom metrics from the design referenced
- [ ] Peer-reviewed by squad engineer
- [ ] Published to Confluence

---

## EPIC-7: TODO/FIXME Remediation (WP-2.4, moved to Phase 3A)

### US-701: Audit All TODO/FIXME Comments in Production Code

**Story:**
As a squad lead,
I want a complete audit of all 17 TODO/FIXME comments in ERS production code with categorization (resolve, ticket, or remove),
So that we have a clear plan for eliminating untracked technical debt from the codebase.

**Priority:** P1
**Story Points:** 1
**Sprint:** Sprint 5
**Requirements:** TR-009

**Acceptance Criteria:**

```gherkin
Given the TODO/FIXME audit is complete,
When I review the audit report,
Then all 17 TODO/FIXME comments found in the code analysis are listed with: file path, line number, the full comment text, and a categorization of "Resolve" (fix now), "Ticket" (create Jira story for later), or "Remove" (obsolete, delete).

Given the audit report,
When I check the categorization breakdown,
Then each TODO/FIXME has a brief rationale for its categorization and, for "Ticket" items, a description of the work required that is sufficient for a Jira ticket description.
```

**Technical Notes:**
- **Output File:** Audit results in a tracking table (can be added to `docs/technical-design.md` or separate `docs/todo-audit.md`)
- **Discovery Method:** `grep -rn "TODO\|FIXME" src/main/` in the APP00344-routing-service repository
- **Source:** Code analysis identified 17 TODO/FIXME comments in production code (`src/main/`)
- **Categorization Rules:**
  - **Resolve:** Can be fixed in < 2 hours within this sprint
  - **Ticket:** Requires > 2 hours or touches risky code paths — create Jira ticket
  - **Remove:** Comment is obsolete, no longer relevant, or the work was already done
- **Nordstrom Standard:** No TODO/FIXME comments in production code (Code Quality Section 5)

**Definition of Done:**
- [ ] All 17 TODO/FIXME comments identified with file path and line number
- [ ] Each categorized as Resolve, Ticket, or Remove with rationale
- [ ] Audit report documented and accessible to squad
- [ ] Peer-reviewed by squad lead

---

### US-702: Resolve Actionable TODO/FIXME Items

**Story:**
As a squad engineer,
I want all "Resolve" category TODO/FIXME items fixed in the production codebase,
So that straightforward technical debt is eliminated and the code is cleaner for future contributors.

**Priority:** P1
**Story Points:** 3
**Sprint:** Sprint 5
**Requirements:** TR-009

**Acceptance Criteria:**

```gherkin
Given the TODO/FIXME audit has categorized items as "Resolve",
When I complete the remediation,
Then each "Resolve" item has been addressed: the underlying code issue is fixed, the TODO/FIXME comment is removed, and unit tests cover the fix.

Given all "Resolve" and "Remove" items are processed,
When I run `grep -rn "TODO\|FIXME" src/main/` on the codebase,
Then the only remaining TODO/FIXME comments (if any) are those categorized as "Ticket" and annotated with a Jira ticket reference (e.g., "TODO [JIRA-123]: description").
```

**Technical Notes:**
- **Files to Modify:** Specific files identified during US-701 audit (all in `src/main/` of APP00344-routing-service)
- **Approach:** Each TODO resolved by:
  1. Understanding the intent of the TODO comment
  2. Implementing the fix (or removing dead code if applicable)
  3. Writing/updating unit tests for the changed code
  4. Removing the TODO comment
- **Risk Mitigation:** Timebox each TODO to 1-2 hours. If a TODO reveals a larger issue, recategorize as "Ticket" and create a Jira story instead of spending excessive time
- **Testing:** Existing test suite must continue to pass; new tests added for each fix

**Definition of Done:**
- [ ] All "Resolve" category items fixed with TODO comments removed
- [ ] All "Remove" category items deleted
- [ ] Unit tests added or updated for each fix
- [ ] Full test suite passes
- [ ] Code review approved
- [ ] Deployed to staging

---

### US-703: Create Jira Tickets for Deferred TODO Items

**Story:**
As a squad lead,
I want Jira tickets created for all "Ticket" category TODO/FIXME items with sufficient context for future sprint planning,
So that deferred technical debt is tracked in our backlog and not lost.

**Priority:** P1
**Story Points:** 1
**Sprint:** Sprint 5
**Requirements:** TR-009

**Acceptance Criteria:**

```gherkin
Given TODO/FIXME items categorized as "Ticket" in the audit,
When I review the Jira backlog,
Then each deferred item has a Jira story with: title referencing the TODO, description including the file path, line number, original comment text, and what work is needed, priority set based on risk/impact, and a label "tech-debt" for tracking.

Given all Jira tickets are created,
When I update the production code,
Then each remaining TODO/FIXME comment (if any) includes the Jira ticket reference (e.g., "TODO [ERS-123]: implement retry logic") so future engineers can find the tracking ticket.
```

**Technical Notes:**
- **Jira Project:** ERS project (or appropriate Supply Chain project)
- **Ticket Template:**
  - Title: "TODO Remediation: [brief description]"
  - Description: File path, line number, original comment, required work
  - Labels: `tech-debt`, `todo-remediation`
  - Priority: Based on risk/impact assessment from audit
- **Integrations:** Jira MCP server for ticket creation
- **Code Updates:** Annotate remaining TODOs with ticket reference, or remove if ticket description captures all context
- **Verification:** `grep -rn "TODO\|FIXME" src/main/` returns zero un-ticketed results

**Definition of Done:**
- [ ] Jira tickets created for all "Ticket" category items
- [ ] Each ticket has file path, line number, description, and priority
- [ ] Remaining TODO comments in code reference Jira ticket IDs
- [ ] `grep -rn "TODO\|FIXME" src/main/` returns zero results (all resolved, removed, or annotated with ticket)
- [ ] Squad lead reviewed ticket descriptions

---

## Sprint 5 Point Distribution

| Epic | Stories | Points |
|------|---------|--------|
| EPIC-4: Runbook & Incident Response (WP-3.1) | US-401, US-402, US-403 | 2 + 2 + 1 = **5** |
| EPIC-5: SLI/SLO & Monitoring (WP-3.2) | US-501, US-502, US-503 | 2 + 2 + 1 = **5** |
| EPIC-6: Design Document (WP-3.3) | US-601, US-602, US-603, US-604 | 5 + 3 + 3 + 2 = **13** |
| EPIC-7: TODO/FIXME Remediation (WP-2.4) | US-701, US-702, US-703 | 1 + 3 + 1 = **5** |
| **Total** | **12 stories** | **28 points** |

## Parallelization Notes

- **WP-3.2 (SLI/SLO)** and **WP-2.4 (TODO Remediation)** can run in parallel with WP-3.3 (Design Doc)
- **WP-3.1 (Runbook)** can start before WP-3.3 completes if alert/playbook content is drafted first
- **WP-3.3 (Design Doc)** is on the critical path — it blocks runbook finalization (architecture diagram references) and downstream Phase 3B work
- **Overflow risk:** If Sprint 5 is overloaded, WP-2.4 (TODO Remediation) is lowest risk to overflow into Sprint 6
