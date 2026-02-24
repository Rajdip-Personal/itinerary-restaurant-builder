---
description: Cross-check user stories against requirements for gaps
---

# Validate Requirements Coverage

You are running the **validation pipeline**. Follow these steps:

## Step 1: Gather Inputs
1. Read `docs/requirements.md` — required. If missing, **stop and tell the user** to run `/extract-requirements` first.
2. Read `docs/user-stories.md` — required. If missing, **stop and tell the user** to run `/generate-stories` first.
3. Read `docs/detailed-design.md` if it exists (for design-level validation).
4. Read `docs/execution-plan.md` if it exists (for phasing validation).
5. Read `.claude/skills/nordstrom-engineering-standards.md` for standards compliance check.
6. Read all files in `memory-bank/` for context.

Additional validation focus from user: $ARGUMENTS

## Step 2: Cross-Check Analysis

Perform the following validation checks:

### 1. Requirements → Stories Coverage
For every requirement (BR/TR/FR/NFR), check if at least one user story addresses it.

**Report:**
- Requirements fully covered by stories (with story IDs)
- **GAPS: Requirements with NO corresponding story** (critical finding)
- Requirements only partially covered (story exists but doesn't fully address the requirement)

### 2. Stories → Requirements Traceability
For every user story, check if it traces back to at least one requirement.

**Report:**
- Stories with valid requirement tracing
- **ORPHAN STORIES: Stories with no corresponding requirement** (may indicate scope creep or missing requirements)

### 3. Acceptance Criteria Quality
For every user story, validate:
- At least 2 acceptance criteria exist
- Acceptance criteria use Given/When/Then format
- Acceptance criteria are specific (not vague like "works correctly")
- Edge cases are covered (error states, empty states, boundary conditions)

**Report:**
- Stories with strong ACs
- **WEAK ACs: Stories needing better acceptance criteria** (with specific feedback)

### 4. NFR Coverage
Check that all mandatory Nordstrom NFRs are addressed:
- [ ] Authentication & authorization (RBAC)
- [ ] PII protection and masking
- [ ] Secrets management
- [ ] Structured JSON logging
- [ ] Health check endpoints
- [ ] Monitoring (SLIs/SLOs)
- [ ] CI/CD pipeline
- [ ] Container security scanning
- [ ] Test coverage (80% minimum)
- [ ] K8s deployment

**Report:**
- NFRs with stories and ACs
- **UNADDRESSED NFRs: Standards with no story** (compliance risk)

### 5. Conflict Detection
Check for:
- Conflicting requirements (e.g., "system must be real-time" vs "batch processing is acceptable")
- Stories that contradict each other
- Design decisions that don't align with requirements
- Priority conflicts (P0 stories dependent on P2 stories)

**Report:**
- **CONFLICTS: Any contradictions found** (with references to specific items)

### 6. Completeness Check
- Are all user personas from the PRD represented in stories?
- Are error handling and edge cases addressed?
- Are admin/operational stories included (monitoring, deployment, data migration)?
- Is there a story for each integration point?

## Step 3: Generate Report
Write the validation report to `docs/validation-report.md`:

```markdown
# Validation Report: [Project Name]

## Summary
| Check | Pass | Fail | Warning |
|-------|------|------|---------|
| Requirements Coverage | X | X | X |
| Story Traceability | X | X | X |
| AC Quality | X | X | X |
| NFR Coverage | X/10 | X/10 | — |
| Conflicts | — | X found | — |
| Completeness | X | X | X |

## Overall Status: PASS / NEEDS ATTENTION / FAIL

## Detailed Findings

### Critical Gaps (Must Fix)
(requirements with no stories, unaddressed NFRs, conflicts)

### Warnings (Should Fix)
(weak ACs, partial coverage, orphan stories)

### Observations (Consider)
(suggestions for improvement, edge cases to consider)

## Recommended Actions
Numbered list of specific actions to resolve findings.
```

## Step 4: Update Memory
1. Write report to `docs/validation-report.md`.
2. Update `memory-bank/progress.md` — mark validation as completed.
3. Update `memory-bank/activeContext.md` — record findings and recommended actions.

## Step 5: Present to User
Summarize the validation:
- Overall status (PASS/NEEDS ATTENTION/FAIL)
- Count of critical gaps, warnings, and observations
- Top 3 most important findings
- Specific actions to resolve gaps
- If passing: the project is ready for implementation planning
