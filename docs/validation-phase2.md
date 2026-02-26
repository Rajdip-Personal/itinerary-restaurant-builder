# Validation Report: Phase 2 — Modernization & CI/CD

**Project:** APP00344 Enterprise Routing Service (ERS)
**Phase:** Phase 2 — Modernization & Tech Debt (Sprints 3-4)
**Validated:** 2026-02-25
**Source Stories:** docs/stories-phase2.md (16 stories, 55 pts)
**Source Requirements:** docs/requirements.md (50 requirements; Phase 2 subset)
**Source Design:** docs/detailed-design.md
**Source Plan:** docs/execution-plan.md

---

## Summary

- **Stories Validated:** 16
- **Requirements Covered:** 11/11 (all Phase 2 requirements)
- **Gaps Found:** 2 (minor)
- **Quality Score:** 8/10

---

## Requirements Coverage Matrix

| Requirement | Priority | Description | Stories | Coverage Status | Notes |
|-------------|----------|-------------|---------|-----------------|-------|
| TR-005 (GitHub Actions CI/CD) | P0 | GitHub Actions pipeline with SAST, container scan, deploy | US-314, US-315, US-316 | **Covered** | CI workflow (US-314), security scanning (US-315), deployment + rollback (US-316) |
| TR-006 (Spring Boot 3.3.x Upgrade) | P2 | Java 17, Spring Boot 3.3.x, Jakarta EE migration | US-301, US-302, US-303, US-304, US-305, US-306 | **Covered** | 6 stories decompose upgrade into Java (US-301), Spring Boot + javax→jakarta (US-302), dependencies (US-303), deprecated APIs (US-304), regression/perf (US-305), shadow validation (US-306) |
| TR-007 (Hystrix → Resilience4j) | P2 | Replace Hystrix with Resilience4j circuit breakers, retry, rate limiting | US-307, US-308, US-309, US-310 | **Covered** | Dependencies (US-307), circuit breaker migration (US-308), retry + rate limiting (US-309), Hystrix removal (US-310) |
| TR-008 (Large Class Refactoring) | P2 | Refactor 3 classes >400 lines | US-311, US-312, US-313 | **Covered** | One story per class: ShippingDependenciesProcessor (US-311), NAPEventConstructor (US-312), RoutingInsightsEventConstructor (US-313) |
| TR-010 (K8s Resource Config) | P1 | Resource requests/limits, HPA, PDB | US-316 | **Covered** | K8s manifest updates included in deploy workflow story (resource limits, HPA, PDB all specified in acceptance criteria) |
| TR-011 (Container Security) | P1 | Approved base image, non-root, scanning | US-315, US-316 | **Covered** | Container scan in CI (US-315), Dockerfile non-root + approved base image (US-315 technical notes), deploy manifests (US-316) |
| NFR-008 (Code Review Standards) | P0 | Branch protection, 1 approving review | US-314 | **Covered** | Branch protection rules in US-314 acceptance criteria (require 1 approving review, no self-approvals) |
| NFR-009 (Integration Tests) | P0 | Integration tests for API endpoints | US-306 | **Partial** | US-306 covers shadow deployment validation and regression suite, but is primarily a validation story, not a test-writing story. However, US-305 also covers regression testing. Acceptable since Phase 1 WP-1.2 is the primary driver for integration test coverage. |
| NFR-010 (Performance Testing) | P1 | Load testing for routing endpoints | US-305, US-316 | **Covered** | Performance benchmarking in US-305 (p95 within 5% baseline), performance validation referenced in US-316 deployment |
| NFR-011 (Deployment Strategy) | P0 | Zero-downtime, rollback within 5 min | US-316 | **Covered** | Rolling update with PDB, health-check-triggered rollback, manual approval gates, ServiceNow CR for prod |
| NFR-013 (Linting in CI) | P0 | Spotless check in CI | US-314 | **Covered** | spotlessCheck job explicitly listed in US-314 acceptance criteria |

### Coverage Summary

- **Fully Covered:** 10/11
- **Partially Covered:** 1/11 (NFR-009 — addressed primarily in Phase 1; Phase 2 covers regression testing)
- **Uncovered:** 0/11

---

## Gap Analysis

### Coverage Gaps

1. **NFR-009 (Integration Tests) — Minor Gap:** The Phase 2 stories reference regression testing and shadow validation but do not include stories specifically for writing new integration tests for the Spring Boot 3.3.x migrated endpoints. This is acceptable because:
   - Phase 1 (WP-1.2) is the primary driver for integration test coverage
   - US-305 validates the existing regression suite passes after the upgrade
   - New integration tests for Spring Boot 3 API changes are implicitly covered by the US-305 technical notes ("Fix any test failures caused by Spring Boot 3 API changes")

2. **Missing PAS/SCA/EAVS from Retry Policy Design:** The design document's retry policies table (Section 2.5) omits PAS, SCA, and EAVS services. US-308 correctly lists all 9 services for circuit breaker migration, but US-309 only specifies retry configurations for PCS, ETA, MLP, Item Service, Ship By Time, and Redis — missing PAS, SCA, and EAVS retry policies. This is a minor gap since SCA is a library call (not HTTP) and PAS/EAVS may not need distinct retry policies, but should be explicitly documented.

### Orphan Stories

**None.** All 16 stories trace to at least one requirement.

### Design Misalignments

1. **Circuit Breaker Sliding Window Size — Minor Inconsistency:**
   - US-307 specifies `slidingWindowSize=10` for **all** circuit breaker instances
   - The design document's retry policies table shows MLP RTS and MLP STD with a threshold of "50% failure rate / **5 calls**" (implying slidingWindowSize=5)
   - Redis GEO and Redis Capacity show "80% failure rate / **5 calls**"
   - **Impact:** Low — the story and design should align. Recommend updating US-307 to use per-service sliding window sizes matching the design, or updating the design to use uniform slidingWindowSize=10.

2. **Design Document Phase Mapping — Informational:**
   - The design document's gap analysis (Part 4, Section 4.2) places Spring Boot upgrade (Gap 7) and Hystrix migration (Gap 8) in "Phase 3A" and large class refactoring (Gap 9) in "Phase 3B"
   - The execution plan and stories correctly place all of these in Phase 2 (Sprints 3-4)
   - This is an internal inconsistency in the design document that should be corrected, but does not affect the stories themselves

---

## Quality Assessment

### Acceptance Criteria

| Story | Given/When/Then Count | Happy Path | Error/Edge Cases | Specific & Testable | Assessment |
|-------|----------------------|------------|------------------|---------------------|------------|
| US-301 | 3 | Yes | No | Yes (JVM version check, health endpoint) | Good |
| US-302 | 4 | Yes | Yes (custom validators, ShadowTrafficFilter) | Yes (grep verification, specific classes) | Excellent |
| US-303 | 3 | Yes | No | Yes (specific dependency versions, Gurobi JNI) | Good |
| US-304 | 3 | Yes | Yes (BeanCreationException check) | Yes (deprecation warnings, Kafka topics) | Good |
| US-305 | 3 | Yes | Yes (shadow deployment error comparison) | Yes (5% latency threshold, 48hr shadow) | Excellent |
| US-306 | 2 | Yes | No | Yes (7-day shadow, 5% p95 threshold) | Acceptable (minimum 2 GWT met) |
| US-307 | 3 | Yes | No | Yes (specific config values, Micrometer metrics) | Good |
| US-308 | 3 | Yes | Yes (circuit breaker OPEN state, fail-fast) | Yes (9 named services, metric verification) | Excellent |
| US-309 | 3 | Yes | Yes (failure/retry timing) | Yes (specific retry counts, backoff durations) | Excellent |
| US-310 | 3 | Yes | No | Yes (grep verification, zero warnings) | Good |
| US-311 | 3 | Yes | No | Yes (400-line limit, 80% coverage, byte-for-byte JSON) | Excellent |
| US-312 | 3 | Yes | No | Yes (Avro schema validation, 80% coverage) | Good |
| US-313 | 3 | Yes | No | Yes (Avro schema validation, consistent pattern) | Good |
| US-314 | 3 | Yes | Yes (formatting violation fails build) | Yes (specific job order, Google Java Format) | Good |
| US-315 | 3 | Yes | Yes (pipeline fails on critical/high CVE) | Yes (CodeQL, Trivy, OWASP) | Good |
| US-316 | 4 | Yes | Yes (health check failure → rollback, ServiceNow CR) | Yes (2-min timeout, environment progression) | Excellent |

**Summary:** All 16 stories have at least 2 Given/When/Then criteria. 13 of 16 have 3+ criteria. Acceptance criteria are specific and testable throughout. Error cases are well covered in stories involving external dependencies (US-308, US-309) and deployment (US-316).

### Technical Accuracy

**Spring Boot Upgrade (EPIC-3):**
- US-301 correctly targets Java 11 → 17 with toolchain block in build.gradle
- US-302 correctly identifies javax→jakarta namespace migration, including specific classes: `ShadowTrafficFilter` (javax.servlet.Filter), custom validators (javax.validation), controllers (javax.annotation.PostConstruct)
- US-302 correctly identifies Springfox → SpringDoc migration requirement (Springfox 3.0.0 incompatible with Spring Boot 3)
- US-303 correctly lists dependency versions (Jedis 3.7.1, Confluent Avro 7.5.1, AWS SDK versions, Mockito 4.11.0)
- US-304 correctly references WebConfig.java (484 lines) and its deprecated patterns
- US-305 and US-306 correctly specify shadow deployment validation periods (48hr then 7-day)
- All file paths use correct package structure: `com.nordstrom.ers.*`

**Resilience4j Migration (EPIC-4):**
- US-307 correctly specifies `resilience4j-spring-boot3` module (not spring-boot2)
- US-307 correctly lists all Resilience4j modules needed (circuitbreaker, retry, ratelimiter, micrometer)
- US-308 correctly identifies `CircuitBreakerHystrixEventNotifier.java` as the custom Hystrix event notifier to replace, aligning with ADR-010
- US-308 correctly lists all 9 external services with their auth types
- US-309 retry policies match the design document's retry policies table (PCS: 2/100ms, ETA: 2/100ms, MLP: 1/200ms, Redis: 1/50ms)
- US-310 correctly specifies cleanup: remove Hystrix deps, delete CircuitBreakerHystrixEventNotifier.java, remove hystrix.* config

**Refactoring (EPIC-4):**
- US-311 correctly identifies ShippingDependenciesProcessor at 607 lines and its decomposition targets matching the design
- US-312 correctly identifies NAPEventConstructor at 476 lines with Kafka NAP topic
- US-313 correctly identifies RoutingInsightsEventConstructor at 509 lines with routing insights topic
- All three follow the consistent Mapper/Validator/Publisher/Orchestrator pattern specified in the design

**CI/CD Pipeline (EPIC-5):**
- US-314 correctly specifies GitHub Actions with `actions/setup-java@v4`, Java 17, Temurin distribution
- US-314 correctly aligns with ADR-005 (GitLab → GitHub Actions migration)
- US-315 correctly specifies CodeQL for SAST and Trivy for container scanning, matching design
- US-316 correctly specifies the full environment progression: Dev → Test → Shadow Nonprod → Nonprod → Shadow Prod → Prod, matching the design's deployment architecture
- US-316 correctly requires ServiceNow change request for production, matching NFR-011

### Story Sizing

| Story | Points | Assessment |
|-------|--------|------------|
| US-301 (Java 17 upgrade) | 3 | Appropriate — primarily build config changes |
| US-302 (Spring Boot + javax→jakarta) | 5 | Appropriate — significant migration across many files |
| US-303 (Dependency updates) | 5 | Appropriate — many dependencies with potential breaking changes |
| US-304 (Deprecated API migration) | 5 | Appropriate — WebConfig.java alone is 484 lines |
| US-305 (Regression + perf testing) | 3 | Appropriate — testing work, less code change |
| US-306 (Shadow deployment) | 2 | Appropriate — operational validation, minimal code |
| US-307 (Resilience4j dependencies) | 1 | Appropriate — config and dependency addition only |
| US-308 (Migrate circuit breakers) | 5 | Appropriate — 9 service clients to migrate |
| US-309 (Retry + rate limiting) | 3 | Appropriate — annotation + config work |
| US-310 (Remove Hystrix) | 2 | Appropriate — deletion and cleanup |
| US-311 (Refactor ShippingDepsProcessor) | 5 | Appropriate — 607-line class, complex shipping logic |
| US-312 (Refactor NAPEventConstructor) | 4 | Appropriate — 476 lines, Kafka integration |
| US-313 (Refactor RoutingInsightsConstructor) | 4 | Appropriate — 509 lines, follows US-312 pattern |
| US-314 (CI workflow) | 3 | Appropriate — new workflow file, branch protection |
| US-315 (Security scanning) | 3 | Appropriate — SAST + dependency check + container scan |
| US-316 (Deployment workflows) | 2 | Slightly low — 6-environment progression, rollback logic, ServiceNow integration. Consider 3 pts |

**Total:** 55 points. All stories within 1-8 point range. Sizing is generally well-calibrated.

---

## Sprint Balance

### Sprint 3 (25 points)

| Story | Points | Epic |
|-------|--------|------|
| US-301: Java 17 upgrade | 3 | EPIC-3: Framework Modernization |
| US-302: Spring Boot 3.3.x + javax→jakarta | 5 | EPIC-3 |
| US-303: Dependency updates | 5 | EPIC-3 |
| US-304: Deprecated API migration | 5 | EPIC-3 |
| US-314: CI workflow (build, test, lint) | 3 | EPIC-5: CI/CD |
| US-315: Security scanning | 3 | EPIC-5 |
| **Sprint 3 subtotal** | **24** | |

**Note:** The summary states Sprint 3 = 25 pts, but the story map shows US-301 (3) + US-302 (5) + US-303 (5) + US-304 (5) + US-314 (3) + US-315 (3) = **24 pts**. Minor arithmetic discrepancy (1 point).

### Sprint 4 (30 points)

| Story | Points | Epic |
|-------|--------|------|
| US-305: Regression + perf testing | 3 | EPIC-3: Framework Modernization |
| US-306: Shadow deployment validation | 2 | EPIC-4: Resilience & Refactoring |
| US-307: Resilience4j dependencies | 1 | EPIC-4 |
| US-308: Migrate circuit breakers | 5 | EPIC-4 |
| US-309: Retry + rate limiting | 3 | EPIC-4 |
| US-310: Remove Hystrix | 2 | EPIC-4 |
| US-311: Refactor ShippingDepsProcessor | 5 | EPIC-4 |
| US-312: Refactor NAPEventConstructor | 4 | EPIC-4 |
| US-313: Refactor RoutingInsightsConstructor | 4 | EPIC-4 |
| US-316: Deployment workflows | 2 | EPIC-5 |
| **Sprint 4 subtotal** | **31** | |

**Note:** The summary states Sprint 4 = 30 pts, but the total is **31 pts**. Combined with Sprint 3 (24 pts), the grand total is 55 pts as stated. The sprint split in the summary header is off by 1 pt each direction.

### Sprint Balance Assessment

- Sprint 3: 24 pts (6 stories) — heavily focused on Spring Boot upgrade. Good strategy to complete the entire upgrade in one sprint.
- Sprint 4: 31 pts (10 stories) — more stories but includes several smaller items (1-2 pts). May be slightly heavy.
- **Dependencies respected:** Spring Boot upgrade (Sprint 3) completes before Resilience4j migration (Sprint 4), which is correct per the execution plan dependency: WP-2.2 depends on WP-2.1.
- US-305 (regression/perf testing for Spring Boot upgrade) correctly placed at start of Sprint 4 after Sprint 3 completes the upgrade code changes.
- US-306 (shadow deployment) correctly depends on US-305 passing.
- US-307→US-308→US-309→US-310 form a correct sequential dependency chain for Resilience4j migration.
- Refactoring stories (US-311, US-312, US-313) are independent of the Resilience4j chain and can run in parallel.

---

## Issues Found

### Critical (Must Fix)

**None.**

### Warnings (Should Fix)

1. **W-01: Sprint point totals in summary header are slightly off.**
   - Summary states: "Sprint 3 (25 pts) | Sprint 4 (30 pts)"
   - Actual: Sprint 3 = 24 pts, Sprint 4 = 31 pts
   - Total is still 55 pts.
   - **Fix:** Update summary to "Sprint 3 (24 pts) | Sprint 4 (31 pts)"

2. **W-02: US-307 circuit breaker slidingWindowSize inconsistent with design.**
   - US-307 specifies `slidingWindowSize=10` for all services
   - Design document specifies slidingWindowSize=5 for MLP RTS, MLP STD, Redis GEO, Redis Capacity
   - **Fix:** Align US-307 acceptance criteria with design doc's per-service window sizes, or update design doc if uniform size is intended.

3. **W-03: US-309 missing retry policies for PAS, SCA, EAVS.**
   - US-308 correctly identifies all 9 external services for circuit breaker migration
   - US-309 only specifies retry configurations for 6 services + Redis (missing PAS, SCA, EAVS)
   - **Fix:** Add retry policies for PAS and EAVS in US-309 acceptance criteria, and explicitly note that SCA (library call) does not need HTTP-level retry.

4. **W-04: US-316 may be undersized at 2 points.**
   - Covers 6-environment deployment progression, manual approval gates, ServiceNow integration, health check rollback, K8s resource config (HPA, PDB), and Slack notifications
   - This is substantial infrastructure work across multiple workflow files
   - **Fix:** Consider increasing to 3 points.

### Suggestions (Nice to Have)

1. **S-01: US-306 is placed under EPIC-4 (Resilience & Refactoring) but logically belongs to EPIC-3 (Framework Modernization).**
   - US-306 is shadow deployment validation for the Spring Boot 3.3.x upgrade, which is the final step of the framework modernization epic.
   - Placing it under EPIC-4 separates it from the rest of the upgrade chain (US-301–US-305).
   - **Suggestion:** Move US-306 to EPIC-3.

2. **S-02: Consider adding an explicit acceptance criterion to US-302 for `spring.redis.*` → `spring.data.redis.*` config key migration.**
   - This is listed in the technical notes but not in the Given/When/Then acceptance criteria.
   - It's a common breaking change that could be missed.

3. **S-03: Design document gap analysis phase mapping should be updated.**
   - The design doc places Spring Boot upgrade and Hystrix migration in "Phase 3A/3B" in its gap analysis, while the execution plan and stories correctly place them in Phase 2.
   - This is likely a stale reference from a previous planning iteration.

---

## Overall Assessment

The Phase 2 user stories provide **strong coverage** of all 11 Phase 2 requirements. The 16 stories are well-decomposed into vertical slices with clear dependencies, specific acceptance criteria referencing actual code artifacts (file paths, class names, package structures), and appropriate sizing.

**Strengths:**
- Excellent technical specificity — stories reference exact Java classes, packages, line counts, dependency versions, and configuration patterns
- javax→jakarta migration is thoroughly covered with specific file-by-file impact analysis
- Resilience4j migration follows a clean 4-story progression (add → migrate → enhance → remove Hystrix)
- Refactoring stories use consistent decomposition patterns (Mapper/Validator/Publisher/Orchestrator)
- CI/CD stories correctly separate concerns (CI build → security scanning → deployment)
- All stories have testable acceptance criteria with measurable thresholds (5% latency, 80% coverage, 400-line limit)

**Areas for improvement:**
- Minor sprint point arithmetic discrepancy (24+31 reported as 25+30)
- Circuit breaker config should be aligned between US-307 and the design document
- US-309 should explicitly address all 9 services (or document why some are excluded)
- US-306 epic assignment should be corrected

**Recommendation:** Approved with minor corrections (W-01 through W-04). No blocking issues found. Stories are ready for sprint planning after addressing the warnings.
