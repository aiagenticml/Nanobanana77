import { useState } from 'react'
import { formatAmount } from '../../lib/currencyUtils'
import { CURRENCIES } from '../../lib/currencyUtils'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'
import ImageUpload from '../shared/ImageUpload'

function EditExpenseForm({ expense, onSave, onCancel, categories }) {
  const catList = categories && categories.length > 0 ? categories : ['Other']
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
        <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm" required />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
          <input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)}
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm">
            {Object.keys(CURRENCIES).sort().map(c => <option key={c} value={c}>{c}</option>)}
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
        <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
        <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
          className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm" />
      </div>
      <ImageUpload label="Receipt" value={form.receipt_url}
        onChange={url => set('receipt_url', url)} folder="receipts" />
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function ExpenseList({ expenses, onDelete, onUpdate, colorMap, categories }) {
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

  function getBadgeClasses(category) {
    if (colorMap && colorMap[category]) {
      return `${colorMap[category].bg} ${colorMap[category].text}`
    }
    return 'bg-base text-text-secondary'
  }

  return (
    <>
      <div className="space-y-2">
        {expenses.map(e => (
          <div key={e.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            {e.receipt_url && (
              <img src={e.receipt_url} alt="Receipt" onClick={() => setViewingReceipt(e.receipt_url)}
                className="w-10 h-10 rounded-lg object-cover border border-border cursor-pointer flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(e)}>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadgeClasses(e.category)}`}>
                  {e.category}
                </span>
                {e.notes && <span className="text-sm text-text-secondary truncate">{e.notes}</span>}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{e.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-highlight text-sm whitespace-nowrap">
                {formatAmount(e.amount, e.currency)}
              </span>
              <button onClick={() => handleDelete(e.id)} className="text-text-muted hover:text-danger text-2xl leading-none p-1">&times;</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title="Edit Expense" onClose={() => setEditing(null)}>
          <EditExpenseForm expense={editing} onSave={handleSave} onCancel={() => setEditing(null)} categories={categories} />
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
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-text-primary font-medium mb-4">Delete this expense?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
