import { useContext, useState, useEffect } from 'react'
import { SettingsContext } from '../App'
import { CURRENCIES } from '../lib/currencyUtils'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency, userId } = useContext(SettingsContext)
  const [localCurrency, setLocalCurrency] = useState(defaultCurrency)
  const [userName, setUserName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('settings').select('*').eq('user_id', userId).single().then(({ data }) => {
      if (data) setUserName(data.user_name ?? '')
    })
  }, [userId])

  useEffect(() => {
    setLocalCurrency(defaultCurrency)
  }, [defaultCurrency])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('settings').upsert(
      { user_id: userId, default_currency: localCurrency, user_name: userName },
      { onConflict: 'user_id' }
    )
    if (!error) {
      setDefaultCurrency(localCurrency)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Preferences</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder="e.g. John"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
            <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {Object.entries(CURRENCIES).map(([code, sym]) => (
                <option key={code} value={code}>{code} ({sym})</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-2">Supabase Setup</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          This app uses Supabase for data storage. Create a <code>.env.local</code> file in the project root with:
        </p>
        <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 mt-2 overflow-x-auto">
{`VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
      </div>
    </div>
  )
}
