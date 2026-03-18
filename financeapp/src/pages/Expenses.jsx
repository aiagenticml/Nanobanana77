import { useState, useContext, useMemo } from 'react'
import { SettingsContext } from '../App'
import { useExpenses } from '../hooks/useExpenses'
import { useCategories } from '../hooks/useCategories'
import PeriodSelector from '../components/shared/PeriodSelector'
import { getDateRange } from '../lib/dateRange'
import CategoryWidgets from '../components/expenses/CategoryWidgets'
import CategoryManager from '../components/expenses/CategoryManager'
import QuickAddBar from '../components/expenses/QuickAddBar'
import ExpenseList from '../components/expenses/ExpenseList'
import ExpenseForm from '../components/expenses/ExpenseForm'
import Modal from '../components/shared/Modal'
import ErrorBanner from '../components/shared/ErrorBanner'
import { formatAmount } from '../lib/currencyUtils'

export default function Expenses() {
  const { defaultCurrency, showToast } = useContext(SettingsContext)
  const [showForm, setShowForm] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [period, setPeriod] = useState('month')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const { categories, categoryNames, keywordMap, colorMap, addCategory, updateCategory, deleteCategory } = useCategories()

  const dateRange = useMemo(() => getDateRange(period, selectedDate), [period, selectedDate])

  const { expenses, loading, error, addExpense, updateExpense, deleteExpense, totalForMonth } = useExpenses({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    category: categoryFilter || undefined,
  })

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

      {/* Period selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Total */}
      <div className="text-sm font-medium text-text-secondary">
        Total: <span className="font-mono text-highlight">{formatAmount(totalForMonth(defaultCurrency), defaultCurrency)}</span>
      </div>

      {/* Category widgets */}
      <CategoryWidgets
        categories={categories}
        expenses={expenses}
        selectedCategory={categoryFilter}
        onSelect={setCategoryFilter}
        onManageClick={() => setShowManager(v => !v)}
        defaultCurrency={defaultCurrency}
      />

      {/* Category manager */}
      {showManager && (
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />
      )}

      {/* Quick add */}
      <QuickAddBar onAdd={handleQuickAdd} keywordMap={keywordMap} categoryNames={categoryNames} />

      {/* Full form button */}
      <button onClick={() => setShowForm(true)}
        className="w-full py-2 border-2 border-dashed border-border rounded-xl text-sm text-text-muted hover:border-accent hover:text-accent transition-colors">
        + Add with full form
      </button>

      {/* Expense list */}
      {loading ? (
        <div className="text-center text-text-muted py-8 text-sm">Loading...</div>
      ) : (
        <ExpenseList
          expenses={expenses}
          onDelete={deleteExpense}
          onUpdate={updateExpense}
          colorMap={colorMap}
          categories={categoryNames}
        />
      )}

      {/* Add expense modal */}
      {showForm && (
        <Modal title="Add Expense" onClose={() => setShowForm(false)}>
          <ExpenseForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} categories={categoryNames} />
        </Modal>
      )}
    </div>
  )
}
