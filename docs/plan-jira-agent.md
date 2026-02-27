# Plan: Jira Agent Integration

## Context

The workshop pipeline generates user stories as markdown files (`docs/stories-*.md`) but has no integration with Jira. We need a new **jira-agent** that:
1. After stories are generated and human-approved, creates epics and stories in Jira
2. During implementation, receives status updates from sprint-agent and transitions Jira issues (IN PROGRESS, DONE, FAILED, SKIPPED)

This is a best-effort integration — Jira failures do NOT block the implementation pipeline.

---

## Findings from MCP Testing (SCAW1-1)

Tested creating a story in project SCAW1 via `mcp__jira-mcp__create_issue`. Key findings:

1. **Priority names:** Nordstrom Jira Server uses `Blocker`, `Critical`, `Major`, `Minor`, `Trivial` (NOT Cloud-style Highest/High/Medium/Low). Mapping:
   - Must Have (P0) → `Critical`
   - Should Have (P1) → `Major`
   - Could Have (P2) → `Minor`
   - Won't Have → `Trivial`

2. **Story Points:** Works via `custom_fields: {"Story Points": N}` on `create_issue`. **Important:** `custom_fields` must be passed as a native dict, NOT a JSON string. Passing `"{\"Story Points\": 3}"` (string) causes a Pydantic validation error; passing `{"Story Points": 3}` (dict) works. Requires the Story Points field to be on the project's Create Issue screen (admin must add it).

3. **Description format:** Jira wiki markup works — `h2.` headings, `*bold*`, `{{code}}`, `* bullets`.

4. **Issue type:** `"Story"` is valid. Epic creation uses separate `create_epic` tool.

5. **Requirement ID collision:** Workshop generates IDs like `TR-001`, `BR-004`, `FR-002`. In Nordstrom Jira, `TR` is the **Technical Renewal** project, so `TR-002` auto-links to an unrelated issue. **Fix:** Escape all requirement references in Jira descriptions using `{{TR-002}}` code markup so Jira treats them as literal text. Apply to all prefixes: `TR-`, `BR-`, `FR-`, `NFR-`, and any workshop story IDs (`S1-01`, etc.) that might collide with project keys.

6. **Assignee for IN_PROGRESS:** Use `get_current_user` to discover the PAT owner's username and assign stories to that user (no way to create new Jira users via MCP).

7. **Delete issue:** No `delete_issue` tool in the Jira MCP server. Issues can only be deleted via the Jira UI (issue page → More menu → Delete at bottom of dropdown).

8. **Jira UI note:** Nordstrom's Jira Server uses the older UI layout — actions are under a **"More"** dropdown button (not "..." kebab menu).

---

## Files to Change

### 1. NEW: `.claude/agents/jira-agent.md`

**Frontmatter:**
```yaml
name: jira-agent
description: |
  Jira integration agent that creates epics and stories from validated workshop stories,
  and transitions issue statuses during implementation. Persists throughout implementation
  to receive status updates from the sprint-agent.
tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - SendMessage
```

**Body sections:**

- **Role:** Persistent teammate spawned by orchestrator. Two modes: BULK CREATE (epics + stories) and STATUS SYNC (listen for updates from sprint-agent).
- **Step 0 — Load Jira MCP Tools:** Use `ToolSearch(query: "+jira")` before any Jira operations. Needs: `create_epic`, `create_issue`, `add_issues_to_epic`, `search_issues`, `update_issue`, `transition_issue_by_name`, `add_comment`, `get_transitions`.
- **Step 1 — Get Jira Project Key:** Check `memory-bank/techContext.md` for existing key. If not found, message orchestrator to ask human. Validate with `search_issues(jql: "project = {KEY}")`. Send confirmed key to memory-agent.
- **Step 2 — Read Story Files:** Glob `docs/stories-*.md`, parse phase names, story IDs, titles, points, priority, full body (As a.../acceptance criteria/technical notes).
- **Step 3 — Create Epics:** One per phase. `create_epic(project_key, summary: "Phase N: Name", description)`.
- **Step 4 — Create Stories:** For each story: `create_issue(project_key, summary: "{id}: {title}", issue_type: "Story", description: {formatted body in Jira wiki markup}, priority: {mapped — see below}, custom_fields: {"Story Points": N})`. Then `add_issues_to_epic(epic_key, issue_keys)`.
  - **Priority mapping:** Must Have → `Critical`, Should Have → `Major`, Could Have → `Minor`, Won't Have → `Trivial`
  - **Description escaping:** Wrap all requirement IDs (`TR-`, `BR-`, `FR-`, `NFR-`) and workshop story IDs (`S1-`, `S2-`, etc.) in `{{}}` code markup to prevent Jira auto-linking to unrelated projects (e.g., `TR` = Technical Renewal).
- **Step 5 — Write Mapping File:** Write `docs/jira-mapping.md` with tables: Epic Mapping (Phase → Jira Epic Key) and Story Mapping (Workshop ID → Jira Key → Status).
- **Step 6 — Report Completion:** Message orchestrator + memory-agent. Stay alive for status sync.
- **Status Sync Protocol:** Listen for `JIRA UPDATE` messages from sprint-agent:
  - `IN_PROGRESS` → `transition_issue_by_name(status: "In Progress")`, assign to PAT owner (discovered via `get_current_user` at startup), add comment with coding agent name
  - `DONE` → `transition_issue_by_name(status: "Done")`, add comment with commit hash
  - `FAILED` → add comment with error details (no transition)
  - `SKIPPED` → add comment "Skipped"
  - After each: update `docs/jira-mapping.md` Status column, confirm back to sprint-agent
- **Error Handling:** Best-effort. Log failures, report to orchestrator, continue. Partial creation is OK — note failures in mapping file.
- **Important Rules:** MCP-only (no curl), stay alive during implementation, send memory updates via memory-agent, confirm updates to sprint-agent.

---

### 2. MODIFY: `.claude/agents/orchestrator.md`

**Change A — Delegation table** (line 90-97): Add row `| Jira epic/story creation, status sync | **jira-agent** |`

**Change B — Architecture diagram** (lines 63-66): Add `jira-agent` box alongside sprint-agent in the second row of teammates:
```
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  │design-agent │ ←─→ │story-gener- │ ←─→ │code-scanner │ ←─→ │ jira-agent  │
│  │             │     │    ator     │     │ (optional)  │     │ (optional)  │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Change C — "Step 2: Determine Next Action" table** (lines 226-228): Replace the single implementation row with two rows:
```
| Validation done, human approves | Create Jira issues | jira-agent |
| Jira sync complete (or skipped), human approves implementation | Start implementation | sprint-agent |
```

**Change D — Subagent type list** (line 285): Add `"jira-agent"` to the list.

**Change E — "When NOT to shut down" list** (lines 314-316): Add `- If the teammate is `jira-agent` during implementation (receives status updates from sprint-agent)`

**Change F — Navigation prompt** (lines 588-597): Add `jira-sync` line between `validation` and `implementation`.

**Change G — Implementation Phase section** (lines 503-525): Insert jira-agent spawn block BEFORE the existing sprint-agent spawn. The orchestrator spawns jira-agent first, waits for completion, then spawns sprint-agent. Add note that jira-agent stays alive during implementation.

---

### 3. MODIFY: `.claude/agents/sprint-agent.md`

**Change A — New section after "When You Are Spawned":** Add "## Jira Integration (Conditional)" section. If `docs/jira-mapping.md` exists, load the Workshop Story ID → Jira Issue Key mapping. All status changes send `JIRA UPDATE` messages to jira-agent. If file doesn't exist, skip all Jira notifications.

**Change B — Step 0** (line 55): Add item 6: `Read docs/jira-mapping.md — if it exists, load the Workshop Story ID -> Jira Issue Key mapping for Jira notifications`

**Change C — Step 4a "Present Story to Human"** (around line 190): Add `**Jira Issue:** {jira_key}` line to the story presentation message (conditional on mapping existing).

**Change D — Step 4b "Request Coding Agent"** (after SPAWN REQUEST): Add notification to jira-agent:
```
SendMessage to "jira-agent":
  JIRA UPDATE:
  - Story: {workshop-story-id}
  - Action: IN_PROGRESS
  - Coding Agent: coding-agent-{story-id}
```

**Change E — Step 4c "Handle Result"**: After recording success/failure/skip, add jira-agent notifications:
- On success: `JIRA UPDATE: Action: DONE, Commit: {hash}`
- On failure: `JIRA UPDATE: Action: FAILED`
- On skip: `JIRA UPDATE: Action: SKIPPED`

**Change F — Important Rules** (line 356): Add rule: `Notify jira-agent on every status change if docs/jira-mapping.md exists. Best-effort — do not block on confirmation.`

---

### 4. MODIFY: `CLAUDE.md`

**Change A — Architecture Diagram** (lines 197-200): Add `│  Jira   │` box in the teammates section alongside Sprint Agent.

**Change B — Phase 2 Workflow Table** (lines 642-650): Add row between validation and implementation:
```
| 8b | Jira Sync | jira-agent |
```

**Change C — Implementation description** (lines 662-664): Add jira-agent to the description of the implementation flow.

**Change D — Key Directories table** (line 727): Add `jira` to the agents list description.

---

## Implementation Order

1. `.claude/agents/jira-agent.md` (new file, no dependencies)
2. `.claude/agents/orchestrator.md` (references jira-agent)
3. `.claude/agents/sprint-agent.md` (references JIRA UPDATE protocol)
4. `CLAUDE.md` (documents the full system)

## Verification

1. **Structural:** Confirm `jira-agent.md` has valid YAML frontmatter matching other agents
2. **Protocol consistency:** Grep for `JIRA UPDATE` in both sprint-agent.md and jira-agent.md — message format must match
3. **Pipeline ordering:** Verify orchestrator's "Determine Next Action" table sequences jira-agent BEFORE sprint-agent
4. **Graceful degradation:** Verify sprint-agent checks for `docs/jira-mapping.md` existence before sending Jira notifications
5. **No curl/REST:** Grep for `curl` or `REST` in jira-agent.md — should only appear in "don't do this" context
6. **Navigation prompt:** Verify `jira-sync` appears in orchestrator's pipeline progress display
7. **Priority mapping:** Verify jira-agent uses `Critical`/`Major`/`Minor`/`Trivial` (not Highest/High/Medium/Low)
8. **Requirement ID escaping:** Verify jira-agent wraps `TR-`, `BR-`, `FR-`, `NFR-` refs in `{{}}` to prevent Jira auto-linking
9. **Assignee:** Verify jira-agent uses `get_current_user` (not hardcoded "Claude") for story assignment

## Cleanup

- ~~Delete test story SCAW1-1~~ (deleted via Jira UI → More → Delete)
- Delete test story SCAW1-2 via Jira UI (More → Delete) — no MCP delete_issue tool available
- Delete test story SCAW1-3 via Jira UI (More → Delete) — custom_fields verification test
