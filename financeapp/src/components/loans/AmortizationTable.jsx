import { useMemo } from 'react'
import { generateAmortizationSchedule } from '../../lib/loanCalc'
import { formatAmount } from '../../lib/currencyUtils'

export default function AmortizationTable({ loan, currency }) {
  const schedule = useMemo(() => generateAmortizationSchedule(loan), [loan])

  return (
    <div className="overflow-x-auto max-h-64 text-xs rounded-lg border border-border">
      <table className="w-full bg-card">
        <thead className="bg-base sticky top-0">
          <tr>
            <th className="px-2 py-2 text-left text-text-secondary font-medium">Month</th>
            <th className="px-2 py-2 text-right text-text-secondary font-medium">Payment</th>
            <th className="px-2 py-2 text-right text-text-secondary font-medium">Principal</th>
            <th className="px-2 py-2 text-right text-text-secondary font-medium">Interest</th>
            <th className="px-2 py-2 text-right text-text-secondary font-medium">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {schedule.map(row => (
            <tr key={row.month} className="hover:bg-base">
              <td className="px-2 py-1.5 text-text-secondary">{row.month}</td>
              <td className="px-2 py-1.5 text-right font-mono text-highlight">{formatAmount(row.payment, currency)}</td>
              <td className="px-2 py-1.5 text-right font-mono text-highlight">{formatAmount(row.principalPaid, currency)}</td>
              <td className="px-2 py-1.5 text-right font-mono text-danger">{formatAmount(row.interest, currency)}</td>
              <td className="px-2 py-1.5 text-right font-mono text-highlight">{formatAmount(row.closingBalance, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
