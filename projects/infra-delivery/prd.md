# Product Requirements Document — Full-Stack Infrastructure & Delivery

> **Project Name:** Full-Stack Infrastructure & Delivery Documentation
> **Author:** Supply Chain Engineering
> **Date:** 2026-02-24
> **Status:** Draft
> **Squad:** Infrastructure Squad

---

## 1. Product Overview

### Vision
Create a comprehensive, connected view of everything needed to run a Supply Chain application — from Kafka schemas to Splunk queries to GitHub repos to Jira stories — producing a detailed design document with implementation-ready user stories that bring an application into full compliance with Nordstrom engineering standards.

### Problem Statement
Supply Chain engineering squads work with applications that have dependencies spread across multiple systems: Kafka event schemas in the schema registry, Splunk queries for monitoring, GitHub repositories with application code, Confluence pages with design documents, Jira boards with stories and test cases, and Aha! roadmap items. There is no single place that connects all of these together. When a new engineer joins a squad, onboarding takes weeks as they hunt across systems to understand how the application works. When something breaks in production, engineers waste time finding the right Splunk query, the right runbook, or the right team to escalate to. Squads have technical debt in their infrastructure: missing monitoring, inconsistent logging, absent health checks, manual deployments. This project connects all the dots and produces actionable stories to close the gaps.

### Target Users
| Persona | Role | Key Need |
|---------|------|----------|
| Squad Engineer | Develops and maintains SC applications | A single source of truth connecting all systems, schemas, queries, and docs for their application |
| Squad Lead | Technical lead for the squad | Understand infrastructure gaps and have stories ready to close them |
| New Team Member | Recently joined the squad | Onboard quickly by understanding the full application landscape |
| SRE / On-Call Engineer | Responds to production incidents | Quickly find the right Splunk queries, runbooks, dashboards, and escalation paths |

---

## 2. Goals & Success Metrics

### Goals
1. **Primary:** Produce a detailed design document that maps all infrastructure components, integrations, and dependencies for a target application
2. **Secondary:** Generate implementation-ready user stories for bringing the application into compliance with Nordstrom engineering standards
3. **Tertiary:** Create reusable documentation templates that squads can maintain going forward

### Success Metrics
| Metric | Current State | Target | Measurement Method |
|--------|--------------|--------|-------------------|
| Infrastructure gaps identified | Unknown | 100% of gaps documented per application | Design doc completeness review |
| Stories generated for compliance | 0 | All gaps have corresponding stories | Story-to-gap traceability |
| New engineer onboarding time | 2-3 weeks | ≤ 1 week (with documentation) | Self-reported onboarding survey |
| Incident response time (mean) | Varies | 20% reduction within 3 months | Incident ticket metrics |

---

## 3. Scope

### In Scope
- Inventory and document existing Kafka schemas (event contracts the application produces/consumes)
- Inventory and document existing Splunk queries (monitoring, alerting, debugging)
- Inventory and document GitHub repositories (application code, infrastructure code, shared libraries)
- Inventory and document Confluence pages (design docs, runbooks, ADRs, onboarding guides)
- Inventory and document Jira stories and test cases (current and past work, test coverage)
- Inventory and document Aha! ideas and features (roadmap alignment)
- Gap analysis against Nordstrom engineering standards:
  - Security compliance (auth, PII masking, secrets management)
  - Logging standards (structured JSON, correlation IDs, no PII)
  - Monitoring standards (health endpoints, SLIs/SLOs, dashboards, alerting)
  - CI/CD standards (GitHub Actions pipeline, security scanning)
  - Deployment standards (standard K8s, Nordstrom Standard Pipeline, resource limits)
  - Testing standards (80% coverage, integration tests, performance tests)
- Detailed design document combining all findings with architecture diagrams
- User stories for every identified gap, organized into epics and sprints
- Standard CI/CD pipeline configuration for GitHub Actions
- Standard K8s deployment configuration (Nordstrom Standard Pipeline — no Helm)

### Out of Scope
- Actually implementing the infrastructure changes (this project produces the design and stories; squads implement)
- Modifying application business logic
- Creating new applications from scratch
- Cross-squad infrastructure (shared platform services)
- Budget and resource allocation for implementation

### Future Considerations
- Automated compliance scanning that runs continuously against repos
- Self-service infrastructure provisioning from templates
- Cross-squad infrastructure dependency mapping
- Automated documentation generation from code analysis

---

## 4. User Stories (High Level)

### Squad Engineer
- As a squad engineer, I want a single document listing all Kafka topics my application produces and consumes with their schemas, so that I understand our event contracts.
- As a squad engineer, I want to see all Splunk queries relevant to my application in one place, so that I can quickly debug production issues.
- As a squad engineer, I want to know which engineering standards my application doesn't meet, so that I can prioritize compliance work.

### Squad Lead
- As a squad lead, I want a gap analysis showing where my application falls short of Nordstrom engineering standards, so that I can plan remediation work.
- As a squad lead, I want sprint-ready user stories for every infrastructure gap, so that I can add them to sprint planning without additional refinement.
- As a squad lead, I want a detailed design document I can share with stakeholders to justify infrastructure investment.

### New Team Member
- As a new team member, I want a comprehensive map of all systems, repositories, and documentation related to my application, so that I can onboard quickly.
- As a new team member, I want to understand the deployment pipeline and how to deploy changes, so that I can contribute independently.

### SRE / On-Call Engineer
- As an on-call engineer, I want a runbook index linking to all monitoring dashboards, Splunk queries, and escalation paths, so that I can respond to incidents efficiently.
- As an on-call engineer, I want to know the SLIs, SLOs, and alert thresholds for the application, so that I can assess incident severity accurately.

---

## 5. Functional Requirements

### Workflows

**Workflow 1: Infrastructure Discovery**
1. Squad identifies the target application and its known repositories
2. Using the `/scan` command, analyze each repository for tech stack, architecture, patterns, and compliance
3. Using MCP integrations, query connected systems:
   - **Schema Repository / Kafka**: Identify all topics produced/consumed, retrieve Avro/JSON schemas
   - **Splunk**: Identify existing queries, dashboards, and alerts for the application
   - **GitHub**: List all related repositories, branches, recent PRs, CI/CD configs
   - **Confluence**: Find existing design docs, runbooks, ADRs, onboarding guides
   - **Jira**: Pull current epics, stories, test cases, sprint history
   - **Aha!**: Retrieve related features and roadmap items
4. Compile findings into a structured inventory

**Workflow 2: Gap Analysis**
1. Compare discovered infrastructure against Nordstrom engineering standards
2. For each standard area, assess:
   - **Compliant** — Meets the standard
   - **Partial** — Some aspects met, others missing
   - **Non-Compliant** — Standard not met
   - **Unknown** — Cannot determine from available information
3. Document specific gaps with evidence (e.g., "No health check endpoint found in any route file")
4. Prioritize gaps by risk: Security gaps are P0, monitoring gaps are P0, others P1/P2

**Workflow 3: Design Document Generation**
1. Using `/design` command, generate a detailed technical design document that includes:
   - Current state architecture (as discovered)
   - Target state architecture (compliant with standards)
   - Component inventory with dependencies
   - Kafka event contract documentation
   - API inventory with endpoint details
   - Data model documentation
   - Security model (current and target)
   - Observability model (current and target)
   - Deployment model (current and target)
   - Gap summary with prioritized remediation plan

**Workflow 4: Story Generation for Gaps**
1. Using `/stories` command, generate user stories for every identified gap
2. Stories must be specific to the application's tech stack and current state
3. Stories should reference specific files, configs, and systems to modify
4. Include stories for:
   - Missing or non-standard CI/CD pipeline → stories to create/update GitHub Actions
   - Missing health endpoints → stories to add `/health` and `/ready`
   - Non-structured logging → stories to implement JSON logging
   - Missing monitoring → stories to add SLIs, dashboards, alerts
   - Security gaps → stories for auth, secrets, PII masking
   - Missing tests → stories for unit, integration, performance tests
   - K8s deployment gaps → stories for Nordstrom Standard Pipeline configuration, resource limits, HPA

### Business Rules
- Every discovery finding must be linked to a source (repository, Confluence page, Kafka topic, etc.)
- Gap analysis must use the Nordstrom engineering standards as the authoritative checklist
- Stories generated for gaps must be specific enough to implement without further refinement
- Existing compliant infrastructure must be documented (not just gaps — the full picture)
- Design documents must clearly separate "current state" from "target state"
- All documentation must be version-controlled in the project's GitHub repository

### Data Requirements
- Repository inventory: repo URL, primary language, last commit date, CI/CD status
- Kafka topic inventory: topic name, schema (Avro/JSON), direction (produce/consume), related service
- Splunk query inventory: query name, query text, dashboard link, alert configuration
- Confluence page inventory: page title, space, URL, last updated date, relevance
- Jira work inventory: epic/story key, summary, status, sprint, assignee
- Aha! feature inventory: feature name, status, roadmap placement, alignment to this work

---

## 6. Non-Functional Requirements

### Security
- MCP server connections must use authenticated credentials (API tokens, OAuth)
- No credentials stored in generated documentation
- PII found during code scanning must be flagged but not included in design documents
- Generated stories that involve security changes must be marked P0

### Performance
- Code scanning should complete within 10 minutes per repository
- MCP queries to external systems should complete within 30 seconds each
- Design document generation should complete within 5 minutes
- Story generation should complete within 5 minutes

### Scalability
- Support applications with up to 20 related repositories
- Support applications with up to 50 Kafka topics
- Support design documents up to 100 pages

### Observability
- Log all MCP queries and their results for audit
- Track which standards were checked and their assessment
- Maintain history of gap assessments for measuring improvement over time

---

## 7. Technical Constraints

### Existing Systems
- **Schema Repository** — Nordstrom schema registry for Kafka event schemas. Accessible via MCP or REST API.
- **Splunk** — Log aggregation and monitoring platform. Queries and dashboards accessible via API.
- **GitHub** — Source code hosting. Full API access via MCP server.
- **Confluence** — Documentation platform. Full API access via MCP server.
- **Jira** — Project management. Full API access via MCP server.
- **Aha!** — Product roadmap. API access available.
- **SharePoint** — Corporate documents, org charts. Limited API access.

### Tech Stack
- **This is a domain project** — The tech stack varies by the application being analyzed.
- The workshop tooling (this repo) uses Claude Code with MCP integrations.
- Output is documentation (Markdown), user stories (Markdown/Jira), and configuration files (YAML/HCL).
- No new application is being built — the deliverable is documentation and stories.

### Infrastructure
- Generated CI/CD configurations target GitHub Actions
- Generated deployment configurations target standard K8s with Nordstrom Standard Pipeline (no Helm)
- Generated monitoring configurations target the standard observability platform
- All generated artifacts are committed to the application's GitHub repository

---

## 8. Dependencies & Risks

### Dependencies
| Dependency | Owner | Status | Impact if Delayed |
|-----------|-------|--------|-------------------|
| MCP server for GitHub | Workshop facilitator | Configured | Cannot scan repos or create stories — blocks discovery |
| MCP server for Confluence | Workshop facilitator | Configured | Cannot discover existing docs — partial discovery only |
| MCP server for Jira | Workshop facilitator | Configured | Cannot discover existing work or create stories — blocks story generation |
| Schema repository access | Platform Team | Needs API key | Cannot discover Kafka schemas — partial discovery only |
| Splunk API access | Platform Team | Needs API key | Cannot discover monitoring — partial discovery only |
| Target application repository access | Squad | Must have read access | Cannot scan code — blocks core functionality |

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MCP server connectivity issues during workshop | Medium | High | Pre-test all connections; have fallback manual discovery process |
| Target application too large/complex to analyze in workshop timeframe | Medium | Medium | Pre-select and scope the analysis area; focus on one service/repo |
| Incomplete schema registry or Splunk access | High | Medium | Document what we can; flag inaccessible systems as open items |
| Generated stories too generic to be actionable | Medium | Medium | Include specific file paths, config references, and code snippets in stories |
| Squad unfamiliar with engineering standards | Low | Low | Reference skill document; facilitator explains standards during workshop |

---

## 9. Timeline & Milestones

| Milestone | Workshop Phase | Description |
|-----------|---------------|-------------|
| M1: Discovery | Phase 1 (60 min) | Scan repos, query MCP systems, build infrastructure inventory |
| M2: Gap Analysis | Phase 2 (30 min) | Compare findings against Nordstrom standards, prioritize gaps |
| M3: Design Document | Phase 3 (45 min) | Generate detailed design document with current/target state |
| M4: Story Generation | Phase 4 (30 min) | Generate implementation-ready stories for all gaps |
| M5: Review & Refine | Phase 5 (15 min) | Validate stories, resolve questions, finalize deliverables |

---

## 10. Open Questions

| # | Question | Owner | Status | Answer |
|---|----------|-------|--------|--------|
| 1 | Which specific application/repo will each squad analyze during the workshop? | Squad Lead | Open | — |
| 2 | Do we have API access to the schema repository, or is it MCP-only? | Platform Team | Open | — |
| 3 | Are Splunk queries documented somewhere, or do we need to discover them from dashboards? | SRE Team | Open | — |
| 4 | Should generated stories go directly into Jira, or just into the docs/user-stories.md file? | Workshop Facilitator | Open | — |
| 5 | Is there a standard Helm chart template we should reference for K8s deployment stories? | Cloud Platform | **Answered** | No Helm — use Nordstrom Standard Pipeline for deployments |
| 6 | How much existing documentation exists in Confluence for each squad's application? | Squad Leads | Open | — |
