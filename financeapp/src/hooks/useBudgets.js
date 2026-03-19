import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useBudgets(month) {
  const [budget, setBudget] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!month) return
    setLoading(true)
    setError(null)

    const { data: budgetRows, error: budgetErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', month)
      .limit(1)

    if (budgetErr) {
      setError(budgetErr.message)
      setLoading(false)
      return
    }

    const budgetRow = budgetRows?.[0] ?? null
    setBudget(budgetRow)

    if (budgetRow) {
      const { data: itemRows, error: itemErr } = await supabase
        .from('budget_items')
        .select('*')
        .eq('budget_id', budgetRow.id)
        .order('created_at', { ascending: true })

      if (itemErr) {
        setError(itemErr.message)
      } else {
        setItems(itemRows ?? [])
      }
    } else {
      setItems([])
    }

    setLoading(false)
  }, [month])

  useEffect(() => { fetch() }, [fetch])

  async function createBudget(totalAllowance) {
    const { error: err } = await supabase
      .from('budgets')
      .insert([{ month, total_allowance: totalAllowance }])
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function updateAllowance(budgetId, amount) {
    const { error: err } = await supabase
      .from('budgets')
      .update({ total_allowance: amount })
      .eq('id', budgetId)
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function addItem({ category_name, allocated_amount, linked_expense_category }) {
    if (!budget) return
    const { error: err } = await supabase
      .from('budget_items')
      .insert([{
        budget_id: budget.id,
        category_name,
        allocated_amount,
        linked_expense_category: linked_expense_category || null,
      }])
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function updateItem(itemId, data) {
    const { error: err } = await supabase
      .from('budget_items')
      .update(data)
      .eq('id', itemId)
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function deleteItem(itemId) {
    const { error: err } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', itemId)
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function copyFromPreviousMonth() {
    if (!budget) return
    // Calculate previous month string
    const [yr, mo] = month.split('-').map(Number)
    const prevDate = new Date(yr, mo - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    // Get previous month's budget
    const { data: prevBudgets, error: prevErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', prevMonth)
      .limit(1)
    if (prevErr) throw new Error(prevErr.message)
    const prevBudget = prevBudgets?.[0]
    if (!prevBudget) throw new Error('No budget found for previous month')

    // Get previous month's items
    const { data: prevItems, error: itemErr } = await supabase
      .from('budget_items')
      .select('*')
      .eq('budget_id', prevBudget.id)
    if (itemErr) throw new Error(itemErr.message)
    if (!prevItems || prevItems.length === 0) throw new Error('No items in previous month budget')

    // Insert into current month budget
    const newItems = prevItems.map(item => ({
      budget_id: budget.id,
      category_name: item.category_name,
      allocated_amount: item.allocated_amount,
      linked_expense_category: item.linked_expense_category,
    }))
    const { error: insertErr } = await supabase.from('budget_items').insert(newItems)
    if (insertErr) throw new Error(insertErr.message)
    await fetch()
  }

  return {
    budget,
    items,
    loading,
    error,
    createBudget,
    updateAllowance,
    addItem,
    updateItem,
    deleteItem,
    copyFromPreviousMonth,
    refetch: fetch,
  }
}
