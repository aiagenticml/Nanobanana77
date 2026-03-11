# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing multiple independent projects:

- `financeapp/` — Personal finance planner (React + Vite + Tailwind + Supabase)
- `tictactoe/` — Browser-based Tic Tac Toe (vanilla HTML/CSS/JS)

---

## financeapp

### Commands

All commands must be run from inside `financeapp/`:

```bash
npm run dev        # Start local dev server at http://localhost:5173
npm run build      # Production build (outputs to dist/)
npm run lint       # Run ESLint
npm run preview    # Preview the production build locally
```

### Environment

Requires a `.env.local` file in `financeapp/` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Without these, the app will fail to load. See `financeapp/.env.local.example`.

### Architecture

**Tab-based SPA** — no React Router. `App.jsx` holds a `useState` tab index and renders one of 5 pages. Shared currency preference is passed down via `SettingsContext` (defined in `App.jsx`).

**Data layer** — each page has a dedicated custom hook (`useExpenses`, `useLoans`, `useSubscriptions`) that handles all Supabase queries (fetch, insert, delete). Hooks follow the same pattern: fetch on mount, expose CRUD functions, return loading/error state.

**Supabase** is the only backend. All tables use anon RLS (`allow all for anon`). There is no authentication. The 4 tables are: `expenses`, `loans`, `subscriptions`, `settings` (single row, id=1).

**Loan math** lives entirely in `src/lib/loanCalc.js` as pure functions — no dependencies. Two loan types:
- `reducing` — standard PMT formula, interest recalculates on remaining balance each month
- `flat` — interest calculated on original principal for full term, higher effective cost

**Currency** — amounts are stored as-entered in their original currency. No exchange rate conversion. `src/lib/currencyUtils.js` handles symbol mapping and formatting only.

### Key files

- `src/App.jsx` — tab shell + `SettingsContext` provider
- `src/lib/loanCalc.js` — all loan math (PMT, amortization schedule, remaining balance)
- `src/lib/supabase.js` — Supabase client singleton
- `src/components/expenses/QuickAddBar.jsx` — parses one-liner input (`"12.50 food lunch"`) into structured expense data

### Deployment

Hosted on Vercel. Auto-deploys on push to `main`. Root directory must be set to `financeapp` in Vercel project settings. The same two env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) must be added in Vercel's environment variable settings.

---

## tictactoe

Vanilla HTML/CSS/JS — no build step. Open `tictactoe/index.html` directly in a browser.

---

## Commit conventions

```
feat:   new feature
fix:    bug fix
chore:  config, deps, setup
update: changes to existing features
```
