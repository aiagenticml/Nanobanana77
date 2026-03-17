# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing multiple independent projects:

- `financeapp/` — Personal finance planner (React + Vite + Tailwind + Supabase)
- `tradingjournal/` — Trading journal & analytics app (React + Vite + Tailwind + Supabase)
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

## tradingjournal

### Commands

All commands must be run from inside `tradingjournal/`:

```bash
npm run dev        # Start local dev server at http://localhost:5173
npm run build      # Production build (outputs to dist/)
npm run lint       # Run ESLint
npm run preview    # Preview the production build locally
```

### Environment

Requires a `.env.local` file in `tradingjournal/` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Architecture

Same stack and patterns as `financeapp/` — tab-based SPA, no React Router, custom hooks for Supabase CRUD, Tailwind styling.

**4 tabs:** Dashboard · Trade Log · Journal · Settings

**Data layer** — single `useTrades` hook (`src/hooks/useTrades.js`) handles all CRUD. Filters: month, instrument, direction, setup_tag.

**Trade analytics** live in `src/lib/tradeCalc.js` as pure functions: `calcPnL`, `getWinRate`, `getProfitFactor`, `getAvgRR`, `getEquityCurve`, `getMaxDrawdown`, `getStreaks`, `getTotalPnL`.

**Instruments supported:** Forex, Futures.

**P&L** is auto-calculated from entry/exit prices + size + direction, but can be manually overridden.

### Supabase Setup

The `trades` table SQL is displayed in the Settings tab of the app, and also as a comment in `src/lib/supabase.js`. The `uploads` bucket (public) is used for trade screenshots.

### Key files

- `src/App.jsx` — tab shell + SettingsContext
- `src/lib/tradeCalc.js` — all analytics math
- `src/lib/supabase.js` — Supabase client + table creation SQL comment
- `src/hooks/useTrades.js` — CRUD hook with filters
- `src/components/trades/TradeForm.jsx` — add/edit form with auto P&L calculation

---

## tictactoe

Vanilla HTML/CSS/JS — no build step, no dependencies. Open `tictactoe/index.html` directly in a browser.

### Architecture

Single page with 3 files: `index.html`, `style.css`, `script.js`. All game logic is in `script.js` (~238 lines).

**Game state** is a single `state` object at the top of `script.js`:
```js
{ board: Array(9), currentPlayer, gameActive, mode: 'pvp'|'ai', scores: {X, O, draw} }
```

**Two modes:**
- `pvp` — Player vs Player, alternates between X and O
- `ai` — Player (X) vs AI (O)

**AI** uses the minimax algorithm (`minimax()` in `script.js`) — it is unbeatable at optimal play. `getBestMove()` calls minimax to find the best move for O. The board is represented as a flat 9-element array matching the 3×3 grid positions (0=top-left, 8=bottom-right).

**Key functions in script.js:**
- `makeMove(index)` — places a mark, checks win/draw, switches player or triggers AI
- `checkWin()` — tests all 8 win combinations against current board
- `endGame(isDraw, winCombo)` — updates scores, highlights winning cells, shows message
- `minimax(board, depth, isMaximizing)` — recursive minimax for AI decisions
- `spawnConfetti()` — CSS animation triggered on win

Scores persist in the `state` object for the session only (no localStorage — resets on page refresh).

---

## Git workflow

After completing any meaningful piece of work, always commit and push to GitHub so progress is never lost and can be reverted at any point.

```bash
git add <specific-files>      # stage only relevant files
git commit -m "type: message" # clean commit message (see conventions below)
git push                      # push immediately after every commit
```

**When to commit:**
- After completing a feature or fix
- Before making any significant refactor
- After updating config or documentation
- At the end of every working session

**Commit message conventions:**
```
feat:   new feature or capability
fix:    bug fix
chore:  config, deps, setup, tooling
update: changes to existing features
docs:   documentation only
```

**Examples:**
```
feat: add budget limit warnings to dashboard
fix: correct flat rate interest calculation for short tenures
update: improve subscription due date badge colours
chore: upgrade supabase-js to v3
docs: update SETUP.md with Vercel env var steps
```

Always use specific, descriptive messages — never `git commit -m "update"` or `git commit -m "fix stuff"`. Each commit message should make sense on its own when reading `git log`.
