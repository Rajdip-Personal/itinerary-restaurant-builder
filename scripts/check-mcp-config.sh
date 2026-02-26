#!/usr/bin/env bash
# List MCP servers configured across project-scope (.mcp.json) and user-scope (~/.claude.json).
# Project-scope takes precedence over user-scope for duplicate server names.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

python3 -c "
import json, os

project_mcps = {}
user_mcps = {}

# Load project-scope config (.mcp.json)
project_config = os.path.join('$PROJECT_DIR', '.mcp.json')
if os.path.exists(project_config):
    with open(project_config) as f:
        project_mcps = json.load(f).get('mcpServers', {})

# Load user-scope config (~/.claude.json)
user_config = os.path.expanduser('~/.claude.json')
if os.path.exists(user_config):
    with open(user_config) as f:
        user_mcps = json.load(f).get('mcpServers', {})

# Merge: project-scope first, then user-scope for servers not in project
merged = {}
for name, config in project_mcps.items():
    merged[name] = ('project', config.get('type', 'stdio'))
for name, config in user_mcps.items():
    if name not in merged:
        merged[name] = ('user', config.get('type', 'stdio'))

# Display combined list
print('=== Configured MCP Servers ===')
if merged:
    for name, (scope, stype) in sorted(merged.items()):
        print(f'  {name}: {stype}  ({scope})')
else:
    print('  (none configured)')
"
