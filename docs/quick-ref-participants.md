# Workshop Quick Reference

**What you're doing:** Taking a product idea from PRD to working, tested code — AI agents do the heavy lifting, your team makes every decision.


---

## Getting Started

```bash
./scripts/start-workshop.sh
```

Once Claude is ready, type: **`start`**

Claude guides you from here. You don't need to memorize commands.

---

## Your Three Superpowers

### 1. Approve, Revise, or Re-run
After every step, Claude asks for your verdict. Tell it to move forward, revise with your feedback, or re-run the step from scratch.

### 2. Talk to Claude Anytime
**You are never locked into a menu.** Press **ESC** at any point — mid-step, mid-question, mid-anything — and just type. Ask a question. Change your mind. Give new context. Disagree. When you're done, type `resume flow`.

### 3. Read Before You Approve
Every doc is saved in `docs/` and pushed to GitHub after each step. Open your team's branch — replace `{name}` with your team name:
`https://github.com/Nordstrom-Sandbox/agentic-ai-workshop/tree/team-{name}`

---

## Don't Panic

| What You See | What To Do |
|-------------|------------|
| Claude asks to approve a file edit | Just approve it — this is tactical, not a step approval |
| Nothing happening for 2+ minutes | Ask your facilitator |
| Output seems confused | Ask your facilitator |
| Claude re-asks something you answered | Just answer again |

---

## The 13 Steps

| # | Step | Who Should Drive | What You Do |
|---|------|-----------------|-------------|
| 1 | Setup | Engineer | Verify environment, provide team name |
| 2 | Pick Project | Whole team | Choose a pre-built project or bring your own idea |
| 3 | Read PRD | **Everyone** | Read the PRD together. Type `ready` when done |
| 4 | Refine PRD | **Product Manager** | Answer Claude's questions about scope, users, goals |
| 5 | Review Questions | **Product Manager** | Resolve every open question in the PRD |
| 6 | Requirements | **Tech Lead + PM** | Review structured requirements — approve or revise |
| 7 | Technical Design | **Architect / Sr Eng** | Review architecture, APIs, data model — approve or revise |
| 8 | Execution Plan | **Tech Lead** | Review phased plan — approve, revise, or re-run |
| 9 | UI Prototype | Whole team | Click through the prototype, give UX feedback |
| 10 | User Stories | **PM + Tech Lead** | Review stories and acceptance criteria — approve or revise |
| 11 | Validation | **Tech Lead** | Review coverage report — approve or fix gaps |
| 12 | Jira Sync | Anyone | Provide Jira project key, verify stories in Jira |
| 13 | Implementation | **Engineer(s)** | Approve each story, review code, test the app |

**Rotate the keyboard.** The person best suited to review each step should be driving.

---

## Know Your Data Source Early

If your project needs external data, figure it out during `Refine PRD` — not at `Implementation`.

| Data Source | Approach |
|-------------|---------|
| CSV / flat file | Drop it in the project |
| REST API | Ask Claude to create a Claude Code skill (uses `curl`) |
| Database | Ask Claude to create an MCP server |

**NEVER paste credentials into the Claude conversation.** Set them as environment variables.

---

## Two GitHub Repos

| Repo | Created | Contents |
|------|---------|----------|
| **Workshop repo** (workbench) | Setup — cloned from `agentic-ai-workshop` | PRD, plans, requirements, design, stories, Jira mapping |
| **Code repo** (output) | Implementation — bootstrap story | Application source code, tests, README |


---

## MCP Servers

You have the following MCP servers pre-configured to connect to external systems. **Only Jira is required** — everything else adds context but won't block the flow.

| Server | What Claude Does With It | Required? |
|--------|-------------------------|-----------|
| **Jira** | Creates epics and stories, updates story status | **Yes** |
| **GitHub** | Repo operations, code search | No |
| **Confluence** | Reads/writes design docs and team pages | No |
| **Slack** | Searches channels for project context | No (read-only) |
| **Aha!** | Pulls roadmap items into requirements | No (read-only) |
| **ServiceNow** | Queries incidents and change requests | No (read-only) |
| **Schema Repo** | Looks up Kafka event schemas | No (read-only) |
| **Standards Chat** | Checks Nordstrom engineering standards | No (read-only) |
| **MAWM Data** | Queries 499 database | No (read-only) |

---

## Pre-Built Projects

| Project | Complexity |
|---------|------------|
| **RTO Compliance UI** — full-stack dashboard | High |
| **RTO Compliance CLI** — Python CLI for CSV analysis | Medium |
| **Calculator CLI** — expression parser (great for learning) | Low |
| **Infrastructure & Delivery** — docs and compliance stories | Medium |
| **Scan Compliance** — outbound scan compliance tracker for warehouses | Medium |

Or choose **"Create my own project"** and describe your idea.
