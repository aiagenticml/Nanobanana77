import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'
import { CURRENCIES } from '../../lib/currencyUtils'
import ImageUpload from '../shared/ImageUpload'

export default function ExpenseForm({ onSubmit, onCancel, categories }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const today = new Date().toISOString().split('T')[0]
  const catList = categories && categories.length > 0 ? categories : ['Other']

  const [form, setForm] = useState({
    date: today,
    amount: '',
    category: catList[0],
    notes: '',
    currency: defaultCurrency,
    receipt_url: null,
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || isNaN(form.amount)) return
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
        <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm" required />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
            onChange={e => set('amount', e.target.value)}
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm">
            {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm">
          {catList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Notes (optional)</label>
        <input type="text" placeholder="e.g. lunch at hawker" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm" />
      </div>
      <ImageUpload label="Receipt (optional)" value={form.receipt_url}
        onChange={url => set('receipt_url', url)} folder="receipts" />
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
