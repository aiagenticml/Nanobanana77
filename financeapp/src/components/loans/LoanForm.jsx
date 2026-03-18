import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'
import ImageUpload from '../shared/ImageUpload'

export default function LoanForm({ loan, onSubmit, onCancel }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const today = new Date().toISOString().split('T')[0]
  const isEdit = !!loan

  const [form, setForm] = useState({
    name: loan?.name ?? '',
    principal: loan ? String(loan.principal) : '',
    interest_rate: loan ? String(loan.interest_rate) : '',
    term_months: loan ? String(loan.term_months) : '',
    start_date: loan?.start_date ?? today,
    loan_type: loan?.loan_type ?? 'reducing',
    currency: loan?.currency ?? defaultCurrency,
    statement_url: loan?.statement_url ?? null,
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
        ...form,
        principal: parseFloat(form.principal),
        interest_rate: parseFloat(form.interest_rate),
        term_months: parseInt(form.term_months),
      })
    } finally {
      setSaving(false)
    }
  }

  const isReducing = form.loan_type === 'reducing'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Loan Name</label>
        <input type="text" placeholder="e.g. Car Loan, DBS Personal Loan" value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Loan Type</label>
        <div className="flex gap-2">
          {['reducing', 'flat'].map(type => (
            <button key={type} type="button"
              onClick={() => set('loan_type', type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.loan_type === type ? 'bg-accent text-white border-accent' : 'border-border text-text-secondary'
              }`}>
              {type === 'reducing' ? 'Reducing Balance' : 'Flat Rate'}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-1">
          {isReducing
            ? 'Interest calculated on remaining balance. Used by most banks (HDB loan, car loan, etc.)'
            : 'Interest calculated on original amount. Common for personal loans / moneylenders.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Principal Amount ({defaultCurrency})
          <span className="font-normal text-text-muted"> — the total amount you borrowed</span>
        </label>
        <input type="number" step="0.01" min="0" placeholder="50000" value={form.principal}
          onChange={e => set('principal', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Annual Interest Rate (%)
          <span className="font-normal text-text-muted">
            {isReducing ? ' — e.g. 4.5 for 4.5% p.a.' : ' — flat rate p.a., e.g. 3.5 means you pay 3.5% of principal each year'}
          </span>
        </label>
        <input type="number" step="0.01" min="0" placeholder={isReducing ? '4.5' : '3.5'} value={form.interest_rate}
          onChange={e => set('interest_rate', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Loan Tenure
          <span className="font-normal text-text-muted"> — total number of months to repay</span>
        </label>
        <input type="number" min="1" placeholder="60 (= 5 years)" value={form.term_months}
          onChange={e => set('term_months', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Start Date
          <span className="font-normal text-text-muted"> — when your first repayment began</span>
        </label>
        <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus" required />
      </div>

      <ImageUpload label="Loan Statement (optional)" value={form.statement_url}
        onChange={url => set('statement_url', url)} folder="statements" />

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Loan'}
        </button>
      </div>
    </form>
  )
}
