---
description: View or update the memory bank
---

# Memory Bank Operations

You are running the **memory management pipeline**. Follow these steps:

## Determine Operation

Based on the arguments provided: $ARGUMENTS

- **No arguments or "view" or "show"** → Display the current memory bank state
- **"update" followed by context** → Update relevant memory bank files with new information
- **"consolidate" or "clean"** → Reconcile and clean up the memory bank

## View Mode (Default)
1. Read all 6 files in `memory-bank/`:
   - `projectbrief.md`
   - `productContext.md`
   - `techContext.md`
   - `systemPatterns.md`
   - `activeContext.md`
   - `progress.md`
2. Present a consolidated summary:
   - **Project Status** — What stage are we at? What's completed?
   - **Current Focus** — What are we actively working on?
   - **Key Context** — Tech stack, architecture, important decisions
   - **Open Questions** — What needs resolution?
   - **Blockers** — What's preventing progress?
3. Flag any files that are still at their initial placeholder state (contain only "—").

## Update Mode
1. Read the current state of all memory files.
2. Parse the update context from the arguments.
3. Determine which file(s) the new information belongs in.
4. Update the relevant files, preserving existing content.
5. Add a timestamp: `<!-- Updated: YYYY-MM-DD HH:MM -->`
6. Present a summary of what was updated and why.

## Consolidate Mode
1. Read all 6 files.
2. Identify and resolve:
   - **Duplicates** — Same info in multiple files → keep in most appropriate, remove from others
   - **Contradictions** — Flag for human resolution
   - **Stale items** — Mark as superseded with date
   - **Gaps** — Flag what's missing
3. Present a report of all changes and any contradictions that need human input.
