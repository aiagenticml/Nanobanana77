import { useState } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import QuickAddBar from '../components/expenses/QuickAddBar'
import ExpenseList from '../components/expenses/ExpenseList'
import ExpenseForm from '../components/expenses/ExpenseForm'
import Modal from '../components/shared/Modal'
import { formatAmount } from '../lib/currencyUtils'

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date()
  d.setMonth(d.getMonth() - i)
  return d.toISOString().slice(0, 7)
})

export default function Expenses() {
  const [showForm, setShowForm] = useState(false)
  const [month, setMonth] = useState(MONTHS[0])
  const { expenses, loading, addExpense, deleteExpense, totalForMonth } = useExpenses({ month })

  async function handleAdd(data) {
    await addExpense(data)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Total: {formatAmount(totalForMonth())}
        </span>
      </div>

      <QuickAddBar onAdd={addExpense} />

      <button onClick={() => setShowForm(true)}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
        + Add with full form
      </button>

      {loading ? (
        <div className="text-center text-gray-400 py-8 text-sm">Loading...</div>
      ) : (
        <ExpenseList expenses={expenses} onDelete={deleteExpense} />
      )}

      {showForm && (
        <Modal title="Add Expense" onClose={() => setShowForm(false)}>
          <ExpenseForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
