# Agentic AI Workshop — From Product Requirements Document (PRD) to Working Code

A hands-on workshop for Nordstrom Supply Chain engineering squads. Specialized AI agents collaborate through shared memory to take a PRD through requirements, design, planning, stories, and implementation — with human review and approval at every step.

**This is human-in-the-loop, not autopilot.** Agents assist — engineers decide.

---

## Quick Start

```bash
# 1. Clone the repository
git clone git@github.com:Nordstrom-Sandbox/agentic-ai-workshop.git
cd agentic-ai-workshop

# 2. First-time setup — configure MCP servers and install tmux
#    (Set environment variables first — see "MCP Server Setup" below)
./scripts/setup.sh

# 3. Start the workshop
./scripts/start-workshop.sh

# 4. Once in Claude, type: start
```

---

## The Flow

The workshop has 13 steps. Claude presents each step automatically — you don't memorize commands. Nothing moves forward without your approval.

```
  YOU START WITH                              YOU END WITH
  ──────────────────────                      ──────────────────────────
  A rough PRD (1-2 pages is fine)       --->  Refined PRD
                                              Structured requirements
                                              Technical design document
                                              Execution plan
                                              Sprint-ready user stories
                                              Jira epics and stories
                                              Working tested code in GitHub
```

### Flow Diagram

```
Step 1: Setup                        Step 2: Project              Step 3: Read PRD
┌──────────────────────┐             ┌─────────────────────┐      ┌─────────────────────┐
│ Agent: Claude         │             │ Agent: Claude        │      │ Agent: —             │
│ Input: environment    │             │ Input: projects/     │      │ Input: prd.md        │
│ Output: status table  │────────────>│ Output: selected     │─────>│ Output: —            │
│                       │             │         project      │      │                      │
│ Human: verify status, │             │ Human: choose project│      │ Human: read PRD with │
│   provide team name   │             │   or create custom   │      │   squad, type "ready"│
│                       │             │                      │      │                      │
│ Git: create branch    │             │ Iterate: no          │      │ GATE: waits for      │
│   team-{name}         │             └─────────────────────┘      │   "ready"            │
│   commit + push       │                                          └──────────┬──────────┘
│                       │                                                     │
│ Iterate: no           │                                                     │
└──────────────────────┘                                                      │
                                                                              │
                         ┌────────────────────────────────────────────────────┘
                         │
                         ▼
Step 4: Refine PRD                   Step 5: Review Questions
┌──────────────────────┐             ┌──────────────────────────┐
│ Agent: Claude         │             │ Agent: Claude             │
│ Input: prd.md,        │             │ Input: PRD open questions │
│        memory bank    │             │ Output: updated prd.md    │
│ Output: updated       │             │   (all questions answered)│
│   prd.md, updated     │────────────>│                           │
│   memory bank,        │             │ Human: answer each        │
│   readiness score     │             │   question or accept      │
│                       │             │   suggested default       │
│ Human: answer         │             │                           │
│   questions, provide  │             │ Git: commit + push        │
│   context, decide     │             │   (PRD + memory bank)     │
│                       │             │                           │
│ Git: commit + push    │             │ Iterate: yes — per        │
│   (PRD + memory bank) │             │   question, re-run if new │
│                       │             │   questions surface       │
│ Iterate: YES —        │             └─────────────┬────────────┘
│   repeats until       │                           │
│   readiness check     │◄──── loop                 │
│   passes              │     until ready           │
└──────────────────────┘                            │
                                                    ▼
                              ┌──────────────────────────────────┐
                              │  HANDOFF: Claude creates an       │
                              │  Agent Team — an Orchestrator      │
                              │  coordinates specialist agents     │
                              │  that persist and collaborate.     │
                              │  From here, agents generate;       │
                              │  you review and approve.           │
                              └──────────────────┬───────────────┘
                                                 │
          ┌──────────────────────────────────────┘
          │
          ▼
Step 6: Requirements                          Step 7: Technical Design
┌─────────────────────────────┐               ┌─────────────────────────────┐
│ Agent: requirements-agent    │               │ Agent: design-agent (x4      │
│ Input: prd.md,               │               │   parallel for speed)        │
│        memory bank           │               │ Input: prd.md, requirements, │
│ Output: docs/outputs/requirements-   │──── approve──>│   memory bank                │
│   bf.md (business+functional)│               │ Output: docs/outputs/design-*.md     │
│   docs/outputs/requirements-tn.md    │               │   (architecture, components, │
│   (technical+non-functional) │               │   data model, security,      │
│                              │               │   APIs, gap analysis)        │
│ Human: review requirements   │               │                              │
│   [approve] -> next step     │               │ Human: review design         │
│   [revise]  -> agent updates │               │   [approve] -> next step     │
│   [re-run]  -> regenerate    │               │   [revise]  -> agent updates │
│                              │               │   [re-run]  -> regenerate    │
│ Git: commit + push on        │               │                              │
│   approve (docs/ +           │               │ Git: commit + push on        │
│   memory-bank/)              │               │   approve (docs/ +           │
│                              │               │   memory-bank/)              │
│ Iterate: YES — revise loop   │               │                              │
└──────────────────────────────┘               │ Iterate: YES — revise loop   │
          ▲          │                         └──────────────┬───────────────┘
          └── revise─┘                                   ▲    │
                                                         └────┘ revise
                                               ┌──────────────┘
                                               │ approve
          ┌────────────────────────────────────┘
          │
          ▼
Step 8: Execution Plan
┌─────────────────────────────┐
│ Agent: design-agent (x4      │
│   parallel for speed)        │
│ Input: prd.md, requirements, │
│   plan, memory bank          │
│ Output: docs/outputs/design-*.md     │
│   (architecture, components, │
│   data model, security,      │
│   APIs, gap analysis)        │
│                              │
│ Human: review design         │
│   [approve] -> next step     │
│   [revise]  -> agent updates │
│   [re-run]  -> regenerate    │
│                              │
│ Git: commit + push on        │
│   approve (docs/ +           │
│   memory-bank/)              │
│                              │
│ Iterate: YES — revise loop   │
└──────────────┬───────────────┘
          ▲    │
          └────┘ revise
               │ approve
               ▼
Step 9: UI Prototype
┌─────────────────────────────┐
│ Agent: Claude (direct)       │
│ Input: prd.md, design docs   │
│ Output: working React app    │
│   at localhost:5173          │
│                              │
│ Human: click through app     │
│   with squad, give UX        │
│   feedback                   │
│                              │
│ Git: commit + push on        │
│   approve (prototype/)       │
│                              │
│ Iterate: YES — feedback loop │
│                              │
│ SKIP: if project has no UI   │
└──────────────┬───────────────┘
               │
               ▼
Step 10: User Stories                         Step 11: Validation
┌─────────────────────────────┐               ┌─────────────────────────────┐
│ Agent: story-generator (x4   │               │ Agent: orchestrator (x4      │
│   parallel, one per story phase)   │               │   validators in parallel)    │
│ Input: requirements, design, │               │ Input: stories, requirements,│
│   plan, memory bank          │               │   design, plan               │
│ Output: docs/outputs/stories-        │──── approve──>│ Output: docs/outputs/validation-     │
│   phase*.md (Given/When/Then │               │   phase*.md (coverage matrix,│
│   acceptance criteria, story │               │   gap analysis, quality      │
│   points, tech notes,        │               │   assessment)                │
│   requirement traceability)  │               │                              │
│                              │               │ Human: review gap report     │
│ Human: review stories        │               │   [approve] -> next step     │
│   [approve] -> next step     │               │   [fix gaps] -> agents       │
│   [revise]  -> agent updates │               │     iterate, re-validate     │
│   [re-run]  -> regenerate    │               │                              │
│                              │               │ Git: commit + push on        │
│ Git: commit + push on        │               │   approve (docs/ +           │
│   approve (docs/ +           │               │   memory-bank/)              │
│   memory-bank/)              │               │                              │
│                              │               │ Iterate: YES — fix + recheck │
│ Iterate: YES — revise loop   │               └──────────────┬──────────────┘
└──────────────────────────────┘                              │
          ▲          │                         ┌──────────────┘
          └── revise─┘                         │
                                               ▼
Step 12: Jira Sync                            Step 13: Implementation
┌─────────────────────────────┐               ┌─────────────────────────────┐
│ Agent: jira-agent            │               │ Agents: sprint-agent +       │
│ Input: validated stories     │               │   coding-agent(s) +          │
│ Output: Jira epics (1 per    │               │   jira-agent (status sync)   │
│   story phase) + stories,    │──── done ────>│ Input: stories, design,      │
│   docs/outputs/jira-mapping.md       │               │   plan, jira mapping         │
│                              │               │ Output: working code repo    │
│ Human: provide Jira project  │               │   with tests                 │
│   key (e.g., MYPROJ),        │               │                              │
│   verify stories in Jira     │               │ Human (repeated per story):  │
│                              │               │   1. approve queue order     │
│ Git: commit + push           │               │   2. provide GitHub repo name│
│   (docs/outputs/jira-mapping.md)     │               │   3. approve each story      │
│                              │               │      before coding starts    │
│ Iterate: no                  │               │   4. review code after each  │
└──────────────────────────────┘               │      story completes         │
                                               │   5. test app locally at end │
                                               │                              │
                                               │ GitHub: human creates repo   │
                                               │   (sprint-agent asks team-   │
                                               │   lead, team-lead asks you,  │
                                               │   you create it, type ready) │
                                               │                              │
                                               │ Git (per story):             │
                                               │   coding-agent: commit on    │
                                               │     feature/{story-id}       │
                                               │   sprint-agent: merge to     │
                                               │     main + push to GitHub    │
                                               │                              │
                                               │ Jira: auto-transitions       │
                                               │   In Progress -> Done        │
                                               │                              │
                                               │ Iterate: YES — per story.    │
                                               │   approve / skip / re-order  │
                                               │   Up to 2 coding agents      │
                                               │   run in parallel.           │
                                               └──────────────────────────────┘
```

### Step Reference

| # | Step | Description | Agent(s) | Human Role | Human Input | Human Approval | Output | Git/GitHub | Iterate? |
|---|------|-------------|----------|------------|-------------|---------------|--------|------------|----------|
| 1 | Setup | Verify environment is ready for the workshop | Claude | Engineer (driver) | team name | verify status | status table | **create `team-{name}` branch, commit + push** | no |
| 2 | Project Selection | Choose which project the team will build | Claude | Team (consensus) | choose project | — | selected project | — | no |
| 3 | Read PRD | Ensure the whole team understands the project before refinement begins | — | Team (everyone reads) | type "ready" | **gate** — blocked until "ready" | — | — | no |
| 4 | Refine PRD | Assess PRD completeness and fill gaps through guided Q&A | Claude | Product owner / domain expert | answer questions, provide business context, make scope decisions | readiness check | updated `prd.md`, updated memory bank | **commit + push** PRD + memory bank | **yes** — loop until ready |
| 5 | Review Questions | Resolve every remaining open question in the PRD | Claude | Product owner / domain expert | answer each question or accept default | all questions resolved | updated `prd.md` (finalized) | **commit + push** PRD + memory bank | **yes** — per question |
| 6 | Requirements | Extract structured, traceable requirements from the PRD | requirements-agent | Tech lead / product owner | — | **approve / revise / re-run** | `docs/outputs/requirements-*.md` | **commit + push** on approve | **yes** — revise loop |
| 7 | Technical Design | Define architecture, APIs, data model, security, and component design | design-agent (x4) | Architect / senior engineer | — | **approve / revise / re-run** | `docs/outputs/design-*.md` | **commit + push** on approve | **yes** — revise loop |
| 8 | Execution Plan | Break requirements and design into phased milestones and work packages | planning-agent | Tech lead / architect | — | **approve / revise / re-run** | `docs/outputs/execution-plan.md` | **commit + push** on approve | **yes** — revise loop |
| 9 | UI Prototype | Generate an interactive prototype for the team to validate UX *(UI projects only)* | Claude | Team (everyone clicks through) | UX feedback | **approve / iterate** | React app at localhost:5173 | **commit + push** on approve | **yes** — feedback loop |
| 10 | User Stories | Generate sprint-ready stories with acceptance criteria mapped to requirements | story-generator (x4) | Product owner / tech lead | — | **approve / revise / re-run** | `docs/outputs/stories-phase*.md` | **commit + push** on approve | **yes** — revise loop |
| 11 | Validation | Cross-check stories against requirements for coverage gaps and quality | orchestrator (x4) | Tech lead | — | **approve / fix gaps** | `docs/outputs/validation-phase*.md` | **commit + push** on approve | **yes** — fix + recheck |
| 12 | Jira Sync | Create epics and stories in Jira from validated story files | jira-agent | Any team member | Jira project key | verify in Jira | Jira epics + stories, `docs/outputs/jira-mapping.md` | **commit + push** mapping file | no |
| 13 | Implementation | Implement each story as working, tested code | sprint-agent, coding-agent(s) | Engineer (driver) + team (review) | approve queue, **create GitHub repo manually**, approve each story | **per-story approval** | code repo with tests | **human creates GitHub repo**; per story: commit on feature branch, **merge + push to main** | **yes** — per story |

**Key:**
- Every step that produces artifacts commits and pushes to the `team-{name}` branch. Step 13 creates a *separate* GitHub repo for the application code.
- Nothing moves to the next step without human approval.
- **Switch the driver** as steps change — the person best suited to review and approve each step's output should be at the keyboard.

---

## AI Roles

The flow is powered by a main Claude session and a team of specialist agents. You interact with one session — the agents are managed behind the scenes.

### Team Lead (main Claude session)

This is the Claude session you talk to directly. It handles Steps 1-5 itself (setup, project selection, PRD refinement). After Step 5, it becomes the **team lead** — it creates the agent team, spawns the orchestrator, and from that point acts as the relay between you and the agents. When an agent produces output that needs your approval, the team lead presents it to you. When you give feedback, the team lead relays it back.

**The team lead never writes implementation code.** All code goes through agents.

### Orchestrator

The orchestrator is the first agent spawned. It manages the agent team for Steps 6-13:
- **Spawns and despawns** specialist agents as each step requires them
- **Reviews agent output** for quality before presenting it to the team lead
- **Compiles outputs** from parallel agents (e.g., 4 design agents writing separate sections)
- **Tracks pipeline state** — knows which step is current, what's been approved, what's next
- **Routes revision feedback** — when you say "revise," the orchestrator sends your feedback to the right agent
- **Commits and pushes** artifacts to the team branch after each approved step

The orchestrator coordinates — it does not write documents, code, or designs itself.

### Specialist Agents

Each specialist agent is spawned by the orchestrator when its step begins and stays alive to handle revisions. Multiple agents of the same type can run in parallel for speed.

| Agent | Steps | What It Does | Parallelism |
|-------|-------|-------------|-------------|
| **orchestrator** | 6-13 (always running) | Coordinates the entire agent team. Spawns and despawns specialist agents, reviews output quality, compiles parallel results, routes revision feedback, tracks pipeline state, commits and pushes after each approved step. | 1 |
| **memory-agent** | 6-13 (always running) | Central authority for the shared memory bank once the Agent Team is running. All other agents send updates to it via messaging. During Steps 1-5, the main Claude session updates the memory bank directly. | 1 |
| **requirements-agent** | 6 | Extracts structured, traceable requirements from the PRD: Business (BR), Functional (FR), Technical (TR), Non-Functional (NFR). | 2 (split by category) |
| **design-agent** | 7 | Produces the technical design: architecture, component inventory, data model, API specs, security model, observability, and gap analysis. | 4 (split by section) |
| **planning-agent** | 8 | Reads the PRD, requirements, and design to generate a phased execution plan with milestones, work packages, dependency ordering, and effort estimates. | 1 |
| **story-generator** | 10 | Creates sprint-ready user stories with Given/When/Then acceptance criteria, story points, technical notes, and traceability to requirements and work packages. | 4 (split by phase) |
| **jira-agent** | 12-13 | Creates Jira epics (one per story phase) and stories from validated story files. Stays alive during implementation to receive status transitions (In Progress, Done) from the sprint-agent. | 1 |
| **sprint-agent** | 13 | Implementation coordinator. Builds an ordered queue from stories and the execution plan, presents each story to you for approval, requests coding-agent spawns from the orchestrator, merges completed feature branches to main, and pushes to GitHub. | 1 |
| **coding-agent** | 13 | Takes a single user story and produces working, tested code. Creates a `feature/{story-id}` branch, implements the code, writes tests, builds, and commits. Tech-stack agnostic — reads the stack from the design doc. | up to 2 in parallel |
| **code-scanner** | any (optional) | Analyzes an existing codebase for tech stack, architecture patterns, API conventions, security posture, tech debt, and Nordstrom standards compliance. Used when the project involves existing code. | 1 |

### How They Communicate

```
┌─────────┐        ┌──────────────┐        ┌───────────────────────────┐
│         │ review │              │ spawn  │                           │
│   YOU   │◄──────│  Team Lead   │───────►│  Orchestrator             │
│         │──────►│  (main       │◄───────│  - spawns/despawns agents │
│         │approve│   session)   │ output │  - reviews & compiles     │
│         │       │              │        │  - routes feedback        │
└─────────┘        └──────┬───────┘        └─────────┬─────────────────┘
                          │                          │ spawn + message
                          │                  ┌───────┴────────┐
                          │                  ▼                ▼
                   (asks human to    ┌─────────────┐  ┌─────────────┐
                    create repo)     │  Specialist  │  │  memory-    │
                                     │  Agents      │  │  agent      │
                                     │  (planning,  │  │  (always    │
                                     │  design,     │  │   running)  │
                                     │  stories,    │  └─────────────┘
                                     │  sprint,     │        ▲
                                     │  coding,     │        │
                                     │  jira, etc.) │────────┘
                                     └──────────────┘  memory updates
```

---

## Workshop Projects

Five pre-built PRDs are included. You can also create your own.

| Project | Directory | Complexity |
|---------|-----------|------------|
| **RTO Compliance UI** | `projects/rto-compliance-ui/` | High |
| **RTO Compliance CLI** | `projects/rto-compliance-cli/` | Medium |
| **Calculator CLI** | `projects/calculator-cli/` | Low — great for learning the flow |
| **Infrastructure & Delivery** | `projects/infra-delivery/` | Medium |
| **Scan Compliance** | `projects/scan-compliance/` | Medium |

---

## Memory Bank

The memory bank (`memory-bank/`) is shared persistent context updated after every step. During Steps 1-5, the main Claude session updates it directly. Once the Agent Team starts (Steps 6-13), the **memory-agent** takes over as the sole writer — all other agents send updates to it via messaging.

| File | Purpose |
|------|---------|
| `projectbrief.md` | Vision, goals, scope, target users, success metrics |
| `productContext.md` | Problem statement, user personas, business context |
| `techContext.md` | Tech stack, infrastructure, integrations, constraints |
| `systemPatterns.md` | Architecture decisions, design patterns, API conventions |
| `activeContext.md` | Current focus, recent decisions, open questions, blockers |
| `progress.md` | What's completed, in progress, blocked, and up next |

---

## Setup

Run the setup script to install dependencies and configure MCP servers:

```bash
./scripts/setup.sh
```

This script does three things:
1. **Installs tmux** — enables the multi-pane view where each agent gets its own pane so you can watch them work in parallel. Agent Teams still works without tmux, but you won't see individual agent panes.
2. **Configures iTerm2 split-pane** — optional, for iTerm2 users.
3. **Sets up MCP servers** — connects Claude to Jira, Confluence, GitHub, Slack, and other external systems. **Only Jira is required** for the workshop; everything else adds context but won't block the flow.

**Environment variables** must be set before running setup. At minimum, set `JIRA_PAT` (Jira Personal Access Token). The full list:

- `JIRA_PAT` — Jira Personal Access Token **(required)**
- `CONFLUENCE_PAT` — Confluence Personal Access Token
- `GITHUB_PAT` — GitHub Personal Access Token (with SSO authorization)
- `AHA_API_TOKEN` — Aha! API Token
- `SERVICENOW_USERNAME` / `SERVICENOW_PASSWORD` — CI pipeline service account
- `GITLAB_TOKEN` — GitLab Personal Access Token (git.jwn.app)
- `MAWM_USERNAME` / `MAWM_PASSWORD` — MAWM MySQL database credentials
- `ARTIFACTORY_USER` / `ARTIFACTORY_API_KEY` — Artifactory credentials (for ServiceNow MCP setup)

---

## Slash Commands Reference

The workshop flow runs automatically — you do not need to type these commands. They exist for manual use if you want to re-run a specific step outside the guided flow.

| Command | What It Does |
|---------|-------------|
| `/refine-prd` | Assess PRD completeness, ask targeted questions, update PRD and memory bank |
| `/review-prd` | Walk through open questions one by one, gather answers, update PRD |
| `/generate-plan` | Generate phased execution plan with milestones and work packages |
| `/extract-requirements` | Extract structured requirements (BR/TR/FR/NFR) |
| `/generate-design` | Generate technical design (architecture, APIs, data model, security) |
| `/prototype-ui` | Generate a working React prototype and launch at localhost:5173 |
| `/generate-stories` | Generate sprint-ready user stories with acceptance criteria |
| `/validate-coverage` | Cross-check stories against requirements for gaps |
| `/implement` | Start implementation — sprint-agent coordinates coding agents |
| `/scan-codebase` | Analyze existing codebase for patterns and architecture (optional) |
| `/manage-memory` | View or update the shared memory bank |
| `/setup-mcp-datasource` | Set up a FastMCP server for a custom data source (database, S3, or DynamoDB) |

---

## Quick Reference Cards

- **[Workshop Quick Reference](docs/quick-ref-participants.md)** — One-page card for workshop participants: superpowers, 13 steps, data sources, MCP servers, don't-panic guide
- **[Facilitator Quick Reference](docs/quick-ref-facilitators.md)** — For Sr 2s helping teams: pre-workshop checklist, troubleshooting, timing benchmark, known gaps

---

## Workshop Goals

**Ideal outcome:** Each team produces a working app or POC — code in GitHub, stories in Jira, all generated from a PRD in one session.

**Minimum outcome:** Each team completes through Step 12 — validated user stories synced to Jira, with a technical design and execution plan ready for implementation.

## Workshop Logistics

- **Rotate the driver.** The person best suited to review each step's output should be at the keyboard. Product owners drive Refine and Review PRD; architects and senior engineers drive Requirements, Technical Design, and Execution Plan; the whole team previews the UI Prototype; engineers drive Implementation.
- **Identify data sources early.** If the project depends on external data (APIs, databases, CSV exports), assign team members to determine sources and access methods as soon as possible. The sooner data sources are known, the better the requirements and design will incorporate them.
- **Each team should include an engineer familiar with the flow.** Where that's not possible, teams should have a way to reach one of the senior engineers who have run the flow before (Slack channel, same room, etc.).

## Pre-Workshop Checklist (Facilitators)

### Environment
- [ ] Repository cloned and accessible to all teams
- [ ] Claude Code installed and authenticated for all participants
- [ ] `./scripts/setup.sh` has been run (installs tmux, configures iTerm2 split-pane, sets up MCP servers)
- [ ] Environment variables set (see "MCP Server Setup" above)

### Content
- [ ] Review project PRDs — customize for your teams if needed
- [ ] Assign teams to projects (or let them choose)
- [ ] Verify engineering standards in `.claude/skills/nordstrom-engineering-standards.md` are current
- [ ] Printed or shared quick-reference cards ([Workshop](docs/quick-ref-participants.md), [Facilitator](docs/quick-ref-facilitators.md))

### Dry Run
- [ ] Run through the full flow on at least one project (Calculator CLI is quickest)
- [ ] Verify agents produce reasonable output at each step
- [ ] Note common issues or questions to address upfront

---

## Directory Structure

```
agentic-ai-workshop/
├── CLAUDE.md                           # Project instructions for Claude Code
├── README.md                           # This file
├── .claude/
│   ├── settings.json                   # Model, hooks, Agent Teams config
│   ├── agents/                         # Agent teammate definitions
│   │   ├── orchestrator.md             # Pipeline coordinator
│   │   ├── planning-agent.md           # PRD → execution plan
│   │   ├── requirements-agent.md       # PRD → structured requirements
│   │   ├── design-agent.md             # Requirements → technical design
│   │   ├── story-generator.md          # Requirements + design → user stories
│   │   ├── sprint-agent.md             # Stories → implementation queue
│   │   ├── coding-agent.md             # Story → working tested code
│   │   ├── jira-agent.md               # Stories → Jira epics & issues
│   │   ├── code-scanner.md             # Codebase → analysis report
│   │   ├── merge-agent.md              # Combine parallel outputs
│   │   └── memory-agent.md             # Memory bank maintenance
│   ├── commands/                       # Slash command definitions
│   └── skills/                         # Reusable knowledge
│       ├── nordstrom-engineering-standards.md
│       ├── requirements-writing.md
│       └── rapid-prototyping.md
├── memory-bank/                        # Shared persistent context (6 files)
├── templates/
│   └── prd-template.md                 # Blank PRD template
├── docs/                               # Generated outputs (initially empty)
└── projects/                           # Pre-built project PRDs
    ├── rto-compliance-ui/prd.md
    ├── rto-compliance-cli/prd.md
    ├── calculator-cli/prd.md
    ├── infra-delivery/prd.md
    └── scan-compliance/prd.md
```
