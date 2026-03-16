# Security Overview — financeapp

## Threat Model

This app is designed as a **single-user personal finance tool**. It does not implement user authentication or multi-tenancy. The security boundary is the confidentiality of the Supabase project credentials.

## Known Limitations

### No Authentication

There is no login system. All visitors share the same data. If you deploy this publicly, anyone who discovers the URL can view and modify all financial records.

### Anon Key in Client Bundle

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are embedded in the Vite production build (this is by Supabase design for client-side apps). Anyone who inspects the page source can extract these values and make direct API calls to your Supabase project.

### Wide-Open Row Level Security (RLS)

The current RLS policies allow all operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for the `anon` role on all tables. Combined with the exposed anon key, this means the database is effectively public.

### No Per-User Data Isolation

Tables do not have a `user_id` column. All data belongs to the Supabase project, not to individual users.

### No Audit Trail

There is no logging of who created, modified, or deleted records.

## Mitigations in Place

- **Parameterised queries** — All Supabase calls use the SDK's query builder (`.eq()`, `.gte()`, etc.), preventing SQL injection.
- **React auto-escaping** — All user input is rendered as text content via JSX, preventing XSS. No `dangerouslySetInnerHTML` is used anywhere.
- **Input length limits** — All text inputs have `maxLength` constraints. Numeric inputs have `min`/`max` bounds.
- **Hook-level validation** — `useExpenses`, `useLoans`, and `useSubscriptions` validate data (amount bounds, string lengths) before sending to Supabase.
- **Environment variable handling** — `.env.local` is gitignored. No secrets are committed to the repository.

## Recommended Hardening (if deploying publicly)

### 1. Add Supabase Auth

Replace anonymous access with email/password or OAuth login:

1. Enable Auth in your Supabase dashboard.
2. Add a `user_id UUID REFERENCES auth.users(id)` column to each table.
3. Update RLS policies to scope data per user:
   ```sql
   CREATE POLICY "Users see own data" ON expenses
     FOR ALL USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
   ```
4. Update hooks to include `user_id: supabase.auth.getUser().id` on inserts.

### 2. Restrict API Access by Domain

In your Supabase dashboard under **Settings > API**, add your production domain to the allowed origins list. This prevents the anon key from being used outside your app.

### 3. Enable Supabase Rate Limiting

Use Supabase's built-in rate limiting or add a Postgres function with rate checks to prevent abuse.

### 4. Regular Backups

Enable Point-in-Time Recovery in Supabase (available on Pro plan) to protect against accidental or malicious data deletion.
