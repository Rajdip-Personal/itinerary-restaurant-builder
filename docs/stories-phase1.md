# Phase 1: Critical Compliance & Observability — User Stories

**Project:** APP00344 Enterprise Routing Service (ERS)
**Phase:** Phase 1 — Critical Compliance & Observability
**Sprints:** 1-2 (4 weeks)
**Generated:** 2026-02-25

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 15 |
| Total Story Points | 37 |
| Epics | 4 |
| Sprint 1 | 16 pts (7 stories) |
| Sprint 2 | 21 pts (8 stories) |

## Sprint Distribution

| Sprint | Stories | Points | Focus |
|--------|---------|--------|-------|
| Sprint 1 | US-101 through US-105, US-113, US-114 | 16 | Correlation ID Propagation + Readiness Endpoint |
| Sprint 2 | US-106 through US-110, US-111, US-112, US-115 | 21 | Test Coverage Enforcement + PII Masking |

## Story Map

| Epic | Sprint 1 | Sprint 2 |
|------|----------|----------|
| EPIC-1: Correlation ID Propagation | US-101, US-102, US-103, US-104, US-105 | |
| EPIC-2: Test Coverage Enforcement | | US-106, US-107, US-108, US-109, US-110 |
| EPIC-3: Readiness Endpoint | US-113, US-114 | |
| EPIC-4: PII/PI Masking | | US-111, US-112, US-115 |

---

## EPIC-1: Correlation ID Propagation

### US-101: Implement Correlation ID Servlet Filter

**Story:**
As a squad engineer debugging a production issue,
I want every inbound HTTP request to have a correlation ID extracted from the `X-Correlation-ID` header or auto-generated as a UUID,
So that I can trace a single request through all log entries and downstream calls.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 1
**Requirements:** TR-001, NFR-001

**Acceptance Criteria:**

```gherkin
Given an inbound HTTP request with header X-Correlation-ID: "abc-123"
When the request passes through CorrelationIdFilter
Then the correlation ID "abc-123" is stored in CorrelationIdHolder (ThreadLocal)
And the correlation ID "abc-123" is added to the Log4J2 MDC as key "correlationId"
And the response includes header X-Correlation-ID: "abc-123"

Given an inbound HTTP request without an X-Correlation-ID header
When the request passes through CorrelationIdFilter
Then a new UUID is generated and stored in CorrelationIdHolder
And the generated UUID is added to the Log4J2 MDC as key "correlationId"
And the response includes the generated UUID as header X-Correlation-ID

Given a request has been processed by CorrelationIdFilter
When the request completes (success or error)
Then the ThreadLocal in CorrelationIdHolder is cleared
And the MDC entry for "correlationId" is removed
```

**Technical Notes:**
- **New File:** `src/main/java/com/nordstrom/ers/filters/CorrelationIdFilter.java` — Spring `OncePerRequestFilter` registered with highest precedence
- **New File:** `src/main/java/com/nordstrom/ers/utils/CorrelationIdHolder.java` — ThreadLocal<String> holder with `get()`, `set()`, `clear()` methods
- **Data Model:** Header name `X-Correlation-ID`; fallback generation via `UUID.randomUUID().toString()`
- **Integrations:** Log4J2 MDC (`ThreadContext.put("correlationId", id)`)
- **Security:** Sanitize incoming header value (max 64 chars, alphanumeric + hyphens only) to prevent log injection
- **Testing:** Unit test for CorrelationIdFilter with MockHttpServletRequest/Response; verify MDC set and cleared

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] CorrelationIdFilter registered and invoked on all endpoints
- [ ] CorrelationIdHolder ThreadLocal properly cleared after each request
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-102: Propagate Correlation ID to Kafka Event Headers

**Story:**
As a data engineer consuming ERS Kafka events,
I want every Kafka message produced by ERS to include the correlation ID in its headers,
So that I can trace routing decisions back to the originating HTTP request.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 1
**Requirements:** TR-001, NFR-001, FR-002

**Acceptance Criteria:**

```gherkin
Given an HTTP request is being processed with correlation ID "abc-123"
When a Kafka message is published to any of the 3 producer topics
Then the Kafka message headers include key "X-Correlation-ID" with value "abc-123"

Given an HTTP request with correlation ID "abc-123" triggers publishing to all 3 topics
When the routing-decision-made, NAP event, and routing insights events are published
Then all 3 messages contain header "X-Correlation-ID" with value "abc-123"
```

**Technical Notes:**
- **File to Modify:** `src/main/java/com/nordstrom/ers/config/KafkaProducerConfig.java` — add a `ProducerInterceptor` or customize the `KafkaTemplate` to inject `CorrelationIdHolder.get()` into message headers
- **Data Model:** Kafka header key: `X-Correlation-ID`, value: UTF-8 encoded string
- **Integrations:** Kafka producer for 3 topics (`inventory-routing-decision-made-avro`, `${NAP_EVENT_TOPIC}`, `${ROUTING_INSIGHTS_EVENT_TOPIC}`)
- **Security:** No sensitive data in correlation ID (UUID only)
- **Testing:** Spring Kafka Test with `ConsumerRecord` header inspection; verify correlation ID present on all 3 topics

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] Kafka integration tests verify header presence on all 3 topics
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-103: Propagate Correlation ID to Outbound HTTP Calls

**Story:**
As a squad engineer debugging a cross-service latency issue,
I want ERS to forward the correlation ID as the `X-Correlation-ID` header on all outbound HTTP calls to external services,
So that I can trace a request across ERS and its 9 downstream dependencies.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 1
**Requirements:** TR-001, NFR-001

**Acceptance Criteria:**

```gherkin
Given an HTTP request is being processed with correlation ID "abc-123"
When ERS makes an outbound call to any external service (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, EAVS, PAS)
Then the outbound request includes header X-Correlation-ID: "abc-123"

Given an HTTP request is being processed with correlation ID "abc-123"
When ERS makes an outbound call via WebClient (reactive) or RestTemplate (synchronous)
Then both HTTP client types include the X-Correlation-ID header
```

**Technical Notes:**
- **File to Modify:** `src/main/java/com/nordstrom/ers/config/WebConfig.java` (484 lines) — add `ExchangeFilterFunction` to WebClient builder and `ClientHttpRequestInterceptor` to RestTemplate
- **Data Model:** Header `X-Correlation-ID` propagated on all outbound calls
- **Integrations:** All 9 external service clients via WebClient and RestTemplate configured in WebConfig
- **Security:** Only propagate the correlation ID header, no other request context
- **Testing:** Unit tests with MockWebServer verifying header present on outbound requests for both WebClient and RestTemplate paths

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] WebClient ExchangeFilterFunction injects correlation ID
- [ ] RestTemplate ClientHttpRequestInterceptor injects correlation ID
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-104: Add Correlation ID to All Log Statements via MDC

**Story:**
As an on-call engineer searching Splunk during an incident,
I want every log line emitted by ERS to include the `correlationId` field,
So that I can filter all logs for a single request using one Splunk query.

**Priority:** P0
**Story Points:** 2
**Sprint:** Sprint 1
**Requirements:** TR-001, NFR-001

**Acceptance Criteria:**

```gherkin
Given CorrelationIdFilter has set the correlation ID in MDC for a request
When any class in the ERS codebase emits a log statement
Then the resulting JSON log line includes the field "correlationId" with the correct value

Given a production log sample of 1000 lines is analyzed
When the log lines are parsed as JSON
Then 100% of request-scoped log lines contain a non-null "correlationId" field
```

**Technical Notes:**
- **File to Modify:** `src/main/resources/log4j2.xml` — update the JSON layout pattern to include `%X{correlationId}` or configure the nordlogger plugin to emit the MDC key
- **Data Model:** Log4J2 MDC key `correlationId` automatically included in structured JSON output via Log4J2 pattern layout
- **Integrations:** Log4J2 2.17.2 + nordlogger 1.0.1.250; existing fields: env, envclass, logtype, hostname, servicename, uuid, date, loglevel, class, thread, schemacheck
- **Security:** Correlation ID is a UUID, no PII
- **Testing:** Unit test that writes a log line with MDC set and verifies the JSON output contains `correlationId`

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] Log4J2 configuration updated to include correlationId field
- [ ] Sample log output verified to contain correlationId in JSON structure
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified via Splunk query on staging logs

---

### US-105: Integration Tests for End-to-End Correlation ID Propagation

**Story:**
As a squad lead reviewing the correlation ID implementation,
I want automated integration tests that verify correlation IDs flow from inbound HTTP request through logs and Kafka message headers,
So that I have confidence the propagation works end-to-end before deploying to production.

**Priority:** P0
**Story Points:** 2
**Sprint:** Sprint 1
**Requirements:** TR-001, NFR-001, NFR-009

**Acceptance Criteria:**

```gherkin
Given an integration test sends a POST request to /Routing/evaluateLocations with header X-Correlation-ID: "test-corr-123"
When the request is processed
Then the response header contains X-Correlation-ID: "test-corr-123"
And the application logs emitted during the request contain correlationId: "test-corr-123"
And any Kafka message published during the request contains header X-Correlation-ID: "test-corr-123"

Given an integration test sends a POST request without an X-Correlation-ID header
When the request is processed
Then a UUID is generated and returned in the response header X-Correlation-ID
And the same UUID appears in the application logs as correlationId
And the same UUID appears in Kafka message headers as X-Correlation-ID
```

**Technical Notes:**
- **New File:** `src/test/java/com/nordstrom/ers/integration/CorrelationIdPropagationTest.java`
- **Data Model:** Uses `@SpringBootTest` with embedded Kafka (`spring-kafka-test`) and MockWebServer for external services
- **Integrations:** Tests the full chain: HTTP filter -> MDC -> Kafka producer interceptor -> outbound HTTP interceptor
- **Security:** Test verifies malformed correlation IDs are rejected or sanitized
- **Testing:** Spring Boot integration test with `EmbeddedKafka`; captures log output via `ListAppender`; inspects Kafka `ConsumerRecord` headers

**Definition of Done:**
- [ ] Integration test class complete and passing
- [ ] Tests cover both provided and auto-generated correlation ID scenarios
- [ ] Tests run in CI pipeline
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

## EPIC-2: Test Coverage Enforcement (JaCoCo 80%)

### US-106: Configure JaCoCo Plugin with 80% Coverage Threshold

**Story:**
As a squad lead enforcing code quality standards,
I want the Gradle build to fail when unit test line coverage drops below 80%,
So that the team maintains Nordstrom's minimum test coverage standard and coverage cannot regress.

**Priority:** P0
**Story Points:** 2
**Sprint:** Sprint 2
**Requirements:** TR-002, NFR-009

**Acceptance Criteria:**

```gherkin
Given JaCoCo is configured in build.gradle
When ./gradlew test jacocoTestCoverageVerification is executed
Then the build fails if line coverage is below 80%
And JaCoCo HTML reports are generated at build/reports/jacoco/test/html/

Given the codebase contains DTO classes in entity/ and config classes in config/
When JaCoCo coverage verification runs
Then entity/ package classes and Spring @Configuration classes are excluded from the 80% threshold
And generated code (if any) is excluded from the threshold
```

**Technical Notes:**
- **File to Modify:** `build.gradle` — add `jacoco` plugin, configure `jacocoTestReport` and `jacocoTestCoverageVerification` tasks
- **Data Model:** JaCoCo rule: `BUNDLE` counter `LINE` minimum 0.80; exclusions for `com.nordstrom.ers.entity.**`, `com.nordstrom.ers.config.**`, `com.nordstrom.ers.constants.**`
- **Integrations:** Gradle build lifecycle; future CI pipeline integration (WP-2.4)
- **Security:** No security implications
- **Testing:** Run `./gradlew jacocoTestCoverageVerification` and verify build fails when coverage < 80%, passes when >= 80%

**Definition of Done:**
- [ ] JaCoCo plugin configured in build.gradle
- [ ] Coverage threshold set to 80% line coverage
- [ ] Exclusions configured for DTOs, config classes, and constants
- [ ] HTML report generation verified
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-107: Add Unit Tests for Routing Processor Critical Paths

**Story:**
As a squad engineer maintaining the routing algorithm,
I want comprehensive unit tests for the core routing processors,
So that we reach the 80% coverage threshold and have confidence when modifying routing logic.

**Priority:** P0
**Story Points:** 5
**Sprint:** Sprint 2
**Requirements:** TR-002, NFR-009, BR-002

**Acceptance Criteria:**

```gherkin
Given the routing processor classes currently lack sufficient test coverage
When new unit tests are added for RoutingProcessor, ShippingDependenciesProcessor, and related business logic
Then each processor class achieves at least 80% line coverage
And all tests pass with ./gradlew test

Given the routing processors depend on external services (PCS, ETA, MLP, etc.)
When unit tests execute
Then all external dependencies are mocked using Mockito
And tests validate both happy path and error scenarios (timeout, 5xx, circuit breaker open)
```

**Technical Notes:**
- **Files to Modify/Create:** `src/test/java/com/nordstrom/ers/processors/` — new test files for `RoutingProcessor`, `ShippingDependenciesProcessor.java` (607 lines), and supporting processor classes
- **Data Model:** Test fixtures for `Order`, `ExtendRequest`, `LastNodeRequest` DTOs with valid and invalid data
- **Integrations:** Mockito mocks for all 9 external service domain clients, Redis template mocks
- **Security:** Test cases should include validation boundary testing (malformed inputs)
- **Testing:** JUnit 5 + Mockito; parameterized tests for routing algorithm edge cases; target ~50 new test methods across processor classes

**Definition of Done:**
- [ ] Code complete with >=80% line coverage on processor classes
- [ ] All new tests pass with `./gradlew test`
- [ ] Happy path and error scenarios covered
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-108: Add Unit Tests for Input Validation Logic

**Story:**
As a squad engineer maintaining the API validation layer,
I want unit tests for all custom validation annotations and constraint validators,
So that validation rules are documented through tests and regressions are caught automatically.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 2
**Requirements:** TR-002, NFR-012, NFR-009

**Acceptance Criteria:**

```gherkin
Given the annotations/ package contains custom validation annotations
When unit tests are executed for all custom ConstraintValidator implementations
Then each validator class achieves at least 80% line coverage
And tests verify valid inputs pass validation and invalid inputs trigger RoutingRequestValidationException

Given the validation logic handles request headers
When unit tests are executed
Then header validation scenarios are covered (missing required headers, malformed values)
And tests verify RoutingRequestHeaderValidationException is thrown for invalid headers
```

**Technical Notes:**
- **Files to Modify/Create:** `src/test/java/com/nordstrom/ers/annotations/` — new test files for `@RoutingSkuConstraintValidator` and other custom validators
- **Data Model:** Test fixtures covering boundary conditions for each custom annotation
- **Integrations:** Bean Validation API (`javax.validation` / Jakarta Validation); custom exception hierarchy
- **Security:** Tests should include injection attempt inputs (XSS, oversized strings) to verify they are rejected
- **Testing:** JUnit 5 with `@ValidatorFactory` or direct validator invocation; test each annotation individually

**Definition of Done:**
- [ ] Code complete with >=80% line coverage on validator classes
- [ ] Tests cover valid, invalid, and boundary inputs
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-109: Add Unit Tests for Kafka Event Constructors

**Story:**
As a squad engineer maintaining the event publishing pipeline,
I want unit tests for NAPEventConstructor and RoutingInsightsEventConstructor,
So that Kafka event payloads are validated by tests and event publishing regressions are caught.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 2
**Requirements:** TR-002, NFR-009, FR-002

**Acceptance Criteria:**

```gherkin
Given NAPEventConstructor (476 lines) constructs NAP events from routing results
When unit tests execute for NAPEventConstructor
Then the class achieves at least 80% line coverage
And tests verify the correct Avro schema fields are populated
And tests verify null/missing fields are handled gracefully

Given RoutingInsightsEventConstructor (509 lines) constructs routing insights events
When unit tests execute for RoutingInsightsEventConstructor
Then the class achieves at least 80% line coverage
And tests verify event construction for both single-location and multi-location routing results
```

**Technical Notes:**
- **Files to Modify/Create:** `src/test/java/com/nordstrom/ers/processors/NAPEventConstructorTest.java`, `src/test/java/com/nordstrom/ers/processors/RoutingInsightsEventConstructorTest.java`
- **Data Model:** Avro schemas for NAP events and routing insights events; test with various routing result scenarios
- **Integrations:** Mocked Kafka producer (Spring Kafka Test); Avro serialization verification
- **Security:** No security implications
- **Testing:** JUnit 5 + Mockito; mock Kafka template; verify message content and headers; test error handling for serialization failures

**Definition of Done:**
- [ ] Code complete with >=80% line coverage on event constructor classes
- [ ] Tests cover happy path, edge cases, and error scenarios
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-110: Verify Overall 80% Coverage Threshold Passes

**Story:**
As a squad lead reviewing the test coverage milestone,
I want to verify that the overall project test coverage meets the 80% line coverage threshold with all new tests in place,
So that the JaCoCo build gate passes and we are compliant with Nordstrom testing standards.

**Priority:** P0
**Story Points:** 2 (spike/verification)
**Sprint:** Sprint 2
**Requirements:** TR-002, BR-001, BR-002

**Acceptance Criteria:**

```gherkin
Given all new tests from US-107, US-108, and US-109 are merged
When ./gradlew test jacocoTestCoverageVerification is executed
Then the build completes successfully (exit code 0)
And the JaCoCo HTML report shows overall line coverage >= 80%

Given the JaCoCo HTML report is generated
When the coverage report is reviewed
Then any classes still below 80% are identified
And additional tests are written for those classes until the threshold passes
```

**Technical Notes:**
- **File to Review:** `build/reports/jacoco/test/html/index.html` — aggregate coverage report
- **Data Model:** JaCoCo coverage data XML at `build/reports/jacoco/test/jacocoTestReport.xml`
- **Integrations:** Gradle build lifecycle; ties together US-106 (JaCoCo config) with US-107/108/109 (new tests)
- **Security:** No security implications
- **Testing:** This story IS the verification that all test stories have brought coverage above threshold; may require additional test writing for any remaining gaps

**Definition of Done:**
- [ ] `./gradlew test jacocoTestCoverageVerification` passes
- [ ] JaCoCo HTML report shows >= 80% line coverage
- [ ] Coverage gaps documented for any classes excluded from threshold
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

## EPIC-3: Readiness Endpoint (/ready)

### US-113: Implement /ready Readiness Endpoint with Dependency Health Checks

**Story:**
As a Kubernetes platform operator,
I want ERS to expose a dedicated `/ready` endpoint that checks connectivity to both Redis clusters and the Kafka producer,
So that Kubernetes readiness probes can accurately determine if the pod is ready to serve traffic.

**Priority:** P1
**Story Points:** 2
**Sprint:** Sprint 1
**Requirements:** TR-003, NFR-004

**Acceptance Criteria:**

```gherkin
Given all dependencies are healthy (Redis GEO reachable, Redis Capacity reachable, Kafka producer connected)
When GET /ready is called
Then the response status is 200
And the response body is JSON: {"status": "UP", "checks": {"redisGeo": "UP", "redisCapacity": "UP", "kafkaProducer": "UP"}}

Given one or more dependencies are unavailable (e.g., Redis GEO cluster unreachable)
When GET /ready is called
Then the response status is 503
And the response body indicates which dependency is DOWN: {"status": "DOWN", "checks": {"redisGeo": "DOWN", "redisCapacity": "UP", "kafkaProducer": "UP"}}

Given the /ready endpoint is called
When the health check executes
Then each dependency check completes within 2 seconds (timeout per check)
And the total endpoint response time does not exceed 5 seconds
```

**Technical Notes:**
- **New File:** `src/main/java/com/nordstrom/ers/controllers/ReadinessController.java` — `@RestController` with `@GetMapping("/ready")`
- **Data Model:** Response DTO with `status` (UP/DOWN) and `checks` map (component name -> status)
- **Integrations:** Jedis connection test for Redis GEO cluster (configured in `RedisConfig.java`); Jedis connection test for Redis Capacity cluster; Kafka producer metadata request for Kafka connectivity
- **Security:** No authentication required (health endpoint accessible to K8s kubelet)
- **Testing:** Unit test with mocked Redis and Kafka connections; test both all-UP and partial-DOWN scenarios; test timeout handling

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] Endpoint returns 200 when all healthy, 503 when any dependency is down
- [ ] Timeouts configured to prevent blocking
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified by calling /ready with dependencies up and down

---

### US-114: Update Kubernetes Deployment Manifest for Separate Readiness Probe

**Story:**
As a DevOps engineer managing the ERS deployment,
I want the Kubernetes deployment manifest to use `/ready` for the readiness probe and `/enterpriseRoutingService/health` for the liveness probe,
So that pods are only routed traffic when dependencies are confirmed healthy, while staying alive during transient dependency failures.

**Priority:** P1
**Story Points:** 1
**Sprint:** Sprint 1
**Requirements:** TR-003, NFR-004, TR-010

**Acceptance Criteria:**

```gherkin
Given the Kubernetes deployment manifest is updated
When a pod starts up
Then the liveness probe targets /enterpriseRoutingService/health (unchanged)
And the readiness probe targets /ready

Given the readiness probe is configured
When the probe settings are reviewed
Then initialDelaySeconds is >= 15 (allow Spring Boot startup)
And periodSeconds is 10
And failureThreshold is 3 (remove from service after 3 consecutive failures)
And timeoutSeconds is 5 (match the /ready endpoint timeout)
```

**Technical Notes:**
- **File to Modify:** `deployment/routing-service-deployment.yaml` (or equivalent K8s manifest path) — update `readinessProbe` section
- **Data Model:** K8s probe configuration: `httpGet` path `/ready`, port `8080`
- **Integrations:** Kubernetes readiness probe → ReadinessController (US-113); existing liveness probe unchanged
- **Security:** No security implications; probes are internal to K8s cluster
- **Testing:** Verify manifest YAML is valid; deploy to staging and confirm K8s probe status via `kubectl describe pod`

**Definition of Done:**
- [ ] Deployment manifest updated with separate readiness probe configuration
- [ ] Liveness probe unchanged (still points to /enterpriseRoutingService/health)
- [ ] Probe parameters (initialDelay, period, timeout, failure threshold) configured
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified via kubectl describe pod

---

## EPIC-4: PII/PI Masking

### US-111: Implement PiiMaskingUtil for ZIP+4 Code Masking

**Story:**
As a security engineer auditing ERS log compliance,
I want a utility class that masks ZIP+4 postal codes to retain only the first 3 digits (format: `981**-****`),
So that Personal Information is not exposed in application logs per Nordstrom PII standards.

**Priority:** P0
**Story Points:** 2
**Sprint:** Sprint 2
**Requirements:** TR-004, NFR-002

**Acceptance Criteria:**

```gherkin
Given a string containing a ZIP+4 code "98101-1234"
When PiiMaskingUtil.maskPii(string) is called
Then the output contains "981**-****" in place of the original ZIP+4

Given a string containing a 5-digit ZIP code "98101"
When PiiMaskingUtil.maskPii(string) is called
Then the output contains "981**" in place of the original ZIP code

Given a string containing multiple ZIP codes "Ship to 98101-1234, alternate 90210-5678"
When PiiMaskingUtil.maskPii(string) is called
Then all ZIP codes in the string are masked: "Ship to 981**-****, alternate 902**-****"

Given a string containing no ZIP codes or PII
When PiiMaskingUtil.maskPii(string) is called
Then the string is returned unchanged

Given a null or empty string input
When PiiMaskingUtil.maskPii(string) is called
Then null returns null and empty string returns empty string
```

**Technical Notes:**
- **New File:** `src/main/java/com/nordstrom/ers/utils/PiiMaskingUtil.java` — static utility class with `maskPii(String)` method
- **Data Model:** Regex pattern for ZIP+4: `\b(\d{3})\d{2}(-\d{4})?\b`; replace with `$1**` + masked suffix. Per ADR-008, masking is at application level.
- **Integrations:** Standalone utility; called by logging statements in processors and controllers
- **Security:** Retain only first 3 digits (regional prefix) per team decision; mask remainder. OrderId is non-PII (retain). ShopperID already hashed (acceptable).
- **Testing:** JUnit 5 parameterized tests covering: ZIP+4, 5-digit ZIP, multiple ZIPs in one string, no ZIPs, null, empty, edge cases (ZIP at start/end of string, adjacent to punctuation)

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] Masking verified for all ZIP code formats found in ERS logs
- [ ] Null-safe implementation
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-112: Apply PII Masking to All Request Body Logging

**Story:**
As an on-call engineer debugging a routing issue,
I want request body log entries to have ZIP+4 codes masked before they are written to the log,
So that I can still debug routing requests without exposing customer postal codes in Splunk.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 2
**Requirements:** TR-004, NFR-002, BR-001

**Acceptance Criteria:**

```gherkin
Given a routing request contains ShipToZip "98101-1234" in the Order DTO
When the request body is logged by any controller or processor
Then the log output shows the ZIP masked as "981**-****"
And OrderId is logged unmasked (non-PII)
And ShopperID is logged in its existing hashed form (acceptable)

Given a 60-minute sample of staging logs is collected after deployment
When the logs are searched with regex pattern \b\d{5}(-\d{4})?\b
Then zero unmasked 5-digit or ZIP+4 postal codes appear in request body log entries

Given an exception occurs during request processing
When the exception message or stack trace is logged
Then any ZIP codes in the exception context are masked before logging
```

**Technical Notes:**
- **Files to Modify:** `src/main/java/com/nordstrom/ers/controllers/RoutingController.java` (base controller — centralized error handling), `src/main/java/com/nordstrom/ers/controllers/RoutingV2Controller.java`, `src/main/java/com/nordstrom/ers/processors/**/*.java` — wrap all `log.info()`, `log.debug()`, `log.error()` calls that log request bodies with `PiiMaskingUtil.maskPii()`
- **Data Model:** Primary field: `ShipToZip` in `Order` DTO (entity.request package); also check `shipToAddress` fields
- **Integrations:** PiiMaskingUtil (US-111); Log4J2; existing structured JSON logging
- **Security:** Audit all log statements in controllers and processors that reference request body data; create a PII audit checklist
- **Testing:** Integration test that submits a request with known ZIP codes and captures log output to verify masking

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] All request body logging passes through PiiMaskingUtil
- [ ] Exception logging also masks PII
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified via Splunk query on staging logs

---

### US-115: Document PII Handling Policy and Audit Results

**Story:**
As a compliance officer reviewing ERS data handling,
I want a documented PII handling policy that lists all sensitive fields in ERS, their masking strategy, and an audit report confirming zero unmasked PII in logs,
So that we have evidence of compliance with Nordstrom PII standards.

**Priority:** P0
**Story Points:** 1
**Sprint:** Sprint 2
**Requirements:** TR-004, NFR-002, BR-001

**Acceptance Criteria:**

```gherkin
Given the PII audit has been completed
When the PII handling policy document is reviewed
Then it lists all identified PI/PII fields in ERS: ShipToZip (PI - masked), OrderId (non-PII - retained), ShopperID (hashed - acceptable)
And it documents the masking strategy for each field (retain first 3 digits of ZIP, mask remainder)
And it references the PiiMaskingUtil implementation

Given production logs are queried after PII masking deployment
When a Splunk query searches for unmasked ZIP patterns in a 24-hour window
Then zero results are returned for unmasked 5-digit or ZIP+4 codes in request body logs
```

**Technical Notes:**
- **New File:** `docs/pii-handling-policy.md` — PII audit report and handling policy
- **Data Model:** Inventory of fields: ShipToZip (PI, masked), OrderId (non-PII, retained), ShopperID (hashed, acceptable), shipToAddress fields (audit required)
- **Integrations:** References Splunk queries for verification; links to PiiMaskingUtil source
- **Security:** This document IS the security compliance artifact; must be reviewed by security lead
- **Testing:** Splunk verification query included in the document as a runnable audit step

**Definition of Done:**
- [ ] PII handling policy document complete
- [ ] All PI/PII fields inventoried with disposition (masked, retained, acceptable)
- [ ] Splunk verification query documented
- [ ] Code review approved (document review)
- [ ] Published to team Confluence page
- [ ] Acceptance criteria verified

---

## Requirements Coverage (Phase 1)

| Requirement | Stories | Status |
|------------|---------|--------|
| TR-001 (Correlation ID Propagation) | US-101, US-102, US-103, US-104, US-105 | Covered |
| TR-002 (Test Coverage 80%) | US-106, US-107, US-108, US-109, US-110 | Covered |
| TR-003 (Readiness Endpoint) | US-113, US-114 | Covered |
| TR-004 (PII Masking) | US-111, US-112, US-115 | Covered |
| NFR-001 (Structured JSON Logging) | US-101, US-104 | Covered |
| NFR-002 (No PII in Logs) | US-111, US-112, US-115 | Covered |
| NFR-004 (Health Check Endpoints) | US-113, US-114 | Covered |
| NFR-009 (Integration Tests) | US-105, US-107, US-108, US-109 | Covered |
| NFR-012 (Input Validation) | US-108 | Covered |
| BR-001 (Gap Identification) | US-110, US-112, US-115 | Covered |
| BR-002 (Implementation-Ready Stories) | US-107 | Covered |
| FR-002 (Kafka Topic Inventory) | US-102, US-109 | Covered |

### Phase 1 Requirements Not Covered (Out of Scope)

| Requirement | Reason | Phase |
|------------|--------|-------|
| FR-001 (Repository Scanning) | COMPLETE — already done during code analysis | N/A |
| NFR-003 (Authentication) | Deferred to Phase 3B (WP-3.5) | Phase 3B |
| TR-005 (GitHub Actions CI/CD) | Phase 2 work package (WP-2.4) | Phase 2 |
