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

### Step 2: Spawn Sprint-Agent

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

**If no orchestrator is running** (resumed session, standalone use), spawn the sprint-agent directly as a teammate:

```
Task:
  subagent_type: "sprint-agent"
  team_name: "<team_name from TeamCreate result>"
  name: "sprint-agent"
  mode: "bypassPermissions"
  prompt: |
    You are the sprint-agent for the implementation phase.

    Project: {project-name}
    Workshop repo: {absolute path}
    Team name: {team_name}

    Read the stories, build the implementation queue, and coordinate coding agents.
    Start by reading docs/stories-*.md and docs/execution-plan.md.

    IMPORTANT: Do NOT assume or auto-resolve the code repo path. You MUST ask the human
    for the repo name via your Step 3a gate before bootstrapping.

    IMPORTANT: Always use mode: bypassPermissions when spawning coding agents.
  description: "Coordinate story implementation"
```

The sprint-agent will message you (team lead) when it needs human input. Relay to the human and send responses back.

## Additional Context
$ARGUMENTS
