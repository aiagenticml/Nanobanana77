import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'
import { CURRENCIES } from '../../lib/currencyUtils'

export default function VitaminForm({ onSubmit, onCancel, initial }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    cost: initial?.cost != null ? String(initial.cost) : '',
    currency: initial?.currency ?? defaultCurrency,
    servings: initial?.servings != null ? String(initial.servings) : '',
    date_purchased: initial?.date_purchased ?? today,
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: form.name,
        cost: parseFloat(form.cost),
        currency: form.currency,
        servings: parseInt(form.servings, 10),
        date_purchased: form.date_purchased,
      })
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!initial

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vitamin Name</label>
        <input type="text" placeholder="e.g. Vitamin D3, Omega-3, Magnesium" value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={form.cost}
            onChange={e => set('cost', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Servings
          <span className="font-normal text-gray-400"> — how many days will this last?</span>
        </label>
        <input type="number" min="1" placeholder="e.g. 60" value={form.servings}
          onChange={e => set('servings', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Purchased</label>
        <input type="date" value={form.date_purchased} onChange={e => set('date_purchased', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save' : 'Add Vitamin'}
        </button>
      </div>
    </form>
  )
}
