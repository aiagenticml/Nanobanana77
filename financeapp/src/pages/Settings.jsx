import { useContext, useState, useEffect } from 'react'
import { SettingsContext } from '../App'
import { CURRENCIES } from '../lib/currencyUtils'
import { supabase } from '../lib/supabase'

const EXPORT_TABLES = [
  'expenses', 'categories', 'budgets', 'budget_items',
  'loans', 'subscriptions', 'insurance_policies',
  'accounts', 'account_entries', 'vitamins',
  'trips', 'trip_expenses', 'trip_categories', 'trading_entries',
]

async function exportAllCSV() {
  const sections = []
  for (const table of EXPORT_TABLES) {
    const { data } = await supabase.from(table).select('*')
    if (!data || data.length === 0) {
      sections.push(`# ${table}\n(no data)`)
      continue
    }
    const headers = Object.keys(data[0])
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
    sections.push(`# ${table}\n${headers.join(',')}\n${rows.join('\n')}`)
  }

  const csv = sections.join('\n\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `financeapp-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency } = useContext(SettingsContext)
  const [localCurrency, setLocalCurrency] = useState(defaultCurrency)
  const [userName, setUserName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setUserName(data.user_name ?? '')
    })
  }, [])

  useEffect(() => {
    setLocalCurrency(defaultCurrency)
  }, [defaultCurrency])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('settings').update({ default_currency: localCurrency, user_name: userName }).eq('id', 1)
    if (!error) {
      setDefaultCurrency(localCurrency)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportAllCSV()
    } catch { /* ignore */ }
    setExporting(false)
  }

  return (
    <div className="space-y-4 pb-44">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Preferences</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Your Name</label>
            <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder="e.g. John"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Default Currency</label>
            <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus">
              {Object.entries(CURRENCIES).map(([code, sym]) => (
                <option key={code} value={code}>{code} ({sym})</option>
              ))}
            </select>
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-semibold text-text-primary">Export Data</h2>
            <p className="text-xs text-text-muted mt-0.5">Download all your data as a CSV file</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-card-hover border border-border text-text-secondary rounded-lg px-4 py-1.5 text-sm hover:text-text-primary hover:border-border-focus transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
        <p className="text-xs text-text-muted">Includes: expenses, budget, loans, subscriptions, insurance, accounts, overseas trips, trading entries</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-text-primary mb-2">Supabase Setup</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          This app uses Supabase for data storage. Create a <code>.env.local</code> file in the project root with:
        </p>
        <pre className="bg-base rounded-lg p-3 text-xs font-mono text-text-secondary mt-2 overflow-x-auto">
{`VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
      </div>
    </div>
  )
}
