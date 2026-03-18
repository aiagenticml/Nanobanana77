import { useMemo, useState } from 'react'
import { formatAmount } from '../../lib/currencyUtils'
import {
  calculateReducingPMT, calculateFlatPMT, calculateTotalInterest,
  getRemainingBalance, getPayoffDate
} from '../../lib/loanCalc'
import AmortizationTable from './AmortizationTable'

export default function LoanCard({ loan, onDelete, onEdit }) {
  const [showTable, setShowTable] = useState(false)
  const [viewingStatement, setViewingStatement] = useState(false)

  const monthly = useMemo(() => {
    return loan.loan_type === 'flat'
      ? calculateFlatPMT(loan.principal, loan.interest_rate, loan.term_months)
      : calculateReducingPMT(loan.principal, loan.interest_rate, loan.term_months)
  }, [loan])

  const totalInterest = useMemo(() =>
    calculateTotalInterest(loan.principal, loan.interest_rate, loan.term_months, loan.loan_type),
    [loan])

  const remaining = useMemo(() => getRemainingBalance(loan), [loan])
  const pct = Math.max(0, Math.min(100, ((loan.principal - remaining) / loan.principal) * 100))
  const currency = loan.currency ?? 'SGD'

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="cursor-pointer flex-1" onClick={() => onEdit?.(loan)}>
          <h3 className="font-semibold text-text-primary">{loan.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-base border border-border text-text-secondary capitalize">
            {loan.loan_type === 'reducing' ? 'Reducing Balance' : 'Flat Rate'} · {loan.interest_rate}% p.a.
          </span>
        </div>
        <button onClick={() => onDelete(loan.id)} className="text-text-muted hover:text-danger text-2xl leading-none p-1">×</button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Remaining: <strong className="text-text-primary">{formatAmount(remaining, currency)}</strong></span>
          <span>{pct.toFixed(0)}% paid</span>
        </div>
        <div className="h-2 bg-base rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all progress-animate" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-base rounded-lg p-2">
          <p className="text-xs text-text-muted">Monthly</p>
          <p className="text-sm font-semibold text-text-primary">{formatAmount(monthly, currency)}</p>
        </div>
        <div className="bg-base rounded-lg p-2">
          <p className="text-xs text-text-muted">Total Interest</p>
          <p className="text-sm font-semibold text-danger">{formatAmount(totalInterest, currency)}</p>
        </div>
        <div className="bg-base rounded-lg p-2">
          <p className="text-xs text-text-muted">Payoff</p>
          <p className="text-sm font-semibold text-text-primary">{getPayoffDate(loan)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setShowTable(v => !v)}
          className="text-xs text-accent hover:underline">
          {showTable ? 'Hide' : 'Show'} amortization schedule
        </button>
        {loan.statement_url && (
          <button onClick={() => setViewingStatement(true)}
            className="text-xs text-accent hover:underline">
            View statement
          </button>
        )}
      </div>

      {showTable && <AmortizationTable loan={loan} currency={currency} />}

      {viewingStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setViewingStatement(false)}>
          <img src={loan.statement_url} alt="Loan Statement" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
