import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { validateExpense } from '../lib/validation'

export function useExpenses(filters = {}) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase.from('expenses').select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (filters.month) {
      const [year, month] = filters.month.split('-')
      const start = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
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
    validateExpense(data)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('expenses').insert([{ ...data, user_id: user.id }])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateExpense(id, data) {
    validateExpense(data)
    const { error } = await supabase.from('expenses').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  function totalByCategory(currency) {
    return expenses
      .filter(e => !currency || e.currency === currency)
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
        return acc
      }, {})
  }

  function totalForMonth(currency) {
    return expenses
      .filter(e => !currency || e.currency === currency)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  }

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense, totalByCategory, totalForMonth, refetch: fetch }
}
