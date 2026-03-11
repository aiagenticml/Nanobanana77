# Finance Planner — Setup Guide

This guide walks you through setting up the Finance Planner app from scratch — from creating your Supabase database to getting it live on Vercel so you can access it on any device.

---

## What You Need Before Starting

- **Node.js** installed on your PC (you already have this if you ran the app)
- A **Supabase** account — free at [supabase.com](https://supabase.com)
- A **Vercel** account — free at [vercel.com](https://vercel.com)
- A **GitHub** account — you are already logged in via `gh auth login`

---

## Step 1 — Install App Dependencies

Open a terminal, navigate to the financeapp folder, and run:

```bash
cd financeapp
npm install
```

This installs React, Tailwind, Supabase SDK, and all other packages the app needs.

---

## Step 2 — Set Up Supabase (Your Database)

Supabase is a free cloud database. Your app stores all expenses, loans, and subscriptions here so that both your PC and phone can access the same data.

### 2.1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account)
2. On your dashboard, click **New Project**
3. Fill in:
   - **Name**: `financeapp` (or anything you like)
   - **Database Password**: create a strong password and save it somewhere safe
   - **Region**: pick the closest to you (e.g. Southeast Asia for Singapore)
4. Click **Create New Project**
5. Wait about 1–2 minutes for it to finish setting up — you will see a green status when ready

### 2.2 — Create the Database Tables

This is where your data will be stored. You need to create 4 tables: expenses, loans, subscriptions, and settings.

1. In your Supabase project, look at the left sidebar and click **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire block below into the editor:

```sql
-- Table 1: Daily expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  currency TEXT DEFAULT 'SGD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Loans (car loan, personal loan, etc.)
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  principal NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  loan_type TEXT NOT NULL CHECK (loan_type IN ('flat', 'reducing')),
  currency TEXT DEFAULT 'SGD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Subscriptions (Netflix, Spotify, insurance, etc.)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'SGD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  next_due_date DATE NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: App settings (one row, stores your currency preference and name)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_currency TEXT DEFAULT 'SGD',
  user_name TEXT DEFAULT 'User'
);

-- Insert the default settings row
INSERT INTO settings (id) VALUES (1);
```

4. Click the green **Run** button (or press `Ctrl + Enter`)
5. You should see a success message at the bottom. If you see errors, check that you copied the full block.

### 2.3 — Enable Row Level Security (RLS)

RLS controls who can access your data. Since this is a personal app with no login system, you'll allow the app to read and write freely using its anonymous key.

You need to do this for **all 4 tables**: expenses, loans, subscriptions, settings.

**For each table, follow these steps:**

1. In the left sidebar, click **Authentication**
2. Click **Policies** in the submenu
3. Find the table name (e.g. `expenses`) in the list
4. Click **Enable RLS** toggle — it will turn on
5. Click **New Policy**
6. Choose **Create a policy from scratch**
7. Fill in the form:
   - **Policy name**: `allow all for anon`
   - **Policy command**: select ALL (or tick SELECT, INSERT, UPDATE, DELETE separately)
   - **Target roles**: type `anon` and select it from the dropdown
   - **USING expression**: type `true`
   - **WITH CHECK expression**: type `true`
8. Click **Save Policy**

Repeat steps 3–8 for `loans`, `subscriptions`, and `settings`.

> **Why are we doing this?** Without RLS policies, Supabase blocks all requests by default. The `anon` role is what the app uses when no one is logged in. Setting the expression to `true` means "allow everything" — which is fine for a personal tool only you will use.

### 2.4 — Get Your API Keys

The app needs two things from Supabase to connect: your project URL and your anon key.

1. In the left sidebar, click the **gear icon** (Settings) at the very bottom
2. Click **API** in the submenu
3. You will see two values — copy both:
   - **Project URL** — looks like `https://abcdefghij.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

Keep these handy for the next step.

---

## Step 3 — Connect the App to Supabase

The app reads your Supabase keys from a file called `.env.local`. This file is never uploaded to GitHub — it stays private on your machine.

1. Inside the `financeapp/` folder, create a new file called `.env.local`
2. Open it and paste the following, replacing with your actual values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-full-anon-key-here...
```

Save the file. It should look something like:

```
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Important:** Never share this file or commit it to GitHub. The `.gitignore` already excludes `.env.local` so you are safe.

---

## Step 4 — Run the App Locally

To test that everything is connected before deploying:

```bash
npm run dev
```

Open your browser and go to [http://localhost:5173](http://localhost:5173)

You should see the Finance Planner app. Try adding a test expense — if it saves without errors, your Supabase connection is working.

To stop the local server, press `Ctrl + C` in the terminal.

---

## Step 5 — Push Code to GitHub

Before deploying to Vercel, your code needs to be on GitHub.

If the `financeapp` folder is already inside the `Nanobanana77` repo (which it is), you can push from the parent folder:

```bash
cd "c:/Users/Beelink SER9 M/Nanobanana77"
git add financeapp
git commit -m "Add finance planner app"
git push
```

If you want `financeapp` as its own separate GitHub repo:

```bash
cd financeapp
git init
git add .
git commit -m "Initial commit"
gh repo create financeapp --public --source=. --remote=origin --push
```

The second option uses the GitHub CLI (`gh`) you already set up.

---

## Step 6 — Deploy to Vercel

Vercel will host your app for free and give you a public URL you can open on your phone.

### 6.1 — Create a New Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **Add New** → **Project**
3. Find your GitHub repo (`financeapp` or `Nanobanana77`) and click **Import**
4. If you imported the whole `Nanobanana77` repo, set the **Root Directory** to `financeapp`
   - Click **Edit** next to Root Directory
   - Type `financeapp` and confirm
5. Framework preset should auto-detect as **Vite** — leave it as is

### 6.2 — Add Your Environment Variables

Before clicking Deploy, you need to add your Supabase keys to Vercel (same values as your `.env.local`):

1. Scroll down to the **Environment Variables** section
2. Add the first variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: your Supabase project URL
3. Click **Add** and then add the second:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: your Supabase anon key
4. Click **Add** again

### 6.3 — Deploy

1. Click the **Deploy** button
2. Vercel will build and deploy your app — this takes about 1 minute
3. When done, you will get a live URL like `https://financeapp-yourname.vercel.app`
4. Open that URL on your phone browser — it should work exactly the same as on your PC

> Every time you push new code to GitHub, Vercel automatically redeploys. No manual steps needed.

---

## How to Access on Your Phone

1. Open your phone's browser (Chrome, Safari, etc.)
2. Go to your Vercel URL (e.g. `https://financeapp-yourname.vercel.app`)
3. To save it to your home screen:
   - **iPhone**: tap the Share button → Add to Home Screen
   - **Android**: tap the 3-dot menu → Add to Home Screen

Data entered on your phone will appear on your PC and vice versa — both connect to the same Supabase database.

---

## Loan Type Reference

| Type | How interest works | Typical use case |
|------|--------------------|-----------------|
| **Reducing Balance** | Interest charged on the remaining balance each month. As you pay down the principal, your interest charge drops each month. | Bank car loans, HDB loans, most bank personal loans |
| **Flat Rate** | Interest charged on the original loan amount for the entire loan period, even as you repay. Costs more than it looks. | Licensed moneylenders, some personal loan ads |

> A flat rate of 3.5% p.a. is NOT the same as a reducing rate of 3.5% p.a. A flat rate of 3.5% is roughly equivalent to a reducing rate of ~6.5%. Always compare by looking at the monthly payment amount.

---

## Quick-Add Expense Format

On the Expenses page, you can type a one-liner instead of filling the full form:

```
[amount] [category] [notes]
```

Examples:
```
12.50 food hawker centre lunch
3.20 transport bus to work
85 health clinic visit
200 shopping grab bag
```

Supported categories: `Food`, `Transport`, `Shopping`, `Entertainment`, `Health`, `Education`, `Utilities`, `Groceries`, `Travel`, `Other`

If the category word is not recognised, it defaults to `Other` and the whole text becomes the notes.

---

## Troubleshooting

**App loads but shows no data / blank screen**
- Check that `.env.local` exists in the `financeapp/` folder
- Make sure the Supabase URL and key are correct with no extra spaces
- Open browser DevTools (`F12`) → Console tab to see the actual error

**"Failed to fetch" or network errors**
- Your Supabase project may have gone to sleep (free tier pauses after inactivity)
- Go to your Supabase dashboard and open the project — it will wake up in a few seconds
- Refresh the app and try again

**Data not syncing between phone and PC**
- Make sure you are opening the Vercel URL on both devices (not localhost)
- Confirm RLS policies allow `anon` on all 4 tables
- Check that both devices can reach the internet

**Vercel build fails**
- Make sure you added both environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings
- Try running `npm run build` locally first — if it fails locally, fix the error before pushing

**Subscription "Paid" button not advancing the date**
- The next due date is auto-calculated based on the billing cycle (monthly adds 1 month, yearly adds 1 year, weekly adds 7 days)
- If the date looks wrong, delete and re-add the subscription with the correct next due date
