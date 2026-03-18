import { useContext, useState } from 'react'
import { SettingsContext } from '../App'
import ImportModal from '../components/trades/ImportModal'
import GuideModal from '../components/shared/GuideModal'
import TemplateEditor from '../components/journal/TemplateEditor'

const CURRENCIES = ['USD', 'SGD', 'EUR', 'GBP', 'JPY', 'AUD']
const selectClass = 'w-full bg-surface-50 border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none'

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency } = useContext(SettingsContext)
  const [showImport, setShowImport] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h2 className="text-sm font-semibold text-text">Import Trades</h2>
        <p className="text-xs text-text-muted">Upload a CSV export from MetaTrader 5 or Tradovate.</p>
        <button onClick={() => setShowImport(true)}
          className="w-full py-2 bg-accent text-surface rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
          Import CSV
        </button>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h2 className="text-sm font-semibold text-text">Preferences</h2>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Default Currency</label>
          <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} className={selectClass}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h2 className="text-sm font-semibold text-text">Journal Templates</h2>
        <p className="text-xs text-text-muted">Customize the questions you answer for each trade, daily, and weekly journal.</p>
        <button onClick={() => setShowTemplates(true)}
          className="w-full py-2 border border-border text-text-secondary rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors">
          Edit Templates
        </button>
      </div>

      {showTemplates && <TemplateEditor onClose={() => setShowTemplates(false)} />}

      <div className="bg-card rounded-xl p-4 border border-border space-y-2">
        <h2 className="text-sm font-semibold text-text">Setup Tags</h2>
        <p className="text-xs text-text-muted">Available when logging trades</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['breakout', 'reversal', 'trend-follow', 'pullback', 'range', 'news', 'scalp', 'swing', 'other'].map(tag => (
            <span key={tag} className="px-3 py-1 bg-surface-50 rounded-full text-xs text-text-secondary">{tag}</span>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h2 className="text-sm font-semibold text-text">Getting Started Guide</h2>
        <p className="text-xs text-text-muted">How to connect MT5, Tradovate, set up Supabase, deploy, and more.</p>
        <button onClick={() => setShowGuide(true)}
          className="w-full py-2 border border-border text-text-secondary rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors">
          Open Guide
        </button>
      </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <div className="bg-card rounded-xl p-4 border border-border space-y-2">
        <h2 className="text-sm font-semibold text-text">Supabase Table Setup</h2>
        <p className="text-xs text-text-muted">Run this in your Supabase SQL editor if you haven't already:</p>
        <pre className="bg-surface-50 rounded-lg p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap font-mono">{`create table trades (
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
  created_at timestamptz default now()
);

alter table trades enable row level security;
create policy "allow all for anon" on trades
  for all to anon using (true) with check (true);

-- Journal tables
create table journal_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'trade' | 'daily' | 'weekly'
  fields jsonb not null default '[]',
  updated_at timestamptz default now()
);

alter table journal_templates enable row level security;
create policy "allow all for anon" on journal_templates
  for all to anon using (true) with check (true);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'trade' | 'daily' | 'weekly'
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
  for all to anon using (true) with check (true);`}</pre>
      </div>
    </div>
  )
}
