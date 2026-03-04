# Workshop Quick Reference

**What you're doing:** Taking a product idea from PRD to working, tested code — AI agents do the heavy lifting, your team makes every decision.

---
## Getting Started

### Clone Workshop Repository

* **SSH:** `git@github.com:Nordstrom-Sandbox/agentic-ai-workshop.git`
* **HTTPS:** `https://github.com/Nordstrom-Sandbox/agentic-ai-workshop.git`

### Start the Workshop

```bash
./scripts/start-workshop.sh
```

Once Claude is ready, type: **`start`**

Claude guides you from here. You don't need to memorize commands.

---

## The Flow

**Team Name** (Product) --> **Pick/Create Project** (Product) -> **Define PRD** (Product) -> **Review PRD** (Product) ->

**Requirements** (AI/Product approve) -> **Technical Design** (AI/Eng approve) -> **Execution Plan** (AI/Team approve) ->

**UI Prototype** (AI/Team approve) -> **User Stories** (AI/Team approve) -> **Validation** (AI/Team approve) -> 

**Jira Sync** (AI) -> **Implementation** (AI/Eng approve)

---

## Tips

### View Your Team's Workshop Repository

`https://github.com/Nordstrom-Sandbox/agentic-ai-workshop/tree/team-{your team name}`

### Press ESC at Any Point

Even while Claude is working — press **ESC** to talk with Claude.
Ask a question. Change your mind. Give new context. Disagree.
When you're done, type `resume flow`.
Claude remembers where it left off and will continue from that point.

### You Can Re-run Any Previous Steps

Just tell Claude! The flow proceeds from step to step. But you can always go back to a previous step and redo it, change your answers, change ... well, anything.

### Tell Claude to Read GitHub Repos, Slack, Confluence, Jira, ... — CONTEXT IS KING!

You have pre-configured MCP servers for Confluence, Jira, Aha!, Slack, GitHub, ServiceNow, Nordstrom Schema Registry and Engineering Standards. Do not hesitate to tell Claude to go query these sources for additional context. Context is what powers AI!!!

### You have MCP servers!

- GitHub (READ-WRITE)
- Confluence (READ-WRITE)
- Jira (READ-WRITE)
- Aha! (READ-ONLY)
- Slack (READ-ONLY)
- ServiceNow (READ-ONLY)
- Nordstrom Schema Registry
- Engineering Standards 
- MAWM Data (499 database, READ-ONLY)

### Use Skill `/setup-mcp-datasource` to create new MCP server

If you have a data source that does not have an MCP server already configured, create one!
Use `/setup-mcp-datasource` to create an MCP server for a relational database, S3 bucket, or DynamoDB table.

### If You Have Any Questions

If Claude appears to be frozen, or whatever, talk to one of the facilitators.
That would be @Bijesh @lukas @Robert Chang @timapi @Vignesh
OR, slack this channel.