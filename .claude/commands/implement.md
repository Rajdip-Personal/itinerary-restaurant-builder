---
description: Start the implementation phase — sprint agent picks up validated stories and spawns coding agents to implement them
---

# Start Implementation

You are starting the **implementation phase** of the workshop pipeline. This phase takes validated user stories and turns them into working code via the sprint-agent and coding-agent teammates.

## Preconditions Check

Before starting, verify these artifacts exist:

1. **Stories:** Glob for `docs/stories-*.md` — at least one file must exist
2. **Design:** Glob for `docs/detailed-design.md` or `docs/design-*.md`
3. **Execution plan:** Check for `docs/execution-plan.md`
4. **Requirements:** Glob for `docs/requirements-*.md` or `docs/requirements.md`

**If any are missing:** Tell the user which prerequisites are missing and which command to run:
- No stories → run `/generate-stories` first
- No design → run `/generate-design` first
- No plan → run `/generate-plan` first
- No requirements → run `/extract-requirements` first

**If all exist:** proceed.

## Determine Project Context

1. Read `memory-bank/activeContext.md` to identify the current project name
2. Read `memory-bank/techContext.md` for tech stack summary

**Do NOT resolve or assume the code repo path.** The sprint-agent has a dedicated gate (Step 3a) that asks the human for the repo name. Let the sprint-agent handle that.

## Start Implementation

### Step 1: Ensure Agent Team Exists

**Always create a team first.** This is required whether resuming a project or continuing from the full pipeline. The team lead (main session) must own the team so it can relay human input.

**Check if a team already exists** by looking for an active team context. If you are already in a team (e.g., orchestrator is running from the full pipeline), skip to Step 2.

**If no team exists** (e.g., resuming a project in a new session):

```
TeamCreate:
  team_name: "workshop-pipeline"
  description: "PRD to implementation pipeline for {project-name}"
```

Note the `team_name` from the result — it may differ from your input (e.g., `workshop-pipeline-1`). Use the **returned** team name for all subsequent operations.

### Step 2: Spawn Orchestrator

**The team lead ONLY spawns the orchestrator. The orchestrator spawns all other teammates (including the sprint-agent). This is non-negotiable per CLAUDE.md Team Lead Rules.**

**If an orchestrator is already running** (full pipeline session), message it:

```
SendMessage:
  type: "message"
  recipient: "orchestrator"
  content: |
    The human has requested to start implementation via /implement.
    Please spawn the sprint-agent to coordinate story implementation.

    Project: {project-name}
    Workshop repo: {absolute path}
    Note: Do NOT pass a code repo path — the sprint-agent will ask the human for the repo name in its Step 3a gate.
  summary: "Human requests implementation phase"
```

**If no orchestrator is running** (resumed session, standalone use), spawn the orchestrator as a teammate. The orchestrator will then spawn the sprint-agent:

```
Task:
  subagent_type: "orchestrator"
  team_name: "<team_name from TeamCreate result>"
  name: "orchestrator"
  mode: "bypassPermissions"
  prompt: |
    You are the orchestrator teammate for team <team_name>.
    The project "{project-name}" has completed all pipeline stages through validation.
    The human has requested to start the implementation phase via /implement.

    Project: {project-name}
    Workshop repo: {absolute path}
    Team name: <team_name>

    Your job: spawn the sprint-agent to coordinate story implementation.

    IMPORTANT: Do NOT pass a code repo path to the sprint-agent — the sprint-agent has a
    dedicated gate (Step 3a) that asks the human for the repo name. Let that gate run.
    Do not bypass it by providing the answer in advance.

    IMPORTANT: Always use mode: bypassPermissions when spawning teammates.

    IMPORTANT: The sprint-agent will message the team lead directly for human input
    (not through you). This is by design to reduce relay hops.
  description: "Coordinate implementation phase"
```

The sprint-agent will message you (team lead) directly when it needs human input — bypassing the orchestrator. Relay to the human and send responses back to the sprint-agent.

## Additional Context
$ARGUMENTS
