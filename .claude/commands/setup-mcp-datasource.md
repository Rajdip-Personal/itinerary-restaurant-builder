---
description: Set up an MCP server for a custom data source (database, S3, or DynamoDB)
---

# Set Up MCP Data Source

You are running the **MCP data source setup pipeline**. This creates a FastMCP Python server for a team's custom data source, registers it with Claude Code, and verifies connectivity.

**Reference implementation:** The MAWM MCP server at `https://github.com/Nordstrom-Sandbox/mawm_data_mcp_server` — a FastMCP server with async database access, connection pooling, read-only enforcement, and query validation. You do NOT need to clone it; the patterns are described below.

---

## CRITICAL: Security Rules

1. **NEVER accept credentials in the clear.** All passwords, tokens, and secrets MUST be referenced as environment variable names (e.g., `DB_PASSWORD`, `AWS_SECRET_ACCESS_KEY`), never as literal values.
2. **NEVER write credentials to generated code, `.env` files, or command arguments.** Always use `os.getenv()` in Python and `${ENV_VAR}` references in `claude mcp add`.
3. **All generated servers enforce read-only access.** Database servers validate queries with `sqlparse`. S3 and DynamoDB servers only support read operations.

---

## Step 1: Choose Data Source Type

Use `AskUserQuestion` to ask:

```
AskUserQuestion:
  questions:
    - question: "What type of data source do you want to connect?"
      header: "Data Source"
      multiSelect: false
      options:
        - label: "Relational Database (Recommended)"
          description: "MySQL, PostgreSQL, or other SQL database — generates query, list tables, and describe tools"
        - label: "AWS S3 Bucket"
          description: "Read files from S3 — generates list objects, read file, and file info tools"
        - label: "AWS DynamoDB"
          description: "Read items from DynamoDB tables — generates list, describe, schema inference, scan, and query tools"
```

---

## Step 2: Gather Connection Details

### If Relational Database:

Ask the database engine first:

```
AskUserQuestion:
  questions:
    - question: "Which database engine?"
      header: "DB Engine"
      multiSelect: false
      options:
        - label: "MySQL (Recommended)"
          description: "Uses aiomysql async driver — matches the MAWM MCP server pattern"
        - label: "PostgreSQL"
          description: "Uses asyncpg async driver"
```

Then ask connection details (all in one `AskUserQuestion` with multiple questions):

```
AskUserQuestion:
  questions:
    - question: "What is the database host and port? (e.g., 'db.example.com:3306')"
      header: "Host:Port"
      multiSelect: false
      options:
        - label: "I'll type the host:port"
          description: "Enter host and port in the Other field"
    - question: "What is the database name and schema(s) to expose? (e.g., 'mydb' or 'mydb.schema1')"
      header: "Database"
      multiSelect: false
      options:
        - label: "I'll type the database/schema"
          description: "Enter database name (and optional schema) in the Other field"
    - question: "What environment variables hold the credentials? These must already be set in your shell."
      header: "Credentials"
      multiSelect: false
      options:
        - label: "DB_USERNAME / DB_PASSWORD (Recommended)"
          description: "Standard env var names — set them in ~/.zshrc if not already"
        - label: "MYSQL_USER / MYSQL_PASSWORD"
          description: "MySQL-convention env var names"
        - label: "Custom env var names"
          description: "Specify your own env var names in the Other field (format: USER_VAR / PASS_VAR)"
```

Parse the host:port — default port is 3306 for MySQL, 5432 for PostgreSQL.

**Verify the credential env vars are set:**
```bash
# Check that the env vars exist (don't print values!)
[ -n "${DB_USERNAME}" ] && echo "DB_USERNAME is set" || echo "WARNING: DB_USERNAME is NOT set"
[ -n "${DB_PASSWORD}" ] && echo "DB_PASSWORD is set" || echo "WARNING: DB_PASSWORD is NOT set"
```

If either is not set, warn the user and tell them to `export` the variables in their shell before proceeding. Do NOT ask for the values — just tell them to set the env vars and re-run.

### If S3:

```
AskUserQuestion:
  questions:
    - question: "What is the S3 bucket name?"
      header: "Bucket"
      multiSelect: false
      options:
        - label: "I'll type the bucket name"
          description: "Enter the bucket name in the Other field"
    - question: "What AWS region is the bucket in?"
      header: "Region"
      multiSelect: false
      options:
        - label: "us-west-2 (Recommended)"
          description: "Oregon — most Nordstrom resources"
        - label: "us-east-1"
          description: "Virginia"
        - label: "Other region"
          description: "Type the AWS region in the Other field"
    - question: "What file formats are in the bucket?"
      header: "Formats"
      multiSelect: true
      options:
        - label: "CSV"
          description: "Comma-separated values"
        - label: "JSON"
          description: "JSON documents or JSONL"
        - label: "Parquet"
          description: "Columnar Parquet files (requires pyarrow)"
    - question: "How should AWS credentials be provided?"
      header: "AWS Auth"
      multiSelect: false
      options:
        - label: "AWS profile 'claude_code' (Recommended)"
          description: "Uses AWS_PROFILE=claude_code — authenticate with aws-okta or 'aws configure --profile claude_code'"
        - label: "Shared temporary credentials"
          description: "A teammate with access runs aws-okta and shares the temp credentials as env vars (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)"
        - label: "IAM role (no credentials needed)"
          description: "Instance/container role — no explicit credentials"
```

**If using AWS profile**, verify it exists:
```bash
aws configure list --profile claude_code 2>/dev/null && echo "Profile exists" || echo "WARNING: Profile 'claude_code' not found"
```

**If using shared temporary credentials**, verify all three env vars are set:
```bash
[ -n "${AWS_ACCESS_KEY_ID}" ] && echo "AWS_ACCESS_KEY_ID is set" || echo "WARNING: AWS_ACCESS_KEY_ID is NOT set"
[ -n "${AWS_SECRET_ACCESS_KEY}" ] && echo "AWS_SECRET_ACCESS_KEY is set" || echo "WARNING: AWS_SECRET_ACCESS_KEY is NOT set"
[ -n "${AWS_SESSION_TOKEN}" ] && echo "AWS_SESSION_TOKEN is set" || echo "WARNING: AWS_SESSION_TOKEN is NOT set"
```

If any are missing, tell the user: the teammate with S3 access needs to run `aws-okta` (or equivalent), then export these three values. The driver sets them in their shell:
```bash
export AWS_ACCESS_KEY_ID="<from teammate>"
export AWS_SECRET_ACCESS_KEY="<from teammate>"
export AWS_SESSION_TOKEN="<from teammate>"
```
**These are temporary credentials** — they expire (typically 1-12 hours). If they stop working, the teammate needs to re-authenticate and share fresh credentials.

Optionally ask for a prefix/path to scope access (e.g., `data/2024/`).

### If DynamoDB:

```
AskUserQuestion:
  questions:
    - question: "What AWS region are the DynamoDB tables in?"
      header: "Region"
      multiSelect: false
      options:
        - label: "us-west-2 (Recommended)"
          description: "Oregon — most Nordstrom resources"
        - label: "us-east-1"
          description: "Virginia"
        - label: "Other region"
          description: "Type the AWS region in the Other field"
    - question: "Is there a table name prefix to filter by? (e.g., 'OrderFulfillment-' to only show matching tables)"
      header: "Prefix"
      multiSelect: false
      options:
        - label: "No prefix — show all tables"
          description: "List all DynamoDB tables in the region"
        - label: "I'll type a prefix"
          description: "Enter a table name prefix in the Other field to scope visible tables"
    - question: "How should AWS credentials be provided?"
      header: "AWS Auth"
      multiSelect: false
      options:
        - label: "AWS profile 'claude_code' (Recommended)"
          description: "Uses AWS_PROFILE=claude_code — authenticate with aws-okta or 'aws configure --profile claude_code'"
        - label: "Shared temporary credentials"
          description: "A teammate with access runs aws-okta and shares the temp credentials as env vars (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)"
        - label: "IAM role (no credentials needed)"
          description: "Instance/container role — no explicit credentials"
```

**If using AWS profile**, verify it exists:
```bash
aws configure list --profile claude_code 2>/dev/null && echo "Profile exists" || echo "WARNING: Profile 'claude_code' not found"
```

**If using shared temporary credentials**, verify all three env vars are set:
```bash
[ -n "${AWS_ACCESS_KEY_ID}" ] && echo "AWS_ACCESS_KEY_ID is set" || echo "WARNING: AWS_ACCESS_KEY_ID is NOT set"
[ -n "${AWS_SECRET_ACCESS_KEY}" ] && echo "AWS_SECRET_ACCESS_KEY is set" || echo "WARNING: AWS_SECRET_ACCESS_KEY is NOT set"
[ -n "${AWS_SESSION_TOKEN}" ] && echo "AWS_SESSION_TOKEN is set" || echo "WARNING: AWS_SESSION_TOKEN is NOT set"
```

If any are missing, tell the user: the teammate with DynamoDB access needs to run `aws-okta` (or equivalent), then export these three values. **These are temporary credentials** — they expire (typically 1-12 hours).

---

## Step 3: Choose Server Name and Location

```
AskUserQuestion:
  questions:
    - question: "Choose a short name for this MCP server (e.g., 'warehouse-db', 'demand-forecast-s3'). This becomes the server identifier in Claude Code."
      header: "Server Name"
      multiSelect: false
      options:
        - label: "I'll type a name"
          description: "Enter a short, lowercase, hyphenated name in the Other field"
    - question: "Where should the MCP server code be generated?"
      header: "Location"
      multiSelect: false
      options:
        - label: ".claude/repos/ in this project (Recommended)"
          description: "Keeps the server alongside the workshop repo — default location"
        - label: "~/.claude/repos/ in home directory"
          description: "Decoupled from any project — persists across repos"
        - label: "Custom path"
          description: "Specify your own directory in the Other field"
```

Sanitize the server name: lowercase, replace spaces/underscores with hyphens, strip special characters. The Python package name uses underscores (e.g., `warehouse_db`).

Resolve the location:
- **`.claude/repos/` (default):** Use the current project's `.claude/repos/` directory
- **`~/.claude/repos/`:** Expand `~` to the user's home directory
- **Custom path:** Use the path as-is, creating it if it doesn't exist

The full server path is `{location}/{server-name}-mcp/`. All subsequent steps use this resolved path, referred to as `{server-path}`.

---

## Step 4: Generate MCP Server Code

Create the directory structure:
```
{server-path}/
  pyproject.toml
  requirements.txt
  src/{server_name}_mcp_server/
    __init__.py
    server.py
```

### For Relational Database — Generate `server.py`

Use the **FastMCP decorator API** (NOT the low-level Server/Tool/TextContent approach). The generated server should be ~150 lines with these characteristics:

- **FastMCP decorators**: `@mcp.tool()` for automatic tool registration and routing
- **Async connection pooling**: `aiomysql.create_pool()` for MySQL or `asyncpg.create_pool()` for PostgreSQL
- **Environment-variable credentials**: `os.getenv()` for all connection params — NEVER hardcoded values
- **Read-only enforcement**: `sqlparse` validation rejecting INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/GRANT/REVOKE
- **Input validation**: Schema and table names validated (alphanumeric + underscores only) to prevent SQL injection
- **Four core tools**:
  - `get_schema_map()` — Discover all schemas, tables, and columns (call first to understand the database)
  - `query_database(query: str)` — Execute read-only SQL with sqlparse validation
  - `get_table_list(schema_name: str)` — List tables in a schema
  - `get_table_schema(table_name: str)` — Describe columns for a table (supports `schema.table` format)
- **Connection lifecycle**: Pool created on startup, closed on shutdown via `@asynccontextmanager` lifespan
- **Row limit**: Default 1000-row limit on query results to prevent memory issues

**Template structure for MySQL:**

```python
#!/usr/bin/env python3
"""
{Server Name} MCP Server
Read-only access to {database} via MCP tools.
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Any

import aiomysql
import sqlparse
from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Connection pool (lifespan-managed) ---

pool: aiomysql.Pool | None = None

@asynccontextmanager
async def app_lifespan(server: FastMCP):
    global pool
    host = os.getenv("{HOST_ENV}", "localhost")
    port = int(os.getenv("{PORT_ENV}", "{default_port}"))
    user = os.getenv("{USER_ENV}")
    password = os.getenv("{PASS_ENV}")
    if not user or not password:
        raise ValueError("{USER_ENV} and {PASS_ENV} environment variables must be set")
    pool = await aiomysql.create_pool(
        host=host, port=port, user=user, password=password,
        db=os.getenv("{DB_ENV}", "{database}"),
        autocommit=True, minsize=1, maxsize=5,
    )
    logger.info(f"Connected to {host}:{port}")
    try:
        yield
    finally:
        pool.close()
        await pool.wait_closed()

mcp = FastMCP("{server-name}", lifespan=app_lifespan)

# --- Read-only validation ---

def validate_readonly(query: str) -> str | None:
    """Return error message if query is not read-only, else None."""
    dangerous = {"INSERT","UPDATE","DELETE","DROP","CREATE","ALTER","TRUNCATE","GRANT","REVOKE","REPLACE"}
    for stmt in sqlparse.parse(query):
        stmt_type = stmt.get_type()
        if stmt_type and stmt_type not in ("SELECT","WITH","SHOW","DESCRIBE","DESC","EXPLAIN","UNKNOWN"):
            return f"Only SELECT queries allowed. Detected: {stmt_type}"
        tokens = [t for t in stmt.tokens if not t.is_whitespace]
        for tok in tokens[:3]:
            if tok.ttype in (sqlparse.tokens.Keyword, sqlparse.tokens.DML):
                if tok.value.upper() in dangerous:
                    return f"Only SELECT queries allowed. Detected: {tok.value.upper()}"
    return None

def validate_identifier(name: str) -> bool:
    """Check that a schema/table name is safe (alphanumeric + underscores)."""
    return bool(name) and name.replace("_", "").replace(".", "").isalnum()

# --- Tools ---

@mcp.tool()
async def get_schema_map() -> str:
    """Get a complete map of all schemas, tables, and columns in the database.
    Call this first to understand what data is available before writing queries."""
    try:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    "SELECT table_schema, table_name, column_name, column_type, is_nullable "
                    "FROM information_schema.columns "
                    "WHERE table_schema NOT IN ('information_schema','mysql','performance_schema','sys') "
                    "ORDER BY table_schema, table_name, ordinal_position"
                )
                rows = await cur.fetchall()
                if not rows:
                    return "No user tables found."
                schemas = {}
                for r in rows:
                    schema = r["table_schema"]
                    table = r["table_name"]
                    col_parts = [f"{r['column_name']}: {r['column_type']}"]
                    if r["is_nullable"] == "NO":
                        col_parts.append("NOT NULL")
                    schemas.setdefault(schema, {}).setdefault(table, []).append(" ".join(col_parts))
                lines = ["DATABASE SCHEMA MAP", "=" * 40]
                for schema, tables in sorted(schemas.items()):
                    lines.append(f"\nSchema: {schema} ({len(tables)} tables)")
                    lines.append("-" * 30)
                    for table, columns in sorted(tables.items()):
                        lines.append(f"  {schema}.{table}")
                        for col in columns:
                            lines.append(f"    - {col}")
                return "\n".join(lines)
    except Exception as e:
        return f"Error discovering schema: {e}"

@mcp.tool()
async def query_database(query: str) -> str:
    """Execute a read-only SQL query. Only SELECT/SHOW/DESCRIBE allowed. Returns up to 1000 rows."""
    error = validate_readonly(query)
    if error:
        return f"BLOCKED: {error}"
    try:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query)
                rows = await cur.fetchmany(1000)
                return f"Rows returned: {len(rows)}\n\n{rows}"
    except Exception as e:
        return f"Query error: {e}"

@mcp.tool()
async def get_table_list(schema_name: str = "{default_schema}") -> str:
    """List all tables in a schema."""
    if not validate_identifier(schema_name):
        return "Invalid schema name."
    try:
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(f"SHOW TABLES FROM `{schema_name}`")
                tables = [row[0] for row in await cur.fetchall()]
                return f"Tables in {schema_name} ({len(tables)}):\n" + "\n".join(f"  - {t}" for t in tables)
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
async def get_table_schema(table_name: str) -> str:
    """Describe columns for a table. Supports 'schema.table' format."""
    if not validate_identifier(table_name):
        return "Invalid table name."
    if "." in table_name:
        schema, table = table_name.split(".", 1)
        query = f"DESCRIBE `{schema}`.`{table}`"
    else:
        query = f"DESCRIBE `{table_name}`"
    try:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query)
                cols = await cur.fetchall()
                lines = []
                for c in cols:
                    parts = [f"{c['Field']}: {c['Type']}"]
                    if c["Null"] == "NO":
                        parts.append("NOT NULL")
                    if c["Key"]:
                        parts.append(f"({c['Key']})")
                    lines.append(" ".join(parts))
                return f"Schema for {table_name}:\n" + "\n".join(f"  - {l}" for l in lines)
    except Exception as e:
        return f"Error: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

**For PostgreSQL**, swap:
- `aiomysql` → `asyncpg`
- `aiomysql.create_pool(...)` → `asyncpg.create_pool(dsn=None, host=..., port=..., user=..., password=..., database=...)`
- Cursor API → `pool.fetch()` / `pool.fetchrow()`
- `SHOW TABLES FROM` → `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`
- `DESCRIBE` → `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`
- `get_schema_map` query: use `information_schema.tables` joined with `information_schema.columns`, filter `WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema') AND t.table_type = 'BASE TABLE'`, use `c.data_type` instead of `column_type`

### For S3 — Generate `server.py`

```python
#!/usr/bin/env python3
"""
{Server Name} MCP Server
Read-only access to S3 bucket {bucket} via MCP tools.
"""

import os
import io
import logging
from typing import Any

import boto3
from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BUCKET = os.getenv("{BUCKET_ENV}", "{bucket_name}")
PREFIX = os.getenv("{PREFIX_ENV}", "{prefix}")

session = boto3.Session(profile_name=os.getenv("AWS_PROFILE"))
s3 = session.client("s3", region_name=os.getenv("AWS_REGION", "{region}"))

mcp = FastMCP("{server-name}")

@mcp.tool()
async def list_objects(prefix: str = PREFIX, max_keys: int = 100) -> str:
    """List objects in the S3 bucket under a prefix. Returns up to max_keys results."""
    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, MaxKeys=max_keys)
    objects = resp.get("Contents", [])
    if not objects:
        return f"No objects found under s3://{BUCKET}/{prefix}"
    lines = [f"s3://{BUCKET}/{o['Key']}  ({o['Size']} bytes, {o['LastModified']})" for o in objects]
    return f"Found {len(objects)} objects:\n" + "\n".join(lines)

@mcp.tool()
async def read_file(key: str, max_bytes: int = 1_000_000) -> str:
    """Read a file from S3. Text files returned as content; binary files show metadata only. Max 1MB default."""
    obj = s3.get_object(Bucket=BUCKET, Key=key, Range=f"bytes=0-{max_bytes - 1}")
    content_type = obj.get("ContentType", "")
    body = obj["Body"].read()
    if any(t in content_type for t in ("text", "json", "csv")):
        return body.decode("utf-8", errors="replace")
    return f"Binary file: {key} ({len(body)} bytes, type: {content_type}). Use get_file_info for metadata."

@mcp.tool()
async def get_file_info(key: str) -> str:
    """Get metadata for an S3 object (size, type, last modified)."""
    obj = s3.head_object(Bucket=BUCKET, Key=key)
    return (
        f"Key: {key}\n"
        f"Size: {obj['ContentLength']} bytes\n"
        f"Type: {obj.get('ContentType', 'unknown')}\n"
        f"Last Modified: {obj['LastModified']}\n"
        f"ETag: {obj.get('ETag', 'N/A')}"
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### For DynamoDB — Generate `server.py`

```python
#!/usr/bin/env python3
"""
{Server Name} MCP Server
Read-only access to DynamoDB tables via MCP tools.
"""

import os
import json
import logging

import boto3
from boto3.dynamodb.types import TypeDeserializer
from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TABLE_PREFIX = os.getenv("DYNAMODB_TABLE_PREFIX", "")

session = boto3.Session(profile_name=os.getenv("AWS_PROFILE"))
dynamodb = session.client("dynamodb", region_name=os.getenv("AWS_REGION", "{region}"))
deserializer = TypeDeserializer()

mcp = FastMCP("{server-name}")


def deserialize_item(item: dict) -> dict:
    """Convert DynamoDB item format (e.g., {"S": "value"}) to plain Python types."""
    return {k: deserializer.deserialize(v) for k, v in item.items()}


def _infer_type(value) -> str:
    """Infer a human-readable type name from a deserialized DynamoDB value."""
    if isinstance(value, bool):
        return "Boolean"
    if isinstance(value, (int, float)):
        return "Number"
    if isinstance(value, str):
        return "String"
    if isinstance(value, dict):
        return "Map"
    if isinstance(value, list):
        return "List"
    if isinstance(value, set):
        return "Set"
    if value is None:
        return "Null"
    return type(value).__name__


@mcp.tool()
async def list_tables() -> str:
    """List all DynamoDB tables in the region. Filtered by prefix if configured."""
    tables = []
    kwargs = {}
    while True:
        resp = dynamodb.list_tables(**kwargs)
        tables.extend(resp.get("TableNames", []))
        if "LastEvaluatedTableName" not in resp:
            break
        kwargs["ExclusiveStartTableName"] = resp["LastEvaluatedTableName"]
    if TABLE_PREFIX:
        tables = [t for t in tables if t.startswith(TABLE_PREFIX)]
    if not tables:
        return "No tables found."
    return f"Found {len(tables)} tables:\n" + "\n".join(f"  - {t}" for t in tables)


@mcp.tool()
async def describe_table(table_name: str) -> str:
    """Describe a DynamoDB table: key schema, attributes, indexes, item count, size."""
    try:
        resp = dynamodb.describe_table(TableName=table_name)
        t = resp["Table"]
        lines = [
            f"Table: {t['TableName']}",
            f"Status: {t['TableStatus']}",
            f"Item Count: {t.get('ItemCount', 'N/A')}",
            f"Size: {t.get('TableSizeBytes', 0)} bytes",
            "",
            "Key Schema:",
        ]
        for key in t.get("KeySchema", []):
            lines.append(f"  - {key['AttributeName']} ({key['KeyType']})")
        lines.append("\nAttribute Definitions:")
        for attr in t.get("AttributeDefinitions", []):
            lines.append(f"  - {attr['AttributeName']}: {attr['AttributeType']}")
        for gsi in t.get("GlobalSecondaryIndexes", []):
            lines.append(f"\nGSI: {gsi['IndexName']}")
            for key in gsi.get("KeySchema", []):
                lines.append(f"  - {key['AttributeName']} ({key['KeyType']})")
        for lsi in t.get("LocalSecondaryIndexes", []):
            lines.append(f"\nLSI: {lsi['IndexName']}")
            for key in lsi.get("KeySchema", []):
                lines.append(f"  - {key['AttributeName']} ({key['KeyType']})")
        return "\n".join(lines)
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def get_table_schema(table_name: str, sample_size: int = 20) -> str:
    """Infer the schema of a DynamoDB table by sampling items.
    Call this first to understand what attributes are in the table before writing queries.
    Scans sample_size items (default 20) and reports all observed attributes, their types,
    and how frequently they appear."""
    try:
        desc = dynamodb.describe_table(TableName=table_name)
        t = desc["Table"]
        key_attrs = {k["AttributeName"]: k["KeyType"] for k in t.get("KeySchema", [])}

        resp = dynamodb.scan(TableName=table_name, Limit=sample_size)
        raw_items = resp.get("Items", [])
        if not raw_items:
            return f"Table {table_name} has no items to sample."

        items = [deserialize_item(i) for i in raw_items]
        total = len(items)

        attr_stats = {}
        for item in items:
            for attr, value in item.items():
                if attr not in attr_stats:
                    attr_stats[attr] = {"types": set(), "count": 0, "sample": None}
                attr_stats[attr]["types"].add(_infer_type(value))
                attr_stats[attr]["count"] += 1
                if attr_stats[attr]["sample"] is None and not isinstance(value, (dict, list, set)):
                    attr_stats[attr]["sample"] = str(value)[:80]

        lines = [
            f"Table: {table_name}",
            f"Sampled: {total} items",
            f"Unique attributes: {len(attr_stats)}",
            "",
            "ATTRIBUTE SCHEMA (inferred from sample)",
            "=" * 50,
        ]

        for attr in sorted(key_attrs):
            stats = attr_stats.pop(attr, {"types": {"?"}, "count": total, "sample": None})
            key_label = "HASH" if key_attrs[attr] == "HASH" else "RANGE"
            types_str = "/".join(sorted(stats["types"]))
            sample_str = f'  e.g., "{stats["sample"]}"' if stats["sample"] else ""
            lines.append(f"  {attr}: {types_str} [{key_label} KEY] ({stats['count']}/{total}){sample_str}")

        lines.append("")

        for attr in sorted(attr_stats, key=lambda a: (-attr_stats[a]["count"], a)):
            stats = attr_stats[attr]
            types_str = "/".join(sorted(stats["types"]))
            freq = f"{stats['count']}/{total}"
            sample_str = f'  e.g., "{stats["sample"]}"' if stats["sample"] else ""
            lines.append(f"  {attr}: {types_str} ({freq}){sample_str}")

        return "\n".join(lines)
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def scan_table(table_name: str, limit: int = 100, filter_expression: str = "",
                     expression_values: str = "{}") -> str:
    """Scan a DynamoDB table. Returns up to limit items (default 100).
    Optional filter_expression (e.g., 'status = :s') with expression_values as JSON
    (e.g., '{":s": {"S": "ACTIVE"}}')."""
    try:
        kwargs = {"TableName": table_name, "Limit": limit}
        if filter_expression:
            kwargs["FilterExpression"] = filter_expression
            vals = json.loads(expression_values)
            if vals:
                kwargs["ExpressionAttributeValues"] = vals
        resp = dynamodb.scan(**kwargs)
        items = [deserialize_item(i) for i in resp.get("Items", [])]
        return f"Items returned: {len(items)}\n\n{json.dumps(items, default=str, indent=2)}"
    except Exception as e:
        return f"Scan error: {e}"


@mcp.tool()
async def query_table(table_name: str, key_condition: str, expression_values: str = "{}",
                      limit: int = 100, index_name: str = "") -> str:
    """Query a DynamoDB table by key condition.
    key_condition: e.g., 'pk = :pk AND begins_with(sk, :prefix)'
    expression_values: JSON, e.g., '{":pk": {"S": "ORDER#123"}}'
    index_name: optional GSI/LSI name to query."""
    try:
        kwargs = {
            "TableName": table_name,
            "KeyConditionExpression": key_condition,
            "ExpressionAttributeValues": json.loads(expression_values),
            "Limit": limit,
        }
        if index_name:
            kwargs["IndexName"] = index_name
        resp = dynamodb.query(**kwargs)
        items = [deserialize_item(i) for i in resp.get("Items", [])]
        return f"Items returned: {len(items)}\n\n{json.dumps(items, default=str, indent=2)}"
    except Exception as e:
        return f"Query error: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### Generate `pyproject.toml`

```toml
[project]
name = "{server-name}-mcp"
version = "0.1.0"
description = "MCP server for read-only access to {data source description}"
requires-python = ">=3.10"
dependencies = [
    # For database: "fastmcp>=2.14", "aiomysql>=0.2" (or "asyncpg>=0.29"), "python-dotenv>=1.0", "sqlparse>=0.4"
    # For S3: "fastmcp>=2.14", "boto3>=1.34", "python-dotenv>=1.0"
    # For DynamoDB: "fastmcp>=2.14", "boto3>=1.34", "python-dotenv>=1.0"
]
```

### Generate `requirements.txt`

Flat list of the same dependencies for `pip install -r`.

### Generate `__init__.py`

Empty file.

---

## Step 5: Install Dependencies

```bash
cd {server-path}
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

**Both installs are required:**
- `pip install -r requirements.txt` installs the dependencies
- `pip install -e .` installs the package itself in editable mode so `python -m {server_name}_mcp_server.server` can find the module (the `src/` layout requires this)

Verify the module is importable:
```bash
{server-path}/.venv/bin/python -c "import {server_name}_mcp_server.server; print('OK')"
```

If pip or the import fails, report the error and stop.

---

## Step 6: Register with Claude Code

**CRITICAL:**
1. **Credentials are passed as env var REFERENCES, not values.**
2. **Use ABSOLUTE paths** for the Python binary — relative paths break because `claude mcp add` may resolve them from the wrong directory.
3. **Run from the project root** — `claude mcp add --scope project` writes to `.mcp.json` in the current working directory. Always `cd` to the project root first.

For database servers:
```bash
cd {project-root}
claude mcp add --scope project {server-name} \
  -e {HOST_ENV}="{host}" \
  -e {PORT_ENV}="{port}" \
  -e {DB_ENV}="{database}" \
  -e {USER_ENV}='${{USER_ENV_NAME}}' \
  -e {PASS_ENV}='${{PASS_ENV_NAME}}' \
  -- {absolute-server-path}/.venv/bin/python \
  -m {server_name}_mcp_server.server
```

Note: The host, port, and database name are not secrets — those can be literal values. Only the username and password must be env var references like `'${DB_USERNAME}'`.

For S3 servers (using AWS profile):
```bash
cd {project-root}
claude mcp add --scope project {server-name} \
  -e AWS_PROFILE="{profile}" \
  -e AWS_REGION="{region}" \
  -e S3_BUCKET="{bucket}" \
  -- {absolute-server-path}/.venv/bin/python \
  -m {server_name}_mcp_server.server
```

For S3 servers (using shared temporary credentials):
```bash
cd {project-root}
claude mcp add --scope project {server-name} \
  -e AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' \
  -e AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' \
  -e AWS_SESSION_TOKEN='${AWS_SESSION_TOKEN}' \
  -e AWS_REGION="{region}" \
  -e S3_BUCKET="{bucket}" \
  -- {absolute-server-path}/.venv/bin/python \
  -m {server_name}_mcp_server.server
```

Note: Bucket name and region are not secrets — literal values are fine. AWS credentials (access key, secret key) MUST be env var references (`${...}`). When using an AWS profile, the credentials live in `~/.aws/credentials` managed by `aws configure` — only the profile name is passed.

For DynamoDB servers (using AWS profile):
```bash
cd {project-root}
claude mcp add --scope project {server-name} \
  -e AWS_PROFILE="{profile}" \
  -e AWS_REGION="{region}" \
  -e DYNAMODB_TABLE_PREFIX="{prefix}" \
  -- {absolute-server-path}/.venv/bin/python \
  -m {server_name}_mcp_server.server
```

For DynamoDB servers (using shared temporary credentials):
```bash
cd {project-root}
claude mcp add --scope project {server-name} \
  -e AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' \
  -e AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' \
  -e AWS_SESSION_TOKEN='${AWS_SESSION_TOKEN}' \
  -e AWS_REGION="{region}" \
  -e DYNAMODB_TABLE_PREFIX="{prefix}" \
  -- {absolute-server-path}/.venv/bin/python \
  -m {server_name}_mcp_server.server
```

Note: Region and table prefix are not secrets — literal values are fine. AWS credentials MUST be env var references (`${...}`).

**Verify registration** — after running `claude mcp add`, confirm the server appears in the project root `.mcp.json`:
```bash
cat {project-root}/.mcp.json | python3 -c "import sys,json; d=json.load(sys.stdin); print('{server-name}' in d.get('mcpServers',{}))"
```
If it prints `False`, the registration went to the wrong directory. Remove any stale `.mcp.json` files and re-run from the project root.

---

## Step 7: Add Permissions

Read `.claude/settings.json`, then add `"mcp__{server-name}__*"` to the `permissions.allow` array if not already present. Use the `Edit` tool to add it.

Example: if the server name is `warehouse-db`, add `"mcp__warehouse-db__*"`.

---

## Step 8: Test Connection

1. Use `ToolSearch` to discover the new MCP tools: `ToolSearch(query: "+{server-name}")`
2. Call a health-check tool:
   - **Database**: Call `get_table_list` with the default schema
   - **S3**: Call `list_objects` with the default prefix
   - **DynamoDB**: Call `list_tables`, then `get_table_schema` on the first table
3. Report the result:
   - **Success**: Show the tables or objects found, confirm the server is working
   - **Failure**: Show the error, suggest common fixes (VPN, credentials, network)

---

## Step 9: Summary

Display a summary:

```
MCP Data Source Setup Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server name:    {server-name}
Type:           {Database/S3/DynamoDB}
Location:       {server-path}/
Registered:     claude mcp (project scope)
Permissions:    mcp__{server-name}__* (allowed)
Status:         {Connected / Failed}

Available tools:
  - {tool_1}
  - {tool_2}
  - {tool_3}

To use: Ask Claude about your data — the tools are now available.
To customize: Edit {server-path}/src/{server_name}_mcp_server/server.py
```

## Additional Context
$ARGUMENTS
