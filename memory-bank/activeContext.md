# Active Context

## Current Focus
- **Project**: Full-Stack Infrastructure & Delivery (`projects/infra-delivery/prd.md`)
- **Stage**: PRD Open Questions Review (pre-pipeline)
- **Next Step**: Work through 6 open questions in PRD

## Recent Decisions

### 2026-02-25: Git Worktree Setup for Parallel Development
**Decision**: Use git worktrees to separate framework changes from test run artifacts.

| Directory | Branch | Purpose |
|-----------|--------|---------|
| `/Users/brub/dev/supplychain/agentic-ai-workshop` | `robert-test-run` | Test run artifacts (memory, docs, projects) |
| `/Users/brub/dev/supplychain/agentic-ai-framework-dev` | `framework-improvements` | Framework changes (agents, commands, skills, CLAUDE.md) |

**File routing convention**:
- `.claude/agents/*`, `.claude/commands/*`, `.claude/skills/*`, `scripts/*`, `templates/*`, `CLAUDE.md` → framework-improvements
- `memory-bank/*`, `docs/*`, `projects/*` → robert-test-run

### 2026-02-25: Memory Bank Protocol Added
Added mandatory memory update rules to CLAUDE.md to ensure critical context is saved incrementally, not just at session end.

## Open Questions
- 6 open questions in `projects/infra-delivery/prd.md` need to be addressed before proceeding

## Blockers
—

<!-- Updated: 2026-02-25 -->
