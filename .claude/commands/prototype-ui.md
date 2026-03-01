---
description: Generate a rapid interactive UI prototype from PRD and launch it in the browser
---

# Rapid UI Prototype

You are running the **rapid prototyping pipeline**. Your job is to generate a working, interactive React prototype from the PRD workflows and launch it in the browser for the squad to preview.

## Step 1: Gather Context
1. Read all files in `memory-bank/` for project context.
2. Read the PRD specified in the arguments, or search for one:
   - $ARGUMENTS (if a path is provided)
   - `projects/rto-compliance-ui/prd.md`
   - `projects/rto-compliance-cli/prd.md`
   - `projects/calculator-cli/prd.md`
   - `projects/infra-delivery/prd.md`
3. Read `.claude/skills/rapid-prototyping.md` for prototyping guidelines.
4. Identify from the PRD:
   - **User personas** — Each persona gets a role in the role switcher
   - **Workflows** — Each workflow becomes a page/screen
   - **Data model** — Shapes the mock data
   - **Business rules** — Inform form validation and status logic
   - **Calendar/dashboard views** — Key visual components

## Step 2: Scaffold the Prototype
Create the prototype in the `prototype/` directory at the project root.

### 2a: Initialize Project
Create `prototype/` with:
- `package.json` — React 18, Vite, TypeScript, Tailwind CSS, React Router, Lucide React (icons)
- `vite.config.ts` — Standard Vite React config
- `tsconfig.json` — Standard TypeScript config
- `tailwind.config.js` — Default Tailwind config with content paths
- `postcss.config.js` — Tailwind PostCSS plugin
- `index.html` — Entry point

### 2b: Create Shared Components
In `prototype/src/components/`:
- **Layout.tsx** — App shell with:
  - Header with app name and role switcher dropdown
  - Sidebar navigation (items change based on selected role)
  - Main content area
- **StatusBadge.tsx** — Color-coded status indicators
- **SummaryCard.tsx** — KPI cards for dashboards
- **DataTable.tsx** — Reusable sortable/filterable table
- **CalendarView.tsx** — Monthly calendar grid with color-coded days (if PRD has calendar UI)
- **Modal.tsx** — Simple modal for confirmations and forms

### 2c: Create Mock Data
In `prototype/src/data/mock.ts`:
- Generate realistic mock data based on the PRD's data model
- Include 15-20 employees across 3-4 teams
- Include realistic names, dates, departments
- Cover all status states (approved, pending, rejected, etc.)
- Include edge cases the PRD mentions

### 2d: Create Pages
In `prototype/src/pages/`, create one page per major workflow. Read the PRD to identify workflows and map each to a page. Name pages based on what the PRD describes.

**Illustrative examples** (your actual pages come from the PRD you're prototyping):

If the PRD describes a compliance tracking app with employee self-service, manager approvals, and executive dashboards:
- `EmployeeCalendar.tsx` — Employee's compliance calendar with exception submission
- `ManagerDashboard.tsx` — Manager's team view with approval workflow
- `ComplianceDashboard.tsx` — Director/VP compliance dashboards with drill-down
- `UploadData.tsx` — Data upload interface with preview
- `HRView.tsx` — HR partner's employee lookup view

If the PRD describes a real-time operational monitoring system:
- `LiveMonitor.tsx` — Real-time event/status monitoring view
- `AlertQueue.tsx` — Alert and remediation workflow
- `ShiftDashboard.tsx` — Shift-level summary dashboard
- `FacilityReports.tsx` — Facility-wide reporting and trends

The key pattern: **one page per persona-workflow combination** found in the PRD.

### 2e: Create Routes and App
- `prototype/src/routes.tsx` — Route definitions per role
- `prototype/src/App.tsx` — Role context provider, router setup
- `prototype/src/main.tsx` — Entry point

### 2f: Make It Interactive
Every page should have working interactions using React state:
- **Forms** submit and show success confirmation (update local state)
- **Approve/Reject buttons** change row status in the table
- **Filters** actually filter the displayed data
- **Role switcher** changes navigation and visible pages
- **Calendar cells** are clickable (open exception form)
- **Drill-down** works (click team → see members)
- **Upload** accepts a file and shows a mock preview (no actual parsing)

## Step 3: Install and Launch
After all files are created:

```bash
cd prototype && npm install && npm run dev
```

The dev server starts on `http://localhost:5173` (default Vite port).

Tell the squad:
- Open `http://localhost:5173` in their browser
- Use the role switcher in the header to see different persona views
- Click through the workflows — forms, approvals, dashboards are all interactive
- This is a prototype with mock data — nothing is saved, no backend

## Step 4: Update Memory Bank
1. Update `memory-bank/progress.md` — Mark prototype as created
2. Update `memory-bank/activeContext.md` — Note which screens were prototyped and any UX decisions made

## Step 5: Present to Squad
Summarize what was built:
- List of screens/pages created and which PRD workflow they represent
- Which personas are available in the role switcher
- Key interactions to try
- What's mock vs. what would be real
- Suggest: walk through each persona's workflow in the browser, note what feels right and what needs to change, then feed that back into `/refine-prd`

## Important
- **This is throwaway code.** It exists to validate the UX, not to ship. Do not over-engineer.
- **Speed over polish.** A working prototype in 10 minutes is better than a perfect one later.
- **Mock everything.** No backend, no API calls, no database. React state + mock JSON only.
- **Cover all personas.** The role switcher is critical — the squad needs to see every persona's view.
- **Make it clickable.** Static mockups are useless. Every button, form, and link should do something.

## Additional Context
$ARGUMENTS
