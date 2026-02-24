# System Patterns

## Architecture Decisions

### Agent-Driven Pipeline
- Specialized subagents (planning, requirements, story generation, code scanning, memory management) orchestrated by a coordinator agent
- Each agent has a single responsibility, defined tools, and access to shared memory bank
- Human-in-the-loop at every stage — agents assist, engineers decide

### Shared Memory Bank
- Six markdown files in `memory-bank/` persist context across agents and sessions
- Every pipeline command reads memory bank before starting and updates it after completing (mandatory)
- Memory agent (haiku model) handles maintenance, conflict detection, and consolidation

### Slash Command Pipeline
- Each pipeline stage is a slash command in `.claude/commands/`
- Commands are sequential but independently runnable — squads can re-run any stage
- Commands use `$ARGUMENTS` for parameterization (PRD path, codebase path, etc.)

### Multi-Source Data Reconciliation (RTO Compliance)
- Priority-ordered reconciliation: Badge scans > Workday leave > Outlook calendar OOO > Company holidays > Manual exceptions
- Automatic compliance determination from integrated data sources; employees only interact for exceptions
- Past-date backfill supported with audit trail

## Design Patterns

### Role-Based Views
- Applications use role switcher pattern — single app, multiple persona views
- Navigation, pages, and data visibility change based on selected role
- Roles derived from PRD personas (Employee, Manager, Director/VP, HR Partner, etc.)

### Exception-Based UX
- Default to automated data collection (badge scans, calendar sync, leave system)
- Only surface UI to users when exceptions or manual intervention needed
- Reduce daily friction — employees don't check in every day

### Hierarchical Drill-Down
- Dashboard views support drill-down: Organization → Department → Team → Individual
- Org hierarchy sourced from OKTA SCIM or Microsoft Graph API (not custom-built)

## API Conventions

### External Integrations
| System | Protocol | Purpose |
|--------|----------|---------|
| OKTA | SCIM 2.0 | Org hierarchy, user provisioning |
| Microsoft Graph | REST (OAuth 2.0) | Outlook calendar OOO, org chart, Teams notifications |
| Workday | REST/RaaS/SOAP | Formal leave records (PTO, sick, FMLA) |
| Kafka | Event streaming | Async event processing, badge scan ingestion |

### Security Standards
- OAuth 2.0 / OIDC for authentication
- RBAC enforced at API layer
- PII masking in logs (no SSNs, emails, badge IDs in plain text)
- Secrets via HashiCorp Vault or Kubernetes secrets (never in code/config)

### Observability
- Structured JSON logging with correlation IDs
- Health endpoints: `/health/live`, `/health/ready`
- SLIs/SLOs defined per service

## Data Model

### Core Entities (RTO Compliance)
- **Employee** — ID, name, department, team, manager, RTO policy (default 4 days/week)
- **ComplianceRecord** — Employee + date + status (In Office / Remote-Approved / Remote-Exception / Non-Compliant / Holiday / Leave)
- **Exception** — Employee-submitted override for a specific date with reason and approval status
- **BadgeScan** — Raw badge-in/badge-out data uploaded via Excel by leadership
- **LeaveRecord** — Synced from Workday (PTO, sick, FMLA, bereavement)
- **CalendarEvent** — OOO events synced from Outlook calendar

### Reconciliation Logic
```
For each employee + date:
  1. Check badge scan data → if present, mark "In Office"
  2. Check Workday leave → if approved leave, mark "Leave" (type)
  3. Check Outlook calendar → if OOO event, mark "Remote-Approved"
  4. Check company calendar → if holiday, mark "Holiday"
  5. Check manual exceptions → if submitted + approved, mark per exception type
  6. If none of the above → mark "Non-Compliant" (pending employee action)
```
