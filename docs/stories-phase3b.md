# Phase 3B: Team Enablement — User Stories

**Project:** APP00344 Enterprise Routing Service (ERS)
**Phase:** 3B — Enablement & Comprehensive Stories
**Sprint:** Sprint 6 (Weeks 11-12)
**Generated:** 2026-02-25
**Source:** docs/requirements.md, docs/detailed-design.md, docs/execution-plan.md

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 11 |
| Total Story Points | 22 |
| Sprint | Sprint 6 |
| Epics | 2 (EPIC-5: Team Enablement, EPIC-6: Security & Auth) |

### Point Distribution

| Work Package | Stories | Points |
|--------------|---------|--------|
| WP-3.5: Authentication Documentation | 2 | 3 |
| WP-3.6: Kafka Integration Documentation | 2 | 3 |
| WP-3.7: Onboarding Guide | 3 | 5 |
| WP-3.8: User Story Templates | 2 | 8 |
| WP-3.9: CI/CD Pipeline Templates | 2 | 3 |
| **Total** | **11** | **22** |

---

## Story Map

| Epic | Sprint 6 |
|------|----------|
| EPIC-5: Team Enablement | US-501, US-502, US-503, US-504, US-505, US-506, US-507, US-508, US-509 |
| EPIC-6: Security & Auth | US-601, US-602 |

---

## Requirements Coverage (Phase 3B)

| Requirement | Stories | Status |
|------------|---------|--------|
| BR-002: Implementation-Ready Stories for Compliance | US-507, US-508 | Covered |
| BR-003: Reduced Onboarding Time | US-504, US-505, US-506 | Covered |
| BR-005: Reusable Documentation Templates | US-508, US-509 | Covered |
| FR-011: Onboarding Guide | US-504, US-505, US-506 | Covered |
| FR-012: Authentication Architecture Documentation | US-601, US-602 | Covered |
| FR-013: Kafka Event Schema Documentation | US-501, US-502 | Covered |
| FR-014: CI/CD Configuration Templates | US-503, US-509 | Covered |
| NFR-003: Authentication & Authorization | US-601, US-602 | Covered |

---

## EPIC-5: Team Enablement

### US-501: Document Kafka Event Schemas and Topic Contracts

**Story:**
As a squad engineer,
I want a single reference document for all Kafka topics produced by ERS — including Avro schemas, sample events, producer details, known consumers, and retention policies,
So that I can understand event contracts without searching across Confluent Cloud, code, and Slack threads.

**Priority:** P2
**Story Points:** 2
**Sprint:** Sprint 6
**Requirements:** FR-013, FR-002

**Acceptance Criteria:**

```gherkin
Given the Kafka schema documentation page exists in Confluence,
When a squad engineer looks up the inventory-routing-decision-made-avro topic,
Then they find: Avro schema (retrieved from Schema Registry), schema name and version, sample event payload, producer class (Spring Kafka default topic producer), known downstream consumers, retention policy, partitioning strategy, and Confluent Cloud cluster details (nonprod: lkc-z30oqd, prod: lkc-r2dyv9).

Given the Kafka schema documentation page exists in Confluence,
When a squad engineer looks up the NAP event topic (${NAP_EVENT_TOPIC}),
Then they find: Avro schema, producer class (NAPEventConstructor.java), key fields (networkAnalysis, locationEvaluations, businessMetrics), and the same metadata as above.

Given the Kafka schema documentation page exists in Confluence,
When a squad engineer looks up the Routing Insights event topic (${ROUTING_INSIGHTS_EVENT_TOPIC}),
Then they find: Avro schema, producer class (RoutingInsightsEventConstructor.java), key fields (routingInsights, performanceMetrics, algorithmMetadata), and the same metadata as above.

Given all 3 topic entries are documented,
When reviewed against the code analysis and Schema Registry,
Then every field in the documentation matches the actual schema version currently deployed.
```

**Technical Notes:**
- **Data Sources:** Avro schemas from `nordstrom-schema-repo` MCP server; producer details from `docs/code-analysis.md` and `docs/detailed-design.md` Section 2.2
- **Topics:** `inventory-routing-decision-made-avro`, `${NAP_EVENT_TOPIC}`, `${ROUTING_INSIGHTS_EVENT_TOPIC}`
- **Kafka Config:** SASL_SSL + OAUTHBEARER (Okta), Zstandard compression, acks=1, retries=1, auto-register=false
- **Schema Registry:** Nonprod: `https://schema-registry-nonprod-us-west-2.nordstromaws.app`, Prod: `https://schema-registry-prod-us-west-2.nordstromaws.app`
- **Deliverable:** Confluence page linked from ERS home page (https://confluence.nordstrom.com/spaces/SCh/pages/495622523)
- **Open Question OQ-002:** Downstream consumers of these 3 topics are not documented — squad must provide this information

**Definition of Done:**
- [ ] Confluence page published with all 3 topic entries
- [ ] Avro schemas retrieved from Schema Registry and embedded in documentation
- [ ] Sample event payloads included for each topic
- [ ] Producer class, key fields, and configuration documented per topic
- [ ] Page linked from ERS Confluence home page
- [ ] Reviewed and approved by squad lead

---

### US-502: Define Kafka Schema Evolution Policy

**Story:**
As a squad engineer,
I want a documented schema evolution policy for ERS Kafka events — specifying compatibility mode, versioning conventions, and the process for making schema changes,
So that downstream consumers are not broken by schema updates and the team follows a consistent process.

**Priority:** P2
**Story Points:** 1
**Sprint:** Sprint 6
**Requirements:** FR-013

**Acceptance Criteria:**

```gherkin
Given the schema evolution policy document exists,
When a squad engineer needs to add a new field to the inventory-routing-decision-made-avro schema,
Then the document specifies: compatibility mode (backward, forward, or full), required review process, how to test compatibility against Schema Registry, and the versioning convention for schema changes.

Given the schema evolution policy document exists,
When reviewed against Confluent Schema Registry configuration,
Then the documented compatibility mode matches the actual Schema Registry compatibility setting for each ERS topic.
```

**Technical Notes:**
- **Deliverable:** Section within the Kafka documentation Confluence page (US-501) or standalone sub-page
- **Schema Registry:** auto-register=false means schemas must be pre-registered — document the registration process
- **Compatibility Modes:** Document which mode is configured (BACKWARD recommended for Avro) and why
- **Process:** Include steps for: 1) draft schema change, 2) compatibility check via Schema Registry API, 3) register new version, 4) deploy producer, 5) notify consumers
- **Reference:** Confluent Schema Registry compatibility rules documentation

**Definition of Done:**
- [ ] Schema evolution policy documented (compatibility mode, versioning, process)
- [ ] Policy validated against actual Schema Registry settings
- [ ] Schema change checklist included
- [ ] Reviewed and approved by squad lead

---

### US-503: Document GitHub Actions CI/CD Pipeline Configuration

**Story:**
As a squad engineer,
I want complete documentation of the ERS GitHub Actions CI/CD pipeline — covering every job, stage, environment variable, approval gate, and the rollback process,
So that I can understand, troubleshoot, and modify the pipeline without reverse-engineering the YAML.

**Priority:** P2
**Story Points:** 2
**Sprint:** Sprint 6
**Requirements:** FR-014, BR-005

**Acceptance Criteria:**

```gherkin
Given the CI/CD pipeline documentation exists in Confluence,
When a squad engineer opens the page,
Then they find a pipeline diagram showing all stages in order: lint (Spotless), build (Gradle), unit test (JaCoCo), SAST (CodeQL), dependency check (OWASP/Trivy), container build, container scan, integration test, and deploy stages (dev → test → shadow nonprod → nonprod → shadow prod → prod).

Given the CI/CD pipeline documentation exists in Confluence,
When a squad engineer looks up the production deployment section,
Then they find: manual approval gate requirements, ServiceNow change request integration steps, rollback procedure with expected time (<5 minutes), and health check failure auto-rollback behavior.

Given the CI/CD pipeline documentation exists in Confluence,
When a squad engineer needs to configure a new environment variable for the pipeline,
Then they find a complete list of all pipeline environment variables and secrets (names only, no values) with descriptions of each.
```

**Technical Notes:**
- **Deliverable:** Confluence page linked from ERS home page
- **Pipeline Source:** `.github/workflows/ci.yml` (designed in WP-2.4, TR-005)
- **Key Jobs:** Spotless check, Gradle build, JaCoCo coverage (80% threshold), CodeQL SAST, OWASP Dependency Check or Trivy, container image build + scan, integration tests, deploy with approval gates
- **Secrets:** Document names (KAFKA_CLIENT_SECRET, MLP_CLIENT_SECRET, PCS_API_KEY, GUROBI_LICENSE, etc.) without values
- **Rollback:** Document manual rollback script (`scripts/rollback.sh`) and automated rollback on health check failure
- **Dependency:** WP-2.4 (GitHub Actions pipeline must be designed/implemented first)

**Definition of Done:**
- [ ] Confluence page published with pipeline diagram and stage descriptions
- [ ] All environment variables and secrets listed (names only)
- [ ] Deployment process documented (dev through prod with approval gates)
- [ ] Rollback procedure documented with step-by-step instructions
- [ ] ServiceNow integration for production deploys documented
- [ ] Reviewed and approved by squad lead

---

### US-504: Create Day 1 Onboarding Guide

**Story:**
As a new team member joining the ERS squad,
I want a Day 1 onboarding guide that walks me through access requests, repository setup, local environment configuration, and running the application and tests,
So that I can have a working development environment and run the application locally by end of my first day.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 6
**Requirements:** FR-011, BR-003

**Acceptance Criteria:**

```gherkin
Given a new engineer has received their Nordstrom laptop and network access,
When they follow the Day 1 onboarding guide,
Then they have: GitHub access to APP00344-routing-service repository, the repo cloned locally, Java 17 and Gradle 8.14.2 installed, Docker running with Redis and Kafka containers for local development, the application compiling successfully (./gradlew compileJava), and the test suite passing (./gradlew test).

Given a new engineer follows the Day 1 access request checklist,
When they submit all listed access requests,
Then they have requested access to: GitHub organization, Confluent Cloud (nonprod), DataDog/New Relic, Splunk, Confluence space (SCh), Jira project, and Kubernetes namespace (nonprod).

Given a new engineer has completed the Day 1 guide,
When they encounter a setup issue not covered by the guide,
Then the guide includes a troubleshooting section covering the 5 most common setup issues (e.g., Java version mismatch, Docker resource limits, Redis connection failures, Kafka authentication errors, Gradle proxy configuration).
```

**Technical Notes:**
- **Deliverable:** Confluence page published under ERS home page (https://confluence.nordstrom.com/spaces/SCh/pages/495622523)
- **Tech Stack for Local Setup:** Java 17, Gradle 8.14.2, Docker (for Redis and Kafka), IDE (IntelliJ recommended)
- **Access Requests:** GitHub (APP00344-routing-service), Confluent Cloud, DataDog/New Relic, Splunk, Confluence (SCh), Jira, K8s (nonprod)
- **Environment Variables:** List all required env vars from detailed-design.md Section 2.7 (names only, not values) with instructions on where to get credentials
- **Spring Profiles:** Document `dev` profile for local development
- **Reference:** docs/detailed-design.md Section 1.6 (tech stack), Section 2.7 (configuration)

**Definition of Done:**
- [ ] Confluence page published with Day 1 checklist
- [ ] Access request list complete with links to request portals
- [ ] Local environment setup instructions tested on a clean machine
- [ ] Application build and test commands verified
- [ ] Troubleshooting section covers top 5 common issues
- [ ] Reviewed and approved by squad lead

---

### US-505: Create Week 1 Architecture Walkthrough Guide

**Story:**
As a new team member in my first week,
I want an architecture walkthrough guide that explains the ERS system architecture, code structure, key patterns, and walks me through my first code contribution,
So that I understand how the system works and can submit my first pull request by end of Week 1.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 6
**Requirements:** FR-011, BR-003

**Acceptance Criteria:**

```gherkin
Given the Week 1 architecture walkthrough guide exists,
When a new engineer reads the architecture overview section,
Then they understand: the system context (COM/Merch Search → ERS → fulfillment locations), the layered architecture (Controllers → Processors → Domain Clients), all 9 external service dependencies (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS), the dual Redis cluster design (GEO + Capacity), and the 3 Kafka producer topics.

Given the Week 1 guide exists,
When a new engineer reads the code walkthrough section,
Then it traces a complete request flow from RoutingV2Controller through ShippingDependenciesProcessor to external service calls and Kafka event publishing, referencing specific file names and package structure from docs/detailed-design.md Section 1.3.

Given the Week 1 guide exists,
When a new engineer follows the "First PR" exercise,
Then they have: identified a TODO/FIXME comment to address (or a small improvement), created a feature branch, made the change, written a unit test, run the full test suite, and opened a PR following the team's PR template.
```

**Technical Notes:**
- **Deliverable:** Confluence page published under ERS home page
- **Architecture Diagrams:** Reference diagrams from design document (WP-3.3): system context, container, component, deployment
- **Code Structure:** Follow package layout from detailed-design.md Section 1.3 (config → controllers → processors → domain → entities → annotations)
- **Key Patterns:** Bean validation with custom annotations, Hystrix circuit breakers (current) / Resilience4j (target), dual Redis cluster caching, Kafka event publishing with Avro serialization
- **First PR Exercise:** Use one of the 17 TODO/FIXME items identified in code analysis as a starter task (if any remain after WP-3.4)
- **Dependency:** WP-3.3 (Design Document) for architecture diagrams

**Definition of Done:**
- [ ] Confluence page published with architecture overview and code walkthrough
- [ ] Request flow trace documented with specific file references
- [ ] Key patterns section covers circuit breakers, Redis caching, Kafka publishing
- [ ] First PR exercise defined with step-by-step instructions
- [ ] Reviewed and approved by squad lead and at least one senior engineer

---

### US-506: Create Month 1 Contribution Milestones Guide

**Story:**
As a new team member completing my first month,
I want a Month 1 milestones guide covering on-call shadowing, feature implementation, and sprint planning participation,
So that I am fully integrated into the squad's development and operational workflows within 30 days.

**Priority:** P1
**Story Points:** 1
**Sprint:** Sprint 6
**Requirements:** FR-011, BR-003

**Acceptance Criteria:**

```gherkin
Given the Month 1 milestones guide exists,
When a new engineer reads the on-call shadowing section,
Then they find: the on-call rotation schedule, the runbook location (Confluence — from WP-3.1), Splunk query index, escalation paths (L1 through L4), PagerDuty setup instructions, and a checklist of scenarios to shadow (high latency, error rate spike, circuit breaker open, Redis failure, Kafka publish failure, pod crash loop).

Given the Month 1 milestones guide exists,
When a new engineer reads the feature implementation section,
Then they find: guidance on picking a medium-complexity story (3-5 points), the expected workflow (Jira → branch → implement → test → PR → deploy to dev), and a list of recommended starter features that touch multiple layers of the stack.

Given a new engineer has completed all Day 1, Week 1, and Month 1 milestones,
When surveyed about their onboarding experience,
Then they self-report being productive (able to pick up and complete stories independently) within 1 week or less, meeting the BR-003 success metric.
```

**Technical Notes:**
- **Deliverable:** Confluence page published under ERS home page
- **On-Call:** Reference runbook from WP-3.1, SLI/SLO definitions from WP-3.2, monitoring dashboard from WP-3.2
- **Sprint Planning:** Document the team's sprint ceremony schedule, story point estimation approach, and Definition of Ready
- **Feedback Loop:** Include a short onboarding feedback survey (3-5 questions) to measure the <=1 week onboarding target (BR-003)
- **Dependencies:** WP-3.1 (Runbook), WP-3.2 (SLI/SLO) — both Phase 3A deliverables available by Sprint 6

**Definition of Done:**
- [ ] Confluence page published with Month 1 milestones
- [ ] On-call shadowing checklist complete with runbook and dashboard links
- [ ] Feature implementation workflow documented
- [ ] Onboarding feedback survey template created
- [ ] Reviewed and approved by squad lead

---

### US-507: Generate Implementation-Ready User Stories for Compliance Gaps (Epics 1-3)

**Story:**
As a squad lead,
I want implementation-ready user stories for all Observability, Security, and Testing compliance gaps — with specific file paths, acceptance criteria, effort estimates, and sprint assignments,
So that the squad can pick up gap remediation work immediately without further story refinement.

**Priority:** P0
**Story Points:** 5
**Sprint:** Sprint 6
**Requirements:** BR-002, FR-007

**Acceptance Criteria:**

```gherkin
Given the user stories document (docs/user-stories.md) is generated,
When a squad lead reviews Epic 1 (Observability & Correlation),
Then it contains stories covering: CorrelationIdFilter implementation, CorrelationIdHolder (ThreadLocal), Kafka header injection, MDC integration for all log statements, and integration tests for end-to-end propagation — each story referencing specific Java files and packages from the code analysis.

Given the user stories document is generated,
When a squad lead reviews Epic 2 (Security & Compliance),
Then it contains stories covering: PiiMaskingUtil for ZIP+4 masking (retain first 3 digits, mask remainder as 981**-****), request body logging integration, PII audit, and secrets inventory documentation — each story referencing specific classes and configuration files.

Given the user stories document is generated,
When a squad lead reviews Epic 3 (Testing & Quality),
Then it contains stories covering: JaCoCo plugin configuration in build.gradle, 80% coverage threshold enforcement, DTO exclusions, integration tests for all 3 routing endpoints (/evaluateLocations, /extendRoute, /evaluateLastNode), and integration tests for configuration endpoints.

Given any individual story in the document,
When reviewed against BR-002 acceptance criteria,
Then it includes: user story format title, description specific to ERS, file paths to modify, acceptance criteria (Given/When/Then), story points, priority, sprint assignment, and testing requirements.
```

**Technical Notes:**
- **Deliverable:** `docs/user-stories.md` — Epics 1-3 section
- **Epic 1 (Observability):** ~13 stories from WP-1.1 (correlation IDs), WP-1.3 (readiness endpoint), WP-3.2 (SLI/SLO)
- **Epic 2 (Security):** ~8 stories from WP-1.4 (PII masking), WP-3.5 (auth documentation)
- **Epic 3 (Testing):** ~13 stories from WP-1.2 (test coverage enforcement, integration tests)
- **Source Data:** All gaps from docs/detailed-design.md Part 4 (Gap Analysis), file references from docs/code-analysis.md
- **Story Format:** As a [role], I want [capability], So that [value] — with Given/When/Then acceptance criteria
- **Target:** ~34 stories across Epics 1-3
- **Dependencies:** WP-3.3 (Design Doc) for gap details; all Phase 1 and Phase 2 WPs for gap inventory

**Definition of Done:**
- [ ] Epics 1-3 stories written to docs/user-stories.md
- [ ] Each story has: title, description, file paths, acceptance criteria, points, priority, sprint
- [ ] All Phase 1 compliance gaps (correlation IDs, PII masking, test coverage, readiness endpoint) have corresponding stories
- [ ] Story-to-gap traceability is 100% for Epics 1-3
- [ ] Reviewed and approved by squad lead

---

### US-508: Generate Implementation-Ready User Stories for Modernization and Documentation Gaps (Epics 4-5)

**Story:**
As a squad lead,
I want implementation-ready user stories for all Modernization and Documentation gaps — covering Spring Boot upgrade, Hystrix migration, large class refactoring, CI/CD pipeline, and documentation deliverables,
So that the full backlog of remediation work is captured with enough detail for sprint planning.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 6
**Requirements:** BR-002, FR-007, BR-005

**Acceptance Criteria:**

```gherkin
Given the user stories document (docs/user-stories.md) is generated,
When a squad lead reviews Epic 4 (Modernization),
Then it contains stories covering: Spring Boot 2.7.15 → 3.3.x upgrade (Java 11 → 17, javax → jakarta namespace), Hystrix → Resilience4j migration for all 9+ external service circuit breakers, ShippingDependenciesProcessor refactoring (607 lines → <400 per class), NAPEventConstructor refactoring (476 lines), RoutingInsightsEventConstructor refactoring (509 lines), and GitHub Actions CI/CD pipeline implementation.

Given the user stories document is generated,
When a squad lead reviews Epic 5 (Documentation),
Then it contains stories covering: runbook (WP-3.1), SLI/SLO definition (WP-3.2), design document generation (WP-3.3), Kafka schema documentation (WP-3.6), and onboarding guide (WP-3.7).

Given all 5 epics are complete in docs/user-stories.md,
When the total story count is tallied,
Then the document contains approximately 92 stories organized across 5 epics with a requirements coverage table showing 100% of identified gaps have corresponding stories.
```

**Technical Notes:**
- **Deliverable:** `docs/user-stories.md` — Epics 4-5 section
- **Epic 4 (Modernization):** ~34 stories from WP-2.1 (Spring Boot upgrade), WP-2.2 (Hystrix→Resilience4j), WP-2.3 (large class refactoring), WP-2.4 (GitHub Actions CI/CD)
- **Epic 5 (Documentation):** ~24 stories from WP-3.1, WP-3.2, WP-3.3, WP-3.6, WP-3.7
- **Spring Boot Upgrade:** Reference detailed-design.md Section 1.6 (tech stack) and TR-006 for full migration scope
- **Hystrix Migration:** Reference all circuit breaker instances across 9 external service clients (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS)
- **P2 Stories:** Spring Boot upgrade and Hystrix migration stories should be marked P2 (backlog) per team decision
- **Dependencies:** Depends on complete gap inventory from WP-3.3 (Design Document)

**Definition of Done:**
- [ ] Epics 4-5 stories written to docs/user-stories.md
- [ ] Spring Boot upgrade stories cover all migration steps (Java 17, Jakarta EE, dependency updates, regression testing)
- [ ] Resilience4j migration stories cover all 9+ external service clients
- [ ] Refactoring stories specify target class decomposition per detailed-design.md
- [ ] Documentation stories cover all Phase 3 deliverables
- [ ] Full requirements coverage table shows 100% gap-to-story mapping
- [ ] Reviewed and approved by squad lead

---

### US-509: Create Reusable CI/CD Pipeline Templates

**Story:**
As an infrastructure engineer on another squad,
I want reusable GitHub Actions workflow templates for Java/Spring Boot services — with documented customization points and a quick-start guide,
So that I can set up a compliant CI/CD pipeline for my service without starting from scratch.

**Priority:** P1
**Story Points:** 1
**Sprint:** Sprint 6
**Requirements:** FR-014, BR-005

**Acceptance Criteria:**

```gherkin
Given the reusable CI/CD template repository/directory exists,
When an engineer from another squad reviews the template,
Then they find: a reusable workflow file (.github/workflows/ci-template.yml) with parameterized inputs for service name, Java version, coverage threshold, deployment environments, and approval requirements.

Given the CI/CD template documentation exists,
When an engineer from another squad follows the quick-start guide,
Then they can configure the template for their service by: copying the workflow file, setting 5 or fewer required parameters, and having a working pipeline that includes lint, build, test, SAST, container scan, and deploy stages.
```

**Technical Notes:**
- **Deliverable:** Reusable workflow template file (`.github/workflows/ci-template.yml`) and documentation page in Confluence
- **Customization Points:** Service name, Java version (11/17/21), test coverage threshold, deployment target environments, approval gate configuration, container registry
- **Template Source:** Based on ERS pipeline (WP-2.4, TR-005) with ERS-specific values parameterized
- **Rollback Script:** Include a generic `scripts/rollback.sh` template
- **Success Metric:** BR-005 — template reused by at least one other squad (validation happens post-Sprint 6)
- **Dependency:** WP-2.4 (GitHub Actions pipeline for ERS must be implemented first)

**Definition of Done:**
- [ ] Reusable workflow template created with parameterized customization points
- [ ] Quick-start guide documented in Confluence
- [ ] Template tested by applying it to at least one other service (or validated by dry-run)
- [ ] Rollback script template included
- [ ] Reviewed and approved by squad lead

---

## EPIC-6: Security & Auth

### US-601: Document Current and Target Authentication Architecture

**Story:**
As a squad engineer,
I want documentation of the current authentication model (network-level only) and the target state (mTLS/OAuth2 + RBAC) with a security architecture diagram,
So that I understand the security posture of ERS today and what needs to change to meet Nordstrom authentication standards.

**Priority:** P0
**Story Points:** 2
**Sprint:** Sprint 6
**Requirements:** FR-012, NFR-003

**Acceptance Criteria:**

```gherkin
Given the authentication architecture documentation exists in Confluence,
When a squad engineer reads the current state section,
Then they find: the current network-level-only authentication model documented (internal LB, no application-layer auth, no @PreAuthorize, no @Secured, no OAuth2 resource server, no API key validation), with a diagram showing the current security boundary, and explicit callout that any service on the internal network or peered VPCs can call all 21 ERS endpoints without authentication.

Given the authentication architecture documentation exists in Confluence,
When a squad engineer reads the target state section,
Then they find: the target mTLS/OAuth2 client credentials model with a security architecture diagram (from detailed-design.md Section 1.7), the 3 RBAC roles defined (routing-reader, routing-writer, config-admin per ADR-011), and the complete endpoint-to-role mapping for all 21 REST endpoints across 6 controllers.

Given the authentication documentation exists,
When reviewed against the detailed-design.md Section 1.7 and the gap analysis (Gap #2),
Then all information is consistent and the document references: the compliance gap (P0, NFR-003), the ADR (ADR-011), and the specific endpoints and roles from the design document.
```

**Technical Notes:**
- **Deliverable:** Confluence page linked from ERS home page
- **Current State:** Network-level only — internal LB, no application-layer auth. Documented as Gap #2 (P0) in detailed-design.md Part 4.
- **Target State:** mTLS/OAuth2 for service-to-service + RBAC at API layer. See detailed-design.md Section 1.7 (Security Architecture) for diagrams.
- **RBAC Roles (ADR-011):**
  - `routing-reader` — `/Routing/*` (GET), `/RuleConfig/get*`, `/VariableConfig/get*`, `/Planout/getPlanout`
  - `routing-writer` — (no specific endpoints currently; reserved for future write operations on routing endpoints)
  - `config-admin` — `/RuleConfig/update*`, `/RuleConfig/delete*`, `/VariableConfig/create*`, `/VariableConfig/delete*`, `/Routing/updateZipCodes`, `/Routing/deleteZipCodes`, `/Planout/updatePlanout`
- **Controllers (6):** RoutingV2Controller, ExtendRoutingController, EvalLastNodeController, RuleConfigController, RedisVariableConfigController, RoutingZipcodeConfigController, PlanoutController
- **Security:** This is a DOCUMENTATION story — no code changes. Implementation stories for auth enforcement are in the gap stories (US-507/US-508).

**Definition of Done:**
- [ ] Confluence page published with current state and target state auth architecture
- [ ] Security architecture diagrams included (current and target)
- [ ] RBAC role definitions and endpoint mapping documented
- [ ] All 21 endpoints mapped to roles
- [ ] Gap reference (Gap #2, P0, NFR-003) and ADR-011 cited
- [ ] Reviewed and approved by squad lead and security team representative

---

### US-602: Create ERS Threat Model

**Story:**
As a squad engineer,
I want a threat model for ERS that identifies attack surfaces, threat actors, and mitigations — covering the 9 external service integrations, 2 Redis clusters, 3 Kafka topics, and 21 REST endpoints,
So that security risks are documented and the team can prioritize remediation of the highest-risk attack vectors.

**Priority:** P0
**Story Points:** 1
**Sprint:** Sprint 6
**Requirements:** FR-012, NFR-003

**Acceptance Criteria:**

```gherkin
Given the ERS threat model document exists,
When reviewed by a security-aware engineer,
Then it identifies at minimum: the attack surface (21 REST endpoints with no app-layer auth, 9 outbound service integrations, 2 Redis clusters, 3 Kafka producer connections), the primary threat actors (rogue internal service, compromised network neighbor, malicious insider), and the top 5 threats ranked by risk (likelihood x impact).

Given the ERS threat model document exists,
When reviewed alongside the authentication architecture documentation (US-601),
Then each identified threat has a corresponding mitigation — either already in place (e.g., network-level isolation, Redis password auth) or planned (e.g., mTLS/OAuth2, RBAC) with a reference to the relevant work package or user story.
```

**Technical Notes:**
- **Deliverable:** Section within the authentication architecture Confluence page (US-601) or standalone sub-page
- **Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) recommended
- **Attack Surface:**
  - 21 REST endpoints (no app-layer auth today — Gap #2)
  - 9 outbound HTTP integrations (PCS with API key, MLP with OAuth2, 6 with network-level only)
  - 2 Redis clusters (password auth)
  - 3 Kafka topics (OAuth2/Okta via SASL_SSL)
  - DynamoDB (IAM/STS via library)
- **Existing Mitigations:** Internal LB, network isolation, Redis passwords, Kafka SASL_SSL, MLP OAuth2
- **Planned Mitigations:** mTLS/OAuth2 (NFR-003), RBAC (ADR-011), PII masking (TR-004), secrets rotation (TR-012)
- **Note:** This is a lightweight threat model appropriate for documentation scope — not a full penetration test

**Definition of Done:**
- [ ] Threat model document published to Confluence
- [ ] Attack surface inventory complete (endpoints, integrations, data stores)
- [ ] Top threats identified and ranked
- [ ] Each threat has an existing or planned mitigation with story/WP reference
- [ ] Reviewed and approved by squad lead

---

## Appendix: Story Dependency Map

```
Sprint 6 — Phase 3B Dependencies

Independent (can start immediately):
├── US-501: Kafka Event Schemas (data from Schema Registry + code analysis)
├── US-502: Schema Evolution Policy (policy definition)
├── US-504: Day 1 Onboarding Guide (access + setup)
├── US-601: Auth Architecture Documentation (from design doc)
└── US-602: Threat Model (from design doc + code analysis)

Depends on WP-2.4 (Phase 2):
├── US-503: CI/CD Pipeline Documentation (needs pipeline to document)
└── US-509: Reusable CI/CD Templates (needs pipeline as basis)

Depends on WP-3.3 (Phase 3A):
├── US-505: Week 1 Architecture Walkthrough (needs architecture diagrams)
└── US-506: Month 1 Milestones (needs runbook + SLI/SLO from Phase 3A)

Depends on all gap inventory:
├── US-507: Stories for Epics 1-3 (needs complete gap analysis)
└── US-508: Stories for Epics 4-5 (needs complete gap analysis)
```
