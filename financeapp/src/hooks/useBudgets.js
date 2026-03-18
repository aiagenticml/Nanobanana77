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
    refetch: fetch,
  }
}
