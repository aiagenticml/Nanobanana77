import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { daysUntilDue } from './useSubscriptions'

export { daysUntilDue }

export function useInsurance() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('*')
      .order('next_due_date', { ascending: true })
    if (error) setError(error.message)
    else setPolicies(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addPolicy(data) {
    const { error } = await supabase.from('insurance_policies').insert([data])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updatePolicy(id, data) {
    const { error } = await supabase.from('insurance_policies').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deletePolicy(id) {
    const { error } = await supabase.from('insurance_policies').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function markPaid(policy) {
    const next = new Date(policy.next_due_date)
    if (policy.billing_cycle === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (policy.billing_cycle === 'yearly') next.setFullYear(next.getFullYear() + 1)
    else if (policy.billing_cycle === 'weekly') next.setDate(next.getDate() + 7)

    const { error } = await supabase
      .from('insurance_policies')
      .update({ next_due_date: next.toISOString().split('T')[0] })
      .eq('id', policy.id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  return { policies, loading, error, addPolicy, updatePolicy, deletePolicy, markPaid, refetch: fetch }
}
