import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function daysUntilRestock(datePurchased, servings) {
  const purchased = new Date(datePurchased)
  purchased.setHours(0, 0, 0, 0)
  const runOutDate = new Date(purchased)
  runOutDate.setDate(runOutDate.getDate() + servings)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((runOutDate - today) / (1000 * 60 * 60 * 24))
}

export function useVitamins() {
  const [vitamins, setVitamins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vitamins')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setVitamins(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addVitamin(data) {
    const { error } = await supabase.from('vitamins').insert([data])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateVitamin(id, data) {
    const { error } = await supabase.from('vitamins').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteVitamin(id) {
    const { error } = await supabase.from('vitamins').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function rebuy(vitamin) {
    const today = new Date().toISOString().split('T')[0]
    await updateVitamin(vitamin.id, {
      date_purchased: today,
      purchase_count: (vitamin.purchase_count || 1) + 1,
    })
  }

  return { vitamins, loading, error, addVitamin, updateVitamin, deleteVitamin, rebuy, refetch: fetch }
}
