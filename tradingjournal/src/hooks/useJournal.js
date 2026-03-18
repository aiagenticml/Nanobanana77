import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Default templates for first-time use
const DEFAULT_TEMPLATES = {
  trade: [
    { id: '1', type: 'dropdown', label: 'Pre-trade emotion', options: ['Calm', 'Confident', 'Excited', 'Anxious', 'FOMO', 'Revenge', 'Bored'] },
    { id: '2', type: 'checkbox', label: 'Pre-trade checklist', options: ['Checked higher timeframe', 'Identified key levels', 'Set stop loss', 'Risk within limits', 'Followed trading plan'] },
    { id: '3', type: 'text', label: 'Setup reasoning' },
    { id: '4', type: 'rating', label: 'Trade execution rating' },
    { id: '5', type: 'text', label: 'Lesson learned' },
  ],
  daily: [
    { id: '1', type: 'rating', label: 'Overall day rating' },
    { id: '2', type: 'dropdown', label: 'Mindset today', options: ['Focused', 'Disciplined', 'Distracted', 'Overconfident', 'Fearful', 'Neutral'] },
    { id: '3', type: 'text', label: 'Market observations' },
    { id: '4', type: 'text', label: 'What went well' },
    { id: '5', type: 'text', label: 'What to improve' },
  ],
  weekly: [
    { id: '1', type: 'rating', label: 'Week rating' },
    { id: '2', type: 'text', label: 'Key takeaways' },
    { id: '3', type: 'text', label: 'Goals for next week' },
    { id: '4', type: 'checkbox', label: 'Weekly review', options: ['Reviewed all trades', 'Updated trading plan', 'Identified patterns', 'Adjusted risk management'] },
  ],
}

export function useTemplates() {
  const [templates, setTemplates] = useState({ trade: [], daily: [], weekly: [] })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('journal_templates').select('*')
    const map = { trade: [], daily: [], weekly: [] }

    if (data && data.length > 0) {
      for (const row of data) {
        if (map[row.type] !== undefined) map[row.type] = row.fields
      }
    } else {
      // Seed defaults on first use
      for (const [type, fields] of Object.entries(DEFAULT_TEMPLATES)) {
        map[type] = fields
        await supabase.from('journal_templates').upsert(
          { type, fields },
          { onConflict: 'type' }
        )
      }
    }

    setTemplates(map)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function saveTemplate(type, fields) {
    // Try update first, then insert
    const { data: existing } = await supabase
      .from('journal_templates')
      .select('id')
      .eq('type', type)
      .limit(1)

    if (existing && existing.length > 0) {
      await supabase
        .from('journal_templates')
        .update({ fields, updated_at: new Date().toISOString() })
        .eq('type', type)
    } else {
      await supabase
        .from('journal_templates')
        .insert({ type, fields })
    }

    setTemplates(prev => ({ ...prev, [type]: fields }))
  }

  return { templates, loading, saveTemplate, refetch: fetch }
}

export function useJournalEntries(type, filters = {}) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('journal_entries').select('*').eq('type', type).order('date', { ascending: false })

    if (filters.date) query = query.eq('date', filters.date)
    if (filters.trade_id) query = query.eq('trade_id', filters.trade_id)
    if (filters.week_start) query = query.eq('week_start', filters.week_start)

    const { data } = await query
    setEntries(data ?? [])
    setLoading(false)
  }, [type, filters.date, filters.trade_id, filters.week_start])

  useEffect(() => { fetch() }, [fetch])

  async function saveEntry(entry) {
    // Check if entry exists for this type + target
    let match = null
    if (entry.trade_id) {
      const { data } = await supabase.from('journal_entries').select('id').eq('type', type).eq('trade_id', entry.trade_id).limit(1)
      match = data?.[0]
    } else if (entry.week_start) {
      const { data } = await supabase.from('journal_entries').select('id').eq('type', type).eq('week_start', entry.week_start).limit(1)
      match = data?.[0]
    } else if (entry.date) {
      const { data } = await supabase.from('journal_entries').select('id').eq('type', type).eq('date', entry.date).is('trade_id', null).is('week_start', null).limit(1)
      match = data?.[0]
    }

    const payload = {
      type,
      trade_id: entry.trade_id || null,
      date: entry.date,
      week_start: entry.week_start || null,
      answers: entry.answers,
      screenshots: entry.screenshots || [],
      updated_at: new Date().toISOString(),
    }

    if (match) {
      await supabase.from('journal_entries').update(payload).eq('id', match.id)
    } else {
      await supabase.from('journal_entries').insert(payload)
    }

    await fetch()
  }

  return { entries, loading, saveEntry, refetch: fetch }
}
