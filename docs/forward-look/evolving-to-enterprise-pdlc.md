Let's think about what we need to do evolve this workshop-specific flow to a flow that can be used for SC Tech PDLC

Normal Intake - Work is on the roadmap, planned
Stress Intake - Work is decided in the quarter it is to be completed, often with limited time left to plan/design/implement

Regardless of type of intake
- Work slated to be delivered by Anniversary or Holidays
- May involve just one domain or cross domain (e.g. promise, checkout, PDP), one or across multiple business/operational concerns (e.g. transportation, store ops, etc)
- May involve people at all levels - engineers, engineering managers, directors, VP
- Requirements are discovered in parallel with tech discovery - this is what we want, can we do it? if not, what can we do?
- Often, what we should do (the "correct" way) is considered but almost never the option chosen
- Depending on what can be done, work may be split into MVP first, then quick follow
- All of the above comes about mostly from meetings, slack convo, confluence docs, etc. There is no automation or workflow. As such, miscommunication and crossed wires are common, and as a result, some of the time and resources are spent just resolving them. The process overall is inefficient and error prone

The difference with Normal and Stress comes down to how much time is available to plan/design/implement - plan includes requirement gathering and discovery, and the scope of the work. The larger the scope, and the smaller the time available, the more stressed (and chaotic) it is.

The flow as implemented would seem to address the above. But it needs additional thoughts and implementation to make it work in an enterprise organization.
Here's one possible flow:
1. Pdm works with stakeholders and Claude to creates the PRD
2. Pdm may review and complete the PRD in the same session, but likely, Pdm will do so over multiple sessions, involve other product and business folks, and may have a feedback and/or approval workflow
3. When Pdm and interested parties approves the PRD, instead of Claude immediately spawning a Requirements Agent to create Business, Technical, Functional, and Non-Functional requirements, Claude will either provided guided input to Pdm or Pdm can provide supplemental instructions on how the requirements should be generated - guidelines, constraints, etc.
4. When those instructions are provided by the Pdm, Claude spawns the Requirement Agent to generate the requirements
5. When Requirement Agent is done, Claude notifies Pdm and interested parties (e.g., business) that requirements are ready for review in GitHub
5. Pdm and interested parties review the requirements in GitHub, and interacts with Claude to refine on the requirements. Again, this can occur over multiple sessions, involve other product and business folks, and may have a feedback and/or approval workflow with product and business
6. When Pdm and interested parties approve the requirements, instead of Claude immediately spawning Design Agents, Claude will notify engineering of the requirements.
7. Engineering will construct and supply a supplemental document that the Design Agents will ingest along with the requirements that sets the guideline, constraints, etc of the design to be generated.
8. When the document is providing by engineering, Claude spawns the Design Agent(s) to generate the design. Design will include architecture diagram, sequence diagrams, ER diagrams, use cases, etc.
9. When Design Agent is done, Claude notifies engineering and interested parties that design is ready for review in GitHub
10. Engineering and interested parties reviews the requirements in GitHub, and interacts with Claude to refine on the design. This can occur over multiple sessions, involve other engineering, product, and business folks, and may have an approval workflow with engineering, product and business
11. When engineering and interested parties approve the design, instead of Claude immediately spawning the Planning Agent, Claude notified product and engineering that it is about to create an execution plan, and provide opportunity for all parties to provide additional input. It is possible that previous steps are re-run if, for example, requirements are changed. Likely, there will be an approval workflow in which product, engineering, and business indicate their acceptance of the design
...
I think you can see where I'm headed with the above.
Although specific role will be "lead" for a step, other interested parties can provide inputs/feedbacks/approval at any stage. Whether that all occurs via some workflow Claude is to be determined. My thinking is that if there is to be a conversation, then put Claude and the flow on hold, and have the conversation offline in a slack convo or meeting. Then return to Claude to resume - re-running any of the steps as needed to reflect any feedbacks/decisions from the offline conversations.
The idea of multiple parties providing inputs/feedbacks/approval needs some thought. We don't want Claude to react to every input and feedback - how will it know which it should act or not? Some mechanism to resolve multi inputs/feedbacks is needed
Approvals are binary - it is approved or not. Approval can be rescinded at any point. And the next step is triggered once lead and/or interested parties have submitted their approval
We will likely need some sort of visualization to see where a project is at in terms of steps and approvals.
Anyways, the above is some of my thoughts.
This is not an ask to do anything but to think. So use your critical eye.

---

## Analysis: Evolving the Workshop to Enterprise PDLC

This is a rich problem. Let me think through it critically.

## What You're Actually Describing

The workshop flow is a **single-user, single-session, synchronous pipeline with Claude as orchestrator**. What you're describing is a **multi-user, multi-session, asynchronous workflow with Claude as execution engine**. That's not an evolution — it's a fundamentally different architecture.

The workshop gets away with a lot because one person sits in a CLI and says "approved" in real time. The enterprise flow breaks every assumption that enables.

## The Hard Problems

### 1. Claude Code CLI is the Wrong Substrate

This is the elephant in the room. Claude Code is a single-user developer tool. What you're describing needs:

- Persistent state across days/weeks (Claude sessions die)
- Multiple users with different roles and permissions
- Proactive notifications (Claude is reactive — it can't ping someone on Slack unprompted between sessions)
- Approval tracking across people and time
- A dashboard for visualization

You're describing a **workflow orchestration platform** that happens to use Claude for the heavy cognitive work. The CLI could remain the interface for the person *currently interacting* with Claude, but the orchestration layer needs to live outside of it.

### 2. The "Put Claude on Hold" Problem

You said: *"put Claude and the flow on hold, have the conversation offline, then return to resume."*

This sounds simple but it's the hardest technical challenge. Today:
- Claude sessions lose context (compaction, session death, context limits)
- Memory-bank helps, but it's markdown files — not a state machine
- Resuming a complex pipeline after a week of offline conversations requires Claude to understand *what changed* and *what decisions were made* without being present for them

The state representation needs to be far more structured than the current memory-bank. You'd need something like:

- **Pipeline state** — which step, who's responsible, what's blocking, what approvals are in
- **Decision log** — what was decided, by whom, when, and the rationale
- **Artifact versions** — which version of requirements/design is current, what changed since last review
- **Pending inputs** — what Claude needs before it can proceed

And critically, when someone returns to Claude after a week, there needs to be a structured "catch-up" protocol — not just "read the memory bank and hope."

### 3. Multi-Input Resolution is Genuinely Hard

You identified this correctly: *"We don't want Claude to react to every input and feedback."*

This is a consensus problem. Options I see:

- **Lead-as-gatekeeper**: The step lead collects all feedback offline, synthesizes it into a single directive, and gives that to Claude. Claude never sees the raw debate. Simple, but puts burden on the lead.
- **Collect-then-synthesize**: Claude collects all inputs (via GitHub comments, a structured form, etc.), presents a synthesis to the lead, and the lead approves the synthesis before Claude acts. More automated, but Claude might misinterpret priorities.
- **Time-boxed review**: Feedback window opens, all parties submit structured input (not freeform), window closes, lead resolves conflicts, Claude executes. Most structured, most overhead.

My instinct: **Lead-as-gatekeeper is the right starting point.** The lead is accountable for that step. They should be the one to distill the noise into signal. Claude's job is to execute well on clear instructions, not to navigate organizational politics.

### 4. Approvals Sound Simple But Aren't

"Approvals are binary" — yes, but:

- **Who can approve?** Role-based. PDM approves PRD, engineering approves design. This needs an identity/authorization model that Claude Code doesn't have.
- **Approvals can be rescinded.** Now you need state rollback. If design was approved but then requirements change, all downstream approvals are automatically invalidated. That's a dependency graph problem.
- **"All required approvals are in" triggers next step.** This is a classic workflow engine pattern (like Jira transitions, GitHub required reviewers). Building it from scratch in Claude sessions would be fragile.

The honest assessment: **use existing approval infrastructure** (GitHub PR required reviewers, Jira workflow transitions) rather than building approval tracking in Claude. Claude should *react to* approval events, not *manage* them.

### 5. Normal vs. Stress Intake

You said the difference is time. I'd push back slightly — the difference isn't just time, it's **which gates you can compress without unacceptable risk.**

In Stress mode, the temptation is to skip gates. The value of a structured flow is making the *tradeoffs explicit*:

- Skip formal requirements? Fine, but Claude documents what was assumed and flags the risk.
- Compress design review? Fine, but the approval trail shows it was fast-tracked, not fully reviewed.
- MVP-then-follow-up? Claude generates both scopes and tracks what was deferred.

The flow should be the same pipeline with **configurable gate policies** — not a separate "fast" pipeline. A fast pipeline inevitably becomes the only pipeline.

### 6. Cross-Domain Coordination

When work spans promise, checkout, and PDP, you don't have one engineering team providing constraints — you have three. The current flow assumes one set of supplemental instructions per step. Cross-domain would need:

- Multiple supplemental documents, potentially conflicting
- A resolution step (who wins when promise engineering and checkout engineering disagree on API design?)
- Possibly separate design artifacts per domain that get integrated

This is where the "correct way" vs. reality tension is sharpest. The correct way is a unified design with all domains at the table. Reality is each domain does their piece and integration happens in code. Claude could actually help here — it can synthesize cross-domain constraints better than any human, if given all the inputs.

## What I Think the Architecture Looks Like

```
┌─────────────────────────────────────────────────┐
│  Workflow Layer (NOT Claude)                     │
│  State machine, approvals, notifications         │
│  Could be: Jira workflows, GitHub Actions,       │
│  custom app, or a combination                    │
└──────────────────┬──────────────────────────────┘
                   │ triggers / events
┌──────────────────┴──────────────────────────────┐
│  Claude Execution Layer                          │
│  Receives: step + artifacts + instructions       │
│  Produces: generated artifact (reqs, design...)  │
│  Returns: artifact to workflow layer              │
│  Stateless per invocation — state lives above    │
└──────────────────┬──────────────────────────────┘
                   │ reads/writes
┌──────────────────┴──────────────────────────────┐
│  Artifact Store (GitHub)                         │
│  PRDs, requirements, designs, plans, stories     │
│  Versioned, reviewable, commentable              │
└──────────────────┬──────────────────────────────┘
                   │ integrates
┌──────────────────┴──────────────────────────────┐
│  Collaboration Layer (existing tools)            │
│  Slack: conversations, notifications             │
│  Jira: work tracking, approval status            │
│  Confluence: published artifacts                 │
│  Meetings: offline resolution                    │
└─────────────────────────────────────────────────┘
```

Claude becomes a **powerful tool within a workflow**, not the workflow itself. The workflow layer handles state, approvals, multi-user coordination, notifications. Claude handles the cognitive heavy lifting when invoked.

## The Honest Gaps

1. **There is no "Claude as a service" today** that persists between sessions and reacts to events. The Claude API exists, but building the execution layer around it is custom engineering work. Claude Code CLI works for the "person currently talking to Claude" but not for "Claude waits for 3 approvals then generates requirements."

2. **The supplemental instruction pattern is excellent** but needs structure. A freeform document will produce inconsistent results. You'd want templates: "Requirements Guidelines" template, "Design Constraints" template, etc. — structured enough for Claude to parse reliably, flexible enough for humans to express what they need.

3. **The visualization problem is real.** A CLI-based pipeline status won't work for directors and VPs. You need either a web dashboard or heavy use of existing tools (Jira board as pipeline view, with epics per pipeline step and tickets per approval).

4. **The "offline conversation" re-ingestion problem is unsolved.** When someone says "we had a meeting and decided X," Claude has to take that on faith. If you want Claude to actually understand the context, someone needs to feed it in — meeting notes, Slack thread links, decision summaries. The quality of Claude's work is directly proportional to the quality of the input at these re-entry points.

## What I'd Build First

If I were making this real, I'd start with:

1. **Structured pipeline state file** (not memory-bank markdown — a proper JSON/YAML state machine with steps, owners, approval status, artifact locations)
2. **"Resume" protocol** — a defined sequence Claude follows when re-entering a pipeline mid-flight (read state, diff artifacts since last session, ask lead what changed)
3. **Supplemental instruction templates** — structured formats for each step's guidelines
4. **GitHub as the collaboration hub** — PRs for artifact review, required reviewers for approvals, comments for feedback, labels for pipeline state
5. **Jira integration for visibility** — auto-created epic per project, tickets per pipeline step, transitions as approvals

And I'd explicitly **not** build: a custom approval system, a custom notification system, or a custom dashboard. Use the tools the org already uses.

## The Deeper Question

The most important thing you said was: *"what we should do (the 'correct' way) is considered but almost never the option chosen."*

A structured flow with Claude won't fix that by itself. It will make the tradeoff *visible* — Claude can say "here's the correct design, here's the shortcut, here are the risks" — but the organizational incentives that favor shortcuts over correctness are a human problem.

What the flow *can* do is create an **audit trail of decisions**. When the Anniversary deadline forces a shortcut and it breaks in production, the decision log shows exactly when and why the shortcut was chosen, by whom, and what the alternative was. That's not just accountability — it's institutional learning.

---

## Pushback: "I feel like we are just duplicating the workflow we have now with humans, except that AI helps with document, stories, and code generation. What is the forward-thinking way?"

---

You're right. What I described was paving the cow path — same human workflow, same sequential gates, same meetings and Slack threads, just with AI generating the documents faster. That saves time on artifact creation but doesn't touch the actual problem.

## The Actual Problem

The pain you described isn't "documents take too long to write." It's:

- **Context is scattered** across Slack threads, meetings, Confluence, Jira, and people's heads
- **Decisions are invisible** — they happen in conversations but aren't captured, so they get re-litigated
- **Miscommunication is structural** — five people leave a meeting with five different understandings, and nobody finds out until code is written
- **The "correct" path is known but never chosen** because the overhead of doing it right (formal requirements, proper design review) doesn't feel worth it under time pressure
- **Coordination is the bottleneck**, not generation

Faster document generation doesn't fix any of that.

## The Shift

The current model — including what I described earlier — is:

> Humans coordinate (poorly) → periodically stop to create artifacts → review artifacts → continue

The forward-thinking model inverts this:

> Claude continuously absorbs context → maintains a living understanding → surfaces conflicts and decisions → humans validate and steer

**Claude isn't the artifact generator. Claude is the organizational memory and synthesis layer.**

## What This Actually Looks Like

### Claude is always accumulating context

Not "start a session, feed Claude a PRD." Claude is passively ingesting project-related signals continuously:

- Slack channels where the project is discussed (it already can read Slack via MCP)
- Jira tickets being created and updated
- Confluence pages being edited
- Code changes in relevant repos
- Meeting notes (when someone drops them in a channel or doc)

Claude isn't waiting for someone to invoke a pipeline step. It's building and updating a **living model** of the project — what's been decided, what's still open, who thinks what, where the constraints are.

### Artifacts are views, not deliverables

In the current model, the PRD is a document someone writes. Requirements are a document an agent generates. Design is another document. They're discrete artifacts created at discrete moments.

In the forward model, these are **continuously-updated views** into Claude's understanding:

- "Show me the current requirements" → Claude synthesizes everything it knows into a requirements view, right now
- "Show me the design constraints engineering has raised" → Claude pulls from Slack threads, Jira comments, Confluence docs
- "What's the current scope for MVP?" → Claude synthesizes across product and engineering inputs

These views are always current because Claude's model is always current. There's no "requirements gathering phase" — requirements are continuously emerging from conversations, and Claude is continuously tracking them.

### Proactive conflict detection — not reactive review

This is where the real value is. The single most expensive problem you described is miscommunication discovered late. Claude, with continuous context, can catch this in real time:

> *"Two hours ago in #promise-eng, team A said they'd expose a new API for this initiative. But yesterday in #checkout-eng, team B said they're deprecating the endpoint team A is planning to build on. These teams may not be aware of the conflict."*

> *"The business stakeholder said 'Anniversary deadline is firm' in the exec review notes. But engineering's design assumes a phased rollout that extends past Anniversary. Someone needs to reconcile this."*

> *"PDM added a requirement in Confluence yesterday that contradicts what engineering agreed to in last Thursday's Slack thread. Here's the specific conflict."*

This isn't Claude generating a document and asking for review. This is Claude actively preventing the miscommunication problem at the source — when the conflicting signals first appear, not weeks later when code doesn't work.

### Crystallization, not approval workflows

Instead of formal gates where documents get "approved," you have **crystallization moments**. Claude says:

> *"Based on conversations over the past two weeks, here's what I believe the agreed-upon requirements are. I've synthesized inputs from [PDM] in Slack, [engineer] in the design doc, and [business stakeholder] in the Jira epic. Does this accurately capture the current understanding?"*

This is fundamentally different from "Claude generated requirements, please review a document you've never seen." The people involved have already shaped these requirements through their conversations. Claude is just reflecting back what it heard, organized and structured. The "review" is confirming accuracy, not evaluating new content.

If people disagree with the crystallization: that's a signal that the conversation isn't actually converged yet. Claude can pinpoint exactly where the disagreement is, who holds which position, and what information might resolve it.

### Time pressure as an input, not a mode

You don't need "Stress Intake" as a separate workflow. Time pressure is just a constraint Claude factors into its synthesis:

> *"Given the Anniversary deadline (12 weeks), the current scope requires approximately 18 weeks of engineering work based on the design complexity I'm seeing. Options: (1) Cut features X, Y, Z for MVP — here's what you lose and the risk. (2) Increase team by 2 engineers — here's the coordination cost. (3) Simplify the design by doing A instead of B — here's the technical debt. I recommend option 1 because..."*

Claude doesn't wait to be asked. It proactively flags when scope and timeline are diverging, because it's continuously tracking both.

## Why This Isn't Just a Fantasy

The pieces exist today:

| Capability | Status |
|-----------|--------|
| Read Slack conversations | MCP server exists, working |
| Read Jira tickets and updates | MCP server exists, working |
| Read Confluence docs | MCP server exists, working |
| Read GitHub code and PRs | MCP server exists, working |
| Synthesize across sources | Claude does this well right now |
| Detect contradictions | Claude does this well right now |
| Generate structured artifacts | Workshop proves this works |

What's missing is the **persistence and proactivity layer** — the thing that keeps Claude continuously aware and able to act without someone opening a CLI session.

## The Real Architecture

```
┌─────────────────────────────────────────────────────┐
│  Persistent Project Intelligence                     │
│                                                      │
│  Continuously ingests:                               │
│    Slack channels · Jira updates · Confluence edits  │
│    Git commits · Meeting notes                       │
│                                                      │
│  Maintains:                                          │
│    Living project model (decisions, requirements,    │
│    constraints, conflicts, open questions, scope)    │
│                                                      │
│  Proactively:                                        │
│    Flags conflicts · Surfaces risks · Tracks         │
│    convergence · Identifies when crystallization     │
│    is possible                                       │
│                                                      │
│  On demand:                                          │
│    Generates any view (PRD, requirements, design,    │
│    plan, stories) from current model state           │
│    Answers "where are we on X?" instantly            │
│                                                      │
│  When crystallization is approved:                   │
│    Produces implementation artifacts (stories, code) │
│    with full context of WHY, not just WHAT           │
└─────────────────────────────────────────────────────┘
```

There's no "step 1, step 2, step 3." There's a continuously-evolving understanding that periodically crystallizes into actionable artifacts when the humans are ready.

## The Honest Hard Parts

**What makes this difficult isn't AI capability — it's organizational change:**

1. **Trust.** People need to trust that Claude's synthesis is accurate. One bad synthesis ("Claude said we agreed on X but we didn't") and adoption dies. The system needs to always show its sources — "I believe X based on [link to Slack message] and [link to Jira comment]."

2. **The surveillance feeling.** Claude reading all Slack channels will make some people uncomfortable. The framing matters: it's not monitoring people, it's maintaining project context. But you need explicit opt-in and clear boundaries about what's ingested.

3. **"The correct way" problem.** You said this is known but never chosen. Claude can make the cost of shortcuts visible — "if you skip this, here's the specific technical debt and the likely cost to fix it later" — but it can't override the organizational incentive to ship fast. What it CAN do is create an **institutional memory of tradeoffs**. The third time a shortcut causes a production incident, the pattern is documented and undeniable.

4. **Cross-domain synthesis is where this shines brightest but is hardest to deploy.** Having Claude track conversations across promise, checkout, and PDP simultaneously and flag cross-team conflicts is enormously valuable. But it also means one system has context that no single human has. That's powerful and uncomfortable simultaneously.

## What to Build Toward

Practically, the near-term move isn't building the full vision. It's:

1. **Pick one active initiative.** Let Claude ingest its Slack channel, Jira epic, and Confluence space.
2. **Ask Claude to synthesize weekly.** "Based on everything in these channels this week, what decisions were made, what conflicts exist, what's still open?"
3. **Test the trust.** Do people look at Claude's synthesis and say "yes, that's accurate?" If not, why not?
4. **Measure the value.** Did Claude catch a miscommunication that would have been caught two weeks later? Did the synthesis save a meeting?

If that works, you have the proof point to build the persistent layer. If it doesn't, you learn why before investing in infrastructure.

The workshop we have is a fine tool for teaching people what AI can do. The forward-thinking PDLC isn't a better pipeline — it's eliminating the need for a pipeline at all, by making the understanding continuous.

---

## Follow-up: "So the workshop will show a way of working with AI that is not the north star we should be reaching for. Given we are doing the workshop and given the north star, how do we get there?"

---

Good question. The workshop teaches people that AI can do cognitive work — generate requirements, write designs, produce code. That's necessary but it's the floor, not the ceiling. The risk is people walk away thinking "cool, AI can generate documents for me" and that becomes the ceiling in their minds.

So the question is: how do you design the journey so the workshop is the on-ramp, not the destination?

## The Workshop's Actual Value

The workshop isn't valuable because of the pipeline. It's valuable because it establishes three things you can't skip:

1. **Trust** — People see Claude produce accurate, useful output from *their* project. Not a demo. Their actual domain, their actual codebase, their actual Jira. Without this, nobody will trust the north star.

2. **Mental model shift** — Engineers go from "AI is autocomplete" to "AI can reason about my system." That shift has to happen in their heads before anything else works.

3. **Infrastructure** — MCP connections to Slack, Jira, Confluence, GitHub are established and tested. These are the nervous system for every phase that follows. The workshop is the reason they get set up.

None of those are about the pipeline. The pipeline is the *vehicle* for delivering them.

## The Path

### Phase 1: Workshop (now)

**What it teaches:** AI generates artifacts from instructions. Human validates. Agents coordinate.

**What people walk away with:**
- Working MCP connections to their tools
- Familiarity with Claude's capabilities and limitations
- A completed project to reference
- Trust (or skepticism, which is equally useful data)

**What to plant during the workshop:** At the end, don't just say "great job, you built an app." Show them the gap. Show them the forward-look doc. Say: "You just spent 3 hours feeding Claude a PRD and walking through a pipeline. What if Claude already knew everything about your project because it's been reading your Slack and Jira for the past month? What would you have skipped? What would you have asked instead?"

That question reframes the workshop from "the way" to "the starting point."

### Phase 2: Claude on Real Projects — "Context Sync"

**The shift:** From "feed Claude a PRD" to "Claude reads your project's actual context."

**What you build:**
- A `/sync-project` command (or similar) that connects Claude to a real initiative's Slack channels, Jira epic, Confluence space, and GitHub repos
- Claude pulls recent activity from all sources and synthesizes: decisions made, open questions, current scope, who's working on what
- The pipeline skills still exist, but they read from *live sources*, not just a static PRD

**What changes for the user:**
- Instead of writing a PRD from scratch, they say "sync with #project-x-eng and PROJ-1234" and Claude drafts the PRD from what it finds
- Instead of manually describing the tech stack, Claude reads the repo and knows
- Requirements generation considers what's already been discussed in Slack, not just what's in a document

**Why this phase matters:** It's the first time people experience Claude *knowing things they didn't explicitly tell it*. That's the conceptual leap from "tool I instruct" to "intelligence that understands my context." And it's buildable today — the MCP integrations exist, the synthesis capability exists, you just wire them together.

**What you learn:** Is Claude's synthesis accurate enough for real, messy, ongoing projects? Where does it get confused? What context does it miss? These answers shape everything after.

### Phase 3: Persistent Memory — "Claude Remembers"

**The shift:** From "each session starts fresh" to "Claude maintains understanding across time."

**What you build:**
- A structured project state store (not markdown — a proper schema with decisions, requirements, constraints, conflicts, open questions, each with source links and timestamps)
- A resume protocol: when someone opens a session, Claude reads the state, diffs what changed since last session, and says "here's what I know changed since we last talked"
- Multi-user awareness: Claude knows that the person talking to it now is an engineer vs. a PDM, and adjusts what it surfaces

**What changes for the user:**
- Monday: engineer discusses API design with Claude, makes decisions
- Wednesday: PDM opens Claude, asks "what did engineering decide about the API?" — Claude knows, with source links
- Friday: different engineer opens Claude, picks up where Monday's session left off — no re-explanation needed

**Why this phase matters:** This is where the "organizational memory" idea becomes real. Claude stops being a session-scoped tool and becomes a project-scoped intelligence. The pipeline skills become "views" — you can still say "generate requirements" but Claude draws from accumulated context, not a single input document.

**The hard engineering:** The project state store is real infrastructure. It needs to survive Claude session boundaries, be writable from any session, handle conflicts, and be structured enough for Claude to reason about reliably. This is probably a lightweight service or well-structured files in the repo — not a product you buy.

### Phase 4: Proactive Intelligence — "Claude Surfaces"

**The shift:** From "human invokes Claude" to "Claude flags what humans need to know."

**What you build:**
- An event listener that watches for changes in project-related Slack channels, Jira tickets, Confluence pages, PRs
- When Claude detects something significant (conflict, scope change, decision, risk), it posts a synthesis to a project channel or updates a dashboard
- Crystallization detection: Claude recognizes when conversations have converged on a decision and proposes to lock it in

**What changes for the user:**
- They're in a Slack thread debating an approach. Claude (as a bot or via a digest) says: "This conflicts with what the checkout team decided last week. Here's the specific tension."
- They get a weekly digest: "3 decisions were made, 2 conflicts are unresolved, scope has grown by ~15% since last week's crystallization"
- When enough convergence exists, Claude proposes: "I think requirements for the order API are stable. Here's what I'd crystallize. Want me to?"

**Why this phase matters:** This is the north star behavior — continuous awareness, proactive synthesis, conflict detection. But it requires all previous phases. Without trust (Phase 1), people reject it. Without real-project accuracy (Phase 2), it's wrong. Without persistent memory (Phase 3), it has no continuity.

## What Carries Forward, What Gets Left Behind

| Workshop Concept | Evolves Into | Left Behind |
|---|---|---|
| MCP integrations | Nervous system for all phases | — |
| Agent specialization (requirements-agent, design-agent) | On-demand view generators from living context | Generating from static PRD input |
| Memory bank | Structured project state store | Markdown files, session-scoped |
| Human-in-the-loop | Crystallization validation | Sequential gate approvals |
| Pipeline sequence | Fast-start for new initiatives | Default mode for all work |
| Single session | — | Replaced by persistent memory |
| Single user | — | Replaced by multi-user awareness |
| "Generate X" | "Show me current X" | Artifacts as deliverables |

The pipeline doesn't die — it becomes the **bootstrap mode**. Brand new initiative, nothing exists yet? Run the pipeline to get a foundation fast. Ongoing initiative with weeks of context? Skip the pipeline entirely — the understanding already exists.

## The Concrete Bridge

What to build between the workshop and Phase 2 — the first real step:

**1. `/sync-project` skill** — Takes a Slack channel, Jira epic, and optionally a Confluence space and GitHub repo. Pulls recent activity. Synthesizes into a structured context: key decisions, open questions, current scope, team members, timeline. This is probably 2-3 days of work given the MCP infrastructure already exists.

**2. Modified `/refine-prd` that starts from sync** — Instead of "here's a blank PRD, let me ask you questions," it's "I've read your project context, here's what I understand, what am I missing?" The PRD becomes a validated synthesis, not a creation.

**3. A weekly synthesis digest** — Not proactive (that's Phase 4), but on-demand. "Give me a synthesis of what happened on project X this week." Engineer runs it Monday morning. If the synthesis is accurate, you're proving the foundation for proactive mode.

These three things are buildable with the current workshop infrastructure. They're also immediately useful — an engineer gets value from running `/sync-project` on their real initiative tomorrow, without any new platform or infrastructure.

## The Narrative for the Workshop

Close the workshop with something like:

> "Today you ran a pipeline: PRD → requirements → design → stories → code. You saw AI generate each artifact and you validated it. That's powerful — it compresses weeks into hours.
>
> But think about this: you spent the first 30 minutes telling Claude about your project. What if Claude already knew? It's already connected to your Slack, your Jira, your Confluence. What if it had been reading those for the past month?
>
> The pipeline you ran today is the bootstrap — for when you're starting from zero. The future is Claude that already understands your project because it's been paying attention. You wouldn't 'generate requirements.' You'd say 'show me what the requirements look like based on everything you've seen.' And Claude would show you, with links to the Slack messages and Jira tickets where each requirement emerged.
>
> That's where we're going. Today was step one."

That framing turns the workshop from "we learned a process" into "we proved the capability and now we're going to expand how it's applied."

## What This Means for Workshop Design

A few intentional choices to make the workshop a better on-ramp:

1. **Use real project context during the workshop, not just the PRD.** Even in the current flow, encourage teams to have Claude read their actual Slack channels and Jira during `/refine-prd`. Let them see the synthesis capability early.

2. **Point out the seams.** When someone has to manually type context that Claude could have read from Slack, say so. "Notice how you just told Claude about a constraint that's already in your Jira ticket. In the next phase, Claude would already know that."

3. **End with the forward-look, not with a completed project.** The project is a proof of capability. The value is in what comes next.

4. **Assign homework.** After the workshop, each team runs `/sync-project` (once it exists) on their current real initiative and reports back: was the synthesis accurate? What did Claude miss? That data directly informs Phase 2 development.

The workshop is the right first step. It just needs to be explicitly framed as the first step, not the destination.

---

## Follow-up: "/sync-project and running it from /refine-prd would be a good feature to provide Product for next step. I'd like to implement something for engineering that is also as impactful. What do you think that could be? I think the most impactful is to individual teams like Promise, Routing/FP, SCN, ECMS - not so much cross team. Something that will immediately benefit them but still in line with the north star"

---

Good framing — `/sync-project` for Product, and something equally impactful for Engineering. Different roles, different pain points.

Let me think about what individual engineering teams actually spend time on that's wasteful.

## The Engineering Tax

Product's pain is scattered context and miscommunication. Engineering's pain is different. For teams like Promise, Routing/FP, SCN, ECMS, the daily tax is **context reconstruction.**

Every day, engineers on these teams:

- Pick up a Jira ticket and spend 30-60 minutes understanding the area of code it touches, because the last person who worked on it left 6 months ago
- Get paged at 2am and spend the first 20 minutes figuring out what the service does, what changed recently, and where the runbook is — before they even start diagnosing
- Review a PR and have to trace through 4 services to understand whether the change is safe
- Answer the same questions from new team members that they answered 3 months ago for the last new hire
- Check Confluence for how something works, find a doc from 2022 that doesn't match the code, then read the code anyway

The common thread: **engineers repeatedly reconstruct understanding that exists somewhere — in code, in Slack history, in someone's head — but isn't synthesized or accessible.**

This is the engineering equivalent of Product's scattered context problem. And it's per-team — Promise's system knowledge is completely different from Routing's.

## What Would Hit Hardest

I think it's: **Claude that actually knows your team's system** — not because someone wrote a doc, but because it read the code, the schemas, the data, the incidents, and the Slack discussions about why things are built the way they are.

The concrete skill: something like **`/know-my-system`**

An engineer runs it, points Claude at their team's domain:
- Repos (the actual code — clone and read, not just README)
- Kafka schemas (via schema repo MCP)
- Databases and DynamoDB tables (via the MCP datasource setup we just built)
- Confluence space (runbooks, architecture docs, onboarding guides)
- ServiceNow incidents (recent operational issues for their services)
- Slack channels (engineering discussions, incident threads)

Claude ingests all of this and builds a **structured system profile** — stored persistently so it carries across sessions.

Then the immediate, daily value is: **any engineer on the team can ask Claude anything about their system and get an accurate, code-referenced answer.**

Not "Claude, write me a document." Instead:

> "How does the routing algorithm decide which FC to route to?"
> → Claude answers with specific file paths, line numbers, and logic flow from the actual code

> "What's the schema of the order fulfillment event and who consumes it?"
> → Claude pulls from schema repo and cross-references with consumer code

> "What are all the places we handle backorder logic?"
> → Claude greps across repos, shows every touchpoint, explains the flow

> "What was the last P1 incident on this service and what was the root cause?"
> → Claude pulls from ServiceNow, correlates with git history around that date

> "If I change the retry logic in the shipping API, what downstream services are affected?"
> → Claude traces the dependency chain through actual code, not a stale architecture diagram

## Why This Hits Different Than `/scan-codebase`

We already have `/scan-codebase`, but it's a one-shot analysis of a single repo. What I'm describing is different in three ways:

1. **Multi-source.** It's not just code. It's code + schemas + data + incidents + discussions. The value is in the synthesis across sources. The code says *what*, the Slack history says *why*, the incidents say *what breaks*, the schemas say *what flows where*.

2. **Persistent.** The system profile lives across sessions. Engineer A builds it Monday, engineer B benefits Tuesday without re-running anything. It accumulates understanding over time, not just snapshots.

3. **Queryable, not a report.** `/scan-codebase` produces a document. This produces *understanding* that Claude carries. The output isn't a file — it's Claude being able to answer questions accurately.

## Why It Aligns With the North Star

The north star is: Claude as continuous project intelligence that understands your domain because it's been paying attention.

`/know-my-system` is the engineering on-ramp to that:

| Phase | What It Looks Like |
|---|---|
| Workshop (now) | `/scan-codebase` on a single repo, one-shot |
| Phase 2 (`/know-my-system`) | Multi-source ingestion, persistent profile, queryable |
| Phase 3 | Profile auto-updates as code changes, new incidents happen, Slack discussions occur |
| Phase 4 (north star) | Claude proactively flags: "The retry logic you changed last week — I'm seeing elevated errors in ServiceNow that match the pattern from the P2 incident in October" |

Each phase builds on the previous one. And Phase 2 is immediately useful without requiring any of the later infrastructure.

## The Immediate Payoff for Each Team

**Promise team:** "How does the promise calculation work for ship-from-store orders?" → Claude walks through the actual algorithm, references the specific service, explains the edge cases it found in the code, and notes that the Confluence doc from 2023 says something different than what the code does today.

**Routing/FP:** "What data does the routing engine need from NodeDetails to make a decision?" → Claude correlates the DynamoDB table schema (which it knows from the MCP datasource we just set up) with the code that reads it, shows exactly which fields are used and how.

**SCN:** "What happens when a node goes offline in the supply chain network?" → Claude traces the event flow through Kafka schemas and consuming services, shows the fallback logic in code.

**ECMS:** "Show me every API endpoint this service exposes and who calls them." → Claude reads the code, maps the endpoints, cross-references with other repos that import the client.

Every one of those questions takes an engineer 30-90 minutes to answer by manually searching code, Slack, Confluence, and asking teammates. Claude answers in seconds — with code references.

## What Makes It Trustworthy

The critical thing for engineering adoption: **every answer must be grounded in code with references.** Not "the routing algorithm uses a weighted scoring model" but "the routing algorithm in `routing-engine/src/main/java/com/nordstrom/routing/Scorer.java:147` uses a weighted scoring model with these factors: [list from actual code]."

If Claude says something about the system, the engineer can click through and verify. That's what builds trust. And that's what makes this different from asking ChatGPT about your system — ChatGPT doesn't know your code. This Claude does.

## The Concrete Build

The skill would:

1. Ask the engineer for their team's repos (git URLs), Confluence space, Slack channels, ServiceNow service names
2. Clone and scan repos (code, not just config files — deep reading of business logic, APIs, data access)
3. Pull Kafka schemas from schema repo MCP for relevant topics
4. If databases/DynamoDB are involved, use existing MCP datasource connections to understand data shape
5. Read Confluence space for runbooks and architecture docs (noting where they diverge from code)
6. Pull recent ServiceNow incidents for their services
7. Read recent Slack threads for engineering context and decisions
8. Synthesize into a structured system profile stored in memory-bank (or a more structured store)
9. From that point forward, Claude can answer questions about the team's system accurately

The infrastructure is mostly there — MCP connections exist, code scanning exists, memory bank exists. The new work is the multi-source synthesis and the persistent profile structure.

## One More Thought

The `/sync-project` for Product synthesizes **what's being decided** (conversations, requirements, scope).

The `/know-my-system` for Engineering synthesizes **what exists** (code, schemas, data, operational history).

These are complementary halves of the same vision. Product's living context + Engineering's living system understanding = the full picture that no single person has today. Eventually they merge — Claude knows both the product intent and the technical reality, and can flag when they're diverging.

But start with each being useful independently to its audience. Product doesn't need to care about code internals. Engineering doesn't need to care about PRD negotiations. Each gets value on its own terms. The synthesis comes in Phase 3-4.
