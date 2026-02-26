# Phase 2: Modernization & CI/CD — User Stories

**Project:** APP00344 Enterprise Routing Service (ERS)
**Phase:** Phase 2 — Modernization & Tech Debt
**Sprints:** 3-4
**Generated:** 2026-02-25

---

## Summary

- **Total Stories:** 16
- **Total Story Points:** 55
- **Epics:** 3
- **Sprint Distribution:** Sprint 3 (25 pts) | Sprint 4 (30 pts)

## Story Map

| Epic | Sprint 3 | Sprint 4 |
|------|----------|----------|
| EPIC-3: Framework Modernization | US-301, US-302, US-303, US-304 | US-305, US-306 |
| EPIC-4: Resilience & Refactoring | | US-307, US-308, US-309, US-310, US-311, US-312, US-313 |
| EPIC-5: CI/CD Pipeline (GitHub Actions) | US-314, US-315 | US-316 |

## Requirements Coverage (Phase 2)

| Requirement | Stories | Status |
|-------------|---------|--------|
| TR-005 (GitHub Actions CI/CD) | US-314, US-315, US-316 | Covered |
| TR-006 (Spring Boot 3.3.x Upgrade) | US-301, US-302, US-303, US-304, US-305, US-306 | Covered |
| TR-007 (Hystrix to Resilience4j) | US-307, US-308, US-309, US-310 | Covered |
| TR-008 (Large Class Refactoring) | US-311, US-312, US-313 | Covered |
| TR-010 (K8s Resource Config) | US-316 | Covered (K8s manifest updates in deploy workflow) |
| TR-011 (Container Security) | US-315, US-316 | Covered |
| NFR-008 (Code Review Standards) | US-314 | Covered (branch protection in CI) |
| NFR-009 (Integration Tests) | US-306 | Covered (regression suite in upgrade) |
| NFR-010 (Performance Testing) | US-306, US-316 | Covered |
| NFR-011 (Deployment Strategy) | US-316 | Covered |
| NFR-013 (Linting in CI) | US-314 | Covered |

---

## [EPIC-3] Epic: Framework Modernization

### US-301: Upgrade Java 11 to Java 17

**Story:**
As a platform engineer,
I want the ERS application to run on Java 17,
So that we are on a supported LTS version with access to modern language features and security patches.

**Priority:** P2
**Story Points:** 3
**Sprint:** Sprint 3
**Requirements:** TR-006

**Acceptance Criteria:**

```gherkin
Given the ERS project uses Java 11 as the language level,
When I update build.gradle to set the Java toolchain to version 17,
Then the project compiles successfully with zero errors using Java 17.

Given the CI pipeline builds the project,
When the build step runs,
Then it uses Java 17 (verified by build log output showing "JVM: 17.x").

Given the application starts with Java 17,
When the /enterpriseRoutingService/health endpoint is called,
Then it returns 200 OK confirming the application boots correctly.
```

**Technical Notes:**
- **Files to Modify:**
  - `build.gradle` — Update `sourceCompatibility` and `targetCompatibility` to `17`; add Java toolchain block: `java { toolchain { languageVersion = JavaLanguageVersion.of(17) } }`
  - `gradle.properties` — Update Java version property if present
  - `.github/workflows/ci.yml` — Update `actions/setup-java` to use Java 17
- **Data Model:** No changes to data model
- **Integrations:** Verify Gurobi native library compatibility with Java 17 (JNI)
- **Security:** No security changes
- **Testing:** Run full unit test suite; verify Gurobi optimization solver still functions correctly

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-302: Upgrade Spring Boot 2.7.15 to 3.3.x and Migrate javax to jakarta

**Story:**
As a platform engineer,
I want Spring Boot upgraded from EOL version 2.7.15 to the latest 3.3.x LTS release with all `javax.*` imports migrated to `jakarta.*`,
So that we receive ongoing security patches and are compatible with Jakarta EE 9+ as required by Spring Boot 3.x.

**Priority:** P2
**Story Points:** 5
**Sprint:** Sprint 3
**Requirements:** TR-006

**Acceptance Criteria:**

```gherkin
Given the ERS project uses Spring Boot 2.7.15,
When I update build.gradle to Spring Boot 3.3.x and Spring Kafka 3.x,
Then the project compiles with no unresolved dependency conflicts.

Given the ERS codebase contains javax.servlet, javax.validation, and javax.annotation imports,
When all javax.* imports are replaced with their jakarta.* equivalents,
Then zero occurrences of javax.servlet, javax.validation, or javax.annotation remain in src/main/java (verified by grep).

Given custom validation annotations exist in com.nordstrom.ers.annotations package,
When the javax.validation.* imports are migrated to jakarta.validation.*,
Then all custom constraint validators (@RoutingSkuConstraintValidator, etc.) compile and function correctly.

Given the ShadowTrafficFilter extends javax.servlet.Filter,
When migrated to jakarta.servlet.Filter,
Then shadow traffic mirroring continues to work in the dev environment.
```

**Technical Notes:**
- **Files to Modify:**
  - `build.gradle` — Update `org.springframework.boot` plugin to `3.3.x`; update `spring-kafka` to `3.x`; update `spring-dependency-management` to compatible version
  - `src/main/resources/application.yml` — Migrate deprecated config keys (e.g., `spring.redis.*` to `spring.data.redis.*`)
  - `src/main/java/com/nordstrom/ers/config/SwaggerConfig.java` — Springfox 3.0.0 is incompatible with Spring Boot 3; migrate to SpringDoc OpenAPI 2.x
  - `src/main/java/com/nordstrom/ers/annotations/*.java` — Custom validation annotations: `javax.validation` to `jakarta.validation`
  - `src/main/java/com/nordstrom/ers/filters/ShadowTrafficFilter.java` — `javax.servlet.Filter` to `jakarta.servlet.Filter`
  - `src/main/java/com/nordstrom/ers/controllers/*.java` — `javax.annotation.PostConstruct` and similar
  - `src/main/java/com/nordstrom/ers/entity/**/*.java` — Bean validation annotations (`@NotNull`, `@Valid`, etc.)
  - `src/main/java/com/nordstrom/ers/config/WebConfig.java` (484 lines) — Servlet-related imports
- **Data Model:** DTOs with `@NotNull`, `@Valid`, `@Size` annotations need import migration; no schema changes
- **Integrations:** Verify all WebClient and RestTemplate configurations still function
- **Security:** No auth changes in this story
- **Testing:** Full unit and integration test suite must pass after upgrade; validation behavior must be identical
- **Tooling:** Consider using OpenRewrite recipe `org.openrewrite.java.migrate.jakarta.JavaxMigrationToJakarta` for automated migration
- **Risk:** Springfox (Swagger) does not support Spring Boot 3 — must migrate to SpringDoc

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-303: Update All Dependencies for Spring Boot 3.3.x Compatibility

**Story:**
As a platform engineer,
I want all third-party dependencies updated to versions compatible with Spring Boot 3.3.x and Java 17,
So that there are no runtime classpath conflicts or deprecated API usage.

**Priority:** P2
**Story Points:** 5
**Sprint:** Sprint 3
**Requirements:** TR-006

**Acceptance Criteria:**

```gherkin
Given the dependency list includes Jedis 3.7.1, Confluent Avro 7.5.1, AWS SDK v1 1.12.167, AWS SDK v2 2.20.56, and Mockito 4.11.0,
When all dependencies are updated to their latest Spring Boot 3.3.x compatible versions,
Then ./gradlew dependencies shows zero version conflicts and zero forced resolutions.

Given nordlogger 1.0.1.250 is a Nordstrom internal library,
When compatibility with Spring Boot 3.3.x and Java 17 is verified,
Then structured JSON logging continues to produce valid output with all standard fields.

Given the Gurobi optimization library uses JNI native bindings,
When running on Java 17,
Then the linear programming solver produces correct routing optimization results (verified by existing solver tests).
```

**Technical Notes:**
- **Files to Modify:**
  - `build.gradle` — Update all dependency versions:
    - `redis.clients:jedis` — Upgrade from 3.7.1 to 4.x or 5.x (compatible with Spring Boot 3)
    - `io.confluent:kafka-avro-serializer` — Verify 7.5.x+ compatibility
    - `com.amazonaws:aws-java-sdk` (v1) — Check if still needed or migrate to v2 fully
    - `software.amazon.awssdk` (v2) — Update to latest 2.x
    - `org.mockito:mockito-core` — Update from 4.11.0 to 5.x for Java 17 support
    - `com.netflix.hystrix:hystrix-core` — Keep at 2.2.10 temporarily (removed in WP-2.2)
    - `org.springfox:springfox-boot-starter` — Remove, replace with SpringDoc (done in US-302)
  - `src/main/java/com/nordstrom/ers/config/RedisConfig.java` — Jedis API changes if upgrading to 4.x+
- **Data Model:** No changes
- **Integrations:** Redis client API may have breaking changes between Jedis 3.x and 4.x+ (pool configuration, connection factory)
- **Security:** Dependency vulnerability scan after update; zero critical/high CVEs
- **Testing:** Full regression suite; specifically validate Redis and Kafka operations

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-304: Migrate Deprecated Spring APIs

**Story:**
As a platform engineer,
I want all deprecated Spring Framework APIs replaced with their recommended alternatives,
So that the codebase does not rely on APIs that may be removed in future Spring releases.

**Priority:** P2
**Story Points:** 5
**Sprint:** Sprint 3
**Requirements:** TR-006

**Acceptance Criteria:**

```gherkin
Given WebConfig.java (484 lines) configures both WebClient and RestTemplate with deprecated Spring 2.x patterns,
When deprecated WebMvcConfigurer methods and RestTemplate builder patterns are updated to Spring Boot 3.3.x equivalents,
Then the application compiles with zero deprecation warnings from Spring Framework APIs.

Given the project may use deprecated Spring Kafka producer/consumer configuration patterns,
When all Kafka configuration is updated to Spring Kafka 3.x patterns,
Then Kafka event publishing to all 3 topics (inventory-routing-decision-made-avro, NAP, routing-insights) works correctly.

Given the application uses Spring Boot 2.x auto-configuration classes,
When migrated to Spring Boot 3.3.x auto-configuration,
Then all Spring beans are correctly initialized (verified by application startup with zero BeanCreationException errors).
```

**Technical Notes:**
- **Files to Modify:**
  - `src/main/java/com/nordstrom/ers/config/WebConfig.java` (484 lines) — Update `WebMvcConfigurer` implementations, async executor config, CORS config
  - `src/main/java/com/nordstrom/ers/config/MlpConfig.java` — OAuth2 client configuration for MLP services
  - `src/main/java/com/nordstrom/ers/config/RedisConfig.java` — Spring Data Redis 3.x configuration patterns
  - `src/main/java/com/nordstrom/ers/domain/**/*Client.java` — WebClient/RestTemplate usage patterns
- **Data Model:** No changes
- **Integrations:** All 9 external service clients (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS) need verification
- **Security:** OAuth2 client configuration for MLP and Kafka may use updated Spring Security OAuth2 client
- **Testing:** Integration tests for each external service client; verify circuit breaker behavior (Hystrix still in place at this point)

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-305: Spring Boot 3.3.x Regression Testing and Performance Validation

**Story:**
As a squad lead,
I want comprehensive regression testing and performance benchmarking after the Spring Boot 3.3.x upgrade,
So that we can confirm zero functional regressions and no unacceptable latency increases before production deployment.

**Priority:** P2
**Story Points:** 3
**Sprint:** Sprint 4
**Requirements:** TR-006, NFR-009, NFR-010

**Acceptance Criteria:**

```gherkin
Given the full Spring Boot 3.3.x upgrade is complete (US-301 through US-304),
When the complete regression test suite runs (unit + integration),
Then all tests pass with 80%+ code coverage (JaCoCo threshold maintained).

Given a performance benchmark baseline exists from Spring Boot 2.7.15,
When the same load test is run against the Spring Boot 3.3.x build,
Then p95 latency for /Routing/evaluateLocations is within 5% of the 2.7.15 baseline.

Given the upgraded application is deployed to the shadow environment,
When it receives mirrored production traffic for 48 hours via ShadowTrafficFilter,
Then zero errors are introduced that do not also occur on the current production build.
```

**Technical Notes:**
- **Files to Modify:**
  - `src/test/java/com/nordstrom/ers/**/*.java` — Fix any test failures caused by Spring Boot 3 API changes (MockMvc, test slice annotations, etc.)
  - `src/main/resources/application-routing-service-perf.properties` — Update performance test profile for Spring Boot 3.3.x
- **Data Model:** No changes
- **Integrations:** Verify all 9 external service integrations under load; verify Redis (GEO + Capacity) connection pooling stability; verify Kafka event publishing under concurrent load
- **Security:** No changes
- **Testing:** Performance test using existing `routing-service-perf` profile; shadow deployment validation using `ShadowTrafficFilter`; validate Gurobi optimization under concurrent load

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] Performance benchmarks documented and within 5% threshold
- [ ] Shadow deployment validated for minimum 48 hours

---

## [EPIC-4] Epic: Resilience & Refactoring

### US-306: Spring Boot 3.3.x Shadow Deployment Validation

**Story:**
As a squad lead,
I want the Spring Boot 3.3.x upgraded application validated via shadow deployment for at least 1 week before production rollout,
So that we have high confidence the upgrade introduces no regressions under real production traffic patterns.

**Priority:** P2
**Story Points:** 2
**Sprint:** Sprint 4
**Requirements:** TR-006

**Acceptance Criteria:**

```gherkin
Given the Spring Boot 3.3.x build passes all regression and performance tests (US-305),
When the upgraded application is deployed to the shadow prod environment,
Then it receives mirrored production traffic via ShadowTrafficFilter for at least 7 days.

Given the shadow deployment is active,
When error rates and latency are compared between the current production (2.7.15) and shadow (3.3.x) builds,
Then the shadow build shows no increase in error rate and p95 latency is within 5% of production.
```

**Technical Notes:**
- **Files to Modify:**
  - `deployment/routing-service-deployment.yaml` — Shadow prod deployment configuration
  - Monitoring dashboards — Add comparison panels for shadow vs. production metrics
- **Data Model:** No changes
- **Integrations:** ShadowTrafficFilter mirrors traffic; DataDog/New Relic for metrics comparison
- **Security:** No changes
- **Testing:** Automated comparison script for shadow vs. production metrics; daily team review of shadow health

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] Shadow deployment running for minimum 7 days with clean metrics

---

### US-307: Add Resilience4j Dependencies and Configuration

**Story:**
As a platform engineer,
I want Resilience4j added as a dependency with centralized configuration for circuit breaker, retry, and rate limiter patterns,
So that we have the foundation to migrate away from Hystrix.

**Priority:** P2
**Story Points:** 1
**Sprint:** Sprint 4
**Requirements:** TR-007

**Acceptance Criteria:**

```gherkin
Given the project currently depends on Hystrix 2.2.10.RELEASE,
When Resilience4j dependencies (resilience4j-spring-boot3, resilience4j-circuitbreaker, resilience4j-retry, resilience4j-ratelimiter, resilience4j-micrometer) are added to build.gradle,
Then the application compiles and starts with both Hystrix and Resilience4j on the classpath (coexistence during transition).

Given Resilience4j configuration is defined in application.yml,
When circuit breaker instances are configured for each external service (PCS, ETA, MLP-RTS, MLP-STD, Item Service, Ship By Time, PAS, SCA, EAVS),
Then each circuit breaker has: failureRateThreshold=50, slidingWindowSize=10, waitDurationInOpenState=10s, permittedNumberOfCallsInHalfOpenState=3.

Given Resilience4j Micrometer integration is enabled,
When the application starts,
Then circuit breaker metrics (state, failure rate, call count) are exposed via the Micrometer registry to DataDog/New Relic.
```

**Technical Notes:**
- **Files to Modify:**
  - `build.gradle` — Add Resilience4j BOM and modules: `io.github.resilience4j:resilience4j-spring-boot3`, `resilience4j-circuitbreaker`, `resilience4j-retry`, `resilience4j-ratelimiter`, `resilience4j-micrometer`
  - `src/main/resources/application.yml` — Add `resilience4j:` configuration block with circuit breaker, retry, and rate limiter instances
  - `src/main/java/com/nordstrom/ers/config/Resilience4jConfig.java` (NEW) — Custom configuration if YAML is insufficient (e.g., custom fallback handlers)
- **Data Model:** No changes
- **Integrations:** Micrometer metrics integration for DataDog/New Relic
- **Security:** No changes
- **Testing:** Unit test verifying Resilience4j beans are created; verify metrics are registered in Micrometer registry

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-308: Migrate Hystrix Circuit Breakers to Resilience4j

**Story:**
As a platform engineer,
I want all Hystrix circuit breaker usages in domain clients replaced with Resilience4j `@CircuitBreaker` annotations,
So that external service fault tolerance uses an actively maintained library with modern Spring Boot 3 support.

**Priority:** P2
**Story Points:** 5
**Sprint:** Sprint 4
**Requirements:** TR-007

**Acceptance Criteria:**

```gherkin
Given domain client classes (PCS, ETA, MLP RTS, MLP STD, Item Service, Ship By Time, PAS, SCA, EAVS) use Hystrix commands for circuit breaking,
When Hystrix commands are replaced with Resilience4j @CircuitBreaker annotations on each external service call method,
Then all 9 external service calls are protected by Resilience4j circuit breakers with named instances matching service names.

Given CircuitBreakerHystrixEventNotifier.java provides custom Hystrix event notification,
When its functionality is replaced with Resilience4j event consumers (onStateTransition, onFailureRateExceeded),
Then circuit breaker state changes are logged with correlation ID and service name.

Given an external service (e.g., PCS) returns 5xx errors exceeding the 50% failure threshold,
When the circuit breaker transitions to OPEN state,
Then subsequent calls to that service fail fast without making the HTTP call, and the circuit breaker metric shows OPEN state in DataDog/New Relic.
```

**Technical Notes:**
- **Files to Modify:**
  - `src/main/java/com/nordstrom/ers/domain/**/*Client.java` — Replace Hystrix commands with `@CircuitBreaker(name = "serviceName", fallbackMethod = "fallback")` on each outbound call method
  - `src/main/java/com/nordstrom/ers/metrics/CircuitBreakerHystrixEventNotifier.java` — Remove after migration (keep until US-310)
  - `src/main/java/com/nordstrom/ers/config/WebConfig.java` — Remove any Hystrix-specific HTTP client configuration
- **Data Model:** No changes
- **Integrations:** PCS (API Key auth), ETA (network), MLP RTS & STD (OAuth2/Okta), Item Service (network), Ship By Time (network), PAS (network), SCA (library call), EAVS (network)
- **Security:** Ensure OAuth2 token refresh for MLP services works correctly with Resilience4j retry
- **Testing:** Integration tests simulating external service failures for each of the 9 services; verify circuit breaker opens/closes correctly

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-309: Add Resilience4j Retry and Rate Limiting Policies

**Story:**
As a platform engineer,
I want retry policies with exponential backoff and outbound rate limiting configured for each external service,
So that transient failures are handled gracefully and downstream services are not overwhelmed during recovery.

**Priority:** P2
**Story Points:** 3
**Sprint:** Sprint 4
**Requirements:** TR-007

**Acceptance Criteria:**

```gherkin
Given the detailed design specifies retry policies per service (PCS: 2 retries/100ms, ETA: 2/100ms, MLP: 1/200ms, Redis: 1/50ms),
When @Retry annotations are added to each domain client call alongside @CircuitBreaker,
Then transient failures (connection timeout, 503) trigger retries with exponential backoff before circuit breaker evaluation.

Given rate limiting is configured for outbound calls,
When the ERS application sends requests to external services,
Then outbound call rates do not exceed configured limits (preventing downstream overload during recovery from circuit breaker HALF_OPEN state).

Given a PCS call fails with a connection timeout,
When the retry policy executes 2 retries with 100ms exponential backoff,
Then the total time for the 3 attempts (initial + 2 retries) is approximately 300ms, and if all fail the circuit breaker evaluates the failure.
```

**Technical Notes:**
- **Files to Modify:**
  - `src/main/resources/application.yml` — Add `resilience4j.retry` and `resilience4j.ratelimiter` configuration:
    - PCS: maxRetries=2, waitDuration=100ms, exponentialBackoffMultiplier=2
    - ETA: maxRetries=2, waitDuration=100ms
    - MLP RTS/STD: maxRetries=1, waitDuration=200ms
    - Item Service / Ship By Time: maxRetries=2, waitDuration=100ms
    - Redis GEO/Capacity: maxRetries=1, waitDuration=50ms
  - `src/main/java/com/nordstrom/ers/domain/**/*Client.java` — Add `@Retry(name = "serviceName")` annotations
- **Data Model:** No changes
- **Integrations:** Retry behavior must respect OAuth2 token expiry for MLP services (do not retry with expired token)
- **Security:** No changes
- **Testing:** Unit tests for retry behavior with mock failures; integration test verifying retry + circuit breaker interaction

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-310: Remove Hystrix Dependencies and Clean Up

**Story:**
As a platform engineer,
I want all Hystrix dependencies, configuration, and custom classes removed from the codebase,
So that there is no dead code from the deprecated library and the dependency footprint is reduced.

**Priority:** P2
**Story Points:** 2
**Sprint:** Sprint 4
**Requirements:** TR-007

**Acceptance Criteria:**

```gherkin
Given Resilience4j has fully replaced Hystrix for all circuit breaker, retry, and rate limiting functionality (US-307 through US-309),
When Hystrix dependencies (hystrix-core 2.2.10.RELEASE, hystrix-javanica, hystrix-metrics-event-stream) are removed from build.gradle,
Then the project compiles and all tests pass with zero Hystrix references on the classpath.

Given CircuitBreakerHystrixEventNotifier.java is a custom Hystrix event notifier,
When this class is deleted,
Then zero references to com.netflix.hystrix remain in src/main/java (verified by grep).

Given Hystrix-related configuration exists in application.yml or application.properties,
When all hystrix.* configuration keys are removed,
Then the application starts with zero "unrecognized configuration" warnings.
```

**Technical Notes:**
- **Files to Modify:**
  - `build.gradle` — Remove all `com.netflix.hystrix:*` dependencies
  - `src/main/java/com/nordstrom/ers/metrics/CircuitBreakerHystrixEventNotifier.java` — DELETE
  - `src/main/resources/application.yml` — Remove `hystrix.*` configuration blocks
  - `src/main/java/com/nordstrom/ers/config/WebConfig.java` — Remove any Hystrix-related bean configuration
- **Data Model:** No changes
- **Integrations:** Verify monitoring dashboards still receive circuit breaker metrics (now from Resilience4j/Micrometer instead of Hystrix)
- **Security:** No changes
- **Testing:** Full regression test suite; verify zero Hystrix imports via `grep -r "hystrix\|netflix.hystrix" src/`

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

### US-311: Refactor ShippingDependenciesProcessor (607 Lines)

**Story:**
As a squad engineer,
I want `ShippingDependenciesProcessor.java` (607 lines) split into focused, single-responsibility components,
So that the shipping logic is easier to understand, test, and maintain.

**Priority:** P2
**Story Points:** 5
**Sprint:** Sprint 4
**Requirements:** TR-008

**Acceptance Criteria:**

```gherkin
Given ShippingDependenciesProcessor.java is 607 lines with interleaved cost calculation, time estimation, and method selection logic,
When the class is refactored into ShippingCostCalculator, ShippingTimeEstimator, ShippingMethodSelector, and ShippingDependenciesProcessor (orchestrator),
Then each resulting class is under 400 lines.

Given the refactored classes have new public method boundaries,
When unit tests are written for each new class,
Then each class achieves at least 80% code coverage independently.

Given the original ShippingDependenciesProcessor behavior is unchanged,
When existing integration tests for /Routing/evaluateLocations run against the refactored code,
Then all integration tests pass with identical routing responses (byte-for-byte JSON comparison on sample requests).
```

**Technical Notes:**
- **Files to Modify:**
  - `src/main/java/com/nordstrom/ers/processors/ShippingDependenciesProcessor.java` — Refactor to orchestrator that delegates to new classes
  - `src/main/java/com/nordstrom/ers/processors/shipping/ShippingCostCalculator.java` (NEW) — Cost calculation logic extracted
  - `src/main/java/com/nordstrom/ers/processors/shipping/ShippingTimeEstimator.java` (NEW) — Time estimation logic; depends on ETA Client, Ship By Time Client
  - `src/main/java/com/nordstrom/ers/processors/shipping/ShippingMethodSelector.java` (NEW) — Method selection logic
  - `src/test/java/com/nordstrom/ers/processors/shipping/*.java` (NEW) — Unit tests for each new class
- **Data Model:** Internal method signatures change; external API contract unchanged
- **Integrations:** ShippingCostCalculator depends on PCS Client; ShippingTimeEstimator depends on ETA and Ship By Time Clients; all access Redis GEO
- **Security:** No changes
- **Testing:** Characterization tests before refactor to capture exact current behavior; unit tests for each new class; integration tests for end-to-end routing

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] All resulting classes under 400 lines

---

### US-312: Refactor NAPEventConstructor (476 Lines)

**Story:**
As a squad engineer,
I want `NAPEventConstructor.java` (476 lines) split into focused components for event mapping, validation, and publishing,
So that Kafka NAP event construction is easier to test and extend.

**Priority:** P2
**Story Points:** 4
**Sprint:** Sprint 4
**Requirements:** TR-008

**Acceptance Criteria:**

```gherkin
Given NAPEventConstructor.java is 476 lines combining event mapping, validation, and Kafka publishing,
When the class is refactored into NAPEventMapper, NAPEventValidator, NAPEventPublisher, and NAPEventConstructor (orchestrator),
Then each resulting class is under 400 lines.

Given the NAPEventPublisher publishes to the ${NAP_EVENT_TOPIC} Kafka topic,
When a routing evaluation completes,
Then the NAP event published is structurally identical to events published by the pre-refactored code (verified by Avro schema validation).

Given unit tests exist for each new extracted class,
When the test suite runs,
Then each class achieves at least 80% code coverage.
```

**Technical Notes:**
- **Files to Modify:**
  - `src/main/java/com/nordstrom/ers/processors/NAPEventConstructor.java` — Refactor to orchestrator
  - `src/main/java/com/nordstrom/ers/processors/events/NAPEventMapper.java` (NEW) — Maps routing results to NAP event Avro schema fields
  - `src/main/java/com/nordstrom/ers/processors/events/NAPEventValidator.java` (NEW) — Validates NAP event before publishing
  - `src/main/java/com/nordstrom/ers/processors/events/NAPEventPublisher.java` (NEW) — Kafka producer call with error handling
  - `src/test/java/com/nordstrom/ers/processors/events/NAP*.java` (NEW) — Unit tests
- **Data Model:** NAP Avro event schema unchanged; internal method boundaries change
- **Integrations:** Kafka producer (Confluent Cloud, SASL_SSL/OAUTHBEARER), Avro Schema Registry
- **Security:** No changes
- **Testing:** Capture sample NAP events before refactor; verify post-refactor events match schema and content

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] All resulting classes under 400 lines

---

### US-313: Refactor RoutingInsightsEventConstructor (509 Lines)

**Story:**
As a squad engineer,
I want `RoutingInsightsEventConstructor.java` (509 lines) split into focused components,
So that routing insights event construction follows the same clean pattern as the refactored NAP event constructor.

**Priority:** P2
**Story Points:** 4
**Sprint:** Sprint 4
**Requirements:** TR-008

**Acceptance Criteria:**

```gherkin
Given RoutingInsightsEventConstructor.java is 509 lines combining insights mapping, validation, and Kafka publishing,
When the class is refactored into RoutingInsightsMapper, RoutingInsightsValidator, RoutingInsightsPublisher, and RoutingInsightsEventConstructor (orchestrator),
Then each resulting class is under 400 lines.

Given the RoutingInsightsPublisher publishes to the ${ROUTING_INSIGHTS_EVENT_TOPIC} Kafka topic,
When a routing evaluation completes,
Then the routing insights event is structurally identical to pre-refactored events (verified by Avro schema validation).

Given the refactored classes follow the same pattern as the NAPEvent refactoring (US-312),
When a new engineer reads the codebase,
Then both event constructors follow a consistent Mapper/Validator/Publisher/Orchestrator pattern.
```

**Technical Notes:**
- **Files to Modify:**
  - `src/main/java/com/nordstrom/ers/processors/RoutingInsightsEventConstructor.java` — Refactor to orchestrator
  - `src/main/java/com/nordstrom/ers/processors/events/RoutingInsightsMapper.java` (NEW) — Maps routing results to insights Avro schema
  - `src/main/java/com/nordstrom/ers/processors/events/RoutingInsightsValidator.java` (NEW) — Validates insights event
  - `src/main/java/com/nordstrom/ers/processors/events/RoutingInsightsPublisher.java` (NEW) — Kafka producer call
  - `src/test/java/com/nordstrom/ers/processors/events/RoutingInsights*.java` (NEW) — Unit tests
- **Data Model:** Routing Insights Avro event schema unchanged
- **Integrations:** Kafka producer (Confluent Cloud), Avro Schema Registry
- **Security:** No changes
- **Testing:** Same approach as US-312: capture sample events pre-refactor, verify post-refactor parity

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] All resulting classes under 400 lines

---

## [EPIC-5] Epic: CI/CD Pipeline (GitHub Actions)

### US-314: Create GitHub Actions CI Workflow with Build, Test, Lint, and Coverage

**Story:**
As a platform engineer,
I want a GitHub Actions CI workflow that builds the project, runs unit tests, enforces code formatting via Spotless, and publishes JaCoCo coverage reports,
So that every pull request is automatically validated for correctness, quality, and coverage compliance.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 3
**Requirements:** TR-005, NFR-008, NFR-013

**Acceptance Criteria:**

```gherkin
Given a developer opens a pull request against the main branch,
When the GitHub Actions CI workflow triggers,
Then the following jobs execute in order: checkout, setup Java 17, lint (spotlessCheck), build (compileJava), test (test + jacocoTestCoverageVerification), and the workflow fails if any job fails.

Given Spotless is configured with Google Java Format,
When a PR contains code that does not conform to Google Java Format,
Then the spotlessCheck job fails and the PR cannot be merged.

Given branch protection rules are configured on the main branch,
When a developer attempts to merge a PR,
Then at least 1 approving review is required and the CI workflow must pass.
```

**Technical Notes:**
- **Files to Modify:**
  - `.github/workflows/ci.yml` (NEW) — GitHub Actions workflow with jobs: `lint`, `build`, `test`
    - Uses `actions/setup-java@v4` with Java 17 (Temurin distribution)
    - `lint` job: `./gradlew spotlessCheck`
    - `build` job: `./gradlew compileJava`
    - `test` job: `./gradlew test jacocoTestCoverageVerification`
    - Upload JaCoCo HTML report as GitHub Actions artifact
  - `.github/PULL_REQUEST_TEMPLATE.md` (NEW) — PR template with description, Jira link, checklist
- **Data Model:** No changes
- **Integrations:** GitHub branch protection API for configuring required checks
- **Security:** Branch protection: require 1 approving review, no self-approvals, require status checks to pass
- **Testing:** Trigger workflow on a test PR to verify all jobs pass

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] Branch protection rules configured on main branch

---

### US-315: Add Security Scanning to CI Pipeline (SAST and Dependency Check)

**Story:**
As a security engineer,
I want static application security testing (SAST) and dependency vulnerability scanning integrated into the GitHub Actions CI pipeline,
So that security vulnerabilities are detected before code reaches production.

**Priority:** P0
**Story Points:** 3
**Sprint:** Sprint 3
**Requirements:** TR-005, TR-011

**Acceptance Criteria:**

```gherkin
Given the CI workflow runs on every pull request,
When the SAST job executes using GitHub CodeQL for Java,
Then security analysis results appear in the GitHub Security tab under "Code scanning alerts".

Given the dependency-check job runs OWASP Dependency Check or Trivy,
When a dependency with a known critical or high CVE is detected,
Then the CI pipeline fails and the vulnerability details are reported in the job output.

Given a container image is built during CI,
When the container scan job runs (Trivy or equivalent),
Then the scan checks for critical/high OS-level and application-level vulnerabilities, and fails the pipeline if any are found.
```

**Technical Notes:**
- **Files to Modify:**
  - `.github/workflows/ci.yml` — Add jobs:
    - `sast` — GitHub CodeQL analysis (`github/codeql-action/init`, `github/codeql-action/analyze` with `language: java`)
    - `dependency-check` — OWASP Dependency Check Gradle plugin (`./gradlew dependencyCheckAnalyze`) or Trivy fs scan
    - `container-scan` — Build Docker image, then scan with `aquasecurity/trivy-action`
  - `build.gradle` — Add OWASP Dependency Check plugin if using Gradle-based scanning: `org.owasp:dependency-check-gradle`
  - `Dockerfile` — Ensure using approved Nordstrom base image; verify non-root USER directive
- **Data Model:** No changes
- **Integrations:** GitHub Security tab for CodeQL results; GitHub Actions artifacts for dependency check report
- **Security:** This story directly improves security posture; container must use approved base image and run as non-root (TR-011)
- **Testing:** Introduce a known vulnerable test dependency to verify pipeline fails; remove after verification

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] Security scanning results visible in GitHub Security tab

---

### US-316: Add Deployment Workflows with Approval Gates and Rollback

**Story:**
As a platform engineer,
I want GitHub Actions deployment workflows with environment progression (Dev -> Test -> Shadow Nonprod -> Nonprod -> Shadow Prod -> Prod), manual approval gates, and automated rollback on health check failure,
So that deployments follow Nordstrom standards for zero-downtime delivery with appropriate governance.

**Priority:** P0
**Story Points:** 2
**Sprint:** Sprint 4
**Requirements:** TR-005, TR-010, NFR-010, NFR-011

**Acceptance Criteria:**

```gherkin
Given a commit is merged to the main branch,
When the deployment workflow triggers,
Then the application is automatically deployed to Dev and Test environments, with manual approval required for Nonprod and Prod.

Given a production deployment requires a ServiceNow change request,
When an engineer initiates the Prod deployment approval,
Then the workflow includes a step that validates a ServiceNow change request number is provided before deployment proceeds.

Given the deployment completes to any environment,
When the Kubernetes health check (/enterpriseRoutingService/health) returns non-200 within 2 minutes,
Then the deployment is automatically rolled back to the previous version and a Slack notification is sent to #supply-chain-routing.

Given K8s deployment manifests are updated,
When resource requests/limits, HPA, and PDB configurations are included,
Then the deployment uses the configured CPU/memory limits and maintains availability during rolling updates via PDB.
```

**Technical Notes:**
- **Files to Modify:**
  - `.github/workflows/deploy.yml` (NEW) — Deployment workflow with environment matrix:
    - `deploy-dev` — Auto-deploy on merge to main
    - `deploy-test` — Auto-deploy after dev succeeds
    - `deploy-shadow-nonprod` — Auto-deploy after test succeeds
    - `deploy-nonprod` — Manual approval (squad lead)
    - `deploy-shadow-prod` — Manual approval
    - `deploy-prod` — Manual approval (squad lead + manager) + ServiceNow CR validation
  - `.github/workflows/rollback.yml` (NEW) — Manual rollback workflow
  - `scripts/rollback-on-failure.sh` (NEW) — Health check polling + kubectl rollback logic
  - `deployment/routing-service-deployment.yaml` — Add/verify resource requests/limits, HPA spec, PDB spec; update readiness probe to `/ready` (if available from Phase 1); liveness probe to `/enterpriseRoutingService/health`
- **Data Model:** No changes
- **Integrations:** ServiceNow API for change request validation; Slack webhook for rollback notifications; K8s API for deployment and rollback
- **Security:** Prod deployment requires ServiceNow CR; GitHub environment protection rules for approval gates; deployment secrets stored in GitHub Actions secrets (GUROBI_LICENSE, Redis passwords, Kafka credentials per TR-012)
- **Testing:** Dry-run deployment to dev environment; simulate health check failure to test rollback

**Definition of Done:**
- [ ] Code complete with unit tests (>=80% coverage)
- [ ] API integration tests passing
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] Rollback tested in non-production environment
- [ ] Deployment manifests include resource limits, HPA, and PDB
