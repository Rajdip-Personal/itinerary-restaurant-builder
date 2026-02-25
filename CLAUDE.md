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
│ Jira · Confluence · GitHub · ServiceNow · Slack  │
│         Aha! · Schema Repo                       │
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

| Server | Purpose |
|--------|---------|
| **Jira** | Create/update stories, epics, sprints; query existing work |
| **Confluence** | Read/write design docs, runbooks, team pages |
| **GitHub** | Repository operations, PRs, code search |
| **ServiceNow** | Query incidents, change requests, service requests (read-only) |
| **Slack** | Read threads, search channels, browse messages (read-only) |
| **Aha!** | Product roadmap items, feature requests |
| **Nordstrom Schema Repo** | Query Kafka event schemas (Avro/JSON) |

### Verifying MCP Server Configuration

When the user asks about their Claude Code setup or MCP server configuration, use these commands to check:

**1. List MCP servers at user scope:**
```bash
python3 -c "
import json
with open('$HOME/.claude.json') as f:
    d = json.load(f)
# User-scope MCP servers
user_mcps = d.get('mcpServers', {})
print('=== User-Scope MCP Servers ===')
for name, config in user_mcps.items():
    print(f'  {name}: {config.get(\"type\", \"stdio\")}')
if not user_mcps:
    print('  (none configured)')
"
```

**2. Check environment variables for MCP authentication:**
```bash
echo "JIRA_API_TOKEN: $([ -n \"\$JIRA_API_TOKEN\" ] && echo 'SET' || echo 'NOT SET')"
echo "CONFLUENCE_API_TOKEN: $([ -n \"\$CONFLUENCE_API_TOKEN\" ] && echo 'SET' || echo 'NOT SET')"
echo "GITHUB_PAT: $([ -n \"\$GITHUB_PAT\" ] && echo 'SET' || echo 'NOT SET')"
echo "AHA_API_TOKEN: $([ -n \"\$AHA_API_TOKEN\" ] && echo 'SET' || echo 'NOT SET')"
echo "SERVICENOW_USERNAME: $([ -n \"\$SERVICENOW_USERNAME\" ] && echo 'SET' || echo 'NOT SET')"
echo "SERVICENOW_PASSWORD: $([ -n \"\$SERVICENOW_PASSWORD\" ] && echo 'SET' || echo 'NOT SET')"
```

**3. Check local MCP server installations:**
```bash
ls -la ~/.claude-mcp/ 2>/dev/null || echo "No local MCP servers in ~/.claude-mcp/"
```

**Key locations:**
- `~/.claude.json` — Main Claude Code config (contains `mcpServers` at user scope)
- `~/.claude-mcp/` — Local MCP server installations (cloned repos)
- `~/Library/Application Support/Claude/claude_desktop_config.json` — Claude Desktop app config (NOT Claude Code CLI)

**Important:** Do NOT confuse Claude Desktop config with Claude Code CLI config. They are separate.

### Required MCP Servers

The following MCP servers **must** be configured before proceeding with the workshop:

| Server Key | Required |
|------------|----------|
| `jira` | Yes |
| `confluence-mcp` | Yes |
| `github` | Yes |
| `nordstrom-schema-repo` | Yes |
| `aha-mcp` | Yes |
| `servicenow` | Yes |
| `nordstrom-slack` | Yes |

### Required Environment Variables

The following environment variables **must** be set for MCP server authentication:

| Variable | Purpose |
|----------|---------|
| `JIRA_API_TOKEN` | Jira API authentication |
| `CONFLUENCE_API_TOKEN` | Confluence API authentication |
| `GITHUB_PAT` | GitHub Personal Access Token |
| `AHA_API_TOKEN` | Aha! API authentication |
| `SERVICENOW_USERNAME` | ServiceNow username |
| `SERVICENOW_PASSWORD` | ServiceNow password |

**How to set environment variables:**

Add these to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export JIRA_API_TOKEN="your-jira-token"
export CONFLUENCE_API_TOKEN="your-confluence-token"
export GITHUB_PAT="your-github-pat"
export AHA_API_TOKEN="your-aha-token"
export SERVICENOW_USERNAME="your-servicenow-username"
export SERVICENOW_PASSWORD="your-servicenow-password"
```

Then reload your shell: `source ~/.zshrc` (or restart your terminal).

### Setup Check Protocol

When a user asks about their setup or wants to start using the workshop tooling:

1. Run the MCP server check commands above
2. Compare configured servers against the required list
3. Check all required environment variables

**Validation Step 1 — MCP Servers:**

4. **If ANY required MCP servers are missing:**
   - List which servers are missing in a table
   - Instruct the user to run:
     ```bash
     scripts/setup-mcp-servers.sh
     ```
   - **STOP HERE** — Do NOT proceed until all MCP servers are configured
   - After the user runs the setup script, they must restart Claude Code for changes to take effect
   - Do NOT continue to environment variable check or "Ready to Start"

**Validation Step 2 — Environment Variables:**

5. **If ANY required environment variables are NOT SET:**
   - List which variables are missing in a table
   - Show the user how to set them (add to `~/.zshrc` or `~/.bashrc`)
   - **STOP HERE** — Do NOT proceed until all environment variables are set
   - After setting variables, user must run `source ~/.zshrc` or restart their terminal, then restart Claude Code
   - Do NOT continue to "Ready to Start"

**Ready to Start:**

6. **Only if ALL of the following are true:**
   - ALL required MCP servers are configured
   - ALL required environment variables are set

   Then display "Ready to Start" and show the available workflow commands

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
