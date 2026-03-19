import { useState, useContext, useMemo } from 'react'
import { SettingsContext } from '../App'
import { useExpenses } from '../hooks/useExpenses'
import { useSubscriptions, daysUntilDue } from '../hooks/useSubscriptions'
import { useInsurance } from '../hooks/useInsurance'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { formatAmount } from '../lib/currencyUtils'
import PeriodSelector from '../components/shared/PeriodSelector'
import { getDateRange } from '../lib/dateRange'

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
  const [period, setPeriod] = useState('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [billsOpen, setBillsOpen] = useState(false)

  const dateRange = useMemo(() => getDateRange(period, selectedDate), [period, selectedDate])
  const { expenses, loading: expLoading } = useExpenses(dateRange)
  const { subscriptions, loading: subLoading } = useSubscriptions()
  const { policies, loading: insLoading } = useInsurance()
  const currentMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
  const { budget, items: budgetItems, loading: budgetLoading } = useBudgets(currentMonth)
  const { colorMap } = useCategories()

  const loading = expLoading || subLoading || insLoading || budgetLoading

  const filtered = expenses.filter(e => e.currency === defaultCurrency)
  const periodTotal = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const byCategory = filtered.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
    return acc
  }, {})

  const upcomingPayments = useMemo(() => {
    const subPayments = getUpcomingPayments(subscriptions).map(p => ({ ...p, _source: 'subscription' }))
    const insPayments = getUpcomingPayments(policies).map(p => ({ ...p, _source: 'insurance' }))
    return [...subPayments, ...insPayments].sort((a, b) => a.projected_date - b.projected_date)
  }, [subscriptions, policies])
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

  // Budget widget helpers
  const totalAllocated = budgetItems.reduce((sum, it) => sum + parseFloat(it.allocated_amount || 0), 0)
  const budgetSpent = periodTotal
  const budgetTotal = budget ? Math.max(0, parseFloat(budget.total_allowance) - totalAllocated) : 0
  const budgetRatio = budgetTotal > 0 ? budgetSpent / budgetTotal : 0
  const budgetPct = Math.round(budgetRatio * 100)
  const budgetBarColor = budgetRatio > 1 ? 'bg-danger' : budgetRatio >= 0.8 ? 'bg-warning' : 'bg-positive'

  if (loading) {
    return <div className="text-center text-text-muted py-16 text-sm">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Expenditure overview */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-text-secondary mb-2">
          Spending ({defaultCurrency})
        </p>

        <p className="text-3xl font-mono text-highlight transition-opacity duration-150">
          {formatAmount(periodTotal, defaultCurrency)}
        </p>
        <p className="text-xs text-text-muted mt-1">
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
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorMap[cat]?.hex || '#9a8e80' }}
                  />
                  <span className="text-xs text-text-primary flex-1">{cat}</span>
                  <span className="text-xs font-mono text-highlight">{formatAmount(amt, defaultCurrency)}</span>
                  <div className="w-20 h-1.5 bg-base rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${periodTotal > 0 ? (amt / periodTotal) * 100 : 0}%`,
                        backgroundColor: colorMap[cat]?.hex || '#9a8e80',
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Budget summary */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-text-secondary mb-2">Budget</p>
        {budget === null ? (
          <p className="text-text-muted text-sm">No budget set</p>
        ) : (
          <>
            <p className="text-sm text-text-primary mb-2">
              Budget: {formatAmount(budgetSpent, defaultCurrency)} / {formatAmount(budgetTotal, defaultCurrency)}
            </p>
            <div className="bg-base rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${budgetBarColor} progress-animate`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{budgetPct}% used</p>
          </>
        )}
      </div>

      {/* Bills to be paid — clickable, expands to show next 3 months */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setBillsOpen(!billsOpen)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div>
            <p className="text-sm text-text-secondary">Bills to be paid</p>
            <p className="text-xs text-text-muted mt-0.5">
              {billCount === 0
                ? 'No upcoming bills'
                : `${billCount} payment${billCount !== 1 ? 's' : ''} in the next 3 months`}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${billsOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {billsOpen && (
          <div className="px-4 pb-4 space-y-4">
            {billCount === 0 ? (
              <p className="text-sm text-positive">All clear! No payments due in the next 3 months.</p>
            ) : (
              Object.entries(paymentsByMonth).map(([monthLabel, payments]) => (
                <div key={monthLabel}>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">{monthLabel}</p>
                  <div className="space-y-2">
                    {payments.map((p, i) => {
                      const days = daysUntilDue(p.projected_date.toISOString().split('T')[0])
                      return (
                        <div key={`${p.id}-${i}`} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-text-primary">{p.name}</span>
                            {p._source === 'insurance' && (
                              <span className="ml-1.5 text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">ins</span>
                            )}
                            <span className={`ml-2 text-xs ${
                              days < 0 ? 'text-danger'
                                : days <= 7 ? 'text-warning'
                                : 'text-text-muted'
                            }`}>
                              {days === 0 ? 'today' : days < 0 ? `${Math.abs(days)}d overdue` : formatProjectedDate(p.projected_date)}
                            </span>
                          </div>
                          <span className="text-sm font-mono text-highlight">{formatAmount(p.amount, p.currency)}</span>
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
