import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useExpenses(filters = {}) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('expenses').select('*').order('date', { ascending: false })

    if (filters.month) {
      const [year, month] = filters.month.split('-')
      const start = `${year}-${month}-01`
      const end = new Date(year, parseInt(month), 0).toISOString().split('T')[0]
      query = query.gte('date', start).lte('date', end)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    const { data, error } = await query
    if (error) setError(error.message)
    else setExpenses(data ?? [])
    setLoading(false)
  }, [filters.month, filters.category])

  useEffect(() => { fetch() }, [fetch])

  async function addExpense(data) {
    const { error } = await supabase.from('expenses').insert([data])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  function totalByCategory() {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
      return acc
    }, {})
  }

  function totalForMonth() {
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  }

  return { expenses, loading, error, addExpense, deleteExpense, totalByCategory, totalForMonth, refetch: fetch }
}
