# Product Requirements Document

> **Project Name:** robert-cli
> **Author:** Robert Chang
> **Date:** 2026-02-27
> **Status:** Draft
> **Squad:** SC Tech Leadership

---

## 1. Product Overview

### Vision
A Python CLI tool that gives Supply Chain Tech Leadership quick, actionable visibility into their team's return-to-office (RTO) compliance by parsing weekly badge scan CSV data — replacing manual spreadsheet review with instant reports scoped to the manager's org.

### Problem Statement
Engineering Managers in SC Tech receive weekly CSV files via email containing employee badge scan data and RTO compliance status. Today, they manually open these spreadsheets, scroll through hundreds of rows, and try to identify non-compliant employees and calculate team compliance rates. This is time-consuming, error-prone, and provides no easy way to filter by team or look up individuals. Managers need a faster, repeatable way to extract compliance insights from this data.

### Target Users
| Persona | Role | Key Need |
|---------|------|----------|
| Engineering Manager | SC Tech Leadership — manages one or more squads | Quick compliance summary for their org, identify non-compliant employees |

---

## 2. Goals & Success Metrics

### Goals
1. **Eliminate manual spreadsheet review** — managers get compliance insights in seconds via CLI commands
2. **Enable targeted follow-up** — easily identify non-compliant employees in their org
3. **Zero-config after first run** — the tool remembers the manager's org so every subsequent run is instant

### Success Metrics
| Metric | Current State | Target | Measurement Method |
|--------|--------------|--------|-------------------|
| Time to get compliance summary | 10-15 min (manual spreadsheet review) | < 10 seconds (CLI command) | User feedback |
| Accuracy of compliance reporting | Manual counting, error-prone | 100% match with source CSV data | Automated tests comparing CLI output to CSV |
| Adoption by SC Tech managers | 0 (tool doesn't exist) | 5+ managers using weekly | Usage survey after 4 weeks |

---

## 3. Scope

### In Scope
- Parse weekly RTO badge scan CSV files (format: ET Org, ELG Org, Supervisory Org, Worker, Worker Type, Work Location Type, Location, On Leave, Week Range, Meets 4-Day Requirement, Total Badge Swipe, Total PTO Requested)
- **First-run org selection:** On first use, the CLI presents a list of Supervisory Orgs found in the CSV and lets the user select theirs. The selection is saved to a local config file so subsequent runs are automatically scoped.
- **Config management:** `robert-cli config` to view or change the saved Supervisory Org
- Summary report command — compliance rate, total employees, compliant vs non-compliant counts, scoped to the manager's saved org only
- Non-compliant list command — list employees in the manager's org who do not meet the 4-day requirement
- Individual employee lookup command — search by name, show their compliance status
- **Always uses the last available week** in the CSV — the week is displayed in all output so the user knows what period they're viewing
- Terminal table output (formatted, human-readable)
- CSV export option (--export flag to write results to a new CSV file)
- Python CLI using Typer with pandas for data processing

### Out of Scope
- Web UI or browser-based dashboard
- Persistent database storage — the CLI reads the CSV file each time
- Automated email or Slack notifications to non-compliant employees
- Trend analysis
- Week range filtering (always uses last available week)
- Cross-org views or roll-ups across multiple Supervisory Orgs
- Integration with badge scan source systems — the CSV is the input
- CI/CD pipelines, container builds, or Kubernetes deployment — this is a local-only tool
- Server-side deployment of any kind

### Future Considerations
- Week range filtering (--week flag to select a specific week)
- Org-level trend analysis (compliance over multiple weeks)
- Cross-org roll-up view for directors
- Pull data directly from a reporting API instead of CSV files
- Web dashboard for broader leadership access

---

## 4. User Stories (High Level)

### Engineering Manager
- As an Engineering Manager, I want the CLI to ask me to select my Supervisory Org on first run, so that all future reports are automatically scoped to my team.
- As an Engineering Manager, I want to run a summary command on the RTO CSV, so that I can instantly see my org's compliance rate and headcount breakdown.
- As an Engineering Manager, I want to list all non-compliant employees in my org, so that I can follow up with individuals who aren't meeting the 4-day requirement.
- As an Engineering Manager, I want to look up a specific employee by name, so that I can check their compliance status before a 1:1.
- As an Engineering Manager, I want to change my saved org if I move teams, so that reports reflect my current team.
- As an Engineering Manager, I want to export the non-compliant list as a CSV, so that I can share it or attach it to a report.

---

## 5. Functional Requirements

### Workflows

**Workflow 1: First-Run Org Setup**
1. Manager runs any command for the first time (e.g., `robert-cli summary data.csv`)
2. CLI detects no saved config exists
3. CLI reads the CSV, extracts unique Supervisory Org values, and presents them as a numbered list
4. Manager selects their org by number
5. CLI saves the selection to `~/.robert-cli/config.json`
6. CLI proceeds with the original command, scoped to the selected org

**Workflow 2: Generate Compliance Summary**
1. Manager runs `robert-cli summary <csv-file>`
2. CLI loads the saved org from config and filters data to that org only
3. CLI automatically selects the last available week in the CSV
4. CLI displays the week range at the top of the output, then a summary table: total employees, compliant count, non-compliant count, on-leave count, compliance rate (%)

**Workflow 3: List Non-Compliant Employees**
1. Manager runs `robert-cli non-compliant <csv-file>`
2. CLI automatically selects the last available week in the CSV
3. CLI displays the week range at the top, then a table of employees in the saved org where "Meets 4-Day Requirement" = No, showing: Worker name, Work Location Type, Total Badge Swipe, On Leave status
4. Optional: `--export results.csv` writes the list to a CSV file

**Workflow 4: Look Up Individual Employee**
1. Manager runs `robert-cli lookup <csv-file> "Employee Name"`
2. CLI searches across all orgs (case-insensitive partial match) — lookup is not scoped to saved org
3. CLI automatically selects the last available week in the CSV
4. Displays the week range at the top, then all records for that employee: Supervisory Org, badge swipes, compliance status, PTO, on-leave flag

**Workflow 5: Manage Config**
1. `robert-cli config` — displays the currently saved Supervisory Org
2. `robert-cli config --reset` — clears the saved org, triggering re-selection on next run

### Business Rules
- **4-Day Requirement:** An employee "meets" the requirement if `Meets 4-Day Requirement` = "Yes" in the CSV. The CLI does not recalculate this — it uses the value from the CSV.
- **On Leave Exclusion:** Employees where `On Leave` = "true" should be flagged but counted separately — they are neither compliant nor non-compliant.
- **Contingent Workers:** Include Contingent Workers in all reports. They follow the same compliance rules.
- **Compliance Rate Calculation:** `(Compliant employees / Total eligible employees) * 100`. Eligible = Total - On Leave.
- **Last Available Week:** All commands automatically use the most recent week found in the CSV (determined by the latest `Week Range` value). The week is displayed in every output so the user always knows what period they're viewing.
- **Org Scoping:** The `summary` and `non-compliant` commands always use the saved Supervisory Org. There is no option to view other orgs.
- **Config Persistence:** The saved org config persists at `~/.robert-cli/config.json`. If the config file is missing or corrupted, the CLI triggers the org selection flow.
- **Lookup is global:** The `lookup` command searches across all orgs regardless of saved config, since a manager may need to look up someone outside their team.

### Data Requirements
- **Input:** CSV file in the exact format described above (12 columns)
- **Source:** Emailed to managers weekly, saved locally
- **Validation:** CLI must validate the CSV has the expected columns and report errors if the format is unexpected
- **Config:** Saved to `~/.robert-cli/config.json` — contains the selected Supervisory Org name
- **No persistent storage beyond config:** All data processing is done in-memory from the CSV each time

---

## 6. Non-Functional Requirements

### Security
- **PII Handling:** The CSV contains employee names (PII). The CLI processes data locally — no data is transmitted over the network. No PII is logged to files.
- **No Authentication Required:** This is a local CLI tool — no network authentication needed.
- **File Access:** CLI only reads the CSV file specified by the user and the config file at `~/.robert-cli/config.json`.

### Performance
- CLI must process a 600-row CSV and display results in under 2 seconds
- CLI must handle CSV files up to 10,000 rows without performance degradation (under 5 seconds)

### Observability
- CLI displays clear error messages for invalid CSV files, missing columns, or bad input
- `--verbose` flag for debug output showing how many rows were parsed, filtered, etc.
- Version command: `robert-cli --version`

---

## 7. Technical Constraints

### Existing Systems
- **Email (CSV Source):** The CSV is delivered via email. The CLI does not integrate with email — the user must save the file locally first.
- **No downstream systems:** This is a standalone read-only tool.

### Tech Stack
- **Language:** Python 3.10+
- **CLI Framework:** Typer
- **Data Processing:** pandas
- **Table Output:** rich (for terminal tables)
- **CSV Export:** pandas to_csv
- **Config Storage:** JSON file at `~/.robert-cli/config.json`
- **Packaging:** pip-installable package (pyproject.toml)
- **Testing:** pytest

### Infrastructure
- **Local only** — installed and run on the manager's laptop
- **Installation:** `pip install .` from the repo, or `pip install -e .` for development
- **No server, no containers, no cloud deployment**

---

## 8. Dependencies & Risks

### Dependencies
| Dependency | Owner | Status | Impact if Delayed |
|-----------|-------|--------|-------------------|
| CSV format stability | HR / People Analytics team | Assumed stable | Column changes would break parsing — need format validation |
| Python 3.10+ on user machines | Individual managers | Available | Managers may need help installing Python |

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CSV format changes without notice | Medium | High | Validate columns on load, clear error message if format changes |
| Employee names in CSV are inconsistent | Low | Medium | Use case-insensitive partial matching for lookups |
| Managers unfamiliar with CLI tools | Medium | Medium | Provide clear README with examples, add `--help` with examples |

---

## 9. Timeline & Milestones

| Milestone | Target Date | Description |
|-----------|------------|-------------|
| MVP: summary + non-compliant + config | Sprint 1 | Core commands with org config, auto last-week selection |
| Lookup + CSV export + polish | Sprint 2 | Individual lookup, export flag, error handling, packaging |

---

## 10. Open Questions

| # | Question | Owner | Status | Answer |
|---|----------|-------|--------|--------|
| 1 | Are there multiple CSV formats (different reports) or is this the only one? | Squad | Open | — |
| 2 | Should the tool support multiple CSV files at once (e.g., merging weeks)? | Squad | Open | — |
| 3 | Is there a standard Python version / virtual env setup managers already use? | Squad | Open | — |
| 4 | Should on-leave employees appear in the non-compliant list with a flag, or be excluded entirely? | Squad | Open | — |
| 5 | Are there any additional compliance rules beyond the 4-day requirement (e.g., minimum hours)? | Squad | Open | — |
