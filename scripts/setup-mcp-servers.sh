#!/bin/bash
#
# Setup MCP Servers for Claude Code
# This script configures Jira, Confluence, GitHub, ServiceNow, Nordstrom Schema Repo, Aha!, and Slack MCP servers at the user level.
#
# Prerequisites:
#   - Claude Code CLI installed
#   - Python 3.12+ and uv package manager (for ServiceNow MCP)
#   - Environment variables set: JIRA_PAT, CONFLUENCE_PAT, GITHUB_PAT, AHA_API_TOKEN,
#     SERVICENOW_USERNAME, SERVICENOW_PASSWORD, GITLAB_TOKEN
#

set -e

echo "=== Claude Code MCP Server Setup ==="
echo ""

# Check for required environment variables
missing_count=0

if [ -z "$CONFLUENCE_PAT" ]; then
    missing_count=$((missing_count + 1))
    echo "WARNING: CONFLUENCE_PAT is not set."
    echo ""
    echo "  To create a Confluence token:"
    echo "    1. Go to: https://confluence.nordstrom.com/plugins/personalaccesstokens/usertokens.action"
    echo "    2. Find the \"Personal Access Tokens\" tab"
    echo "    3. Create a token"
    echo "    4. Then run: export CONFLUENCE_PAT={confluence token}"
    echo ""
fi

if [ -z "$JIRA_PAT" ]; then
    missing_count=$((missing_count + 1))
    echo "WARNING: JIRA_PAT is not set."
    echo ""
    echo "  To create a Jira token:"
    echo "    1. Go to: https://jira.nordstrom.com/secure/ViewProfile.jspa"
    echo "    2. Find the \"Personal Access Tokens\" tab"
    echo "    3. Create a token"
    echo "    4. Then run: export JIRA_PAT={jira token}"
    echo ""
fi

if [ -z "$GITHUB_PAT" ]; then
    missing_count=$((missing_count + 1))
    echo "WARNING: GITHUB_PAT is not set."
    echo ""
    echo "  To create a GitHub token:"
    echo "    1. Go to: https://github.com/settings/tokens"
    echo "    2. Click \"Generate new token\" (classic)"
    echo "    3. Give it a descriptive name"
    echo "    4. Select scopes: repo, read:org, read:user"
    echo "    5. Generate the token"
    echo "    6. Authorize for SSO:"
    echo "       - Click \"Configure SSO\" next to the token in \"Personal access tokens (classic)\""
    echo "       - Authorize Nordstrom-Internal"
    echo "       - Authorize Nordstrom-Sandbox"
    echo "    7. Then run: export GITHUB_PAT={github token}"
    echo ""
fi

if [ -z "$AHA_API_TOKEN" ]; then
    missing_count=$((missing_count + 1))
    echo "WARNING: AHA_API_TOKEN is not set."
    echo ""
    echo "  To create an Aha! API token:"
    echo "    1. Go to: https://nordstrom.aha.io/settings/api_keys"
    echo "    2. Click \"Generate API key\""
    echo "    3. Give it a descriptive name"
    echo "    4. Copy the token"
    echo "    5. Then run: export AHA_API_TOKEN={aha token}"
    echo ""
fi

if [ -z "$SERVICENOW_USERNAME" ]; then
    missing_count=$((missing_count + 1))
    echo "WARNING: SERVICENOW_USERNAME is not set."
    echo ""
    echo "  Set the ServiceNow service account username (from CI pipeline credentials):"
    echo "    export SERVICENOW_USERNAME={service-account-username}"
    echo ""
fi

if [ -z "$SERVICENOW_PASSWORD" ]; then
    missing_count=$((missing_count + 1))
    echo "WARNING: SERVICENOW_PASSWORD is not set."
    echo ""
    echo "  Set the ServiceNow service account password (from CI pipeline credentials):"
    echo "    export SERVICENOW_PASSWORD={service-account-password}"
    echo ""
fi

if [ -z "$GITLAB_TOKEN" ]; then
    missing_count=$((missing_count + 1))
    echo "WARNING: GITLAB_TOKEN is not set."
    echo ""
    echo "  To create a GitLab token:"
    echo "    1. Go to: https://git.jwn.app/-/user_settings/personal_access_tokens"
    echo "    2. Click \"Add new token\""
    echo "    3. Give it a descriptive name"
    echo "    4. Select scopes: read_api, read_repository"
    echo "    5. Click \"Create personal access token\""
    echo "    6. Copy the token"
    echo "    7. Then run: export GITLAB_TOKEN={gitlab token}"
    echo ""
fi

if [ $missing_count -gt 0 ]; then
    echo "----------------------------------------"
    echo "The MCP servers will be configured with variable references,"
    echo "but you'll need to set these variables before using them."
    echo ""
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo ""
echo "Adding Jira MCP server..."
if claude mcp add --transport http --scope user jira-mcp https://api.nordstrom.app/app09978/jira/mcp \
    --header 'Authorization: Bearer ${JIRA_PAT}' 2>/dev/null; then
    echo "  ✓ Jira MCP server added"
else
    echo "  ⚠ Jira MCP server already exists (skipped)"
fi

echo ""
echo "Adding Confluence MCP server..."
if claude mcp add --transport http --scope user confluence-mcp https://api.nordstrom.app/app09978/confluence/mcp \
    --header 'Authorization: Bearer ${CONFLUENCE_PAT}' 2>/dev/null; then
    echo "  ✓ Confluence MCP server added"
else
    echo "  ⚠ Confluence MCP server already exists (skipped)"
fi

echo ""
echo "Adding GitHub MCP server (user level)..."
if claude mcp add --transport http --scope user github https://api.githubcopilot.com/mcp \
    --header 'Authorization: Bearer ${GITHUB_PAT}' 2>/dev/null; then
    echo "  ✓ GitHub MCP server added"
else
    echo "  ⚠ GitHub MCP server already exists (skipped)"
fi

echo ""
echo "Installing ServiceNow MCP server (user scope)..."
# ServiceNow MCP runs locally with basic auth against prod (READ-ONLY)
# Uses CI pipeline service account credentials
# Note: Write operations (create incident/change) require OAuth, not supported with basic auth
# Requires: Python 3.12+, uv package manager, VPN (Zscaler)
SERVICENOW_MCP_DIR="${HOME}/.claude-mcp/servicenow-mcp"
if [ -d "$SERVICENOW_MCP_DIR" ]; then
    echo "  ⚠ ServiceNow MCP already cloned at $SERVICENOW_MCP_DIR"
    echo "    To update, run: cd $SERVICENOW_MCP_DIR && git pull && source .venv/bin/activate && uv sync --all-groups"
else
    mkdir -p "${HOME}/.claude-mcp"
    git clone git@github.com:Nordstrom-Internal/APP10014-servicenow-mcp.git "$SERVICENOW_MCP_DIR"
    cd "$SERVICENOW_MCP_DIR"
    uv venv
    source .venv/bin/activate
    uv sync --all-groups
    uv pip install --native-tls -e .
    cd - > /dev/null
fi

# Register ServiceNow MCP with Claude Code (only if not already registered)
if claude mcp add --scope user servicenow \
    -e SERVICENOW_AUTH_MODE=basic \
    -e SERVICENOW_INSTANCE_URL=https://nordstrom.service-now.com \
    -e SERVICENOW_USERNAME='${SERVICENOW_USERNAME}' \
    -e SERVICENOW_PASSWORD='${SERVICENOW_PASSWORD}' \
    -- "${SERVICENOW_MCP_DIR}/.venv/bin/python" -m servicenow_mcp.server 2>/dev/null; then
    echo "  ✓ ServiceNow MCP server added (prod, read-only)"
else
    echo "  ⚠ ServiceNow MCP server already exists (skipped)"
fi

echo ""
echo "Installing Nordstrom Schema Repo MCP server (user scope)..."
SCHEMA_REPO_DIR="${HOME}/.claude-mcp/nordstrom-schema-repo-mcp"
if [ -d "$SCHEMA_REPO_DIR" ]; then
    echo "  ⚠ Schema repo already cloned at $SCHEMA_REPO_DIR"
    echo "    To update, run: cd $SCHEMA_REPO_DIR && git pull && ./install-claude-code.sh --scope user"
else
    mkdir -p "${HOME}/.claude-mcp"
    git clone git@github.com:Nordstrom-Sandbox/nordstrom-schema-repo-mcp.git "$SCHEMA_REPO_DIR"
    cd "$SCHEMA_REPO_DIR"
    if ./install-claude-code.sh --scope user; then
        echo "  ✓ Nordstrom Schema Repo MCP server installed (user scope)"
    else
        echo "  ✗ Failed to install Nordstrom Schema Repo MCP server"
    fi
    cd - > /dev/null
fi

echo ""
echo "Installing Aha! MCP server (user scope)..."
AHA_MCP_DIR="${HOME}/.claude-mcp/aha-mcp"
if [ -d "$AHA_MCP_DIR" ]; then
    echo "  ⚠ Aha MCP already cloned at $AHA_MCP_DIR"
    echo "    To update, run: cd $AHA_MCP_DIR && git pull && npm run build"
else
    mkdir -p "${HOME}/.claude-mcp"
    git clone git@github.com:aha-develop/aha-mcp.git "$AHA_MCP_DIR"
    cd "$AHA_MCP_DIR"
    npm install
    npm run build
    cd - > /dev/null
fi

# Register Aha MCP with Claude Code (only if not already registered)
if claude mcp add --scope user aha-mcp \
    -e AHA_API_TOKEN='${AHA_API_TOKEN}' \
    -e AHA_DOMAIN=nordstrom \
    -- node "${AHA_MCP_DIR}/build/index.js" 2>/dev/null; then
    echo "  ✓ Aha! MCP server added"
else
    echo "  ⚠ Aha! MCP server already exists (skipped)"
fi

echo ""
echo "Adding Slack MCP server (user scope)..."
# Slack MCP is read-only, uses Chrome + Okta SSO for auth (no API key needed)
# Requires: Node.js 18+, Google Chrome, VPN (Zscaler)
if claude mcp add --scope user nordstrom-slack \
    -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
    -- npx github:Nordstrom-Sandbox/gx6c-nordstrom-slack-mcp 2>/dev/null; then
    echo "  ✓ Slack MCP server added (read-only)"
    echo "    Note: First use will open Chrome for Okta login"
else
    echo "  ⚠ Slack MCP server already exists (skipped)"
fi

echo ""
echo "=== Installing Claude Code Skills ==="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Installing GitLab API Access skill..."
GITLAB_SKILL_SRC="${PROJECT_DIR}/.claude/skills/gitlab-api-access.md"
GITLAB_SKILL_DIR="${HOME}/.claude/skills/gitlab-api-access"

if [ -f "$GITLAB_SKILL_SRC" ]; then
    mkdir -p "$GITLAB_SKILL_DIR"
    cp "$GITLAB_SKILL_SRC" "${GITLAB_SKILL_DIR}/SKILL.md"
    echo "  ✓ GitLab API Access skill installed to ~/.claude/skills/gitlab-api-access/"
else
    echo "  ✗ GitLab skill not found at $GITLAB_SKILL_SRC"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "MCP servers configured. To verify, run:"
echo "  claude mcp list"
echo ""
echo "Skills installed to ~/.claude/skills/"
echo ""
echo "Restart Claude Code to use the new MCP servers and skills."
