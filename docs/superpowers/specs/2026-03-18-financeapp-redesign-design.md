# FinanceApp Redesign — "Desert Dusk"

**Date:** 2026-03-18
**Scope:** Full visual overhaul + new features for financeapp

---

## 1. Design System

### Color Tokens (CSS Variables)

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#171412` | Page background |
| `--bg-card` | `#221e1a` | Card surfaces |
| `--bg-card-hover` | `#2a2520` | Card hover/active states |
| `--bg-input` | `#1e1a16` | Form inputs |
| `--border` | `#2e2822` | Card borders, dividers |
| `--border-focus` | `#c47a5a` | Input focus rings |
| `--accent` | `#c47a5a` | Primary accent (terracotta) — buttons, active tab, links |
| `--accent-hover` | `#d48a6a` | Accent hover |
| `--highlight` | `#d4a574` | Sandy gold — amounts, totals, key numbers |
| `--positive` | `#7a8c6e` | Sage green — under budget, paid, healthy |
| `--warning` | `#c9a040` | Warm amber — approaching limit |
| `--danger` | `#b06060` | Dusty rose — overdue, over budget, debt |
| `--text-primary` | `#e8e0d4` | Main text (warm off-white) |
| `--text-secondary` | `#9a8e80` | Labels, hints |
| `--text-muted` | `#6b6058` | Disabled, placeholder |

### Typography

- **Headings & body:** DM Sans (Google Fonts) — loaded via `<link>` tag in `index.html`
- **Numbers & amounts:** Geist Mono — loaded via `geist` npm package (`npm install geist`, import `geist/font/mono` in `index.css`)
- Body: 14px regular, Labels: 12px medium, Headings: 16-18px medium, Big numbers: 28-32px Geist Mono
- CSS variables: `--font-body: 'DM Sans', sans-serif` and `--font-mono: 'Geist Mono', monospace`

### Card Pattern

- `bg-[--bg-card]` + `border border-[--border]` + `rounded-xl`
- No shadows — borders define edges in dark mode

### Button Variants

- **Primary:** `bg-[--accent] text-[--bg-base]` rounded-lg, hover `bg-[--accent-hover]`
- **Secondary:** `border border-[--border] text-[--text-secondary]` rounded-lg
- **Danger:** `bg-[--danger]/20 text-[--danger]` rounded-lg
- **Ghost:** `text-[--text-secondary]` hover `text-[--text-primary]`

### Form Inputs

- Background: `--bg-input`, border: `--border`, focus ring: `--border-focus`
- Text: `--text-primary`, placeholder: `--text-muted`
- Rounded-lg, padding px-3 py-2

---

## 2. Navigation & Layout

### Top Bar

- Background: `--bg-base` (no border, blends into page)
- Page title: DM Sans medium, `--text-primary`
- Subtle terracotta dot indicator next to title (replaces emoji)

### Bottom Nav

- Background: `--bg-card` with top border `--border`
- Simple SVG line icons (replace emojis)
- Active tab: icon + label in `--accent`, inactive: `--text-muted`
- **7 tabs:** Dashboard, Expenses, Budget (new), Loans, Subscriptions, Vitamins, Settings
- Icon 20px, label 10px
- **Layout:** Fixed 7-column grid, labels abbreviated if needed (e.g. "Subs" for Subscriptions, "Vits" for Vitamins). No horizontal scroll — all tabs always visible.

### Tab Transitions

- On tab switch: staggered card reveal (50ms delay between cards, opacity 0→1 + translateY 8px→0, 200ms ease-out)
- **Implementation:** Replace `display: none`/`block` `TabPanel` pattern with conditional rendering (`{activeTab === X && <Page />}`). This enables CSS entry animations via a wrapper `<div className="animate-stagger-in">` on each page's card children. The stagger animation is defined in `index.css` using `animation-delay` on nth-child selectors.

### Modals

- Backdrop: `rgba(0,0,0,0.6)`
- Modal surface: `--bg-card` with `--border`
- Slide-up on mobile

---

## 3. Dashboard Redesign

### Time Period Selector (new)

- Row of 3 toggle buttons: Day | Week | Month
- Inactive: `--bg-card`, Active: `--accent` text + underline
- Contextual picker below:
  - **Month:** dropdown of months
  - **Week:** "Mar 10–16" with left/right arrow buttons
  - **Day:** "Mar 18" with left/right arrows
- All dashboard sections filter to the selected period

### Expenditure Overview

- Big total: Geist Mono, `--highlight` color, 28-32px
- Category breakdown: colored dots + name + amount + mini progress bar
- Progress bars use each category's assigned color (muted versions)

### Total Debt

- Amount: Geist Mono, `--danger`
- Active loan count: `--text-secondary`

### Bills to Pay (expandable)

- Chevron rotates on expand
- Due badges: `--danger` (overdue), `--warning` (soon), `--text-muted` (distant)

### Vitamins Restock (expandable)

- Same pattern, badges: `--danger`/`--warning`/`--positive`

### Budget Summary Widget (new)

- Total budget vs. total spent for selected period
- Horizontal bar: spent in `--accent`, remaining in `--bg-base`
- "Budget: $X / $Y" with percentage
- Color shifts: `--positive` → `--warning` → `--danger` as approaching/exceeding budget

---

## 4. Expenses Page Redesign

### Time Period Selector

- Same shared `PeriodSelector` component as Dashboard (Day/Week/Month toggle + contextual date picker)
- This replaces the existing month-only dropdown entirely — the Month mode within PeriodSelector serves the same purpose

### Category Widgets (replacing horizontal scroll chips)

- 3-column grid of compact cards
- Each card: category color top-edge (3px), category name, spend amount (Geist Mono)
- Tapping filters expense list, card gets `--accent` border
- Tap again to deselect (show all)
- "All" card at top-left shows total spend
- Small gear icon top-right → opens category manager

### Category Manager (inline panel)

- Slides down below widget grid when gear icon tapped
- List of categories with delete (x) button
- "Add category" input + color picker (10 preset muted earth-tone colors)
- "Manage Keywords" button → expands keyword editor per category
- Keyword editor: current keywords as removable pills, text input to add

### Quick Add Bar

- Restyled: `--bg-input` background, `--border` border, `--accent` focus ring
- Placeholder: `--text-muted`
- Same parsing logic, now reads from `categories` table keywords

### Expense List

- Dark cards, receipt thumbnails, category badge uses category's assigned color
- Amounts: Geist Mono `--highlight`
- Delete button: `--text-muted` → `--danger` on hover

---

## 5. Budget Planner (New Page — Tab 3)

### Header

- "Monthly Budget" title + month selector dropdown

### Total Allowance

- Large editable amount: Geist Mono `--highlight`, 28-32px
- Tap to edit, inline input field

### Budget Categories

- Budget categories are **free-text names** — the user types any name they want (e.g. "Eating out", "Savings", "Fun money")
- Each budget item can **optionally link** to one expense category (from the `categories` table) to auto-track actual spending
- If linked: actual spend is calculated by summing expenses with that category name for the selected month
- If unlinked: actual spend shows as "—" (manual tracking only, no auto-calculation)
- Each row: category name, allocated amount (editable), progress bar (if linked), actual spend
- Progress bar colors: `--positive` (under), `--warning` (80%+), `--danger` (exceeded)
- "Remaining" shows unallocated amount from total allowance

### Add Category

- "+" button at bottom
- Inline form: budget name (free text) + allocated amount + optional dropdown to link to an expense category

### Summary Footer

- Sticky bottom bar: `position: sticky; bottom: 72px` (sits above the 64px bottom nav + 8px gap), `z-index: 30` (below nav's z-40)
- Allocated / Total | Spent / Allocated — color-coded status
- The main content `pb-24` padding is increased to `pb-36` on the Budget page to accommodate both the footer and nav

---

## 6. Other Pages (Restyle Only)

### Loans

- Same layout, recolored with design tokens
- Progress bar: `--accent` fill
- Interest amounts: `--danger`
- Type badges: subtle pill with `--border`

### Subscriptions

- Recolored cards
- Due badges: `--danger`/`--warning`/`--text-muted`
- "Paid" button: `--positive`
- Monthly cost card: `--accent` instead of blue

### Vitamins

- Recolored cards
- Restock badges: `--danger`/`--warning`/`--positive`
- Total spent card: `--positive` tinted background
- "Rebuy" button: `--accent`

### Settings

- Dark styled inputs
- Currency selector restyled
- Supabase setup: code block with `--bg-base` + Geist Mono

---

## 7. Supabase Schema Changes

### Existing Table: categories

The `categories` table **already exists** in Supabase and is used by the existing `useCategories` hook (`src/hooks/useCategories.js`). The existing schema is:

```sql
-- ALREADY EXISTS — do not recreate
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color_bg text not null,     -- Tailwind bg class, e.g. 'bg-orange-100'
  color_text text not null,   -- Tailwind text class, e.g. 'text-orange-700'
  keywords text[] default '{}',
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);
```

**Color approach change:** The existing hook stores Tailwind classes (`color_bg`, `color_text`). The redesign switches to hex-based colors for the category widgets (using inline `style` for the colored top-edge). We will **add a new `color_hex` column** to the categories table and update the `useCategories` hook to use it for the widget top-edge. The existing `color_bg`/`color_text` columns remain for backward compatibility with category badge pills.

```sql
-- Migration: add hex color column
alter table categories add column color_hex text default '#9a8e80';
```

### New Tables

```sql
-- Monthly budget header
create table budgets (
  id uuid default gen_random_uuid() primary key,
  month text not null, -- format: YYYY-MM
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
  linked_expense_category text, -- matches categories.name (string match, not FK)
  created_at timestamp with time zone default now()
);
alter table budget_items enable row level security;
create policy "Allow all for anon" on budget_items for all using (true) with check (true);
```

### Expense-to-Category Linkage Strategy

Expenses store `category` as a plain text string (e.g. `'Food'`). Budget items link to expense categories via `linked_expense_category` which is also a text string matching `categories.name`. This is a **name-based match**, not a foreign key.

**On category rename:** The `updateCategory` function in `useCategories` hook will be updated to also rename the category string in all matching `expenses.category` and `budget_items.linked_expense_category` rows. This keeps everything in sync.

### Existing Table: expenses (reference)

```sql
-- ALREADY EXISTS — not modified
create table expenses (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  amount numeric not null,
  category text not null,        -- plain text, matches categories.name
  notes text,
  currency text default 'SGD',
  receipt_url text,
  created_at timestamp with time zone default now()
);
```

### Migration: Seed Default Categories

On first load, if `categories` table is empty, the `useCategories` hook seeds with the 10 default categories. The exact keyword lists are copied from the existing `KEYWORD_MAP` in `QuickAddBar.jsx`:

| Category | color_bg | color_text | color_hex | Keywords |
|---|---|---|---|---|
| Food | `bg-orange-100` | `text-orange-700` | `#c47a5a` | lunch, dinner, breakfast, hawker, makan, coffee, tea, snack, supper, brunch, grab, foodpanda, deliveroo, mcdonalds, kfc, bubble, boba, rice, noodle, noodles |
| Transport | `bg-blue-100` | `text-blue-700` | `#5a7a94` | mrt, bus, taxi, fuel, petrol, parking, ezlink, uber, toll, train |
| Shopping | `bg-pink-100` | `text-pink-700` | `#94707a` | clothes, shoes, shirt, pants, online, shopee, lazada, amazon |
| Entertainment | `bg-purple-100` | `text-purple-700` | `#7a6a94` | movie, movies, netflix, concert, game, games, karaoke, spotify |
| Health | `bg-green-100` | `text-green-700` | `#7a8c6e` | doctor, clinic, medicine, pharmacy, dental, dentist, gym, vitamin |
| Education | `bg-yellow-100` | `text-yellow-700` | `#c9a040` | book, books, course, tuition, udemy, class |
| Utilities | `bg-gray-100` | `text-gray-700` | `#6b6058` | electric, water, internet, phone, wifi, bill, mobile |
| Groceries | `bg-lime-100` | `text-lime-700` | `#8c946e` | grocery, groceries, supermarket, fairprice, coldstore, sheng |
| Travel | `bg-cyan-100` | `text-cyan-700` | `#5a8c8c` | hotel, flight, airbnb, luggage, visa, airport |
| Other | `bg-gray-100` | `text-gray-600` | `#9a8e80` | (none) |

---

## 8. Animations

| Element | Animation | Duration |
|---|---|---|
| Tab switch cards | Stagger in: fade + translateY 8px→0, 50ms delay each | 200ms ease-out |
| Dashboard totals | Opacity transition on value change | 150ms |
| Budget progress bars | Width animate on load | 300ms ease-out |
| Category widget tap | Scale pulse 1.0→0.97→1.0 | 150ms |
| Toast | Fade-in from top (keep current), restyle dark | 200ms ease-out |
| Expandable sections | Smooth height + overflow hidden | 200ms ease-out |
| Modal entry | Slide up + fade backdrop | 250ms ease-out |

---

## 9. New Hooks & Data Flow

### useCategories (already exists — modify)

- **Existing:** Fetches from `categories` table, CRUD, builds `keywordMap` and `colorMap` helpers
- **Changes:** Add `color_hex` to colorMap helper. On `updateCategory`, also cascade-rename in `expenses.category` and `budget_items.linked_expense_category`. Add seeding logic: if categories table is empty on first fetch, insert the 10 defaults with full keyword lists.

### useBudgets

- Fetch budget + items for a given month
- Create/update total allowance
- Add/remove/update budget items
- Calculate actual spend by joining with expenses

### Updated useExpenses

- Accept time period filter (day/week/month + date range)
- Filter by category from `categories` table instead of hardcoded list

### Updated Dashboard

- Accept period type (day/week/month) + selected date/range
- All existing queries filter by the computed date range

---

## 10. File Changes Summary

### New Files

- `src/pages/Budget.jsx` — Budget planner page (includes empty state using `EmptyState` component, error state using `ErrorBanner`)
- `src/hooks/useBudgets.js` — Budget CRUD hook
- `src/components/expenses/CategoryWidgets.jsx` — 3-col category grid
- `src/components/expenses/CategoryManager.jsx` — Inline category editor
- `src/components/budget/BudgetForm.jsx` — Budget item form
- `src/components/budget/BudgetProgress.jsx` — Progress bar component
- `src/components/shared/PeriodSelector.jsx` — Reusable Day/Week/Month toggle + picker

### Modified Files

- `src/index.css` — CSS variables, dark theme, new animations
- `tailwind.config.js` — Extend theme with CSS variable references
- `src/App.jsx` — Add Budget tab (7 tabs), update tab array, import Budget page
- `src/components/layout/TopBar.jsx` — Restyle dark, replace emoji
- `src/components/layout/BottomNav.jsx` — SVG icons, 7 tabs, dark restyle
- `src/pages/Dashboard.jsx` — Add PeriodSelector, budget widget, dark restyle
- `src/pages/Expenses.jsx` — CategoryWidgets, PeriodSelector, dark restyle
- `src/pages/Loans.jsx` — Dark restyle
- `src/pages/Subscriptions.jsx` — Dark restyle
- `src/pages/Vitamins.jsx` — Dark restyle
- `src/pages/Settings.jsx` — Dark restyle
- `src/hooks/useExpenses.js` — Add date range filtering
- `src/hooks/useCategories.js` — Add `color_hex` support, cascade rename on update, seed logic
- `src/components/expenses/QuickAddBar.jsx` — Remove hardcoded `KEYWORD_MAP` and `CATEGORIES` import, read from `useCategories` hook's `keywordMap` and `categoryNames` instead
- `src/components/expenses/ExpenseForm.jsx` — Remove hardcoded `CATEGORIES` export, read category list from `useCategories` hook
- `src/components/shared/Modal.jsx` — Dark restyle
- `src/components/shared/Toast.jsx` — Dark restyle
- All other component files — Replace Tailwind color classes with CSS variable equivalents
