import { formatAmount } from '../../lib/currencyUtils'
import { daysUntilDue } from '../../hooks/useSubscriptions'
import EmptyState from '../shared/EmptyState'

function dueBadge(days) {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-red-100 text-red-700' }
  if (days === 0) return { label: 'Due today!', cls: 'bg-red-100 text-red-700' }
  if (days <= 3) return { label: `${days}d left`, cls: 'bg-red-100 text-red-700' }
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-orange-100 text-orange-700' }
  return { label: `${days}d left`, cls: 'bg-gray-100 text-gray-500' }
}

const CYCLE_LABEL = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

export default function SubscriptionList({ subscriptions, onDelete, onMarkPaid }) {
  if (subscriptions.length === 0) {
    return <EmptyState icon="🔄" message="No subscriptions yet" sub="Track your recurring expenses" />
  }

  return (
    <div className="space-y-2">
      {subscriptions.map(sub => {
        const days = daysUntilDue(sub.next_due_date)
        const badge = dueBadge(days)
        return (
          <div key={sub.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 text-sm">{sub.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {CYCLE_LABEL[sub.billing_cycle]} · {sub.category} · Next: {sub.next_due_date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">
                {formatAmount(sub.amount, sub.currency)}
              </span>
              <button onClick={() => onMarkPaid(sub)}
                className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded px-1.5 py-0.5">
                Paid
              </button>
              <button onClick={() => onDelete(sub.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
