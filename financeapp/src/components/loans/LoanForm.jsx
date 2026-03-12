import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Name</label>
        <input type="text" placeholder="e.g. Car Loan, DBS Personal Loan" value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
        <div className="flex gap-2">
          {['reducing', 'flat'].map(type => (
            <button key={type} type="button"
              onClick={() => set('loan_type', type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.loan_type === type ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'
              }`}>
              {type === 'reducing' ? 'Reducing Balance' : 'Flat Rate'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {isReducing
            ? 'Interest calculated on remaining balance. Used by most banks (HDB loan, car loan, etc.)'
            : 'Interest calculated on original amount. Common for personal loans / moneylenders.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Principal Amount ({defaultCurrency})
          <span className="font-normal text-gray-400"> — the total amount you borrowed</span>
        </label>
        <input type="number" step="0.01" min="0" placeholder="50000" value={form.principal}
          onChange={e => set('principal', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Annual Interest Rate (%)
          <span className="font-normal text-gray-400">
            {isReducing ? ' — e.g. 4.5 for 4.5% p.a.' : ' — flat rate p.a., e.g. 3.5 means you pay 3.5% of principal each year'}
          </span>
        </label>
        <input type="number" step="0.01" min="0" placeholder={isReducing ? '4.5' : '3.5'} value={form.interest_rate}
          onChange={e => set('interest_rate', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Loan Tenure
          <span className="font-normal text-gray-400"> — total number of months to repay</span>
        </label>
        <input type="number" min="1" placeholder="60 (= 5 years)" value={form.term_months}
          onChange={e => set('term_months', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
          <span className="font-normal text-gray-400"> — when your first repayment began</span>
        </label>
        <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Loan'}
        </button>
      </div>
    </form>
  )
}
