import { useState } from 'react'
import { formatAmount, CURRENCIES } from '../../lib/currencyUtils'
import { daysUntilDue } from '../../hooks/useSubscriptions'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'

const SUB_CATEGORIES = ['Streaming', 'Software', 'News', 'Music', 'Gaming', 'Cloud', 'Gym', 'Insurance', 'Other']

function dueBadge(days) {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-red-100 text-red-700' }
  if (days === 0) return { label: 'Due today!', cls: 'bg-red-100 text-red-700' }
  if (days <= 3) return { label: `${days}d left`, cls: 'bg-red-100 text-red-700' }
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-orange-100 text-orange-700' }
  return { label: `${days}d left`, cls: 'bg-gray-100 text-gray-500' }
}

const CYCLE_LABEL = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

function EditSubForm({ sub, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: sub.name, amount: String(sub.amount), currency: sub.currency ?? 'SGD',
    billing_cycle: sub.billing_cycle, next_due_date: sub.next_due_date, category: sub.category ?? 'Other',
  })
  const [saving, setSaving] = useState(false)
  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try { await onSave(sub.id, { ...form, amount: parseFloat(form.amount) }) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
        <select value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
        <input type="date" value={form.next_due_date} onChange={e => set('next_due_date', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function SubscriptionList({ subscriptions, onDelete, onMarkPaid, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  if (subscriptions.length === 0) {
    return <EmptyState icon="🔄" message="No subscriptions yet" sub="Track your recurring expenses" />
  }

  async function handleSave(id, data) { await onUpdate(id, data); setEditing(null) }

  return (
    <>
      <div className="space-y-2">
        {subscriptions.map(sub => {
          const days = daysUntilDue(sub.next_due_date)
          const badge = dueBadge(days)
          return (
            <div key={sub.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(sub)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{sub.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CYCLE_LABEL[sub.billing_cycle]} · {sub.category} · Next: {sub.next_due_date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">
                  {formatAmount(sub.amount, sub.currency)}
                </span>
                <button onClick={() => onMarkPaid(sub)}
                  className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded px-1.5 py-0.5">Paid</button>
                <button onClick={() => setDeleting(sub.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <Modal title="Edit Subscription" onClose={() => setEditing(null)}>
          <EditSubForm sub={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-gray-800 font-medium mb-4">Delete this subscription?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={() => { onDelete(deleting); setDeleting(null) }} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
