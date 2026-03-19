import { useState } from 'react'
import { useContext } from 'react'
import { SettingsContext } from '../App'
import { useInsurance, daysUntilDue } from '../hooks/useInsurance'
import { formatAmount, CURRENCIES } from '../lib/currencyUtils'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'

const INSURANCE_CATEGORIES = ['Life', 'Health', 'Car', 'Home', 'Travel', 'Critical Illness', 'Disability', 'Other']

function dueBadge(days) {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-danger/10 text-danger' }
  if (days === 0) return { label: 'Due today!', cls: 'bg-danger/10 text-danger' }
  if (days <= 3) return { label: `${days}d left`, cls: 'bg-danger/10 text-danger' }
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-warning/10 text-warning' }
  return { label: `${days}d left`, cls: 'text-text-muted' }
}

const CYCLE_LABEL = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

function PolicyForm({ onSubmit, onCancel, defaultCurrency, initial }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState(initial || {
    name: '',
    amount: '',
    currency: defaultCurrency,
    billing_cycle: 'yearly',
    next_due_date: today,
    category: 'Life',
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

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
        <label className="block text-sm font-medium text-text-secondary mb-1">Policy / Provider Name</label>
        <input type="text" placeholder="e.g. AIA Life Shield, NTUC Income" value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text-secondary mb-1">Premium Amount</label>
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
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Next Due Date</label>
        <input type="date" value={form.next_due_date} onChange={e => set('next_due_date', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus">
          {INSURANCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : initial ? 'Save' : 'Add Policy'}
        </button>
      </div>
    </form>
  )
}

export default function Insurance() {
  const { defaultCurrency, showToast } = useContext(SettingsContext)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const { policies, loading, addPolicy, updatePolicy, deletePolicy, markPaid } = useInsurance()

  const yearlyTotal = policies
    .filter(p => p.currency === defaultCurrency)
    .reduce((sum, p) => {
      const amt = parseFloat(p.amount)
      if (p.billing_cycle === 'monthly') return sum + amt * 12
      if (p.billing_cycle === 'yearly') return sum + amt
      return sum
    }, 0)

  async function handleAdd(data) {
    await addPolicy(data)
    setShowForm(false)
    showToast('Policy added')
  }

  async function handleUpdate(id, data) {
    await updatePolicy(id, data)
    setEditing(null)
    showToast('Policy updated')
  }

  async function handleMarkPaid(policy) {
    await markPaid(policy)
    showToast('Marked as paid')
  }

  return (
    <div className="space-y-4 pb-44">
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex justify-between items-center">
        <span className="text-sm text-accent font-medium">Est. yearly cost ({defaultCurrency})</span>
        <span className="font-bold text-accent">{formatAmount(yearlyTotal, defaultCurrency)}</span>
      </div>

      <button onClick={() => setShowForm(true)}
        className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium">
        + Add Policy
      </button>

      {loading ? (
        <div className="text-center text-text-muted py-8 text-sm">Loading...</div>
      ) : policies.length === 0 ? (
        <EmptyState icon="🛡️" message="No insurance policies yet" sub="Track your insurance premiums and due dates" />
      ) : (
        <div className="space-y-2">
          {policies.map(policy => {
            const days = daysUntilDue(policy.next_due_date)
            const badge = dueBadge(days)
            return (
              <div key={policy.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(policy)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">{policy.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {CYCLE_LABEL[policy.billing_cycle]} · {policy.category} · Next: {policy.next_due_date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary text-sm whitespace-nowrap">
                    {formatAmount(policy.amount, policy.currency)}
                  </span>
                  <button onClick={() => handleMarkPaid(policy)}
                    className="text-xs text-positive hover:text-positive border border-positive rounded-lg px-3 py-1.5 font-medium">Paid</button>
                  <button onClick={() => setDeleting(policy.id)} className="text-text-muted hover:text-danger text-2xl leading-none p-1">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Add Insurance Policy" onClose={() => setShowForm(false)}>
          <PolicyForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} defaultCurrency={defaultCurrency} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Policy" onClose={() => setEditing(null)}>
          <PolicyForm
            onSubmit={(data) => handleUpdate(editing.id, data)}
            onCancel={() => setEditing(null)}
            defaultCurrency={defaultCurrency}
            initial={{ name: editing.name, amount: String(editing.amount), currency: editing.currency, billing_cycle: editing.billing_cycle, next_due_date: editing.next_due_date, category: editing.category ?? 'Life' }}
          />
        </Modal>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-text-primary font-medium mb-4">Delete this policy?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
              <button onClick={async () => { await deletePolicy(deleting); setDeleting(null) }} className="flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
