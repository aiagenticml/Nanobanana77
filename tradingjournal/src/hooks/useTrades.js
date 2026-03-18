import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTrades(filters = {}) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('trades').select('*').order('date', { ascending: false })

    if (filters.month) {
      const [year, month] = filters.month.split('-')
      const start = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('date', start).lte('date', end)
    }
    if (filters.instrument) query = query.eq('instrument', filters.instrument)
    if (filters.direction) query = query.eq('direction', filters.direction)
    if (filters.setup_tag) query = query.eq('setup_tag', filters.setup_tag)
    if (filters.account) query = query.eq('account', filters.account)

    const { data, error } = await query
    if (error) setError(error.message)
    else setTrades(data ?? [])
    setLoading(false)
  }, [filters.month, filters.instrument, filters.direction, filters.setup_tag, filters.account])

  useEffect(() => { fetch() }, [fetch])

  async function addTrade(data) {
    const { error } = await supabase.from('trades').insert([data])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateTrade(id, data) {
    const { error } = await supabase.from('trades').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteTrade(id) {
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  return { trades, loading, error, addTrade, updateTrade, deleteTrade, refetch: fetch }
}
