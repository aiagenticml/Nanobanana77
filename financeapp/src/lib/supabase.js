import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  document.body.innerHTML = `
    <div style="font-family:system-ui;max-width:500px;margin:80px auto;padding:24px;text-align:center;color:#333">
      <h1 style="font-size:1.5rem">Supabase not configured</h1>
      <p style="margin-top:12px;color:#666">Create a <code>.env.local</code> file in the financeapp folder with:</p>
      <pre style="background:#f3f4f6;padding:16px;border-radius:8px;text-align:left;margin-top:12px;font-size:0.85rem">VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key</pre>
      <p style="margin-top:12px;color:#666;font-size:0.85rem">Then restart the dev server.</p>
    </div>`
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
