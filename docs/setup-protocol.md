# Setup Check Protocol

This file contains the full setup check and onboarding protocol for the Agentic AI Workshop. It is referenced from CLAUDE.md and should be read when a user asks about their setup or wants to start using the workshop tooling.

---

## Verifying MCP Server Configuration

When the user asks about their Claude Code setup or MCP server configuration, use these commands to check:

**1. List MCP servers at user scope:**
```bash
bash scripts/check-mcp-config.sh
```
This script is pre-allowed in `.claude/settings.json` so it runs without permission prompts.

**2. Check environment variables for MCP authentication:**
```bash
bash scripts/check-env.sh
```
This script is pre-allowed in `.claude/settings.json` so it runs without permission prompts.

**Key locations:**
- `~/.claude.json` — Main Claude Code config (contains `mcpServers` at user scope)
- `~/Library/Application Support/Claude/claude_desktop_config.json` — Claude Desktop app config (NOT Claude Code CLI)

**Important:** Do NOT confuse Claude Desktop config with Claude Code CLI config. They are separate.

## Verifying MCP Server Connection Status

After checking configuration and environment variables, verify that MCP servers are actually running and responding by calling a lightweight health check tool for each. **Run all checks in parallel** for speed.

| MCP Server | Health Check Tool | Args |
|------------|------------------|------|
| `jira-mcp` | `mcp__jira-mcp__server_info` | _(none)_ |
| `confluence-mcp` | `mcp__confluence-mcp__server_info` | _(none)_ |
| `github` | `mcp__github__get_me` | _(none)_ |
| `aha-mcp` | `mcp__aha-mcp__search_documents` | `query: "test"` |
| `servicenow` | `mcp__servicenow__health_check` | _(none)_ |
| `nordstrom-slack` | `mcp__nordstrom-slack__get_channel_messages` | `channel_name: "general", limit: 1` |
| `nordstrom-schema-repo` | `mcp__nordstrom-schema-repo__list_domains` | _(none)_ |
| `nordstrom-standards-chat` | `mcp__nordstrom-standards-chat__search` | `query: "test"` |
| `mawm-data` | `mcp__mawm-data__get_table_list` | `schema_name: "default_receiving"` |

**Interpreting results:**
- **Success** (any valid response) → server is connected and authenticated
- **Error/timeout** → server is not running, not configured, or credentials are invalid
- Record each result as `Connected` or `Not Connected` for the status table

## MCP Servers

The following MCP servers are configured by the setup script. If any fail to connect, the workshop continues — steps that need an unavailable server will stop at that point.

| Server Key |
|------------|
| `jira` |
| `confluence-mcp` |
| `github` |
| `nordstrom-schema-repo` |
| `aha-mcp` |
| `servicenow` |
| `nordstrom-slack` |
| `nordstrom-standards-chat` |
| `mawm-data` |

## Required Environment Variables

The following environment variables **must** be set for MCP server authentication:

| Variable | Purpose |
|----------|---------|
| `JIRA_PAT` | Jira Personal Access Token |
| `CONFLUENCE_PAT` | Confluence Personal Access Token |
| `GITHUB_PAT` | GitHub Personal Access Token |
| `AHA_API_TOKEN` | Aha! API authentication |
| `SERVICENOW_USERNAME` | ServiceNow username |
| `SERVICENOW_PASSWORD` | ServiceNow password |
| `GITLAB_TOKEN` | GitLab API authentication (git.jwn.app) |
| `MAWM_USERNAME` | MAWM MySQL database username (FC 499 warehouse data) |
| `MAWM_PASSWORD` | MAWM MySQL database password |
| `ARTIFACTORY_USER` | Artifactory username (required for ServiceNow MCP local setup) |
| `ARTIFACTORY_API_KEY` | Artifactory API key (required for ServiceNow MCP local setup) |

**How to set environment variables:**

Add these to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export JIRA_PAT="your-jira-token"
export CONFLUENCE_PAT="your-confluence-token"
export GITHUB_PAT="your-github-pat"
export AHA_API_TOKEN="your-aha-token"
export SERVICENOW_USERNAME="your-servicenow-username"
export SERVICENOW_PASSWORD="your-servicenow-password"
export GITLAB_TOKEN="your-gitlab-token"
export MAWM_USERNAME="your-mawm-mysql-username"
export MAWM_PASSWORD="your-mawm-mysql-password"
export ARTIFACTORY_USER="your-lanid"
export ARTIFACTORY_API_KEY="your-artifactory-api-key"
```

Then reload your shell: `source ~/.zshrc` (or restart your terminal).

## Setup Check Protocol

When a user asks about their setup or wants to start using the workshop tooling:

**Step 1 — Check MCP Server Configuration:**

1. Run the MCP server config check command (python3 script to read `~/.claude.json`)
2. Compare configured servers against the required list

**Step 2 — Check Environment Variables:**

3. Run the environment variable check command
4. Compare against the required list

**Step 3 — Check MCP Server Connection Status:**

5. Run health check tools for all configured MCP servers **in parallel** (see "Verifying MCP Server Connection Status" above)
6. Record each server as `Connected` or `Not Connected`

**Step 4 — Display Combined Status Table:**

7. Display a single summary table combining all three checks:

```
┌───────────────────────┬────────────┬───────────┬─────────────┐
│ Service               │ Configured │ Env Vars  │ Connected   │
├───────────────────────┼────────────┼───────────┼─────────────┤
│ Jira                  │ ✓          │ ✓         │ ✓           │
│ Confluence            │ ✓          │ ✓         │ ✗           │
│ GitHub                │ ✓          │ ✓         │ ✓           │
│ Aha!                  │ ✗          │ ✓         │ —           │
│ ServiceNow            │ ✓          │ ✗         │ —           │
│ Slack                 │ ✓          │ —         │ ✓           │
│ Schema Repo           │ ✓          │ —         │ ✓           │
│ Standards Chat        │ ✓          │ —         │ ✓           │
│ GitLab                │ —          │ ✓         │ —           │
└───────────────────────┴────────────┴───────────┴─────────────┘
```
   - Use `✓` for pass, `✗` for fail, `—` for not applicable (e.g., no env var needed, or can't check connection if not configured)
   - For servers that are not configured, skip the connection check and show `—`

**Step 5 — Handle Issues (MANDATORY: Ask User):**

8. **If ALL checks pass** (all configured, all env vars set, all connected): proceed directly to "Ready to Start" (Step 6)

9. **If ANY check fails** (missing config, missing env var, or not connected):
   - Display the status table (Step 4) so the user sees exactly what's wrong
   - List specific remediation steps for each issue:
     - Missing MCP server → run `scripts/setup-mcp-servers.sh`, restart Claude Code
     - Missing env var → add to `~/.zshrc`, run `source ~/.zshrc`, restart Claude Code
     - Not connected → check credentials, restart Claude Code, verify network
   - **MUST use `AskUserQuestion`** to ask the user whether to continue:
     ```
     AskUserQuestion:
       questions:
         - question: "Some MCP servers or environment variables are not ready (see above). Do you want to continue anyway? Note: any workflow step that needs a missing/disconnected service will STOP and cannot use workarounds."
           header: "Continue?"
           multiSelect: false
           options:
             - label: "Yes, continue anyway"
               description: "Proceed to project selection — workflows will stop if they need an unavailable service"
             - label: "No, I'll fix the issues first"
               description: "Stop here so I can fix configuration, then restart Claude Code"
     ```
   - **If user chooses "No"**: STOP. Do NOT proceed. Wait for user to fix issues and restart.
   - **If user chooses "Yes"**: proceed to "Ready to Start" (Step 6)

**Step 6 — Team Setup & Branch Creation:**

10. Display "Ready to Start"
11. **Ask for team name** using `AskUserQuestion`:
    ```
    AskUserQuestion:
      questions:
        - question: "What is your team's name? This will be used to create a dedicated branch for your work."
          header: "Team Name"
          multiSelect: false
          options:
            - label: "Enter team name"
              description: "e.g., 'alpha', 'phoenix', 'supply-chain-1' — keep it short, lowercase, no spaces"
    ```
    - The user will type their team name in the "Other" freeform input
12. **Create and checkout a team branch:**
    - Sanitize the team name: lowercase, replace spaces with hyphens, remove special characters
    - Branch name format: `team-{sanitized-name}` (e.g., `team-alpha`, `team-phoenix`)
    - **Check if a branch already exists** (case-insensitive): run `git branch -a | grep -i "team-{sanitized-name}"` to find any existing branch regardless of case
    - If a matching branch exists: checkout that existing branch (`git checkout {existing-branch-name}`) — preserve the original branch's casing
    - If no matching branch exists: create a new branch from `framework-changes` with `git checkout framework-changes && git checkout -b team-{sanitized-name}`
    - Display confirmation: "Switched to branch `{branch-name}`" (existing) or "Created and switched to branch `team-{sanitized-name}`" (new)
    - **All team work happens on this branch** — PRD refinements, memory bank updates, generated docs, etc.

After Step 6 completes, return to CLAUDE.md for Step 7 (Project Selection) and subsequent steps.
