---
name: rapid-prototyping
description: |
  Guide for generating fast, interactive UI prototypes from PRD workflows. Use this skill when creating browser-previewable prototypes for front-end facing applications.
---

# Rapid UI Prototyping

This skill enables fast creation of interactive UI prototypes that run in the browser, letting squads visualize and validate their PRD before writing detailed requirements.

## Prototype Stack

Use the lightest possible stack for maximum speed:

- **Vite** — Fast dev server with hot reload
- **React 18** + **TypeScript** — Component-based UI
- **Tailwind CSS** — Utility-first styling, no custom CSS needed
- **React Router** — Page navigation
- **Mock data** — JSON fixtures, no backend required

## Prototype Directory

All prototype code lives in `prototype/` at the project root. This is throwaway code — it exists to validate the UX, not to ship.

```
prototype/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.tsx
│   ├── components/          # Shared UI components
│   │   ├── Layout.tsx       # App shell (nav, sidebar, header)
│   │   ├── StatusBadge.tsx
│   │   └── ...
│   ├── pages/               # One page per workflow/screen
│   │   ├── Dashboard.tsx
│   │   ├── SubmitForm.tsx
│   │   └── ...
│   ├── data/                # Mock data
│   │   └── mock.ts
│   └── types/               # TypeScript types
│       └── index.ts
```

## Design Principles

### 1. One Page Per Workflow
Map each PRD workflow to a page. If the PRD has:
- "Employee submits exception" → `SubmitException.tsx`
- "Manager approves exceptions" → `ManagerDashboard.tsx`
- "Director views compliance" → `ComplianceDashboard.tsx`

### 2. Realistic Mock Data
Generate mock data that looks real:
- Use realistic names, dates, department names
- Include edge cases (pending, approved, rejected states)
- Include enough rows to show tables/lists realistically (10-20 items)
- Use the data model from the PRD to shape the mocks

### 3. Interactive, Not Static
The prototype should be clickable:
- Forms submit and show confirmation (state changes, no backend)
- Buttons toggle states (approve/reject changes the row)
- Filters actually filter the mock data
- Navigation between pages works
- Calendar views are interactive

### 4. Role-Based Views
If the PRD has multiple personas, create a role switcher in the header:
- Dropdown: "Viewing as: Employee | Manager | Director | HR Partner"
- Each role shows different nav items and pages
- This lets the squad demo all personas in one session

### 5. Visual Polish (Minimal Effort)
Use Tailwind utility classes for a clean look:
- Consistent spacing and typography
- Color coding for statuses (green=good, yellow=pending, red=alert, gray=inactive)
- Responsive layout (works on desktop and tablet)
- No custom CSS files — Tailwind only

## Component Patterns

### Data Table
```tsx
// For lists of items (submissions, team members, etc.)
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">...</thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {items.map(item => <tr key={item.id}>...</tr>)}
  </tbody>
</table>
```

### Status Badge
```tsx
const statusColors = {
  'In Office': 'bg-green-100 text-green-800',
  'Excused': 'bg-blue-100 text-blue-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Non-Compliant': 'bg-red-100 text-red-800',
};
```

### Calendar View
```tsx
// Monthly grid showing compliance status per day
// Color-coded cells: green, blue, teal, gray, yellow, red
// Clickable cells to submit exceptions
```

### Summary Cards
```tsx
// For dashboard KPIs
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card title="Compliance Rate" value="94%" trend="up" />
  <Card title="Pending Exceptions" value="12" />
  ...
</div>
```

### Form
```tsx
// For submission forms
// Use controlled components with useState
// Show success/error states after "submit"
// Pre-populate with sensible defaults
```

## What NOT to Build

- No authentication (role switcher is sufficient)
- No real API calls (everything is mock data + state)
- No database (state lives in React state/context)
- No tests (this is throwaway)
- No error boundaries or production error handling
- No accessibility audit (keep it simple)
- No CI/CD or deployment
