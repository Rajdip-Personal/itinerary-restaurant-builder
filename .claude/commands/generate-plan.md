---
description: Generate execution plan from PRD, requirements, and design
---

# Generate Execution Plan

You are running the **planning pipeline**. Follow these steps:

## Step 1: Gather Context
1. Read all files in `memory-bank/` to understand current project state.
2. Look for a PRD in:
   - The path specified in the arguments: $ARGUMENTS
   - `projects/` subdirectories
   - `templates/prd-template.md` (if no project-specific PRD exists)
3. If no PRD is found, **stop and ask the user** to provide a project brief or fill out the PRD template at `templates/prd-template.md`.
4. Read `docs/requirements-*.md` or `docs/requirements.md` — required input. If missing, **stop and tell the user** to run `/extract-requirements` first.
5. Read `docs/detailed-design.md` or `docs/design-*.md` — required input. If missing, **stop and tell the user** to run `/generate-design` first.
6. Read `.claude/skills/nordstrom-engineering-standards.md` for mandatory standards.

## Step 2: Generate Plan
Delegate to the **planning-agent** to produce a phased execution plan. The plan must include:
- Phases with milestones and sprint assignments
- Work packages with descriptions, dependencies, and effort estimates
- Dependency map between work packages
- Risk register with mitigations
- Planning assumptions

Additional context from user: $ARGUMENTS

## Step 3: Update Memory
After the plan is generated:
1. Write the plan to `docs/execution-plan.md`.
2. Update `memory-bank/progress.md` — mark planning as completed.
3. Update `memory-bank/activeContext.md` — record key decisions and open questions.

## Step 4: Present to User
Summarize the plan:
- Number of phases and total estimated sprints
- Key milestones
- Top risks
- Assumptions that need validation
- Recommended next step: run `/generate-stories` to generate user stories
