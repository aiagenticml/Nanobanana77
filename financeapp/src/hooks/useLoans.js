import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLoans(userId) {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase.from('loans').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setLoans(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  async function addLoan(data) {
    const { error } = await supabase.from('loans').insert([{ ...data, user_id: userId }])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateLoan(id, data) {
    const { error } = await supabase.from('loans').update(data).eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteLoan(id) {
    const { error } = await supabase.from('loans').delete().eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
    await fetch()
  }

  return { loans, loading, error, addLoan, updateLoan, deleteLoan, refetch: fetch }
}
