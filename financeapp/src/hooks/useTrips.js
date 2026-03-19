import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const STANDARD_TRIP_CATEGORIES = ['Hotel', 'Food', 'Flight', 'Activities', 'Insurance', 'Alcohol']

export function useTrips() {
  const [trips, setTrips] = useState([])
  const [tripExpenses, setTripExpenses] = useState([])
  const [customCategories, setCustomCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [
      { data: tripsData, error: tripsErr },
      { data: expData, error: expErr },
      { data: catData, error: catErr },
    ] = await Promise.all([
      supabase.from('trips').select('*').order('created_at', { ascending: false }),
      supabase.from('trip_expenses').select('*').order('date', { ascending: true }),
      supabase.from('trip_categories').select('*').order('created_at', { ascending: true }),
    ])

    if (tripsErr || expErr || catErr) {
      setError((tripsErr || expErr || catErr).message)
    } else {
      setTrips(tripsData ?? [])
      setTripExpenses(expData ?? [])
      setCustomCategories(catData ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addTrip(data) {
    const { error: err } = await supabase.from('trips').insert([data])
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function updateTrip(id, data) {
    const { error: err } = await supabase.from('trips').update(data).eq('id', id)
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function deleteTrip(id) {
    const { error: err } = await supabase.from('trips').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function addTripExpense(tripId, data) {
    const { error: err } = await supabase.from('trip_expenses').insert([{ trip_id: tripId, ...data }])
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function deleteTripExpense(id) {
    const { error: err } = await supabase.from('trip_expenses').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function addCustomCategory(name) {
    const { error: err } = await supabase.from('trip_categories').insert([{ name: name.trim() }])
    if (err) throw new Error(err.message)
    await fetch()
  }

  function expensesForTrip(tripId) {
    return tripExpenses.filter(e => e.trip_id === tripId)
  }

  function totalForTrip(trip) {
    const expenses = expensesForTrip(trip.id)
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  }

  function totalSGDForTrip(trip) {
    return totalForTrip(trip) * parseFloat(trip.exchange_rate_to_sgd || 1)
  }

  const allCategories = [...STANDARD_TRIP_CATEGORIES, ...customCategories.map(c => c.name)]

  return {
    trips, tripExpenses, customCategories, allCategories, loading, error,
    addTrip, updateTrip, deleteTrip,
    addTripExpense, deleteTripExpense, addCustomCategory,
    expensesForTrip, totalForTrip, totalSGDForTrip,
    refetch: fetch,
  }
}
