import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'
import { CURRENCIES } from '../../lib/currencyUtils'

const SUB_CATEGORIES = ['Streaming', 'Software', 'News', 'Music', 'Gaming', 'Cloud', 'Gym', 'Other']

export default function SubscriptionForm({ onSubmit, onCancel }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '',
    amount: '',
    currency: defaultCurrency,
    billing_cycle: 'monthly',
    next_due_date: today,
    category: 'Other',
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({ ...form, amount: parseFloat(form.amount) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Service Name</label>
        <input type="text" placeholder="e.g. Netflix, Spotify, iCloud" value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
            onChange={e => set('amount', e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus">
            {Object.keys(CURRENCIES).sort().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Billing Cycle</label>
        <select value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus">
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Next Due Date
          <span className="font-normal text-text-muted"> — when is your next payment?</span>
        </label>
        <input type="date" value={form.next_due_date} onChange={e => set('next_due_date', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus">
          {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Add Subscription'}
        </button>
      </div>
    </form>
  )
}
