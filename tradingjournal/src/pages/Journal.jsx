import { useState, useMemo, useEffect, useContext } from 'react'
import { useTrades } from '../hooks/useTrades'
import { useTemplates, useJournalEntries } from '../hooks/useJournal'
import { useGamification } from '../hooks/useGamification'
import { resolvePnL } from '../lib/tradeCalc'
import { SettingsContext } from '../App'
import JournalEntryForm from '../components/journal/JournalEntryForm'
import TradeStats from '../components/journal/TradeStats'
import EmptyState from '../components/shared/EmptyState'
import ErrorBanner from '../components/shared/ErrorBanner'

const TAB_LABELS = { trade: 'Trades', daily: 'Daily', weekly: 'Weekly' }

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

// Generate list of Mondays from oldest trade to now
function getWeekOptions(trades) {
  if (trades.length === 0) return []
  const dates = trades.map(t => t.date).sort()
  const oldest = getMonday(dates[0])
  const newest = getMonday(new Date().toISOString().split('T')[0])
  const weeks = []
  let current = new Date(newest)
  const stop = new Date(oldest)
  while (current >= stop) {
    const mon = current.toISOString().split('T')[0]
    weeks.push({ value: mon, label: formatDateRange(mon) })
    current.setDate(current.getDate() - 7)
  }
  return weeks
}

// --- Trade Journal View ---
function TradeView({ templates, saveTemplate, focusTradeId, onClearFocus }) {
  const { trades, loading: tradesLoading, error } = useTrades({})
  const { entries, loading: entriesLoading, saveEntry } = useJournalEntries('trade')
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const { showToast } = useContext(SettingsContext)
  const gam = useGamification()

  const fields = templates.trade || []
  const entryMap = useMemo(() => {
    const map = {}
    for (const e of entries) {
      if (e.trade_id) map[e.trade_id] = e
    }
    return map
  }, [entries])

  // Auto-expand focused trade from navigation
  useEffect(() => {
    if (focusTradeId) {
      setExpandedId(focusTradeId)
      onClearFocus?.()
    }
  }, [focusTradeId])

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
    await gam.awardXP('trade_journal')
    showToast('+10 XP — Trade journaled!')
    setSaving(false)
  }

  if (tradesLoading || entriesLoading) {
    return <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="space-y-2">
      <ErrorBanner message={error} />

      {/* Inline template config toggle */}
      <button onClick={() => setShowTemplateEditor(!showTemplateEditor)}
        className="text-[10px] text-accent hover:text-accent-hover font-semibold uppercase tracking-wider">
        {showTemplateEditor ? '▾ Hide template settings' : '▸ Customize template'}
      </button>

      {showTemplateEditor && (
        <InlineTemplateEditor type="trade" fields={fields} onSave={f => saveTemplate('trade', f)} />
      )}

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
            <div key={trade.id} className={`glass-card overflow-hidden ${isExpanded ? 'shadow-glow' : ''}`}>
              <div className="flex items-center gap-3 p-3.5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : trade.id)}>
                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${hasEntry ? 'bg-accent' : 'bg-border'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text text-sm">{trade.symbol}</span>
                    <span className={`text-[10px] font-semibold uppercase ${trade.direction === 'long' ? 'text-profit' : 'text-loss'}`}>{trade.direction}</span>
                    {trade.account && <span className="text-[10px] text-text-muted font-mono">{trade.account}</span>}
                    {!hasEntry && <span className="badge bg-accent/10 text-accent border border-accent/20">needs journal</span>}
                  </div>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">{trade.date}</p>
                </div>
                <span className={`font-bold text-sm font-mono whitespace-nowrap ${isOpen ? 'text-text-muted' : pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                </span>
                <span className={`text-text-muted text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>&#9662;</span>
              </div>

              {isExpanded && (
                <div className="border-t border-border p-4 animate-fade-in">
                  {/* Trade summary */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                    <div className="bg-surface-50 rounded-xl p-2.5">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Entry</p>
                      <p className="font-bold text-text font-mono">{trade.entry_price}</p>
                    </div>
                    <div className="bg-surface-50 rounded-xl p-2.5">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Exit</p>
                      <p className="font-bold text-text font-mono">{trade.exit_price ?? '—'}</p>
                    </div>
                    <div className="bg-surface-50 rounded-xl p-2.5">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Size</p>
                      <p className="font-bold text-text font-mono">{trade.size}</p>
                    </div>
                  </div>

                  {/* Existing screenshots */}
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
                      No template fields. Click "Customize template" above to add some.
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
function DailyView({ templates, saveTemplate }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const { trades } = useTrades({})
  const { entries, saveEntry } = useJournalEntries('daily', { date })
  const [saving, setSaving] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const { showToast } = useContext(SettingsContext)
  const gam = useGamification()

  const dayTrades = useMemo(() => trades.filter(t => t.date === date), [trades, date])
  const entry = entries[0] || null
  const fields = templates.daily || []

  async function handleSave(data) {
    setSaving(true)
    await saveEntry({ date, ...data })
    await gam.awardXP('daily_journal')
    showToast('+15 XP — Daily journal saved!')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0])
        }} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-50 transition-colors">&#8249;</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input-field flex-1 text-center font-mono" />
        <button onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0])
        }} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-50 transition-colors">&#8250;</button>
      </div>

      <TradeStats trades={dayTrades} />

      {dayTrades.length > 0 && (
        <div className="glass-card overflow-hidden">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 pt-3 pb-2">Trades taken</p>
          <div className="divide-y divide-border/60">
            {dayTrades.map(t => {
              const pnl = resolvePnL(t)
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">{t.symbol}</span>
                    <span className={`text-[10px] font-semibold uppercase ${t.direction === 'long' ? 'text-profit' : 'text-loss'}`}>{t.direction}</span>
                  </div>
                  <span className={`text-sm font-bold font-mono ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button onClick={() => setShowTemplateEditor(!showTemplateEditor)}
        className="text-[10px] text-accent hover:text-accent-hover font-semibold uppercase tracking-wider">
        {showTemplateEditor ? '▾ Hide template settings' : '▸ Customize template'}
      </button>

      {showTemplateEditor && (
        <InlineTemplateEditor type="daily" fields={fields} onSave={f => saveTemplate('daily', f)} />
      )}

      {fields.length > 0 ? (
        <JournalEntryForm fields={fields} entry={entry} onSave={handleSave} saving={saving} />
      ) : (
        <p className="text-sm text-text-muted text-center py-4">
          No daily template. Click "Customize template" to add fields.
        </p>
      )}
    </div>
  )
}

// --- Weekly Journal View ---
function WeeklyView({ templates, saveTemplate }) {
  const { trades } = useTrades({})
  const todayMonday = getMonday(new Date().toISOString().split('T')[0])
  const [weekStart, setWeekStart] = useState(todayMonday)
  const { entries, saveEntry } = useJournalEntries('weekly', { week_start: weekStart })
  const [saving, setSaving] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const { showToast } = useContext(SettingsContext)
  const gam = useGamification()

  const weekOptions = useMemo(() => getWeekOptions(trades), [trades])
  const weekEnd = getSunday(weekStart)
  const weekTrades = useMemo(() =>
    trades.filter(t => t.date >= weekStart && t.date <= weekEnd),
    [trades, weekStart, weekEnd]
  )

  const entry = entries[0] || null
  const fields = templates.weekly || []

  async function handleSave(data) {
    setSaving(true)
    await saveEntry({ date: weekStart, week_start: weekStart, ...data })
    await gam.awardXP('weekly_journal')
    showToast('+25 XP — Weekly journal saved! Your pet is happy!')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Week dropdown picker */}
      <select value={weekStart} onChange={e => setWeekStart(e.target.value)}
        className="input-field text-center font-mono">
        {weekOptions.length > 0 ? (
          weekOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)
        ) : (
          <option value={todayMonday}>{formatDateRange(todayMonday)}</option>
        )}
      </select>

      <TradeStats trades={weekTrades} />

      {weekTrades.length > 0 && (
        <div className="glass-card overflow-hidden">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 pt-3 pb-2">Trade breakdown</p>
          <div className="divide-y divide-border/60">
            {weekTrades.map(t => {
              const pnl = resolvePnL(t)
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">{t.symbol}</span>
                    <span className={`text-[10px] font-semibold uppercase ${t.direction === 'long' ? 'text-profit' : 'text-loss'}`}>{t.direction}</span>
                    <span className="text-[10px] text-text-muted font-mono">{t.date}</span>
                  </div>
                  <span className={`text-sm font-bold font-mono ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button onClick={() => setShowTemplateEditor(!showTemplateEditor)}
        className="text-[10px] text-accent hover:text-accent-hover font-semibold uppercase tracking-wider">
        {showTemplateEditor ? '▾ Hide template settings' : '▸ Customize template'}
      </button>

      {showTemplateEditor && (
        <InlineTemplateEditor type="weekly" fields={fields} onSave={f => saveTemplate('weekly', f)} />
      )}

      {fields.length > 0 ? (
        <JournalEntryForm fields={fields} entry={entry} onSave={handleSave} saving={saving}
          extraLabel="Include life reflections, mindset, goals — not just trading." />
      ) : (
        <p className="text-sm text-text-muted text-center py-4">
          No weekly template. Click "Customize template" to add fields.
        </p>
      )}
    </div>
  )
}

// --- Inline Template Editor (replaces Settings modal) ---
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'checkbox', label: 'Checklist' },
]

function InlineTemplateEditor({ type, fields: initialFields, onSave }) {
  const [fields, setFields] = useState([...initialFields])
  const [saving, setSaving] = useState(false)
  const { showToast } = useContext(SettingsContext)

  function updateField(idx, updated) {
    const next = [...fields]; next[idx] = updated; setFields(next)
  }
  function removeField(idx) { setFields(fields.filter((_, i) => i !== idx)) }
  function moveField(idx, dir) {
    const next = [...fields]; [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]; setFields(next)
  }
  function addField() {
    setFields([...fields, { id: Date.now().toString(), type: 'text', label: '' }])
  }

  async function handleSave() {
    setSaving(true)
    await onSave(fields)
    showToast('Template saved')
    setSaving(false)
  }

  return (
    <div className="glass-card p-4 space-y-3 animate-fade-in">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
        {type} Journal Template
      </p>

      <div className="space-y-2">
        {fields.map((field, i) => (
          <div key={field.id} className="bg-surface-50 rounded-xl p-3 space-y-2 border border-border">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => i > 0 && moveField(i, -1)} disabled={i === 0}
                  className="text-text-muted hover:text-text disabled:opacity-20 text-xs leading-none">&#9650;</button>
                <button onClick={() => i < fields.length - 1 && moveField(i, 1)} disabled={i === fields.length - 1}
                  className="text-text-muted hover:text-text disabled:opacity-20 text-xs leading-none">&#9660;</button>
              </div>
              <input type="text" value={field.label} placeholder="Question label"
                onChange={e => updateField(i, { ...field, label: e.target.value })}
                className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-text placeholder-text-muted focus:border-accent/60 focus:outline-none" />
              <select value={field.type}
                onChange={e => updateField(i, { ...field, type: e.target.value })}
                className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-text-secondary focus:border-accent/60 focus:outline-none">
                {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
              </select>
              <button onClick={() => removeField(i)} className="text-text-muted hover:text-loss text-lg leading-none px-1">&times;</button>
            </div>

            {(field.type === 'dropdown' || field.type === 'checkbox') && (
              <OptionsEditor options={field.options || []}
                onChange={opts => updateField(i, { ...field, options: opts })} />
            )}
          </div>
        ))}
      </div>

      <button onClick={addField}
        className="w-full py-2 border border-dashed border-border-light rounded-xl text-xs text-text-muted hover:border-accent-muted hover:text-accent transition-colors">
        + Add Field
      </button>

      <button onClick={handleSave} disabled={saving} className="w-full btn-primary disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Template'}
      </button>
    </div>
  )
}

function OptionsEditor({ options, onChange }) {
  const [newOpt, setNewOpt] = useState('')

  function add() {
    if (!newOpt.trim()) return
    onChange([...options, newOpt.trim()])
    setNewOpt('')
  }

  return (
    <div className="pl-6 space-y-1.5">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-text-secondary flex-1">{opt}</span>
          <button onClick={() => onChange(options.filter((_, j) => j !== i))}
            className="text-text-muted hover:text-loss text-[10px]">remove</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input type="text" value={newOpt} placeholder="New option"
          onChange={e => setNewOpt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          className="flex-1 bg-card border border-border rounded-lg px-2 py-1 text-xs text-text placeholder-text-muted focus:border-accent/60 focus:outline-none" />
        <button onClick={add} className="text-xs text-accent hover:text-accent-hover px-2">Add</button>
      </div>
    </div>
  )
}

// --- Main Journal Page ---
export default function Journal({ focusTradeId, onClearFocus }) {
  const [view, setView] = useState('trade')
  const { templates, loading, saveTemplate } = useTemplates()

  // Auto-switch to trade view when navigated from dashboard/trades
  useEffect(() => {
    if (focusTradeId) setView('trade')
  }, [focusTradeId])

  if (loading) {
    return <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* View switcher */}
      <div className="flex gap-1 bg-card rounded-xl p-1 border border-border">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === key ? 'bg-surface-50 text-accent' : 'text-text-muted hover:text-text-secondary'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {view === 'trade' && <TradeView templates={templates} saveTemplate={saveTemplate} focusTradeId={focusTradeId} onClearFocus={onClearFocus} />}
      {view === 'daily' && <DailyView templates={templates} saveTemplate={saveTemplate} />}
      {view === 'weekly' && <WeeklyView templates={templates} saveTemplate={saveTemplate} />}
    </div>
  )
}
