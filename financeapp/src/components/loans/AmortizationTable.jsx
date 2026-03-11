import { useMemo } from 'react'
import { generateAmortizationSchedule } from '../../lib/loanCalc'
import { formatAmount } from '../../lib/currencyUtils'

export default function AmortizationTable({ loan, currency }) {
  const schedule = useMemo(() => generateAmortizationSchedule(loan), [loan])

  return (
    <div className="overflow-x-auto max-h-64 text-xs rounded-lg border border-gray-100">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-2 py-2 text-left text-gray-500 font-medium">Month</th>
            <th className="px-2 py-2 text-right text-gray-500 font-medium">Payment</th>
            <th className="px-2 py-2 text-right text-gray-500 font-medium">Principal</th>
            <th className="px-2 py-2 text-right text-gray-500 font-medium">Interest</th>
            <th className="px-2 py-2 text-right text-gray-500 font-medium">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {schedule.map(row => (
            <tr key={row.month} className="hover:bg-gray-50">
              <td className="px-2 py-1.5 text-gray-600">{row.month}</td>
              <td className="px-2 py-1.5 text-right text-gray-800">{formatAmount(row.payment, currency)}</td>
              <td className="px-2 py-1.5 text-right text-blue-600">{formatAmount(row.principalPaid, currency)}</td>
              <td className="px-2 py-1.5 text-right text-red-400">{formatAmount(row.interest, currency)}</td>
              <td className="px-2 py-1.5 text-right text-gray-600">{formatAmount(row.closingBalance, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
