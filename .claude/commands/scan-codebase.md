---
description: Analyze existing codebase for patterns and architecture
---

# Scan Existing Codebase

You are running the **code scanning pipeline**. Follow these steps:

## Step 1: Identify Target
The scan target is specified in the arguments: $ARGUMENTS

If no path is provided, **ask the user** which directory or repository to scan.

Verify the path exists before proceeding.

## Step 2: Gather Context
1. Read `memory-bank/techContext.md` and `memory-bank/systemPatterns.md` for any existing knowledge about this codebase.
2. Read `.claude/skills/nordstrom-engineering-standards.md` to know what compliance standards to check against.

## Step 3: Run Scan
Delegate to the **code-scanner** to perform a comprehensive analysis of the target directory:

- **Tech stack** — Languages, frameworks, build tools, runtime versions
- **Architecture** — Project structure, module organization, entry points
- **API patterns** — Endpoints, request/response patterns, auth, versioning
- **Data model** — Database, ORM, entities, migrations, caching
- **Integrations** — External services, message queues, event schemas
- **Testing** — Frameworks, structure, coverage, mocking patterns
- **CI/CD** — Pipeline configuration, build steps, deployment
- **Security** — Auth, secrets, PII handling, input validation, vulnerabilities
- **Tech debt** — Code smells, outdated deps, TODOs, inconsistencies
- **Nordstrom standards compliance** — Check against each standard

**Critical: The scanner must NEVER modify the scanned code. Read-only analysis only.**

## Step 4: Update Memory
After the scan is complete:
1. Write the analysis to `docs/code-analysis.md`.
2. Update `memory-bank/techContext.md` with discovered tech stack, infrastructure, and security details.
3. Update `memory-bank/systemPatterns.md` with discovered architecture, API conventions, and data model.
4. Update `memory-bank/progress.md` — mark code scan as completed.

## Step 5: Present to User
Summarize the findings:
- Tech stack overview
- Architecture style and key patterns
- Security assessment (any red flags)
- Nordstrom standards compliance score
- Top tech debt items
- Recommendations for improvement
- How findings should inform requirements and design
