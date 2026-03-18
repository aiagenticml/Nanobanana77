import { useState } from 'react'

export default function BudgetForm({ onSubmit, onCancel, categoryNames }) {
  const [categoryName, setCategoryName] = useState('')
  const [allocatedAmount, setAllocatedAmount] = useState('')
  const [linkedCategory, setLinkedCategory] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!categoryName.trim() || !allocatedAmount) return
    onSubmit({
      category_name: categoryName.trim(),
      allocated_amount: parseFloat(allocatedAmount),
      linked_expense_category: linkedCategory || null,
    })
    setCategoryName('')
    setAllocatedAmount('')
    setLinkedCategory('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input
        type="text"
        placeholder="e.g. Eating out"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <input
        type="number"
        placeholder="0.00"
        step="0.01"
        min="0"
        value={allocatedAmount}
        onChange={(e) => setAllocatedAmount(e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <select
        value={linkedCategory}
        onChange={(e) => setLinkedCategory(e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      >
        <option value="">Link to expense category (optional)</option>
        {(categoryNames ?? []).map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="border border-border text-text-secondary rounded-lg px-4 py-2 text-sm hover:bg-card-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
        >
          Add
        </button>
      </div>
    </form>
  )
}
