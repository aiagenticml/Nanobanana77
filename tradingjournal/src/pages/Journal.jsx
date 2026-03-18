import { useState, useMemo, useCallback } from 'react'
import { useTrades } from '../hooks/useTrades'
import { useTemplates, useJournalEntries } from '../hooks/useJournal'
import { resolvePnL } from '../lib/tradeCalc'
import JournalEntryForm from '../components/journal/JournalEntryForm'
import TradeStats from '../components/journal/TradeStats'
import EmptyState from '../components/shared/EmptyState'
import ErrorBanner from '../components/shared/ErrorBanner'

const TAB_LABELS = { trade: 'Trades', daily: 'Daily', weekly: 'Weekly' }
const inputClass = 'bg-surface-50 border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none'

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getSunday(mondayStr) {
  const d = new Date(mondayStr)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

function formatDateRange(mondayStr) {
  const mon = new Date(mondayStr)
  const sun = new Date(mondayStr)
  sun.setDate(sun.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

// --- Trade Journal View ---
function TradeView({ templates }) {
  const { trades, loading: tradesLoading, error } = useTrades({})
  const { entries, loading: entriesLoading, saveEntry } = useJournalEntries('trade')
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState(false)

  const fields = templates.trade || []
  const entryMap = useMemo(() => {
    const map = {}
    for (const e of entries) {
      if (e.trade_id) map[e.trade_id] = e
    }
    return map
  }, [entries])

  // Sort: unjournaled first, then by date
  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => {
      const aHas = entryMap[a.id] ? 1 : 0
      const bHas = entryMap[b.id] ? 1 : 0
      if (aHas !== bHas) return aHas - bHas
      return new Date(b.date) - new Date(a.date)
    })
  }, [trades, entryMap])

  async function handleSave(tradeId, data) {
    setSaving(true)
    const trade = trades.find(t => t.id === tradeId)
    await saveEntry({ trade_id: tradeId, date: trade?.date, ...data })
    setSaving(false)
  }

  if (tradesLoading || entriesLoading) return <p className="text-sm text-text-muted text-center py-8">Loading...</p>

  return (
    <div className="space-y-2">
      <ErrorBanner message={error} />
      {trades.length === 0 ? (
        <EmptyState icon="📝" message="No trades to journal" sub="Log trades first in the Trades tab" />
      ) : (
        sorted.map(trade => {
          const pnl = resolvePnL(trade)
          const isOpen = trade.exit_price == null
          const entry = entryMap[trade.id]
          const hasEntry = !!entry
          const isExpanded = expandedId === trade.id

          return (
            <div key={trade.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : trade.id)}>
                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${hasEntry ? 'bg-accent' : 'bg-border'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text text-sm">{trade.symbol}</span>
                    <span className={`text-xs ${trade.direction === 'long' ? 'text-profit' : 'text-loss'}`}>{trade.direction}</span>
                    {!hasEntry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-muted/20 text-accent">needs journal</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{trade.date}</p>
                </div>
                <span className={`font-semibold text-sm whitespace-nowrap ${isOpen ? 'text-text-muted' : pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                </span>
                <span className={`text-text-muted text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>&#9662;</span>
              </div>

              {isExpanded && (
                <div className="border-t border-border p-4">
                  {/* Trade summary */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                    <div className="bg-surface-50 rounded-lg p-2">
                      <p className="text-text-muted">Entry</p>
                      <p className="font-medium text-text">{trade.entry_price}</p>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-2">
                      <p className="text-text-muted">Exit</p>
                      <p className="font-medium text-text">{trade.exit_price ?? '—'}</p>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-2">
                      <p className="text-text-muted">Size</p>
                      <p className="font-medium text-text">{trade.size}</p>
                    </div>
                  </div>

                  {/* Existing screenshots displayed inline */}
                  {entry?.screenshots?.length > 0 && !fields.length && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {entry.screenshots.map((ss, i) => (
                        <div key={i}>
                          <img src={ss.url} alt={ss.label || 'Screenshot'} className="w-full rounded-lg border border-border" />
                          {ss.label && <p className="text-xs text-text-muted mt-1">{ss.label}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 ? (
                    <JournalEntryForm fields={fields} entry={entry}
                      onSave={data => handleSave(trade.id, data)} saving={saving} />
                  ) : (
                    <p className="text-sm text-text-muted text-center py-4">
                      No template fields configured. Add some in Settings &gt; Journal Templates.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// --- Daily Journal View ---
function DailyView({ templates }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const { trades } = useTrades({})
  const { entries, saveEntry } = useJournalEntries('daily', { date })
  const [saving, setSaving] = useState(false)

  const dayTrades = useMemo(() => trades.filter(t => t.date === date), [trades, date])
  const entry = entries[0] || null
  const fields = templates.daily || []

  async function handleSave(data) {
    setSaving(true)
    await saveEntry({ date, ...data })
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0])
        }} className="text-text-muted hover:text-text text-lg px-2">&#8249;</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass + ' flex-1 text-center'} />
        <button onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0])
        }} className="text-text-muted hover:text-text text-lg px-2">&#8250;</button>
      </div>

      <TradeStats trades={dayTrades} />

      {/* Day's trades list */}
      {dayTrades.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <p className="text-xs font-medium text-text-secondary px-3 pt-2.5 pb-1.5">Trades taken</p>
          <div className="divide-y divide-border">
            {dayTrades.map(t => {
              const pnl = resolvePnL(t)
              return (
                <div key={t.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-text">{t.symbol}</span>
                    <span className={`ml-2 text-xs ${t.direction === 'long' ? 'text-profit' : 'text-loss'}`}>{t.direction}</span>
                  </div>
                  <span className={`text-sm font-semibold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {fields.length > 0 ? (
        <JournalEntryForm fields={fields} entry={entry} onSave={handleSave} saving={saving} />
      ) : (
        <p className="text-sm text-text-muted text-center py-4">
          No daily template configured. Add fields in Settings &gt; Journal Templates.
        </p>
      )}
    </div>
  )
}

// --- Weekly Journal View ---
function WeeklyView({ templates }) {
  const todayMonday = getMonday(new Date().toISOString().split('T')[0])
  const [weekStart, setWeekStart] = useState(todayMonday)
  const { trades } = useTrades({})
  const { entries, saveEntry } = useJournalEntries('weekly', { week_start: weekStart })
  const [saving, setSaving] = useState(false)

  const weekEnd = getSunday(weekStart)
  const weekTrades = useMemo(() =>
    trades.filter(t => t.date >= weekStart && t.date <= weekEnd),
    [trades, weekStart, weekEnd]
  )

  const entry = entries[0] || null
  const fields = templates.weekly || []

  function shiftWeek(dir) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dir * 7)
    setWeekStart(d.toISOString().split('T')[0])
  }

  async function handleSave(data) {
    setSaving(true)
    await saveEntry({ date: weekStart, week_start: weekStart, ...data })
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftWeek(-1)} className="text-text-muted hover:text-text text-lg px-2">&#8249;</button>
        <p className="text-sm font-medium text-text">{formatDateRange(weekStart)}</p>
        <button onClick={() => shiftWeek(1)} className="text-text-muted hover:text-text text-lg px-2">&#8250;</button>
      </div>

      <TradeStats trades={weekTrades} />

      {/* Weekly trade breakdown by day */}
      {weekTrades.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <p className="text-xs font-medium text-text-secondary px-3 pt-2.5 pb-1.5">Trade breakdown</p>
          <div className="divide-y divide-border">
            {weekTrades.map(t => {
              const pnl = resolvePnL(t)
              return (
                <div key={t.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-text">{t.symbol}</span>
                    <span className={`ml-2 text-xs ${t.direction === 'long' ? 'text-profit' : 'text-loss'}`}>{t.direction}</span>
                    <span className="ml-2 text-xs text-text-muted">{t.date}</span>
                  </div>
                  <span className={`text-sm font-semibold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {fields.length > 0 ? (
        <JournalEntryForm fields={fields} entry={entry} onSave={handleSave} saving={saving} />
      ) : (
        <p className="text-sm text-text-muted text-center py-4">
          No weekly template configured. Add fields in Settings &gt; Journal Templates.
        </p>
      )}
    </div>
  )
}

// --- Main Journal Page ---
export default function Journal() {
  const [view, setView] = useState('trade')
  const { templates, loading } = useTemplates()

  if (loading) return <p className="text-sm text-text-muted text-center py-8">Loading...</p>

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === key ? 'bg-surface-50 text-accent' : 'text-text-muted hover:text-text-secondary'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {view === 'trade' && <TradeView templates={templates} />}
      {view === 'daily' && <DailyView templates={templates} />}
      {view === 'weekly' && <WeeklyView templates={templates} />}
    </div>
  )
}
