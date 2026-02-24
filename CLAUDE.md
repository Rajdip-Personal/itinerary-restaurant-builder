# CLAUDE.md — Agentic AI Workshop

## Project Overview

This is an **Agentic AI Workshop** repository for **Nordstrom Supply Chain engineering**. It provides a pre-built orchestrator pattern where specialized Claude Code agents collaborate through shared memory to take engineering squads from PRD → requirements → user stories → technical design → validation in a 3-hour hands-on workshop.

**This is human-in-the-loop, NOT fully automated.** Engineers provide context, answer questions, and validate outputs at every step. Agents assist — they do not decide.

## Architecture

The system uses an **orchestrator pattern** with specialized agents collaborating through a shared memory bank:

```
┌─────────────────────────────────────────────────┐
│                  Orchestrator                    │
│         Coordinates pipeline stages              │
├────────┬────────┬────────┬────────┬─────────────┤
│Planning│Require-│ Story  │ Code   │   Memory    │
│ Agent  │ ments  │Genera- │Scanner │   Agent     │
│        │ Agent  │  tor   │        │             │
├────────┴────────┴────────┴────────┴─────────────┤
│              Shared Memory Bank                  │
│         /memory-bank/ (persistent)               │
├─────────────────────────────────────────────────┤
│           MCP Server Integrations                │
│ jira · confluence · github · schema-repo · aha   │
└─────────────────────────────────────────────────┘
```

## Memory Bank

The memory bank lives in `/memory-bank/` and persists context across sessions. It contains:

- `projectbrief.md` — Vision, goals, scope, target users, success metrics
- `productContext.md` — Problem statement, user personas, business context
- `techContext.md` — Tech stack, infrastructure, integrations, constraints, security
- `systemPatterns.md` — Architecture decisions, design patterns, API conventions, data model
- `activeContext.md` — Current focus, recent decisions, open questions, blockers
- `progress.md` — Completed, in progress, blocked, up next

**Always read memory-bank/ before starting any task.** Update it after completing any significant work.

## MCP Server Integrations

The following MCP servers are configured. Use the exact server name prefix when calling tools.

| MCP Server Name | System | Purpose |
|-----------------|--------|---------|
| `jira-mcp` | Jira | Create/update stories, epics, sprints; query existing work; manage comments and worklogs |
| `confluence-mcp` | Confluence | Read/write design docs, runbooks, team pages; search content |
| `github` | GitHub | Repository operations, PRs, code search, file contents, issues |
| `nordstrom-schema-repo` | Nordstrom Schema Registry | Query Kafka event schemas (Avro/JSON); list domains and schemas; search by field name |
| `aha-mcp` | Aha! | Product roadmap items, features, requirements, releases; query and create ideas |

### MCP Tool Naming Convention

MCP tools follow this pattern: `mcp__{server-name}__{tool-name}`

Examples:
- `mcp__jira-mcp__get_issue` — Get a Jira issue
- `mcp__confluence-mcp__search` — Search Confluence
- `mcp__github__get_file_contents` — Get file from GitHub repo
- `mcp__nordstrom-schema-repo__search_schemas` — Search Kafka schemas by keyword
- `mcp__nordstrom-schema-repo__get_schema` — Get full schema definition
- `mcp__aha-mcp__*` — Aha! roadmap and feature operations

### Nordstrom Schema Repo Tools

Use these tools to discover Kafka event contracts:
- `list_domains` — List all schema domains (e.g., supply-chain, inventory)
- `list_schemas` — List schemas in a domain
- `search_schemas` — Search schemas by keyword
- `search_by_field` — Find schemas containing a specific field name
- `get_schema` — Get full Avro/JSON schema definition
- `get_index` — Get the schema index
- `refresh` — Refresh the schema cache

## Slash Commands

These commands trigger agent pipelines:

| Command | Purpose |
|---------|---------|
| `/refine-prd` | Refine and iterate on a project PRD with guided questions and automatic memory bank updates |
| `/review-prd` | Walk through PRD open questions one by one, gather answers, update PRD and memory bank |
| `/generate-plan` | Generate execution plan from PRD |
| `/extract-requirements` | Process PRD into structured requirements |
| `/generate-stories` | Generate sprint-ready user stories from requirements |
| `/prototype-ui` | Generate a rapid interactive React prototype from PRD workflows and launch in browser |
| `/scan-codebase` | Analyze existing codebase for patterns and architecture |
| `/manage-memory` | View or update the memory bank |
| `/generate-design` | Generate detailed technical design document |
| `/validate-coverage` | Cross-check stories against requirements for gaps |

## Workflow

The standard workflow for each workshop squad:

```
1. /refine-prd           → Refine PRD with guided questions (memory bank auto-updated)
2. /review-prd           → Walk through open questions, gather answers, update PRD
3. /prototype-ui         → Generate interactive React prototype, preview in browser
4. /generate-plan        → Generate phased execution plan
5. /extract-requirements → Extract structured requirements from PRD
6. /generate-stories     → Generate sprint-ready user stories
7. /generate-design      → Create detailed technical design
8. /validate-coverage    → Cross-check everything for gaps
```

At each step, engineers review, provide feedback, and iterate before moving to the next stage.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `.claude/agents/` | Subagent definitions (planning, requirements, stories, scanner, memory, orchestrator) |
| `.claude/commands/` | Slash command definitions (/plan, /requirements, /stories, etc.) |
| `.claude/skills/` | Reusable knowledge (engineering standards, requirements writing) |
| `memory-bank/` | Persistent shared context across all agents and sessions |
| `templates/` | PRD template and other starting documents |
| `docs/` | Generated outputs (plans, requirements, stories, designs, reports) |
| `projects/` | Project-specific PRDs and artifacts |

## Nordstrom Engineering Standards

All generated code, designs, and stories **must** adhere to:

### Security
- Authentication and authorization via standard identity platform
- PII masking in all logs and non-production environments
- Secrets managed via Vault or Kubernetes secrets — never in code or config files
- Input validation on all external boundaries
- RBAC enforced at API and data layers

### Deployment
- Standard CI/CD pipeline on GitHub Actions
- Kubernetes deployment on standard K8s platform
- Container security scanning in CI pipeline
- Blue-green or canary deployment strategy
- Infrastructure as code (Terraform/Helm)

### Logging & Observability
- Structured JSON logging — no unstructured log lines
- Correlation IDs propagated across all service calls
- No PII in logs — mask SSN, email, phone, address, names
- Standard log levels: DEBUG, INFO, WARN, ERROR
- Health check endpoint (`/health`) and readiness endpoint (`/ready`)

### Monitoring
- SLIs defined for latency, error rate, throughput
- SLOs documented and alerted on
- Dashboards in standard monitoring platform
- Alerting with clear runbook links

### Code Quality
- Code review required for all changes (minimum 1 approval)
- 80% unit test coverage minimum
- Integration tests for all API endpoints
- Performance/load tests for user-facing flows
- Linting and formatting enforced in CI

## Important Notes

- **Never commit secrets, credentials, or PII** to this repository
- **Always validate agent outputs** — agents make mistakes, humans catch them
- **Memory bank is the source of truth** — keep it updated
- **This repo is for learning** — encourage experimentation and iteration
