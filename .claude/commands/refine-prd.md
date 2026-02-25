---
description: Refine and iterate on a project PRD with automatic memory bank updates
---

# PRD Refinement

You are running the **PRD refinement pipeline**. This is the starting point of the workshop — helping the squad shape their PRD before running the downstream pipeline (/plan → /requirements → /stories → /design → /validate).

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
| Open Questions | Complete / Partial / Missing | Unknowns captured? |

## Step 4: Engage the Squad
Based on the assessment, ask the squad targeted questions to fill gaps. Focus on:
- **Ambiguous scope** — What's in, what's out? Where's the line?
- **Missing personas** — Who else uses or is affected by this system?
- **Unclear integrations** — What existing systems does this connect to? How?
- **Vague requirements** — Can we make this specific and testable?
- **Missing NFRs** — Security, performance, observability addressed?
- **Unidentified risks** — What could go wrong?

Do NOT ask all questions at once. Prioritize the biggest gaps and ask 2-3 questions at a time.

## Step 5: Update PRD
When the squad provides answers or makes decisions:
1. Update the PRD file directly with the new information.
2. Keep the PRD structure consistent with `templates/prd-template.md`.
3. Mark resolved open questions with the answer.

## Step 6: Update Memory Bank (MANDATORY)
**After every round of PRD changes**, update the memory bank:
1. `memory-bank/projectbrief.md` — If vision, goals, scope, users, or metrics changed
2. `memory-bank/productContext.md` — If problem statement, personas, or business context changed. Always log key decisions with dates.
3. `memory-bank/techContext.md` — If tech stack, integrations, or constraints changed
4. `memory-bank/activeContext.md` — Update current focus, recent decisions, and open questions
5. `memory-bank/progress.md` — Update PRD refinement status

**This step is not optional.** Every decision made during PRD refinement must be captured in the memory bank so downstream agents (/plan, /requirements, /stories) have full context.

## Step 7: Readiness Check
When the squad feels the PRD is ready, run a final assessment:
- [ ] All sections have substantive content (no placeholder dashes)
- [ ] All personas have at least 2 user stories
- [ ] Functional workflows are step-by-step, not hand-wavy
- [ ] NFRs reference Nordstrom engineering standards
- [ ] Integrations list specific systems and methods (not "some API")
- [ ] At least 3 success metrics with measurable targets
- [ ] Open questions are captured (they don't have to be answered — but they must be listed)
- [ ] Memory bank is up to date with all decisions

If ready, recommend the next step: `/generate-plan` to generate an execution plan.

If not ready, tell the squad exactly what's missing and continue refinement.

## Additional Context
$ARGUMENTS
