# Code Analysis: APP00344-routing-service (Enterprise Routing Service)

**Analysis Date:** 2026-02-25  
**Repository:** TM00352/app00344-supply-chain-routing/APP00344-routing-service  
**GitLab Project ID:** 2422  
**Last Activity:** 2026-02-25

---

## Executive Summary

The Enterprise Routing Service (ERS) is a mature, production-grade Java/Spring Boot application that determines optimal fulfillment locations for customer orders by executing complex business rules and optimization algorithms. The application serves as a critical component in Nordstrom's supply chain, processing routing requests from COM (e-commerce) and Merch Search systems.

**Key Strengths:**
- Well-structured Spring Boot application with clear separation of concerns
- Comprehensive test coverage (248 test files for 430 source files - ~58% file coverage)
- Modern CI/CD using Nordstrom Standard Pipeline (GitLab CI → Kubernetes)
- Structured JSON logging using Log4J2 with custom nordlogger
- Redis caching for performance optimization
- Kafka event publishing for downstream integrations

**Key Concerns:**
- No database detected - application appears stateless or uses external data sources only
- Limited correlation ID usage (only 1 occurrence found in codebase)
- No apparent authentication/authorization implementation visible
- Large files exist (607 lines in ShippingDependenciesProcessor.java)
- 17 TODO/FIXME comments in production code

**Maturity Level:** Production-ready, actively maintained (recent commits from Feb 2026)

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Language** | Java | 11 |
| **Build Tool** | Gradle | 8.14.2 |
| **Framework** | Spring Boot | 2.7.15 |
| **Web Framework** | Spring MVC (REST) | 2.7.15 |
| **Logging** | Log4J2 + Custom nordlogger | 2.17.2 / 1.0.1.250 |
| **Caching** | Redis (Jedis client) | 3.7.1 |
| **Message Queue** | Apache Kafka | 3.5.2 |
| **Schema Registry** | Confluent | 7.5.1 |
| **AWS SDK** | AWS SDK v1 + v2 | 1.12.167 / 2.20.56 |
| **Testing** | JUnit 5 + Mockito | 5.9.3 / 4.11.0 |
| **Code Quality** | Spotless (Google Java Format) | 2.20.2 |
| **Coverage** | JaCoCo | (default) |
| **Circuit Breaker** | Hystrix | 2.2.10.RELEASE |
| **Metrics** | Micrometer + StatsD | (Spring Boot default) |
| **API Docs** | Springfox (Swagger) | 3.0.0 |
| **Optimization** | Gurobi (custom binaries) | (custom version) |
| **Monitoring** | New Relic | (runtime agent) |

---

## Architecture

### Project Structure

The application follows a **layered architecture** with clear separation between controllers, processors (business logic), domain models, and utilities:

```
com.nordstrom.ers/
├── Application.java                    # Spring Boot entry point
├── annotations/                        # Custom validation annotations
├── config/                             # Spring configuration classes
│   ├── WebConfig.java (484 lines)     # HTTP client, async, CORS
│   ├── RedisConfig.java               # Redis connection pooling
│   ├── SwaggerConfig.java             # API documentation
│   ├── PlanoutConfig.java             # A/B testing framework
│   └── MlpConfig.java                 # Machine learning platform
├── controllers/                        # REST API endpoints
│   ├── RoutingV2Controller.java       # Main routing API
│   ├── ExtendRoutingController.java   # Extended routing features
│   ├── EvalLastNodeController.java    # Last-mile delivery evaluation
│   ├── RoutingRuleConfigController.java # Feature flag management
│   ├── RedisVariableConfigController.java # Runtime config updates
│   └── PlanoutController.java         # A/B test management
├── domain/                             # Business domain logic
│   ├── nroute/                        # NRoute optimization engine
│   │   └── DynamicRoutingOptimizer.java (340 lines)
│   └── clients/                       # External service clients
│       ├── pcs/                       # Product catalog service
│       ├── sca/                       # Store capacity API
│       └── shipbytime/                # Ship-by-time service
├── entity/                             # Data transfer objects (DTOs)
│   ├── order/                         # Order request/response models
│   ├── request/                       # API request models
│   ├── response/                      # API response models
│   └── redis/                         # Redis data structures
├── processors/                         # Business logic processors
│   ├── nroute/                        # NRoute algorithm processors
│   │   ├── scn/                       # Supply chain network processors
│   │   │   └── ShippingDependenciesProcessor.java (607 lines)
│   │   └── mlp/                       # Machine learning platform processors
│   │       ├── ReleaseToShipService.java (398 lines)
│   │       └── ShipToDeliveryService.java (409 lines)
│   ├── nap/                           # NAP event publishing
│   │   ├── NAPEventConstructor.java (476 lines)
│   │   └── DynamicRoutingNAPDataInitializer.java (404 lines)
│   ├── insights/                      # Routing insights events
│   │   └── RoutingInsightsEventConstructor.java (509 lines)
│   ├── redis/                         # Redis caching services
│   │   ├── PlanoutService.java        # A/B test configuration
│   │   ├── RedisVariableCacheService.java # Runtime variables
│   │   └── ZipCodeService.java        # Zipcode mappings
│   └── validation/                    # Input validation services
├── exception/                          # Custom exception hierarchy
├── filters/                            # HTTP filters
│   ├── ShadowTrafficFilter.java       # Shadow traffic mirroring
│   └── RequestBodyCachingFilter.java  # Request body caching
├── metrics/                            # Metrics instrumentation
│   ├── MetricsConfig.java             # StatsD configuration
│   └── MetricsSender.java             # Metrics publishing
└── utils/                              # Utility classes
    ├── lineitems/                     # Line item utilities
    ├── locations/                     # Location utilities
    └── controller/                    # Controller helpers
```

**Architecture Pattern:** Layered architecture with horizontal slicing (controllers → processors → domain → external services)

**Design Characteristics:**
- **No JPA/Hibernate** - No `@Entity` or `@Table` annotations found, suggesting the app doesn't manage its own database
- **Heavy external service dependencies** - Integrates with 10+ external services
- **Redis as primary state store** - Used for configuration, feature flags, caching
- **Event-driven** - Publishes Kafka events for downstream consumers
- **Optimization-heavy** - Uses Gurobi solver for complex routing optimization

### Entry Point

**Main Class:** `com.nordstrom.ers.Application`
- Spring Boot application with `@SpringBootApplication`
- Excludes `DataSourceAutoConfiguration` (no database required)
- Standard Spring Boot entry point pattern

### Configuration Management

**Configuration Strategy:** Multi-profile Spring Boot properties with environment variable injection

**Configuration Files:**
- `application.properties` - Base configuration (97 properties)
- `application-dev.properties` - Development environment overrides
- `application-routing-service-perf.properties` - Performance testing environment
- `application-sc-routing-prod.properties` - Production environment

**Configuration Approach:**
- All secrets and environment-specific values injected via environment variables
- Example: `${GEO_REDIS_HOST}`, `${DB_PASSWORD}`, `${MLP_CLIENT_SECRET}`
- No hardcoded secrets detected in source code or config files

**Key Configuration Areas:**
- Redis connection pooling (2 Redis instances: geo cache + capacity cache)
- Kafka producer settings (OAuth2 authentication, Avro serialization)
- External service URLs (ETA, EAVS, PCS, SCA, MLP, etc.)
- Metrics publishing (StatsD, New Relic)
- Health endpoint configuration
- Planout A/B testing configuration

---

## API Inventory

The application exposes multiple REST API endpoints organized by functional area.

### Base Path
**Context Path:** `/enterpriseRoutingService`

### Routing APIs (`/Routing`)

| Method | Path | Controller | Description | Auth |
|--------|------|-----------|-------------|------|
| POST | `/Routing/evaluateLocations` | RoutingV2Controller | Main routing API - evaluates fulfillment locations | Unknown |
| POST | `/Routing/extendRoute` | ExtendRoutingController | Extended routing with additional parameters | Unknown |
| POST | `/Routing/evaluateLastNode` | EvalLastNodeController | Last-mile delivery evaluation | Unknown |

### Configuration APIs

| Method | Path | Controller | Description | Auth |
|--------|------|-----------|-------------|------|
| **Rule Config** (`/RuleConfig`) |
| GET | `/RuleConfig/getAllFeatureFlags` | RoutingRuleConfigController | Get all feature flags | Unknown |
| GET | `/RuleConfig/getFlagByFeature` | RoutingRuleConfigController | Get specific feature flag | Unknown |
| POST | `/RuleConfig/updateFeatureFlag` | RoutingRuleConfigController | Update feature flag | Unknown |
| DELETE | `/RuleConfig/deleteFeatureFlag` | RoutingRuleConfigController | Delete feature flag | Unknown |
| **Variable Config** (`/VariableConfig`) |
| POST | `/VariableConfig/createUpdateRedisVariable` | RedisVariableConfigController | Create/update Redis variable | Unknown |
| POST | `/VariableConfig/createUpdateRedisVariables` | RedisVariableConfigController | Bulk create/update variables | Unknown |
| GET | `/VariableConfig/getAllRedisVariables` | RedisVariableConfigController | Get all variables from Redis | Unknown |
| GET | `/VariableConfig/getAllRedisVariablesFromCache` | RedisVariableConfigController | Get all variables from cache | Unknown |
| GET | `/VariableConfig/getRedisVariable` | RedisVariableConfigController | Get specific variable | Unknown |
| DELETE | `/VariableConfig/deleteRedisVariable` | RedisVariableConfigController | Delete variable | Unknown |
| **Zipcode Config** (`/Routing`) |
| POST | `/Routing/updateZipCodes` | RoutingZipcodeConfigController | Update zipcode mappings | Unknown |
| GET | `/Routing/getAllZipCodes` | RoutingZipcodeConfigController | Get all zipcodes | Unknown |
| POST | `/Routing/deleteZipCodes` | RoutingZipcodeConfigController | Delete zipcodes | Unknown |

### Planout A/B Testing (`/Planout`)

| Method | Path | Controller | Description | Auth |
|--------|------|-----------|-------------|------|
| POST | `/Planout/updatePlanout` | PlanoutController | Update A/B test configuration | Unknown |
| GET | `/Planout/getPlanout` | PlanoutController | Get A/B test configuration | Unknown |

### Health & Monitoring

| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET | `/health` | Health check (application is alive) | Kubernetes liveness probe |
| GET | `/ready` | (Not explicitly configured - may use `/health`) | Kubernetes readiness probe |

**API Characteristics:**
- **Style:** REST with JSON request/response
- **Versioning:** Mixed - some endpoints have `V2` suffix, others have no version
- **Error Handling:** Centralized via `RoutingController` base class with custom exception hierarchy
- **Validation:** Bean validation using custom constraint validators (`@RoutingSkuConstraintValidator`, etc.)
- **Documentation:** Swagger/OpenAPI (Springfox) - **disabled in production** (`springfox.documentation.enabled=false`)


---

## Data Model

### Database

**Finding:** **No traditional relational database detected.**

- No JPA/Hibernate entities (`@Entity`, `@Table`) found in codebase
- `DataSourceAutoConfiguration` is explicitly excluded in `Application.java`
- Database connection parameters present in config (`DB_URL`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`) but unused
- Application appears to be **stateless** or relies entirely on external services and caching

### Data Storage Strategy

**Redis (Primary State Store):**
- **GEO Redis Cluster:** Geographic and location data caching
  - Host: `${GEO_REDIS_HOST}`, Port: `${GEO_REDIS_PORT}`
  - Connection pooling: Min 20, Max 200 connections
- **Capacity Redis Cluster:** Capacity information caching
  - Host: `${REDIS_HOST_CAPACITY}`, Port: `${REDIS_PORT_CAPACITY}`
  - Connection pooling: Min 20, Max 200 connections

**Redis Use Cases:**
1. **Planout Configuration:** A/B test configurations stored in Redis with PubSub updates
2. **Feature Flags:** Runtime feature toggles for gradual rollouts
3. **Runtime Variables:** Dynamic configuration values (LOH_MILES, etc.)
4. **Zipcode Mappings:** Zipcode to location mappings
5. **Geo Data Cache:** Geographic distance calculations
6. **Capacity Cache:** Store capacity information

**DynamoDB (via SCN Data Provider):**
- Application depends on `com.nordstrom.scn.provider:data-client` library
- AWS SDK v2 DynamoDB Enhanced client configured
- Used for **Supply Chain Network (SCN)** data retrieval
- No direct DynamoDB table definitions in this repository

### Key Data Models (DTOs)

**Request Models (`entity.request`):**
- `Order` - Main order request DTO (contains TODO comment)
- `ExtendRequest` - Extended routing request parameters
- `LastNodeRequest` - Last-mile delivery evaluation request

**Response Models (`entity.response`):**
- Standard routing response models
- `ExtendResponse` - Extended routing response
- Location-specific response models

**Domain Models (`entity.order.location`):**
- `ETANodeState` - Estimated time of arrival node state

**Redis Models (`entity.redis`):**
- Feature flag models
- Variable configuration models

**Thread Models (`entity.thread`):**
- Thread-local context models for async processing

---

## Integrations

### External Services

The routing service integrates with numerous external services for decision-making:

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **SCA (Store Capacity API)** | Store inventory and capacity data | Via routing-inputs library |
| **GEO Information Service** | Geographic distance calculations | Via EAVS_URL |
| **PCS (Product Catalog Service)** | Product information | `${PCS_URL}`, API key: `${PCS_API_KEY}` |
| **ETA Service** | Estimated delivery time calculation | `${ETA_URL}` |
| **EAVS** | (Unknown acronym - possibly address validation) | `${EAVS_URL}` |
| **Item Service** | Item information retrieval | `${ITEM_SERVICE_URL}` |
| **Ship By Time Service** | Shipping cutoff times | `${SHIP_BY_TIME_URL}` |
| **PAS** | (Unknown acronym) | `${PAS_URL}` |
| **MLP (Machine Learning Platform)** | ML-based routing predictions | Multiple URLs (RTS, STD) |

**MLP Integration Details:**
- **Authentication:** OAuth2 client credentials flow
- **Token URL:** `${MLP_TOKEN_URL}`
- **Services:**
  - **RTS (Release To Ship):** `${MLP_RTS_URL}` - Predicts release-to-ship time
  - **STD (Ship To Delivery):** `${MLP_STD_URL}` - Predicts ship-to-delivery time
- **Timeouts:** Separate connection, request, read, write timeouts configured

**Circuit Breaker:**
- Netflix Hystrix used for fault tolerance
- Custom `CircuitBreakerHystrixEventNotifier` for metrics

### Message Queue (Kafka)

**Producer Configuration:**
- **Bootstrap Servers:** Confluent Cloud (different for nonprod/prod)
  - Nonprod: `lkc-z30oqd.dom8pmr03gy.us-west-2.aws.confluent.cloud:9092`
  - Prod: `lkc-r2dyv9.dom6pk11zgn.us-west-2.aws.confluent.cloud:9092`
- **Authentication:** SASL_SSL with OAUTHBEARER (Okta OAuth2)
- **Schema Registry:** Nordstrom schema registry (nonprod/prod)
  - Nonprod: `https://schema-registry-nonprod-us-west-2.nordstromaws.app`
  - Prod: `https://schema-registry-prod-us-west-2.nordstromaws.app`
- **Serialization:** Avro with schema registry (no auto-registration)
- **Compression:** Zstandard (`zstd`)
- **Reliability:** Acks=1, Retries=1

**Topics Produced:**

| Topic | Purpose | Processor |
|-------|---------|-----------|
| `inventory-routing-decision-made-avro` | Default topic - routing decisions | (Spring Kafka default) |
| `${NAP_EVENT_TOPIC}` | NAP (Network Analysis Platform?) events | NAPEventConstructor |
| `${ROUTING_INSIGHTS_EVENT_TOPIC}` | Routing insights and analytics events | RoutingInsightsEventConstructor |

**Event Publishing:**
- **NAP Events:** Published by `NAPEventConstructor` (476 lines) and `NAPDataHandler`
- **Routing Insights Events:** Published by `RoutingInsightsEventConstructor` (509 lines)
- Events include routing decisions, location evaluations, and business metrics

### AWS Services

- **S3:** Previously used for Gurobi libraries (now bundled in repo)
- **SQS:** AWS SDK dependency present (usage unclear)
- **SNS:** AWS SDK dependency present (usage unclear)
- **STS:** AWS Security Token Service for credential assumption
- **DynamoDB:** Via SCN data provider library
- **ElastiCache (Redis):** Production-managed Redis clusters
  - Nonprod: `routing-geo-ci-nonprod.d9ees5.ng.0001.usw2.cache.amazonaws.com`
  - Prod: `routing-geo-ci-prod.xsb56n.ng.0001.usw2.cache.amazonaws.com`

### Schema Repository

- **Library:** `com.nordstrom.sig:schema-repository:2157:legacy`
- **Purpose:** Kafka Avro schema access for event publishing
- **Integration:** Via MCP server (as per project requirements)

---

## Testing Assessment

### Test Framework

| Type | Framework | Configuration |
|------|-----------|---------------|
| **Unit Tests** | JUnit 5 (Jupiter) | `useJUnitPlatform()` |
| **Mocking** | Mockito | 4.11.0 (mockito-inline for final classes) |
| **HTTP Mocking** | MockWebServer (OkHttp) | 4.9.3 |
| **Integration Tests** | Spring Boot Test + MockMvc | Spring Boot 2.7.15 |
| **Kafka Testing** | Spring Kafka Test | (Spring Kafka version) |

### Test Coverage

**Test File Count:** 248 test files  
**Source File Count:** 430 source files  
**File Coverage Ratio:** ~58%

**Coverage Configuration:**
- **Tool:** JaCoCo
- **Reports:** XML, CSV, HTML (output to `build/reports/jacoco`)
- **Enforcement:** Coverage report generated on every test run (`finalizedBy jacocoTestReport`)
- **Threshold:** No minimum coverage threshold enforced in build

**Test Structure:**
```
src/test/java/com/nordstrom/ers/
├── filters/                  # Filter tests
├── metrics/                  # Metrics tests
├── config/                   # Configuration tests
├── entity/                   # DTO validation tests
├── stager/                   # Staging logic tests
└── utils/                    # Utility class tests
    ├── lineitems/           # Line item utilities
    ├── splitter/            # Splitting logic
    ├── skus/                # SKU processing
    ├── scn/                 # SCN integration
    ├── promises/            # Promise handling
    └── controller/          # Controller helpers
```

### Testing Patterns

**Mocking Approach:**
- Mockito used extensively for unit tests
- `@MockBean` for Spring context integration tests
- MockWebServer for HTTP client testing (external service calls)
- Spring Kafka Test for Kafka producer testing

**Test Data Management:**
- Test resources in `src/test/resources/files/`
- No explicit fixture or builder pattern detected
- JSON files used for test data

**Coverage Gaps (Observed):**
- No tests found for `controllers/` package in test directory listing
- Large processor files (600+ lines) may have incomplete coverage
- Integration tests exist (`inttest/` directory at root) but not in standard test path

### Integration Tests

**Separate Integration Test Suite:**
- Directory: `inttest/` (root level, not in src/test)
- CI Configuration: `inttest-gitlab-ci.yml`
- Mock Services: External service mocks mentioned in README
- Confluence Documentation: https://confluence.nordstrom.com/display/SCh/Updating+the+Integration+Tests+-+GitLab


---

## CI/CD Pipeline

### Pipeline Platform

**CI/CD System:** GitLab CI using **Nordstrom Standard Pipeline Template v6**

**Pipeline Configuration:**
- **Main File:** `.gitlab-ci.yml` (22 lines - delegates to template)
- **Custom Configuration:** `.project-ci.yml` (6835 lines - extensive customization)
- **Template Source:** `tm01090/pipeline-templates/app02944-variables-ui` (v6)

### Build Configuration

| Setting | Value |
|---------|-------|
| **Pipeline Version** | v6 |
| **App Type** | deployment |
| **Build Type** | gradle8 |
| **Deployment Target** | nskapp (Nordstrom Shared Kubernetes App Platform) |
| **Includes Service** | Yes (K8s Service manifest) |
| **Ingress Type** | standard |

### Pipeline Stages (Standard Pipeline)

Based on Nordstrom Standard Pipeline template and README documentation:

1. **Build**
   - Gradle compilation using Java 11 toolchain
   - Artifact publication to Artifactory
   - Spotless code formatting check

2. **Test**
   - Unit tests (`./gradlew test`)
   - Code coverage report generation (JaCoCo)
   - Test results published

3. **Security Scan**
   - Dependency vulnerability scanning
   - Static analysis (SAST)

4. **Container Build**
   - Docker image build using `docker/Dockerfile`
   - Base image: `artifactory.nordstrom.com/docker/cic/java_jre_runtime_v11:${CIC_RELEASE}`
   - Non-root user (`nonroot:nonroot`)
   - Gurobi libraries bundled in image
   - New Relic agent included

5. **Container Scan**
   - Image vulnerability scanning

6. **Deploy to Dev (Feature Branch)**
   - Automatic deployment to feature branch environment
   - Job: `k8s-nskapp-deploy-nonprod-development-branch`
   - URL pattern: `https://sc-routing-dev.nonprod.scrav.vip.nordstrom.com`

7. **Deploy to Test**
   - Deployment to shared test environment
   - URL: `https://sc-routing-test.nonprod.scrav.vip.nordstrom.com`

8. **Deploy to Shadow Nonprod**
   - Canary deployment for production-like testing
   - URL: `https://sharedingress-nsk-beet-nonprod-us-west-2.nordstromaws.app/app00344/routing-service-shadow`

9. **Deploy to Nonprod**
   - Staging environment
   - URL: `https://sc.routing.nonprod.scrav.vip.nordstrom.com`

10. **Integration Tests**
    - Separate integration test suite (`inttest-gitlab-ci.yml`)
    - Mock services for external dependencies

11. **ServiceNow Change Request**
    - Job: `service-now-open-change-request`
    - Required before production deployment

12. **Deploy to Prod**
    - Manual approval gate
    - Job: `k8s-aws-shared-deploy-prod`
    - URL: `https://sc-routing.prod.scrav.vip.nordstrom.com`

13. **Tag Release**
    - Git tag creation for successful production deployments

### Deployment Strategy

**Platform:** Kubernetes (Nordstrom Standard K8s)
- **Namespace:** app00344-routing-service (inferred)
- **Deployment Type:** Standard Kubernetes Deployment (no Helm charts)
- **Manifest Location:** `k8s/nonprod/`, `k8s/prod/`
- **Ingress:** Standard ingress (not shared ingress)

**Rollback Process** (from README):
1. Find previous successful production pipeline
2. Run jobs in sequence:
   - `service-now-open-change-request`
   - `k8s-aws-shared-deploy-prod`
   - `tag-release`
3. Wait for each job to complete before running next

**Shadow Traffic:**
- Custom `ShadowTrafficFilter` for traffic mirroring
- Shadow environments: nonprod and prod
- Configuration: `ShadowTrafficConfig`

### Secrets Management

**Artifactory Credentials:**
- `$DevS_ArtiUsername_app00344` - Username for Artifactory
- `$DevS_ArtiReferenceToken_app00344` - API key for Artifactory

**Gurobi License:**
- Stored as GitLab CI/CD variable: `GUROBI_LICENSE_CONTENT_{expirationDate}`
- Injected at build time

**Runtime Secrets:**
- All runtime secrets (DB passwords, API keys, etc.) injected via environment variables
- Managed by Kubernetes Secrets or external secret store (Vault)

**SSH Key:**
- `GIT_SSH_KEY` variable used for deployment and release tagging
- Created per Standard Pipeline onboarding guide

### Environment Management

| Environment | Purpose | URL | Auto Deploy |
|-------------|---------|-----|-------------|
| **Dev (Feature Branch)** | Developer testing | Dynamic URL per branch | Yes |
| **Test** | QA testing | https://sc-routing-test.nonprod.scrav.vip.nordstrom.com | Yes |
| **Shadow Nonprod** | Production mirror testing | https://sharedingress-nsk-beet-nonprod-us-west-2.nordstromaws.app/app00344/routing-service-shadow | Yes |
| **Nonprod** | Staging/pre-prod | https://sc.routing.nonprod.scrav.vip.nordstrom.com | Yes |
| **Shadow Prod** | Production canary | https://sharedingress-nsk-beet-prod-us-west-2.nordstromaws.app/app00344/routing-service-shadow | Manual |
| **Prod** | Production | https://sc-routing.prod.scrav.vip.nordstrom.com | Manual (with approval) |

---

## Security Assessment

| Area | Status | Notes |
|------|--------|-------|
| **Authentication** | ⚠️ | No authentication implementation detected in controllers |
| **Authorization** | ⚠️ | No `@PreAuthorize` or `@Secured` annotations found |
| **Secrets Handling** | ✅ | All secrets via environment variables - no hardcoded secrets |
| **Input Validation** | ✅ | Bean validation with custom validators |
| **PII Handling** | ⚠️ | No explicit PII masking detected in logs |
| **Dependency Vulnerabilities** | ⚠️ | Log4J 2.17.2 (patched for Log4Shell, but not latest) |

### Authentication

**Finding:** No authentication layer visible in source code.

- No Spring Security configuration classes found
- No `SecurityConfig.java` or `WebSecurityConfigurerAdapter`
- No JWT, OAuth2, or session management detected
- Controllers lack `@PreAuthorize`, `@Secured`, or similar annotations

**Possible Explanations:**
1. Authentication handled by API Gateway/Ingress upstream
2. Internal-only service (no external exposure)
3. Security implemented via Kubernetes network policies

### Authorization

**Finding:** No RBAC implementation detected.

- No role-based access control at API layer
- All endpoints appear publicly accessible (within network)

### Secrets Management

**Status:** ✅ **Compliant**

- All secrets injected via environment variables:
  - Database: `${DB_PASSWORD}`
  - MLP: `${MLP_CLIENT_SECRET}`
  - API Keys: `${PCS_API_KEY}`, `${NEW_RELIC_LICENSE_KEY}`
  - Kafka: `${SASL_JAAS_CONFIG_DEV}`, `${SASL_JAAS_CONFIG_PROD}`
- No hardcoded passwords, API keys, or tokens found in source code or config files
- Gurobi license stored as GitLab CI/CD variable (not in repo)

**Best Practice Followed:** ✅ Secrets never committed to version control

### Input Validation

**Status:** ✅ **Implemented**

- Bean Validation (JSR-380) used extensively
- Custom constraint validators:
  - `RoutingSkuConstraintValidator`
  - `CallTypeConstraintValidator`
  - `DateFormatCheckConstraintValidator`
  - `PriceTypeConstraintValidator`
  - `RoutingIsPOBoxContraintValidator`
  - `ShipToZipStoreConstraintValidator`
  - `ExtendDeliveryDetailsConstraintValidator`
- Validation enforced at controller layer via `@Valid` annotations (inferred)

### PII Handling

**Status:** ⚠️ **Unclear**

- **Correlation ID Usage:** Only 1 occurrence found (expected to be pervasive)
- **PII Masking:** No explicit masking library or utility detected
- **Log Analysis:** nordlogger library used, but masking strategy unclear
- **Recommendation:** Audit logs for PII leakage (names, emails, addresses, phone numbers)

### Dependency Vulnerabilities

**Concerns:**

1. **Log4J 2.17.2** - Patched for CVE-2021-44228 (Log4Shell) but not latest (2.24+ as of 2026)
2. **Spring Boot 2.7.15** - End of OSS support was August 2023; commercial support required
3. **Hystrix** - Netflix OSS project in maintenance mode (no active development)
4. **Java 11** - LTS but not latest (Java 17+ recommended for new development)

**Recommendations:**
- Upgrade Log4J to 2.24+
- Migrate to Spring Boot 3.x (requires Java 17+)
- Replace Hystrix with Resilience4j (Spring Cloud Circuit Breaker)

---

## Nordstrom Standards Compliance

| Standard | Compliant | Gap | Priority |
|----------|-----------|-----|----------|
| **Structured JSON Logging** | ✅ | Log4J2 with custom JSON pattern | - |
| **Correlation IDs** | ❌ | Only 1 usage found (should be pervasive) | **HIGH** |
| **Health Endpoints** | ✅ | `/health` configured | - |
| **Readiness Endpoint** | ⚠️ | `/ready` not explicitly configured | **MEDIUM** |
| **CI/CD on GitHub** | ❌ | Uses GitLab CI (Nordstrom standard for this app) | N/A |
| **K8s Deployment** | ✅ | Standard K8s deployment | - |
| **80% Test Coverage** | ⚠️ | No threshold enforced; 58% file coverage estimated | **HIGH** |
| **SLIs/SLOs** | ⚠️ | Metrics sent to StatsD/New Relic; SLOs unclear | **MEDIUM** |
| **No PII in Logs** | ⚠️ | Masking strategy unclear | **HIGH** |
| **Secrets via Vault/K8s Secrets** | ✅ | All secrets via environment variables | - |

### Detailed Compliance Analysis

#### ✅ Structured JSON Logging
**Status:** Compliant

- Log4J2 configured with custom nordlogger pattern
- JSON output to STDOUT for container logging
- Pattern includes: env, hostname, service name, UUID, date, log level, class, thread
- Schema validation included in log pattern

**Example Pattern:**
```json
{
  "env": "${ENV_SHORT_NAME}",
  "logtype": "applog",
  "hostname": "${HOSTNAME}",
  "servicename": "${SERVICE_NAME}",
  "uuid": "%uuid",
  "date": "%dd",
  "loglevel": "%-6p",
  "class": "%c{3}",
  "thread": "%t",
  "schemacheck": "%schemacheck"
}
```

#### ❌ Correlation IDs
**Status:** Non-Compliant

- **Expected:** Correlation ID in every log line, propagated across service calls
- **Actual:** Only 1 occurrence of "correlationId" in entire codebase
- **Impact:** Difficult to trace requests across services in distributed system
- **Recommendation:** Implement MDC (Mapped Diagnostic Context) filter to capture correlation ID from header (`X-Correlation-ID`) and add to all log lines

#### ✅ Health Endpoints
**Status:** Compliant

- Health endpoint: `/enterpriseRoutingService/health` (configured in application.properties)
- Spring Actuator health endpoint enabled
- Management endpoints base path set to `/` (non-standard but functional)
- Used by Kubernetes liveness probe (inferred from README)

#### ⚠️ Readiness Endpoint
**Status:** Partially Compliant

- No explicit `/ready` endpoint configuration found
- May rely on `/health` for both liveness and readiness probes
- **Best Practice:** Separate liveness (is process alive?) from readiness (can serve traffic?)
- **Recommendation:** Configure separate readiness probe that checks Redis connectivity, Kafka producer status

#### ⚠️ Test Coverage
**Status:** Unclear

- No JaCoCo coverage threshold enforced in `build.gradle`
- Test file count suggests ~58% file coverage
- **Nordstrom Standard:** Minimum 80% unit test coverage
- **Recommendation:** Add JaCoCo violation rules to fail build if coverage < 80%

#### ⚠️ SLIs/SLOs
**Status:** Unclear

- Metrics sent to StatsD (DataDog agent) and New Relic
- Custom `MetricsConfig` and `MetricsSender` classes present
- **No documentation found** defining SLIs (latency, error rate, throughput) or SLOs (targets)
- **Recommendation:** Document SLIs/SLOs in `docs/slo.md` or Confluence; configure alerting based on SLO burn rate

#### ⚠️ PII in Logs
**Status:** Unclear

- nordlogger library used (may have built-in masking)
- No explicit PII masking utility found in codebase
- **Risk:** Order data may contain customer names, addresses, phone numbers
- **Recommendation:** Audit logs in Splunk/Datadog for PII patterns; implement masking filter if needed


---

## Tech Debt Register

| ID | Description | Severity | Effort | Location | Impact |
|----|-------------|----------|--------|----------|--------|
| **TD-001** | No correlation ID propagation | **High** | Medium | Logging infrastructure | Cannot trace requests across services |
| **TD-002** | 17 TODO/FIXME comments in production code | Medium | Small | Various files | Code maintainability, incomplete features |
| **TD-003** | Large files (600+ lines) | Medium | Large | ShippingDependenciesProcessor.java (607), RoutingInsightsEventConstructor.java (509) | Code complexity, testing difficulty |
| **TD-004** | No test coverage threshold enforced | High | Small | build.gradle | Technical debt accumulation |
| **TD-005** | Spring Boot 2.7.15 (EOL for OSS) | **High** | **Large** | build.gradle | Security vulnerabilities, no community support |
| **TD-006** | Java 11 (not latest LTS) | Medium | **Large** | build.gradle | Missing modern Java features (records, pattern matching, etc.) |
| **TD-007** | Hystrix (maintenance mode) | Medium | Medium | Circuit breaker implementation | No active development, should migrate to Resilience4j |
| **TD-008** | No authentication implementation visible | **High** | Medium | Controllers | Security posture unclear |
| **TD-009** | No separate readiness probe | Medium | Small | Health configuration | Kubernetes may route traffic to unhealthy pods |
| **TD-010** | Log4J 2.17.2 (not latest) | Medium | Small | build.gradle | Potential security vulnerabilities |
| **TD-011** | No database usage despite config | Low | N/A | application.properties | Dead configuration (DB_URL, DB_PASSWORD) |
| **TD-012** | Mixed API versioning strategy | Medium | Medium | Controllers | Some endpoints have V2, others have no version |
| **TD-013** | Swagger disabled in production | Low | Small | application.properties | No runtime API documentation |
| **TD-014** | Integration tests not in standard location | Medium | Medium | inttest/ (root level) | Non-standard project structure |
| **TD-015** | No JPA entities despite database config | Low | N/A | Entire codebase | Architectural inconsistency |

### High-Priority Tech Debt (Recommended for Immediate Action)

#### 1. TD-001: Implement Correlation ID Propagation
**Severity:** High  
**Effort:** Medium (2-3 days)  
**Business Impact:** Cannot trace customer issues across distributed system

**Action Items:**
- Create servlet filter to extract `X-Correlation-ID` from headers
- If not present, generate UUID and add to response headers
- Add correlation ID to Log4J2 MDC in filter
- Update log pattern to include MDC correlation ID
- Propagate correlation ID to downstream service calls (RestTemplate, WebClient)
- Add correlation ID to Kafka message headers

#### 2. TD-004: Enforce Test Coverage Threshold
**Severity:** High  
**Effort:** Small (1 day)  
**Business Impact:** Prevents regression as code evolves

**Action Items:**
- Add JaCoCo `violationRules` to `build.gradle`:
  ```gradle
  jacocoTestCoverageVerification {
      violationRules {
          rule {
              limit {
                  minimum = 0.80
              }
          }
      }
  }
  build.dependsOn jacocoTestCoverageVerification
  ```
- Measure current coverage baseline
- Create plan to close coverage gaps incrementally

#### 3. TD-005: Upgrade Spring Boot to 3.x
**Severity:** High  
**Effort:** Large (2-3 weeks)  
**Business Impact:** Security vulnerabilities, technical debt interest

**Action Items:**
- Upgrade to Java 17 (required for Spring Boot 3.x)
- Update Spring Boot to 3.2+ (latest stable)
- Migrate deprecated APIs (e.g., `SecurityFilterChain` instead of `WebSecurityConfigurerAdapter`)
- Update dependencies (Spring Cloud, etc.)
- Test thoroughly in non-production environments

#### 4. TD-008: Clarify Authentication Implementation
**Severity:** High  
**Effort:** Medium (depends on findings)  
**Business Impact:** Security posture unclear, potential exposure

**Action Items:**
- Document authentication strategy (API Gateway? Kubernetes Network Policy? None?)
- If no auth: assess risk and implement Spring Security with OAuth2/JWT
- If upstream auth: document in README and add integration tests to verify
- Add authorization checks for sensitive endpoints (config updates, feature flags)

### Medium-Priority Tech Debt

#### 5. TD-003: Refactor Large Files
**Severity:** Medium  
**Effort:** Large (1-2 weeks)  
**Target Files:**
- `ShippingDependenciesProcessor.java` (607 lines)
- `RoutingInsightsEventConstructor.java` (509 lines)
- `WebConfig.java` (484 lines)
- `NAPEventConstructor.java` (476 lines)

**Approach:**
- Apply **Extract Class** refactoring
- Single Responsibility Principle: Split processors into smaller, focused classes
- Improve testability: Smaller classes are easier to unit test

#### 6. TD-009: Add Separate Readiness Probe
**Severity:** Medium  
**Effort:** Small (1 day)  

**Action Items:**
- Configure Spring Actuator readiness endpoint
- Readiness check should verify:
  - Redis connectivity (both geo and capacity clusters)
  - Kafka producer connectivity
  - Critical external service availability (optional)
- Update Kubernetes deployment manifest with separate readiness probe

### Low-Priority Tech Debt

#### 7. TD-013: Enable Swagger in Non-Production
**Severity:** Low  
**Effort:** Small (1 hour)  

**Rationale:** Swagger is useful for developers and QA but should remain disabled in production

**Action Items:**
- Enable Swagger in dev/test profiles: `springfox.documentation.enabled=${SWAGGER_ENABLED:false}`
- Set `SWAGGER_ENABLED=true` in dev/test environments only

---

## Code Smells & Patterns

### Positive Patterns Observed

1. **Clear Package Organization:** Separation of controllers, processors, domain, entities
2. **Dependency Injection:** Spring-managed beans, constructor injection
3. **Configuration Externalization:** All environment-specific config via properties
4. **Async Processing:** `@AsyncConfig` for non-blocking operations
5. **Code Formatting Enforced:** Spotless with Google Java Format
6. **Circuit Breaker Usage:** Hystrix for external service calls
7. **Comprehensive Validation:** Custom constraint validators for domain rules
8. **Event-Driven Architecture:** Kafka event publishing for downstream systems

### Code Smells Detected

1. **God Classes:**
   - `ShippingDependenciesProcessor` (607 lines)
   - `RoutingInsightsEventConstructor` (509 lines)
   - **Impact:** High complexity, testing difficulty

2. **Magic Numbers:**
   - Hardcoded timeouts, thresholds in code (needs configuration externalization audit)

3. **TODO Comments in Production:**
   - 17 TODO/FIXME/HACK comments detected
   - **Example locations:**
     - `MetricsConfig.java`
     - `NAPDecision.java`
     - `NAPDataHandler.java`
     - `Order.java` (request entity)
   - **Recommendation:** Convert TODOs to Jira tickets and remove comments

4. **Inconsistent Naming:**
   - `nordlogger` vs `routing-nordlogger` (library naming)
   - Mixed camelCase and snake_case in config properties

5. **Dead Code Suspected:**
   - Database configuration present but unused (no JPA, no DataSource)

### Recommendations for Code Quality

1. **Refactoring Priorities:**
   - Break down large processor classes (600+ lines)
   - Extract constants for magic numbers
   - Remove or track TODO comments as tech debt

2. **Testing Improvements:**
   - Add controller integration tests (not found in test directory)
   - Increase coverage for large processor classes
   - Add contract tests for Kafka event schemas

3. **Documentation:**
   - Add JavaDoc to public APIs
   - Document complex business logic in processors
   - Create architecture decision records (ADRs)

---

## Recommendations

### Immediate Actions (This Sprint)

| Priority | Recommendation | Effort | Impact | Compliance Gap |
|----------|---------------|--------|--------|----------------|
| 1 | **Implement correlation ID propagation** | Medium | High | Standards: Correlation IDs |
| 2 | **Add JaCoCo coverage threshold (80%)** | Small | High | Standards: Test Coverage |
| 3 | **Document authentication strategy** | Small | High | Standards: Security |
| 4 | **Add separate readiness probe** | Small | Medium | Standards: Health Endpoints |
| 5 | **Audit logs for PII leakage** | Small | High | Standards: PII Handling |

### Near-Term (Next 2-4 Sprints)

| Priority | Recommendation | Effort | Impact |
|----------|---------------|--------|--------|
| 6 | **Upgrade Spring Boot to 3.x + Java 17** | Large | High |
| 7 | **Refactor large processor classes** | Large | Medium |
| 8 | **Replace Hystrix with Resilience4j** | Medium | Medium |
| 9 | **Increase test coverage to 80%** | Large | High |
| 10 | **Implement API versioning strategy** | Medium | Medium |

### Long-Term (Backlog)

| Priority | Recommendation | Effort | Impact |
|----------|---------------|--------|--------|
| 11 | **Migrate to Java 21 LTS** | Medium | Low |
| 12 | **Add OpenTelemetry tracing** | Medium | Medium |
| 13 | **Create architecture decision records** | Small | Low |
| 14 | **Add contract tests for Kafka events** | Medium | Medium |
| 15 | **Performance testing automation** | Large | Medium |

---

## Summary for Stakeholders

### What the Application Does Well

- **Production-Grade Infrastructure:** Kubernetes deployment with standard pipeline, multi-environment setup
- **Comprehensive Integrations:** Seamlessly integrates with 10+ external services
- **Event-Driven Architecture:** Publishes Kafka events for downstream analytics
- **Security Basics:** No hardcoded secrets, all secrets via environment variables
- **Structured Logging:** JSON logs ready for log aggregation tools
- **Code Quality Enforcement:** Spotless formatting, validation framework

### Key Risks & Gaps

1. **Correlation ID Missing:** Cannot trace customer issues across distributed system (High Risk)
2. **Test Coverage Unknown:** No enforced threshold, potential regression risk (High Risk)
3. **Spring Boot EOL:** Using Spring Boot 2.7.15 which is no longer supported by OSS (High Risk)
4. **Authentication Unclear:** No visible authentication layer, security posture uncertain (High Risk)
5. **PII Handling Unclear:** No evidence of PII masking in logs (Medium Risk)

### Investment Recommendations

**Critical (Next 30 Days):**
- Implement correlation ID propagation ($8K - 2 dev-weeks)
- Document and test authentication strategy ($4K - 1 dev-week)
- Add test coverage threshold enforcement ($2K - 0.5 dev-weeks)

**Strategic (Next Quarter):**
- Upgrade to Spring Boot 3.x + Java 17 ($60K - 3 dev-sprints)
- Refactor large classes and increase test coverage ($40K - 2 dev-sprints)
- Replace Hystrix with Resilience4j ($20K - 1 dev-sprint)

**Total Estimated Investment:** ~$134K over 6 months to address critical tech debt and modernize platform

---

## Appendix: File Locations

### Key Configuration Files
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/build.gradle`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/src/main/resources/application.properties`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/src/main/resources/log4j2.xml`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/.gitlab-ci.yml`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/.project-ci.yml`

### Key Source Files
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/src/main/java/com/nordstrom/ers/Application.java`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/src/main/java/com/nordstrom/ers/controllers/RoutingV2Controller.java`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/src/main/java/com/nordstrom/ers/config/WebConfig.java`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/src/main/java/com/nordstrom/ers/processors/nroute/scn/ShippingDependenciesProcessor.java`

### Docker & Kubernetes
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/docker/Dockerfile`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/k8s/nonprod/`
- `/Users/brub/dev/supplychain/agentic-ai-workshop/.claude/repos/APP00344-routing-service/k8s/prod/`

---

**Analysis Complete**  
**Generated by:** Claude Code - Code Scanner Agent  
**Date:** 2026-02-25

