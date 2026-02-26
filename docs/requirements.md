# Requirements: Infrastructure & Delivery — APP00344 Enterprise Routing Service

**Project:** Full-Stack Infrastructure & Delivery Documentation
**Target Application:** APP00344-routing-service (Enterprise Routing Service)
**Generated:** 2026-02-25
**Source Documents:** PRD (projects/infra-delivery/prd.md), Execution Plan (docs/execution-plan.md), Code Analysis (docs/code-analysis.md)

---

## Summary

| Category | Count | P0 | P1 | P2 |
|----------|-------|-----|-----|-----|
| Business Requirements (BR) | 6 | 3 | 2 | 1 |
| Functional Requirements (FR) | 14 (1 complete) | 5 | 6 | 3 |
| Technical Requirements (TR) | 12 | 5 | 4 | 3 |
| Non-Functional Requirements (NFR) | 18 | 8 | 7 | 3 |
| **Total** | **50** | **21** | **19** | **10** |

---

## Business Requirements

### BR-001: Infrastructure Gap Identification
- **Description:** All infrastructure gaps in the Enterprise Routing Service are documented and traceable to specific Nordstrom engineering standards, covering security, logging, monitoring, CI/CD, deployment, and testing.
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 2 — Goals (Primary Goal)
- **Acceptance Criteria:**
  - 100% of infrastructure gaps are documented per application
  - Each gap references the specific Nordstrom standard it violates
  - Gap analysis covers all standard areas: security, logging, monitoring, CI/CD, deployment, testing
- **Stakeholder:** Squad Lead
- **Related Work Packages:** WP-3.3

### BR-002: Implementation-Ready Stories for Compliance
- **Description:** Every identified compliance gap has a corresponding implementation-ready user story with specific file paths, acceptance criteria, effort estimates, and sprint assignments — requiring no further refinement before development begins.
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 2 — Goals (Secondary Goal)
- **Acceptance Criteria:**
  - Every identified gap has at least one corresponding user story
  - Stories include specific file paths, config references, and code changes
  - Stories are organized into epics and sprints with effort estimates
  - Story-to-gap traceability is 100%
- **Stakeholder:** Squad Lead
- **Related Work Packages:** WP-3.8

### BR-003: Reduced Onboarding Time
- **Description:** New engineer onboarding documentation exists covering Day 1 setup, Week 1 architecture walkthrough, and Month 1 contribution milestones, validated by self-reported survey showing onboarding time of 1 week or less (down from 2-3 weeks).
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 2 — Success Metrics
- **Acceptance Criteria:**
  - Onboarding guide covers Day 1, Week 1, and Month 1 milestones
  - Guide includes local setup, architecture walkthrough, contribution guidelines, and testing guide
  - Self-reported onboarding survey shows <=1 week for new engineers
- **Stakeholder:** Squad Lead, New Team Members
- **Related Work Packages:** WP-3.7

### BR-004: Reduced Incident Response Time
- **Description:** On-call engineers have access to runbooks, Splunk query indexes, dashboards, and escalation paths for every common ERS alert scenario, resulting in a measurable 20% reduction in mean incident response time within 3 months of deployment.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 2 — Success Metrics
- **Acceptance Criteria:**
  - Runbook covers all common alert scenarios with investigation and remediation steps
  - Splunk query index accessible to on-call engineers
  - Escalation paths documented (L1-L4)
  - Incident response time measured via incident ticket metrics shows 20% reduction after 3 months
- **Stakeholder:** SRE / On-Call Engineer
- **Related Work Packages:** WP-3.1, WP-3.2

### BR-005: Reusable Documentation Templates
- **Description:** Documentation templates (CI/CD configs, design doc structure, runbook format) are published with clear customization points and validated by adoption in at least one other squad.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 2 — Goals (Tertiary Goal)
- **Acceptance Criteria:**
  - CI/CD template reused by at least one other squad
  - Templates documented with customization points
- **Stakeholder:** Infrastructure Squad
- **Related Work Packages:** WP-3.9

### BR-006: Single Source of Truth for Application Landscape
- **Description:** A single authoritative document exists that connects all systems, schemas, queries, repositories, and documentation for the Enterprise Routing Service — with every item linked to its source system — eliminating the need to search across Confluence, Jira, GitLab, and Slack for application context.
- **Priority:** P2 (Nice to Have)
- **Source:** PRD Section 1 — Problem Statement
- **Acceptance Criteria:**
  - Design document includes component inventory, Kafka topics, API inventory, external dependencies, Confluence pages, and Jira stories
  - All items linked to their source system
- **Stakeholder:** Squad Engineer
- **Related Work Packages:** WP-3.3, WP-3.6

---

## Functional Requirements

### FR-001: Infrastructure Discovery — Repository Scanning
- **Description:** Scan the APP00344-routing-service repository to identify tech stack, architecture patterns, compliance gaps, and dependencies.
- **Status: COMPLETE**
- **Completed during code analysis phase. Output: docs/code-analysis.md**
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 5 — Workflow 1 (Infrastructure Discovery)
- **Acceptance Criteria:**
  - Given the repository is cloned locally, when `/scan` is executed, then the analysis identifies: language (Java 11), framework (Spring Boot 2.7.15), build tool (Gradle 8.14.2), all dependencies, and file structure
  - All 430 source files and 248 test files are accounted for
  - Analysis references specific file paths and line numbers
- **User Persona:** Squad Engineer
- **Related Work Packages:** Code Analysis (completed)

### FR-002: Infrastructure Discovery — Kafka Topic Inventory
- **Description:** Identify all Kafka topics produced and consumed by ERS, retrieve Avro schemas from the schema registry via MCP.
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 5 — Workflow 1, Data Requirements
- **Acceptance Criteria:**
  - Given MCP server `nordstrom-schema-repo` is configured, when topic discovery runs, then all produced topics are identified: `inventory-routing-decision-made-avro`, NAP event topic (`${NAP_EVENT_TOPIC}`), routing insights topic (`${ROUTING_INSIGHTS_EVENT_TOPIC}`)
  - Avro schemas retrieved for each topic
  - No consumed topics documented (ERS does not consume Kafka events)
- **User Persona:** Squad Engineer
- **Related Work Packages:** WP-3.6

### FR-003: Infrastructure Discovery — External Documentation Inventory
- **Description:** Query Confluence, Jira, and Aha! via MCP to discover existing documentation, work items, and roadmap items for ERS.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 5 — Workflow 1, Data Requirements
- **Acceptance Criteria:**
  - Confluence pages retrieved from ERS home page (https://confluence.nordstrom.com/spaces/SCh/pages/495622523)
  - Jira epics, stories, and test cases retrieved for ERS
  - Aha! features and roadmap items retrieved
  - Each item documented with title, URL, status, and last updated date
- **User Persona:** Squad Engineer
- **Related Work Packages:** WP-3.3

### FR-004: Gap Analysis Against Nordstrom Standards
- **Description:** Compare discovered ERS infrastructure against all Nordstrom engineering standards and assess each area as Compliant, Partial, Non-Compliant, or Unknown.
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 5 — Workflow 2 (Gap Analysis)
- **Acceptance Criteria:**
  - Gap analysis covers: Security (auth, PII, secrets, input validation, RBAC), Logging (JSON, correlation IDs, no PII), Monitoring (health endpoints, SLIs/SLOs, dashboards, alerting), CI/CD (GitHub Actions, security scanning), Deployment (standard K8s, resource limits, HPA), Testing (80% coverage, integration tests, performance tests)
  - Each standard area assigned a compliance status with evidence
  - Security and monitoring gaps marked P0; others P1/P2
  - Specific gaps referenced with file paths from code analysis
- **User Persona:** Squad Lead
- **Related Work Packages:** WP-3.3

### FR-005: Design Document Generation — Current State
- **Description:** Generate detailed documentation of the current state architecture of ERS including component inventory, API endpoints, data model, and integration patterns.
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 5 — Workflow 3 (Design Document Generation)
- **Acceptance Criteria:**
  - Document includes: system context diagram, container diagram, component diagram, deployment diagram
  - All 21 REST endpoints documented with method, path, controller, and description
  - All 3 Kafka topics documented with schema, direction, and related processor
  - All 9 external service dependencies documented (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS)
  - Dual Redis cluster configuration documented (GEO and Capacity)
- **User Persona:** Squad Engineer, New Team Member
- **Related Work Packages:** WP-3.3

### FR-006: Design Document Generation — Target State
- **Description:** Generate target state architecture documentation showing ERS after all compliance remediation is complete (post-Phase 1 through 3B).
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 5 — Workflow 3
- **Acceptance Criteria:**
  - Target state shows: Java 17 + Spring Boot 3.3.x, Resilience4j replacing Hystrix, correlation IDs propagated, 80% test coverage, PII masking in place, GitHub Actions CI/CD, separate `/ready` endpoint
  - Current state vs. target state clearly separated
  - Gap summary with prioritized remediation plan linking to work packages
- **User Persona:** Squad Lead
- **Related Work Packages:** WP-3.3

### FR-007: Story Generation for Compliance Gaps
- **Description:** Generate implementation-ready user stories for every gap identified in code analysis, organized into epics with effort estimates.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 5 — Workflow 4 (Story Generation for Gaps)
- **Acceptance Criteria:**
  - Stories generated for: missing CI/CD pipeline (GitHub Actions), readiness endpoint, structured logging gaps, monitoring gaps (SLIs/SLOs), security gaps (auth, PII masking), missing tests, K8s deployment gaps
  - Each story includes: title (user story format), description specific to ERS, acceptance criteria, story points, priority, files to modify, dependencies, testing requirements
  - Target: ~92 stories organized into 5 epics
- **User Persona:** Squad Lead
- **Related Work Packages:** WP-3.8

### FR-008: Splunk Query Index
- **Description:** Document all relevant Splunk queries for ERS in a single accessible index for on-call engineers.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 5 — Workflow 1; PRD Section 4 — SRE User Stories
- **Acceptance Criteria:**
  - Squad-provided Splunk queries captured and documented
  - Index includes: error log queries, latency analysis queries, correlation ID search queries
  - Queries organized by use case (debugging, monitoring, incident response)
- **User Persona:** SRE / On-Call Engineer
- **Related Work Packages:** WP-3.1

### FR-009: Runbook Generation
- **Description:** Create a comprehensive runbook with common alerts, troubleshooting playbooks, Splunk queries, escalation paths, and dashboard links.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 4 — SRE User Stories; Execution Plan WP-3.1
- **Acceptance Criteria:**
  - Covers at minimum: high latency, high error rate, circuit breaker open, Redis connection failures, Kafka publishing failures, pod crash loops
  - Each alert has: symptom, impact, diagnosis, remediation, Splunk query, dashboard link
  - Escalation paths defined (L1 through L4)
  - Published to Confluence, linked from ERS home page
- **User Persona:** SRE / On-Call Engineer
- **Related Work Packages:** WP-3.1

### FR-010: SLI/SLO Definition
- **Description:** Define Service Level Indicators and Objectives for ERS with monitoring dashboards and alerting rules.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 4 — SRE User Stories; Nordstrom Standards — Monitoring
- **Acceptance Criteria:**
  - SLIs defined: availability, latency (p50/p95/p99), error rate, throughput
  - SLOs set: availability >= 99.9%, p95 latency < 500ms, p99 < 1000ms, error rate < 1%
  - Dashboard created in DataDog/New Relic
  - Alert rules tied to SLO thresholds
- **User Persona:** SRE / On-Call Engineer
- **Related Work Packages:** WP-3.2

### FR-011: Onboarding Guide
- **Description:** Create a structured onboarding guide for new engineers joining the ERS squad.
- **Priority:** P1 (Should Have)
- **Source:** PRD Section 4 — New Team Member User Stories
- **Acceptance Criteria:**
  - Day 1: Access requests, repo clone, local environment setup (Java 17, Gradle, Docker for Redis/Kafka), run application and tests
  - Week 1: Architecture overview, code walkthrough (controllers → processors → domain), key patterns, first PR
  - Month 1: Shadow on-call, implement small feature, sprint planning participation
  - Published to Confluence
- **User Persona:** New Team Member
- **Related Work Packages:** WP-3.7

### FR-012: Authentication Architecture Documentation
- **Description:** Document the current authentication strategy (network-level only) and target state (mTLS/OAuth2 + RBAC) with security architecture diagrams.
- **Priority:** P2 (Nice to Have)
- **Source:** PRD Open Question 7; Team Decision
- **Acceptance Criteria:**
  - Current state documented: internal LB, no app-layer auth, network-level access only
  - Target state documented: mTLS/OAuth2 for service-to-service, RBAC at API layer
  - Security architecture diagram showing auth flow
  - Threat model for ERS
- **User Persona:** Squad Engineer
- **Related Work Packages:** WP-3.5

### FR-013: Kafka Event Schema Documentation
- **Description:** Document all Kafka event contracts with Avro schemas, sample events, producer/consumer info, and schema evolution policy.
- **Priority:** P2 (Nice to Have)
- **Source:** PRD Section 5 — Data Requirements
- **Acceptance Criteria:**
  - All 3 produced topics documented: `inventory-routing-decision-made-avro`, NAP events, routing insights
  - Each topic has: schema name/version, Avro schema, sample event, producer processor, known consumers, retention policy, partitioning strategy
  - Schema evolution policy defined (backward/forward compatibility)
- **User Persona:** Squad Engineer
- **Related Work Packages:** WP-3.6

### FR-014: CI/CD Configuration Templates
- **Description:** Document the GitHub Actions CI/CD pipeline configuration and create reusable templates for other Java/Spring Boot services.
- **Priority:** P2 (Nice to Have)
- **Source:** PRD Section 3 — In Scope; Execution Plan WP-3.9
- **Acceptance Criteria:**
  - Pipeline documentation covers all jobs: build, test, SAST, dependency check, performance test, deploy (dev through prod)
  - Environment variables and approval gates documented
  - Reusable workflow template (`.github/workflows/ci-template.yml`) created
  - Rollback process documented
- **User Persona:** Squad Engineer
- **Related Work Packages:** WP-3.9

---

## Technical Requirements

### TR-001: Correlation ID Propagation
- **Description:** Implement end-to-end correlation ID propagation across HTTP, Kafka, and Redis boundaries using `X-Correlation-ID` header.
- **Priority:** P0 (Must Have)
- **Source:** Code Analysis — only 1 occurrence found in codebase; Nordstrom Standards — Logging (Section 3)
- **Current State:** Single occurrence of correlation ID in codebase; no systematic propagation
- **Target State:** Correlation IDs present in all HTTP requests/responses, Kafka event headers, and every log line
- **Acceptance Criteria:**
  - `CorrelationIdFilter.java` extracts/generates correlation ID on every inbound request
  - `CorrelationIdHolder.java` (ThreadLocal) makes correlation ID available throughout request lifecycle
  - Kafka producer config injects correlation ID into message headers
  - All log statements include `correlationId` field via Log4J2 MDC
  - Integration tests verify end-to-end propagation (HTTP → log → Kafka header)
- **Related Work Packages:** WP-1.1

### TR-002: Test Coverage Enforcement (80% Threshold)
- **Description:** Configure JaCoCo in Gradle build to enforce minimum 80% code coverage, failing the build when threshold is not met.
- **Priority:** P0 (Must Have)
- **Source:** Code Analysis — ~58% estimated file coverage, no threshold enforced; Nordstrom Standards — Code Quality (Section 5)
- **Current State:** ~58% file coverage (248 test files / 430 source files), no enforcement
- **Target State:** 80% line/branch coverage enforced in CI, JaCoCo exclusions for DTOs and generated code
- **Acceptance Criteria:**
  - `build.gradle` updated with JaCoCo plugin and `jacocoTestCoverageVerification` task
  - Coverage threshold set to 80% line coverage
  - Exclusions configured for DTOs (`entity/**`), config classes, and generated code
  - CI pipeline fails on coverage violation
  - JaCoCo HTML reports generated in `build/reports/jacoco/test/html/`
- **Related Work Packages:** WP-1.2

### TR-003: Separate Readiness Endpoint
- **Description:** Add a dedicated `/ready` endpoint separate from the existing `/enterpriseRoutingService/health` endpoint for Kubernetes readiness probes.
- **Priority:** P1 (Should Have)
- **Source:** Code Analysis — no separate `/ready` endpoint; Nordstrom Standards — Monitoring (Section 4)
- **Current State:** Only `/enterpriseRoutingService/health` exists; used for both liveness and readiness
- **Target State:** Separate `/ready` endpoint checking Redis (GEO + Capacity) and Kafka producer connectivity
- **Acceptance Criteria:**
  - `ReadinessController.java` implements `/ready` endpoint
  - Checks Redis GEO cluster connectivity
  - Checks Redis Capacity cluster connectivity
  - Checks Kafka producer connectivity
  - Returns 200 when all healthy, 503 when any dependency unavailable
  - K8s deployment manifest updated with separate `readinessProbe` pointing to `/ready`
  - Integration test validates readiness checks
- **Related Work Packages:** WP-1.3

### TR-004: PII/PI Masking in Logs
- **Description:** Implement log masking for PI data (ZIP+4 postal codes) in request body logging, and audit all logging for unmasked sensitive fields.
- **Priority:** P0 (Must Have)
- **Source:** PRD Open Question 10 — ZIP+4 codes logged verbatim (134 entries, 41 unique values in 60-min Splunk sample); Nordstrom Standards — PII Protection (Section 1)
- **Current State:** `ShipToZip` field (ZIP+4) logged verbatim in request bodies; OrderId and hashed ShopperID also logged
- **Target State:** PI fields masked before logging; PII handling policy documented
- **Acceptance Criteria:**
  - `PiiMaskingUtil.java` masks ZIP+4 codes (retain first 3 digits, mask remainder: `981**-****`)
  - All request body logging passes through masking utility
  - OrderId retained (non-PII); ShopperID already hashed (acceptable)
  - PII audit report identifies all sensitive fields in logs
  - Zero unmasked PI/PII in production logs verified via Splunk query
  - Unit tests validate masking logic for all identified patterns
- **Related Work Packages:** WP-1.4

### TR-005: GitHub Actions CI/CD Pipeline
- **Description:** Design and implement GitHub Actions CI/CD pipeline with standard stages: lint, build, unit test, security scan, container build, container scan, integration test, deploy.
- **Priority:** P0 (Must Have)
- **Source:** PRD Section 7 — Technical Constraints; Nordstrom Standards — CI/CD (Section 2); Team Decision (repo migrating from GitLab)
- **Current State:** GitLab CI with Nordstrom Standard Pipeline Template v6
- **Target State:** GitHub Actions with CodeQL SAST, dependency vulnerability scanning, JaCoCo coverage, and automated deployment
- **Acceptance Criteria:**
  - `.github/workflows/ci.yml` implements all standard pipeline stages
  - SAST via GitHub CodeQL or SonarQube
  - Dependency vulnerability scanning (OWASP Dependency Check or Trivy)
  - JaCoCo coverage report published as GitHub Actions artifact
  - Container image scanning in CI
  - Deploy stages with manual approval gates for nonprod and prod
  - ServiceNow change request integration for production deploys
- **Related Work Packages:** WP-2.4

### TR-006: Spring Boot Upgrade (2.7.15 to 3.3.x)
- **Description:** Upgrade Spring Boot from EOL version 2.7.15 to latest 3.3.x LTS, including Java 11 to 17 migration and Jakarta EE namespace migration.
- **Priority:** P2 (Nice to Have — documented as backlog)
- **Source:** PRD Open Question 8 — Team Decision: P2 backlog; Code Analysis — Spring Boot 2.7.15 EOL
- **Current State:** Java 11, Spring Boot 2.7.15 (EOL for OSS), growing CVE risk
- **Target State:** Java 17, Spring Boot 3.3.x LTS
- **Acceptance Criteria:**
  - `build.gradle` updated: Java toolchain → 17, Spring Boot → 3.3.x
  - Jakarta EE namespace migration complete (`javax.*` → `jakarta.*`)
  - All deprecated Spring APIs migrated
  - All dependencies updated to compatible versions
  - Full regression test suite passes
  - Performance benchmarks show <5% latency regression vs baseline
  - Shadow deployment validated for 1 week before production
- **Related Work Packages:** WP-2.1

### TR-007: Hystrix to Resilience4j Migration
- **Description:** Replace Netflix Hystrix (maintenance mode) with Resilience4j for circuit breaker, retry, and rate limiting patterns.
- **Priority:** P2 (Nice to Have — documented as backlog, bundle with Spring Boot upgrade)
- **Source:** PRD Open Question 9 — Team Decision: P2, bundle with SB upgrade; Code Analysis — Hystrix 2.2.10.RELEASE
- **Current State:** Hystrix circuit breakers with custom `CircuitBreakerHystrixEventNotifier`; 10+ external service dependencies protected
- **Target State:** Resilience4j circuit breakers with retry policies, rate limiting, and Micrometer metrics integration
- **Acceptance Criteria:**
  - Resilience4j dependencies added, Hystrix dependencies removed
  - All external service calls (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS) protected by Resilience4j circuit breakers
  - Retry policies with exponential backoff configured
  - Circuit breaker metrics available in DataDog/New Relic
  - `CircuitBreakerHystrixEventNotifier.java` removed
  - Integration tests validate circuit breaker behavior
- **Related Work Packages:** WP-2.2

### TR-008: Large Class Refactoring
- **Description:** Refactor processor classes exceeding 400 lines into smaller, focused components following Single Responsibility Principle.
- **Priority:** P2 (Nice to Have)
- **Source:** Code Analysis — ShippingDependenciesProcessor (607 lines), NAPEventConstructor (476 lines), RoutingInsightsEventConstructor (509 lines)
- **Current State:** 3 classes over 400 lines; ShippingDependenciesProcessor at 607 lines
- **Target State:** All classes under 400 lines with clear single responsibilities
- **Acceptance Criteria:**
  - `ShippingDependenciesProcessor.java` split into: ShippingCostCalculator, ShippingTimeEstimator, ShippingMethodSelector, and orchestrator
  - `NAPEventConstructor.java` split into: NAPEventMapper, NAPEventValidator, NAPEventPublisher, and orchestrator
  - `RoutingInsightsEventConstructor.java` split similarly
  - All new classes have 80%+ test coverage
  - No change in external behavior verified by integration tests
  - All resulting classes under 400 lines
- **Related Work Packages:** WP-2.3

### TR-009: TODO/FIXME Remediation
- **Description:** Address all 17 TODO/FIXME comments in production code — resolve, convert to Jira tickets, or remove if obsolete.
- **Priority:** P1 (Should Have)
- **Source:** Code Analysis — 17 TODO/FIXME comments in production code; Nordstrom Standards — Code Quality (no TODOs in production)
- **Current State:** 17 TODO/FIXME comments scattered across production code
- **Target State:** Zero TODO/FIXME comments in production code; all deferred items tracked as Jira tickets
- **Acceptance Criteria:**
  - All 17 TODO/FIXME comments audited and categorized: Resolved, Ticketed, or Removed
  - Jira tickets created for deferred items with context
  - `grep -r "TODO\|FIXME" src/main/` returns zero results
- **Related Work Packages:** WP-3.4

### TR-010: Kubernetes Resource Configuration
- **Description:** Ensure K8s deployment manifests include resource requests/limits, HPA, and Pod Disruption Budgets per Nordstrom standards.
- **Priority:** P1 (Should Have)
- **Source:** Nordstrom Standards — Deployment (Section 2); Execution Plan Phase 1/2
- **Current State:** Standard K8s deployment via Nordstrom Standard Pipeline; resource configuration not audited in code analysis
- **Target State:** Resource requests/limits defined, HPA configured, PDB configured
- **Acceptance Criteria:**
  - CPU and memory requests and limits defined in deployment manifest
  - HPA configured for production workload with appropriate min/max replicas
  - PDB configured to maintain availability during rolling updates
  - Liveness probe points to `/enterpriseRoutingService/health`
  - Readiness probe points to `/ready` (after TR-003)
- **Related Work Packages:** WP-1.3, WP-2.4

### TR-011: Container Security Standards
- **Description:** Ensure container images meet Nordstrom container security standards: approved base images, non-root execution, image scanning in CI.
- **Priority:** P1 (Should Have)
- **Source:** Nordstrom Standards — Container Security (Section 2)
- **Current State:** Not audited in code analysis; current CI uses GitLab Standard Pipeline
- **Target State:** Container images from approved registry, non-root execution, scanning in GitHub Actions CI
- **Acceptance Criteria:**
  - Dockerfile uses approved base image from Nordstrom registry
  - Container runs as non-root user
  - Image scanning step in GitHub Actions CI fails on critical/high vulnerabilities
  - Images signed before deployment
- **Related Work Packages:** WP-2.4

### TR-012: Secrets Management Compliance
- **Description:** Verify and document that all secrets are injected at runtime via environment variables or Kubernetes secrets, with no secrets in source code or config files.
- **Priority:** P0 (Must Have)
- **Source:** Code Analysis — all secrets via environment variables (strength); Nordstrom Standards — Secrets Management (Section 1)
- **Current State:** All secrets via environment variables; no hardcoded secrets detected; Gurobi license stored as GitLab CI/CD variable
- **Target State:** Documented secrets inventory; all secrets via Vault or K8s secrets; Gurobi license migrated to GitHub Actions secrets post-migration
- **Acceptance Criteria:**
  - Secrets inventory documented (Redis passwords, Kafka OAuth credentials, MLP client secrets, PCS API key, Gurobi license)
  - No secrets in source code verified (grep for common patterns)
  - Gurobi license stored as GitHub Actions secret (post-migration)
  - Secret rotation supported without application restart
- **Related Work Packages:** WP-2.4, WP-3.5

---

## Non-Functional Requirements

### NFR-001: Structured JSON Logging
- **Description:** All log output must be structured JSON with standard fields including correlation ID, service name, environment, and log level.
- **Priority:** P0 (Must Have)
- **Category:** Observability
- **Source:** Nordstrom Standards — Logging (Section 3); Code Analysis — Log4J2 + nordlogger already produces structured JSON
- **Current State:** Structured JSON logging via Log4J2 2.17.2 + nordlogger 1.0.1.250 with fields: env, envclass, logtype, hostname, servicename, uuid, date, loglevel, class, thread, schemacheck. Missing: correlationId, traceId, spanId.
- **Target State:** All standard fields present including `correlationId` in every log line
- **Acceptance Criteria:**
  - All log output is valid JSON (no free-text log lines)
  - Every log line includes: timestamp, level, message, service, correlationId, environment, version
  - Log4J2 MDC used to inject correlation ID into every log statement
  - Verified by parsing 1000 log lines from production — 100% are valid JSON with required fields
- **Measurement Method:** Splunk query for non-JSON log lines; field presence verification
- **Related Work Packages:** WP-1.1

### NFR-002: No PII/PI in Logs
- **Description:** No Personally Identifiable Information or Personal Information may appear unmasked in any log output.
- **Priority:** P0 (Must Have)
- **Category:** Security
- **Source:** Nordstrom Standards — PII in Logs (Section 3); PRD Open Question 10 — ZIP+4 logged verbatim
- **Current State:** ZIP+4 postal codes (ShipToZip field) logged verbatim in request bodies; 134 entries with 41 unique values found in 60-minute Splunk sample. OrderId logged (non-PII). Hashed ShopperID logged (acceptable).
- **Target State:** All PI/PII masked before logging
- **Acceptance Criteria:**
  - ZIP+4 codes masked to `981**-****` format (retain first 3 digits only)
  - No email, phone, SSN, full address, or names in any log output
  - Splunk query across 24-hour production log sample returns zero unmasked PI/PII
  - Masking utility covers request body logging, exception messages, and debug output
- **Measurement Method:** Splunk regex query for unmasked PII patterns in production logs
- **Related Work Packages:** WP-1.4

### NFR-003: Authentication & Authorization
- **Description:** Service-to-service communication must use mTLS or OAuth2 client credentials, with RBAC enforced at the API layer.
- **Priority:** P0 (Must Have)
- **Category:** Security
- **Source:** Nordstrom Standards — Authentication & Authorization (Section 1); PRD Open Question 7 — network-level only today
- **Current State:** Network-level authentication only — internal LB, no application-layer auth. Any internal Nordstrom service on the network or peered VPCs can call ERS endpoints. No OAuth, API keys, mTLS, or Istio AuthorizationPolicy.
- **Target State:** mTLS/OAuth2 for service-to-service; RBAC at API layer; authorization decisions logged
- **Acceptance Criteria:**
  - mTLS or OAuth2 client credentials required for all inbound API calls
  - RBAC roles defined (at minimum: routing-reader, routing-writer, config-admin)
  - Authorization enforced on every REST endpoint (21 endpoints across 6 controllers)
  - Authorization decisions logged (who accessed what, when)
  - Unauthorized requests return 401/403 with appropriate error message
- **Measurement Method:** Penetration test; audit log review; unauthorized access attempt test
- **Related Work Packages:** WP-3.5 (documentation), future implementation stories

### NFR-004: Health Check Endpoints
- **Description:** Application must expose `/health` (liveness) and `/ready` (readiness) endpoints per Nordstrom standards.
- **Priority:** P1 (Should Have)
- **Category:** Reliability
- **Source:** Nordstrom Standards — Health Endpoints (Section 4); Code Analysis — `/enterpriseRoutingService/health` exists, no `/ready`
- **Current State:** `/enterpriseRoutingService/health` endpoint exists and used for both liveness and readiness probes
- **Target State:** Separate liveness (`/health`) and readiness (`/ready`) endpoints
- **Acceptance Criteria:**
  - `/health` returns 200 if process is alive (no dependency checks)
  - `/ready` returns 200 if Redis (both clusters) and Kafka producer are reachable; 503 otherwise
  - K8s liveness probe → `/health`, readiness probe → `/ready`
  - Appropriate timeout and failure thresholds configured in K8s probe settings
- **Measurement Method:** K8s probe status; synthetic readiness checks during dependency failures
- **Related Work Packages:** WP-1.3

### NFR-005: SLI/SLO Monitoring
- **Description:** SLIs must be defined and SLOs set for availability, latency, error rate, and throughput, with dashboard and alerting.
- **Priority:** P1 (Should Have)
- **Category:** Observability
- **Source:** Nordstrom Standards — SLIs/SLOs (Section 4); Code Analysis — not documented
- **Current State:** Metrics published to StatsD (DataDog) and New Relic, but no formal SLI/SLO definitions or SLO-based alerting
- **Target State:** SLIs defined, SLOs set and monitored, dashboard live, burn-rate alerting active
- **Acceptance Criteria:**
  - Availability SLO: >= 99.9% (43 min downtime/month)
  - Latency SLO: p95 < 500ms, p99 < 1000ms for all routing endpoints
  - Error Rate SLO: < 1% of requests return 5xx
  - Throughput SLI tracked (requests per second)
  - Dashboard in DataDog/New Relic showing all SLIs
  - Alerts fire when SLOs at risk of breach (burn rate alerting)
  - Every alert links to runbook
- **Measurement Method:** Dashboard metrics; alert fire count; monthly SLO report
- **Related Work Packages:** WP-3.2

### NFR-006: Alerting with Runbooks
- **Description:** Every production alert must link to a runbook with investigation steps, remediation actions, and escalation paths.
- **Priority:** P1 (Should Have)
- **Category:** Observability
- **Source:** Nordstrom Standards — Alerting (Section 4)
- **Current State:** Metrics and monitoring exist (StatsD, New Relic) but runbooks not documented
- **Target State:** All alerts linked to runbook entries with structured troubleshooting guides
- **Acceptance Criteria:**
  - Each alert has: symptom, impact assessment, investigation steps, remediation actions, Splunk query, dashboard link, escalation path
  - Alert channels: PagerDuty for P1, Slack (#supply-chain-routing) for P2/P3
  - Runbook published to Confluence and linked from ERS home page
- **Measurement Method:** Incident post-mortem review of runbook usage; MTTR improvement
- **Related Work Packages:** WP-3.1

### NFR-007: Monitoring Dashboard
- **Description:** ERS must have a monitoring dashboard showing RED metrics, resource utilization, business metrics, and dependency health.
- **Priority:** P1 (Should Have)
- **Category:** Observability
- **Source:** Nordstrom Standards — Dashboards (Section 4)
- **Current State:** Metrics published to StatsD/DataDog and New Relic APM; dashboard configuration not documented
- **Target State:** Comprehensive dashboard with RED metrics, resource utilization, dependency health
- **Acceptance Criteria:**
  - Dashboard shows: request rate, error rate, latency (RED) for each endpoint
  - Dashboard shows: CPU utilization, memory usage, pod count
  - Dashboard shows: Redis (GEO + Capacity) connection health, Kafka producer lag
  - Dashboard shows: external service call latency and error rates (PCS, ETA, MLP, etc.)
- **Measurement Method:** Dashboard review; all panels populated with data
- **Related Work Packages:** WP-3.2

### NFR-008: Code Review Standards
- **Description:** All code changes must go through pull request review with at least 1 approving review, linked to a Jira story.
- **Priority:** P0 (Must Have)
- **Category:** Maintainability
- **Source:** Nordstrom Standards — Code Review (Section 5)
- **Current State:** Not audited (repository currently on GitLab; migrating to GitHub)
- **Target State:** GitHub PR process with branch protection rules, review requirements, linked Jira tickets
- **Acceptance Criteria:**
  - Branch protection on `main`: requires 1 approving review, no self-approvals
  - PR template includes: description, Jira link, checklist (correctness, security, testing, observability)
  - PR linked to Jira story via commit message or PR description
- **Measurement Method:** GitHub branch protection settings audit; PR review statistics
- **Related Work Packages:** WP-2.4, WP-3.7

### NFR-009: Integration Tests for API Endpoints
- **Description:** All REST API endpoints must have integration tests validating request/response contracts, error handling, and authentication.
- **Priority:** P0 (Must Have)
- **Category:** Reliability
- **Source:** Nordstrom Standards — Code Quality (Section 5); PRD Section 5 — Business Rules
- **Current State:** Test files exist (248 files) but integration test coverage for all 21 endpoints not verified
- **Target State:** Integration tests for all 21 REST endpoints using MockWebServer for external service mocks
- **Acceptance Criteria:**
  - Integration tests exist for all 3 routing endpoints (`/evaluateLocations`, `/extendRoute`, `/evaluateLastNode`)
  - Integration tests exist for configuration endpoints (feature flags, Redis variables, zipcodes)
  - Tests validate: successful responses, validation errors, external service failures, timeout handling
  - Tests run in CI pipeline
- **Measurement Method:** CI pipeline integration test results; endpoint test coverage report
- **Related Work Packages:** WP-1.2

### NFR-010: Performance Testing
- **Description:** User-facing routing API endpoints must be load-tested under expected production traffic patterns.
- **Priority:** P1 (Should Have)
- **Category:** Performance
- **Source:** Nordstrom Standards — Code Quality (Section 5); Execution Plan WP-2.4
- **Current State:** `application-routing-service-perf.properties` exists (performance test profile), suggesting some performance testing exists
- **Target State:** Automated performance tests in CI with baseline comparison
- **Acceptance Criteria:**
  - Performance tests for `/Routing/evaluateLocations` (primary routing endpoint)
  - Tests simulate expected production load (requests per second TBD by squad)
  - p95 latency threshold documented and enforced
  - Performance regression > 5% from baseline fails the pipeline (non-blocking initially)
  - Results tracked over time for trend analysis
- **Measurement Method:** CI performance test results; latency comparison against baseline
- **Related Work Packages:** WP-2.4

### NFR-011: Deployment Strategy
- **Description:** All production deployments must use zero-downtime strategy (blue-green or canary) with rollback capability within 5 minutes.
- **Priority:** P0 (Must Have)
- **Category:** Reliability
- **Source:** Nordstrom Standards — Deployment Strategy (Section 2)
- **Current State:** Nordstrom Standard Pipeline with environment progression (Dev → Test → Shadow Nonprod → Nonprod → Shadow Prod → Prod); shadow traffic mirroring via `ShadowTrafficFilter`
- **Target State:** Zero-downtime deployments with automated rollback on health check failure
- **Acceptance Criteria:**
  - Production deployments cause zero downtime
  - Rollback possible within 5 minutes
  - Health check failure triggers automatic rollback
  - Manual approval gates for nonprod and prod deployments
  - ServiceNow change request required for production
- **Measurement Method:** Deployment logs; rollback test drills; downtime tracking
- **Related Work Packages:** WP-2.4

### NFR-012: Input Validation
- **Description:** All external input must be validated at the API boundary using allowlists and proper validation patterns.
- **Priority:** P0 (Must Have)
- **Category:** Security
- **Source:** Nordstrom Standards — Input Validation (Section 1); Code Analysis — Bean validation with custom validators exists
- **Current State:** Bean validation implemented with custom constraint validators and annotations (`annotations/` package); custom exception hierarchy for validation errors (`RoutingRequestValidationException`, `RoutingRequestHeaderValidationException`)
- **Target State:** Comprehensive input validation on all endpoints; validation errors produce structured error responses
- **Acceptance Criteria:**
  - All POST endpoints validate request body (data types, ranges, lengths, formats)
  - Custom validators cover ERS-specific business rules
  - Validation errors return 400 with structured error response (field, message, constraint)
  - No SQL injection or XSS vectors (not applicable — no SQL database, no HTML rendering)
  - Integration tests verify validation for all endpoints
- **Measurement Method:** Validation test coverage; SAST scan results
- **Related Work Packages:** WP-1.2

### NFR-013: Linting and Formatting in CI
- **Description:** Code linting and formatting must be enforced in the CI pipeline using Spotless with Google Java Format.
- **Priority:** P0 (Must Have)
- **Category:** Maintainability
- **Source:** Nordstrom Standards — Code Standards (Section 5); Code Analysis — Spotless 2.20.2 already configured
- **Current State:** Spotless plugin configured in `build.gradle` with Google Java Format
- **Target State:** Spotless check runs in GitHub Actions CI; build fails on formatting violations
- **Acceptance Criteria:**
  - `./gradlew spotlessCheck` runs in CI pipeline
  - Build fails if code does not conform to Google Java Format
  - Pre-commit hook or CI check prevents unformatted code from merging
- **Measurement Method:** CI pipeline Spotless check results
- **Related Work Packages:** WP-2.4

### NFR-014: Distributed Tracing
- **Description:** Implement distributed tracing across service boundaries to support debugging of multi-service request flows.
- **Priority:** P1 (Should Have)
- **Category:** Observability
- **Source:** Nordstrom Standards — Logging (traceId, spanId fields); Code Analysis — no OpenTelemetry or distributed tracing detected
- **Current State:** No distributed tracing; no OpenTelemetry; no trace/span IDs in logs
- **Target State:** Trace and span IDs propagated across HTTP and Kafka boundaries; integrated with observability platform
- **Acceptance Criteria:**
  - traceId and spanId present in all log lines
  - Trace context propagated to external service calls (PCS, ETA, MLP, etc.)
  - Traces visible in monitoring platform (DataDog APM or New Relic)
  - Correlation ID linked to trace for cross-reference
- **Measurement Method:** Trace query in observability platform; trace completeness across service hops
- **Related Work Packages:** WP-1.1 (foundation), future implementation

### NFR-015: Code Scanning Completion Time
- **Description:** Repository code scanning must complete within 10 minutes to maintain workshop efficiency.
- **Priority:** P1 (Should Have)
- **Category:** Performance
- **Source:** PRD Section 6 — Non-Functional Requirements (Performance)
- **Acceptance Criteria:**
  - Code analysis of ERS repository (430 source files, 248 test files) completes in under 10 minutes
  - MCP queries to external systems complete within 30 seconds each
- **Measurement Method:** Wall clock time for analysis execution
- **Related Work Packages:** Code Analysis (completed)

### NFR-016: Scalability — Multiple Repositories
- **Description:** The analysis tooling must support applications with up to 20 related repositories and 50 Kafka topics.
- **Priority:** P1 (Should Have)
- **Category:** Performance
- **Source:** PRD Section 6 — Non-Functional Requirements (Scalability)
- **Acceptance Criteria:**
  - Analysis can be run against up to 20 repositories for a single application
  - Up to 50 Kafka topics can be inventoried and documented
  - Design documents can be up to 100 pages
- **Measurement Method:** Test with maximum scale parameters
- **Related Work Packages:** N/A (tooling requirement)

### NFR-017: Audit Trail for Analysis
- **Description:** All MCP queries and analysis activities must be logged for audit purposes, tracking which standards were checked and their assessment.
- **Priority:** P1 (Should Have)
- **Category:** Compliance
- **Source:** PRD Section 6 — Non-Functional Requirements (Observability)
- **Acceptance Criteria:**
  - All MCP server queries logged with: server name, query parameters, response summary, timestamp
  - Standards checklist tracked with assessment per standard area
  - History of gap assessments maintained for measuring improvement over time
- **Measurement Method:** Audit log review; compliance history report
- **Related Work Packages:** N/A (tooling requirement)

### NFR-018: No Credentials in Documentation
- **Description:** Generated documentation must not contain any credentials, API tokens, or secrets.
- **Priority:** P0 (Must Have)
- **Category:** Security
- **Source:** PRD Section 6 — Security; Nordstrom Standards — Secrets Management
- **Acceptance Criteria:**
  - Automated scan of all generated documentation (design doc, stories, runbook) for credential patterns
  - Environment variable names referenced but values never included
  - Redis hostnames, Kafka bootstrap servers documented but passwords/tokens excluded
  - Review checklist includes credential check for all documents
- **Measurement Method:** Regex scan for credential patterns (API_KEY=, password=, token=, secret=) in generated docs
- **Related Work Packages:** All documentation WPs