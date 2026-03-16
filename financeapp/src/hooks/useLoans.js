import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { validateLoan } from '../lib/validation'

export function useLoans() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('loans').select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setLoans(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addLoan(data) {
    validateLoan(data)
    const { error } = await supabase.from('loans').insert([data])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateLoan(id, data) {
    validateLoan(data)
    const { error } = await supabase.from('loans').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteLoan(id) {
    const { error } = await supabase.from('loans').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  return { loans, loading, error, addLoan, updateLoan, deleteLoan, refetch: fetch }
}
