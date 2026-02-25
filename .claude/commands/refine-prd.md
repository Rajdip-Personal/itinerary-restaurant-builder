---
description: Refine and iterate on a project PRD with automatic memory bank updates
---

# PRD Refinement

You are running the **PRD refinement pipeline**. This is the starting point of the workshop — helping the squad shape their PRD before running the downstream pipeline (/plan → /requirements → /stories → /design → /validate).

---

## CRITICAL: Execution Rules

**You MUST follow these steps sequentially. Do NOT skip steps or jump ahead.**

1. After completing each step, output a checkpoint marker: `[CHECKPOINT: Step N complete]`
2. Do NOT proceed to the next step until the checkpoint is output
3. If memory-bank/ is empty, you MUST initialize it in Step 2 before ANY assessment
4. Step 4 is about PRD CONTENT gaps (vague sections, missing details) — NOT the Open Questions in Section 10
5. The Open Questions in Section 10 are handled by `/review-prd` — do NOT try to answer them here
6. Step 6 (Memory Bank Update) is MANDATORY — the readiness check will FAIL if memory bank is empty

---

## Step 1: Identify Assigned Project
**If no project path is provided in $ARGUMENTS**, ask the team:

> Which project were you assigned for this workshop?
>
> 1. **RTO Compliance** (`projects/rto-compliance/prd.md`)
> 2. **Scan Compliance** (`projects/scan-compliance/prd.md`)
> 3. **Infrastructure & Delivery** (`projects/infra-delivery/prd.md`)

Wait for the team to respond before proceeding. Do NOT guess or assume a project.

## Step 2: Load Context
1. Read all files in `memory-bank/` to understand any existing project context.
2. Read the PRD for the assigned project:
   - $ARGUMENTS (if a path was provided)
   - Or the project selected by the team in Step 1
3. Read `.claude/skills/requirements-writing.md` for quality criteria.
4. Read `.claude/skills/nordstrom-engineering-standards.md` for standards that should be reflected in the PRD.

**GATE: If memory-bank/ is empty or missing key files, you MUST initialize it NOW before proceeding.**

Initialize these files with content extracted from the PRD:
- `memory-bank/projectbrief.md` — Vision, goals, scope, target users, success metrics
- `memory-bank/productContext.md` — Problem statement, personas, business context
- `memory-bank/techContext.md` — Tech stack, integrations, constraints
- `memory-bank/activeContext.md` — Current focus (PRD refinement), open questions list
- `memory-bank/progress.md` — Pipeline status (PRD refinement: in progress)

**Do NOT proceed to Step 3 until memory bank is initialized.**

`[CHECKPOINT: Step 2 complete — memory bank initialized]`

## Step 3: Assess PRD Completeness
Review the PRD and report on each section:

| Section | Status | Notes |
|---------|--------|-------|
| Product Overview (Vision, Problem, Users) | Complete / Partial / Missing | What's strong, what's vague |
| Goals & Success Metrics | Complete / Partial / Missing | Are metrics measurable? |
| Scope (In/Out/Future) | Complete / Partial / Missing | Is the boundary clear? |
| User Stories (High Level) | Complete / Partial / Missing | All personas covered? |
| Functional Requirements | Complete / Partial / Missing | Workflows defined? Business rules clear? |
| Non-Functional Requirements | Complete / Partial / Missing | Security, performance, observability? |
| Technical Constraints | Complete / Partial / Missing | Integrations identified? Tech stack chosen? |
| Dependencies & Risks | Complete / Partial / Missing | Hard dependencies flagged? |
| Milestones | Complete / Partial / Missing | Deliverable increments defined? |
| Open Questions | Complete / Partial / Missing | Unknowns captured? (NOT answered — just captured) |

**Output the assessment table to the user.**

`[CHECKPOINT: Step 3 complete — assessment displayed]`

## Step 4: Engage the Squad (PRD Content Gaps Only)

**IMPORTANT: This step is about filling gaps in PRD SECTIONS, not answering the Open Questions in Section 10.**

The Open Questions in Section 10 (e.g., "Which repo will we analyze?", "Do we have API access?") are handled by `/review-prd`. Do NOT try to answer them here.

**Step 4 focuses on PRD CONTENT quality:**
- Is the scope section vague? → Ask clarifying questions about boundaries
- Is a persona missing? → Ask who else uses or is affected by this system
- Are integrations listed but not explained? → Ask how they connect
- Are requirements hand-wavy? → Ask for specific, testable criteria
- Are NFRs missing? → Ask about security, performance, observability needs
- Are risks not identified? → Ask what could go wrong

**If the assessment in Step 3 shows all sections are "Complete", then Step 4 may be brief or skipped.**

Ask 2-3 questions at a time. Wait for answers before asking more.

**If the squad provides answers:**
- Update the PRD (Step 5)
- Update the memory bank (Step 6)
- Then return to Step 4 for more questions if needed

**If no significant content gaps exist, proceed to Step 5.**

`[CHECKPOINT: Step 4 complete — content gaps addressed or none found]`

## Step 5: Update PRD
When the squad provides answers or makes decisions:
1. Update the PRD file directly with the new information.
2. Keep the PRD structure consistent with `templates/prd-template.md`.
3. Mark resolved open questions with the answer.

**If no PRD updates were needed (all sections were complete), output:**

`[CHECKPOINT: Step 5 complete — no PRD updates needed]`

**If PRD was updated, output:**

`[CHECKPOINT: Step 5 complete — PRD updated]`

## Step 6: Update Memory Bank (MANDATORY — BLOCKING)
**After every round of PRD changes**, update the memory bank:
1. `memory-bank/projectbrief.md` — If vision, goals, scope, users, or metrics changed
2. `memory-bank/productContext.md` — If problem statement, personas, or business context changed. Always log key decisions with dates.
3. `memory-bank/techContext.md` — If tech stack, integrations, or constraints changed
4. `memory-bank/activeContext.md` — Update current focus, recent decisions, and open questions
5. `memory-bank/progress.md` — Update PRD refinement status

**This step is not optional.** Every decision made during PRD refinement must be captured in the memory bank so downstream agents (/plan, /requirements, /stories) have full context.

**GATE: Verify all 5 memory bank files exist and have content before proceeding.**

Run: `ls memory-bank/*.md` and verify all files are present. If any are missing, create them NOW.

`[CHECKPOINT: Step 6 complete — memory bank updated, all 5 files present]`

## Step 7: Readiness Check (BLOCKING)
When the squad feels the PRD is ready, run a final assessment.

**You MUST output this checklist with checkmarks or X marks:**

```
PRD Readiness Checklist:
- [x/✗] All sections have substantive content (no placeholder dashes)
- [x/✗] All personas have at least 2 user stories
- [x/✗] Functional workflows are step-by-step, not hand-wavy
- [x/✗] NFRs reference Nordstrom engineering standards
- [x/✗] Integrations list specific systems and methods (not "some API")
- [x/✗] At least 3 success metrics with measurable targets
- [x/✗] Open questions are captured (they don't have to be answered — just listed)

Memory Bank Checklist:
- [x/✗] memory-bank/projectbrief.md exists and has content
- [x/✗] memory-bank/productContext.md exists and has content
- [x/✗] memory-bank/techContext.md exists and has content
- [x/✗] memory-bank/activeContext.md exists and has content
- [x/✗] memory-bank/progress.md exists and has content
```

**If ANY item has ✗, the readiness check FAILS.** Tell the squad exactly what's missing and loop back to fix it.

**If ALL items have ✓:**

`[CHECKPOINT: Step 7 complete — PRD ready, memory bank complete]`

Display the navigation prompt:
```
┌─────────────────────────────────────────────────┐
│ ✓ /refine-prd complete                          │
├─────────────────────────────────────────────────┤
│ Options:                                        │
│  [1] Continue to /review-prd (recommended)      │
│  [2] Re-run /refine-prd                         │
└─────────────────────────────────────────────────┘
```

## Additional Context
$ARGUMENTS
