#!/bin/bash
#
# Setup MCP Servers for Claude Code
# This script configures Jira, Confluence, GitHub, Nordstrom Schema Repo, and Aha! MCP servers at the user level.
#
# Prerequisites:
#   - Claude Code CLI installed
#   - Environment variables set: JIRA_PAT, CONFLUENCE_PAT, GITHUB_PAT, AHA_API_TOKEN
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
echo "=== Setup Complete ==="
echo ""
echo "MCP servers configured. To verify, run:"
echo "  claude mcp list"
echo ""
echo "Restart Claude Code to use the new MCP servers."
