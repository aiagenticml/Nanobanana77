import { useState, useContext, useMemo } from 'react'
import { SettingsContext } from '../App'
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

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

function getDateRange(period) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (period === 'daily') {
    const dateStr = today.toISOString().split('T')[0]
    return { startDate: dateStr, endDate: dateStr }
  }

  if (period === 'weekly') {
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((day + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    }
  }

  // monthly
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  return {
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  }
}

function getPeriodLabel(period) {
  if (period === 'daily') return "Today's spending"
  if (period === 'weekly') return "This week's spending"
  return "This month's spending"
}

function getUpcomingPayments(subscriptions, months = 3) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setMonth(cutoff.getMonth() + months)

  const payments = []
  subscriptions.forEach(sub => {
    const due = new Date(sub.next_due_date)
    due.setHours(0, 0, 0, 0)
    while (due <= cutoff) {
      if (due >= today) {
        payments.push({ ...sub, projected_date: new Date(due) })
      }
      if (sub.billing_cycle === 'monthly') due.setMonth(due.getMonth() + 1)
      else if (sub.billing_cycle === 'yearly') due.setFullYear(due.getFullYear() + 1)
      else if (sub.billing_cycle === 'weekly') due.setDate(due.getDate() + 7)
      else break
    }
  })
  return payments.sort((a, b) => a.projected_date - b.projected_date)
}

function formatProjectedDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Dashboard() {
  const { defaultCurrency } = useContext(SettingsContext)
  const [period, setPeriod] = useState('monthly')
  const [billsOpen, setBillsOpen] = useState(false)

  const dateRange = useMemo(() => getDateRange(period), [period])
  const { expenses, loading: expLoading } = useExpenses(dateRange)
  const { loans, loading: loanLoading } = useLoans()
  const { subscriptions, loading: subLoading } = useSubscriptions()

  const loading = expLoading || loanLoading || subLoading

  const totalDebt = loans
    .filter(l => (l.currency ?? defaultCurrency) === defaultCurrency)
    .reduce((sum, l) => sum + getRemainingBalance(l), 0)

  const filtered = expenses.filter(e => e.currency === defaultCurrency)
  const periodTotal = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const byCategory = filtered.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
    return acc
  }, {})

  const upcomingPayments = useMemo(() => getUpcomingPayments(subscriptions), [subscriptions])
  const billCount = upcomingPayments.length

  // Group upcoming payments by month
  const paymentsByMonth = useMemo(() => {
    const groups = {}
    upcomingPayments.forEach(p => {
      const key = getMonthLabel(p.projected_date)
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })
    return groups
  }, [upcomingPayments])

  if (loading) {
    return <div className="text-center text-gray-400 py-16 text-sm">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* Expenditure overview with period toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">{getPeriodLabel(period)} ({defaultCurrency})</p>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === p.key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-3xl font-bold text-gray-800">{formatAmount(periodTotal, defaultCurrency)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {dateRange.startDate === dateRange.endDate
            ? dateRange.startDate
            : `${dateRange.startDate} — ${dateRange.endDate}`}
          {' · '}{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </p>

        {Object.keys(byCategory).length > 0 && (
          <div className="mt-3 space-y-2">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-600 flex-1">{cat}</span>
                  <span className="text-xs font-medium text-gray-800">{formatAmount(amt, defaultCurrency)}</span>
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-300'}`}
                      style={{ width: `${periodTotal > 0 ? (amt / periodTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Total debt */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Total outstanding debt ({defaultCurrency})</p>
        <p className="text-2xl font-bold text-red-500">{formatAmount(totalDebt, defaultCurrency)}</p>
        <p className="text-xs text-gray-400 mt-1">{loans.length} active loan{loans.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Bills to be paid — clickable, expands to show next 3 months */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setBillsOpen(!billsOpen)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div>
            <p className="text-sm text-gray-500">Bills to be paid</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {billCount === 0
                ? 'No upcoming bills'
                : `${billCount} payment${billCount !== 1 ? 's' : ''} in the next 3 months`}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${billsOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {billsOpen && (
          <div className="px-4 pb-4 space-y-4">
            {billCount === 0 ? (
              <p className="text-sm text-green-600">All clear! No payments due in the next 3 months.</p>
            ) : (
              Object.entries(paymentsByMonth).map(([monthLabel, payments]) => (
                <div key={monthLabel}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{monthLabel}</p>
                  <div className="space-y-2">
                    {payments.map((p, i) => {
                      const days = daysUntilDue(p.projected_date.toISOString().split('T')[0])
                      return (
                        <div key={`${p.id}-${i}`} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-gray-800">{p.name}</span>
                            <span className="ml-2 text-xs text-gray-400">
                              {days === 0 ? 'today' : days < 0 ? `${Math.abs(days)}d overdue` : formatProjectedDate(p.projected_date)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{formatAmount(p.amount, p.currency)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
