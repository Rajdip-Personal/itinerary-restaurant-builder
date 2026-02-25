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

## Memory Bank Protocol (MANDATORY)

After ANY of these actions, you MUST update the memory bank before proceeding:

| Action | Update These Files |
|--------|-------------------|
| Answering open questions | `activeContext.md`, `productContext.md` |
| Making architectural decisions | `systemPatterns.md`, `techContext.md` |
| Completing a pipeline stage | `progress.md` |
| Identifying blockers | `activeContext.md` |
| Setup/config changes (branches, worktrees, tools) | `activeContext.md` |

**Do NOT wait until session end. Save incrementally as you work.**

## Automatic Memory Updates

Claude MUST proactively save to memory bank (without being asked) after:

- Worktree or branch setup changes
- Key architectural or design decisions
- Tool/integration configuration changes
- Blockers identified or resolved
- Environment or infrastructure setup
- Any decision that would be painful to re-discover

If unsure whether something is "critical enough" to save — save it. Err on the side of over-documenting.

## MCP Server Integrations

The following MCP servers are configured. Use the exact server name prefix when calling tools.

| Server | Purpose |
|--------|---------|
| **Jira** | Create/update stories, epics, sprints; query existing work |
| **Confluence** | Read/write design docs, runbooks, team pages |
| **GitHub** | Repository operations, PRs, code search |
| **Slack** | Read threads, search channels, browse messages (read-only) |
| **Aha!** | Product roadmap items, feature requests |
| **ServiceNow** | Query incidents, change requests, service requests (read-only) |
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

   Then:
   1. Display "Ready to Start"
   2. List available projects by scanning `projects/` directory for subdirectories containing `prd.md`
   3. **Explicitly ask:** "Which project is your team working on?" and list the projects as numbered options
   4. Do NOT offer to create a new project or use templates

**After User Selects Project — PRD Reading Step (MANDATORY):**

7. **Present the PRD for team reading:**
   - Read the selected project's `prd.md` file
   - Display a **clearly labeled summary** (brief table with Vision, Problem, Deliverables, Open Questions count)
   - **HIGHLY ENCOURAGE** the team to read the full PRD on GitHub with a browser
   - Provide the GitHub URL using the **main branch**: `https://github.com/Nordstrom-Sandbox/agentic-ai-workshop/blob/main/projects/{project-name}/prd.md`
   - Say: "When everyone has read the PRD, type **ready** to continue."
   - **STOP and WAIT** for the user to type "ready"
   - Do NOT proceed, offer suggestions, or show workflow commands until the user types "ready"
   - This is a deliberate human-in-the-loop pause to ensure the team understands the project before refinement begins

8. **After user types "ready":**
   - **Automatically begin `/refine-prd`** — do NOT show a list of all commands
   - Skip the project selection step in `/refine-prd` since the project is already known
   - Start directly with Step 2 (Load Context) and Step 3 (Assess PRD Completeness)
   - The guided workflow will lead the user through each step sequentially

## Pipeline Navigation

The workshop follows a sequential pipeline. At each step, users can:
- **Continue forward** to the next step (recommended)
- **Go back** to re-run any previous step that passed its readiness check

### Navigation Prompt Format

At the completion of each command (after readiness check passes), show:

```
┌─────────────────────────────────────────────────┐
│ ✓ /refine-prd complete                          │
├─────────────────────────────────────────────────┤
│ Options:                                        │
│  [1] Continue to /review-prd (recommended)      │
│  [2] Re-run /refine-prd                         │
└─────────────────────────────────────────────────┘
```

As users progress, more options appear:

```
┌─────────────────────────────────────────────────┐
│ ✓ /extract-requirements complete                │
├─────────────────────────────────────────────────┤
│ Options:                                        │
│  [1] Continue to /generate-stories (recommended)│
│  ─── Previous steps (re-run to update) ───      │
│  [2] /refine-prd           ✓                    │
│  [3] /review-prd           ✓                    │
│  [4] /prototype-ui         ✓                    │
│  [5] /generate-plan        ✓                    │
│  [6] /extract-requirements ✓                    │
└─────────────────────────────────────────────────┘
```

### Re-running Previous Steps

When a user chooses to go back:
1. Re-run that command from the beginning
2. Allow them to make updates/changes
3. When that step's readiness check passes again, show the navigation prompt
4. Progress continues forward from there (downstream outputs may need regeneration)

### Pipeline State Tracking

Track pipeline state in `memory-bank/progress.md`:
- Which steps have passed readiness checks
- When each step was last completed
- Whether downstream steps need regeneration after upstream changes

## Slash Commands

These commands trigger agent pipelines. **Users don't need to memorize these** — the guided workflow presents them automatically via navigation prompts.

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

The workshop is **guided** — users don't need to remember commands. After setup, the pipeline runs sequentially with navigation prompts at each step.

**Pipeline Order:**
```
/refine-prd → /review-prd → /prototype-ui → /generate-plan → /extract-requirements → /generate-stories → /generate-design → /validate-coverage
```

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `/refine-prd` | Refine PRD with guided questions (auto-starts after "ready") |
| 2 | `/review-prd` | Walk through open questions, gather answers |
| 3 | `/prototype-ui` | Generate interactive React prototype, preview in browser |
| 4 | `/generate-plan` | Generate phased execution plan |
| 5 | `/extract-requirements` | Extract structured requirements from PRD |
| 6 | `/generate-stories` | Generate sprint-ready user stories |
| 7 | `/generate-design` | Create detailed technical design |
| 8 | `/validate-coverage` | Cross-check everything for gaps |

At each step:
- Engineers review output and provide feedback
- Readiness check determines if step is complete
- Navigation prompt shows next step + option to revisit previous steps

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
