import { useState, useContext, useMemo } from 'react'
import { SettingsContext } from '../App'
import { useExpenses } from '../hooks/useExpenses'
import { CATEGORIES } from '../components/expenses/ExpenseForm'
import QuickAddBar from '../components/expenses/QuickAddBar'
import ExpenseList from '../components/expenses/ExpenseList'
import ExpenseForm from '../components/expenses/ExpenseForm'
import Modal from '../components/shared/Modal'
import ErrorBanner from '../components/shared/ErrorBanner'
import { formatAmount } from '../lib/currencyUtils'

function generateMonths(count) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })
}

function formatMonth(ym) {
  const [y, m] = ym.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Expenses() {
  const { defaultCurrency, showToast, userId } = useContext(SettingsContext)
  const [showForm, setShowForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const months = useMemo(() => generateMonths(24), [])
  const [month, setMonth] = useState(months[0])
  const { expenses, loading, error, addExpense, updateExpense, deleteExpense, totalForMonth } = useExpenses(userId, { month, category: categoryFilter || undefined })

  async function handleAdd(data) {
    await addExpense(data)
    setShowForm(false)
    showToast('Expense added')
  }

  async function handleQuickAdd(data) {
    await addExpense(data)
    showToast('Expense added')
  }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />

      <div className="flex items-center gap-2">
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Total: {formatAmount(totalForMonth(defaultCurrency), defaultCurrency)}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCategoryFilter('')}
          className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${!categoryFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {c}
          </button>
        ))}
      </div>

      <QuickAddBar onAdd={handleQuickAdd} />

      <button onClick={() => setShowForm(true)}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
        + Add with full form
      </button>

      {loading ? (
        <div className="text-center text-gray-400 py-8 text-sm">Loading...</div>
      ) : (
        <ExpenseList expenses={expenses} onDelete={deleteExpense} onUpdate={updateExpense} />
      )}

      {showForm && (
        <Modal title="Add Expense" onClose={() => setShowForm(false)}>
          <ExpenseForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
