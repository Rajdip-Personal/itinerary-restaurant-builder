---
description: Generate user stories from validated requirements
---

# Generate User Stories

You are running the **story generation pipeline**. Follow these steps:

## Step 1: Gather Context
1. Read all files in `memory-bank/` to understand current project state, tech stack, and architecture decisions.
2. Read `docs/requirements.md` — this is your primary input. If it doesn't exist, **stop and tell the user** to run `/extract-requirements` first.
3. Read `docs/execution-plan.md` if it exists (for sprint assignment context).
4. Read `memory-bank/techContext.md` and `memory-bank/systemPatterns.md` for API conventions and data model.

## Step 2: Generate Stories
Delegate to the **story-generator** to translate requirements into sprint-ready user stories:

- Group stories into logical **Epics** (Infrastructure, Auth, Core Data, feature-specific)
- Every story uses **"As a [role], I want [capability], so that [value]"** format
- Every story has **Given/When/Then** acceptance criteria (minimum 2 per story)
- Every story includes **technical notes**: API endpoints, data model, integrations, security, testing
- Every story has **story point estimates** (1, 2, 3, 5, 8, or 13 — split anything > 8)
- Every story has **sprint assignment** based on dependencies and priority
- Every story **traces back** to one or more requirements (BR/TR/FR/NFR)

Include a **requirements coverage matrix** showing which requirements are covered and any gaps.

Additional context from user: $ARGUMENTS

## Step 3: Update Memory
After stories are generated:
1. Write stories to `docs/user-stories.md`.
2. Update `memory-bank/progress.md` — mark story generation as completed.
3. Update `memory-bank/activeContext.md` — record decisions and open questions.

## Step 4: Present to User
Summarize the stories:
- Total story count and story point total
- Number of epics
- Sprint distribution (stories and points per sprint)
- Requirements coverage — any gaps (requirements with no stories)
- Any stories that need human clarification
- Recommended next step: run `/validate-coverage` to check coverage
