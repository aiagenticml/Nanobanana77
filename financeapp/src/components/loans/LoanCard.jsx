import { useMemo, useState } from 'react'
import { formatAmount } from '../../lib/currencyUtils'
import {
  calculateReducingPMT, calculateFlatPMT, calculateTotalInterest,
  getRemainingBalance, getPayoffDate
} from '../../lib/loanCalc'
import AmortizationTable from './AmortizationTable'

export default function LoanCard({ loan, onDelete }) {
  const [showTable, setShowTable] = useState(false)

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
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{loan.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
            {loan.loan_type === 'reducing' ? 'Reducing Balance' : 'Flat Rate'} · {loan.interest_rate}% p.a.
          </span>
        </div>
        <button onClick={() => onDelete(loan.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Remaining: <strong className="text-gray-800">{formatAmount(remaining, currency)}</strong></span>
          <span>{pct.toFixed(0)}% paid</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Monthly</p>
          <p className="text-sm font-semibold text-gray-800">{formatAmount(monthly, currency)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Total Interest</p>
          <p className="text-sm font-semibold text-red-500">{formatAmount(totalInterest, currency)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Payoff</p>
          <p className="text-sm font-semibold text-gray-800">{getPayoffDate(loan)}</p>
        </div>
      </div>

      <button onClick={() => setShowTable(v => !v)}
        className="text-xs text-blue-600 hover:underline w-full text-left">
        {showTable ? 'Hide' : 'Show'} amortization schedule
      </button>

      {showTable && <AmortizationTable loan={loan} currency={currency} />}
    </div>
  )
}
