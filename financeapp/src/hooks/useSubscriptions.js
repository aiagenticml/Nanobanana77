import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { requireUser } from '../lib/authGuard'
import { validateSubscription } from '../lib/validation'

export function daysUntilDue(nextDueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const user = await requireUser()
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true })
        .limit(100)
      if (error) setError(error.message)
      else setSubscriptions(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addSubscription(data) {
    validateSubscription(data)
    const user = await requireUser()
    const { error } = await supabase.from('subscriptions').insert([{ ...data, user_id: user.id }])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateSubscription(id, data) {
    validateSubscription(data)
    const user = await requireUser()
    const { error } = await supabase.from('subscriptions').update(data).eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteSubscription(id) {
    const user = await requireUser()
    const { error } = await supabase.from('subscriptions').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function markPaid(sub) {
    const user = await requireUser()
    const next = new Date(sub.next_due_date)
    if (sub.billing_cycle === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (sub.billing_cycle === 'yearly') next.setFullYear(next.getFullYear() + 1)
    else if (sub.billing_cycle === 'weekly') next.setDate(next.getDate() + 7)

    const { error } = await supabase
      .from('subscriptions')
      .update({ next_due_date: next.toISOString().split('T')[0] })
      .eq('id', sub.id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  return { subscriptions, loading, error, addSubscription, updateSubscription, deleteSubscription, markPaid, refetch: fetch }
}
