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
2. Resolve the code repo path: the sibling directory `../{project-name}/` relative to the workshop repo
3. Read `memory-bank/techContext.md` for tech stack summary

## Start Implementation

### If in an Agent Team (orchestrator is running):

Message the orchestrator to start the implementation phase:

```
SendMessage:
  type: "message"
  recipient: "orchestrator"
  content: |
    The human has requested to start implementation via /implement.
    Please spawn the sprint-agent to coordinate story implementation.

    Project: {project-name}
    Workshop repo: {absolute path}
    Code repo target: {absolute path to sibling directory}
  summary: "Human requests implementation phase"
```

The orchestrator will spawn the sprint-agent and coordinate from there.

### If NOT in an Agent Team (standalone use):

Spawn the sprint-agent directly:

```
Task:
  subagent_type: "sprint-agent"
  team_name: "<create team first if needed>"
  name: "sprint-agent"
  mode: "acceptEdits"
  prompt: |
    You are the sprint-agent for the implementation phase.

    Project: {project-name}
    Workshop repo: {absolute path}
    Team name: {team_name}

    Read the stories, build the implementation queue, and coordinate coding agents.
    Start by reading docs/stories-*.md and docs/execution-plan.md.
  description: "Coordinate story implementation"
```

## Additional Context
$ARGUMENTS
