import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function daysUntilDue(nextDueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

export function useSubscriptions(userId) {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('next_due_date', { ascending: true })
    if (error) setError(error.message)
    else setSubscriptions(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  async function addSubscription(data) {
    const { error } = await supabase.from('subscriptions').insert([{ ...data, user_id: userId }])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateSubscription(id, data) {
    const { error } = await supabase.from('subscriptions').update(data).eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteSubscription(id) {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function markPaid(sub) {
    const next = new Date(sub.next_due_date)
    if (sub.billing_cycle === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (sub.billing_cycle === 'yearly') next.setFullYear(next.getFullYear() + 1)
    else if (sub.billing_cycle === 'weekly') next.setDate(next.getDate() + 7)

    const { error } = await supabase
      .from('subscriptions')
      .update({ next_due_date: next.toISOString().split('T')[0] })
      .eq('id', sub.id)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    await fetch()
  }

  return { subscriptions, loading, error, addSubscription, updateSubscription, deleteSubscription, markPaid, refetch: fetch }
}
