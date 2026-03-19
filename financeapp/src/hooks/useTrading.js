import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTrading() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('trading_entries')
      .select('*')
      .order('entry_date', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setEntries(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addEntry(data) {
    const { error: err } = await supabase.from('trading_entries').insert([data])
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function deleteEntry(id) {
    const { error: err } = await supabase.from('trading_entries').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await fetch()
  }

  const totalEarnings = entries.filter(e => e.type === 'earning').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  const totalNet = totalEarnings - totalExpenses

  return {
    entries, loading, error,
    addEntry, deleteEntry,
    totalNet, totalEarnings, totalExpenses,
    refetch: fetch,
  }
}
