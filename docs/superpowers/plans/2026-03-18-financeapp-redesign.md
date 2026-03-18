# FinanceApp "Desert Dusk" Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform financeapp from a generic light Tailwind app into a warm dark-themed "Desert Dusk" design, add a Budget planner page, upgrade the period selector on Dashboard/Expenses, and make expense categories dynamic (DB-driven with custom keywords).

**Architecture:** Incremental reskin + feature addition. The design system (CSS variables + fonts) is laid down first, then shared components are restyled, then each page is updated. New features (PeriodSelector, CategoryWidgets, Budget page) are built after the foundation is in place. No routing changes — stays as tab-based SPA.

**Tech Stack:** React 18, Vite, Tailwind CSS 3.4, Supabase (anon RLS), DM Sans (Google Fonts), Geist Mono (npm package)

**Spec:** `docs/superpowers/specs/2026-03-18-financeapp-redesign-design.md`

---

## Task 1: Design System Foundation — Fonts, CSS Variables, Tailwind Config

**Files:**
- Modify: `financeapp/index.html`
- Modify: `financeapp/src/index.css`
- Modify: `financeapp/tailwind.config.js`

- [ ] **Step 1: Install Geist font package**

Run from `financeapp/`:
```bash
npm install geist
```

- [ ] **Step 2: Add DM Sans to index.html**

Add Google Fonts link in `<head>` of `financeapp/index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Rewrite index.css with CSS variables and animations**

Replace the entire contents of `financeapp/src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import 'geist/font/mono';

:root {
  --bg-base: #171412;
  --bg-card: #221e1a;
  --bg-card-hover: #2a2520;
  --bg-input: #1e1a16;
  --border: #2e2822;
  --border-focus: #c47a5a;
  --accent: #c47a5a;
  --accent-hover: #d48a6a;
  --highlight: #d4a574;
  --positive: #7a8c6e;
  --warning: #c9a040;
  --danger: #b06060;
  --text-primary: #e8e0d4;
  --text-secondary: #9a8e80;
  --text-muted: #6b6058;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'Geist Mono', monospace;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: var(--bg-base);
  font-family: var(--font-body);
  color: var(--text-primary);
}

/* Toast fade-in */
@keyframes fade-in {
  from { opacity: 0; transform: translate(-50%, -8px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

/* Stagger-in for page cards */
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.stagger-in > * {
  opacity: 0;
  animation: stagger-in 0.2s ease-out forwards;
}
.stagger-in > *:nth-child(1) { animation-delay: 0ms; }
.stagger-in > *:nth-child(2) { animation-delay: 50ms; }
.stagger-in > *:nth-child(3) { animation-delay: 100ms; }
.stagger-in > *:nth-child(4) { animation-delay: 150ms; }
.stagger-in > *:nth-child(5) { animation-delay: 200ms; }
.stagger-in > *:nth-child(6) { animation-delay: 250ms; }
.stagger-in > *:nth-child(7) { animation-delay: 300ms; }
.stagger-in > *:nth-child(8) { animation-delay: 350ms; }

/* Category widget tap pulse */
@keyframes tap-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(0.97); }
  100% { transform: scale(1); }
}
.animate-tap {
  animation: tap-pulse 0.15s ease-out;
}

/* Smooth expand/collapse */
.expand-transition {
  transition: max-height 0.2s ease-out, opacity 0.2s ease-out;
  overflow: hidden;
}

/* Progress bar animate */
.progress-animate {
  transition: width 0.3s ease-out;
}

/* Modal slide up */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(100%); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.25s ease-out;
}

@keyframes fade-backdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-backdrop {
  animation: fade-backdrop 0.25s ease-out;
}
```

- [ ] **Step 4: Update tailwind.config.js**

Replace `financeapp/tailwind.config.js` with:
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        input: 'var(--bg-input)',
        border: 'var(--border)',
        'border-focus': 'var(--border-focus)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        highlight: 'var(--highlight)',
        positive: 'var(--positive)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        body: ['DM Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Verify dev server starts**

Run from `financeapp/`:
```bash
npm run dev
```
Expected: Dev server starts. The app should now have a dark background with warm off-white text. It will look broken (white cards on dark bg) — that's expected, we'll fix components next.

- [ ] **Step 6: Commit**

```bash
git add financeapp/index.html financeapp/src/index.css financeapp/tailwind.config.js financeapp/package.json financeapp/package-lock.json
git commit -m "feat: add Desert Dusk design system — CSS variables, fonts, animations"
git push
```

---

## Task 2: Restyle Shared Components — TopBar, BottomNav, Modal, Toast, EmptyState, ErrorBanner

**Files:**
- Modify: `financeapp/src/components/layout/TopBar.jsx`
- Modify: `financeapp/src/components/layout/BottomNav.jsx`
- Modify: `financeapp/src/components/shared/Modal.jsx`
- Modify: `financeapp/src/components/shared/Toast.jsx`
- Modify: `financeapp/src/components/shared/EmptyState.jsx`
- Modify: `financeapp/src/components/shared/ErrorBanner.jsx`
- Modify: `financeapp/src/components/shared/ImageUpload.jsx`
- Modify: `financeapp/src/App.jsx`

- [ ] **Step 1: Restyle TopBar.jsx**

Replace the TopBar component. Remove the 💰 emoji. Use dark background, terracotta dot, DM Sans title. The `title` prop must be passed from App.jsx.

Current: white bg, gray border, emoji icon
New: `--bg-base` bg, no border, small terracotta dot (`w-2 h-2 rounded-full bg-accent`) before the title, `text-text-primary font-medium text-lg`

- [ ] **Step 2: Restyle BottomNav.jsx**

Replace emoji icons with inline SVG line icons. Add the Budget tab. Update to 7 tabs with abbreviated labels.

New tabs array:
```javascript
const tabs = [
  { id: 'dashboard', label: 'Home', icon: /* house SVG */ },
  { id: 'expenses', label: 'Spend', icon: /* wallet SVG */ },
  { id: 'budget', label: 'Budget', icon: /* pie-chart SVG */ },
  { id: 'loans', label: 'Loans', icon: /* bank SVG */ },
  { id: 'subscriptions', label: 'Subs', icon: /* refresh SVG */ },
  { id: 'vitamins', label: 'Vits', icon: /* pill SVG */ },
  { id: 'settings', label: 'Settings', icon: /* gear SVG */ },
]
```

Styling: `bg-card` background, `border-t border-border`, active icon/label `text-accent`, inactive `text-text-muted`. Each SVG icon is 20px, label is `text-[10px]`.

Use simple inline SVGs — draw minimal line-art icons with `<svg>` elements using `stroke="currentColor"` and `strokeWidth={1.5}`, `fill="none"`, `viewBox="0 0 24 24"`, sized at `w-5 h-5`. Reference Heroicons outline style for the path data (house, wallet, chart-pie, building-library, arrow-path, capsule-shaped pill, cog-6-tooth). Do NOT install an icon library — just inline the SVG paths directly.

- [ ] **Step 3: Restyle Modal.jsx**

Change backdrop to `bg-black/60 animate-backdrop`, modal surface to `bg-card border border-border`, title to `text-text-primary`, close button to `text-text-muted hover:text-text-primary`. Add `animate-slide-up` class to the modal panel.

- [ ] **Step 4: Restyle Toast.jsx**

Change from `bg-gray-800 text-white` to `bg-card border border-border text-text-primary`. Keep `animate-fade-in`.

- [ ] **Step 5: Restyle EmptyState.jsx**

Change message color to `text-text-muted`, subtitle to `text-text-muted`. Keep emoji icon.

- [ ] **Step 6: Restyle ErrorBanner.jsx**

Read the current file first. Change background to `bg-danger/10 border border-danger/20`, text to `text-danger`.

- [ ] **Step 7: Restyle ImageUpload.jsx**

Read the current file first. Restyle upload area: `border-border border-dashed` bg `bg-input`, text `text-text-secondary`, button `bg-accent text-base`.

- [ ] **Step 8: Update App.jsx — add Budget tab, conditional rendering**

1. Add `'budget'` to the PAGE_TITLES object: `budget: 'Monthly Budget'`
2. Import Budget page (placeholder for now — create a minimal `Budget.jsx` that just renders the title)
3. Replace `TabPanel` display:none/block with conditional rendering: `{active === 'dashboard' && <Dashboard ... />}`
4. Wrap each page's container in `<div className="stagger-in">` for entry animation
5. Update main area bg to transparent (body handles the dark bg now)
6. Change `bg-gray-50` classes to nothing (body bg handles it)

- [ ] **Step 9: Create minimal Budget.jsx placeholder**

Create `financeapp/src/pages/Budget.jsx`:
```jsx
import EmptyState from '../components/shared/EmptyState'

export default function Budget() {
  return (
    <div className="stagger-in space-y-4">
      <EmptyState icon="📊" message="Budget planner coming soon" sub="Plan your monthly allowance" />
    </div>
  )
}
```

- [ ] **Step 10: Verify all tabs render with dark theme**

Run `npm run dev`, click through all 7 tabs. Verify:
- Dark background everywhere
- Bottom nav shows 7 tabs with SVG icons
- Top bar has terracotta dot + title
- Modals are dark-themed
- Toast is dark-themed
- Tab switch shows stagger animation

- [ ] **Step 11: Commit**

```bash
git add financeapp/src/components/ financeapp/src/App.jsx financeapp/src/pages/Budget.jsx
git commit -m "feat: restyle shared components and layout for Desert Dusk theme"
git push
```

---

## Task 3: Restyle Pages — Settings, Loans, Subscriptions, Vitamins

These pages get a visual restyle only — no feature changes.

**Files:**
- Modify: `financeapp/src/pages/Settings.jsx`
- Modify: `financeapp/src/pages/Loans.jsx`
- Modify: `financeapp/src/pages/Subscriptions.jsx`
- Modify: `financeapp/src/pages/Vitamins.jsx`
- Modify: `financeapp/src/components/loans/LoanCard.jsx`
- Modify: `financeapp/src/components/loans/LoanForm.jsx`
- Modify: `financeapp/src/components/loans/AmortizationTable.jsx`
- Modify: `financeapp/src/components/subscriptions/SubscriptionForm.jsx`
- Modify: `financeapp/src/components/subscriptions/SubscriptionList.jsx`
- Modify: `financeapp/src/components/vitamins/VitaminForm.jsx`
- Modify: `financeapp/src/components/vitamins/VitaminList.jsx`

- [ ] **Step 1: Restyle Settings.jsx**

Read current file. Apply dark theme:
- Cards: `bg-card border border-border rounded-xl`
- Labels: `text-text-secondary text-sm font-medium`
- Inputs: `bg-input border border-border text-text-primary rounded-lg focus:border-border-focus focus:ring-1 focus:ring-border-focus`
- Select: same as input
- Save button: `bg-accent text-base rounded-lg font-medium`
- Code block: `bg-base font-mono text-text-secondary`
- Remove all `bg-white`, `bg-gray-*`, `text-gray-*` classes

- [ ] **Step 2: Restyle Loans.jsx + LoanCard.jsx + LoanForm.jsx + AmortizationTable.jsx**

Read each file first. Apply dark theme:
- LoanCard: `bg-card border border-border rounded-xl`. Progress bar: `bg-base` track, `bg-accent` fill with `progress-animate` class. Interest text: `text-danger`. Type badge: `bg-base border border-border text-text-secondary rounded-full text-xs px-2 py-0.5`.
- LoanForm: dark inputs (same pattern as Settings), buttons: primary `bg-accent`, cancel `border border-border text-text-secondary`
- AmortizationTable: `bg-card` table, `border-border` borders, `text-text-primary` body, `text-text-secondary` headers, amounts in `font-mono text-highlight`
- Remove all light-theme Tailwind classes

- [ ] **Step 3: Restyle Subscriptions.jsx + SubscriptionForm.jsx + SubscriptionList.jsx**

Read each file first. Apply dark theme:
- Monthly cost card: `bg-accent/10 border border-accent/20 text-accent`
- SubscriptionList cards: `bg-card border border-border rounded-xl`
- Due badges: overdue/≤3d `bg-danger/10 text-danger`, 4-7d `bg-warning/10 text-warning`, >7d `text-text-muted`
- "Paid" button: `border border-positive text-positive`
- SubscriptionForm: dark inputs, dark selects
- Remove all light-theme classes

- [ ] **Step 4: Restyle Vitamins.jsx + VitaminForm.jsx + VitaminList.jsx**

Read each file first. Apply dark theme:
- Total spent card: `bg-positive/10 border border-positive/20 text-positive`
- VitaminList cards: `bg-card border border-border rounded-xl`
- Restock badges: overdue/today `bg-danger/10 text-danger`, ≤7d `bg-warning/10 text-warning`, ≤14d `bg-highlight/10 text-highlight`, >14d `text-positive`
- "Rebuy" button: `bg-accent text-base rounded-lg`
- VitaminForm: dark inputs
- Remove all light-theme classes

- [ ] **Step 5: Verify all 4 pages look correct**

Run `npm run dev`. Check each page: Settings, Loans, Subscriptions, Vitamins. All should be fully dark-themed with no white/light remnants.

- [ ] **Step 6: Commit**

```bash
git add financeapp/src/pages/ financeapp/src/components/loans/ financeapp/src/components/subscriptions/ financeapp/src/components/vitamins/
git commit -m "feat: restyle Settings, Loans, Subscriptions, Vitamins for Desert Dusk"
git push
```

---

## Task 4: PeriodSelector Shared Component

**Files:**
- Create: `financeapp/src/components/shared/PeriodSelector.jsx`

- [ ] **Step 1: Build PeriodSelector component**

This component provides Day/Week/Month toggle with contextual date navigation. It is reused by Dashboard and Expenses.

Props:
- `period` — `'day' | 'week' | 'month'`
- `onPeriodChange` — callback when period toggle changes
- `selectedDate` — a JS Date representing the current focus date
- `onDateChange` — callback when date navigates (left/right arrows or month dropdown)

Output: the component computes and exposes the date range via a `getDateRange(period, selectedDate)` helper exported from the same file.

```jsx
// Component renders:
// 1. Three toggle buttons: Day | Week | Month
//    Active: text-accent with underline, inactive: bg-card text-text-muted
// 2. Below the toggle, a contextual picker:
//    - Month mode: dropdown of months (last 24 months)
//    - Week mode: "Mar 10-16" label with < > arrow buttons
//    - Day mode: "Mar 18" label with < > arrow buttons

// getDateRange(period, date) returns { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
```

Styling: All dark theme. Toggle buttons in a `flex gap-1` row with `rounded-lg px-3 py-1.5 text-sm font-medium` each. Arrow buttons: `text-text-muted hover:text-text-primary`. Date label: `text-text-primary font-medium`.

- [ ] **Step 2: Verify component renders in isolation**

Temporarily import into Budget.jsx placeholder to test. Toggle between Day/Week/Month, navigate dates. Verify styling and behavior.

- [ ] **Step 3: Commit**

```bash
git add financeapp/src/components/shared/PeriodSelector.jsx
git commit -m "feat: add PeriodSelector shared component"
git push
```

---

## Task 5: Dashboard Redesign — PeriodSelector + Budget Widget + Dark Restyle

**Files:**
- Modify: `financeapp/src/pages/Dashboard.jsx`

**Note:** This task uses `useCategories` (updated in Task 6) and `useBudgets` (created in Task 7). Since those don't exist yet, this task uses stubs. The stubs are replaced with real hooks in Task 9.

**Note on conditional rendering (Task 2):** The switch from `display: none/block` to conditional rendering means pages unmount on tab switch and re-fetch from Supabase each time. This is intentional — it enables CSS entry animations and keeps data fresh. The tradeoff (extra fetches) is acceptable for this app's scale.

- [ ] **Step 1: Read the current Dashboard.jsx**

Read `financeapp/src/pages/Dashboard.jsx` fully to understand the current period toggle, expenditure overview, debt section, bills section, and vitamins section.

- [ ] **Step 2: Replace period toggle with PeriodSelector**

Remove the existing inline period toggle (the `PERIODS` array and toggle buttons). Import and use `PeriodSelector` instead. Wire `period`/`onPeriodChange`/`selectedDate`/`onDateChange` state. Use `getDateRange` to compute the filter for `useExpenses`.

- [ ] **Step 3: Add Budget Summary Widget with stub**

At the top of Dashboard.jsx, add a temporary stub for budget data:
```javascript
// TODO: Replace with useBudgets hook in Task 9
function useBudgetsStub() {
  return { budget: null, items: [], loading: false, error: null }
}
```

After the Expenditure Overview card, add a new Budget Summary card:
- Call `useBudgetsStub()` to get budget data
- Show: "Budget: $spent / $total" with a horizontal progress bar
- Bar: `bg-base` track, fill color shifts: `bg-positive` when <80%, `bg-warning` at 80-100%, `bg-danger` when >100%
- Use `progress-animate` class on the fill
- If `budget` is null, show "No budget set" in `text-text-muted`

Also add a temporary stub for category colors:
```javascript
// TODO: Replace with useCategories colorMap in Task 9
// For now, use inline hardcoded hex colors for category dots
const TEMP_CATEGORY_COLORS = {
  Food: '#c47a5a', Transport: '#5a7a94', Shopping: '#94707a',
  Entertainment: '#7a6a94', Health: '#7a8c6e', Education: '#c9a040',
  Utilities: '#6b6058', Groceries: '#8c946e', Travel: '#5a8c8c', Other: '#9a8e80',
}
```
Use these for category dot colors and progress bar fills via inline `style={{ backgroundColor: TEMP_CATEGORY_COLORS[name] }}`.

- [ ] **Step 4: Add opacity transition for dashboard totals**

On the big spend total and debt total elements, add `transition-opacity duration-150` so values fade smoothly when the period changes and new data loads.

- [ ] **Step 5: Restyle all Dashboard sections for dark theme**

Go through every element:
- All cards: `bg-card border border-border rounded-xl p-4`
- Big spend total: `text-3xl font-mono text-highlight`
- Category dots: keep colored dots, change text to `text-text-primary` (name) and `font-mono text-highlight` (amount)
- Category progress bars: use each category's `color_hex` for the fill
- Debt amount: `text-2xl font-mono text-danger`
- Bills section: dark cards, due badges use `text-danger`/`text-warning`/`text-text-muted`
- Vitamins section: restock badges use `text-danger`/`text-warning`/`text-positive`
- Expandable chevrons: `text-text-muted`
- Remove ALL light-theme classes (`bg-white`, `bg-gray-*`, `text-gray-*`, `bg-blue-*`, etc.)

- [ ] **Step 6: Wrap Dashboard content in stagger-in**

Ensure the page's root div has `className="stagger-in space-y-4"` so cards animate in on tab switch.

- [ ] **Step 7: Verify Dashboard**

Run `npm run dev`. Check:
- PeriodSelector toggles work (Day/Week/Month)
- Date navigation works (arrows, month dropdown)
- All sections are dark themed
- Amounts show in Geist Mono
- Totals fade smoothly on period change
- Cards stagger in on tab switch
- Budget widget shows "No budget set" (stub)

- [ ] **Step 8: Commit**

```bash
git add financeapp/src/pages/Dashboard.jsx
git commit -m "feat: redesign Dashboard with PeriodSelector, budget widget, dark theme"
git push
```

---

## Task 6: Dynamic Categories — Supabase Migration + Update useCategories Hook

**Files:**
- Modify: `financeapp/src/hooks/useCategories.js`

- [ ] **Step 1: Run Supabase migration for color_hex column**

In the Supabase dashboard SQL editor (or via Supabase CLI), run:
```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color_hex text DEFAULT '#9a8e80';
```

Verify: In Supabase Table Editor, the `categories` table should now have a `color_hex` column.

- [ ] **Step 2: Read current useCategories.js**

Read `financeapp/src/hooks/useCategories.js` to understand existing structure.

- [ ] **Step 3: Add color_hex support to colorMap**

Update the `colorMap` builder to also include `color_hex`:
```javascript
const colorMap = {}
for (const cat of categories) {
  colorMap[cat.name] = {
    bg: cat.color_bg,
    text: cat.color_text,
    hex: cat.color_hex || '#9a8e80',
  }
}
```

Update the return value so consumers can use `colorMap[name].bg`, `.text`, `.hex`.

**Note:** This changes the colorMap shape from a string to an object. All consumers must be updated (Dashboard category dots, ExpenseList badges, etc.). Update them in subsequent tasks when restyling those components.

- [ ] **Step 4: Add cascade rename on updateCategory**

In the `updateCategory` function, after updating the category row, if `data.name` is provided (meaning the name changed), also update:
```javascript
if (data.name) {
  const oldName = categories.find(c => c.id === id)?.name
  if (oldName && oldName !== data.name) {
    await supabase.from('expenses').update({ category: data.name }).eq('category', oldName)
    await supabase.from('budget_items').update({ linked_expense_category: data.name }).eq('linked_expense_category', oldName)
  }
}
```

- [ ] **Step 5: Add seed logic**

After the initial fetch, if `data` is empty (length 0), insert the 10 default categories with full keyword lists. Use the complete keyword lists from the spec (Section 7, Migration table). Include `color_bg`, `color_text`, `color_hex`, `keywords`, `sort_order` for each.

```javascript
const DEFAULT_CATEGORIES = [
  { name: 'Food', color_bg: 'bg-orange-100', color_text: 'text-orange-700', color_hex: '#c47a5a', sort_order: 1, keywords: ['lunch','dinner','breakfast','hawker','makan','coffee','tea','snack','supper','brunch','grab','foodpanda','deliveroo','mcdonalds','kfc','bubble','boba','rice','noodle','noodles'] },
  { name: 'Transport', color_bg: 'bg-blue-100', color_text: 'text-blue-700', color_hex: '#5a7a94', sort_order: 2, keywords: ['mrt','bus','taxi','fuel','petrol','parking','ezlink','uber','toll','train'] },
  // ... all 10 categories with full keyword lists
]
```

After seeding, refetch.

- [ ] **Step 6: Verify categories load from DB**

Run `npm run dev`. Check the Expenses page — categories should load from Supabase. If the table is empty, seeds should auto-populate.

- [ ] **Step 7: Commit**

```bash
git add financeapp/src/hooks/useCategories.js
git commit -m "feat: update useCategories with color_hex, cascade rename, seed logic"
git push
```

---

## Task 7: Budget Planner — Supabase Tables + useBudgets Hook + Budget Page

**Files:**
- Create: `financeapp/src/hooks/useBudgets.js`
- Create: `financeapp/src/components/budget/BudgetForm.jsx`
- Create: `financeapp/src/components/budget/BudgetProgress.jsx`
- Modify: `financeapp/src/pages/Budget.jsx`

- [ ] **Step 1: Run Supabase migration for budgets and budget_items tables**

In the Supabase dashboard SQL editor, run:
```sql
-- Monthly budget header
create table budgets (
  id uuid default gen_random_uuid() primary key,
  month text not null,
  total_allowance numeric not null default 0,
  created_at timestamp with time zone default now(),
  unique(month)
);
alter table budgets enable row level security;
create policy "Allow all for anon" on budgets for all using (true) with check (true);

-- Budget line items
create table budget_items (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references budgets(id) on delete cascade,
  category_name text not null,
  allocated_amount numeric not null default 0,
  linked_expense_category text,
  created_at timestamp with time zone default now()
);
alter table budget_items enable row level security;
create policy "Allow all for anon" on budget_items for all using (true) with check (true);
```

Verify: In Supabase Table Editor, both `budgets` and `budget_items` tables should appear.

- [ ] **Step 2: Create useBudgets hook**

```javascript
// useBudgets(month) — month is 'YYYY-MM' string
// Fetches the budget row + budget_items for that month
// Returns: { budget, items, loading, error,
//            createBudget(totalAllowance),
//            updateAllowance(budgetId, amount),
//            addItem({ category_name, allocated_amount, linked_expense_category }),
//            updateItem(itemId, data),
//            deleteItem(itemId),
//            refetch }
```

- `createBudget` inserts into `budgets` table with the month and total_allowance
- `addItem` inserts into `budget_items` with the budget_id
- All mutations refetch after completion

- [ ] **Step 3: Create BudgetProgress component**

```jsx
// Props: { allocated, spent, label }
// Renders: a label row (category name, spent/allocated) + progress bar
// Progress bar: bg-base track, fill uses progress-animate class
// Color: spent/allocated < 0.8 → bg-positive, < 1.0 → bg-warning, >= 1.0 → bg-danger
// If spent is null (unlinked), show "—" instead of progress bar
```

- [ ] **Step 4: Create BudgetForm component**

```jsx
// Props: { onSubmit, onCancel, categoryNames }
// Inline form for adding a budget item:
// - Text input: budget category name (free text)
// - Number input: allocated amount
// - Select dropdown: link to expense category (optional, from categoryNames)
// Styled with dark theme inputs
```

- [ ] **Step 5: Build full Budget.jsx page**

```jsx
// Structure:
// 1. Month selector dropdown (same as PeriodSelector month mode — or simpler standalone)
// 2. Total Allowance: large editable amount (tap to edit, click away to save)
//    - Font: font-mono text-highlight text-3xl
//    - If no budget exists for month, show "Set your budget" prompt
// 3. Budget items list: map over items, render BudgetProgress for each
//    - Each row also has edit (tap) and delete (x) actions
//    - For linked items, calculate actual spend by summing expenses for that category+month
// 4. Add button: "+" at bottom, shows BudgetForm inline
// 5. Summary footer: sticky bar showing Allocated/Total | Spent/Allocated
//    - positioned sticky bottom-[72px] z-30
// 6. Empty state: EmptyState component when no budget exists
// 7. Error state: ErrorBanner component on fetch error
```

To calculate actual spend for linked items, the Budget page needs expense data. Import `useExpenses({ month })` to get `totalByCategory`.

- [ ] **Step 6: Verify Budget page**

Run `npm run dev`, navigate to Budget tab:
- Create a new budget for the current month
- Set total allowance
- Add budget items (some linked to expense categories, some not)
- Verify progress bars show correct colors
- Verify summary footer appears
- Verify empty state shows when no budget exists

- [ ] **Step 7: Commit**

```bash
git add financeapp/src/hooks/useBudgets.js financeapp/src/components/budget/ financeapp/src/pages/Budget.jsx
git commit -m "feat: add Budget planner page with useBudgets hook"
git push
```

---

## Task 8: Expenses Page — CategoryWidgets, CategoryManager, PeriodSelector, Dark Restyle

**Files:**
- Create: `financeapp/src/components/expenses/CategoryWidgets.jsx`
- Create: `financeapp/src/components/expenses/CategoryManager.jsx`
- Modify: `financeapp/src/pages/Expenses.jsx`
- Modify: `financeapp/src/components/expenses/ExpenseForm.jsx`
- Modify: `financeapp/src/components/expenses/ExpenseList.jsx`
- Modify: `financeapp/src/components/expenses/QuickAddBar.jsx`

**Note:** `useExpenses.js` does NOT need modification — it already supports `startDate`/`endDate`, `month`, and `category` filters. The PeriodSelector's `getDateRange` output maps directly to the existing filter interface.

- [ ] **Step 1: Create CategoryWidgets component**

```jsx
// Props: { categories, expenses, selectedCategory, onSelect, onManageClick }
// Renders a 3-column grid of compact cards
// First card: "All" showing total spend (font-mono text-highlight)
// Each category card:
//   - 3px top border using category's color_hex (inline style)
//   - Category name (text-sm text-text-primary)
//   - Spend amount (font-mono text-sm text-highlight)
//   - On tap: calls onSelect(categoryName), card gets border-accent
//   - Tap again on same: calls onSelect(null) to deselect
//   - Tap animation: animate-tap class
// Top-right of grid section: small gear icon (SVG) that calls onManageClick
```

- [ ] **Step 2: Create CategoryManager component**

```jsx
// Props: { categories, onAdd, onUpdate, onDelete }
// Inline panel that slides down (use expand-transition class)
// Shows:
// 1. List of categories: each shows name, color dot (color_hex), delete (x) button
// 2. "Add category" row: text input + color picker (10 preset muted hex colors) + add button
//    Preset colors: ['#c47a5a','#5a7a94','#94707a','#7a6a94','#7a8c6e','#c9a040','#6b6058','#8c946e','#5a8c8c','#9a8e80']
// 3. "Manage Keywords" toggle per category:
//    - Shows current keywords as removable pills (bg-base border border-border text-text-secondary text-xs px-2 py-0.5 rounded-full)
//    - Text input to add new keyword (press Enter to add)
//    - Adding/removing calls onUpdate(id, { keywords: [...] })
```

- [ ] **Step 3: Update ExpenseForm.jsx — remove hardcoded CATEGORIES**

Remove the `export const CATEGORIES = [...]` array. Accept a `categories` prop instead (list of category name strings). Update the category `<select>` to use the prop.

- [ ] **Step 4: Update QuickAddBar.jsx — use dynamic keywords**

Remove the hardcoded `KEYWORD_MAP` object and `import { CATEGORIES } from './ExpenseForm'`. Accept `keywordMap` and `categoryNames` as props. Use them in the `parse` function instead of the hardcoded values. Update the keyword guide section to render dynamically from the categories and their keywords.

- [ ] **Step 5: Update ExpenseList.jsx — dark restyle**

Read current file. Apply dark theme:
- Expense cards: `bg-card border border-border rounded-xl`
- Category badges: use `colorMap[category].bg` and `colorMap[category].text` (Tailwind classes from the object shape)
- Amounts: `font-mono text-highlight`
- Delete button: `text-text-muted hover:text-danger`
- Date/notes: `text-text-secondary`
- Receipt thumbnails: `border border-border rounded-lg`

- [ ] **Step 6: Rewrite Expenses.jsx**

Read current file. Rewrite to:
1. Import `useCategories` hook — get `categories`, `categoryNames`, `keywordMap`, `colorMap`, `addCategory`, `updateCategory`, `deleteCategory`
2. Replace month dropdown with `PeriodSelector` component
3. Replace category filter chips with `CategoryWidgets` component
4. Add state for `showManager` toggle
5. Show `CategoryManager` when `showManager` is true
6. Pass `keywordMap` and `categoryNames` to `QuickAddBar`
7. Pass `categories` (as names list) to `ExpenseForm`
8. Pass `colorMap` to `ExpenseList`
9. Dark-restyle all remaining elements (header, "add with full form" button, etc.)
10. Wrap content in `stagger-in`

- [ ] **Step 7: Verify Expenses page**

Run `npm run dev`. Check:
- PeriodSelector works (Day/Week/Month with date navigation)
- Category widgets show in 3-column grid with spend amounts
- Tapping a widget filters the expense list
- Gear icon opens CategoryManager
- Can add/delete categories
- Can add/remove keywords
- QuickAddBar uses dynamic keywords
- ExpenseForm shows dynamic category list
- All dark themed

- [ ] **Step 8: Commit**

```bash
git add financeapp/src/components/expenses/ financeapp/src/pages/Expenses.jsx
git commit -m "feat: redesign Expenses with CategoryWidgets, CategoryManager, PeriodSelector"
git push
```

---

## Task 9: Wire Dashboard to Real Hooks — Replace Stubs

**Files:**
- Modify: `financeapp/src/pages/Dashboard.jsx`

This task replaces the two stubs added in Task 5 (`useBudgetsStub` and `TEMP_CATEGORY_COLORS`) with real hooks.

- [ ] **Step 1: Replace useBudgetsStub with real useBudgets hook**

1. Remove the `useBudgetsStub` function from Dashboard.jsx
2. Import `useBudgets` from `'../hooks/useBudgets'`
3. Call `useBudgets(currentMonth)` where `currentMonth` is derived from the selected date in PeriodSelector (format: `'YYYY-MM'`)
4. Wire the Budget Summary Widget to real data: `budget.total_allowance` for total, sum of expenses for spent

- [ ] **Step 2: Replace TEMP_CATEGORY_COLORS with useCategories colorMap**

1. Remove the `TEMP_CATEGORY_COLORS` object from Dashboard.jsx
2. Import `useCategories` from `'../hooks/useCategories'`
3. Call `useCategories()` to get `colorMap`
4. Replace all `TEMP_CATEGORY_COLORS[name]` references with `colorMap[name]?.hex || '#9a8e80'`
5. For category badge pills (if any), use `colorMap[name]?.bg` and `colorMap[name]?.text` for the Tailwind classes

**Important:** The `colorMap` shape is now an object `{ bg, text, hex }` (changed in Task 6), not a string. All references must use property access (`.hex`, `.bg`, `.text`).

- [ ] **Step 3: Verify Dashboard with real data**

Run `npm run dev`:
1. Create a budget for the current month via the Budget tab
2. Go to Dashboard — verify the Budget Summary Widget shows real data with correct progress bar colors
3. Verify category dots use dynamic colors from the database
4. Toggle between Day/Week/Month — verify budget widget updates correctly

- [ ] **Step 4: Commit**

```bash
git add financeapp/src/pages/Dashboard.jsx
git commit -m "feat: wire Dashboard budget widget and category colors to real data"
git push
```

---

## Task 10: Final Polish — Build Verification

**Files:**
- All files

- [ ] **Step 1: Run build**

```bash
cd financeapp && npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

```bash
cd financeapp && npm run lint
```
Fix any lint errors.

- [ ] **Step 3: Visual QA pass**

Run `npm run dev` and check every page:
- [ ] Dashboard: period selector, expenditure, debt, bills, vitamins, budget widget — all dark themed, amounts in Geist Mono
- [ ] Expenses: period selector, category widgets (3-col), category manager, quick add, expense list — all dark themed
- [ ] Budget: month selector, total allowance, budget items with progress bars, summary footer — all dark themed
- [ ] Loans: loan cards, forms, amortization table — all dark themed
- [ ] Subscriptions: list, form, due badges, paid button — all dark themed
- [ ] Vitamins: list, form, restock badges, rebuy button — all dark themed
- [ ] Settings: form, code block — all dark themed
- [ ] Bottom nav: 7 tabs with SVG icons, active states
- [ ] Top bar: terracotta dot, title
- [ ] Modals: dark backdrop, dark surface, slide-up animation
- [ ] Tab switching: stagger-in animation

- [ ] **Step 4: Fix any remaining issues found during QA**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Desert Dusk redesign — visual QA pass"
git push
```
