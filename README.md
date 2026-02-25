# Agentic AI Workshop — From Requirements to Implementation

A hands-on workshop repository for Nordstrom Supply Chain engineering squads. Go from PRD to user stories to technical design using agentic AI workflows powered by Claude Code.

## What This Is

This repo provides a pre-built system of specialized AI agents that collaborate through shared memory to help engineering squads:

1. **Plan** — Break down a PRD into phased execution plans
2. **Extract Requirements** — Generate structured, traceable requirements (BR/TR/FR/NFR)
3. **Write Stories** — Produce sprint-ready user stories with acceptance criteria
4. **Scan Code** — Analyze existing repos for patterns, tech debt, and standards compliance
5. **Design** — Create detailed technical design documents
6. **Validate** — Cross-check stories against requirements for gaps

**This is human-in-the-loop.** Agents assist — engineers decide. Every output is reviewed and validated by the squad before moving to the next stage.

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd agentic-ai-workshop

# 2. Open Claude Code in the repo directory
claude

# 3. Start refining your PRD
/refine-prd projects/rto-compliance/prd.md   # or scan-compliance or infra-delivery

# 4. Preview the UI (optional but recommended for front-end apps)
/prototype-ui projects/rto-compliance/prd.md  # opens at localhost:5173

# 5. Once PRD is solid, run the pipeline
/generate-plan           # Generate execution plan from PRD
/extract-requirements    # Extract structured requirements
/generate-stories        # Generate sprint-ready user stories
/generate-design         # Create technical design document
/validate-coverage       # Cross-check everything for gaps

# 5. Review, iterate, and refine at each step
```

---

## Slash Commands

| Command | What It Does |
|---------|-------------|
| `/refine-prd <path>` | **Start here.** Assesses PRD completeness, asks targeted questions to fill gaps, updates the PRD and memory bank as you refine. Tells you when the PRD is ready for the next stage. |
| `/review-prd <path>` | Walks through every open question in the PRD one by one, gathers your answers, suggests defaults where possible, and updates the PRD and memory bank. Tells you when no blocking questions remain. |
| `/prototype-ui <path>` | Generates a working React prototype from PRD workflows with mock data, role switcher, and interactive pages. Launches in browser at localhost:5173. |
| `/generate-plan` | Reads the PRD and generates a phased execution plan with milestones, work packages, dependencies, and effort estimates |
| `/extract-requirements` | Processes the PRD into structured requirements: Business (BR), Technical (TR), Functional (FR), Non-Functional (NFR) — including mandatory Nordstrom engineering standards |
| `/generate-stories` | Translates requirements into sprint-ready user stories with Given/When/Then acceptance criteria, technical notes, and story point estimates |
| `/scan-codebase <path>` | Analyzes an existing codebase for tech stack, architecture, API patterns, security, tech debt, and Nordstrom standards compliance |
| `/manage-memory` | Views or updates the shared memory bank that persists context across all agents |
| `/generate-design` | Generates a detailed technical design covering architecture, APIs, data model, security, observability, and deployment |
| `/validate-coverage` | Cross-checks user stories against requirements — finds gaps, orphan stories, weak acceptance criteria, and unaddressed NFRs |

All commands accept additional arguments for context. Example: `/generate-plan focus on security and auth first`

---

## Agent Architecture

The system uses a **two-phase architecture**:

### Phase 1: Human-Driven (Main Claude)
```
┌──────────────────────────────────────────────────────────┐
│                    Main Claude                            │
│  Setup · Project Selection · /refine-prd · /review-prd    │
└──────────────────────────────────────────────────────────┘
```

### Phase 2: Orchestrator-Driven (After PRD is ready)
```
┌──────────────────────────────────────────────────────────┐
│                 Orchestrator Agent                        │
│    Reads state · Spawns subagents · Reviews output        │
│         Presents to human · Updates memory                │
├──────────┬───────────┬──────────┬──────────┬────────────┤
│ Planning │Requirements│  Story   │   Code   │  Memory    │
│  Agent   │   Agent   │Generator │ Scanner  │  Agent     │
│          │           │          │          │            │
│ PRD →    │ PRD →     │ Reqs →   │ Code →   │ Reads/     │
│ Phases & │ BR/TR/    │ Epics &  │ Analysis │ writes     │
│ Milestones│ FR/NFR   │ Stories  │ & Gaps   │ context    │
├──────────┴───────────┴──────────┴──────────┴────────────┤
│                  Shared Memory Bank                       │
│   projectbrief · productContext · techContext              │
│   systemPatterns · activeContext · progress                │
├──────────────────────────────────────────────────────────┤
│                MCP Server Integrations                    │
│  Jira · Confluence · GitHub · ServiceNow · Schema Repo    │
│              Aha! · Slack (read-only)                     │
└──────────────────────────────────────────────────────────┘
```

After `/refine-prd` and `/review-prd` complete, the **orchestrator agent** is spawned to coordinate the remaining pipeline. The orchestrator:
- Reads state from memory-bank and docs/
- Spawns specialized subagents (planning-agent, requirements-agent, etc.) using the Task tool
- Reviews subagent output for quality
- Presents to human for validation before proceeding
- Updates memory-bank after each stage

Each subagent is a Claude Code subprocess with:
- A defined purpose and set of tools
- A detailed system prompt with output format specifications
- Access to the shared memory bank for context

---

## Memory Bank

The memory bank (`memory-bank/`) is shared persistent context that all agents read from and write to:

| File | Purpose |
|------|---------|
| `projectbrief.md` | Vision, goals, scope, target users, success metrics |
| `productContext.md` | Problem statement, user personas, business context |
| `techContext.md` | Tech stack, infrastructure, integrations, constraints |
| `systemPatterns.md` | Architecture decisions, design patterns, API conventions |
| `activeContext.md` | Current focus, recent decisions, open questions, blockers |
| `progress.md` | What's completed, in progress, blocked, and up next |

The memory bank is updated after every pipeline stage. Use `/memory` to view or manually update it.

---

## Workshop Projects

Three pre-built PRDs are included for squads to work with:

### 1. RTO Compliance (`projects/rto-compliance/`)
A Return-to-Office compliance tracking application. Employees submit daily status, managers approve/reject, leadership views dashboards.
- **Tech:** React, Java/Spring Boot, PostgreSQL, Kafka
- **Focus:** Full-stack application with RBAC, org hierarchy integration, reporting

### 2. Scan Compliance (`projects/scan-compliance/`)
An outbound scan compliance tracker for fulfillment centers. Real-time visibility into whether pallets/LPNs were scanned during trailer loading.
- **Tech:** React, Node.js, PostgreSQL, Redis, Kafka, WebSocket
- **Focus:** Event-driven architecture, real-time dashboards, remediation workflows

### 3. Infrastructure & Delivery (`projects/infra-delivery/`)
A documentation and gap analysis project. Connect Kafka schemas, Splunk queries, GitHub repos, Confluence docs, and Jira stories to produce a complete infrastructure view.
- **Tech:** Varies by target application
- **Focus:** Discovery, gap analysis against standards, documentation, story generation

---

## MCP Server Setup

MCP (Model Context Protocol) servers provide Claude Code with access to external systems. Run the setup script to configure all servers:

```bash
./scripts/setup-mcp-servers.sh
```

**Required environment variables:**
- `JIRA_PAT` — Jira Personal Access Token
- `CONFLUENCE_PAT` — Confluence Personal Access Token
- `GITHUB_PAT` — GitHub Personal Access Token (with SSO authorization)
- `AHA_API_TOKEN` — Aha! API Token
- `SERVICENOW_USERNAME` / `SERVICENOW_PASSWORD` — CI pipeline service account

See [docs/mcp-server-setup.md](docs/mcp-server-setup.md) for detailed setup instructions and troubleshooting.

---

## Pre-Workshop Checklist (Facilitators)

### Environment Setup
- [ ] Repository cloned and accessible to all squads
- [ ] Claude Code installed and authenticated for all participants
- [ ] MCP servers configured via `./scripts/setup-mcp-servers.sh`:
  - [ ] Jira MCP — can create/read stories and epics
  - [ ] Confluence MCP — can read/write pages
  - [ ] GitHub MCP — can read/write repositories
  - [ ] ServiceNow MCP — can query incidents/changes (read-only)
  - [ ] Schema Repo MCP — can browse Kafka schemas
  - [ ] Aha! MCP — can access roadmap
  - [ ] Slack MCP — can read messages (read-only)

### Content Preparation
- [ ] Review all three project PRDs — customize for your squads if needed
- [ ] Assign squads to projects (or let them choose)
- [ ] Pre-fill `memory-bank/projectbrief.md` if squads have existing context
- [ ] Verify engineering standards in `.claude/skills/nordstrom-engineering-standards.md` are current

### Logistics
- [ ] 3-hour block reserved with no hard stop
- [ ] Screen sharing available for demos
- [ ] Slack channel for squad communication and facilitator support
- [ ] Printed or shared quick-reference card with slash commands

### Dry Run
- [ ] Run through `/refine-prd` → `/generate-plan` → `/extract-requirements` → `/generate-stories` → `/validate-coverage` on one project
- [ ] Verify agents produce reasonable output
- [ ] Note any common issues or questions to address upfront

---

## Squad Workflow

```
                    ┌─────────────────────────┐
                    │    Choose Project PRD    │
                    │  (or bring your own!)    │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   /refine-prd <path>     │
                    │  Assess, refine, iterate │◄──── Human answers questions,
                    │  Memory bank auto-updated│      provides context, decides
                    └───────────┬─────────────┘
                                │ (repeat until ready)
                    ┌───────────▼─────────────┐
                    │   /review-prd <path>     │
                    │  Walk through open Qs    │◄──── Human answers or assumes
                    │  Update PRD + memory     │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   /prototype-ui          │
                    │  Generate React proto    │◄──── Squad previews in browser,
                    │  Launch at localhost     │      feeds UX insights back
                    └───────────┬─────────────┘
                                │ (optional, for UI apps)
                    ┌───────────▼─────────────┐
                    │   /generate-plan         │
                    │  Generate execution plan │───── Human validates phases
                    └───────────┬─────────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │ (optional)       │                   │
    ┌────────▼────────┐        │                   │
    │ /scan-codebase  │        │                   │
    │  Analyze code   │────────┘                   │
    └─────────────────┘                            │
                    ┌───────────▼─────────────┐    │
                    │  /extract-requirements   │    │
                    │  Extract BR/TR/FR/NFR    │───── Human reviews requirements
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │  /generate-stories       │
                    │  Generate user stories   │───── Human reviews stories
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │  /generate-design        │
                    │  Technical design doc    │───── Human reviews design
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │  /validate-coverage      │
                    │  Cross-check everything  │───── Human reviews gaps
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Iterate as needed      │
                    │  Fix gaps, refine, done! │
                    └─────────────────────────┘
```

At every step: **review the output, provide feedback, iterate.** The agents are assistants, not decision-makers.

---

## Directory Structure

```
agentic-ai-workshop/
├── CLAUDE.md                          # Project instructions for Claude Code
├── README.md                          # This file
├── .gitignore
├── .claude/
│   ├── settings.json                  # Hooks configuration
│   ├── agents/                        # Subagent definitions
│   │   ├── orchestrator.md            # Pipeline coordinator (spawns other agents)
│   │   ├── planning-agent.md          # PRD → execution plan
│   │   ├── requirements-agent.md      # PRD → structured requirements
│   │   ├── story-generator.md         # Requirements → user stories
│   │   ├── code-scanner.md            # Codebase → analysis report
│   │   └── memory-agent.md            # Memory bank maintenance
│   ├── commands/                      # Slash commands
│   │   ├── refine-prd.md             # /refine-prd (start here)
│   │   ├── review-prd.md             # /review-prd (open questions)
│   │   ├── prototype-ui.md           # /prototype-ui (browser preview)
│   │   ├── generate-plan.md          # /generate-plan
│   │   ├── extract-requirements.md   # /extract-requirements
│   │   ├── generate-stories.md       # /generate-stories
│   │   ├── scan-codebase.md          # /scan-codebase
│   │   ├── manage-memory.md          # /manage-memory
│   │   ├── generate-design.md        # /generate-design
│   │   └── validate-coverage.md      # /validate-coverage
│   └── skills/                        # Reusable knowledge
│       ├── nordstrom-engineering-standards.md
│       └── requirements-writing.md
├── memory-bank/                       # Shared persistent context
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── techContext.md
│   ├── systemPatterns.md
│   ├── activeContext.md
│   └── progress.md
├── templates/
│   └── prd-template.md                # Blank PRD template
├── docs/                              # Generated outputs (initially empty)
└── projects/
    ├── rto-compliance/
    │   └── prd.md                     # RTO Compliance App PRD
    ├── scan-compliance/
    │   └── prd.md                     # Outbound Scan Compliance PRD
    └── infra-delivery/
        └── prd.md                     # Infrastructure & Delivery PRD
```
