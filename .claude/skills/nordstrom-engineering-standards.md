---
name: nordstrom-engineering-standards
description: |
  Comprehensive guide to Nordstrom engineering standards for security, deployment, logging, monitoring, and code quality.
  Reference this skill when generating requirements, stories, or designs to ensure compliance.
---

# Nordstrom Engineering Standards

This document defines the engineering standards that all Nordstrom Supply Chain applications must comply with. These standards are mandatory and must be reflected in non-functional requirements, user stories, and technical designs.

---

## 1. Security

### Authentication & Authorization
- All user-facing applications must authenticate via the standard Nordstrom identity platform.
- Service-to-service communication uses mutual TLS or OAuth2 client credentials.
- Role-Based Access Control (RBAC) must be implemented at the API layer.
- Roles are defined per application and enforced on every API endpoint.
- Authorization decisions must be logged (who accessed what, when).
- Session management must follow OWASP guidelines (secure cookies, expiration, rotation).

### PII Protection
- Personally Identifiable Information (PII) includes: name, email, phone, address, SSN, employee ID, badge number, IP address.
- PII must be masked in all log output — no exceptions.
- PII must be encrypted at rest in databases (column-level or transparent data encryption).
- PII must be encrypted in transit (TLS 1.2+ for all connections).
- Non-production environments must use anonymized or synthetic PII data.
- PII access must be auditable — log who accessed PII records and when.

### Secrets Management
- Secrets (API keys, database passwords, certificates) must NEVER be stored in:
  - Source code
  - Configuration files checked into version control
  - Environment variable definitions in CI/CD config files
- Secrets must be injected at runtime via:
  - HashiCorp Vault (preferred for production)
  - Kubernetes Secrets (acceptable for non-sensitive config)
- Secret rotation must be supported without application restart.
- CI/CD pipelines access secrets via GitHub Actions secrets or Vault integration.

### Input Validation
- All external input must be validated at the API boundary.
- Use allowlists, not denylists, for input validation.
- Validate data types, ranges, lengths, and formats.
- Sanitize all input used in database queries (parameterized queries only — no string concatenation).
- Sanitize all input rendered in HTML (prevent XSS).
- File uploads must validate file type, size, and content (not just extension).

### RBAC Implementation
- Define roles at the application level (e.g., Employee, Manager, Director, Admin).
- Map roles to permissions (e.g., `read:submissions`, `approve:submissions`, `view:dashboard`).
- Enforce permissions at the API middleware layer — before business logic executes.
- Role assignments come from the identity platform or org hierarchy service.
- Support for hierarchical roles (Manager sees their reports' data, Director sees all managers' data).

---

## 2. Deployment

### Standard Kubernetes
- All applications deploy to the standard Nordstrom Kubernetes platform.
- Each application gets its own namespace.
- Resource requests and limits must be defined for CPU and memory.
- Horizontal Pod Autoscaler (HPA) configured for production workloads.
- Pod Disruption Budgets (PDB) configured to maintain availability during updates.
- Liveness and readiness probes configured on all pods.

### CI/CD via GitHub Actions
- All repositories use GitHub Actions for CI/CD.
- Standard pipeline stages:
  1. **Lint** — Code style and formatting checks
  2. **Build** — Compile/bundle the application
  3. **Unit Test** — Run unit tests with coverage reporting
  4. **Security Scan** — Static analysis (SAST) and dependency vulnerability scanning
  5. **Container Build** — Build Docker image
  6. **Container Scan** — Scan image for vulnerabilities
  7. **Integration Test** — Run integration tests against test environment
  8. **Deploy to Staging** — Automated deployment to staging
  9. **Deploy to Production** — Manual approval gate, then deploy

### Container Security
- Base images must be from approved registry.
- Containers must not run as root.
- Containers must have a read-only root filesystem where possible.
- Image scanning must run in CI — builds fail on critical/high vulnerabilities.
- Images are signed and verified before deployment.

### Deployment Strategy
- **Blue-Green Deployment** (preferred) — Two identical environments, traffic switches atomically.
- **Canary Deployment** (alternative) — Gradual traffic shift (5% → 25% → 50% → 100%) with automatic rollback on error rate increase.
- Zero-downtime deployments are mandatory for all production services.
- Rollback must be possible within 5 minutes.

---

## 3. Logging

### Structured JSON Logging
- All log output must be structured JSON — no free-text log lines.
- Standard log fields:
  ```json
  {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "level": "INFO",
    "message": "Request processed",
    "service": "rto-compliance-api",
    "correlationId": "abc-123-def-456",
    "traceId": "trace-789",
    "spanId": "span-012",
    "environment": "production",
    "version": "1.2.3"
  }
  ```

### Correlation IDs
- Every incoming request must receive or propagate a correlation ID.
- The correlation ID must be passed to all downstream service calls.
- The correlation ID must appear in every log line for that request.
- Use the `X-Correlation-ID` header for HTTP propagation.
- Use Kafka message headers for event propagation.

### PII in Logs
- **Never log PII.** This includes:
  - Names, emails, phone numbers, addresses
  - SSNs, employee IDs, badge numbers
  - IP addresses (log hashed if needed for debugging)
  - Request/response bodies that may contain PII
- Use a logging middleware that automatically masks known PII patterns.
- Log record IDs (UUIDs) instead of PII for traceability.

### Log Levels
| Level | Use For |
|-------|---------|
| DEBUG | Detailed diagnostic info — disabled in production |
| INFO | Normal operations — request received, processed, completed |
| WARN | Unexpected but recoverable — retry succeeded, fallback used |
| ERROR | Failure requiring attention — request failed, integration down |

---

## 4. Monitoring

### Health Endpoints
- **`GET /health`** — Returns `200 OK` with `{"status": "healthy"}` if the application is running.
  - Used by Kubernetes liveness probe.
  - Must not check downstream dependencies (only "is this process alive?").
- **`GET /ready`** — Returns `200 OK` with `{"status": "ready"}` if the application can serve traffic.
  - Used by Kubernetes readiness probe.
  - Must verify database connectivity, cache availability, and critical integrations.
  - Returns `503 Service Unavailable` if not ready.

### SLIs (Service Level Indicators)
Define and measure these SLIs for every service:
| SLI | Measurement |
|-----|-------------|
| **Availability** | % of successful responses (non-5xx) |
| **Latency** | p50, p95, p99 response time |
| **Error Rate** | % of requests returning 5xx |
| **Throughput** | Requests per second |

### SLOs (Service Level Objectives)
Set targets for each SLI:
| SLO | Target |
|-----|--------|
| Availability | ≥ 99.9% (3 nines) |
| Latency (p95) | ≤ 500ms for API endpoints |
| Latency (p99) | ≤ 2000ms for API endpoints |
| Error Rate | ≤ 0.1% |

### Alerting
- Alerts must fire when SLOs are at risk of being breached (burn rate alerting).
- Every alert must link to a runbook with:
  - What the alert means
  - Impact assessment
  - Investigation steps
  - Remediation actions
  - Escalation path
- Alert channels: PagerDuty for P1, Slack for P2/P3.

### Dashboards
Every service must have a dashboard showing:
- Request rate, error rate, latency (RED metrics)
- Resource utilization (CPU, memory, pod count)
- Business metrics specific to the application
- Dependency health (database, cache, external services)

---

## 5. Code Quality

### Code Review
- All changes require a pull request with at least 1 approving review.
- PR description must explain what changed and why.
- PRs must be linked to a Jira story or issue.
- No self-approvals — a different engineer must review.
- Review checklist: correctness, security, performance, testing, observability.

### Test Coverage
- **Minimum 80% unit test coverage** — enforced in CI pipeline.
- Unit tests must cover:
  - Happy paths
  - Error cases and edge cases
  - Boundary conditions
- Integration tests required for:
  - All API endpoints
  - Database operations
  - External service interactions (using mocks/stubs)
- Performance tests required for:
  - User-facing API endpoints under expected load
  - Batch processing jobs with production-scale data

### Code Standards
- Linting enforced in CI (ESLint for JS/TS, Checkstyle for Java, etc.).
- Formatting enforced in CI (Prettier for JS/TS, google-java-format for Java, etc.).
- No TODOs in production code — convert to Jira tickets.
- Meaningful variable and function names — code should be self-documenting.
- Keep functions small and focused — single responsibility principle.
