import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [{ data: accs, error: accErr }, { data: ents, error: entErr }] = await Promise.all([
      supabase.from('accounts').select('*').order('created_at', { ascending: true }),
      supabase.from('account_entries').select('*').order('entry_date', { ascending: true }),
    ])

    if (accErr || entErr) {
      setError((accErr || entErr).message)
    } else {
      setAccounts(accs ?? [])
      setEntries(ents ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addAccount(data) {
    const { error: err } = await supabase.from('accounts').insert([data])
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function deleteAccount(id) {
    const { error: err } = await supabase.from('accounts').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function addEntry(accountId, { amount, note, entry_date }) {
    const { error: err } = await supabase.from('account_entries').insert([{
      account_id: accountId,
      amount,
      note: note || null,
      entry_date,
    }])
    if (err) throw new Error(err.message)
    await fetch()
  }

  async function deleteEntry(id) {
    const { error: err } = await supabase.from('account_entries').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await fetch()
  }

  // Balance per account = sum of all entries
  const balanceByAccount = {}
  for (const entry of entries) {
    balanceByAccount[entry.account_id] = (balanceByAccount[entry.account_id] || 0) + parseFloat(entry.amount)
  }

  const totalNetWorth = Object.values(balanceByAccount).reduce((sum, b) => sum + b, 0)

  return {
    accounts, entries, loading, error,
    addAccount, deleteAccount, addEntry, deleteEntry,
    balanceByAccount, totalNetWorth,
    refetch: fetch,
  }
}
