#!/usr/bin/env bash
# Check required environment variables for MCP server authentication
echo "JIRA_PAT: $([ -n "$JIRA_PAT" ] && echo 'SET' || echo 'NOT SET')"
echo "CONFLUENCE_PAT: $([ -n "$CONFLUENCE_PAT" ] && echo 'SET' || echo 'NOT SET')"
echo "GITHUB_PAT: $([ -n "$GITHUB_PAT" ] && echo 'SET' || echo 'NOT SET')"
echo "AHA_API_TOKEN: $([ -n "$AHA_API_TOKEN" ] && echo 'SET' || echo 'NOT SET')"
echo "SERVICENOW_USERNAME: $([ -n "$SERVICENOW_USERNAME" ] && echo 'SET' || echo 'NOT SET')"
echo "SERVICENOW_PASSWORD: $([ -n "$SERVICENOW_PASSWORD" ] && echo 'SET' || echo 'NOT SET')"
echo "GITLAB_TOKEN: $([ -n "$GITLAB_TOKEN" ] && echo 'SET' || echo 'NOT SET')"
echo "ARTIFACTORY_USER: $([ -n "$ARTIFACTORY_USER" ] && echo 'SET' || echo 'NOT SET')"
if [ -n "$ARTIFACTORY_API_KEY" ]; then
    echo "ARTIFACTORY_API_KEY: SET"
elif [ -n "$ARTIFACTORY_PASSWORD" ]; then
    echo "ARTIFACTORY_API_KEY: NOT SET (using ARTIFACTORY_PASSWORD)"
else
    echo "ARTIFACTORY_API_KEY: NOT SET"
fi
