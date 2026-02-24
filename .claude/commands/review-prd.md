---
description: Review PRD open questions and work through them one by one to get answers
---

# PRD Open Questions Review

You are running the **open questions review pipeline**. Your job is to walk the squad through every open question in their PRD, gather answers, and update both the PRD and memory bank with the resolved answers.

## Step 1: Load Context
1. Read all files in `memory-bank/` to understand current project context and decisions already made.
2. Read the PRD specified in the arguments, or search for one:
   - $ARGUMENTS (if a path is provided)
   - `projects/rto-compliance/prd.md`
   - `projects/scan-compliance/prd.md`
   - `projects/infra-delivery/prd.md`
3. Read `.claude/skills/nordstrom-engineering-standards.md` — some open questions may relate to standards.

## Step 2: Extract and Present Open Questions
1. Parse the **Open Questions** table from the PRD.
2. Present all questions in a numbered summary with their current status:

```
Open Questions for [Project Name]:

  #1  [OPEN]     Question text... (Owner: X)
  #2  [OPEN]     Question text... (Owner: X)
  #3  [ANSWERED] Question text... → Answer: ...
  ...

  Total: X open, X answered
```

3. Identify which open questions are **blocking** — they prevent downstream work (requirements, stories, design) from being accurate. Mark these clearly.

## Step 3: Work Through Questions
For each open question (starting with blocking ones first):

1. **Present the question** with context — explain why it matters and what downstream impact the answer has.
2. **Suggest a default or recommendation** if you have enough context to form an opinion. Be explicit: "If you're unsure, a reasonable default would be X because Y."
3. **Wait for the squad's answer.** Do NOT answer on their behalf.
4. **If the squad doesn't know the answer yet**, ask:
   - Can we proceed with an assumption? If so, what's the safest assumption?
   - Or does this need to be escalated to someone specific?
   - Record the assumption or escalation in the PRD.

Process questions **one at a time or in small related groups** (2-3 max). Do not dump all questions at once.

## Step 4: Update PRD
After each answer or group of answers:
1. Update the Open Questions table in the PRD — change status from "Open" to "Answered" and fill in the Answer column.
2. If the answer changes anything in the PRD body (scope, workflows, business rules, integrations, etc.), update those sections too.
3. If the answer creates new open questions, add them to the table.

## Step 5: Update Memory Bank (MANDATORY)
After each round of answers, update:
1. `memory-bank/productContext.md` — Log decisions with dates under "Key Decisions"
2. `memory-bank/activeContext.md` — Move answered questions out of Open Questions, add any new ones
3. `memory-bank/techContext.md` — If answers affect tech stack, integrations, or constraints
4. `memory-bank/progress.md` — Update count of open vs. resolved questions

## Step 6: Summary
After all questions have been addressed (answered, assumed, or escalated), present:

```
Open Questions Summary:

  Answered:    X questions resolved
  Assumed:     X questions with documented assumptions
  Escalated:   X questions assigned to owners for follow-up
  Still Open:  X questions remaining

  Blocking questions remaining: X
```

If no blocking questions remain, recommend the next step: `/generate-plan` to generate the execution plan.

If blocking questions remain, list them and suggest who needs to answer them before proceeding.

## Additional Context
$ARGUMENTS
