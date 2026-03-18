import { useContext, useState, useEffect } from 'react'
import { SettingsContext } from '../App'
import { CURRENCIES } from '../lib/currencyUtils'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency } = useContext(SettingsContext)
  const [localCurrency, setLocalCurrency] = useState(defaultCurrency)
  const [userName, setUserName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-text-primary mb-4">Preferences</h2>
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
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </form>
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
