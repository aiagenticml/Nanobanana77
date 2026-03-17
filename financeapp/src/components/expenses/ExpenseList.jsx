import { useState } from 'react'
import { formatAmount } from '../../lib/currencyUtils'
import { CURRENCIES } from '../../lib/currencyUtils'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'
import ImageUpload from '../shared/ImageUpload'
import { CATEGORIES } from './ExpenseForm'

const CATEGORY_COLORS = {
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Shopping: 'bg-pink-100 text-pink-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Health: 'bg-green-100 text-green-700',
  Education: 'bg-yellow-100 text-yellow-700',
  Utilities: 'bg-gray-100 text-gray-700',
  Groceries: 'bg-lime-100 text-lime-700',
  Travel: 'bg-cyan-100 text-cyan-700',
  Other: 'bg-gray-100 text-gray-600',
}

function EditExpenseForm({ expense, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: expense.date,
    amount: String(expense.amount),
    category: expense.category,
    notes: expense.notes ?? '',
    currency: expense.currency ?? 'SGD',
    receipt_url: expense.receipt_url ?? null,
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || isNaN(form.amount)) return
    setSaving(true)
    try {
      await onSave(expense.id, { ...form, amount: parseFloat(form.amount) })
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <ImageUpload label="Receipt" value={form.receipt_url}
        onChange={url => set('receipt_url', url)} folder="receipts" />
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function ExpenseList({ expenses, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [viewingReceipt, setViewingReceipt] = useState(null)

  if (expenses.length === 0) {
    return <EmptyState icon="💸" message="No expenses yet" sub="Use the quick add bar or tap + Add" />
  }

  async function handleSave(id, data) {
    await onUpdate(id, data)
    setEditing(null)
  }

  function handleDelete(id) {
    setDeleting(id)
  }

  async function confirmDelete() {
    await onDelete(deleting)
    setDeleting(null)
  }

  return (
    <>
      <div className="space-y-2">
        {expenses.map(e => (
          <div key={e.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            {e.receipt_url && (
              <img src={e.receipt_url} alt="Receipt" onClick={() => setViewingReceipt(e.receipt_url)}
                className="w-10 h-10 rounded-lg object-cover border border-gray-200 cursor-pointer flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(e)}>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.Other}`}>
                  {e.category}
                </span>
                {e.notes && <span className="text-sm text-gray-600 truncate">{e.notes}</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{e.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">
                {formatAmount(e.amount, e.currency)}
              </span>
              <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-red-400 text-2xl leading-none p-1">×</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title="Edit Expense" onClose={() => setEditing(null)}>
          <EditExpenseForm expense={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setViewingReceipt(null)}>
          <img src={viewingReceipt} alt="Receipt" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-gray-800 font-medium mb-4">Delete this expense?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
