import { useContext, useState } from 'react'
import { SettingsContext } from '../App'
import ImportModal from '../components/trades/ImportModal'
import GuideModal from '../components/shared/GuideModal'
import { exportAllJSON, exportTradesCSV, exportJournalJSON } from '../lib/exportData'

const CURRENCIES = ['USD', 'SGD', 'EUR', 'GBP', 'JPY', 'AUD']

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency } = useContext(SettingsContext)
  const [showImport, setShowImport] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [exporting, setExporting] = useState(null)

  async function handleExport(type) {
    setExporting(type)
    try {
      if (type === 'all_json') await exportAllJSON()
      else if (type === 'trades_csv') await exportTradesCSV()
      else if (type === 'journal_json') await exportJournalJSON()
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
    setExporting(null)
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-bold text-text tracking-tight">Import Trades</h2>
        <p className="text-xs text-text-muted">Upload a CSV export from MetaTrader 5 or Tradovate.</p>
        <button onClick={() => setShowImport(true)} className="w-full btn-primary">
          Import CSV
        </button>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      {/* Export section */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-bold text-text tracking-tight">Export Data</h2>
        <p className="text-xs text-text-muted">Export your data for AI analysis or backup.</p>
        <div className="space-y-2">
          <button onClick={() => handleExport('all_json')} disabled={exporting}
            className="w-full btn-secondary flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting === 'all_json' ? 'Exporting...' : 'Full Profile (JSON)'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport('trades_csv')} disabled={exporting}
              className="btn-secondary flex items-center justify-center gap-1.5 text-xs">
              {exporting === 'trades_csv' ? '...' : 'Trades CSV'}
            </button>
            <button onClick={() => handleExport('journal_json')} disabled={exporting}
              className="btn-secondary flex items-center justify-center gap-1.5 text-xs">
              {exporting === 'journal_json' ? '...' : 'Journal JSON'}
            </button>
          </div>
          <p className="text-[10px] text-text-muted">
            Journal JSON includes all entries with linked trade data — perfect for feeding into an AI for deeper analysis.
          </p>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-bold text-text tracking-tight">Preferences</h2>
        <div>
          <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Default Currency</label>
          <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} className="input-field">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-bold text-text tracking-tight">Journal Templates</h2>
        <p className="text-xs text-text-muted">Templates are now configured directly in the Journal tab. Open each journal view and click "Customize template" to edit fields.</p>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-bold text-text tracking-tight">Getting Started Guide</h2>
        <p className="text-xs text-text-muted">How to connect MT5, Tradovate, set up Supabase, deploy, and more.</p>
        <button onClick={() => setShowGuide(true)} className="w-full btn-secondary">
          Open Guide
        </button>
      </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <div className="glass-card p-4 space-y-2.5">
        <h2 className="text-sm font-bold text-text tracking-tight">Supabase Table Setup</h2>
        <p className="text-xs text-text-muted">Run this in your Supabase SQL editor if you haven't already:</p>
        <pre className="bg-surface-50 rounded-xl p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap font-mono border border-border leading-relaxed">{`create table trades (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  symbol text not null,
  instrument text not null,
  direction text not null,
  entry_price numeric not null,
  exit_price numeric,
  size numeric not null,
  pnl numeric,
  currency text not null default 'USD',
  setup_tag text,
  notes text,
  screenshot_url text,
  account text,
  entry_time text,
  exit_time text,
  created_at timestamptz default now()
);

alter table trades enable row level security;
create policy "allow all for anon" on trades
  for all to anon using (true) with check (true);

-- Journal tables
create table journal_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  fields jsonb not null default '[]',
  updated_at timestamptz default now()
);

alter table journal_templates enable row level security;
create policy "allow all for anon" on journal_templates
  for all to anon using (true) with check (true);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  trade_id uuid references trades(id) on delete cascade,
  date date not null,
  week_start date,
  answers jsonb not null default '{}',
  screenshots jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table journal_entries enable row level security;
create policy "allow all for anon" on journal_entries
  for all to anon using (true) with check (true);

-- Gamification
create table gamification (
  id int primary key default 1,
  state jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table gamification enable row level security;
create policy "allow all for anon" on gamification
  for all to anon using (true) with check (true);`}</pre>
      </div>
    </div>
  )
}
