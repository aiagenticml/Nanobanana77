import { supabase } from './supabase'

/** Export all trades, journal entries, and templates as JSON. */
export async function exportAllJSON() {
  const [trades, entries, templates, gamification] = await Promise.all([
    supabase.from('trades').select('*').order('date', { ascending: false }),
    supabase.from('journal_entries').select('*').order('date', { ascending: false }),
    supabase.from('journal_templates').select('*'),
    supabase.from('gamification').select('*').eq('id', 1),
  ])

  const data = {
    exported_at: new Date().toISOString(),
    trades: trades.data ?? [],
    journal_entries: entries.data ?? [],
    journal_templates: templates.data ?? [],
    gamification: gamification.data?.[0]?.state ?? null,
  }

  downloadFile(JSON.stringify(data, null, 2), `tradingjournal-export-${today()}.json`, 'application/json')
}

/** Export trades as CSV. */
export async function exportTradesCSV() {
  const { data } = await supabase.from('trades').select('*').order('date', { ascending: false })
  if (!data || data.length === 0) return

  const headers = ['date', 'symbol', 'instrument', 'direction', 'entry_price', 'exit_price', 'size', 'pnl', 'currency', 'setup_tag', 'account', 'entry_time', 'exit_time', 'notes']
  const rows = data.map(t => headers.map(h => {
    const val = t[h]
    if (val == null) return ''
    const str = String(val)
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }).join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  downloadFile(csv, `trades-export-${today()}.csv`, 'text/csv')
}

/** Export journal entries as JSON (for AI analysis). */
export async function exportJournalJSON() {
  const [entries, trades] = await Promise.all([
    supabase.from('journal_entries').select('*').order('date', { ascending: false }),
    supabase.from('trades').select('*').order('date', { ascending: false }),
  ])

  // Enrich entries with trade data
  const tradeMap = {}
  for (const t of (trades.data ?? [])) tradeMap[t.id] = t

  const enriched = (entries.data ?? []).map(e => ({
    ...e,
    trade: e.trade_id ? tradeMap[e.trade_id] || null : null,
  }))

  const data = {
    exported_at: new Date().toISOString(),
    description: 'Trading journal entries with linked trade data. Use for AI analysis of trading psychology, patterns, and decision-making.',
    entries: enriched,
  }

  downloadFile(JSON.stringify(data, null, 2), `journal-export-${today()}.json`, 'application/json')
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
