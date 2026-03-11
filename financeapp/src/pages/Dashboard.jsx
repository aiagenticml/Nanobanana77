import { useExpenses } from '../hooks/useExpenses'
import { useLoans } from '../hooks/useLoans'
import { useSubscriptions, daysUntilDue } from '../hooks/useSubscriptions'
import { formatAmount } from '../lib/currencyUtils'
import { getRemainingBalance } from '../lib/loanCalc'

const CATEGORY_COLORS = {
  Food: 'bg-orange-400', Transport: 'bg-blue-400', Shopping: 'bg-pink-400',
  Entertainment: 'bg-purple-400', Health: 'bg-green-400', Education: 'bg-yellow-400',
  Utilities: 'bg-gray-400', Groceries: 'bg-lime-400', Travel: 'bg-cyan-400', Other: 'bg-gray-300',
}

export default function Dashboard() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const { expenses, totalForMonth, totalByCategory, loading: expLoading } = useExpenses({ month: currentMonth })
  const { loans, loading: loanLoading } = useLoans()
  const { subscriptions, loading: subLoading } = useSubscriptions()

  const totalDebt = loans.reduce((sum, l) => sum + getRemainingBalance(l), 0)
  const monthTotal = totalForMonth()
  const byCategory = totalByCategory()
  const upcomingSubs = subscriptions.filter(s => daysUntilDue(s.next_due_date) <= 7)

  return (
    <div className="space-y-4">
      {/* Monthly spend */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">This month's spending</p>
        <p className="text-3xl font-bold text-gray-800">{formatAmount(monthTotal)}</p>
        <p className="text-xs text-gray-400 mt-1">{currentMonth} · {expenses.length} transactions</p>

        {Object.keys(byCategory).length > 0 && (
          <div className="mt-3 space-y-2">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-600 flex-1">{cat}</span>
                  <span className="text-xs font-medium text-gray-800">{formatAmount(amt)}</span>
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-300'}`}
                      style={{ width: `${(amt / monthTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Total debt */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Total outstanding debt</p>
        <p className="text-2xl font-bold text-red-500">{formatAmount(totalDebt)}</p>
        <p className="text-xs text-gray-400 mt-1">{loans.length} active loan{loans.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Upcoming subscriptions */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-2">Due within 7 days</p>
        {upcomingSubs.length === 0 ? (
          <p className="text-sm text-green-600">All clear! No payments due soon.</p>
        ) : (
          <div className="space-y-2">
            {upcomingSubs.map(s => {
              const days = daysUntilDue(s.next_due_date)
              return (
                <div key={s.id} className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    <span className="ml-2 text-xs text-red-500">
                      {days === 0 ? 'today' : days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{formatAmount(s.amount, s.currency)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
