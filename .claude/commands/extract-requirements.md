---
description: Run full requirements intake pipeline
---

# Extract Structured Requirements

You are running the **requirements pipeline**. Follow these steps:

## Step 1: Gather Context
1. Read all files in `memory-bank/` to understand current project state and tech context.
2. Read the PRD from the project directory or as specified: $ARGUMENTS
3. Read `docs/execution-plan.md` if it exists (for phasing context).
4. Read `.claude/skills/nordstrom-engineering-standards.md` for mandatory NFRs.
5. Read `.claude/skills/requirements-writing.md` for quality guidelines.

## Step 2: Extract Requirements
Delegate to the **requirements-agent** to process the PRD into four categories of structured requirements:

1. **Business Requirements (BR-XXX)** — Business outcomes and value
2. **Technical Requirements (TR-XXX)** — Infrastructure and technology constraints
3. **Functional Requirements (FR-XXX)** — System capabilities and behaviors
4. **Non-Functional Requirements (NFR-XXX)** — Quality attributes (security, performance, observability)

**Mandatory:** Always include Nordstrom engineering standards as NFRs:
- Authentication & authorization (RBAC)
- PII protection and masking
- Secrets management via Vault/K8s
- Structured JSON logging with correlation IDs
- Health check endpoints
- SLIs/SLOs and monitoring
- CI/CD on GitHub Actions
- Container security scanning
- 80% minimum test coverage
- Standard K8s deployment

Additional context from user: $ARGUMENTS

## Step 3: Update Memory
After requirements are generated:
1. Write requirements to `docs/requirements.md`.
2. Update `memory-bank/progress.md` — mark requirements extraction as completed.
3. Update `memory-bank/activeContext.md` — record decisions and open questions.

## Step 4: Present to User
Summarize the requirements:
- Total count by category (BR/TR/FR/NFR)
- Priority distribution (P0/P1/P2)
- Any gaps or ambiguities found in the PRD
- Questions that need answers before proceeding
- Recommended next step: run `/generate-stories` to generate user stories
