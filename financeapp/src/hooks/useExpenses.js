import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { requireUser } from '../lib/authGuard'
import { validateExpense } from '../lib/validation'

const PAGE_SIZE = 50

export function useExpenses(filters = {}) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)

  const fetch = useCallback(async (reset = true) => {
    setLoading(true)
    try {
      const user = await requireUser()
      if (reset) offsetRef.current = 0

      let query = supabase.from('expenses').select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1)

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
      if (error) { setError(error.message); return }

      if (reset) {
        setExpenses(data ?? [])
      } else {
        setExpenses(prev => [...prev, ...(data ?? [])])
      }
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
      offsetRef.current += (data?.length ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.month, filters.category])

  useEffect(() => { fetch(true) }, [fetch])

  async function loadMore() {
    if (!hasMore || loading) return
    await fetch(false)
  }

  async function addExpense(data) {
    validateExpense(data)
    const user = await requireUser()
    const { error } = await supabase.from('expenses').insert([{ ...data, user_id: user.id }])
    if (error) throw new Error(error.message)
    await fetch(true)
  }

  async function updateExpense(id, data) {
    validateExpense(data)
    const user = await requireUser()
    const { error } = await supabase.from('expenses').update(data).eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
    await fetch(true)
  }

  async function deleteExpense(id) {
    const user = await requireUser()
    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
    await fetch(true)
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

  return { expenses, loading, error, hasMore, loadMore, addExpense, updateExpense, deleteExpense, totalByCategory, totalForMonth, refetch: () => fetch(true) }
}
