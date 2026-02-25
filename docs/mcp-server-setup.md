# MCP Server Setup for Claude Code

This document describes the MCP (Model Context Protocol) servers configured for the Agentic AI Workshop.

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup-mcp-servers.sh
```

The script will:
1. Check for required environment variables
2. Install and register all MCP servers at user scope
3. Skip servers that are already installed

## MCP Servers

### HTTP-based Servers (Remote)

These servers run remotely and are accessed via HTTP transport:

| Server | Endpoint | Purpose |
|--------|----------|---------|
| **Jira** | `https://api.nordstrom.app/app09978/jira/mcp` | Create/update stories, epics, sprints; query existing work |
| **Confluence** | `https://api.nordstrom.app/app09978/confluence/mcp` | Read/write design docs, runbooks, team pages |
| **GitHub** | `https://api.githubcopilot.com/mcp` | Repository operations, PRs, code search |

### Locally-Cloned Servers

These servers are cloned to `~/.claude-mcp/` and run locally:

| Server | Repository | Purpose |
|--------|------------|---------|
| **ServiceNow** | `Nordstrom-Internal/APP10014-servicenow-mcp` | Query incidents, changes, requests (read-only) |
| **Schema Repo** | `Nordstrom-Sandbox/nordstrom-schema-repo-mcp` | Browse Kafka schemas, search by field/domain |
| **Aha!** | `aha-develop/aha-mcp` | Access product roadmap, features, ideas |

### NPX-based Servers

These servers run via npx without local cloning:

| Server | Package | Purpose |
|--------|---------|---------|
| **Slack** | `github:Nordstrom-Sandbox/gx6c-nordstrom-slack-mcp` | Read Slack messages and threads (read-only) |

## Features

| Server | Read | Write | Notes |
|--------|------|-------|-------|
| Jira | Yes | Yes | Full access to stories, epics, sprints |
| Confluence | Yes | Yes | Full access to pages and spaces |
| GitHub | Yes | Yes | Full repository access |
| ServiceNow | Yes | No | Read-only with basic auth; write requires OAuth |
| Schema Repo | Yes | No | Read-only schema browsing |
| Aha! | Yes | Yes | Access to roadmap and features |
| Slack | Yes | No | Read-only; uses Chrome + Okta SSO for auth |

## Authentication

### Environment Variables

Set these environment variables before running the setup script:

| Variable | Source | Purpose |
|----------|--------|---------|
| `JIRA_PAT` | [Jira Personal Access Tokens](https://jira.nordstrom.com/secure/ViewProfile.jspa) | Jira API authentication |
| `CONFLUENCE_PAT` | [Confluence Personal Access Tokens](https://confluence.nordstrom.com/plugins/personalaccesstokens/usertokens.action) | Confluence API authentication |
| `GITHUB_PAT` | [GitHub Personal Access Tokens](https://github.com/settings/tokens) | GitHub API authentication (requires SSO authorization) |
| `AHA_API_TOKEN` | [Aha! API Keys](https://nordstrom.aha.io/settings/api_keys) | Aha! API authentication |
| `SERVICENOW_USERNAME` | CI pipeline credentials | ServiceNow service account username |
| `SERVICENOW_PASSWORD` | CI pipeline credentials | ServiceNow service account password |

### Creating Tokens

#### Jira PAT
1. Go to [Jira Profile](https://jira.nordstrom.com/secure/ViewProfile.jspa)
2. Find the "Personal Access Tokens" tab
3. Create a new token
4. Export: `export JIRA_PAT=<token>`

#### Confluence PAT
1. Go to [Confluence User Tokens](https://confluence.nordstrom.com/plugins/personalaccesstokens/usertokens.action)
2. Find the "Personal Access Tokens" tab
3. Create a new token
4. Export: `export CONFLUENCE_PAT=<token>`

#### GitHub PAT
1. Go to [GitHub Token Settings](https://github.com/settings/tokens)
2. Click "Generate new token" (classic)
3. Select scopes: `repo`, `read:org`, `read:user`
4. Generate the token
5. **Important:** Configure SSO for the token:
   - Click "Configure SSO" next to the token
   - Authorize for `Nordstrom-Internal`
   - Authorize for `Nordstrom-Sandbox`
6. Export: `export GITHUB_PAT=<token>`

#### Aha! API Token
1. Go to [Aha! API Keys](https://nordstrom.aha.io/settings/api_keys)
2. Click "Generate API key"
3. Give it a descriptive name
4. Copy the token
5. Export: `export AHA_API_TOKEN=<token>`

#### ServiceNow Credentials
ServiceNow uses CI pipeline service account credentials — the same account your CI/CD pipeline uses to create ServiceNow Change Requests. Personal credentials will not work.
- Contact your team lead or DevOps for the service account credentials
- Export: `export SERVICENOW_USERNAME=<username>`
- Export: `export SERVICENOW_PASSWORD=<password>`

### Slack Authentication

The Slack MCP server uses browser-based Okta SSO authentication:
- No API key required
- First use will open Chrome for Okta login
- Requires VPN (Zscaler) connection

## Prerequisites

- **Claude Code CLI** installed and authenticated
- **Python 3.12+** and **uv** package manager (for ServiceNow MCP)
- **Node.js 18+** (for Aha! and Slack MCP)
- **Google Chrome** (for Slack MCP Okta authentication)
- **VPN (Zscaler)** connection for ServiceNow and Slack

## Verifying Installation

After running the setup script, verify the MCP servers:

```bash
claude mcp list
```

You should see all configured servers listed with their scope (user).

## Troubleshooting

### ServiceNow 401 Errors
- Use the CI pipeline service account credentials (the same credentials used to create ServiceNow Change Requests in your CI/CD pipeline)
- Personal credentials will not work — only the CI service account has basic auth access
- Verify `SERVICENOW_USERNAME` and `SERVICENOW_PASSWORD` are set correctly
- Ensure VPN is connected
- Note: Basic auth only works against prod (`nordstrom.service-now.com`), not nonprod

### Slack Authentication Issues
- Ensure Chrome is installed and accessible
- Clear Chrome cache if Okta login persists
- Ensure VPN is connected

### Aha! MODULE_NOT_FOUND
- The setup script runs `npm run build` which creates `build/index.js`
- If issues persist, manually run: `cd ~/.claude-mcp/aha-mcp && npm install && npm run build`

### Schema Repo Installation Failed
- Ensure SSH key is configured for GitHub
- Manually clone and install: `cd ~/.claude-mcp/nordstrom-schema-repo-mcp && ./install-claude-code.sh --scope user`

## Updating MCP Servers

To update locally-cloned MCP servers:

```bash
# ServiceNow
cd ~/.claude-mcp/servicenow-mcp && git pull && source .venv/bin/activate && uv sync --all-groups

# Schema Repo
cd ~/.claude-mcp/nordstrom-schema-repo-mcp && git pull && ./install-claude-code.sh --scope user

# Aha!
cd ~/.claude-mcp/aha-mcp && git pull && npm run build
```

## Removing MCP Servers

To remove a specific MCP server:

```bash
claude mcp remove --scope user <server-name>
```

For example:
```bash
claude mcp remove --scope user servicenow
claude mcp remove --scope user jira-mcp
```
