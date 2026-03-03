# Custom MCP Data Source Setup Guide

## Overview

Workshop teams often need Claude to query data sources specific to their project — warehouse databases, analytics stores, S3 buckets with CSV/JSON data, DynamoDB tables, etc. The `/setup-mcp-datasource` command automates the creation of a FastMCP Python server that gives Claude read-only access to your data.

**What it does:**
1. Asks what kind of data source you have (database, S3, or DynamoDB)
2. Gathers connection details via guided prompts
3. Generates a FastMCP server with read-only tools
4. Installs dependencies in a virtual environment
5. Registers the server with Claude Code
6. Tests connectivity

**Time:** ~5 minutes

**Security:** All credentials are passed as environment variable references — never stored in code or config files in the clear.

## Quick Start

```
/setup-mcp-datasource
```

Follow the prompts. You'll need:
- **For databases:** Host, port, database name, and credential env vars already exported in your shell
- **For S3:** Bucket name, region, and an AWS profile or credential env vars
- **For DynamoDB:** Region, optional table prefix, and an AWS profile or credential env vars

**Location:** The command asks where to generate the server code. Default is `.claude/repos/` in the current project. You can also choose `~/.claude/repos/` (home directory) or a custom path. The manual setup examples below use `.claude/repos/` — substitute your chosen location.

## Manual Setup: Relational Database

If you prefer to set up manually or need to customize beyond what the command generates.

### 1. Create the server directory

```bash
mkdir -p .claude/repos/my-database-mcp/src/my_database_mcp_server
touch .claude/repos/my-database-mcp/src/my_database_mcp_server/__init__.py
```

### 2. Create `requirements.txt`

**For MySQL:**
```
fastmcp>=2.14
aiomysql>=0.2
python-dotenv>=1.0
sqlparse>=0.4
```

**For PostgreSQL:**
```
fastmcp>=2.14
asyncpg>=0.29
python-dotenv>=1.0
sqlparse>=0.4
```

### 3. Create `server.py`

**MySQL template** — `.claude/repos/my-database-mcp/src/my_database_mcp_server/server.py`:

```python
#!/usr/bin/env python3
"""
My Database MCP Server
Read-only access to MySQL database via MCP tools.
"""

import os
import logging
from contextlib import asynccontextmanager

import aiomysql
import sqlparse
from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Connection pool (lifespan-managed) ---

pool: aiomysql.Pool | None = None


@asynccontextmanager
async def app_lifespan(server: FastMCP):
    """Create connection pool on startup, close on shutdown."""
    global pool
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "3306"))
    user = os.getenv("DB_USERNAME")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME", "mydb")

    if not user or not password:
        raise ValueError(
            "DB_USERNAME and DB_PASSWORD environment variables must be set"
        )

    pool = await aiomysql.create_pool(
        host=host,
        port=port,
        user=user,
        password=password,
        db=database,
        autocommit=True,
        minsize=1,
        maxsize=5,
    )
    logger.info(f"Connected to MySQL at {host}:{port}/{database}")
    try:
        yield
    finally:
        pool.close()
        await pool.wait_closed()
        logger.info("Connection pool closed")


mcp = FastMCP("my-database", lifespan=app_lifespan)


# --- Read-only validation ---


def validate_readonly(query: str) -> str | None:
    """Return error message if query is not read-only, else None."""
    dangerous = {
        "INSERT", "UPDATE", "DELETE", "DROP", "CREATE",
        "ALTER", "TRUNCATE", "GRANT", "REVOKE", "REPLACE",
    }
    try:
        for stmt in sqlparse.parse(query):
            stmt_type = stmt.get_type()
            safe_types = {"SELECT", "WITH", "SHOW", "DESCRIBE", "DESC", "EXPLAIN", "UNKNOWN"}
            if stmt_type and stmt_type not in safe_types:
                return f"Only SELECT queries allowed. Detected: {stmt_type}"
            tokens = [t for t in stmt.tokens if not t.is_whitespace]
            for tok in tokens[:3]:
                if tok.ttype in (sqlparse.tokens.Keyword, sqlparse.tokens.DML):
                    if tok.value.upper() in dangerous:
                        return f"Only SELECT queries allowed. Detected: {tok.value.upper()}"
    except Exception:
        # Fallback: reject if not starting with a known safe keyword
        stripped = query.strip().upper()
        if not stripped.startswith(("SELECT", "WITH", "SHOW", "DESCRIBE", "EXPLAIN")):
            return "Only SELECT queries allowed. Unable to parse query."
    return None


def validate_identifier(name: str) -> bool:
    """Check that a schema/table name is safe (alphanumeric + underscores + dots)."""
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
    """Execute a read-only SQL query. Only SELECT/SHOW/DESCRIBE allowed.
    Returns up to 1000 rows. Use schema.table format for cross-schema queries."""
    error = validate_readonly(query)
    if error:
        return f"BLOCKED: {error}"
    try:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query)
                rows = await cur.fetchmany(1000)
                if not rows:
                    return "Query executed successfully. No rows returned."
                return f"Rows returned: {len(rows)}\n\n{rows}"
    except Exception as e:
        return f"Query error: {e}"


@mcp.tool()
async def get_table_list(schema_name: str = "mydb") -> str:
    """List all tables in a schema/database."""
    if not validate_identifier(schema_name):
        return "Invalid schema name. Must be alphanumeric with underscores."
    try:
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(f"SHOW TABLES FROM `{schema_name}`")
                tables = [row[0] for row in await cur.fetchall()]
                return (
                    f"Tables in {schema_name} ({len(tables)}):\n"
                    + "\n".join(f"  - {t}" for t in tables)
                )
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def get_table_schema(table_name: str) -> str:
    """Describe columns for a table. Supports 'schema.table' format."""
    if not validate_identifier(table_name):
        return "Invalid table name. Must be alphanumeric with underscores."
    if "." in table_name:
        schema, table = table_name.split(".", 1)
        q = f"DESCRIBE `{schema}`.`{table}`"
    else:
        q = f"DESCRIBE `{table_name}`"
    try:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(q)
                cols = await cur.fetchall()
                lines = []
                for c in cols:
                    parts = [f"{c['Field']}: {c['Type']}"]
                    if c["Null"] == "NO":
                        parts.append("NOT NULL")
                    if c["Key"]:
                        parts.append(f"({c['Key']})")
                    lines.append(" ".join(parts))
                return (
                    f"Schema for {table_name}:\n"
                    + "\n".join(f"  - {line}" for line in lines)
                )
    except Exception as e:
        return f"Error: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

**PostgreSQL template** — key differences only:

```python
import asyncpg
from mcp.server.fastmcp import FastMCP

pool: asyncpg.Pool | None = None

@asynccontextmanager
async def app_lifespan(server: FastMCP):
    global pool
    pool = await asyncpg.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "mydb"),
        min_size=1,
        max_size=5,
    )
    try:
        yield
    finally:
        await pool.close()

mcp = FastMCP("my-database", lifespan=app_lifespan)

@mcp.tool()
async def get_schema_map() -> str:
    """Get a complete map of all schemas, tables, and columns in the database.
    Call this first to understand what data is available before writing queries."""
    try:
        rows = await pool.fetch("""
            SELECT t.table_schema, t.table_name, c.column_name, c.data_type, c.is_nullable
            FROM information_schema.tables t
            JOIN information_schema.columns c
                ON t.table_schema = c.table_schema AND t.table_name = c.table_name
            WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
                AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_schema, t.table_name, c.ordinal_position
        """)
        if not rows:
            return "No user tables found."
        schemas = {}
        for r in rows:
            schema = r["table_schema"]
            table = r["table_name"]
            col_parts = [f"{r['column_name']}: {r['data_type']}"]
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
    """Execute a read-only SQL query."""
    error = validate_readonly(query)
    if error:
        return f"BLOCKED: {error}"
    try:
        rows = await pool.fetch(query)
        if not rows:
            return "Query executed successfully. No rows returned."
        result = [dict(r) for r in rows[:1000]]
        return f"Rows returned: {len(result)}\n\n{result}"
    except Exception as e:
        return f"Query error: {e}"

@mcp.tool()
async def get_table_list(schema_name: str = "public") -> str:
    """List all tables in a schema."""
    if not validate_identifier(schema_name):
        return "Invalid schema name."
    rows = await pool.fetch(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = $1 ORDER BY table_name",
        schema_name,
    )
    tables = [r["table_name"] for r in rows]
    return f"Tables in {schema_name} ({len(tables)}):\n" + "\n".join(f"  - {t}" for t in tables)

@mcp.tool()
async def get_table_schema(table_name: str) -> str:
    """Describe columns for a table. Use 'schema.table' format."""
    if not validate_identifier(table_name):
        return "Invalid table name."
    if "." in table_name:
        schema, table = table_name.split(".", 1)
    else:
        schema, table = "public", table_name
    rows = await pool.fetch(
        "SELECT column_name, data_type, is_nullable, column_default "
        "FROM information_schema.columns "
        "WHERE table_schema = $1 AND table_name = $2 "
        "ORDER BY ordinal_position",
        schema, table,
    )
    lines = []
    for r in rows:
        parts = [f"{r['column_name']}: {r['data_type']}"]
        if r["is_nullable"] == "NO":
            parts.append("NOT NULL")
        if r["column_default"]:
            parts.append(f"DEFAULT {r['column_default']}")
        lines.append(" ".join(parts))
    return f"Schema for {table_name}:\n" + "\n".join(f"  - {line}" for line in lines)
```

### 4. Install

```bash
cd .claude/repos/my-database-mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .  # Required — installs the package so `python -m` can find it
```

### 5. Register with Claude Code

```bash
claude mcp add --scope project my-database \
  -e DB_HOST="your-host.example.com" \
  -e DB_PORT="3306" \
  -e DB_NAME="your_database" \
  -e DB_USERNAME='${DB_USERNAME}' \
  -e DB_PASSWORD='${DB_PASSWORD}' \
  -- .claude/repos/my-database-mcp/.venv/bin/python \
  -m my_database_mcp_server.server
```

**Note:** `DB_HOST`, `DB_PORT`, and `DB_NAME` are not secrets — literal values are fine. `DB_USERNAME` and `DB_PASSWORD` MUST be env var references (`${...}`) so credentials are never stored in Claude Code config.

### 6. Add permissions

Add `"mcp__my-database__*"` to `.claude/settings.json` → `permissions.allow`.

## Manual Setup: S3

### 1. Create the server directory

```bash
mkdir -p .claude/repos/my-s3-mcp/src/my_s3_mcp_server
touch .claude/repos/my-s3-mcp/src/my_s3_mcp_server/__init__.py
```

### 2. Create `requirements.txt`

```
fastmcp>=2.14
boto3>=1.34
python-dotenv>=1.0
```

### 3. Create `server.py`

```python
#!/usr/bin/env python3
"""
My S3 MCP Server
Read-only access to S3 bucket via MCP tools.
"""

import os
import logging

import boto3
from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BUCKET = os.getenv("S3_BUCKET", "my-bucket")
DEFAULT_PREFIX = os.getenv("S3_PREFIX", "")

session = boto3.Session(
    profile_name=os.getenv("AWS_PROFILE"),
    region_name=os.getenv("AWS_REGION", "us-west-2"),
)
s3 = session.client("s3")

mcp = FastMCP("my-s3")


@mcp.tool()
async def list_objects(prefix: str = DEFAULT_PREFIX, max_keys: int = 100) -> str:
    """List objects in the S3 bucket under a prefix. Returns up to max_keys results."""
    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, MaxKeys=max_keys)
    objects = resp.get("Contents", [])
    if not objects:
        return f"No objects found under s3://{BUCKET}/{prefix}"
    lines = [
        f"  {o['Key']}  ({o['Size']:,} bytes, {o['LastModified']})"
        for o in objects
    ]
    return f"Found {len(objects)} objects in s3://{BUCKET}/{prefix}:\n" + "\n".join(lines)


@mcp.tool()
async def read_file(key: str, max_bytes: int = 1_000_000) -> str:
    """Read a file from S3. Text files returned as content; binary files show metadata.
    Default max 1MB. For CSV/JSON/text files, returns the content directly."""
    obj = s3.get_object(Bucket=BUCKET, Key=key, Range=f"bytes=0-{max_bytes - 1}")
    content_type = obj.get("ContentType", "")
    body = obj["Body"].read()

    # Return text content directly
    if any(t in content_type for t in ("text", "json", "csv", "xml")):
        return body.decode("utf-8", errors="replace")

    # For binary files, just show metadata
    return (
        f"Binary file: {key}\n"
        f"Size: {len(body):,} bytes\n"
        f"Type: {content_type}\n"
        f"Use get_file_info for full metadata."
    )


@mcp.tool()
async def get_file_info(key: str) -> str:
    """Get metadata for an S3 object without downloading it."""
    obj = s3.head_object(Bucket=BUCKET, Key=key)
    return (
        f"Key: {key}\n"
        f"Size: {obj['ContentLength']:,} bytes\n"
        f"Type: {obj.get('ContentType', 'unknown')}\n"
        f"Last Modified: {obj['LastModified']}\n"
        f"ETag: {obj.get('ETag', 'N/A')}"
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### 4. Install, register, and add permissions

Same pattern as database setup — see steps 4-6 above, substituting S3 env vars:

```bash
# Install
cd .claude/repos/my-s3-mcp && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && pip install -e .

# Register (using AWS profile — recommended)
claude mcp add --scope project my-s3 \
  -e AWS_PROFILE="claude_code" \
  -e AWS_REGION="us-west-2" \
  -e S3_BUCKET="my-bucket-name" \
  -- .claude/repos/my-s3-mcp/.venv/bin/python \
  -m my_s3_mcp_server.server

# OR Register (using shared temporary credentials from aws-okta)
claude mcp add --scope project my-s3 \
  -e AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' \
  -e AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' \
  -e AWS_SESSION_TOKEN='${AWS_SESSION_TOKEN}' \
  -e AWS_REGION="us-west-2" \
  -e S3_BUCKET="my-bucket-name" \
  -- .claude/repos/my-s3-mcp/.venv/bin/python \
  -m my_s3_mcp_server.server

# Permissions: add "mcp__my-s3__*" to .claude/settings.json
```

## Manual Setup: DynamoDB

### 1. Create the server directory

```bash
mkdir -p .claude/repos/my-dynamodb-mcp/src/my_dynamodb_mcp_server
touch .claude/repos/my-dynamodb-mcp/src/my_dynamodb_mcp_server/__init__.py
```

### 2. Create `requirements.txt`

```
fastmcp>=2.14
boto3>=1.34
python-dotenv>=1.0
```

### 3. Create `server.py`

```python
#!/usr/bin/env python3
"""
My DynamoDB MCP Server
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

session = boto3.Session(
    profile_name=os.getenv("AWS_PROFILE"),
    region_name=os.getenv("AWS_REGION", "us-west-2"),
)
dynamodb = session.client("dynamodb")
deserializer = TypeDeserializer()

mcp = FastMCP("my-dynamodb")


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

### 4. Install, register, and add permissions

Same pattern as S3 setup — see steps 4-6 above, substituting DynamoDB env vars:

```bash
# Install
cd .claude/repos/my-dynamodb-mcp && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && pip install -e .

# Register (using AWS profile — recommended)
claude mcp add --scope project my-dynamodb \
  -e AWS_PROFILE="claude_code" \
  -e AWS_REGION="us-west-2" \
  -e DYNAMODB_TABLE_PREFIX="" \
  -- .claude/repos/my-dynamodb-mcp/.venv/bin/python \
  -m my_dynamodb_mcp_server.server

# OR Register (using shared temporary credentials from aws-okta)
claude mcp add --scope project my-dynamodb \
  -e AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' \
  -e AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' \
  -e AWS_SESSION_TOKEN='${AWS_SESSION_TOKEN}' \
  -e AWS_REGION="us-west-2" \
  -e DYNAMODB_TABLE_PREFIX="" \
  -- .claude/repos/my-dynamodb-mcp/.venv/bin/python \
  -m my_dynamodb_mcp_server.server

# Permissions: add "mcp__my-dynamodb__*" to .claude/settings.json
```

## Environment Variables

### Database Servers

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | Database hostname or IP |
| `DB_PORT` | No | Port (default: 3306 MySQL, 5432 PostgreSQL) |
| `DB_NAME` | Yes | Database name |
| `DB_USERNAME` | Yes | Database username — **must be set in shell, never hardcoded** |
| `DB_PASSWORD` | Yes | Database password — **must be set in shell, never hardcoded** |

### S3 Servers

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_BUCKET` | Yes | Bucket name |
| `S3_PREFIX` | No | Default prefix to scope access |
| `AWS_REGION` | No | AWS region (default: us-west-2) |
| `AWS_PROFILE` | No | AWS CLI profile name — use this OR the key/secret pair below |
| `AWS_ACCESS_KEY_ID` | No | AWS access key — **must be set in shell, never hardcoded** |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret key — **must be set in shell, never hardcoded** |
| `AWS_SESSION_TOKEN` | No | STS session token — **required when using temporary credentials from aws-okta** |

### DynamoDB Servers

| Variable | Required | Description |
|----------|----------|-------------|
| `DYNAMODB_TABLE_PREFIX` | No | Table name prefix to filter visible tables (default: show all) |
| `AWS_REGION` | No | AWS region (default: us-west-2) |
| `AWS_PROFILE` | No | AWS CLI profile name — use this OR the key/secret pair below |
| `AWS_ACCESS_KEY_ID` | No | AWS access key — **must be set in shell, never hardcoded** |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret key — **must be set in shell, never hardcoded** |
| `AWS_SESSION_TOKEN` | No | STS session token — **required when using temporary credentials from aws-okta** |

**Setting env vars** — add to `~/.zshrc`:
```bash
# Database credentials
export DB_USERNAME="your_username"
export DB_PASSWORD="your_password"

# AWS credentials (if using shared temporary credentials from aws-okta)
# A teammate with access runs aws-okta, then shares these three values
export AWS_ACCESS_KEY_ID="<from teammate>"
export AWS_SECRET_ACCESS_KEY="<from teammate>"
export AWS_SESSION_TOKEN="<from teammate>"
# NOTE: These are temporary — they expire after 1-12 hours
```
Then: `source ~/.zshrc`

## Customization

### Adding tools to a database server

Add a new `@mcp.tool()` function to `server.py`. FastMCP auto-registers it:

```python
@mcp.tool()
async def get_recent_orders(limit: int = 10) -> str:
    """Get the most recent orders with status."""
    rows = await pool.fetch(
        "SELECT order_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT $1",
        limit,
    )
    return "\n".join(f"{r['order_id']}: {r['status']} ({r['created_at']})" for r in rows)
```

### Adding business context

Create a companion module with domain knowledge that enriches tool responses:

```python
# src/my_database_mcp_server/context.py
TABLE_DESCRIPTIONS = {
    "orders": "Customer orders from the e-commerce platform",
    "inventory": "Current stock levels by SKU and warehouse",
}
```

### Restricting access

To limit which schemas or tables Claude can query, add validation in `query_database`:

```python
ALLOWED_SCHEMAS = {"public", "analytics"}

@mcp.tool()
async def query_database(query: str) -> str:
    # ... existing validation ...
    # Add schema restriction
    for schema in extract_schemas(query):
        if schema not in ALLOWED_SCHEMAS:
            return f"BLOCKED: Access to schema '{schema}' is not allowed."
```

## Troubleshooting

### "Connection refused" or timeout
- **VPN**: Most Nordstrom databases require VPN. Verify you're connected.
- **Host/port**: Double-check the host and port. Use `nc -zv host port` to test connectivity.
- **Firewall**: Some databases restrict access by IP. Check with your DBA.

### "Access denied" or authentication error
- **Env vars**: Verify credentials are set: `echo $DB_USERNAME` (should show a value)
- **Permissions**: The database user may not have SELECT access. Ask your DBA for read-only access.
- **Password special characters**: If your password has special characters, make sure it's properly quoted in `~/.zshrc`: `export DB_PASSWORD='p@ss$word'` (single quotes).

### MCP server not showing up in Claude
- **Registration**: Run `claude mcp list` to see registered servers.
- **Permissions**: Check `.claude/settings.json` has `"mcp__{server-name}__*"` in the allow list.
- **Restart**: After registration, restart Claude Code (`/exit` then `claude`) for the server to load.

### "Module not found" error
- **Virtual env**: The `claude mcp add` command must point to the venv's Python: `.claude/repos/{name}-mcp/.venv/bin/python`
- **Install**: Verify deps are installed: `.claude/repos/{name}-mcp/.venv/bin/pip list`

### S3 "AccessDenied"
- **Profile**: Verify your AWS profile works: `aws s3 ls s3://bucket-name --profile claude_code`
- **Region**: Some buckets are region-specific. Make sure `AWS_REGION` matches.
- **IAM**: Your AWS user/role needs `s3:GetObject` and `s3:ListBucket` permissions.

### DynamoDB "AccessDeniedException"
- **Profile**: Verify your AWS profile works: `aws dynamodb list-tables --profile claude_code --region us-west-2`
- **Region**: Tables are region-specific. Make sure `AWS_REGION` matches where your tables live.
- **IAM**: Your AWS user/role needs `dynamodb:ListTables`, `dynamodb:DescribeTable`, `dynamodb:Scan`, and `dynamodb:Query` permissions.
