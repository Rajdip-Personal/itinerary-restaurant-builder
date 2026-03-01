# Facilitator Quick Reference

**Read the [README](../README.md) and [Workshop Quick Reference](quick-ref-participants.md) first.** This card covers only what facilitators need beyond that.

**Your job:** Keep teams moving. Unblock problems. Don't drive — let the team drive.

---

## Before the Workshop

- [ ] One person per team has Claude Code installed, authenticated, and running
- [ ] That person has run `./scripts/setup.sh`
- [ ] MCP servers configured — at minimum: Jira. Others are nice-to-have
- [ ] Dry-run the Calculator CLI project end-to-end so you know what "normal" looks like
- [ ] Have a shared Slack channel for cross-team help

---

## MCP Troubleshooting

The Setup step shows a server status table. If something's not connected:

- Check env vars: `./scripts/check-env.sh`
- Shell may need `source ~/.zshrc`
- Restart Claude Code after fixing — MCP servers initialize at startup
- Missing non-Jira servers won't block the flow

---

## Data Sources: Push Teams Early

This is the #1 thing teams underestimate. If their project needs external data:

1. **Identify the source immediately** — API? Database? CSV? Manual entry?
2. **Assign someone to figure out access** while others continue with PRD refinement
3. **Tell Claude during `Refine PRD`** — the sooner Claude knows, the better everything downstream will be
4. **Credentials go in environment variables.** NEVER in the conversation

---

## Things to Watch For

1. **Teams skipping `Read PRD`.** If only one person understands the project, every approval becomes a bottleneck
2. **Wrong person driving.** If the engineer is answering product questions during `Refine PRD`, redirect to the PM
3. **Teams approving without reading.** The flow commits and pushes to GitHub after each step — the whole team can review docs simultaneously. If something goes wrong, you never lose more than one step's worth of work
4. **Data source panic at `Implementation`.** Push them during `Refine PRD`. If they're truly stuck, have them restart their idea or switch to the Calculator CLI project
5. **One person doing everything.** Encourage rotation

---

## Common Issues

### Claude seems stuck (>3 min)
Hit **ESC**, type `resume flow`. The orchestrator has built-in nudging, but sometimes messages get lost.

### Subagent asking to approve file edits
Known quirk. **Just approve.** To reduce noise: set **Auto Accept Edit mode ON**.

### Token compaction confusion
Context window compressed older messages. Symptoms: wrong story picked up, stale memory bank, confused agents. **May self-correct.** If not: restart (see below).

### Subagent died
Orchestrator should detect and respawn. If not: ESC → tell the Team Lead (main Claude session) to nudge the Orchestrator.

### MCP server not connected
See MCP Troubleshooting above.

---

## Timing Benchmark (Calculator CLI)

The Calculator CLI project is the fastest end-to-end run. Use it to calibrate expectations:

| Phase | Calculator CLI |
|-------|---------------|
| Setup + Project + Read PRD | ~10 min |
| Refine PRD + Review Questions | ~15 min |
| Plan + Requirements + Design | ~20 min |
| Stories + Validation + Jira | ~15 min |
| Implementation | ~30 min |
| **Total** | **~90 min** |

Full-stack projects (RTO Compliance UI) will take 2-3x longer. Custom projects vary wildly depending on PRD completeness and data source readiness.

---

## Known Gaps

The flow is a workshop tool, not a production SDLC:

| Gap | What Actually Happens |
|-----|----------------------|
| **No pull requests** | Sprint agent merges feature branches directly to `main` |
| **No human code review** | Code merges as soon as the coding agent reports success |
| **No CI/CD** | Tests only run locally inside the coding agent |
| **No rollback** | Failed stories are skipped; previously merged code stays |
| **No security scanning** | Coding agents follow standards by instruction, no automated scan |

The PRD-to-Stories pipeline is also optimized for workshop speed — solid artifacts, but not the depth of refinement a real SDLC demands.

**What to tell teams:** Everything the flow produces — docs and code — is a strong starting point, not a finished product.

---

## Nuclear Option

1. Close all Claude terminal sessions (Team Lead and all subagents)
2. Restart:
   ```bash
   ./scripts/start-workshop.sh
   ```
3. Type: **`resume flow`**

Claude reads the memory bank and `docs/` to reconstruct state.
