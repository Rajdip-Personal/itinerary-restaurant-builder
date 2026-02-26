# Technical Design: APP00344 Enterprise Routing Service (ERS)

## Document Info
- **Version:** 1.0
- **Date:** 2026-02-25
- **Status:** Draft
- **Application:** APP00344-routing-service
- **GitLab Project ID:** 2422
- **Requirements Baseline:** docs/requirements.md
- **Code Analysis Baseline:** docs/code-analysis.md

---

# Part 1: High-Level Design

## 1.1 Executive Summary

The Enterprise Routing Service (ERS) is a production-grade Java/Spring Boot application that determines optimal fulfillment locations for Nordstrom customer orders. It processes routing requests from COM (e-commerce) and Merch Search systems by executing complex business rules and optimization algorithms across 9 external service dependencies, 2 Redis clusters, and 3 Kafka producer topics.

**Current State:**
- Java 11, Spring Boot 2.7.15, Gradle 8.14.2
- Layered architecture: Controllers -> Processors -> Domain Clients
- Netflix Hystrix circuit breakers (maintenance mode)
- GitLab CI with Nordstrom Standard Pipeline Template v6
- ~58% estimated test coverage, no enforcement
- No correlation IDs, no application-layer authentication, PII masking gaps

**Target State (Post-Remediation):**
- Java 17, Spring Boot 3.3.x LTS
- Resilience4j circuit breakers with retry and rate limiting
- GitHub Actions CI/CD with CodeQL SAST and container scanning
- 80% enforced test coverage via JaCoCo
- End-to-end correlation ID propagation
- PII/PI masking for ZIP+4 codes
- Separate `/ready` endpoint for Kubernetes readiness probes
- mTLS/OAuth2 authentication with RBAC

**Scope:** This design covers the current state architecture, target state architecture after remediation, component inventory, integration patterns, security model, observability model, deployment model, and a gap analysis mapping 15 identified gaps to 50 requirements (BR, FR, TR, NFR).

---

## 1.2 System Context

The Enterprise Routing Service sits at the center of Nordstrom's order fulfillment decision-making process. It receives routing requests from upstream commerce systems and evaluates fulfillment options by querying multiple downstream services.

```
                                    ┌──────────────────────────┐
                                    │     COM (e-commerce)     │
                                    │     Merch Search         │
                                    └───────────┬──────────────┘
                                                │
                                          HTTP POST
                                     (routing requests)
                                                │
                                                ▼
┌───────────────────┐         ┌─────────────────────────────────────┐
│  Nordstrom        │         │                                     │
│  Internal LB      │────────▶│   Enterprise Routing Service (ERS)  │
│  (network auth    │         │   APP00344-routing-service           │
│   only)           │         │   Java 11 / Spring Boot 2.7.15      │
└───────────────────┘         │   Base: /enterpriseRoutingService    │
                              └──┬──────┬──────┬──────┬─────────────┘
                                 │      │      │      │
              ┌──────────────────┘      │      │      └──────────────────┐
              │                         │      │                         │
              ▼                         ▼      ▼                         ▼
    ┌─────────────────┐   ┌──────────────┐  ┌──────────────┐   ┌───────────────┐
    │  Redis Clusters  │   │   External   │  │    Kafka     │   │  DynamoDB     │
    │  (ElastiCache)   │   │   Services   │  │  (Confluent  │   │  (via SCN     │
    │  GEO + Capacity  │   │   (9 APIs)   │  │   Cloud)     │   │   library)    │
    └─────────────────┘   └──────────────┘  └──────────────┘   └───────────────┘

External Services:
  PCS ─── Product Catalog          MLP RTS ─── Release-to-Ship ML
  ETA ─── Delivery Estimation      MLP STD ─── Ship-to-Delivery ML
  SCA ─── Store Capacity           Item Service ─── Item Info
  EAVS ── Address Validation       Ship By Time ── Cutoff Times
  PAS ─── (Purpose TBD)

Kafka Topics Produced:
  inventory-routing-decision-made-avro
  ${NAP_EVENT_TOPIC}
  ${ROUTING_INSIGHTS_EVENT_TOPIC}
```

---

## 1.3 Component Architecture

### Container Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Enterprise Routing Service (ERS)                         │
│                     K8s Pod / Spring Boot 2.7.15 / Java 11                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Presentation Layer                               │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │    │
│  │  │ RoutingV2    │ │ ExtendRouting│ │ EvalLastNode │               │    │
│  │  │ Controller   │ │ Controller   │ │ Controller   │               │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘               │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │    │
│  │  │ RuleConfig   │ │ VariableConf │ │ Planout      │               │    │
│  │  │ Controller   │ │ Controller   │ │ Controller   │               │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘               │    │
│  │  ┌──────────────┐ ┌──────────────────────────┐                     │    │
│  │  │ Zipcode      │ │ RoutingController (base)  │                    │    │
│  │  │ Controller   │ │ Centralized error handling │                    │    │
│  │  └──────┬───────┘ └──────────────────────────┘                     │    │
│  └─────────┼─────────────────────────────────────────────────────────┘    │
│            │                                                               │
│  ┌─────────┼─────────────────────────────────────────────────────────┐    │
│  │         ▼           Business Logic Layer (Processors)              │    │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │    │
│  │  │ Routing          │ │ ShippingDeps     │ │ Location         │  │    │
│  │  │ Processor        │ │ Processor (607L) │ │ Evaluator        │  │    │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘  │    │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │    │
│  │  │ NAPEvent         │ │ RoutingInsights  │ │ Planout          │  │    │
│  │  │ Constructor      │ │ EventConstructor │ │ Processor        │  │    │
│  │  │ (476L)           │ │ (509L)           │ │                  │  │    │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘  │    │
│  └─────────┬─────────────────────────────────────────────────────────┘    │
│            │                                                               │
│  ┌─────────┼─────────────────────────────────────────────────────────┐    │
│  │         ▼           Integration Layer (Domain Clients)             │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │    │
│  │  │ PCS Client │ │ ETA Client │ │ MLP Client │ │ SCA Client │    │    │
│  │  │ (WebClient)│ │ (WebClient)│ │ (OAuth2)   │ │ (library)  │    │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │    │
│  │  │ Item Svc   │ │ ShipByTime │ │ EAVS       │ │ PAS Client │    │    │
│  │  │ Client     │ │ Client     │ │ Client     │ │            │    │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │                     Data / Caching Layer                           │    │
│  │  ┌────────────────────┐         ┌────────────────────┐            │    │
│  │  │ Redis GEO Cluster  │         │ Redis Capacity     │            │    │
│  │  │ Jedis 3.7.1        │         │ Cluster            │            │    │
│  │  │ Pool: 20-200       │         │ Jedis 3.7.1        │            │    │
│  │  │ PubSub for config  │         │ Pool: 20-200       │            │    │
│  │  └────────────────────┘         └────────────────────┘            │    │
│  │  ┌────────────────────┐                                           │    │
│  │  │ Kafka Producer     │                                           │    │
│  │  │ Confluent Avro     │                                           │    │
│  │  │ OAuth2 (Okta)      │                                           │    │
│  │  │ Zstandard compress │                                           │    │
│  │  └────────────────────┘                                           │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │                     Cross-Cutting Concerns                         │    │
│  │  Hystrix (circuit breaker) │ Log4J2+nordlogger │ StatsD/NewRelic  │    │
│  │  ShadowTrafficFilter       │ Bean Validation    │ Swagger/OpenAPI  │    │
│  └───────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Package Structure

```
com.nordstrom.ers/
├── Application.java                 # Spring Boot entry point (@SpringBootApplication)
├── annotations/                     # Custom validation annotations
│   └── @RoutingSkuConstraintValidator, etc.
├── config/                          # Spring configuration
│   ├── WebConfig.java (484 lines)  # HTTP client, async executor, CORS, connection pooling
│   ├── RedisConfig.java            # Dual Redis cluster config (GEO + Capacity)
│   ├── SwaggerConfig.java          # API docs (disabled in prod)
│   ├── PlanoutConfig.java          # A/B testing configuration
│   └── MlpConfig.java             # MLP OAuth2 client config
├── controllers/                     # REST endpoints (7 controllers)
│   ├── RoutingController.java      # Base controller (centralized error handling)
│   ├── RoutingV2Controller.java    # Main routing API
│   ├── ExtendRoutingController.java
│   ├── EvalLastNodeController.java
│   ├── RoutingRuleConfigController.java
│   ├── RedisVariableConfigController.java
│   ├── PlanoutController.java
│   └── RoutingZipcodeConfigController.java
├── processors/                      # Business logic
│   ├── ShippingDependenciesProcessor.java (607 lines)
│   ├── NAPEventConstructor.java (476 lines)
│   ├── RoutingInsightsEventConstructor.java (509 lines)
│   └── ... (routing algorithms, validation, scoring)
├── domain/                          # Domain models + external service clients
├── entity/                          # DTOs
│   ├── request/                    # Order, ExtendRequest, LastNodeRequest
│   ├── response/                   # Routing responses
│   ├── redis/                      # Feature flags, variables
│   └── thread/                     # Thread-local context
├── filters/                         # HTTP filters
│   └── ShadowTrafficFilter.java   # Shadow traffic mirroring
├── utils/                           # Utilities
├── exception/                       # Custom exception hierarchy
│   ├── ERSException.java          # Base exception
│   ├── RoutingRequestValidationException.java
│   ├── RoutingRequestHeaderValidationException.java
│   ├── ExternalServiceException.java
│   ├── ScenarioNotFoundException.java
│   └── RoutingUnexpectedException.java
├── metrics/                         # StatsD/DataDog instrumentation
└── constants/                       # Application constants
```

---

## 1.4 Integration Points

| # | System | Direction | Protocol | Authentication | Purpose |
|---|--------|-----------|----------|----------------|---------|
| 1 | COM / Merch Search | Inbound | HTTP REST | Network-level only | Routing requests |
| 2 | PCS | Outbound | HTTP REST | API Key (`${PCS_API_KEY}`) | Product catalog lookups |
| 3 | ETA | Outbound | HTTP REST | Network-level | Delivery time estimation |
| 4 | MLP RTS | Outbound | HTTP REST | OAuth2 (Okta) | Release-to-ship ML prediction |
| 5 | MLP STD | Outbound | HTTP REST | OAuth2 (Okta) | Ship-to-delivery ML prediction |
| 6 | Item Service | Outbound | HTTP REST | Network-level | Item information |
| 7 | Ship By Time | Outbound | HTTP REST | Network-level | Shipping cutoff times |
| 8 | SCA | Outbound | Library call | Via routing-inputs library | Store capacity data |
| 9 | EAVS | Outbound | HTTP REST | Network-level | Address validation |
| 10 | PAS | Outbound | HTTP REST | Network-level | (Purpose TBD) |
| 11 | Redis GEO | Bidirectional | Redis protocol | Password | Geo data cache + PubSub |
| 12 | Redis Capacity | Bidirectional | Redis protocol | Password | Capacity data cache |
| 13 | Kafka (Confluent) | Outbound | SASL_SSL | OAuth2 (Okta) | Event publishing (3 topics) |
| 14 | Schema Registry | Outbound | HTTPS | Basic auth | Avro schema retrieval |
| 15 | DynamoDB | Outbound | AWS SDK | IAM/STS | SCN data (via library) |

---

## 1.5 Data Flow

### Primary Routing Flow

```
  Client (COM)                     ERS                         External Services
       │                            │                                │
       │  POST /Routing/            │                                │
       │  evaluateLocations         │                                │
       │───────────────────────────▶│                                │
       │                            │                                │
       │                            │── Validate request (Bean)      │
       │                            │                                │
       │                            │── Query PCS ──────────────────▶│ Product info
       │                            │◀──────────────────────────────│
       │                            │                                │
       │                            │── Query ETA ──────────────────▶│ Delivery times
       │                            │◀──────────────────────────────│
       │                            │                                │
       │                            │── Query MLP RTS (OAuth2) ────▶│ ML prediction
       │                            │◀──────────────────────────────│
       │                            │                                │
       │                            │── Query MLP STD (OAuth2) ────▶│ ML prediction
       │                            │◀──────────────────────────────│
       │                            │                                │
       │                            │── Read Redis GEO              │ Geo distances
       │                            │── Read Redis Capacity         │ Store capacity
       │                            │                                │
       │                            │── Execute routing algorithms   │
       │                            │── Apply business rules         │
       │                            │── Score & rank locations       │
       │                            │                                │
       │                            │── Publish Kafka event ────────▶│ routing-decision
       │                            │── Publish NAP event ─────────▶│ NAP analytics
       │                            │── Publish Insights event ────▶│ routing insights
       │                            │                                │
       │  200 OK (routing response) │                                │
       │◀───────────────────────────│                                │
```

### Configuration Update Flow

```
  Admin                            ERS                         Redis
    │                               │                            │
    │  POST /RuleConfig/            │                            │
    │  updateFeatureFlag            │                            │
    │──────────────────────────────▶│                            │
    │                               │── Write to Redis ─────────▶│
    │                               │                            │
    │                               │◀── PubSub notification ───│
    │                               │── Update in-memory cache   │
    │  200 OK                       │                            │
    │◀──────────────────────────────│                            │
```

---

## 1.6 Technology Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Language | Java | 11 (target: 17) | Enterprise standard; Spring Boot ecosystem |
| Framework | Spring Boot | 2.7.15 (target: 3.3.x) | Standard Nordstrom web framework |
| Build | Gradle | 8.14.2 | Existing build system; dependency management |
| Web | Spring MVC (REST) | 2.7.15 | Synchronous REST API with async options |
| Reactive HTTP | Spring WebClient | 2.7.15 | Non-blocking outbound HTTP calls |
| Synchronous HTTP | RestTemplate | 2.7.15 | Legacy synchronous HTTP calls |
| Cache | Redis (Jedis) | 3.7.1 | Dual-cluster geo + capacity caching |
| Messaging | Apache Kafka | 3.5.2 | Event-driven routing decision publishing |
| Schema | Confluent Avro | 7.5.1 | Schema registry integration for Kafka |
| Circuit Breaker | Hystrix (target: Resilience4j) | 2.2.10 | Fault tolerance for external calls |
| Logging | Log4J2 + nordlogger | 2.17.2 | Structured JSON logging |
| Metrics | StatsD (DataDog) + New Relic | — | Application performance monitoring |
| Testing | JUnit 5 + Mockito | 5.9.3 / 4.11.0 | Unit and integration testing |
| Code Quality | Spotless (Google Java Format) | 2.20.2 | Consistent code formatting |
| Coverage | JaCoCo | default | Code coverage reporting |
| API Docs | Springfox (Swagger) | 3.0.0 | OpenAPI documentation (disabled in prod) |
| Optimization | Gurobi | custom | Linear programming for routing optimization |
| AWS | AWS SDK v1 + v2 | 1.12.167 / 2.20.56 | S3, SQS, SNS, STS, DynamoDB |
| CI/CD | GitLab CI (target: GitHub Actions) | v6 template | Build, test, deploy pipeline |
| Platform | Kubernetes (nskapp) | — | Nordstrom standard K8s |

---

## 1.7 Security Architecture

### Current State

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Current Security Model                           │
│                                                                      │
│  External Network ──[blocked]──▶ │                                   │
│                                  │  Nordstrom Internal Network       │
│  Internal Services ──[allowed]──▶│                                   │
│                                  │  ┌─────────────────────────────┐ │
│  VPC-Peered Services ─[allowed]─▶│  │  Internal Load Balancer    │ │
│                                  │  │  (no auth enforcement)      │ │
│                                  │  └─────────┬───────────────────┘ │
│                                  │            │                      │
│                                  │            ▼                      │
│                                  │  ┌─────────────────────────────┐ │
│                                  │  │  ERS (no app-layer auth)    │ │
│                                  │  │  No @PreAuthorize           │ │
│                                  │  │  No @Secured                │ │
│                                  │  │  No OAuth2 resource server  │ │
│                                  │  │  No API key validation      │ │
│                                  │  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

GAPS:
- Any service on Nordstrom internal network or peered VPCs can call any ERS endpoint
- No distinction between routing endpoints (read) and config endpoints (write/admin)
- No authorization decision logging
- No rate limiting
```

### Target State (NFR-003, FR-012)

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Target Security Model                            │
│                                                                      │
│  ┌──────────────┐     ┌────────────────┐     ┌──────────────────┐  │
│  │ Calling      │────▶│ mTLS / OAuth2  │────▶│ API Gateway /    │  │
│  │ Service      │     │ Client Creds   │     │ Istio Sidecar    │  │
│  └──────────────┘     └────────────────┘     └────────┬─────────┘  │
│                                                        │             │
│                                                        ▼             │
│                                              ┌──────────────────┐   │
│                                              │  ERS with RBAC   │   │
│                                              │                  │   │
│                                              │  Roles:          │   │
│                                              │  routing-reader  │   │
│                                              │  routing-writer  │   │
│                                              │  config-admin    │   │
│                                              └──────────────────┘   │
│                                                                      │
│  Endpoint → Role Mapping:                                            │
│  /Routing/*          → routing-reader                                │
│  /RuleConfig/get*    → routing-reader                                │
│  /RuleConfig/update* → config-admin                                  │
│  /RuleConfig/delete* → config-admin                                  │
│  /VariableConfig/*   → config-admin                                  │
│  /Planout/*          → config-admin                                  │
│  /Routing/zipCodes*  → config-admin                                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Secrets Management:**
- Current: All secrets via environment variables (compliant)
- Current: No hardcoded secrets in code (verified by code analysis)
- Target: Secrets inventory documented; Gurobi license migrated to GitHub Actions secrets
- Implements: TR-012

**Input Validation (NFR-012):**
- Current: Bean validation with custom constraint validators (partially compliant)
- Custom annotations in `annotations/` package
- Custom exceptions: `RoutingRequestValidationException`, `RoutingRequestHeaderValidationException`
- Target: Comprehensive validation on all endpoints with structured error responses

**PII/PI Handling (TR-004, NFR-002):**
- Current GAP: ZIP+4 postal codes (`ShipToZip`) logged verbatim in request bodies
  - 134 entries with 41 unique values found in 60-minute Splunk sample
  - OrderId logged (non-PII, acceptable)
  - ShopperID already hashed (acceptable)
- Target: `PiiMaskingUtil.java` masks ZIP+4 to `981**-****` format before logging

---

## 1.8 Deployment Architecture

### Current State

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GitLab CI Pipeline (Current)                      │
│                    Nordstrom Standard Pipeline Template v6           │
│                                                                     │
│  Feature Branch ──▶ Build ──▶ Test ──▶ Package ──▶ Deploy           │
│                                                                     │
│  Environment Progression:                                            │
│  ┌─────┐  ┌──────┐  ┌───────────────┐  ┌─────────┐                │
│  │ Dev │─▶│ Test │─▶│ Shadow Nonprod│─▶│ Nonprod │                 │
│  └─────┘  └──────┘  └───────────────┘  └────┬────┘                │
│                                               │                     │
│                                          ┌────▼──────────┐          │
│                                          │ Shadow Prod   │          │
│                                          └────┬──────────┘          │
│                                               │ Manual Approval     │
│                                               │ + ServiceNow CR     │
│                                          ┌────▼────┐                │
│                                          │  Prod   │                │
│                                          └─────────┘                │
└─────────────────────────────────────────────────────────────────────┘

Platform: Nordstrom Standard K8s (nskapp)
Deployment Type: Standard Kubernetes Deployment (no Helm)
Shadow Traffic: Custom ShadowTrafficFilter for traffic mirroring
```

### Target State (TR-005, NFR-011)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Pipeline (Target)                   │
│                                                                     │
│  PR ──▶ Lint ──▶ Build ──▶ Unit Test ──▶ SAST ──▶ Container Build  │
│                      │                      │              │         │
│                      │                      │              ▼         │
│               JaCoCo (80%)          CodeQL/SonarQube   Container    │
│                                     OWASP Dep Check    Scan (Trivy) │
│                                                              │      │
│                                                              ▼      │
│  Deploy:  Dev ──▶ Test ──▶ Shadow NP ──▶ Nonprod ──▶ Shadow P      │
│                                                          │          │
│                                               Manual Approval       │
│                                               + ServiceNow CR       │
│                                                          │          │
│                                                     ┌────▼────┐     │
│                                                     │  Prod   │     │
│                                                     └─────────┘     │
│                                                                     │
│  Rollback: < 5 min, auto on health check failure                    │
│  Zero-downtime: rolling update with PDB                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

# Part 2: Detailed Design

## 2.1 API Specifications (from FR-005)

### Base Path

All endpoints are prefixed with `/enterpriseRoutingService`.

### Core Routing Endpoints

#### POST `/Routing/evaluateLocations`
- **Implements:** FR-005, NFR-009, NFR-010
- **Controller:** `RoutingV2Controller.java`
- **Description:** Main routing API — evaluates fulfillment locations for an order. This is the primary endpoint called by COM and Merch Search.
- **Authentication:** None (network-level only) — **GAP: NFR-003**
- **Request:** `Order` DTO with line items, shipping address (including `ShipToZip` — PI data), fulfillment constraints
- **Response:** Ranked list of fulfillment locations with scores, ETAs, and shipping options
- **Validation:** Bean validation via custom `@RoutingSkuConstraintValidator` and related annotations
- **Circuit Breaker:** Hystrix wraps all external service calls during evaluation
- **Events Published:** `inventory-routing-decision-made-avro`, NAP event, Routing Insights event

#### POST `/Routing/extendRoute`
- **Implements:** FR-005, NFR-009
- **Controller:** `ExtendRoutingController.java`
- **Description:** Extended routing with additional parameters for complex fulfillment scenarios
- **Authentication:** None — **GAP: NFR-003**
- **Request:** `ExtendRequest` DTO
- **Response:** Extended routing evaluation response

#### POST `/Routing/evaluateLastNode`
- **Implements:** FR-005, NFR-009
- **Controller:** `EvalLastNodeController.java`
- **Description:** Last-mile delivery evaluation for final routing decisions
- **Authentication:** None — **GAP: NFR-003**
- **Request:** `LastNodeRequest` DTO
- **Response:** Last-node evaluation response

### Configuration Management Endpoints

#### Feature Flag Management (RoutingRuleConfigController)

| Method | Path | Description | Target Role |
|--------|------|-------------|-------------|
| GET | `/RuleConfig/getAllFeatureFlags` | Get all feature flags | routing-reader |
| GET | `/RuleConfig/getFlagByFeature` | Get specific feature flag | routing-reader |
| POST | `/RuleConfig/updateFeatureFlag` | Update feature flag | config-admin |
| DELETE | `/RuleConfig/deleteFeatureFlag` | Delete feature flag | config-admin |

#### Redis Variable Configuration (RedisVariableConfigController)

| Method | Path | Description | Target Role |
|--------|------|-------------|-------------|
| POST | `/VariableConfig/createUpdateRedisVariable` | Create/update variable | config-admin |
| POST | `/VariableConfig/createUpdateRedisVariables` | Bulk create/update | config-admin |
| GET | `/VariableConfig/getAllRedisVariables` | Get all from Redis | routing-reader |
| GET | `/VariableConfig/getAllRedisVariablesFromCache` | Get all from cache | routing-reader |
| GET | `/VariableConfig/getRedisVariable` | Get specific variable | routing-reader |
| DELETE | `/VariableConfig/deleteRedisVariable` | Delete variable | config-admin |

#### Zipcode Management (RoutingZipcodeConfigController)

| Method | Path | Description | Target Role |
|--------|------|-------------|-------------|
| POST | `/Routing/updateZipCodes` | Update zipcode mappings | config-admin |
| GET | `/Routing/getAllZipCodes` | Get all zipcodes | routing-reader |
| POST | `/Routing/deleteZipCodes` | Delete zipcodes | config-admin |

#### A/B Testing (PlanoutController)

| Method | Path | Description | Target Role |
|--------|------|-------------|-------------|
| POST | `/Planout/updatePlanout` | Update A/B test config | config-admin |
| GET | `/Planout/getPlanout` | Get A/B test config | routing-reader |

### Health & Monitoring Endpoints

| Method | Path | Current | Target (TR-003) |
|--------|------|---------|-----------------|
| GET | `/enterpriseRoutingService/health` | Liveness + Readiness (combined) | Liveness only |
| GET | `/ready` | Does not exist | Readiness: Redis GEO + Capacity + Kafka connectivity |

**Total: 21 REST endpoints across 7 controllers + 1 health endpoint**

---

## 2.2 Data Model (from FR-005)

### Key DTOs

#### Request Models (`entity.request`)

| Entity | Purpose | Key Fields | Validation |
|--------|---------|------------|------------|
| `Order` | Main routing request | lineItems, shipToAddress (contains ShipToZip — PI), fulfillmentConstraints | Bean validation + custom validators |
| `ExtendRequest` | Extended routing request | Additional parameters for complex scenarios | Bean validation |
| `LastNodeRequest` | Last-node evaluation request | Last-mile delivery parameters | Bean validation |

#### Response Models (`entity.response`)

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| Routing Response | Ranked fulfillment locations | locations (scored + ranked), ETAs, shipping methods |
| `ExtendResponse` | Extended routing result | Extended evaluation data |
| Location Models | Per-location details | locationId, score, ETA, shippingMethod, capacity |

#### Redis Models (`entity.redis`)

| Entity | Redis Cluster | Purpose |
|--------|--------------|---------|
| Feature Flag | GEO | Runtime feature toggles |
| Variable Config | GEO | Dynamic configuration values (LOH_MILES, etc.) |
| Zipcode Mapping | GEO | Zipcode to location mappings |
| Geo Distance | GEO | Geographic distance calculations (cached) |
| Capacity Data | Capacity | Store capacity information |
| Planout Config | GEO | A/B test configurations (PubSub updates) |

### Redis Data Structures

**GEO Cluster (ElastiCache):**
```
Nonprod: routing-geo-ci-nonprod.d9ees5.ng.0001.usw2.cache.amazonaws.com
Prod:    routing-geo-ci-prod.xsb56n.ng.0001.usw2.cache.amazonaws.com
Pool:    min=20, max=200 connections

Keys:
  feature_flags:{featureName}     → JSON (feature flag config)
  redis_variables:{variableName}  → String (runtime config)
  zipcode_mapping:{zip}           → String (location mapping)
  geo_distance:{origin}:{dest}    → String (cached distance)
  planout_config:{experiment}     → JSON (A/B test config)

PubSub Channels:
  planout_updates                 → Notifies pods of config changes
```

**Capacity Cluster (ElastiCache):**
```
Configured via: ${REDIS_HOST_CAPACITY}:${REDIS_PORT_CAPACITY}
Pool: min=20, max=200 connections

Keys:
  capacity:{storeId}              → JSON (store capacity data)
```

### Kafka Event Schemas

| Topic | Schema Format | Producer | Key Fields |
|-------|--------------|----------|------------|
| `inventory-routing-decision-made-avro` | Avro (Confluent SR) | Spring Kafka default topic | routingDecision, orderId, locations, scores |
| `${NAP_EVENT_TOPIC}` | Avro | `NAPEventConstructor` (476 lines) | networkAnalysis, locationEvaluations, businessMetrics |
| `${ROUTING_INSIGHTS_EVENT_TOPIC}` | Avro | `RoutingInsightsEventConstructor` (509 lines) | routingInsights, performanceMetrics, algorithmMetadata |

**Kafka Producer Configuration:**
```
Bootstrap (Nonprod): lkc-z30oqd.dom8pmr03gy.us-west-2.aws.confluent.cloud:9092
Bootstrap (Prod):    lkc-r2dyv9.dom6pk11zgn.us-west-2.aws.confluent.cloud:9092
Security:            SASL_SSL + OAUTHBEARER (Okta)
Compression:         Zstandard (zstd)
Acks:                1
Retries:             1
Schema Registry (NP): https://schema-registry-nonprod-us-west-2.nordstromaws.app
Schema Registry (P):  https://schema-registry-prod-us-west-2.nordstromaws.app
Auto-register:       false (schemas must exist in registry)
```

---

## 2.3 Component Specifications

### Component: RoutingV2Controller
- **Implements:** FR-005 (current state documentation)
- **Responsibility:** Receives routing requests, delegates to processors, returns responses
- **Package:** `com.nordstrom.ers.controllers`
- **Dependencies:** Routing processor chain, validation framework
- **Interfaces:** REST endpoint (`POST /Routing/evaluateLocations`)
- **Base Class:** `RoutingController` (centralized error handling)

### Component: ShippingDependenciesProcessor
- **Implements:** FR-005 (current state), TR-008 (refactoring target)
- **Responsibility:** Calculates shipping costs, time estimates, and method selection
- **Package:** `com.nordstrom.ers.processors`
- **Size:** 607 lines — **violates SRP, marked for refactoring**
- **Dependencies:** PCS Client, ETA Client, Ship By Time Client, Redis GEO
- **Target Refactoring (TR-008):**
  - `ShippingCostCalculator` — cost calculation logic
  - `ShippingTimeEstimator` — time estimation logic
  - `ShippingMethodSelector` — method selection logic
  - `ShippingDependenciesOrchestrator` — coordination

### Component: NAPEventConstructor
- **Implements:** FR-002, FR-013 (Kafka event documentation)
- **Responsibility:** Constructs and publishes NAP (Network Analysis Platform) events to Kafka
- **Package:** `com.nordstrom.ers.processors`
- **Size:** 476 lines — **refactoring target (TR-008)**
- **Dependencies:** Kafka producer, Avro schema registry

### Component: RoutingInsightsEventConstructor
- **Implements:** FR-002, FR-013 (Kafka event documentation)
- **Responsibility:** Constructs and publishes routing insights/analytics events to Kafka
- **Package:** `com.nordstrom.ers.processors`
- **Size:** 509 lines — **refactoring target (TR-008)**
- **Dependencies:** Kafka producer, Avro schema registry

### Component: ShadowTrafficFilter
- **Implements:** NFR-011 (deployment strategy)
- **Responsibility:** Mirrors production traffic to shadow environments for testing
- **Package:** `com.nordstrom.ers.filters`
- **Dependencies:** HTTP filter chain
- **Note:** Supports shadow nonprod and shadow prod environment stages

### Component: WebConfig
- **Implements:** FR-005 (integration patterns)
- **Responsibility:** HTTP client configuration, async executor, CORS, connection pooling
- **Package:** `com.nordstrom.ers.config`
- **Size:** 484 lines — configures both WebClient (reactive) and RestTemplate (synchronous)

---

## 2.4 Sequence Diagrams

### Primary: Evaluate Locations (Happy Path)

```
Client          RoutingV2        Routing          External         Redis        Kafka
  │             Controller       Processor        Services         Clusters     Producer
  │                │                │                │                │            │
  │  POST          │                │                │                │            │
  │  /evaluate     │                │                │                │            │
  │  Locations     │                │                │                │            │
  │───────────────▶│                │                │                │            │
  │                │                │                │                │            │
  │                │  validate()    │                │                │            │
  │                │───────────────▶│                │                │            │
  │                │                │                │                │            │
  │                │                │  queryPCS()    │                │            │
  │                │                │───────────────▶│                │            │
  │                │                │◀───────────────│                │            │
  │                │                │                │                │            │
  │                │                │  queryETA()    │                │            │
  │                │                │───────────────▶│                │            │
  │                │                │◀───────────────│                │            │
  │                │                │                │                │            │
  │                │                │  queryMLP()    │                │            │
  │                │                │───(OAuth2)────▶│                │            │
  │                │                │◀───────────────│                │            │
  │                │                │                │                │            │
  │                │                │  getGeoData()  │                │            │
  │                │                │────────────────────────────────▶│            │
  │                │                │◀───────────────────────────────│            │
  │                │                │                │                │            │
  │                │                │  getCapacity() │                │            │
  │                │                │────────────────────────────────▶│            │
  │                │                │◀───────────────────────────────│            │
  │                │                │                │                │            │
  │                │                │  [execute routing algorithms]   │            │
  │                │                │  [score & rank locations]       │            │
  │                │                │                │                │            │
  │                │                │  publishDecision()              │            │
  │                │                │───────────────────────────────────────────▶│
  │                │                │  publishNAP()                   │            │
  │                │                │───────────────────────────────────────────▶│
  │                │                │  publishInsights()              │            │
  │                │                │───────────────────────────────────────────▶│
  │                │                │                │                │            │
  │                │  response      │                │                │            │
  │                │◀───────────────│                │                │            │
  │  200 OK        │                │                │                │            │
  │◀───────────────│                │                │                │            │
```

### Error Path: External Service Failure with Circuit Breaker

```
Client          RoutingV2        Routing          PCS              Hystrix
  │             Controller       Processor        Service          CircuitBreaker
  │                │                │                │                │
  │  POST          │                │                │                │
  │───────────────▶│                │                │                │
  │                │───────────────▶│                │                │
  │                │                │  queryPCS()    │                │
  │                │                │───────────────▶│                │
  │                │                │                │  TIMEOUT       │
  │                │                │                │◀──(500ms)──────│
  │                │                │                │                │
  │                │                │◀──ExternalServiceException──────│
  │                │                │                │                │
  │                │                │  [fallback: use cached data     │
  │                │                │   or degrade gracefully]        │
  │                │                │                │                │
  │                │                │  [circuit OPEN after threshold] │
  │                │                │  [subsequent calls fail fast]   │
  │                │                │                │                │
  │                │◀───────────────│                │                │
  │  200 OK (degraded) or 500      │                │                │
  │◀───────────────│                │                │                │
```

---

## 2.5 Error Handling Strategy

### Current Exception Hierarchy (FR-005)

```
ERSException (base)
├── RoutingRequestValidationException      → 400 Bad Request
├── RoutingRequestHeaderValidationException → 400 Bad Request
├── ExternalServiceException               → 500 / 503 (depends on circuit breaker)
├── ScenarioNotFoundException              → 404 Not Found
└── RoutingUnexpectedException             → 500 Internal Server Error
```

**Centralized handling** via `RoutingController` base class — all controllers extend this class for consistent error response formatting.

### Target Error Handling (NFR-009, NFR-011)

| Error Category | Current Handling | Target Handling |
|----------------|-----------------|-----------------|
| Validation errors | Bean validation → 400 | Structured error response: `{field, message, constraint}` |
| External service timeout | Hystrix fallback | Resilience4j retry with exponential backoff, then circuit break |
| External service 5xx | Hystrix circuit breaker | Resilience4j circuit breaker with metrics in DataDog |
| Redis connection failure | Uncaught exception → 500 | Graceful degradation + readiness probe fails |
| Kafka publish failure | Unknown | Async retry with DLQ; non-blocking to routing response |
| Unknown errors | `RoutingUnexpectedException` → 500 | Sanitized error response (no stack traces to client) |

### Retry Policies (Target — TR-007)

| Service | Max Retries | Backoff | Circuit Breaker Threshold |
|---------|-------------|---------|--------------------------|
| PCS | 2 | 100ms exponential | 50% failure rate / 10 calls |
| ETA | 2 | 100ms exponential | 50% failure rate / 10 calls |
| MLP RTS | 1 | 200ms | 50% failure rate / 5 calls |
| MLP STD | 1 | 200ms | 50% failure rate / 5 calls |
| Item Service | 2 | 100ms exponential | 50% failure rate / 10 calls |
| Ship By Time | 2 | 100ms exponential | 50% failure rate / 10 calls |
| Redis GEO | 1 | 50ms | 80% failure rate / 5 calls |
| Redis Capacity | 1 | 50ms | 80% failure rate / 5 calls |

---

## 2.6 Observability Design

### Logging (NFR-001, TR-001)

**Current State:**
- Framework: Log4J2 2.17.2 + nordlogger 1.0.1.250
- Format: Structured JSON
- Current fields: `env`, `envclass`, `logtype`, `hostname`, `servicename`, `uuid`, `date`, `loglevel`, `class`, `thread`, `schemacheck`
- **MISSING:** `correlationId`, `traceId`, `spanId`

**Target State (TR-001):**
- Add `correlationId` to every log line via Log4J2 MDC
- New component: `CorrelationIdFilter.java` — servlet filter that extracts `X-Correlation-ID` from request header or generates UUID
- New component: `CorrelationIdHolder.java` — ThreadLocal storage for correlation ID throughout request lifecycle
- Kafka producer config injects correlation ID into message headers
- All log lines include: `timestamp`, `level`, `message`, `service`, `correlationId`, `environment`, `version`

**Target Log Format:**
```json
{
  "timestamp": "2026-02-25T14:30:00.000Z",
  "loglevel": "INFO",
  "message": "Routing evaluation completed",
  "servicename": "enterprise-routing-service",
  "correlationId": "abc-123-def-456",
  "env": "prod",
  "envclass": "production",
  "class": "RoutingV2Controller",
  "thread": "http-nio-8080-exec-1",
  "hostname": "ers-pod-abc123",
  "version": "2.15.0",
  "schemacheck": "VALID"
}
```

### Metrics (NFR-005, NFR-007)

**Current State:**
- StatsD (DataDog) + New Relic APM
- Custom `CircuitBreakerHystrixEventNotifier` for circuit breaker metrics
- Micrometer integration via Spring Boot Actuator

**Target Metrics:**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `ers.routing.request.count` | Counter | endpoint, status, method | Request volume |
| `ers.routing.request.duration` | Histogram | endpoint, status | Latency (p50/p95/p99) |
| `ers.routing.error.count` | Counter | endpoint, error_type | Error tracking |
| `ers.external.call.duration` | Histogram | service, status | External service latency |
| `ers.external.call.error` | Counter | service, error_type | External service errors |
| `ers.circuit_breaker.state` | Gauge | service | Circuit breaker status |
| `ers.redis.connection.active` | Gauge | cluster (geo/capacity) | Redis pool utilization |
| `ers.redis.command.duration` | Histogram | cluster, command | Redis operation latency |
| `ers.kafka.publish.count` | Counter | topic, status | Kafka publish volume |
| `ers.kafka.publish.duration` | Histogram | topic | Kafka publish latency |
| `ers.kafka.publish.error` | Counter | topic, error_type | Kafka publish failures |

### SLIs and SLOs (NFR-005, FR-010)

| SLI | Metric | SLO Target |
|-----|--------|------------|
| Availability | `1 - (5xx_count / total_count)` | >= 99.9% (43 min downtime/month) |
| Latency (p95) | `ers.routing.request.duration` (p95) | < 500ms for routing endpoints |
| Latency (p99) | `ers.routing.request.duration` (p99) | < 1000ms for routing endpoints |
| Error Rate | `5xx_count / total_count` | < 1% |
| Throughput | `ers.routing.request.count` per second | Tracked (no threshold) |

### Alerting (NFR-006)

| Alert | Condition | Severity | Channel | Runbook |
|-------|-----------|----------|---------|---------|
| High Error Rate | 5xx > 5% over 5 min | P1 | PagerDuty | `runbook#high-error-rate` |
| High Latency | p95 > 1000ms over 5 min | P1 | PagerDuty | `runbook#high-latency` |
| Circuit Breaker Open | Any CB in OPEN state | P2 | Slack #supply-chain-routing | `runbook#circuit-breaker` |
| Redis Connection Failure | Pool exhausted or timeout | P1 | PagerDuty | `runbook#redis-failure` |
| Kafka Publish Failure | Publish error rate > 1% | P2 | Slack #supply-chain-routing | `runbook#kafka-failure` |
| Pod Crash Loop | RestartCount > 3 in 10 min | P1 | PagerDuty | `runbook#pod-crash` |
| Low Availability | SLO burn rate > threshold | P1 | PagerDuty | `runbook#availability` |

### Health Endpoints (NFR-004, TR-003)

**Current:**
- `/enterpriseRoutingService/health` — combined liveness + readiness (used for both K8s probes)

**Target:**
- `/enterpriseRoutingService/health` — liveness only (process alive, no dependency checks)
- `/ready` — readiness: checks Redis GEO + Redis Capacity + Kafka producer connectivity
  - 200 when all healthy
  - 503 with JSON body indicating which dependency is down

### Distributed Tracing (NFR-014)

**Current:** Not implemented. No OpenTelemetry, no trace/span IDs.

**Target (Future):**
- OpenTelemetry SDK integration with Spring Boot
- `traceId` and `spanId` in all log lines
- Trace context propagation to external service calls
- Visible in DataDog APM or New Relic
- Correlation ID linked to trace for cross-reference

---

## 2.7 Configuration Management

### Environment Variables

| Variable | Purpose | Default | Required | Sensitivity |
|----------|---------|---------|----------|-------------|
| `GEO_REDIS_HOST` | Redis GEO cluster hostname | — | Yes | Low |
| `GEO_REDIS_PORT` | Redis GEO cluster port | 6379 | Yes | Low |
| `REDIS_HOST_CAPACITY` | Redis Capacity cluster hostname | — | Yes | Low |
| `REDIS_PORT_CAPACITY` | Redis Capacity cluster port | 6379 | Yes | Low |
| `PCS_URL` | Product Catalog Service URL | — | Yes | Low |
| `PCS_API_KEY` | PCS API authentication key | — | Yes | **Secret** |
| `ETA_URL` | ETA Service URL | — | Yes | Low |
| `EAVS_URL` | Address Validation Service URL | — | Yes | Low |
| `MLP_RTS_URL` | MLP Release-to-Ship URL | — | Yes | Low |
| `MLP_STD_URL` | MLP Ship-to-Delivery URL | — | Yes | Low |
| `MLP_TOKEN_URL` | MLP OAuth2 token endpoint | — | Yes | Low |
| `MLP_CLIENT_ID` | MLP OAuth2 client ID | — | Yes | **Secret** |
| `MLP_CLIENT_SECRET` | MLP OAuth2 client secret | — | Yes | **Secret** |
| `ITEM_SERVICE_URL` | Item Service URL | — | Yes | Low |
| `SHIP_BY_TIME_URL` | Ship By Time Service URL | — | Yes | Low |
| `PAS_URL` | PAS Service URL | — | Yes | Low |
| `NAP_EVENT_TOPIC` | Kafka NAP event topic name | — | Yes | Low |
| `ROUTING_INSIGHTS_EVENT_TOPIC` | Kafka Insights event topic | — | Yes | Low |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka bootstrap servers | — | Yes | Low |
| `KAFKA_OAUTH_TOKEN_URL` | Kafka OAuth2 token endpoint | — | Yes | Low |
| `KAFKA_CLIENT_ID` | Kafka OAuth2 client ID | — | Yes | **Secret** |
| `KAFKA_CLIENT_SECRET` | Kafka OAuth2 client secret | — | Yes | **Secret** |
| `GUROBI_LICENSE` | Gurobi optimization license | — | Yes | **Secret** |

**Spring Profiles:**
- `dev` — Development environment
- `routing-service-perf` — Performance testing
- `sc-routing-prod` — Production

---

# Part 3: Requirements Traceability

## Full Traceability Matrix

| Requirement | Type | Priority | Design Section | How Addressed |
|-------------|------|----------|----------------|---------------|
| BR-001 | Business | P0 | Part 4 (Gap Analysis) | 15 gaps documented against Nordstrom standards |
| BR-002 | Business | P0 | Part 3 (this matrix) | Every gap traces to design sections and requirements |
| BR-003 | Business | P0 | 1.3, 2.3 (Package Structure) | Architecture documented for onboarding guide |
| BR-004 | Business | P1 | 2.6 (Alerting, Runbooks) | Alert definitions with runbook links |
| BR-005 | Business | P1 | 1.8 (Deployment) | CI/CD pipeline template documented |
| BR-006 | Business | P2 | Full document | Single source of truth for ERS landscape |
| FR-001 | Functional | P0 | N/A | Complete — output: docs/code-analysis.md |
| FR-002 | Functional | P0 | 2.2 (Kafka Events) | 3 topics, schemas, producers documented |
| FR-003 | Functional | P1 | 1.4 (Integration Points) | External documentation inventory deferred to stories |
| FR-004 | Functional | P0 | Part 4 (Gap Analysis) | 15 gaps with compliance status |
| FR-005 | Functional | P0 | 2.1 (API), 2.2 (Data), 2.3 (Components) | All 21 endpoints, data model, components documented |
| FR-006 | Functional | P0 | 1.2-1.8 (Current vs Target) | Each section shows current + target state |
| FR-007 | Functional | P1 | Part 4 (Gap Analysis) | Gaps feed story generation |
| FR-008 | Functional | P1 | 2.6 (Observability) | Splunk query patterns documented |
| FR-009 | Functional | P1 | 2.6 (Alerting) | Runbook structure defined |
| FR-010 | Functional | P1 | 2.6 (SLIs/SLOs) | SLIs defined, SLOs set |
| FR-011 | Functional | P1 | 1.3, 2.3 (Architecture) | Architecture walkthrough for onboarding |
| FR-012 | Functional | P2 | 1.7 (Security) | Current vs target auth architecture |
| FR-013 | Functional | P2 | 2.2 (Kafka Events) | Topic schemas and producers documented |
| FR-014 | Functional | P2 | 1.8 (Deployment) | GitHub Actions pipeline design |
| TR-001 | Technical | P0 | 2.6 (Logging) | CorrelationIdFilter + MDC design |
| TR-002 | Technical | P0 | 2.5 (Testing reference) | JaCoCo 80% threshold in build.gradle |
| TR-003 | Technical | P1 | 2.6 (Health Endpoints) | `/ready` endpoint with Redis + Kafka checks |
| TR-004 | Technical | P0 | 1.7 (PII Handling) | PiiMaskingUtil masking ZIP+4 to `981**-****` |
| TR-005 | Technical | P0 | 1.8 (Deployment) | GitHub Actions pipeline with SAST, container scan |
| TR-006 | Technical | P2 | 1.6 (Technology Stack) | Java 17 + Spring Boot 3.3.x target |
| TR-007 | Technical | P2 | 2.5 (Retry Policies) | Resilience4j circuit breaker + retry design |
| TR-008 | Technical | P2 | 2.3 (Component Specs) | Refactoring plan for 3 large classes |
| TR-009 | Technical | P1 | Part 4 (Gap #12) | 17 TODO/FIXME audit and remediation |
| TR-010 | Technical | P1 | 1.8 (Deployment) | K8s resource limits, HPA, PDB design |
| TR-011 | Technical | P1 | 1.8 (Deployment) | Container security: approved base, non-root, scanning |
| TR-012 | Technical | P0 | 1.7 (Secrets) | Secrets inventory, rotation support |
| NFR-001 | Non-Functional | P0 | 2.6 (Logging) | Structured JSON + correlationId in all logs |
| NFR-002 | Non-Functional | P0 | 1.7 (PII Handling) | PII masking design |
| NFR-003 | Non-Functional | P0 | 1.7 (Security) | mTLS/OAuth2 + RBAC target architecture |
| NFR-004 | Non-Functional | P1 | 2.6 (Health Endpoints) | Separate /health and /ready |
| NFR-005 | Non-Functional | P1 | 2.6 (SLIs/SLOs) | SLI/SLO definitions and dashboard |
| NFR-006 | Non-Functional | P1 | 2.6 (Alerting) | Every alert → runbook mapping |
| NFR-007 | Non-Functional | P1 | 2.6 (Metrics) | RED + resource + dependency dashboard |
| NFR-008 | Non-Functional | P0 | 1.8 (Deployment) | Branch protection + PR template |
| NFR-009 | Non-Functional | P0 | 2.1 (API Specs) | Integration tests for all 21 endpoints |
| NFR-010 | Non-Functional | P1 | 2.1 (API Specs) | Performance test for evaluateLocations |
| NFR-011 | Non-Functional | P0 | 1.8 (Deployment) | Zero-downtime with rollback < 5 min |
| NFR-012 | Non-Functional | P0 | 1.7 (Input Validation) | Bean validation + structured error responses |
| NFR-013 | Non-Functional | P0 | 1.8 (Deployment) | Spotless in GitHub Actions CI |
| NFR-014 | Non-Functional | P1 | 2.6 (Distributed Tracing) | OpenTelemetry target design |
| NFR-015 | Non-Functional | P1 | N/A | Tooling requirement (code scan < 10 min) |
| NFR-016 | Non-Functional | P1 | N/A | Tooling requirement (scalability) |
| NFR-017 | Non-Functional | P1 | N/A | Tooling requirement (audit trail) |
| NFR-018 | Non-Functional | P0 | 2.7 (Configuration) | Env var names only, no values in docs |

---

# Part 4: Gap Analysis Summary

## Compliance Gap Inventory

| # | Gap | Priority | Current State | Target State | Requirements | Phase |
|---|-----|----------|---------------|--------------|-------------|-------|
| 1 | **No correlation ID propagation** | P0 | 1 occurrence in codebase | End-to-end: HTTP → log → Kafka header | TR-001, NFR-001 | Phase 1 |
| 2 | **No application-layer authentication** | P0 | Network-level only (internal LB) | mTLS/OAuth2 + RBAC on all 21 endpoints | NFR-003, FR-012 | Phase 3B |
| 3 | **PII/PI not masked in logs** | P0 | ZIP+4 logged verbatim (134 entries/hr) | ZIP+4 masked to `981**-****` | TR-004, NFR-002 | Phase 1 |
| 4 | **Test coverage not enforced** | P0 | ~58%, no threshold | 80% JaCoCo threshold, CI fails on violation | TR-002, NFR-009 | Phase 1 |
| 5 | **No separate readiness endpoint** | P1 | `/health` used for both probes | `/ready` checks Redis + Kafka connectivity | TR-003, NFR-004 | Phase 1 |
| 6 | **GitLab CI (migrating to GitHub Actions)** | P0 | GitLab CI v6 template | GitHub Actions with SAST, container scan, coverage | TR-005, NFR-013 | Phase 2 |
| 7 | **Spring Boot 2.7.15 (EOL)** | P2 | Java 11, Spring Boot 2.7.15 | Java 17, Spring Boot 3.3.x LTS | TR-006 | Phase 3A |
| 8 | **Hystrix in maintenance mode** | P2 | Hystrix 2.2.10 | Resilience4j with retry + rate limiting | TR-007 | Phase 3A |
| 9 | **Large processor classes** | P2 | 3 classes > 400 lines (max 607) | All classes < 400 lines, SRP | TR-008 | Phase 3B |
| 10 | **No SLI/SLO definitions** | P1 | Metrics exist, no formal SLOs | SLOs defined, dashboard, burn-rate alerting | NFR-005, FR-010 | Phase 2 |
| 11 | **No runbooks** | P1 | No documented runbooks | Runbooks for all alert scenarios | NFR-006, FR-009 | Phase 2 |
| 12 | **17 TODO/FIXME in production** | P1 | 17 unresolved TODOs | Zero TODOs, all ticketed or resolved | TR-009 | Phase 2 |
| 13 | **No distributed tracing** | P1 | No OpenTelemetry or trace IDs | OpenTelemetry with DataDog APM | NFR-014 | Phase 3A |
| 14 | **K8s resource config not audited** | P1 | Config not verified | Resource limits, HPA, PDB documented | TR-010 | Phase 2 |
| 15 | **Container security not verified** | P1 | Base image not audited | Approved base, non-root, image scanning | TR-011 | Phase 2 |

## Remediation Phases

**Phase 1 — Immediate (This Sprint):** Gaps 1-5
- Correlation IDs, PII masking, coverage enforcement, readiness endpoint

**Phase 2 — Near-Term (Next 2-4 Sprints):** Gaps 6, 10-12, 14-15
- GitHub Actions migration, SLI/SLOs, runbooks, K8s audit, container security

**Phase 3A — Backlog (Framework Upgrade):** Gaps 7-8, 13
- Spring Boot 3.3.x + Java 17, Hystrix → Resilience4j, distributed tracing

**Phase 3B — Backlog (Hardening):** Gaps 2, 9
- Application-layer authentication (mTLS/OAuth2), large class refactoring

---

# Part 5: Architectural Decisions

## Existing Decisions (from Code Analysis)

| ID | Decision | Rationale | Status |
|----|----------|-----------|--------|
| ADR-001 | No traditional database — use Redis for state, external services for data | Stateless design; all business data owned by upstream systems | Active |
| ADR-002 | Kafka for event publishing (routing decisions, NAP, insights) | Enable downstream analytics, audit trail, event-driven architecture | Active |
| ADR-003 | Dual Redis clusters (GEO + Capacity) | Isolation, different TTL requirements, performance optimization | Active |
| ADR-004 | MLP integration for RTS and STD predictions | ML-based optimization for release-to-ship and ship-to-delivery times | Active |

## New Decisions (from Requirements)

| ID | Decision | Rationale | Requirement |
|----|----------|-----------|-------------|
| ADR-005 | Migrate CI/CD from GitLab to GitHub Actions | Nordstrom standard; enables CodeQL SAST and native container scanning | TR-005, NFR-013 |
| ADR-006 | Phase 3 split: 3A (framework upgrade) and 3B (hardening) | Spring Boot + Resilience4j should be bundled; auth and refactoring are independent | TR-006, TR-007, TR-008, NFR-003 |
| ADR-007 | Use JaCoCo for coverage with 80% threshold | Nordstrom standard; existing JaCoCo integration, add enforcement | TR-002 |
| ADR-008 | Implement PII masking utility (not Log4J2 layout) | Mask at application level before logging to cover all log paths | TR-004, NFR-002 |
| ADR-009 | Separate /ready from /health | Kubernetes best practice; readiness checks dependencies, liveness does not | TR-003, NFR-004 |
| ADR-010 | Resilience4j over other alternatives (Sentinel, custom) | Spring Boot 3.x native support; Micrometer integration; active development | TR-007 |
| ADR-011 | RBAC roles: routing-reader, routing-writer, config-admin | Minimal viable role set; separates read-only from write/admin operations | NFR-003 |

## Open Questions

| ID | Question | Impact | Owner |
|----|----------|--------|-------|
| OQ-001 | What is the PAS service? Purpose undocumented. | Design completeness for integration documentation | Squad Lead |
| OQ-002 | What are the actual Kafka consumer(s) of the 3 produced topics? | Data flow completeness | Squad Lead |
| OQ-003 | What is the target request rate for performance testing? | NFR-010 performance test configuration | Squad Lead |
| OQ-004 | Are there existing DataDog dashboards for ERS? | Avoids rebuilding existing monitoring | SRE |
| OQ-005 | What Kubernetes resource limits are currently configured? | TR-010 gap severity assessment | DevOps |
| OQ-006 | What is the current container base image? | TR-011 compliance assessment | DevOps |
| OQ-007 | Is the Gurobi license per-pod or shared? Impacts HPA scaling. | K8s HPA configuration | Squad Lead |
