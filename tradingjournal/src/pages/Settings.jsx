import { useContext } from 'react'
import { SettingsContext } from '../App'

const CURRENCIES = ['USD', 'SGD', 'EUR', 'GBP', 'JPY', 'AUD']

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency } = useContext(SettingsContext)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Preferences</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
          <select
            value={defaultCurrency}
            onChange={e => setDefaultCurrency(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Setup Tags</h2>
        <p className="text-xs text-gray-400">Available when logging trades</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['breakout', 'reversal', 'trend-follow', 'pullback', 'range', 'news', 'scalp', 'swing', 'other'].map(tag => (
            <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">{tag}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Supabase Table Setup</h2>
        <p className="text-xs text-gray-400">Run this in your Supabase SQL editor if you haven't already:</p>
        <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">{`create table trades (
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
  created_at timestamptz default now()
);

alter table trades enable row level security;
create policy "allow all for anon" on trades
  for all to anon using (true) with check (true);`}</pre>
      </div>
    </div>
  )
}
