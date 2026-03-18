import { useState, useContext, useMemo } from 'react'
import { SettingsContext } from '../App'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useExpenses } from '../hooks/useExpenses'
import { formatAmount } from '../lib/currencyUtils'
import BudgetProgress from '../components/budget/BudgetProgress'
import BudgetForm from '../components/budget/BudgetForm'
import EmptyState from '../components/shared/EmptyState'
import ErrorBanner from '../components/shared/ErrorBanner'

function buildMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export default function Budget() {
  const { defaultCurrency } = useContext(SettingsContext)
  const monthOptions = useMemo(() => buildMonthOptions(), [])

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(currentMonth)

  const { budget, items, loading, error, createBudget, updateAllowance, addItem, updateItem, deleteItem } = useBudgets(month)
  const { categoryNames } = useCategories()
  const { totalByCategory } = useExpenses({ month })

  const [showForm, setShowForm] = useState(false)
  const [newAllowance, setNewAllowance] = useState('')
  const [editingAllowance, setEditingAllowance] = useState(false)
  const [editAllowanceValue, setEditAllowanceValue] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [editItemData, setEditItemData] = useState({})

  const spendByCategory = totalByCategory(defaultCurrency)

  const totalAllocated = items.reduce((sum, it) => sum + parseFloat(it.allocated_amount || 0), 0)
  const totalSpent = items.reduce((sum, it) => {
    if (it.linked_expense_category) {
      return sum + (spendByCategory[it.linked_expense_category] || 0)
    }
    return sum
  }, 0)
  const totalAllowance = parseFloat(budget?.total_allowance || 0)

  const allocatedRatio = totalAllowance > 0 ? totalAllocated / totalAllowance : 0
  const spentRatio = totalAllocated > 0 ? totalSpent / totalAllocated : 0

  function getAllocatedColor() {
    if (allocatedRatio > 1) return 'text-danger'
    if (allocatedRatio >= 0.8) return 'text-warning'
    return 'text-positive'
  }

  function getSpentColor() {
    if (spentRatio > 1) return 'text-danger'
    if (spentRatio >= 0.8) return 'text-warning'
    return 'text-positive'
  }

  async function handleCreateBudget() {
    const amount = parseFloat(newAllowance)
    if (!amount || amount <= 0) return
    try {
      await createBudget(amount)
      setNewAllowance('')
    } catch {}
  }

  async function handleSaveAllowance() {
    const amount = parseFloat(editAllowanceValue)
    if (!amount || amount <= 0 || !budget) return
    try {
      await updateAllowance(budget.id, amount)
      setEditingAllowance(false)
    } catch {}
  }

  async function handleAddItem(data) {
    try {
      await addItem(data)
      setShowForm(false)
    } catch {}
  }

  async function handleDeleteItem(itemId) {
    try {
      await deleteItem(itemId)
    } catch {}
  }

  function startEditItem(item) {
    setEditingItemId(item.id)
    setEditItemData({
      category_name: item.category_name,
      allocated_amount: item.allocated_amount,
      linked_expense_category: item.linked_expense_category || '',
    })
  }

  async function handleSaveItem() {
    try {
      await updateItem(editingItemId, {
        category_name: editItemData.category_name,
        allocated_amount: parseFloat(editItemData.allocated_amount),
        linked_expense_category: editItemData.linked_expense_category || null,
      })
      setEditingItemId(null)
      setEditItemData({})
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-36">
      {error && <ErrorBanner message={error} onDismiss={() => {}} />}

      {/* Month selector */}
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      >
        {monthOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Total Allowance */}
      {!budget ? (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-text-secondary text-sm">Set your budget for this month</p>
          <input
            type="number"
            placeholder="Total allowance"
            step="0.01"
            min="0"
            value={newAllowance}
            onChange={(e) => setNewAllowance(e.target.value)}
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
          />
          <button
            onClick={handleCreateBudget}
            className="w-full bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
          >
            Create Budget
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-text-muted text-xs mb-1">Total Allowance</p>
          {editingAllowance ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={editAllowanceValue}
                onChange={(e) => setEditAllowanceValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAllowance()}
                autoFocus
                className="flex-1 bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              />
              <button
                onClick={handleSaveAllowance}
                className="bg-accent text-white rounded-lg px-3 py-2 text-sm hover:bg-accent-hover transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingAllowance(false)}
                className="border border-border text-text-secondary rounded-lg px-3 py-2 text-sm hover:bg-card-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditAllowanceValue(budget.total_allowance)
                setEditingAllowance(true)
              }}
              className="text-3xl font-mono text-highlight hover:opacity-80 transition-opacity"
            >
              {formatAmount(budget.total_allowance, defaultCurrency)}
            </button>
          )}
        </div>
      )}

      {/* Budget items */}
      {budget && items.length === 0 && !showForm && (
        <EmptyState icon="📊" message="No budget items yet" sub="Add categories to track your spending" />
      )}

      {budget && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            if (editingItemId === item.id) {
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={editItemData.category_name}
                    onChange={(e) => setEditItemData({ ...editItemData, category_name: e.target.value })}
                    className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editItemData.allocated_amount}
                    onChange={(e) => setEditItemData({ ...editItemData, allocated_amount: e.target.value })}
                    className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  />
                  <select
                    value={editItemData.linked_expense_category}
                    onChange={(e) => setEditItemData({ ...editItemData, linked_expense_category: e.target.value })}
                    className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  >
                    <option value="">None</option>
                    {categoryNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditingItemId(null); setEditItemData({}) }}
                      className="border border-border text-text-secondary rounded-lg px-4 py-2 text-sm hover:bg-card-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveItem}
                      className="bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )
            }

            const spent = item.linked_expense_category
              ? (spendByCategory[item.linked_expense_category] || 0)
              : null

            return (
              <BudgetProgress
                key={item.id}
                label={item.category_name}
                allocated={parseFloat(item.allocated_amount)}
                spent={spent}
                onEdit={() => startEditItem(item)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            )
          })}
        </div>
      )}

      {/* Add item form / button */}
      {budget && (
        showForm ? (
          <BudgetForm
            onSubmit={handleAddItem}
            onCancel={() => setShowForm(false)}
            categoryNames={categoryNames}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-card border border-border border-dashed rounded-xl p-3 text-text-muted hover:text-text-primary hover:border-border-focus transition-colors text-sm flex items-center justify-center gap-1"
          >
            <span className="text-lg leading-none">+</span> Add budget item
          </button>
        )
      )}

      {/* Summary footer */}
      {budget && items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 bg-card border-t border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex justify-between text-sm">
            <div>
              <span className="text-text-muted">Allocated: </span>
              <span className={`font-mono ${getAllocatedColor()}`}>
                {formatAmount(totalAllocated, defaultCurrency)} / {formatAmount(totalAllowance, defaultCurrency)}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Spent: </span>
              <span className={`font-mono ${getSpentColor()}`}>
                {formatAmount(totalSpent, defaultCurrency)} / {formatAmount(totalAllocated, defaultCurrency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
