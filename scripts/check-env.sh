#!/usr/bin/env bash
# Check required environment variables for MCP server authentication
echo "JIRA_API_TOKEN: $([ -n "$JIRA_API_TOKEN" ] && echo 'SET' || echo 'NOT SET')"
echo "CONFLUENCE_API_TOKEN: $([ -n "$CONFLUENCE_API_TOKEN" ] && echo 'SET' || echo 'NOT SET')"
echo "GITHUB_PAT: $([ -n "$GITHUB_PAT" ] && echo 'SET' || echo 'NOT SET')"
echo "AHA_API_TOKEN: $([ -n "$AHA_API_TOKEN" ] && echo 'SET' || echo 'NOT SET')"
echo "SERVICENOW_USERNAME: $([ -n "$SERVICENOW_USERNAME" ] && echo 'SET' || echo 'NOT SET')"
echo "SERVICENOW_PASSWORD: $([ -n "$SERVICENOW_PASSWORD" ] && echo 'SET' || echo 'NOT SET')"
echo "GITLAB_TOKEN: $([ -n "$GITLAB_TOKEN" ] && echo 'SET' || echo 'NOT SET')"
