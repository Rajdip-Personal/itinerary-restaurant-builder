# Validation Report: Phase 1 — Critical Compliance & Observability

**Generated:** 2026-02-25
**Validator:** validator-phase1
**Stories File:** docs/stories-phase1.md
**Requirements Baseline:** docs/requirements.md (50 requirements)
**Design Baseline:** docs/detailed-design.md
**Execution Plan:** docs/execution-plan.md

---

## Summary

| Metric | Value |
|--------|-------|
| **Stories Validated** | 15 |
| **Total Story Points** | 37 |
| **Phase 1 Requirements Covered** | 12/12 |
| **Coverage Gaps Found** | 0 |
| **Orphan Stories Found** | 0 |
| **Design Misalignments Found** | 1 (minor) |
| **Quality Score** | 9/10 |

---

## Requirements Coverage Matrix

### Primary Technical Requirements (Phase 1 Scope)

| Requirement | Priority | Description | Stories | Coverage Status | Notes |
|------------|----------|-------------|---------|----------------|-------|
| TR-001 | P0 | Correlation ID Propagation | US-101, US-102, US-103, US-104, US-105 | Full | All 5 stories cover HTTP filter, Kafka, outbound HTTP, MDC logging, and integration tests |
| TR-002 | P0 | Test Coverage 80% (JaCoCo) | US-106, US-107, US-108, US-109, US-110 | Full | JaCoCo config + 3 test stories + verification story |
| TR-003 | P1 | Readiness Endpoint | US-113, US-114 | Full | Endpoint implementation + K8s manifest update |
| TR-004 | P0 | PII/PI Masking in Logs | US-111, US-112, US-115 | Full | Utility class + application integration + policy document |

### Non-Functional Requirements Covered by Phase 1

| Requirement | Priority | Description | Stories | Coverage Status | Notes |
|------------|----------|-------------|---------|----------------|-------|
| NFR-001 | P0 | Structured JSON Logging | US-101, US-104 | Full | CorrelationIdFilter sets MDC; log4j2.xml updated for correlationId field |
| NFR-002 | P0 | No PII in Logs | US-111, US-112, US-115 | Full | PiiMaskingUtil + application integration + audit |
| NFR-004 | P1 | Health Check Endpoints | US-113, US-114 | Full | /ready endpoint with Redis + Kafka checks; K8s probes separated |
| NFR-009 | P0 | Integration Tests | US-105, US-107, US-108, US-109 | Full | E2E correlation ID tests + processor/validator/event tests |
| NFR-012 | P0 | Input Validation | US-108 | Full | Unit tests for custom ConstraintValidator implementations |

### Business Requirements Covered by Phase 1

| Requirement | Priority | Description | Stories | Coverage Status | Notes |
|------------|----------|-------------|---------|----------------|-------|
| BR-001 | P0 | Gap Identification | US-110, US-112, US-115 | Full | Coverage verification, PII audit, PII policy document |
| BR-002 | P0 | Implementation-Ready Stories | US-107 | Full | Detailed test stories with specific file paths and acceptance criteria |
| FR-002 | P0 | Kafka Topic Inventory | US-102, US-109 | Full | Correlation ID in Kafka headers + event constructor tests |

### Requirements Correctly Deferred (Not Phase 1)

| Requirement | Reason | Phase |
|------------|--------|-------|
| FR-001 | COMPLETE — already done during code analysis | N/A |
| NFR-003 | Authentication — deferred to Phase 3B (WP-3.5) | Phase 3B |
| TR-005 | GitHub Actions CI/CD — Phase 2 (WP-2.4) | Phase 2 |

---

## Gap Analysis

### Coverage Gaps

**None found.** All 12 Phase 1 requirements (TR-001 through TR-004, NFR-001, NFR-002, NFR-004, NFR-009, NFR-012, BR-001, BR-002, FR-002) are covered by at least one story.

### Orphan Stories

**None found.** Every story in stories-phase1.md traces to at least one requirement:

| Story | Requirements |
|-------|-------------|
| US-101 | TR-001, NFR-001 |
| US-102 | TR-001, NFR-001, FR-002 |
| US-103 | TR-001, NFR-001 |
| US-104 | TR-001, NFR-001 |
| US-105 | TR-001, NFR-001, NFR-009 |
| US-106 | TR-002, NFR-009 |
| US-107 | TR-002, NFR-009, BR-002 |
| US-108 | TR-002, NFR-012, NFR-009 |
| US-109 | TR-002, NFR-009, FR-002 |
| US-110 | TR-002, BR-001, BR-002 |
| US-111 | TR-004, NFR-002 |
| US-112 | TR-004, NFR-002, BR-001 |
| US-113 | TR-003, NFR-004 |
| US-114 | TR-003, NFR-004, TR-010 |
| US-115 | TR-004, NFR-002, BR-001 |

### Design Misalignments

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | US-114 references TR-010 (K8s Resource Configuration) | Minor | TR-010 is P1 and scoped to broader K8s resource config (HPA, PDB, resource limits). US-114 only addresses the readiness probe portion, which is correct for Phase 1. The reference is valid but TR-010 is not fully covered by Phase 1 — remaining TR-010 items (HPA, PDB) are in Phase 2. This is appropriate scoping, not a gap. |

---

## Quality Assessment

### Acceptance Criteria

| Story | AC Count | Given/When/Then | Specific & Testable? | Happy + Error Cases? | Rating |
|-------|----------|-----------------|---------------------|---------------------|--------|
| US-101 | 3 | Yes | Yes — specific header names, MDC keys, ThreadLocal behavior | Yes — with header, without header, cleanup on completion | Excellent |
| US-102 | 2 | Yes | Yes — specific Kafka header key, all 3 topics verified | Partial — no error case (e.g., CorrelationIdHolder empty) | Good |
| US-103 | 2 | Yes | Yes — lists all 9 services, both WebClient and RestTemplate | Partial — no error case (e.g., outbound call fails) | Good |
| US-104 | 2 | Yes | Yes — JSON field presence, 100% verification metric | Yes — implicitly covers all log levels | Good |
| US-105 | 2 | Yes | Yes — specific endpoint, full chain verification | Yes — with and without header scenarios | Excellent |
| US-106 | 2 | Yes | Yes — specific Gradle tasks, report paths | Yes — fail case (below 80%) and pass case | Excellent |
| US-107 | 2 | Yes | Yes — names specific processor classes | Yes — happy path + error scenarios (timeout, 5xx, circuit breaker) | Excellent |
| US-108 | 2 | Yes | Yes — references annotations package, specific exceptions | Yes — valid and invalid input scenarios | Good |
| US-109 | 2 | Yes | Yes — specific class names, line counts, Avro schema | Yes — null/missing fields, multi-location routing | Good |
| US-110 | 2 | Yes | Yes — specific Gradle command, report paths | Yes — pass/fail + gap identification | Good |
| US-111 | 5 | Yes | Yes — exact masking format, multiple patterns, null safety | Yes — ZIP+4, 5-digit, multiple ZIPs, no ZIPs, null, empty | Excellent |
| US-112 | 3 | Yes | Yes — specific fields, Splunk verification, exception logging | Yes — normal logging + exception logging + verification | Excellent |
| US-113 | 3 | Yes | Yes — specific JSON response format, dependency names, timeouts | Yes — all-UP (200), partial-DOWN (503), timeout handling | Excellent |
| US-114 | 2 | Yes | Yes — specific probe parameters (initialDelay, period, timeout, failureThreshold) | Partial — only happy path (startup + config review) | Good |
| US-115 | 2 | Yes | Yes — specific field inventory, masking strategy, Splunk query | Yes — document review + production verification | Good |

**Acceptance Criteria Summary:** All 15 stories have at least 2 Given/When/Then acceptance criteria. 7 stories rated Excellent, 8 stories rated Good. No stories have vague or untestable criteria.

### Technical Accuracy

| Story | Classes/Packages Correct? | Endpoints Correct? | ADR Aligned? | Rating |
|-------|--------------------------|-------------------|-------------|--------|
| US-101 | Yes — `CorrelationIdFilter.java` in `filters/`, `CorrelationIdHolder.java` in `utils/`, matches design 2.6 | N/A (filter, not endpoint) | Yes — follows design's approach of OncePerRequestFilter + ThreadLocal + MDC | Excellent |
| US-102 | Yes — `KafkaProducerConfig.java` in `config/`; references all 3 producer topics correctly | N/A | Yes — interceptor-based approach per design | Excellent |
| US-103 | Yes — `WebConfig.java` (484 lines) in `config/`; correctly identifies both WebClient and RestTemplate paths | Lists all 9 services minus SCA (8 listed) | Yes — ExchangeFilterFunction + ClientHttpRequestInterceptor per design | Good |
| US-104 | Yes — `log4j2.xml` in `src/main/resources/`; correctly references nordlogger 1.0.1.250 and existing MDC fields | N/A | Yes | Excellent |
| US-105 | Yes — correct test location, references EmbeddedKafka and MockWebServer | Yes — `/Routing/evaluateLocations` | Yes | Excellent |
| US-106 | Yes — `build.gradle`; correct exclusion packages (`entity`, `config`, `constants`) | N/A | Yes — ADR-007 (JaCoCo 80%) | Excellent |
| US-107 | Yes — `RoutingProcessor`, `ShippingDependenciesProcessor` (607 lines) correct | N/A | Yes | Excellent |
| US-108 | Yes — `annotations/` package, `RoutingSkuConstraintValidator`, correct exception names | N/A | Yes | Excellent |
| US-109 | Yes — `NAPEventConstructor` (476 lines), `RoutingInsightsEventConstructor` (509 lines) correct | N/A | Yes | Excellent |
| US-110 | Yes — references `build/reports/jacoco/test/html/index.html` correctly | N/A | Yes — ADR-007 | Good |
| US-111 | Yes — `PiiMaskingUtil.java` in `utils/`; correct masking format `981**-****` | N/A | Yes — ADR-008 (app-level masking, not Log4J2 layout) | Excellent |
| US-112 | Yes — `RoutingController.java`, `RoutingV2Controller.java`, `processors/**/*.java` correct | N/A | Yes — ADR-008 | Excellent |
| US-113 | Yes — `ReadinessController.java` in `controllers/`; references `RedisConfig.java` for dual cluster | Yes — `/ready` (new) | Yes — ADR-009 (separate /ready from /health) | Excellent |
| US-114 | Yes — deployment manifest path referenced; correct existing liveness path `/enterpriseRoutingService/health` | Yes — `/ready` probe target | Yes — ADR-009 | Good |
| US-115 | Yes — `docs/pii-handling-policy.md` output location; correct field inventory | N/A | Yes — ADR-008 | Good |

**Technical Accuracy Summary:** All stories reference correct Java classes, packages, and file paths from the codebase (`com.nordstrom.ers.*`). All stories align with the relevant ADRs. No incorrect endpoint or class references found.

### Story Sizing

| Story | Points | Reasonable? | Notes |
|-------|--------|------------|-------|
| US-101 | 3 | Yes | Servlet filter + ThreadLocal + MDC + sanitization — appropriate for a 3-pointer |
| US-102 | 3 | Yes | Kafka producer interceptor across 3 topics — moderate complexity |
| US-103 | 3 | Yes | Two HTTP client types (WebClient + RestTemplate) across 9 services — appropriate |
| US-104 | 2 | Yes | Config change to log4j2.xml — small but needs verification |
| US-105 | 2 | Yes | Integration test with EmbeddedKafka and MockWebServer — could be a 3 but 2 is defensible given US-101-104 lay the groundwork |
| US-106 | 2 | Yes | Gradle plugin configuration — straightforward |
| US-107 | 5 | Yes | ~50 new test methods across multiple processor classes — largest story, justified |
| US-108 | 3 | Yes | Validation testing across multiple custom validators — moderate |
| US-109 | 3 | Yes | Two large event constructor classes to test — moderate |
| US-110 | 2 | Yes | Verification/spike story — may need additional test writing |
| US-111 | 2 | Yes | Utility class with regex-based masking — straightforward |
| US-112 | 3 | Yes | Touching multiple controllers and processors for PII masking — moderate |
| US-113 | 2 | Yes | REST controller with 3 health checks — straightforward |
| US-114 | 1 | Yes | K8s YAML update — minimal code change |
| US-115 | 1 | Yes | Documentation story — appropriate at 1 point |

**Story Sizing Summary:** All stories are in the 1-8 range (actual range: 1-5). No story exceeds 8 points. Total is 37 points, matching the Phase 1 budget from the execution plan exactly.

---

## Sprint Balance

| Sprint | Stories | Points | Assessment |
|--------|---------|--------|------------|
| Sprint 1 | US-101, US-102, US-103, US-104, US-105, US-113, US-114 (7 stories) | 16 | Well balanced. Correlation ID epic (13 pts) + Readiness endpoint (3 pts). All Sprint 1 stories are independent — can be parallelized across team members. |
| Sprint 2 | US-106, US-107, US-108, US-109, US-110, US-111, US-112, US-115 (8 stories) | 21 | Heavier sprint (21 vs 16) but appropriate since test stories (US-107/108/109) can be parallelized across engineers. US-110 depends on US-106/107/108/109 completion. |

**Sprint Balance Assessment:**
- Sprint 1 (16 pts) vs Sprint 2 (21 pts) — 43%/57% split. Slightly back-loaded but reasonable.
- Sprint 1 focuses on WP-1.1 (Correlation ID) + WP-1.3 (Readiness) — no cross-dependencies.
- Sprint 2 focuses on WP-1.2 (Test Coverage) + WP-1.4 (PII Masking) — US-110 is the only sequential dependency (must wait for US-106-109).
- The execution plan notes WP-1.4 depends on WP-1.1 (correlation ID logging in place first). This dependency is correctly respected: WP-1.1 is Sprint 1, WP-1.4 is Sprint 2.

---

## Dependency Analysis

| Dependency | From | To | Respected? | Notes |
|------------|------|-----|-----------|-------|
| WP-1.4 depends on WP-1.1 | PII Masking (Sprint 2) | Correlation ID (Sprint 1) | Yes | Execution plan states "needs correlation ID logging in place first." Sprint ordering is correct. |
| US-110 depends on US-106, US-107, US-108, US-109 | Verify 80% threshold | JaCoCo config + new tests | Yes | US-110 explicitly references "all new tests from US-107, US-108, and US-109 are merged." All in Sprint 2. |
| US-112 depends on US-111 | Apply PII masking | PiiMaskingUtil implementation | Yes | US-112 references PiiMaskingUtil from US-111. Both in Sprint 2, US-111 logically comes first. |
| US-115 depends on US-111, US-112 | PII policy doc | PII masking implemented | Yes | Documentation requires implementation to be complete. All in Sprint 2. |
| US-114 depends on US-113 | K8s manifest update | /ready endpoint | Yes | Manifest points to /ready which must exist first. Both in Sprint 1. |

---

## Design Alignment

### Component-Level Verification

| Design Component | Design Section | Story | Aligned? | Notes |
|-----------------|----------------|-------|----------|-------|
| CorrelationIdFilter (OncePerRequestFilter) | 2.6 Logging & Observability | US-101 | Yes | Story specifies `OncePerRequestFilter` with highest precedence per design |
| CorrelationIdHolder (ThreadLocal) | 2.6 Logging & Observability | US-101 | Yes | ThreadLocal with get/set/clear methods |
| Kafka producer interceptor | 2.6 / Integration Points | US-102 | Yes | ProducerInterceptor or KafkaTemplate customization per design |
| WebClient ExchangeFilterFunction | 2.6 / Component Architecture | US-103 | Yes | Matches design's approach for reactive HTTP propagation |
| RestTemplate ClientHttpRequestInterceptor | 2.6 / Component Architecture | US-103 | Yes | Matches design's approach for synchronous HTTP propagation |
| Log4J2 MDC correlationId field | 2.6 Logging | US-104 | Yes | `%X{correlationId}` in Log4J2 pattern layout |
| JaCoCo 80% threshold with exclusions | ADR-007 | US-106 | Yes | BUNDLE counter, LINE minimum 0.80, exclusions for entity/config/constants |
| ReadinessController (/ready) | ADR-009 | US-113 | Yes | Checks Redis GEO, Redis Capacity, Kafka producer; returns 200/503 |
| PiiMaskingUtil (application-level masking) | ADR-008 | US-111 | Yes | App-level masking (not Log4J2 layout) per ADR-008 decision |
| K8s readiness/liveness probe separation | ADR-009 | US-114 | Yes | /ready for readiness, /enterpriseRoutingService/health for liveness |

### Design Elements Not Captured in Stories

| Design Element | Section | Assessment |
|----------------|---------|------------|
| Correlation ID sanitization (max 64 chars, alphanumeric + hyphens) | Design 2.6 / Security | Captured — US-101 technical notes include "Sanitize incoming header value (max 64 chars, alphanumeric + hyphens only) to prevent log injection" |
| Malformed correlation ID rejection | Design 2.6 / Security | Captured — US-105 technical notes include "Test verifies malformed correlation IDs are rejected or sanitized" |
| PII field inventory (ShipToZip, OrderId, ShopperID) | Design 1.7 / PII Handling | Captured — US-115 acceptance criteria lists all fields with disposition |

### Stories That Contradict the Design

**None found.** All 15 stories align with the technical design.

---

## Issues Found

### Critical (Must Fix)

**None.**

### Warnings (Should Fix)

| # | Story | Issue | Recommendation |
|---|-------|-------|----------------|
| W-1 | US-102 | Missing error case AC — what happens if CorrelationIdHolder.get() returns null when publishing a Kafka message? | Add AC: "Given a Kafka message is published but no correlation ID is set in CorrelationIdHolder, When the message is published, Then no X-Correlation-ID header is added (or a warning is logged)" |
| W-2 | US-103 | Lists 8 external services in AC but design shows 9 (SCA is via library call, not HTTP). Story correctly identifies only HTTP services but could clarify SCA exclusion. | Add note: "SCA is excluded because it is a library call, not an HTTP client call" |
| W-3 | US-114 | Only happy-path AC (startup + config review). Missing failure scenario. | Add AC: "Given the /ready endpoint returns 503, When the readiness probe fails 3 consecutive times, Then the pod is removed from the service endpoint" |

### Suggestions (Nice to Have)

| # | Story | Suggestion |
|---|-------|------------|
| S-1 | US-105 | Consider adding a performance acceptance criterion — e.g., "correlation ID propagation adds less than 1ms overhead per request" |
| S-2 | US-107 | The target of "~50 new test methods" in technical notes is ambitious for a single story. Consider splitting if it grows beyond 5 points during sprint planning. |
| S-3 | US-110 | This is labeled as a "spike/verification" story at 2 points. If significant additional test writing is needed, the work should be captured in a new story rather than expanding US-110 beyond 2 points. |

---

## Overall Assessment

Phase 1 stories are **ready for implementation** with minor improvements recommended. All 12 Phase 1 requirements are fully covered by 15 well-structured stories totaling 37 story points, exactly matching the execution plan budget. Every story has specific, testable acceptance criteria in Given/When/Then format, accurate technical references to ERS codebase classes and packages, and correct alignment with ADR decisions (ADR-007/008/009). The three warnings identified are minor acceptance criteria gaps that can be addressed during sprint planning without blocking development. Sprint loading is reasonable at 16/21 points with dependencies correctly ordered across sprints.

**Verdict: READY — proceed to implementation with recommended minor improvements.**
