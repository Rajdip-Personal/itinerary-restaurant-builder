---
name: gitlab-api-access
description: Access Nordstrom's internal GitLab (git.jwn.app) via REST API for repository discovery, file browsing, and code retrieval
---

# GitLab API Access

You are a Claude Skill that accesses Nordstrom's internal GitLab instance at `git.jwn.app` using the REST API.

## CRITICAL: Clone Location

**ALWAYS clone GitLab repositories into `.claude/repos/` within this project — NEVER clone to parent directories or elsewhere.**

```bash
# Correct - clone into project's .claude/repos/
mkdir -p .claude/repos
git clone <url> .claude/repos/<repo-name>

# WRONG - never do this
git clone <url> /Users/brub/dev/supplychain/<repo-name>
git clone <url> ../<repo-name>
```

## What this skill does

- Search for repositories by name or APP ID
- List files and directories in repositories
- Retrieve file contents (source code, configs, READMEs)
- View recent commits and project metadata
- Search code across repositories

## When to use this skill

- User provides a URL containing `git.jwn.app`
- User asks to examine, scan, or look at an internal GitLab repository
- User mentions APP##### codes (e.g., APP00344, APP08476) that may be GitLab projects
- User mentions TM##### codes (team codes) with repository context
- User wants to retrieve source code from internal repositories
- User asks about repository structure, files, or commits on GitLab
- **DO NOT use WebFetch for git.jwn.app URLs** — it will fail with authentication errors

## Prerequisites

### Environment Variable
```bash
# Required: Personal access token with API read permissions
export GITLAB_TOKEN="your_token_here"
```

### API Basics
- **Base URL**: `https://git.jwn.app/api/v4/`
- **Authentication**: `PRIVATE-TOKEN` header
- **Token format**: Nordstrom tokens do NOT start with `glpat-` (internal instance)

## Critical: Shell Environment Issue

**Problem**: Direct curl commands in Claude Code shell may return `401 Unauthorized` due to variable expansion issues.

**Solution**: Write commands to a script file and execute:

```bash
# ALWAYS use this pattern for GitLab API calls
cat << 'SCRIPT' > /tmp/gitlab_api.sh
#!/bin/bash
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/user" \
  --silent
SCRIPT
chmod +x /tmp/gitlab_api.sh
/tmp/gitlab_api.sh
```

**Why**: The heredoc with `'SCRIPT'` (single quotes) preserves `$GITLAB_TOKEN` literally. When executed, the script runs in a proper bash environment where the variable expands correctly.

## Instructions

When invoked:

### Step 0: Check for Local Clone FIRST (MANDATORY)

**ALWAYS check if the repository exists locally in `.claude/repos/` before making ANY API calls.**

1. **Extract repository identifiers from the request**
   - Parse APP IDs (e.g., `APP08476`), TM codes (e.g., `TM01467`), or repo names
   - Extract from URLs like `git.jwn.app/TM01467/APP08476-service-name`

2. **Check for local clone in `.claude/repos/`**
   ```bash
   # List all cloned repos in the project
   ls -la .claude/repos/ 2>/dev/null || echo "No .claude/repos/ directory"

   # Search for specific repo by APP ID or name
   ls -d .claude/repos/*APP08476* 2>/dev/null || echo "Not found locally"
   ```

3. **If local clone exists → USE FILE SYSTEM OPERATIONS**
   - **DO NOT make API calls** — use local files instead
   - Use `Read` tool to read files directly from `.claude/repos/<repo-name>/`
   - Use `Glob` tool to find files by pattern
   - Use `Grep` tool to search code
   - Use `git log`, `git branch`, `git status` for git operations
   - This is faster, works offline, and doesn't consume API rate limits

   **Example: Instead of API calls, do this:**
   ```bash
   # List files (instead of /repository/tree)
   ls -la .claude/repos/APP08476-service-name/

   # Read file contents (instead of /repository/files/.../raw)
   # Use the Read tool: Read .claude/repos/APP08476-service-name/README.md

   # Search code (instead of /search?scope=blobs)
   # Use the Grep tool on .claude/repos/APP08476-service-name/

   # View commits
   cd .claude/repos/APP08476-service-name && git log --oneline -20
   ```

4. **If NO local clone exists → determine next action:**

   - **If user explicitly asks to CLONE** (e.g., "clone", "download", "pull down the repo") → Go directly to **Step 4: Clone**
   - **Otherwise** → Use API to answer the request (Steps 1-3), fallback to clone if API repeatedly fails

---

### Step 1: Verify GITLAB_TOKEN is set

- Check: `[ -n "$GITLAB_TOKEN" ] && echo "Token set" || echo "Token NOT set"`
- If not set, inform user they need to set `GITLAB_TOKEN` environment variable

### Step 2: Parse the request

- Extract project identifiers: APP IDs, TM codes, repository names, or full URLs
- Determine what information is needed (files, README, structure, commits, etc.)

### Step 3: Search for the project via API (if numeric ID not known)

```bash
cat << 'SCRIPT' > /tmp/gitlab_search.sh
#!/bin/bash
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/search?scope=projects&search=APP00344" \
  --silent | python3 -m json.tool
SCRIPT
chmod +x /tmp/gitlab_search.sh
/tmp/gitlab_search.sh
```

- Extract the numeric `id` and `path_with_namespace` from results

### Step 3b: Use API to fulfill the request (for non-clone requests)

**If user is NOT asking to clone**, use the API patterns below to answer their request:
- Use the API patterns in the "API Patterns" section to retrieve files, list directories, get commits, etc.
- This avoids cloning large repos when user only needs to read a few files

**If API repeatedly fails** (2-3 attempts with 401/403/404/timeout errors):
- Inform the user that API access is having issues
- Fall back to cloning the repository (proceed to Step 4)

---

### Step 4: Clone the repository into `.claude/repos/`

**Use this step when:**
- User explicitly asks to clone/download the repository, OR
- API access repeatedly fails (2-3 attempts with 401/403/404/timeout errors)

**Clone command:**

```bash
# Create the repos directory if it doesn't exist
mkdir -p .claude/repos

# Clone using HTTPS with token authentication
# Extract repo name from path_with_namespace (e.g., TM01467/APP08476-service-name -> APP08476-service-name)
REPO_PATH="TM01467/APP08476-service-name"  # from API response
REPO_NAME=$(basename "$REPO_PATH")

# Clone into .claude/repos/
git clone "https://oauth2:${GITLAB_TOKEN}@git.jwn.app/${REPO_PATH}.git" ".claude/repos/${REPO_NAME}"
```

**Important**: After cloning, use the local clone for ALL subsequent operations in this session. Do not continue making API calls.

### Step 5: Retrieve requested information from local clone

- Now that the repo is cloned, use file system operations:
  - `Read` tool to read files from `.claude/repos/<repo-name>/`
  - `Glob` tool to find files by pattern
  - `Grep` tool to search code
  - `git log`, `git branch` for git operations

### Step 6: Present results clearly

- Summarize repository purpose and structure
- Show relevant file contents
- Highlight key information (tech stack, dependencies, etc.)

## API Patterns

### Search for Projects

```bash
cat << 'SCRIPT' > /tmp/gitlab_search.sh
#!/bin/bash
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/search?scope=projects&search=APP08476" \
  --silent | python3 -m json.tool
SCRIPT
chmod +x /tmp/gitlab_search.sh
/tmp/gitlab_search.sh
```

**Key fields in response**:
- `id` — Numeric project ID (USE THIS for all subsequent calls)
- `name` — Repository name
- `web_url` — Browser URL
- `path_with_namespace` — Full path (e.g., `TM01467/app-name`)
- `last_activity_at` — Last commit timestamp

### Get Project Details

```bash
cat << 'SCRIPT' > /tmp/gitlab_project.sh
#!/bin/bash
PROJECT_ID=4540  # Use numeric ID from search results
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/projects/${PROJECT_ID}" \
  --silent | python3 -m json.tool
SCRIPT
chmod +x /tmp/gitlab_project.sh
/tmp/gitlab_project.sh
```

### List Repository Files

```bash
cat << 'SCRIPT' > /tmp/gitlab_tree.sh
#!/bin/bash
PROJECT_ID=4540
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/projects/${PROJECT_ID}/repository/tree" \
  --silent | python3 -m json.tool
SCRIPT
chmod +x /tmp/gitlab_tree.sh
/tmp/gitlab_tree.sh
```

**Options**:
- `?path=src/main` — List specific directory
- `?recursive=true` — Include subdirectories
- `?ref=develop` — Specify branch

### Get File Content

```bash
cat << 'SCRIPT' > /tmp/gitlab_file.sh
#!/bin/bash
PROJECT_ID=4540
FILE_PATH="README.md"  # URL-encode slashes: src%2Fmain%2FApp.java
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/projects/${PROJECT_ID}/repository/files/${FILE_PATH}/raw?ref=main" \
  --silent
SCRIPT
chmod +x /tmp/gitlab_file.sh
/tmp/gitlab_file.sh
```

**File path encoding**:
- `/` → `%2F`
- Example: `src/main/java/App.java` → `src%2Fmain%2Fjava%2FApp.java`

### Get Recent Commits

```bash
cat << 'SCRIPT' > /tmp/gitlab_commits.sh
#!/bin/bash
PROJECT_ID=4540
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/projects/${PROJECT_ID}/repository/commits?ref_name=main&per_page=10" \
  --silent | python3 -m json.tool
SCRIPT
chmod +x /tmp/gitlab_commits.sh
/tmp/gitlab_commits.sh
```

### Search Code (Blobs)

```bash
cat << 'SCRIPT' > /tmp/gitlab_blobs.sh
#!/bin/bash
curl --request GET \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://git.jwn.app/api/v4/search?scope=blobs&search=runbook" \
  --silent | python3 -m json.tool
SCRIPT
chmod +x /tmp/gitlab_blobs.sh
/tmp/gitlab_blobs.sh
```

## Quick Reference

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| Search projects | `/api/v4/search?scope=projects&search={term}` | Returns numeric IDs |
| Project details | `/api/v4/projects/{id}` | Use numeric ID |
| List files | `/api/v4/projects/{id}/repository/tree` | Add `?recursive=true` for all |
| Get file | `/api/v4/projects/{id}/repository/files/{path}/raw?ref={branch}` | URL-encode path |
| Commits | `/api/v4/projects/{id}/repository/commits?ref_name={branch}` | Add `&per_page=N` |
| Search code | `/api/v4/search?scope=blobs&search={term}` | Searches file contents |
| Pipelines | `/api/v4/projects/{id}/pipelines?status=success&ref={branch}` | CI/CD status |

## What Works vs What Doesn't

### Always Use Numeric IDs

```bash
# WORKS - Numeric ID
curl ... --url "https://git.jwn.app/api/v4/projects/4540"

# MAY FAIL - URL-encoded path
curl ... --url "https://git.jwn.app/api/v4/projects/TM01467%2Fapp-name"
```

### Don't Pipe to `head`

```bash
# FAILS - SIGPIPE corrupts response
curl ... | head -100

# WORKS - Let curl complete
curl ... | python3 -m json.tool
```

### Groups API May Not Work

```bash
# May return empty even if projects exist
curl ... --url "https://git.jwn.app/api/v4/groups?search=TM01467"

# Use project search instead
curl ... --url "https://git.jwn.app/api/v4/search?scope=projects&search=TM01467"
```

## Nordstrom GitLab Conventions

### Repository Naming
- Pattern: `APP[5-digit-ID]-[service-name]`
- Example: `APP08476-SC-HTTP-Kafka-Bridge`

### Team Organization
- Groups use TM codes: `TM01467`, `TM01368`, etc.
- Full path: `TM01467/APP04010-WMP-Item/service-name`

### Common Repository Types
- `*-infrastructure` — Terraform/Helm configs
- `*-schema` — Avro/JSON schemas
- `*-database` — Flyway migrations
- `*-adapter` — Integration services
- `*-processor` — Data processing services
- `tenancy-manifest` — Confluent/Kafka configs

## Troubleshooting

### 401 Unauthorized
1. **First**: Use the script file pattern (see Critical section above)
2. Verify token is set: `echo $GITLAB_TOKEN | head -c 5` (should show first 5 chars)
3. Test token validity with `/api/v4/user` endpoint

### 404 Not Found
1. Use numeric project ID, not path
2. Check file path encoding (slashes → `%2F`)
3. Verify branch name in `?ref=` parameter

### Empty Results
1. Try both search APIs: `/search?scope=projects` and `/projects?search=`
2. Check spelling and case sensitivity
3. Verify you have access to the group/project

## Response Guidelines

When presenting repository information:
- Start with a brief summary of the repository's purpose
- Show the technology stack (language, frameworks)
- List key files and directories
- Include relevant code snippets when asked
- Keep responses focused on what the user asked for
