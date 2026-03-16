import { useContext, useState, useEffect } from 'react'
import { SettingsContext } from '../App'
import { CURRENCIES } from '../lib/currencyUtils'
import { supabase } from '../lib/supabase'
import { requireUser } from '../lib/authGuard'

export default function Settings() {
  const { defaultCurrency, setDefaultCurrency, user, signOut } = useContext(SettingsContext)
  const [localCurrency, setLocalCurrency] = useState(defaultCurrency)
  const [userName, setUserName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [actionError, setActionError] = useState('')

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

  async function handleExportData() {
    setExporting(true)
    setActionError('')
    try {
      const user = await requireUser()
      const [expenses, loans, subscriptions, settings] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('loans').select('*').eq('user_id', user.id),
        supabase.from('subscriptions').select('*').eq('user_id', user.id),
        supabase.from('settings').select('*').eq('user_id', user.id),
      ])
      const exportData = {
        exported_at: new Date().toISOString(),
        email: user.email,
        expenses: expenses.data ?? [],
        loans: loans.data ?? [],
        subscriptions: subscriptions.data ?? [],
        settings: settings.data ?? [],
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-planner-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setActionError(err.message || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setDeleting(true)
    setActionError('')
    try {
      const user = await requireUser()
      // Delete all user data from each table
      await Promise.all([
        supabase.from('expenses').delete().eq('user_id', user.id),
        supabase.from('loans').delete().eq('user_id', user.id),
        supabase.from('subscriptions').delete().eq('user_id', user.id),
        supabase.from('categories').delete().eq('user_id', user.id),
        supabase.from('settings').delete().eq('user_id', user.id),
      ])
      await signOut()
    } catch (err) {
      setActionError(err.message || 'Failed to delete account')
      setDeleting(false)
      setDeleteConfirm(false)
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
          className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-2">Your Data</h2>
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <span className="text-sm text-red-700">{actionError}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mb-3">Export all your data as a JSON file or permanently delete your account and all associated data.</p>
        <div className="space-y-2">
          <button onClick={handleExportData} disabled={exporting}
            className="w-full py-2.5 border border-blue-300 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 disabled:opacity-50">
            {exporting ? 'Exporting...' : 'Export My Data'}
          </button>
          <button onClick={handleDeleteAccount} disabled={deleting}
            className="w-full py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50">
            {deleting ? 'Deleting...' : deleteConfirm ? 'Tap again to confirm deletion' : 'Delete My Account & Data'}
          </button>
          {deleteConfirm && !deleting && (
            <button onClick={() => setDeleteConfirm(false)}
              className="w-full py-1.5 text-xs text-gray-500 hover:underline">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Finance Planner is a personal tracking tool for informational purposes only.
          It does not constitute financial, investment, or tax advice. Always consult a
          qualified professional before making financial decisions. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
