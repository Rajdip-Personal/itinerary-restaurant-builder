# CLAUDE.md — Agentic AI Workshop

## Project Overview

This is an **Agentic AI Workshop** repository for **Nordstrom Supply Chain engineering**. It provides a pre-built orchestrator pattern where specialized Claude Code agents collaborate through shared memory to take engineering squads from PRD → requirements → technical design → user stories → validation → implementation in a 3-hour hands-on workshop.

**This is human-in-the-loop, NOT fully automated.** Engineers provide context, answer questions, and validate outputs at every step. Agents assist — they do not decide.<<<img src="">

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
1. Check the user's git config - is it configured for HTTPS or SSH
2. Clone the repo according to the git config
3. Analysis MUST use local file system operations (Read, Glob, Grep)
4. If SSH clone fails, the analysis STOPS — do not attempt API-based or HTTPS workarounds
5. The same applies for HTTPS. If it fails, STOP and report to the user — do not attempt SSH or API-based workarounds
6. All findings MUST reference specific files and line numbers in the actual code

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

### MCP SERVERS ARE THE ONLY PATH TO EXTERNAL DATA (MANDATORY)

**When a task requires data from Jira, Confluence, GitHub, Aha!, ServiceNow, Slack, Nordstrom Standards Chat, or GitLab, the corresponding MCP server tool MUST be used. No alternative approaches are permitted.**

| Data Source | Required MCP Server | Forbidden Alternatives |
|-------------|--------------------|-----------------------|
| Jira | `mcp__jira-mcp__*` tools | `curl`, REST API calls, web scraping |
| Confluence | `mcp__confluence-mcp__*` tools | `curl`, REST API calls, web scraping |
| GitHub | `mcp__github__*` tools | `curl`, `gh` CLI, REST API calls |
| Aha! | `mcp__aha-mcp__*` tools | `curl`, REST API calls |
| ServiceNow | `mcp__servicenow__*` tools | `curl`, REST API calls |
| Slack | `mcp__nordstrom-slack__*` tools | `curl`, Slack API calls |
| Schema Repo | `mcp__nordstrom-schema-repo__*` tools | `curl`, REST API calls |
| Standards Chat | `mcp__nordstrom-standards-chat__*` tools | `curl`, REST API calls |
| MAWM Data | `mcp__mawm-data__*` tools | `curl`, direct MySQL connections |
| GitLab | `gitlab-api-access` skill | `curl`, REST API calls |

**Why this is non-negotiable:**
- MCP servers handle authentication, pagination, and error handling correctly
- Alternative approaches bypass security controls and audit trails
- If an MCP server is not connected, the operation CANNOT proceed — this is by design
- The user was warned at startup about missing servers and chose to continue

**If an MCP server call fails during the workflow:**
1. Report the error to the user
2. Explain that the MCP server for [service] is not connected/configured
3. Do NOT attempt to use `curl`, REST APIs, `gh` CLI, or any other workaround to get the same data
4. The workflow stops for that data source — the user must fix the MCP server configuration

**For all other data sources** (websites, public APIs, internal services not listed above, etc.), Claude is free to use any available tool — Claude skill, `curl`, `WebFetch`, `Bash`, or any other approach that works.

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
PHASE 1: Human-Driven (Main Claude)
  Setup → Project Selection → /refine-prd → /review-prd
                          │
                          ▼
PHASE 2: Agent Team (Main Claude = Team Lead)
  ┌─ Team Lead (main session) ─────────────────────────┐
  │  Creates team · Spawns orchestrator                 │
  │  Relays human input/validation                      │
  └──────────────────┬──────────────────────────────────┘
                SendMessage
  ┌──────────────────┴──────────────────────────────────┐
  │  Orchestrator (persistent teammate)                  │
  │  Spawns & coordinates all teammates                  │
  │  Reviews outputs · Messages team-lead for validation │
  └──────────────────┬──────────────────────────────────┘
            Task + SendMessage
  ┌──────────────────┴──────────────────────────────────┐
  │  Teammates (all persist, communicate via SendMessage)│
  │  Memory · Planning · Requirements · Design           │
  │  Story Generator · Code Scanner · Jira Agent         │
  │  Sprint Agent → Coding Agent 1..N                    │
  └─────────────────────────────────────────────────────┘
  Human validates at each stage before team proceeds
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  Shared Memory Bank (memory-agent writes, others read)│
  │  MCP Servers: Jira·Confluence·GitHub·Slack·Aha!      │
  │  ServiceNow·Schema Repo·Standards Chat·MAWM Data     │
  └─────────────────────────────────────────────────────┘
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
| **Nordstrom Standards Chat** | Query Nordstrom engineering standards |
| **MAWM Data** | Read-only access to FC 499 MAWM warehouse database (MySQL) |

### Verifying MCP Server Configuration

When the user asks about their Claude Code setup or MCP server configuration, use these commands to check:

**1. List MCP servers at user scope:**
```bash
bash scripts/check-mcp-config.sh
```
This script is pre-allowed in `.claude/settings.json` so it runs without permission prompts.

**2. Check environment variables for MCP authentication:**
```bash
bash scripts/check-env.sh
```
This script is pre-allowed in `.claude/settings.json` so it runs without permission prompts.

**Key locations:**
- `~/.claude.json` — Main Claude Code config (contains `mcpServers` at user scope)
- `~/Library/Application Support/Claude/claude_desktop_config.json` — Claude Desktop app config (NOT Claude Code CLI)

**Important:** Do NOT confuse Claude Desktop config with Claude Code CLI config. They are separate.

### Verifying MCP Server Connection Status

After checking configuration and environment variables, verify that MCP servers are actually running and responding by calling a lightweight health check tool for each. **Run all checks in parallel** for speed.

| MCP Server | Health Check Tool | Args |
|------------|------------------|------|
| `jira-mcp` | `mcp__jira-mcp__server_info` | _(none)_ |
| `confluence-mcp` | `mcp__confluence-mcp__server_info` | _(none)_ |
| `github` | `mcp__github__get_me` | _(none)_ |
| `aha-mcp` | `mcp__aha-mcp__search_documents` | `query: "test"` |
| `servicenow` | `mcp__servicenow__health_check` | _(none)_ |
| `nordstrom-slack` | `mcp__nordstrom-slack__get_channel_messages` | `channel_name: "general", limit: 1` |
| `nordstrom-schema-repo` | `mcp__nordstrom-schema-repo__list_domains` | _(none)_ |
| `nordstrom-standards-chat` | `mcp__nordstrom-standards-chat__search` | `query: "test"` |
| `mawm-data` | `mcp__mawm-data__get_table_list` | `schema_name: "default_receiving"` |

**Interpreting results:**
- **Success** (any valid response) → server is connected and authenticated
- **Error/timeout** → server is not running, not configured, or credentials are invalid
- Record each result as `Connected` or `Not Connected` for the status table

### MCP Servers

The following MCP servers are configured by the setup script. If any fail to connect, the workshop continues — steps that need an unavailable server will stop at that point.

| Server Key |
|------------|
| `jira` |
| `confluence-mcp` |
| `github` |
| `nordstrom-schema-repo` |
| `aha-mcp` |
| `servicenow` |
| `nordstrom-slack` |
| `nordstrom-standards-chat` |
| `mawm-data` |

### Required Environment Variables

The following environment variables **must** be set for MCP server authentication:

| Variable | Purpose |
|----------|---------|
| `JIRA_PAT` | Jira Personal Access Token |
| `CONFLUENCE_PAT` | Confluence Personal Access Token |
| `GITHUB_PAT` | GitHub Personal Access Token |
| `AHA_API_TOKEN` | Aha! API authentication |
| `SERVICENOW_USERNAME` | ServiceNow username |
| `SERVICENOW_PASSWORD` | ServiceNow password |
| `GITLAB_TOKEN` | GitLab API authentication (git.jwn.app) |
| `MAWM_USERNAME` | MAWM MySQL database username (FC 499 warehouse data) |
| `MAWM_PASSWORD` | MAWM MySQL database password |
| `ARTIFACTORY_USER` | Artifactory username (required for ServiceNow MCP local setup) |
| `ARTIFACTORY_API_KEY` | Artifactory API key (required for ServiceNow MCP local setup) |

**How to set environment variables:**

Add these to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export JIRA_PAT="your-jira-token"
export CONFLUENCE_PAT="your-confluence-token"
export GITHUB_PAT="your-github-pat"
export AHA_API_TOKEN="your-aha-token"
export SERVICENOW_USERNAME="your-servicenow-username"
export SERVICENOW_PASSWORD="your-servicenow-password"
export GITLAB_TOKEN="your-gitlab-token"
export MAWM_USERNAME="your-mawm-mysql-username"
export MAWM_PASSWORD="your-mawm-mysql-password"
export ARTIFACTORY_USER="your-lanid"
export ARTIFACTORY_API_KEY="your-artifactory-api-key"
```

Then reload your shell: `source ~/.zshrc` (or restart your terminal).

### Setup Check Protocol

For the full setup check protocol (MCP server verification, environment variables, health checks, team setup, and branch creation), read `docs/setup-protocol.md`. That file contains Steps 1-6: config checks, env var checks, health check table, status table format, remediation steps, team name prompt, and branch creation.

### Project Selection (Step 7)

After setup is complete, proceed to project selection:

13. Scan `projects/` directory for subdirectories containing `prd.md` (use `Glob("projects/*/prd.md")`, NOT bash `ls` or `find`)
14. **Use `AskUserQuestion`** to ask project selection. Dynamically build options from the projects found in step 13, plus always include a "Create my own project" option:
    ```
    AskUserQuestion:
      questions:
        - question: "Which project is your team working on? Select a pre-built project or create your own."
          header: "Project"
          multiSelect: false
          options:
            - label: "RTO Compliance UI"
              description: "Full-stack RTO compliance tracking app with dashboards"
            - label: "RTO Compliance CLI"
              description: "CLI tool for managers to analyze RTO compliance CSV data"
            - label: "Calculator CLI"
              description: "Simple CLI calculator — parse and evaluate math expressions"
            - label: "Infrastructure & Delivery"
              description: "Document infrastructure and generate compliance stories"
            - label: "Create my own project"
              description: "Start a new custom project with your own PRD"
    ```
15. **CRITICAL — Handling the user's response:**
    - If the user selects one of the **pre-built project options by label** (exact match) → use that project
    - If the user selects **"Create my own project"** OR types **any freeform text in "Other"** → treat it as a **custom project**. Do NOT map freeform text to an existing project. If the user typed a name, that is their custom project name.
    - **Never assume freeform input refers to an existing project.** "RTO POC" ≠ "RTO Compliance UI". "RTO Tool" ≠ "RTO Compliance CLI". Only exact label matches select pre-built projects.

**Handling Custom Projects:**

16. If the user chose to create a custom project:
    a. Use the freeform text as the project name (if provided), or ask for a project name
    b. Sanitize the name for a directory: lowercase, replace spaces with hyphens, remove special characters
    c. Create the project directory: `projects/{sanitized-name}/`
    d. Ask the user how they want to provide the PRD:
       ```
       AskUserQuestion:
         questions:
           - question: "How would you like to set up your PRD?"
             header: "PRD Source"
             multiSelect: false
             options:
               - label: "Start from the PRD template (Recommended)"
                 description: "Copy the workshop PRD template and customize it during /refine-prd"
               - label: "Start from an existing project's PRD"
                 description: "Copy one of the pre-built project PRDs as a starting point"
               - label: "I'll paste my own PRD content"
                 description: "Provide your own PRD text to use as the starting point"
       ```
    e. Based on the response:
       - **Template:** Copy `templates/prd-template.md` (if it exists) to `projects/{name}/prd.md`, or create a minimal PRD skeleton
       - **Existing project:** Ask which project to copy from, then copy that `prd.md` to `projects/{name}/prd.md`
       - **Own content:** Ask the user to paste their PRD, then write it to `projects/{name}/prd.md`
    f. Continue to the PRD Reading Step below

**After User Selects Project — PRD Reading Step (MANDATORY):**

17. **Present the PRD for team reading:**
    - Read the selected project's `prd.md` file
    - Display a **clearly labeled summary** (brief table with Vision, Problem, Deliverables, Open Questions count)
    - **HIGHLY ENCOURAGE** the team to read the full PRD — but verify it's on GitHub first:
      1. Check if the branch exists on the remote: `git ls-remote --heads origin team-{name}`
      2. If the branch exists, check the file exists and matches local: `git diff origin/team-{name} -- projects/{project-name}/prd.md`
      - **If both pass** (branch pushed, file exists on remote, diff is empty): provide the GitHub URL: `https://github.com/Nordstrom-Sandbox/agentic-ai-workshop/blob/team-{name}/projects/{project-name}/prd.md`
      - **If any check fails** (branch not pushed, file missing from remote, or local version differs): do NOT display a GitHub URL. Instead say: "The PRD has not been pushed to GitHub yet. Please read it locally at `projects/{project-name}/prd.md`."
    - Say: "When everyone has read the PRD, type **ready** to continue."
    - **STOP and WAIT** for the user to type "ready"
    - Do NOT proceed, offer suggestions, or show workflow commands until the user types "ready"
    - This is a deliberate human-in-the-loop pause to ensure the team understands the project before refinement begins

18. **After user types "ready":**
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

### Commit and Push After Each Step (MANDATORY)

**After every pipeline step completes, commit all changes and push the team branch to GitHub.** This preserves work and lets team members review artifacts.

**When to commit+push:**
- After `/refine-prd` completes (readiness check passes)
- After `/review-prd` completes (all questions addressed)
- After each orchestrator stage completes (plan, requirements, design, stories, validation)
- After implementation milestones (sprint-agent manages its own pushes to the implementation repo)

**How:**
1. Stage all changed files: `git add projects/ memory-bank/ docs/` (only workshop artifacts — never `.env` or credentials)
2. Commit with a descriptive message: `"Complete /refine-prd for {project-name}"` or `"Complete /review-prd — all open questions resolved"`
3. Push the team branch: `git push origin team-{name}`
4. If the push fails because the remote branch doesn't exist yet: `git push -u origin team-{name}`

**What gets committed:**
- `projects/{name}/prd.md` — PRD updates
- `memory-bank/` — All memory bank files
- `docs/` — Generated plans, requirements, designs, stories, reports
- Any other workshop artifacts created during the step

**What NEVER gets committed:**
- `.env` files, credentials, secrets, API tokens
- `node_modules/`, `__pycache__/`, `.venv/`, or other dependency directories
- Large binary files

**The orchestrator and its teammates should also commit+push** after each stage they complete. Include this instruction when spawning the orchestrator.

**Final commit+push after team shutdown (MANDATORY):**

After all agents have shut down and the team is being deleted, the team lead MUST do one final check:
1. Run `git status` to check for any uncommitted changes (agents may have written files between the last commit and shutdown)
2. If there are changes: stage, commit, and push them
3. Only declare the project complete after confirming the working tree is clean and pushed

This catches late writes from agents that finish after the team lead's last commit (e.g., memory-agent recording final state, jira-agent writing final status updates).

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
| `/implement` | Start the implementation phase — sprint agent spawns coding agents to implement stories |

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
| 8b | Jira Sync (mandatory) | jira-agent |
| 9 | Implementation | sprint-agent → coding-agent(s) |

The orchestrator (persistent teammate):
- Reads state from memory-bank and docs/
- Determines what stage is next
- Spawns the appropriate teammate using the Task tool with `team_name`
- Reviews teammate output for quality
- Messages the team lead (main session) when human validation is needed
- The team lead relays to the human and sends the response back
- Updates memory-bank via memory-agent
- Continues to next stage

For the Jira sync stage (mandatory), the orchestrator spawns the **jira-agent** after stories are validated and approved. The jira-agent creates epics and stories in Jira from the validated story files. It stays alive during implementation to receive status updates from the sprint-agent. **Jira sync must complete before implementation begins.**

For the implementation stage, the orchestrator spawns the **sprint-agent**, which then coordinates:
- **Sprint Agent** — reads stories and execution plan, builds implementation queue, sequences work by dependencies, presents each story to the human for approval (messages team-lead directly), requests coding agent spawns from orchestrator. After bootstrap, requests team-lead to create GitHub repo in Nordstrom-Sandbox and push. After each coding agent completes, merges the feature branch to main and pushes to GitHub individually (never batched). If `docs/jira-mapping.md` exists, sends status updates to jira-agent.
- **Coding Agent(s)** — each takes one story, creates a `feature/{story-id}` branch, implements code, writes tests, builds, and commits on the feature branch. Does NOT merge to main or push — the sprint-agent handles that. Tech-stack agnostic — reads the stack from the design doc. Uses embedded/in-memory infrastructure (no Docker required). Up to 2 coding agents can run in parallel for independent stories.

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
     mode: "bypassPermissions"
     prompt: "You are the orchestrator teammate for team <team_name>.
              The PRD for {project-name} has been refined and reviewed.
              Assess the current state and coordinate the remaining pipeline
              (prototype → plan → requirements → design → stories → validation).
              The project PRD is at: projects/{project-name}/prd.md
              Use this team_name for all Task tool calls: <team_name>
              IMPORTANT: Always use mode: bypassPermissions when spawning teammates."
     description: "Coordinate remaining pipeline"
```

### Team Lead Rules (MANDATORY)

**The team lead (main session) ONLY spawns the orchestrator.** All other teammates are spawned and managed by the orchestrator. This is non-negotiable.

| Action | Who Does It |
|--------|-------------|
| Create team (`TeamCreate`) | Team lead |
| Spawn orchestrator | Team lead |
| Spawn all other teammates (memory-agent, planning-agent, etc.) | **Orchestrator only** |
| Shut down and respawn teammates | **Orchestrator only** |
| Message teammates with task assignments | **Orchestrator only** |
| Message the orchestrator with human feedback/approvals | Team lead |
| Relay orchestrator output to the human | Team lead |
| Message team-lead with human approval requests (implementation phase) | **Sprint-agent** |
| Create GitHub repo via MCP (when sprint-agent requests it) | **Team lead** |
| Relay sprint-agent output to the human (implementation phase) | Team lead |

**If a teammate needs to be respawned** (e.g., to fix permissions), the team lead MUST message the orchestrator and ask it to handle the respawn. The team lead must NOT spawn teammates directly — doing so creates naming conflicts, breaks the orchestrator's coordination, and causes confusion about who manages whom.

**The team lead communicates with the orchestrator and the sprint-agent.** The orchestrator handles the pipeline stages (plan → requirements → design → stories → validation). The sprint-agent handles the implementation phase and messages the team lead directly for human approvals, repo creation, and progress updates. All other teammates coordinate through the orchestrator.

**Do NOT pre-fill decisions that agents are supposed to ask the human.** When relaying approval messages to teammates, only relay what the human actually said. Do not add details the human hasn't confirmed (e.g., repo names, file paths, technology choices). If an agent has a dedicated gate to ask the human for input, let that gate run — do not bypass it by providing the answer in advance.

**The team lead MUST NEVER write implementation code directly.** All code changes — no matter how small or few remain — must go through the Agent Teams pipeline (sprint-agent → coding-agents). If agents die from context loss or session interruption, recreate the team and respawn agents. Never take shortcuts by coding directly as team-lead. The team-lead's role is coordination and human relay, not implementation.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `.claude/agents/` | Agent teammate definitions (orchestrator, planning, requirements, stories, scanner, memory, sprint, coding, jira) |
| `.claude/commands/` | Slash command definitions (/plan, /requirements, /stories, etc.) |
| `.claude/skills/` | Reusable knowledge (engineering standards, requirements writing) |
| `memory-bank/` | Persistent shared context across all agents and sessions |
| `templates/` | PRD template and other starting documents |
| `docs/` | Generated outputs (plans, requirements, stories, designs, reports) |
| `prototype/` | UI prototype (Vite + React app) — standard location for `/prototype-ui` output |
| `projects/` | Project-specific PRDs and artifacts |

## Workshop Deployment Target: Local Only

**All applications built in this workshop run locally on the developer's machine.** This means:

- **PRDs must NOT include** CI/CD pipelines, Kubernetes deployment, container builds, Helm charts, or server-side infrastructure
- **PRDs must NOT include** Scalability sections (no horizontal scaling, no HPA, no multi-region)
- **NFRs should focus on:** security (auth, PII handling), performance (local response times), observability (logging, error messages), and code quality (tests, linting)
- **Infrastructure section** should say "Local only" — installation via package manager (pip, npm, etc.), no cloud deployment

The Nordstrom Engineering Standards below are reference material for production readiness. During the workshop, only the standards applicable to local development apply (security, logging, code quality). Deployment and monitoring standards are out of scope.

## Nordstrom Engineering Standards

All generated code, designs, and stories **must** adhere to Nordstrom engineering standards. Read `.claude/skills/nordstrom-engineering-standards.md` for the full reference (security, deployment, logging, monitoring, code quality). Any agent generating code, designs, or stories must read this file.

## Important Notes

- **CODE IS THE SOURCE OF TRUTH** — Never assess a codebase without reading the actual code. Documentation lies; code doesn't.
- **Never commit secrets, credentials, or PII** to this repository
- **Always validate agent outputs** — agents make mistakes, humans catch them
- **Memory bank is the source of truth** for project context — keep it updated
- **This repo is for learning** — encourage experimentation and iteration
