# CLAUDE.md — Agentic AI Workshop

## Project Overview

This is an **Agentic AI Workshop** repository for **Nordstrom Supply Chain engineering**. It provides a pre-built orchestrator pattern where specialized Claude Code agents collaborate through shared memory to take engineering squads from PRD → requirements → technical design → user stories → validation in a 3-hour hands-on workshop.

**This is human-in-the-loop, NOT fully automated.** Engineers provide context, answer questions, and validate outputs at every step. Agents assist — they do not decide.

## Fundamental Principles

### INTERACTIVE USER INPUT (MANDATORY)

**All user input gathering MUST use the `AskUserQuestion` tool.** Never output questions as plain text and wait for freeform responses.

**Why:** Plain text questions create poor UX — users don't know what format to respond in, questions get lost in output, and there's no structure.

**How to use `AskUserQuestion`:**

```
AskUserQuestion:
  questions:
    - question: "Which database should we use?"
      header: "Database"        # Short label (max 12 chars)
      multiSelect: false        # true if multiple selections allowed
      options:
        - label: "PostgreSQL (Recommended)"
          description: "Standard Nordstrom platform, managed backups"
        - label: "MySQL"
          description: "Alternative if specific features needed"
        - label: "MongoDB"
          description: "For document-oriented data models"
```

**Rules:**
1. **Always provide 2-4 options** — even if one seems obvious, give alternatives
2. **Put recommended option first** with "(Recommended)" in the label
3. **Users can always type "Other"** — freeform input is automatic
4. **Use `multiSelect: true`** when choices aren't mutually exclusive
5. **Ask 1-4 questions per call** — each appears as a separate tab
6. **Use `markdown` preview** for comparing code snippets, mockups, or configurations

**When to use:**
- Project selection
- Clarifying ambiguous requirements
- Choosing between implementation approaches
- Gathering preferences or decisions
- Any time you would otherwise ask a question in plain text

**When NOT to use:**
- Confirming completion ("Ready to proceed?" → just proceed or show navigation prompt)
- Yes/no validations where the action is obvious
- When the user has already provided the answer in their message

### CODE IS THE SOURCE OF TRUTH

**This is the most important principle in this workshop.**

When analyzing any repository or application:
- **The actual source code is the ONLY authoritative source** for understanding what an application does
- README files, Confluence pages, Jira tickets, and other documentation are **secondary context only**
- Documentation can be outdated, incomplete, or wrong — code cannot lie about what it actually does
- **NEVER make assessments about a codebase without reading the actual code**
- If you cannot clone and read the code, you cannot make technical assessments

**Before any code analysis:**
1. The repository MUST be cloned locally via SSH
2. Analysis MUST use local file system operations (Read, Glob, Grep)
3. If SSH clone fails, the analysis STOPS — do not attempt API-based or HTTPS workarounds
4. All findings MUST reference specific files and line numbers in the actual code

**Documentation is useful for:**
- Understanding business context and intent
- Finding links to related systems
- Historical decisions and rationale
- But NEVER as a substitute for reading the code

### STOP ON AGENT ERRORS (MANDATORY)

**If any subagent fails with an error, STOP IMMEDIATELY.**

When spawning agents via the Task tool, errors can occur:
- API errors (invalid model, rate limits, timeouts)
- Agent configuration errors (missing tools, bad prompts)
- Execution errors (clone failures, permission issues)

**When an error occurs:**
1. **STOP** — Do not attempt workarounds or alternative agents
2. **REPORT** — Tell the user exactly what failed and the error message
3. **DIAGNOSE** — Identify the likely cause (model config, missing credentials, etc.)
4. **WAIT** — Let the user decide how to fix it before proceeding

**Why this matters:**
- Workarounds hide problems and create confusion
- The user needs to know when infrastructure is broken
- Substituting a different agent changes behavior unpredictably
- The documented pipeline assumes specific agents with specific capabilities

**Example of WRONG behavior:**
```
Orchestrator agent fails with API error
→ "Let me try a general-purpose agent instead"  ← WRONG
```

**Example of CORRECT behavior:**
```
Orchestrator agent fails with API error
→ "The orchestrator agent failed with: [error message]"
→ "The model reference in .claude/agents/orchestrator.md may be invalid"
→ "Please fix the configuration before proceeding"
→ STOP and wait for user
```

## Architecture

The system uses a **two-phase architecture** with **Agent Teams**:

1. **Phase 1 (Human-Driven):** Main Claude handles setup, project selection, and PRD refinement directly
2. **Phase 2 (Agent Team):** After PRD is ready, the main Claude session becomes **Team Lead** (via `TeamCreate`) and spawns the **orchestrator as a persistent teammate**, which then coordinates the remaining pipeline by spawning other teammates that persist and communicate with each other

### Agent Teams vs Subagents

This workshop uses **Agent Teams** (not subagents). The key difference:

| Subagents | Agent Teams |
|-----------|-------------|
| Run, complete, and die | **Persist** throughout session |
| Report back only to caller | **Message each other** directly |
| Isolated context | Shared task list, direct communication |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: Human-Driven (Main Claude)                                 │
│  Setup → Project Selection → /refine-prd → /review-prd               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 2: Agent Team (Main Claude = Team Lead)                       │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │          Team Lead: Main Claude Session                      │    │
│  │     Creates team (TeamCreate) · Spawns orchestrator          │    │
│  │     Relays human input/validation to orchestrator            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                         SendMessage                                  │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Orchestrator (persistent teammate)              │    │
│  │     Spawns & coordinates all other teammates                 │    │
│  │     Reviews outputs · Messages team-lead for validation      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                    Task (team_name) + SendMessage                    │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Teammates (persist)                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │ Memory   │←→│ Planning │←→│ Require- │←→│  Design  │    │    │
│  │  │  Agent   │  │  Agent   │  │  ments   │  │  Agent   │    │    │
│  │  │ (always) │  │          │  │  Agent   │  │          │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    │
│  │        ↑             ↑             ↑             ↑          │    │
│  │        └─────────────┼─────────────┼─────────────┘          │    │
│  │                  SendMessage                                 │    │
│  │  ┌──────────┐  ┌──────────┐                                 │    │
│  │  │  Story   │  │   Code   │                                 │    │
│  │  │Generator │  │ Scanner  │                                 │    │
│  │  └──────────┘  └──────────┘                                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Human validates at each stage before team proceeds                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Shared Memory Bank                             │
│           memory-agent writes · other teammates read                 │
├─────────────────────────────────────────────────────────────────────┤
│                    MCP Server Integrations                           │
│       Jira · Confluence · GitHub · ServiceNow · Slack                │
│                    Aha! · Schema Repo                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Starting Claude with Agent Teams

This repository includes `.claude/settings.json` which automatically configures:
- **Model:** Opus 4.6 (`us.anthropic.claude-opus-4-6-v1`)
- **Agent Teams:** Enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)

When you start `claude` (or `jwn-claude`) from this repository, these settings are applied automatically.

## Memory Bank

The memory bank lives in `/memory-bank/` and persists context across sessions. It contains:

- `projectbrief.md` — Vision, goals, scope, target users, success metrics
- `productContext.md` — Problem statement, user personas, business context
- `techContext.md` — Tech stack, infrastructure, integrations, constraints, security
- `systemPatterns.md` — Architecture decisions, design patterns, API conventions, data model
- `activeContext.md` — Current focus, recent decisions, open questions, blockers
- `progress.md` — Completed, in progress, blocked, up next

**Always read memory-bank/ before starting any task.**

## Memory Bank Protocol (MANDATORY)

### Centralized Memory Agent

The **memory-agent** is the central authority for all memory operations. During the orchestrator pipeline:
- Memory-agent is spawned FIRST and runs throughout
- All other agents communicate with memory-agent for updates
- No agent writes directly to memory-bank/ except memory-agent

### Phase 1 (Human-Driven): Direct Updates

During `/refine-prd` and `/review-prd` (before orchestrator takes over), main Claude updates memory-bank/ directly since memory-agent is not yet running.

### Phase 2 (Orchestrator-Driven): Via Memory Agent

Once the orchestrator spawns memory-agent, all updates go through it:

| Action | Send to Memory Agent |
|--------|---------------------|
| Answering open questions | `Type: decision` with question and answer |
| Making architectural decisions | `Type: decision` with decision and rationale |
| Completing a pipeline stage | `Type: progress` with stage completion |
| Identifying blockers | `Type: blocker` with description |
| Code analysis findings | `Type: finding` with tech stack, patterns, gaps |

**Message format to memory-agent:**
```
MEMORY UPDATE:
- Agent: [your-agent-name]
- Type: decision | finding | progress | question | blocker
- Content: [what to record]
- Context: [why this matters]
```

### Memory Agent Responsibilities

The memory-agent:
- Determines which file(s) information belongs in
- Maintains consistent formatting and timestamps
- Detects and flags conflicts
- Preserves history (supersedes, never deletes)
- Reports confirmation of what was recorded

**Do NOT wait until session end. Send updates incrementally as you work.**

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
echo "GITLAB_TOKEN: $([ -n \"\$GITLAB_TOKEN\" ] && echo 'SET' || echo 'NOT SET')"
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
| `GITLAB_TOKEN` | GitLab API authentication (git.jwn.app) |

**How to set environment variables:**

Add these to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export JIRA_API_TOKEN="your-jira-token"
export CONFLUENCE_API_TOKEN="your-confluence-token"
export GITHUB_PAT="your-github-pat"
export AHA_API_TOKEN="your-aha-token"
export SERVICENOW_USERNAME="your-servicenow-username"
export SERVICENOW_PASSWORD="your-servicenow-password"
export GITLAB_TOKEN="your-gitlab-token"
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
   2. Scan `projects/` directory for subdirectories containing `prd.md`
   3. **Use `AskUserQuestion`** to ask project selection:
      ```
      AskUserQuestion:
        questions:
          - question: "Which project is your team working on?"
            header: "Project"
            multiSelect: false
            options:
              - label: "RTO Compliance"
                description: "Track employee return-to-office compliance"
              - label: "Scan Compliance"
                description: "Monitor security scan compliance across repos"
              - label: "Infrastructure & Delivery"
                description: "Document infrastructure and generate compliance stories"
      ```
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

**After /refine-prd completes:**

```
┌─────────────────────────────────────────────────┐
│ ✓ /refine-prd complete                          │
├─────────────────────────────────────────────────┤
│ Options:                                        │
│  [1] Continue to /review-prd (recommended)      │
│  [2] Re-run /refine-prd                         │
└─────────────────────────────────────────────────┘
```

**After /review-prd completes — SPAWN ORCHESTRATOR:**

```
┌─────────────────────────────────────────────────┐
│ ✓ /review-prd complete                          │
│ ✓ PRD is ready for the pipeline                 │
├─────────────────────────────────────────────────┤
│ Spawning orchestrator agent to coordinate       │
│ the remaining pipeline...                       │
└─────────────────────────────────────────────────┘
```

At this point, **spawn the orchestrator agent** (see "Spawning the Orchestrator" above). The orchestrator takes over navigation from here.

**Navigation during orchestrator phase** is handled by the orchestrator itself, which shows progress and asks for validation at each stage.

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

The workshop is **guided** — users don't need to remember commands. The pipeline has two phases:

### Phase 1: Human-Driven (Main Claude)

These steps run directly in the main Claude session with heavy human interaction:

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `/refine-prd` | Refine PRD with guided questions (auto-starts after "ready") |
| 2 | `/review-prd` | Walk through open questions, gather answers |

### Phase 2: Orchestrator-Driven (Agent Team)

After `/review-prd` completes, the main session creates an Agent Team and spawns the **orchestrator as a persistent teammate** to coordinate the remaining pipeline:

| Step | Stage | Teammate Spawned by Orchestrator |
|------|-------|----------------------------------|
| 3 | Prototype UI (optional) | (direct or planning-agent) |
| 4 | Execution Plan | planning-agent |
| 5 | Requirements | requirements-agent |
| 6 | Technical Design | design-agent |
| 7 | User Stories | story-generator |
| 8 | Validation | (direct) |

The orchestrator (persistent teammate):
- Reads state from memory-bank and docs/
- Determines what stage is next
- Spawns the appropriate teammate using the Task tool with `team_name`
- Reviews teammate output for quality
- Messages the team lead (main session) when human validation is needed
- The team lead relays to the human and sends the response back
- Updates memory-bank via memory-agent
- Continues to next stage

**Human is still in the loop** — the orchestrator messages the team lead with outputs, the team lead presents to the human, and relays validation before the orchestrator proceeds.

### Spawning the Orchestrator

After `/review-prd` passes its readiness check, the main session becomes the **team lead** and spawns the orchestrator as a **persistent teammate**:

```
1. Create the team:
   TeamCreate:
     team_name: "workshop-pipeline"
     description: "PRD to implementation pipeline for Nordstrom Supply Chain"
   → Note the team_name in the result (it may differ from your input)

2. Spawn the orchestrator as a persistent teammate:
   Task tool:
     subagent_type: "orchestrator"
     team_name: "<team_name from TeamCreate result>"
     name: "orchestrator"
     prompt: "You are the orchestrator teammate for team <team_name>.
              The PRD for {project-name} has been refined and reviewed.
              Assess the current state and coordinate the remaining pipeline
              (prototype → plan → requirements → design → stories → validation).
              The project PRD is at: projects/{project-name}/prd.md
              Use this team_name for all Task tool calls: <team_name>"
     description: "Coordinate remaining pipeline"
```

**Why the main session is team lead, not the orchestrator:**
- `TeamCreate` designates its caller as team lead — only the main session can do this
- The main session is the only process that directly interacts with the human
- The orchestrator is spawned as a persistent teammate (via `Task` with `team_name`) so it stays alive across pipeline stages, receives messages, and can spawn other teammates
- The orchestrator messages the team lead when it needs human validation; the team lead relays to the human

The orchestrator will take over coordination from there, spawning teammates as needed and messaging the team lead to keep the human in the loop.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `.claude/agents/` | Agent teammate definitions (orchestrator, planning, requirements, stories, scanner, memory) |
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

- **CODE IS THE SOURCE OF TRUTH** — Never assess a codebase without reading the actual code. Documentation lies; code doesn't.
- **Never commit secrets, credentials, or PII** to this repository
- **Always validate agent outputs** — agents make mistakes, humans catch them
- **Memory bank is the source of truth** for project context — keep it updated
- **This repo is for learning** — encourage experimentation and iteration
