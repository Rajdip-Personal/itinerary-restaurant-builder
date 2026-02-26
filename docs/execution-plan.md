# Execution Plan: Infrastructure & Delivery — APP00344 Enterprise Routing Service

**Project:** Full-Stack Infrastructure & Delivery Documentation
**Target Application:** APP00344-routing-service (Enterprise Routing Service)
**Planning Date:** 2026-02-25
**Team Size:** 4-6 engineers
**Sprint Duration:** 2 weeks
**Total Duration:** 12 weeks (6 sprints)

---

## Executive Summary

This execution plan brings the Enterprise Routing Service (ERS) into full compliance with Nordstrom engineering standards while addressing critical technical debt. The application is currently production-grade with good structure, but has critical gaps in correlation ID propagation, test coverage enforcement, and uses an EOL version of Spring Boot.

The plan is organized into 4 phases over 6 sprints, prioritizing P0 security and observability gaps first, followed by modernization, and concluding with documentation and enablement split into two distinct milestones. Each phase delivers working, demonstrable functionality with security, testing, and observability baked in from the start.

**Key Deliverables:**
1. Detailed design document (current state → target state)
2. 40+ implementation-ready user stories organized into epics
3. GitHub Actions CI/CD configuration with security scanning
4. Compliance remediation plan with effort estimates

**Estimated Total Effort:** 142 story points (~$142K over 6 months)

---

## Phase 1: Critical Compliance & Observability (Sprints 1-2)

**Milestone:** Achieve P0 compliance for security, observability, and testing

**Duration:** 4 weeks (2 sprints)
**Goal:** Address critical gaps that impact production reliability, security, and incident response

### Work Packages

#### WP-1.1: Correlation ID Propagation (Critical)
**Description:** Implement end-to-end correlation ID propagation for request tracing across all service boundaries (HTTP, Kafka, Redis).

**Dependencies:** None (can start immediately)

**Effort Estimate:** Large (L) — 13 story points
- Story 1.1.1: Add correlation ID filter (3 pts)
- Story 1.1.2: Propagate to Kafka events (3 pts)
- Story 1.1.3: Propagate to external service calls (3 pts)
- Story 1.1.4: Add to all log statements (2 pts)
- Story 1.1.5: Integration tests (2 pts)

**Key Deliverables:**
- `CorrelationIdFilter.java` — HTTP filter to extract/generate correlation IDs
- `CorrelationIdHolder.java` — ThreadLocal-based holder for correlation IDs
- Updated `KafkaProducerConfig` to inject correlation ID headers
- Updated `WebConfig` to propagate correlation IDs to WebClient/RestTemplate
- Updated Log4J2 configuration with `correlationId` field
- Integration tests validating end-to-end propagation

**Risks:**
- **Performance impact:** ThreadLocal overhead minimal but needs load testing
- **Mitigation:** Add performance tests during implementation

**Files to Modify:**
```
src/main/java/com/nordstrom/ers/
├── filters/CorrelationIdFilter.java (NEW)
├── utils/CorrelationIdHolder.java (NEW)
├── config/KafkaProducerConfig.java (UPDATE)
├── config/WebConfig.java (UPDATE)
└── processors/**/*.java (UPDATE log statements)
src/main/resources/log4j2.xml (UPDATE pattern)
```

---

#### WP-1.2: Test Coverage Enforcement
**Description:** Enforce 80% code coverage threshold in Gradle build with JaCoCo, add missing tests for critical paths.

**Dependencies:** None

**Effort Estimate:** Large (L) — 13 story points
- Story 1.2.1: Configure JaCoCo with 80% threshold (2 pts)
- Story 1.2.2: Add tests for routing processors (5 pts)
- Story 1.2.3: Add tests for validation logic (3 pts)
- Story 1.2.4: Add tests for event constructors (3 pts)

**Key Deliverables:**
- Updated `build.gradle` with JaCoCo plugin and coverage threshold
- JaCoCo HTML reports in `build/reports/jacoco/test/html/`
- New test files for uncovered classes (targeting ~22% increase to reach 80%)
- CI pipeline updated to fail on coverage violations

**Risks:**
- **Coverage target may be too aggressive:** Some classes (DTOs, configs) may not need 80% coverage
- **Mitigation:** Configure JaCoCo exclusions for generated code, DTOs, and configs

**Files to Modify:**
```
build.gradle (ADD JaCoCo plugin)
.github/workflows/ci.yml (ADD coverage enforcement step)
src/test/java/com/nordstrom/ers/ (ADD ~50 new test files)
```

---

#### WP-1.3: Separate Readiness Endpoint (P1 — Best Practice)
**Description:** Add dedicated `/ready` endpoint separate from `/health` for Kubernetes readiness probes, checking Redis and Kafka connectivity.

**Priority Note:** This is a P1 best-practice improvement, not P0 critical. Deployments have been stable with no pod readiness issues observed. The existing `/health` endpoint is sufficient for current operations, but a separate `/ready` endpoint improves operational hygiene.

**Dependencies:** None

**Effort Estimate:** Small (S) — 3 story points
- Story 1.3.1: Create `/ready` endpoint (2 pts)
- Story 1.3.2: Update K8s deployment manifest (1 pt)

**Key Deliverables:**
- `ReadinessController.java` — Separate readiness endpoint
- Health checks for Redis (GEO and Capacity clusters)
- Health check for Kafka producer connectivity
- Updated Kubernetes deployment YAML with separate `readinessProbe`
- Integration test validating readiness checks

**Risks:**
- **Readiness check failures could cause unnecessary pod restarts**
- **Mitigation:** Use appropriate timeout and failure thresholds in K8s probe configuration

**Files to Modify:**
```
src/main/java/com/nordstrom/ers/controllers/ReadinessController.java (NEW)
deployment/routing-service-deployment.yaml (UPDATE readinessProbe)
src/test/java/com/nordstrom/ers/controllers/ReadinessControllerTest.java (NEW)
```

---

#### WP-1.4: PII Masking Audit & Enforcement
**Description:** Audit all logging and external service calls for PII leakage, implement masking strategy for sensitive fields (email, phone, address, SSN, names).

**Dependencies:** WP-1.1 (needs correlation ID logging in place first)

**Effort Estimate:** Medium (M) — 8 story points
- Story 1.4.1: Audit logs for PII (3 pts)
- Story 1.4.2: Implement log masking utility (2 pts)
- Story 1.4.3: Update logging patterns (2 pts)
- Story 1.4.4: Document PII handling policy (1 pt)

**Key Deliverables:**
- PII audit report identifying all sensitive fields
- `PiiMaskingUtil.java` — Utility to mask PII in logs
- Updated logging statements to mask PII before logging
- PII Handling Policy document in Confluence
- Unit tests validating masking logic

**Risks:**
- **Over-masking:** May mask fields needed for debugging
- **Under-masking:** May miss PII in complex nested objects
- **Mitigation:** Define clear list of PII fields, add exemption mechanism for controlled debugging

**Files to Modify:**
```
src/main/java/com/nordstrom/ers/
├── utils/PiiMaskingUtil.java (NEW)
├── entity/**/*.java (ADD @PiiField annotations)
└── processors/**/*.java (UPDATE log statements with masking)
docs/pii-handling-policy.md (NEW)
```

---

### Phase 1 Summary

**Total Effort:** 37 story points (2 sprints with 4-6 engineers)

**Sprint 1 (16 pts):**
- WP-1.1: Correlation ID Propagation (13 pts)
- WP-1.3: Readiness Endpoint (3 pts)

**Sprint 2 (21 pts):**
- WP-1.2: Test Coverage Enforcement (13 pts)
- WP-1.4: PII Masking Audit (8 pts)

**Phase 1 Deliverables:**
- Correlation IDs propagated across all boundaries
- 80% test coverage enforced in CI
- Separate readiness endpoint for K8s (P1 improvement)
- PII masking strategy implemented

**Acceptance Criteria:**
- All P0 compliance gaps closed
- All new code has tests (80%+ coverage)
- Correlation IDs appear in all logs and Kafka events
- `/ready` endpoint returns 200 when healthy, 503 when dependencies unavailable (P1)
- PII audit report complete with no unmasked PII in logs

---

## Phase 2: Modernization & Tech Debt (Sprints 3-4)

**Milestone:** Modernize Spring Boot, refactor large classes, replace deprecated libraries

**Duration:** 4 weeks (2 sprints)
**Goal:** Address technical debt that impacts maintainability and long-term supportability

### Work Packages

#### WP-2.1: Spring Boot Upgrade (2.7.15 → 3.3.x)
**Description:** Upgrade Spring Boot from EOL version 2.7.15 to latest 3.3.x LTS with Java 17, migrate deprecated APIs, update dependencies.

**Dependencies:** WP-1.2 (need test coverage in place before major refactor)

**Effort Estimate:** Extra Large (XL) — 21 story points
- Story 2.1.1: Upgrade Java 11 → 17 (3 pts)
- Story 2.1.2: Upgrade Spring Boot → 3.3.x (5 pts)
- Story 2.1.3: Migrate deprecated APIs (5 pts)
- Story 2.1.4: Update all dependencies (3 pts)
- Story 2.1.5: Regression testing (5 pts)

**Key Deliverables:**
- Updated `build.gradle`:
  - Java toolchain → 17
  - Spring Boot → 3.3.x
  - Spring Kafka → 3.x
  - All dependencies updated to compatible versions
- Migrated deprecated APIs:
  - `WebMvcConfigurer` methods
  - `RestTemplate` → `RestClient` (where applicable)
- Updated CI pipeline with Java 17
- Full regression test suite passing
- Performance benchmarks comparing 2.7.15 vs. 3.3.x

**Risks:**
- **Breaking changes:** Spring Boot 3.x has significant breaking changes (Jakarta EE namespace migration)
- **Dependency conflicts:** Some internal libraries may not be compatible with Spring Boot 3
- **Performance regression:** Need to validate no latency increase
- **Mitigation:** Create feature branch, run parallel deployment in shadow environment, full regression testing

**Files to Modify:**
```
build.gradle (UPDATE versions)
gradle.properties (UPDATE Java version)
src/main/java/com/nordstrom/ers/**/*.java (MIGRATE deprecated APIs)
.github/workflows/ci.yml (UPDATE Java version in CI)
```

**Testing Strategy:**
1. Unit tests must all pass
2. Integration tests with Redis, Kafka
3. Load tests comparing 2.7.15 vs 3.3.x latency
4. Shadow deployment for 1 week before production rollout

---

#### WP-2.2: Replace Hystrix with Resilience4j
**Description:** Replace Netflix Hystrix (maintenance mode) with Resilience4j for circuit breaker, retry, and rate limiting.

**Dependencies:** WP-2.1 (Spring Boot 3 has better Resilience4j support)

**Effort Estimate:** Large (L) — 13 story points
- Story 2.2.1: Add Resilience4j dependencies (1 pt)
- Story 2.2.2: Migrate Hystrix circuit breakers (5 pts)
- Story 2.2.3: Add retry policies (3 pts)
- Story 2.2.4: Add rate limiting (2 pts)
- Story 2.2.5: Integration tests (2 pts)

**Key Deliverables:**
- Resilience4j circuit breaker configuration for external services (PCS, ETA, MLP, etc.)
- Retry policies with exponential backoff
- Rate limiting for outbound calls
- Metrics integration (Micrometer → DataDog/New Relic)
- Removed Hystrix dependencies
- Circuit breaker dashboard

**Risks:**
- **Behavioral differences:** Resilience4j circuit breaker behavior differs from Hystrix
- **Metrics changes:** Dashboards/alerts based on Hystrix metrics need updating
- **Mitigation:** Run both libraries in parallel during transition, compare metrics, update dashboards before removing Hystrix

**Files to Modify:**
```
build.gradle (ADD Resilience4j, REMOVE Hystrix)
src/main/java/com/nordstrom/ers/
├── config/Resilience4jConfig.java (NEW)
├── domain/**/*Client.java (UPDATE with @CircuitBreaker annotations)
└── metrics/CircuitBreakerHystrixEventNotifier.java (REMOVE)
src/main/resources/application.yml (ADD Resilience4j config)
```

---

#### WP-2.3: Refactor Large Processor Classes
**Description:** Refactor large processor classes (600+ lines) into smaller, testable components following Single Responsibility Principle.

**Dependencies:** WP-1.2 (need test coverage before refactoring)

**Effort Estimate:** Large (L) — 13 story points
- Story 2.3.1: Refactor `ShippingDependenciesProcessor` (607 lines) (5 pts)
- Story 2.3.2: Refactor `NAPEventConstructor` (476 lines) (4 pts)
- Story 2.3.3: Refactor `RoutingInsightsEventConstructor` (509 lines) (4 pts)

**Key Deliverables:**
- `ShippingDependenciesProcessor` split into:
  - `ShippingCostCalculator`
  - `ShippingTimeEstimator`
  - `ShippingMethodSelector`
  - `ShippingDependenciesProcessor` (orchestrator)
- `NAPEventConstructor` split into:
  - `NAPEventMapper`
  - `NAPEventValidator`
  - `NAPEventPublisher`
  - `NAPEventConstructor` (orchestrator)
- Similar split for `RoutingInsightsEventConstructor`
- All new classes have 80%+ test coverage
- No change in external behavior (verified by integration tests)

**Risks:**
- **Introduced bugs:** Refactoring large classes is risky
- **Performance impact:** More method calls may add overhead
- **Mitigation:** Comprehensive test coverage before refactor, use IDE refactoring tools, pair programming, performance benchmarks

**Files to Modify:**
```
src/main/java/com/nordstrom/ers/processors/
├── ShippingDependenciesProcessor.java (REFACTOR)
├── shipping/ShippingCostCalculator.java (NEW)
├── shipping/ShippingTimeEstimator.java (NEW)
├── shipping/ShippingMethodSelector.java (NEW)
├── NAPEventConstructor.java (REFACTOR)
├── events/NAPEventMapper.java (NEW)
├── events/NAPEventValidator.java (NEW)
├── events/NAPEventPublisher.java (NEW)
└── ... (similar for RoutingInsightsEventConstructor)
```

---

#### WP-2.4: CI/CD Pipeline Enhancement (GitHub Actions)
**Description:** Design GitHub Actions CI/CD pipeline with security scanning (SAST, dependency check), performance tests, and automated rollback on failure. This targets the future GitHub pipeline post-migration from GitLab.

**Note:** This repository is being migrated from GitLab to GitHub. All CI/CD work targets the future GitHub Actions pipeline.

**Dependencies:** WP-1.2 (need test coverage in place for reliable CI), WP-2.1 (Java 17 for updated tooling)

**Effort Estimate:** Medium (M) — 8 story points
- Story 2.4.1: Add SAST via GitHub CodeQL / SonarQube (2 pts)
- Story 2.4.2: Add dependency vulnerability scanning (2 pts)
- Story 2.4.3: Add performance test workflow (2 pts)
- Story 2.4.4: Add automated rollback (2 pts)

**Key Deliverables:**
- GitHub Actions workflows in `.github/workflows/` with jobs:
  - `sast` — Static analysis (GitHub CodeQL / SonarQube)
  - `dependency-check` — OWASP dependency check or Trivy
  - `performance-test` — JMeter or Gatling performance tests
  - `deploy` — Deploy with automated rollback on health check failure
- Security scan results in GitHub Security tab
- Performance benchmarks tracked over time
- Automated rollback logic in Kubernetes deployment

**Risks:**
- **False positives:** Security scanners may flag non-issues
- **Pipeline slowdown:** Additional workflow steps add time
- **Mitigation:** Configure scan exclusions, run some jobs in parallel, optimize test data size

**Files to Modify:**
```
.github/workflows/ci.yml (ADD jobs)
.github/workflows/security.yml (NEW — CodeQL/SAST workflow)
.github/workflows/performance.yml (NEW — performance test workflow)
scripts/performance-test.sh (NEW)
scripts/rollback-on-failure.sh (NEW)
```

---

### Phase 2 Summary

**Total Effort:** 55 story points (2 sprints with 4-6 engineers)

**Sprint 3 (25 pts):**
- WP-2.1: Spring Boot Upgrade (21 pts — full sprint focus)
- WP-2.4: CI/CD Enhancement (4 pts, start only)

**Sprint 4 (30 pts):**
- WP-2.2: Replace Hystrix (13 pts)
- WP-2.3: Refactor Large Classes (13 pts)
- WP-2.4: CI/CD Enhancement (4 pts, finish)

**Phase 2 Deliverables:**
- Spring Boot 3.3.x with Java 17
- Resilience4j circuit breakers replacing Hystrix
- Refactored large classes (<300 lines each)
- GitHub Actions CI/CD pipeline with security scanning

**Acceptance Criteria:**
- Application runs on Java 17 + Spring Boot 3.3.x in production
- All tests pass with new versions
- Performance benchmarks show no regression (p95 latency within 5% of baseline)
- Circuit breaker metrics available in monitoring dashboard
- All processor classes <400 lines
- GitHub Actions pipeline includes CodeQL SAST and dependency scanning
- Zero critical/high CVEs in dependencies

---

## Phase 3A: High-Priority Documentation & Cleanup (Sprint 5)

> **Phase 3 Split Rationale:** The original Phase 3 contained 9 work packages totaling 50 story points across 2 sprints. This has been split into Phase 3A and Phase 3B to create distinct milestones:
>
> - **Phase 3A (Sprint 5)** focuses on immediately actionable operational documentation and code cleanup — the design doc, runbook, SLI/SLOs, and TODO remediation. These outputs directly improve on-call operations and production readiness.
> - **Phase 3B (Sprint 6)** focuses on enablement materials and comprehensive deliverables — onboarding, auth docs, Kafka schema docs, user stories, and CI/CD templates. These outputs enable team scaling and long-term maintainability.
>
> **Alternative considered:** Keeping Phase 3 as a single phase with 9 WPs across Sprints 5-6. This would work but creates less clear milestones and makes progress tracking harder. The split provides a natural checkpoint between "operational readiness" and "team enablement" deliverables.

**Milestone:** Operational documentation, observability definitions, and code cleanup complete

**Duration:** 2 weeks (1 sprint)
**Goal:** Deliver the high-priority documentation that directly supports on-call operations and production readiness, plus resolve remaining code cleanup from Phase 2

### Work Packages

#### WP-3.1: Runbook & Incident Response Guide
**Description:** Create comprehensive runbook with common alerts, troubleshooting steps, Splunk queries, escalation paths, and runbook index. This directly supports on-call engineers and has the highest immediate value in Phase 3.

**Dependencies:** WP-3.3 (need architecture diagrams from design doc)

**Effort Estimate:** Medium (M) — 5 story points
- Story 3.1.1: Document common alerts (2 pts)
- Story 3.1.2: Troubleshooting playbooks (2 pts)
- Story 3.1.3: Escalation paths (1 pt)

**Key Deliverables:**
- **Runbook** (`docs/runbook.md`):
  - **Common Alerts:**
    - High latency (p95 > 500ms)
    - High error rate (5xx > 1%)
    - Circuit breaker open (external service degraded)
    - Redis connection failures
    - Kafka publishing failures
    - Pod crash loops
  - **For each alert:**
    - Symptom (what the alert means)
    - Impact (user experience, business impact)
    - Diagnosis (how to investigate)
    - Remediation (how to fix)
    - Splunk query (to find relevant logs)
    - Dashboard link
  - **Troubleshooting Playbooks:**
    - "Request returns 500 error" playbook
    - "Latency spike" playbook
    - "Kafka publishing stuck" playbook
    - "Redis connection pool exhausted" playbook
  - **Splunk Query Index:**
    - Error logs: `index=prod_logs service=routing-service level=ERROR`
    - Latency analysis: `index=prod_logs service=routing-service | stats p50(duration), p95(duration), p99(duration)`
    - Correlation ID search: `index=prod_logs correlationId={id}`
  - **Escalation Paths:**
    - L1: On-call engineer (PagerDuty)
    - L2: Squad lead (Slack #supply-chain-routing)
    - L3: Platform team (for K8s/Redis/Kafka issues)
    - L4: External service owners (for PCS/ETA/MLP issues)
  - **Dashboard Links:**
    - DataDog dashboard URL
    - New Relic APM URL
    - Grafana K8s metrics URL
- Published to Confluence, linked from ERS home page

**Risks:**
- **Runbook becomes stale:** Need to update with each incident retrospective
- **Mitigation:** Add "update runbook" to incident post-mortem process

**Files to Create:**
```
docs/runbook.md (NEW)
docs/splunk-queries.md (NEW)
```

---

#### WP-3.2: SLI/SLO Definition & Documentation
**Description:** Define Service Level Indicators (SLIs) and Service Level Objectives (SLOs) for ERS, document them in runbook, configure monitoring dashboards.

**Dependencies:** WP-1.3 (readiness endpoint provides health metrics)

**Effort Estimate:** Medium (M) — 5 story points
- Story 3.2.1: Define SLIs (latency, error rate, throughput) (2 pts)
- Story 3.2.2: Define SLOs with thresholds (1 pt)
- Story 3.2.3: Create monitoring dashboard (2 pts)

**Key Deliverables:**
- SLI/SLO document with definitions:
  - **Availability SLO:** 99.9% uptime (43 min downtime/month)
  - **Latency SLI:** p50, p95, p99 response times
  - **Latency SLO:** p95 < 500ms, p99 < 1000ms
  - **Error Rate SLO:** < 1% of requests result in 5xx errors
  - **Throughput SLI:** Requests per second
- DataDog/New Relic dashboard with SLI metrics
- Alert rules tied to SLO thresholds
- Runbook with escalation paths

**Risks:**
- **SLOs may be too aggressive or too lenient:** Need historical data to calibrate
- **Mitigation:** Set initial SLOs based on current performance, iterate after 1 sprint of data collection

**Files to Create:**
```
docs/sli-slo-definition.md (NEW)
docs/monitoring-dashboard-config.json (NEW)
docs/runbook.md (UPDATE with SLOs)
```

---

#### WP-3.3: Detailed Design Document (Current → Target State)
**Description:** Generate comprehensive technical design document showing current state architecture, target state (post-Phase 1 & 2), component inventory, integration patterns, and gap summary.

**Dependencies:** WP-1.* and WP-2.* (need all changes implemented to document target state)

**Effort Estimate:** Large (L) — 13 story points
- Story 3.3.1: Current state architecture (3 pts)
- Story 3.3.2: Target state architecture (3 pts)
- Story 3.3.3: Component inventory (2 pts)
- Story 3.3.4: Integration patterns (2 pts)
- Story 3.3.5: Gap analysis & remediation plan (3 pts)

**Key Deliverables:**
- **Detailed Design Document** (`docs/technical-design.md`) with:
  - **Executive Summary:** Application purpose, key technologies, deployment model
  - **Current State Architecture:** Pre-Phase 1 state (as discovered in code analysis)
  - **Target State Architecture:** Post-remediation state (after all WPs complete)
  - **Architecture Diagrams:**
    - System context diagram (ERS + external dependencies)
    - Container diagram (Spring Boot app, Redis, Kafka, external services)
    - Component diagram (controllers, processors, domain clients)
    - Deployment diagram (K8s, pods, services, ingress)
  - **Component Inventory:**
    - REST endpoints (21 identified)
    - Kafka topics (3 produced: inventory-routing-decision-made-avro, NAP, routing-insights)
    - External service dependencies (9 services: PCS, ETA, MLP, etc.)
    - Redis clusters (GEO, Capacity)
  - **Data Model:**
    - Request/response DTOs
    - Redis data structures
    - Kafka event schemas
  - **Security Model:**
    - Authentication flow (API Gateway → ERS)
    - PII handling policy
    - Secrets management (environment variables)
  - **Observability Model:**
    - Logging (JSON, correlation IDs, no PII)
    - Metrics (DataDog/New Relic)
    - SLIs/SLOs
    - Health/readiness endpoints
  - **Deployment Model:**
    - GitHub Actions → Nordstrom Standard Pipeline → K8s
    - Environment progression (Dev → Test → Shadow Nonprod → Nonprod → Shadow Prod → Prod)
  - **Gap Summary:**
    - Critical gaps (15 identified in code analysis)
    - Remediation plan (Phases 1-3)
    - Effort estimates (142 story points)
- Published to Confluence with links from ERS Confluence home page

**Risks:**
- **Documentation may become stale:** Need to establish ownership and update process
- **Mitigation:** Assign doc owner, add "update design doc" to Definition of Done for future architecture changes

**Files to Create:**
```
docs/technical-design.md (NEW — comprehensive design document)
docs/diagrams/system-context.png (NEW)
docs/diagrams/container-diagram.png (NEW)
docs/diagrams/component-diagram.png (NEW)
docs/diagrams/deployment-diagram.png (NEW)
```

---

#### WP-3.4: TODO/FIXME Remediation
**Description:** Address 17 TODO/FIXME comments in production code — resolve, convert to tickets, or remove if obsolete.

**Dependencies:** None

**Effort Estimate:** Medium (M) — 5 story points
- Story 3.4.1: Audit all TODO/FIXME comments (1 pt)
- Story 3.4.2: Resolve actionable items (3 pts)
- Story 3.4.3: Create tickets for deferred items (1 pt)

**Key Deliverables:**
- TODO/FIXME audit report categorizing each comment:
  - **Resolved:** Fixed immediately
  - **Ticketed:** Converted to Jira story for future sprint
  - **Removed:** Obsolete comment deleted
- Production code free of TODO comments (or all linked to tickets)
- Jira tickets for deferred work with context

**Risks:**
- **Some TODOs may be complex:** May uncover larger issues requiring separate work packages
- **Mitigation:** Timebox each TODO to 1-2 hours; if more complex, create ticket and move on

**Files to Modify:**
```
All files with TODO/FIXME comments (audit result will list specific files)
```

---

### Phase 3A Summary

**Total Effort:** 28 story points (1 sprint with 4-6 engineers)

**Sprint 5 (28 pts):**
- WP-3.1: Runbook & Incident Response Guide (5 pts)
- WP-3.2: SLI/SLO Definition (5 pts)
- WP-3.3: Detailed Design Document (13 pts)
- WP-3.4: TODO/FIXME Remediation (5 pts)

**Phase 3A Deliverables:**
- Comprehensive design document (current → target state)
- Runbook with incident response playbooks
- SLIs/SLOs defined and monitored
- All TODO/FIXME comments resolved or ticketed

**Acceptance Criteria:**
- Design document published to Confluence with architecture diagrams
- Runbook reviewed by SRE team
- SLI/SLO dashboard live in DataDog/New Relic
- Zero TODO/FIXME comments remaining in production code (or all linked to Jira tickets)

---

## Phase 3B: Enablement & Comprehensive Stories (Sprint 6)

**Milestone:** Team enablement materials and implementation-ready stories delivered

**Duration:** 2 weeks (1 sprint)
**Goal:** Deliver enablement materials that support team scaling, comprehensive user stories for all identified gaps, and reusable CI/CD templates

### Work Packages

#### WP-3.5: Authentication Layer Documentation
**Description:** Document current authentication strategy (API Gateway vs. network policies), clarify RBAC model, add security architecture diagram.

**Dependencies:** None (documentation only)

**Effort Estimate:** Small (S) — 3 story points
- Story 3.5.1: Document auth strategy (2 pts)
- Story 3.5.2: Create security architecture diagram (1 pt)

**Key Deliverables:**
- Security Architecture Document in Confluence
- Diagram showing authentication flow (API Gateway → ERS)
- RBAC model documentation (roles, permissions, enforcement layer)
- Threat model for ERS
- Recommendations for future auth improvements

**Risks:**
- **Unclear ownership:** Authentication may be handled by upstream systems outside squad control
- **Mitigation:** Engage with Platform/Security teams to clarify current state

**Files to Create:**
```
docs/security-architecture.md (NEW)
docs/auth-flow-diagram.png (NEW)
```

---

#### WP-3.6: Kafka Event Schema Documentation
**Description:** Document all Kafka topics produced/consumed, retrieve Avro schemas from schema registry, add schema evolution policy.

**Dependencies:** None (can run in parallel with other Phase 3B work)

**Effort Estimate:** Small (S) — 3 story points
- Story 3.6.1: Document topics and schemas (2 pts)
- Story 3.6.2: Schema evolution policy (1 pt)

**Key Deliverables:**
- **Kafka Event Contract Documentation** (`docs/kafka-events.md`):
  - **Topics Produced:**
    - `inventory-routing-decision-made-avro` — Routing decision events
    - NAP events topic (configured via `${NAP_EVENT_TOPIC}`)
    - Routing insights topic (configured via `${ROUTING_INSIGHTS_EVENT_TOPIC}`)
  - For each topic:
    - Schema name and version
    - Avro schema (retrieved from schema registry)
    - Sample event (JSON representation)
    - Producer (ERS controller/processor)
    - Consumers (downstream services)
    - Retention policy
    - Partitioning strategy
  - **Topics Consumed:** (none identified — ERS does not consume Kafka events)
  - **Schema Evolution Policy:**
    - Backward compatibility required
    - Forward compatibility recommended
    - Schema versioning strategy
    - Breaking change process
- Published to Confluence

**Risks:**
- **Schema registry access:** May not have access during workshop
- **Mitigation:** Use MCP server (`nordstrom-schema-repo`) or work with Platform team to retrieve schemas

**Files to Create:**
```
docs/kafka-events.md (NEW)
docs/schemas/inventory-routing-decision-made-avro.avsc (NEW — copy of Avro schema)
docs/schemas/nap-event.avsc (NEW)
docs/schemas/routing-insights-event.avsc (NEW)
```

---

#### WP-3.7: Onboarding Guide & Developer Documentation
**Description:** Create onboarding guide for new engineers with local setup, architecture overview, contribution guidelines, and testing guide.

**Dependencies:** WP-3.3 (need architecture diagrams)

**Effort Estimate:** Medium (M) — 5 story points
- Story 3.7.1: Local setup guide (2 pts)
- Story 3.7.2: Architecture overview (1 pt)
- Story 3.7.3: Contribution guidelines (1 pt)
- Story 3.7.4: Testing guide (1 pt)

**Key Deliverables:**
- **Onboarding Guide** (`docs/onboarding.md`):
  - **Day 1:**
    - Access request checklist (GitHub, Confluence, Jira, DataDog, PagerDuty)
    - Clone repository
    - Local development environment setup (Java 17, Gradle, Docker for Redis/Kafka)
    - Run application locally
    - Run tests
  - **Week 1:**
    - Architecture overview (read design doc, watch architecture video)
    - Code walkthrough (controllers → processors → domain clients)
    - Key patterns (logging, error handling, circuit breakers)
    - Submit first PR (fix a TODO or improve a test)
  - **Month 1:**
    - Shadow on-call rotation
    - Implement a small feature end-to-end
    - Participate in sprint planning and retrospective
  - **Architecture Overview:**
    - Link to full design doc
    - 5-minute video walkthrough of architecture diagrams
    - Key concepts (routing logic, optimization algorithm, Redis caching, Kafka events)
  - **Contribution Guidelines:**
    - Branch naming convention: `feature/ERS-123-short-description`
    - Commit message format: `[ERS-123] Short description`
    - PR template
    - Code review checklist
    - Testing requirements (80% coverage, integration tests)
  - **Testing Guide:**
    - How to run unit tests: `./gradlew test`
    - How to run integration tests (with Docker Compose for Redis/Kafka)
    - How to run performance tests
    - How to generate coverage report: `./gradlew jacocoTestReport`
- Published to Confluence as "New Engineer Onboarding"

**Risks:**
- **Onboarding guide becomes outdated:** Tech stack changes, access request process changes
- **Mitigation:** Assign owner, review quarterly, update with feedback from new hires

**Files to Create:**
```
docs/onboarding.md (NEW)
docs/local-development-setup.md (NEW)
docs/contribution-guidelines.md (NEW)
docs/testing-guide.md (NEW)
```

---

#### WP-3.8: User Stories for All Gaps
**Description:** Generate implementation-ready user stories for every gap identified in code analysis, organized into epics (Security, Observability, Testing, Modernization, Documentation).

**Dependencies:** WP-1.*, WP-2.*, WP-3.3 (need all gaps documented)

**Effort Estimate:** Medium (M) — 8 story points
- Story 3.8.1: Generate stories for Phase 1 gaps (3 pts)
- Story 3.8.2: Generate stories for Phase 2 gaps (3 pts)
- Story 3.8.3: Generate stories for Phase 3 gaps (2 pts)

**Key Deliverables:**
- **User Stories Document** (`docs/user-stories.md`):
  - **Epic 1: Observability & Correlation (13 stories)**
    - Stories from WP-1.1, WP-1.3, WP-3.2
  - **Epic 2: Security & Compliance (8 stories)**
    - Stories from WP-1.4, WP-3.5
  - **Epic 3: Testing & Quality (13 stories)**
    - Stories from WP-1.2
  - **Epic 4: Modernization (34 stories)**
    - Stories from WP-2.1, WP-2.2, WP-2.3, WP-2.4
  - **Epic 5: Documentation (24 stories)**
    - Stories from WP-3.1, WP-3.3, WP-3.6, WP-3.7
  - **For each story:**
    - Title (user story format: "As a [persona], I want [feature], so that [benefit]")
    - Description (specific to ERS codebase)
    - Acceptance criteria (testable)
    - Story points (effort estimate)
    - Priority (P0/P1/P2)
    - Files to modify (specific paths)
    - Dependencies (story IDs)
    - Testing requirements
- Total: ~92 stories organized into 5 epics
- Exported to Jira (optional — keep in Markdown for now)

**Risks:**
- **Stories too generic:** May not be specific enough to implement without refinement
- **Mitigation:** Include specific file paths, config examples, and acceptance criteria tied to ERS context

**Files to Create:**
```
docs/user-stories.md (NEW — all stories in Markdown)
```

---

#### WP-3.9: CI/CD Configuration Templates
**Description:** Document GitHub Actions CI/CD pipeline configuration, create reusable templates for other squads, document deployment process.

**Dependencies:** WP-2.4 (enhanced CI/CD pipeline)

**Effort Estimate:** Small (S) — 3 story points
- Story 3.9.1: Document GitHub Actions pipeline (2 pts)
- Story 3.9.2: Create reusable templates (1 pt)

**Key Deliverables:**
- **CI/CD Documentation** (`docs/cicd-pipeline.md`):
  - **Pipeline Jobs:**
    - `build` — Gradle build + JaCoCo coverage
    - `test` — Unit and integration tests
    - `sast` — Static security analysis (CodeQL)
    - `dependency-check` — Vulnerability scanning
    - `performance-test` — Load tests (non-blocking)
    - `deploy-dev` — Auto-deploy to dev
    - `deploy-test` — Auto-deploy to test
    - `deploy-nonprod` — Manual approval
    - `deploy-prod` — Manual approval + ServiceNow change
  - **For each job:**
    - Purpose
    - Commands executed
    - Success criteria
    - Failure handling
  - **Environment Variables:**
    - Required CI/CD variables (Redis URLs, Kafka config, secrets)
    - How to configure in GitHub repository settings
  - **Approval Gates:**
    - Nonprod deployment: Squad lead approval
    - Prod deployment: Squad lead + manager approval + ServiceNow change
  - **Rollback Process:**
    - Automated rollback on health check failure
    - Manual rollback procedure
- **Template Files:**
  - `.github/workflows/ci-template.yml` — Reusable GitHub Actions workflow for other Java/Spring Boot services
  - `scripts/deploy.sh` — Standardized deployment script
  - `scripts/rollback.sh` — Standardized rollback script
- Published to Confluence

**Risks:**
- **Template may not fit all services:** Other services may have different tech stacks
- **Mitigation:** Document assumptions and customization points

**Files to Create:**
```
docs/cicd-pipeline.md (NEW)
.github/workflows/ci-template.yml (NEW)
scripts/deploy.sh (NEW)
scripts/rollback.sh (NEW)
```

---

### Phase 3B Summary

**Total Effort:** 22 story points (1 sprint with 4-6 engineers)

**Sprint 6 (22 pts):**
- WP-3.5: Authentication Layer Documentation (3 pts)
- WP-3.6: Kafka Event Schema Documentation (3 pts)
- WP-3.7: Onboarding Guide (5 pts)
- WP-3.8: User Stories for All Gaps (8 pts)
- WP-3.9: CI/CD Configuration Templates (3 pts)

**Phase 3B Deliverables:**
- Authentication architecture documented
- Kafka event contract documentation
- Onboarding guide for new engineers
- 92 implementation-ready user stories
- CI/CD configuration templates

**Acceptance Criteria:**
- Authentication architecture documented in Confluence
- All Kafka topics documented with schemas
- Onboarding guide tested with a new engineer
- User stories reviewed and approved by squad lead
- CI/CD templates reused by at least one other squad

---

## Dependency Map

```
Phase 1: Critical Compliance & Observability
┌──────────────────────────────────────────────────────────┐
│ WP-1.1: Correlation ID ─────────────┐                    │
│ WP-1.2: Test Coverage ──────────┐   │                    │
│ WP-1.3: Readiness Endpoint (P1) │   │                    │
└─────────────────────────────────┼───┼────────────────────┘
                                  │   │
                                  ▼   ▼
┌──────────────────────────────────────────────────────────┐
│ WP-1.4: PII Masking (needs 1.1) │                        │
└─────────────────────────────────┼────────────────────────┘
                                  │
                                  ▼
Phase 2: Modernization & Tech Debt
┌──────────────────────────────────────────────────────────┐
│ WP-2.1: Spring Boot Upgrade (needs 1.2) ───────┐         │
└────────────────────────────────────────────────┼─────────┘
                                                 │
                                                 ▼
┌──────────────────────────────────────────────────────────┐
│ WP-2.2: Replace Hystrix (needs 2.1) ──────┐              │
│ WP-2.3: Refactor Large Classes (needs 1.2)│              │
│ WP-2.4: GitHub Actions CI/CD (needs 1.2, 2.1)│           │
└────────────────────────────────────────────┼──────────────┘
                                             │
                                             ▼
Phase 3A: High-Priority Documentation & Cleanup
┌──────────────────────────────────────────────────────────┐
│ WP-3.1: Runbook (needs 3.3)                              │
│ WP-3.2: SLI/SLO Definition (needs 1.3)                   │
│ WP-3.3: Design Doc (needs all Phase 1 & 2)               │
│ WP-3.4: TODO/FIXME Remediation (no dependencies)         │
└──────────────────────────────────────────────────────────┘
                                             │
                                             ▼
Phase 3B: Enablement & Comprehensive Stories
┌──────────────────────────────────────────────────────────┐
│ WP-3.5: Auth Documentation                               │
│ WP-3.6: Kafka Schema Documentation                       │
│ WP-3.7: Onboarding Guide (needs 3.3)                     │
│ WP-3.8: User Stories (needs 3.3)                         │
│ WP-3.9: CI/CD Templates (needs 2.4)                      │
└──────────────────────────────────────────────────────────┘
```

**Critical Path:**
1. WP-1.2 (Test Coverage) → Blocks Phase 2 refactoring
2. WP-2.1 (Spring Boot Upgrade) → Blocks Resilience4j migration and CI enhancements
3. WP-3.3 (Design Doc) → Blocks runbook, onboarding guide, and stories

**Parallelization Opportunities:**
- Phase 1: WP-1.1, 1.2, 1.3 can all run in parallel
- Phase 2: WP-2.3 can start alongside WP-2.1 (both depend on WP-1.2, not each other)
- Phase 3A: WP-3.2 (SLI/SLO) and WP-3.4 (TODO Remediation) can run in parallel with WP-3.3 (Design Doc)
- Phase 3A: WP-3.1 (Runbook) can start before WP-3.3 completes if alert/playbook content is drafted first
- Phase 3B: WP-3.5 (Auth Docs), WP-3.6 (Kafka Docs) can start immediately in Sprint 6

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Spring Boot 3 upgrade introduces breaking changes** | High — Could block production deployment | Medium | Create feature branch, run parallel deployment in shadow environment, full regression testing before production rollout |
| **Test coverage increase requires significant effort** | Medium — May slip sprint timeline | High | Start WP-1.2 early in Phase 1, prioritize high-value test coverage (critical paths first) |
| **Correlation ID propagation impacts performance** | Medium — Latency increase | Low | Add performance tests during implementation, use lightweight ThreadLocal, benchmark before/after |
| **MCP server connectivity issues during documentation** | Low — Delays documentation | Medium | Document what we can access, flag inaccessible systems as open items, coordinate with Platform team |
| **PII masking is too aggressive or insufficient** | High — Compliance violation or debugging difficulty | Medium | Define clear PII field list, add exemption mechanism for controlled debugging, audit logs quarterly |
| **Refactoring introduces bugs** | High — Production incidents | Medium | Comprehensive test coverage before refactor, use IDE refactoring tools, pair programming, shadow deployment |
| **Documentation becomes stale** | Medium — Onboarding takes longer | High | Assign doc owner, add "update docs" to Definition of Done, review quarterly |
| **GitHub Actions CI/CD pipeline design delays** | Low — Developer experience | Medium | Run non-blocking jobs in parallel, optimize test data size, use caching; iterate on pipeline post-migration |
| **SLOs are too aggressive** | Low — Alert fatigue | Medium | Set initial SLOs based on current performance, iterate after 1 sprint of data collection |
| **Team capacity fluctuates** | Medium — Timeline slips | Medium | Build buffer into sprint planning (plan for 70% capacity), prioritize P0 items first |
| **Sprint 5 overloaded (28 pts)** | Medium — Phase 3A slips | Medium | Design doc (WP-3.3) can be started early if Phase 2 WPs complete ahead of schedule; TODO remediation (WP-3.4) is low-risk and can overflow into Sprint 6 if needed |

---

## Assumptions

1. **Team Availability:** Assumes 4-6 engineers with Java/Spring Boot expertise available for all 6 sprints
2. **Environment Access:** Assumes squad has access to all environments (dev, test, nonprod, prod) and can deploy changes
3. **Dependency Team Support:** Assumes Platform team available for Redis/Kafka/K8s issues, external service owners available for API questions
4. **Test Data:** Assumes test data available for integration and performance testing
5. **No Production Incidents:** Assumes no major production incidents requiring squad attention during the 12-week timeline
6. **No Competing Priorities:** Assumes squad can dedicate full capacity to this project (no other major initiatives)
7. **Spring Boot 3 Compatibility:** Assumes all internal libraries (nordlogger, routing-inputs) compatible with Spring Boot 3 or can be upgraded
8. **Approval Process:** Assumes standard approval gates (no expedited changes requiring emergency process)
9. **Documentation Access:** Assumes squad has write access to Confluence for publishing documentation
10. **Budget Approval:** Assumes $142K budget approved for 6 months of engineering time
11. **Java 17 Compatibility:** Assumes all dependencies compatible with Java 17 (no blocking issues)
12. **Performance Baselines:** Assumes current performance metrics (latency, throughput) available as baseline for comparison
13. **Shadow Environment:** Assumes shadow environment available for testing major changes (Spring Boot upgrade) before production
14. **Rollback Capability:** Assumes ability to rollback deployments if issues detected (blue-green or canary deployment)
15. **No Breaking API Changes:** Assumes REST API contracts remain stable (no breaking changes to external consumers)
16. **GitLab to GitHub Migration:** Assumes repository migration to GitHub will be completed before or during Phase 2, enabling GitHub Actions CI/CD work

---

## Success Criteria

### Phase 1 (Sprints 1-2)
- [ ] Correlation IDs appear in 100% of logs and Kafka events
- [ ] Test coverage at 80%+ enforced in CI pipeline
- [ ] `/ready` endpoint returns correct health status (P1 improvement)
- [ ] PII audit complete with zero unmasked PII in logs
- [ ] All P0 compliance gaps closed

### Phase 2 (Sprints 3-4)
- [ ] Application running on Java 17 + Spring Boot 3.3.x in production
- [ ] All tests pass with new versions
- [ ] Performance benchmarks show <5% regression from baseline
- [ ] Resilience4j circuit breakers operational with metrics
- [ ] All processor classes <400 lines
- [ ] GitHub Actions pipeline includes CodeQL SAST and dependency scanning
- [ ] Zero critical/high CVEs in dependencies

### Phase 3A (Sprint 5)
- [ ] Design document published to Confluence with 4+ architecture diagrams
- [ ] Runbook reviewed and approved by SRE team
- [ ] SLI/SLO dashboard live in DataDog/New Relic
- [ ] All TODO/FIXME comments resolved or ticketed

### Phase 3B (Sprint 6)
- [ ] Authentication architecture documented in Confluence
- [ ] Kafka event contracts documented with Avro schemas
- [ ] Onboarding guide tested with a new engineer (onboarding time <1 week)
- [ ] 92 user stories reviewed and approved by squad lead
- [ ] CI/CD templates reused by at least one other squad
- [ ] Incident response time reduced by 20% (measured 3 months post-implementation)

### Overall Project Success
- [ ] All 15 critical gaps from code analysis closed
- [ ] 100% of deliverables from PRD completed
- [ ] Squad confident in maintaining and extending ERS
- [ ] New engineers onboarding in ≤1 week (vs 2-3 weeks baseline)
- [ ] SRE team using runbook for incident response
