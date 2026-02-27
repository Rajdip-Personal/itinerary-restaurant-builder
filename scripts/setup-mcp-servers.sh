#!/bin/bash
#
# Setup MCP Servers for Claude Code
# This script configures Jira, Confluence, GitHub, ServiceNow, Nordstrom Schema Repo, Aha!, and Slack MCP servers at the project level.
#
# Prerequisites:
#   - Claude Code CLI installed
#   - Python 3.12+ and uv package manager (for ServiceNow MCP)
#   - Environment variables set: JIRA_PAT, CONFLUENCE_PAT, GITHUB_PAT, AHA_API_TOKEN,
#     SERVICENOW_USERNAME, SERVICENOW_PASSWORD, GITLAB_TOKEN
#

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPOS_DIR="${PROJECT_DIR}/.claude/repos"

# Track status for each server: ✓ installed, ⚠ skipped (already exists), ✗ failed
declare -A STATUS

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

if [ -z "$ARTIFACTORY_USER" ] || { [ -z "$ARTIFACTORY_API_KEY" ] && [ -z "$ARTIFACTORY_PASSWORD" ]; }; then
    missing_count=$((missing_count + 1))
    echo "WARNING: Artifactory credentials not set (needed for ServiceNow MCP setup)."
    echo ""
    echo "  Set these in your shell profile (~/.zshrc):"
    echo "    export ARTIFACTORY_USER={your-lanid}"
    echo "    export ARTIFACTORY_API_KEY={your-artifactory-api-key}"
    echo ""
    echo "  To get your API key:"
    echo "    1. Go to: https://artifactory.nordstrom.com/ui/admin/artifactory/user_profile"
    echo "    2. Generate or copy your API key"
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

# --- Jira ---
echo ""
echo "Adding Jira MCP server..."
if claude mcp add --transport http --scope project jira-mcp https://api.nordstrom.app/app09978/jira/mcp \
    --header 'Authorization: Bearer ${JIRA_PAT}' 2>/dev/null; then
    echo "  ✓ Jira MCP server added"
    STATUS[Jira]="✓ Installed"
else
    echo "  ⚠ Jira MCP server already exists (skipped)"
    STATUS[Jira]="⚠ Already exists"
fi

# --- Confluence ---
echo ""
echo "Adding Confluence MCP server..."
if claude mcp add --transport http --scope project confluence-mcp https://api.nordstrom.app/app09978/confluence/mcp \
    --header 'Authorization: Bearer ${CONFLUENCE_PAT}' 2>/dev/null; then
    echo "  ✓ Confluence MCP server added"
    STATUS[Confluence]="✓ Installed"
else
    echo "  ⚠ Confluence MCP server already exists (skipped)"
    STATUS[Confluence]="⚠ Already exists"
fi

# --- GitHub ---
echo ""
echo "Adding GitHub MCP server (project scope)..."
if claude mcp add --transport http --scope project github https://api.githubcopilot.com/mcp \
    --header 'Authorization: Bearer ${GITHUB_PAT}' 2>/dev/null; then
    echo "  ✓ GitHub MCP server added"
    STATUS[GitHub]="✓ Installed"
else
    echo "  ⚠ GitHub MCP server already exists (skipped)"
    STATUS[GitHub]="⚠ Already exists"
fi

# --- ServiceNow ---
echo ""
echo "Installing ServiceNow MCP server (project scope)..."
# ServiceNow MCP runs locally with basic auth against prod (READ-ONLY)
# Uses CI pipeline service account credentials
# Note: Write operations (create incident/change) require OAuth, not supported with basic auth
# Requires: Python 3.12+, uv package manager, VPN (Zscaler)
# Use native TLS so uv trusts the macOS keychain (which has the Zscaler corporate CA cert).
# Without this, uv uses OpenSSL which doesn't trust the corporate SSL inspection proxy.
export UV_NATIVE_TLS=true
# Map Nordstrom Artifactory credentials to uv's expected env var format.
# ServiceNow MCP's pyproject.toml uses Artifactory as default PyPI index with authenticate=always.
if [ -z "$UV_INDEX_ARTIFACTORY_USERNAME" ] && [ -n "$ARTIFACTORY_USER" ]; then
    export UV_INDEX_ARTIFACTORY_USERNAME="${ARTIFACTORY_USER}"
    export UV_INDEX_ARTIFACTORY_PASSWORD="${ARTIFACTORY_API_KEY:-$ARTIFACTORY_PASSWORD}"
    echo "  Mapped ARTIFACTORY_USER/ARTIFACTORY_API_KEY to UV_INDEX_ARTIFACTORY_USERNAME/PASSWORD"
fi
SERVICENOW_MCP_DIR="${REPOS_DIR}/servicenow-mcp"
if [ -d "$SERVICENOW_MCP_DIR" ]; then
    echo "  ⚠ ServiceNow MCP already cloned at $SERVICENOW_MCP_DIR"
    echo "    To update, run: cd $SERVICENOW_MCP_DIR && git pull && source .venv/bin/activate && UV_NATIVE_TLS=true uv sync --all-groups"
    SERVICENOW_CLONED=true
else
    mkdir -p "${REPOS_DIR}"
    if git clone git@github.com:Nordstrom-Internal/APP10014-servicenow-mcp.git "$SERVICENOW_MCP_DIR" && \
       cd "$SERVICENOW_MCP_DIR" && \
       uv venv && \
       source .venv/bin/activate && \
       uv sync --all-groups && \
       uv pip install -e .; then
        cd - > /dev/null
        SERVICENOW_CLONED=true
    else
        cd - > /dev/null 2>/dev/null
        echo "  ✗ Failed to clone/install ServiceNow MCP"
        SERVICENOW_CLONED=false
    fi
fi

# Register ServiceNow MCP with Claude Code (only if clone succeeded)
if [ "$SERVICENOW_CLONED" = true ]; then
    if claude mcp add --scope project servicenow \
        -e SERVICENOW_AUTH_MODE=basic \
        -e SERVICENOW_INSTANCE_URL=https://nordstrom.service-now.com \
        -e SERVICENOW_USERNAME='${SERVICENOW_USERNAME}' \
        -e SERVICENOW_PASSWORD='${SERVICENOW_PASSWORD}' \
        -- "${SERVICENOW_MCP_DIR}/.venv/bin/python" -m servicenow_mcp.server 2>/dev/null; then
        echo "  ✓ ServiceNow MCP server added (prod, read-only)"
        STATUS[ServiceNow]="✓ Installed"
    else
        echo "  ⚠ ServiceNow MCP server already exists (skipped)"
        STATUS[ServiceNow]="⚠ Already exists"
    fi
else
    STATUS[ServiceNow]="✗ Failed"
fi

# --- Schema Repo ---
echo ""
echo "Installing Nordstrom Schema Repo MCP server (project scope)..."
SCHEMA_REPO_DIR="${REPOS_DIR}/nordstrom-schema-repo-mcp"
SCHEMA_DATA_DIR="${HOME}/.local/share/nordstrom-schema-repo"
if [ -d "$SCHEMA_REPO_DIR" ]; then
    echo "  ⚠ Schema repo already cloned at $SCHEMA_REPO_DIR"
    echo "    To update, run: cd $SCHEMA_REPO_DIR && git pull && ./install-claude-code.sh"
    SCHEMA_CLONED=true
else
    mkdir -p "${REPOS_DIR}"
    if git clone git@github.com:Nordstrom-Sandbox/nordstrom-schema-repo-mcp.git "$SCHEMA_REPO_DIR" && \
       cd "$SCHEMA_REPO_DIR" && \
       ./install-claude-code.sh; then
        echo "  ✓ Nordstrom Schema Repo MCP server installed (user scope by upstream script)"
        cd - > /dev/null
        SCHEMA_CLONED=true
    else
        echo "  ✗ Failed to install Nordstrom Schema Repo MCP server"
        cd - > /dev/null 2>/dev/null
        SCHEMA_CLONED=false
    fi
fi

# Re-register at project scope (upstream install-claude-code.sh hardcodes user scope)
if [ "$SCHEMA_CLONED" = true ]; then
    if claude mcp add --scope project nordstrom-schema-repo \
        -e SCHEMA_REPO_DATA_DIR="${SCHEMA_DATA_DIR}" \
        -- "${SCHEMA_DATA_DIR}/venv/bin/python" -m schema_repo_mcp.server 2>/dev/null; then
        echo "  ✓ Nordstrom Schema Repo MCP server added (project scope)"
        STATUS[SchemaRepo]="✓ Installed"
    else
        echo "  ⚠ Nordstrom Schema Repo MCP server already exists at project scope (skipped)"
        STATUS[SchemaRepo]="⚠ Already exists"
    fi
else
    STATUS[SchemaRepo]="✗ Failed"
fi

# --- Aha! ---
echo ""
echo "Installing Aha! MCP server (project scope)..."
AHA_MCP_DIR="${REPOS_DIR}/aha-mcp"
if [ -d "$AHA_MCP_DIR" ]; then
    echo "  ⚠ Aha MCP already cloned at $AHA_MCP_DIR"
    echo "    To update, run: cd $AHA_MCP_DIR && git pull && npm run build"
    AHA_CLONED=true
else
    mkdir -p "${REPOS_DIR}"
    if git clone git@github.com:aha-develop/aha-mcp.git "$AHA_MCP_DIR" && \
       cd "$AHA_MCP_DIR" && \
       npm install && \
       npm run build; then
        cd - > /dev/null
        AHA_CLONED=true
    else
        echo "  ✗ Failed to clone/install Aha! MCP"
        cd - > /dev/null 2>/dev/null
        AHA_CLONED=false
    fi
fi

# Register Aha MCP with Claude Code (only if clone succeeded)
if [ "$AHA_CLONED" = true ]; then
    if claude mcp add --scope project aha-mcp \
        -e AHA_API_TOKEN='${AHA_API_TOKEN}' \
        -e AHA_DOMAIN=nordstrom \
        -- node "${AHA_MCP_DIR}/build/index.js" 2>/dev/null; then
        echo "  ✓ Aha! MCP server added"
        STATUS[Aha]="✓ Installed"
    else
        echo "  ⚠ Aha! MCP server already exists (skipped)"
        STATUS[Aha]="⚠ Already exists"
    fi
else
    STATUS[Aha]="✗ Failed"
fi

# --- Slack ---
echo ""
echo "Adding Slack MCP server (project scope)..."
# Slack MCP is read-only, uses Chrome + Okta SSO for auth (no API key needed)
# Requires: Node.js 18+, Google Chrome, VPN (Zscaler)
if claude mcp add --scope project nordstrom-slack \
    -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
    -- npx github:Nordstrom-Sandbox/gx6c-nordstrom-slack-mcp 2>/dev/null; then
    echo "  ✓ Slack MCP server added (read-only)"
    echo "    Note: First use will open Chrome for Okta login"
    STATUS[Slack]="✓ Installed"
else
    echo "  ⚠ Slack MCP server already exists (skipped)"
    STATUS[Slack]="⚠ Already exists"
fi

# --- Nordstrom Standards Chat ---
echo ""
echo "Adding Nordstrom Standards Chat MCP server (project scope)..."
if claude mcp add --scope project nordstrom-standards-chat \
    -- npx github:Nordstrom-Sandbox/gx6c-nordstrom-standards-chat-mcp 2>/dev/null; then
    echo "  ✓ Nordstrom Standards Chat MCP server added"
    STATUS[StandardsChat]="✓ Installed"
else
    echo "  ⚠ Nordstrom Standards Chat MCP server already exists (skipped)"
    STATUS[StandardsChat]="⚠ Already exists"
fi

# --- Skills ---
echo ""
echo "=== Installing Claude Code Skills ==="
echo ""

echo "Installing GitLab API Access skill..."
GITLAB_SKILL_SRC="${PROJECT_DIR}/.claude/skills/gitlab-api-access.md"
GITLAB_SKILL_DIR="${HOME}/.claude/skills/gitlab-api-access"

if [ -f "$GITLAB_SKILL_SRC" ]; then
    mkdir -p "$GITLAB_SKILL_DIR"
    cp "$GITLAB_SKILL_SRC" "${GITLAB_SKILL_DIR}/SKILL.md"
    echo "  ✓ GitLab API Access skill installed to ~/.claude/skills/gitlab-api-access/"
    STATUS[GitLabSkill]="✓ Installed"
else
    echo "  ✗ GitLab skill not found at $GITLAB_SKILL_SRC"
    STATUS[GitLabSkill]="✗ Failed"
fi

# --- Summary ---
echo ""
echo "=== Setup Summary ==="
echo ""
printf "  %-20s %s\n" "Jira" "${STATUS[Jira]}"
printf "  %-20s %s\n" "Confluence" "${STATUS[Confluence]}"
printf "  %-20s %s\n" "GitHub" "${STATUS[GitHub]}"
printf "  %-20s %s\n" "ServiceNow" "${STATUS[ServiceNow]}"
printf "  %-20s %s\n" "Schema Repo" "${STATUS[SchemaRepo]}"
printf "  %-20s %s\n" "Aha!" "${STATUS[Aha]}"
printf "  %-20s %s\n" "Slack" "${STATUS[Slack]}"
printf "  %-20s %s\n" "Standards Chat" "${STATUS[StandardsChat]}"
printf "  %-20s %s\n" "GitLab Skill" "${STATUS[GitLabSkill]}"
echo ""

# Count failures
fail_count=0
for key in "${!STATUS[@]}"; do
    if [[ "${STATUS[$key]}" == *"Failed"* ]]; then
        fail_count=$((fail_count + 1))
    fi
done

if [ $fail_count -gt 0 ]; then
    echo "⚠ $fail_count server(s) failed to install. Fix the issues above and re-run this script."
else
    echo "All servers configured successfully."
fi

echo ""
echo "To verify, run: claude mcp list"
echo ""
echo "Restart Claude Code to use the new MCP servers and skills."
