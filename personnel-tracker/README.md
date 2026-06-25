# Personnel Tracking System (Google Sheets + Forms)

A complete, cloud-based, zero-maintenance leave/skills/duty tracker built entirely on **Google
Forms + Google Sheets** — provisioned by a single Apps Script you run once.

Unlike the other projects in this monorepo, **this is not a web app**. There is nothing to
`npm install`, build, or deploy. The deliverable is one script (`BuildPersonnelTracker.gs`) that
creates the whole system inside your own Google account.

---

## What you get

Running the script builds:

| Asset | Purpose |
|-------|---------|
| **Personnel Leave Input** (Form) | Structured leave entry — Full Name (dropdown), Destination, Start/End dates. Feeds the ledger automatically. |
| **Form Responses 1** (tab) | The auto-built leave ledger. `A`=Timestamp · `B`=Full Name · `C`=Destination · `D`=Start Date · `E`=End Date. |
| **Skills Database** (tab) | Flat `Name` / `Skillset` list — one row per skill a person holds. |
| **Tactical Timeline Tracker** (tab) | Dates across Row 13, names down Col A. Each cell shows `PRESENT` (green) or `OL` (red); today's column is highlighted orange. |
| **Command Dashboard** (tab) | Pick a check date (`B2`); see live available headcount per skill, auto-reduced by whoever is on leave that day. |
| **Appointment Board** (tab) | Assign people to daily roles from dropdowns, with two guardrails (below). |

Everything is formula-driven off the live `Form Responses 1` ledger, so **new leave submissions
update the Timeline, Dashboard, and guardrails instantly** — no further scripting or manual entry.

---

## Install / run (≈2 minutes)

1. Create a **new, blank Google Sheet**.
2. **Extensions → Apps Script**. Delete the boilerplate, paste the full contents of
   [`BuildPersonnelTracker.gs`](./BuildPersonnelTracker.gs).
3. In the toolbar function dropdown choose **`buildPersonnelTracker`**, click **Run**.
4. Approve the OAuth prompt (it needs Sheets + Forms access — it's your own script).
5. Done. Open **View → Logs** (or the Command Dashboard's "Leave form" link) for the Form URL to
   share for leave submissions.

---

## Customising (edit ONE place)

Open `BuildPersonnelTracker.gs` and edit only the **CONFIG block** at the top:

| Variable | What it controls |
|----------|------------------|
| `ROSTER` | Your people. Drives the Form dropdown, Timeline rows, and Appointment Board dropdowns. Ships with placeholders `Person 01 … Person 20` — replace with real names. |
| `SKILLS_SEED` | `[Name, Skillset]` rows for the Skills Database. One row per skill; a person with several skills gets several rows. |
| `ROLES` | Daily duties down Col A of the Appointment Board (e.g. *Platoon Sergeant*, *Duty Medic*). |
| `START_DATE` | `'today'`, or a fixed `'YYYY-MM-DD'`. |
| `NUM_DAYS` | How many date columns to generate (default `30`). |

Then re-run `buildPersonnelTracker`.

---

## The guardrails (Appointment Board)

- **Double-booking → bright red.** If the same name is assigned to two roles in the same date
  column, both cells turn red.
- **Overseas while rostered → purple.** If you assign someone who shows `OL` on the Timeline for
  that date, the cell turns purple.

---

## Re-running

Tabs are deleted and rebuilt cleanly on every run. One caveat: a **new Form is created each run**,
so if you re-run, delete the previous "Personnel Leave Input" form from Google Drive to avoid
orphaned forms.

---

## Fixes applied vs. the original spec

The hand-written formulas in the original brief had a few gaps; the script ships corrected
versions:

1. **Form Responses column mapping.** A Form-linked tab puts *Timestamp* in column A, shifting
   everything right — so the matrix uses `B`/`D`/`E` (Name/Start/End), not the original
   `$N`/`$P`/`$Q`.
2. **The Dashboard absent list is now defined.** The capability counter subtracts names in
   `$F$4:$F`, but the brief never populated it. `F4` now holds a `FILTER` that lists everyone on
   leave on the check date, straight from the ledger:
   ```
   =IFERROR(FILTER('Form Responses 1'!$B$2:$B,
       ('Form Responses 1'!$D$2:$D<=$B$2)*('Form Responses 1'!$E$2:$E>=$B$2)),"")
   ```
3. **Double-booking no longer flags blanks** — guarded with `AND(B3<>"", …)`.
4. **Overseas rule no longer errors on blanks** — wrapped in `IFERROR(…, FALSE)`.
5. **Date axes aligned.** Timeline (Row 13) and Appointment Board (Row 2) share one generated date
   range so the cross-reference `MATCH` always lines up.

---

## Verify it works

1. Confirm the tabs `Form Responses 1`, `Skills Database`, `Tactical Timeline Tracker`,
   `Command Dashboard`, `Appointment Board` all exist, and today's Timeline column is orange.
2. Submit a test leave entry for `Person 01` covering today → its Timeline cell flips to red `OL`,
   `Person 01` shows in the Dashboard absent list, and the matching skill counts drop by one.
3. On the Appointment Board, assign `Person 01` to a role today → cell turns **purple**. Put the
   same name in two roles in one date column → both turn **red**.
