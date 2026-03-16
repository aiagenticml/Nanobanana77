import { useContext, useState, useEffect } from 'react'
import { SettingsContext } from '../App'
import { CURRENCIES } from '../lib/currencyUtils'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency, user, signOut } = useContext(SettingsContext)
  const [localCurrency, setLocalCurrency] = useState(defaultCurrency)
  const [userName, setUserName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('settings').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setUserName(data.user_name ?? '')
    })
  }, [user])

  useEffect(() => {
    setLocalCurrency(defaultCurrency)
  }, [defaultCurrency])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('settings').upsert({
      user_id: user.id,
      default_currency: localCurrency,
      user_name: userName,
    }, { onConflict: 'user_id' })
    if (error) {
      setSaveError(error.message || 'Failed to save settings')
    } else {
      setDefaultCurrency(localCurrency)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Preferences</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-sm text-red-700">{saveError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder="e.g. John"
              maxLength={100}
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
        <h2 className="font-semibold text-gray-800 mb-2">Account</h2>
        <p className="text-xs text-gray-500 mb-3">Signed in as <strong>{user?.email}</strong></p>
        <button onClick={handleSignOut} disabled={signingOut}
          className="w-full py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50">
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
