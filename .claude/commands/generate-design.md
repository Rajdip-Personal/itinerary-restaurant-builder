---
description: Generate detailed technical design document
---

# Generate Technical Design

You are running the **technical design pipeline**. Follow these steps:

## Step 1: Gather Context
1. Read all files in `memory-bank/` to understand project state, tech decisions, and constraints.
2. Read `docs/requirements.md` or `docs/requirements-*.md` — required input. If it doesn't exist, **stop and tell the user** to run `/extract-requirements` first.
3. Read `docs/execution-plan.md` if it exists (note: plan is generated after design, so this may not exist yet).
4. Read `docs/user-stories.md` or `docs/stories-*.md` if they exist (for revision runs where stories already exist).
5. Read `docs/code-analysis.md` if it exists (for existing system context).
6. Read `.claude/skills/nordstrom-engineering-standards.md` for compliance requirements.

Focus area from user (optional): $ARGUMENTS

## Step 2: Generate Design
Create a comprehensive technical design document covering all of the following sections:

### Architecture
- **System architecture diagram** (text-based) showing all components and their interactions
- **Component descriptions** — Purpose, responsibilities, technology choice for each component
- **Communication patterns** — Sync (REST/gRPC) vs async (Kafka/events), and why

### API Design
- **API inventory** — All endpoints with method, path, request/response schemas
- **Authentication & authorization** — How auth works for each endpoint
- **Error handling** — Standard error response format, error codes
- **Versioning strategy** — How APIs are versioned
- **Rate limiting** — If applicable

### Data Model
- **Entity relationship diagram** (text-based)
- **Table/collection schemas** with column types, constraints, indexes
- **Migration strategy** — How schema evolves over time
- **Data access patterns** — Read/write patterns, query optimization

### Integrations
- **External service inventory** — Each external system, how it's connected, failure handling
- **Event schemas** — For Kafka/messaging: topic names, event formats, producer/consumer mapping
- **Circuit breakers and retries** — Resilience patterns for external calls

### Security
- **Authentication flow** — Step-by-step auth process
- **Authorization model** — RBAC roles, permissions, enforcement points
- **PII handling** — What PII exists, how it's masked, where it's stored
- **Secrets management** — How secrets are injected and rotated
- **Input validation** — Validation rules at each boundary

### Observability
- **Logging strategy** — What's logged, format, correlation ID propagation
- **Metrics** — SLIs, custom business metrics, metric names and labels
- **Health checks** — `/health` and `/ready` endpoint specifications
- **Alerting** — Alert rules, thresholds, runbook references
- **Dashboards** — Key dashboard panels and queries

### Deployment
- **Infrastructure** — K8s resources, namespaces, resource limits
- **CI/CD pipeline** — Stage-by-stage pipeline description
- **Environment strategy** — Dev, staging, production configuration
- **Deployment strategy** — Blue-green, canary, or rolling update
- **Rollback procedure** — How to revert a bad deployment

## Step 3: Update Memory
After the design is generated:
1. Write the design to `docs/detailed-design.md`.
2. Update `memory-bank/systemPatterns.md` with architecture decisions and API conventions.
3. Update `memory-bank/techContext.md` with any new technology decisions.
4. Update `memory-bank/progress.md` — mark design as completed.
5. Update `memory-bank/activeContext.md` — record design decisions and open questions.

## Step 4: Present to User
Summarize the design:
- Architecture overview (components and their responsibilities)
- Key design decisions and trade-offs
- API endpoint count and data model entity count
- Security approach summary
- Open design questions that need human input
- Recommended next step: run `/generate-plan` to generate the execution plan (informed by requirements and design)
