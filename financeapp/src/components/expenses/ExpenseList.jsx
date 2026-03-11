import { formatAmount } from '../../lib/currencyUtils'
import EmptyState from '../shared/EmptyState'

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

export default function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return <EmptyState icon="💸" message="No expenses yet" sub="Use the quick add bar or tap + Add" />
  }

  return (
    <div className="space-y-2">
      {expenses.map(e => (
        <div key={e.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="flex-1 min-w-0">
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
            <button onClick={() => onDelete(e.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}
