import { useState, useMemo, useEffect } from 'react'
import { useTrades } from '../hooks/useTrades'
import { supabase } from '../lib/supabase'
import {
  getWinRate, getProfitFactor, getAvgRR, getEquityCurve,
  getMaxDrawdown, getStreaks, getTotalPnL, resolvePnL,
  getAvgWin, getAvgLoss, getTradesByAsset, getTimeOfDayStats, getTradeDurationStats
} from '../lib/tradeCalc'
import { useGamification } from '../hooks/useGamification'
import ErrorBanner from '../components/shared/ErrorBanner'
import EmptyState from '../components/shared/EmptyState'

// --- Filter bar ---
const filterClass = 'bg-surface-50 border border-border rounded-xl px-2.5 py-1.5 text-xs text-text focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all'

const DATE_MODES = [
  { label: 'All', value: 'all' },
  { label: 'Month', value: 'month' },
  { label: 'Week', value: 'week' },
  { label: 'Day', value: 'day' },
  { label: 'Custom', value: 'custom' },
]

function getMonday(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

function getSunday(mondayStr) {
  const d = new Date(mondayStr)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

function formatWeekLabel(mondayStr) {
  const mon = new Date(mondayStr)
  const sun = new Date(mondayStr)
  sun.setDate(sun.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

function getWeekOptions(trades) {
  const now = new Date()
  const todayMonday = getMonday(now.toISOString().split('T')[0])
  const weeks = []
  let current = new Date(todayMonday)
  // go back up to 52 weeks or to oldest trade
  const oldest = trades.length > 0
    ? getMonday([...trades].sort((a, b) => a.date.localeCompare(b.date))[0].date)
    : todayMonday
  const stop = new Date(oldest)
  while (current >= stop) {
    const mon = current.toISOString().split('T')[0]
    weeks.push({ value: mon, label: formatWeekLabel(mon) })
    current.setDate(current.getDate() - 7)
  }
  return weeks
}

function getMonthOptions(trades) {
  const months = new Set()
  const now = new Date()
  // Always include last 12 months
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  // Also include months from trade data
  for (const t of trades) {
    months.add(t.date.slice(0, 7))
  }
  return [...months].sort().reverse().map(m => {
    const [y, mo] = m.split('-')
    const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    return { value: m, label }
  })
}

function getDateRangeFromMode(mode, selectedMonth, selectedWeek, selectedDay, customFrom, customTo) {
  if (mode === 'all') return { from: null, to: null }
  if (mode === 'month') {
    if (!selectedMonth) return { from: null, to: null }
    const [y, m] = selectedMonth.split('-')
    const lastDay = new Date(Number(y), Number(m), 0).getDate()
    return { from: `${selectedMonth}-01`, to: `${selectedMonth}-${String(lastDay).padStart(2, '0')}` }
  }
  if (mode === 'week') {
    if (!selectedWeek) return { from: null, to: null }
    return { from: selectedWeek, to: getSunday(selectedWeek) }
  }
  if (mode === 'day') {
    if (!selectedDay) return { from: null, to: null }
    return { from: selectedDay, to: selectedDay }
  }
  if (mode === 'custom') {
    return { from: customFrom || null, to: customTo || null }
  }
  return { from: null, to: null }
}

// --- Stat card ---
function StatCard({ label, value, sub, valueClass = 'text-text', glowClass = '' }) {
  return (
    <div className={`glass-card p-3 ${glowClass}`}>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono tracking-tight ${valueClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

// --- Equity curve ---
function EquityCurve({ curve }) {
  if (curve.length < 2) {
    return (
      <div className="glass-card p-4">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Equity Curve</p>
        <div className="h-28 flex items-center justify-center text-xs text-text-muted">Not enough data</div>
      </div>
    )
  }

  const values = curve.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 300, H = 100, pad = 6

  const points = curve.map((p, i) => {
    const x = pad + (i / (curve.length - 1)) * (W - pad * 2)
    const y = H - pad - ((p.value - min) / range) * (H - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const lastVal = curve[curve.length - 1].value
  const lineColor = lastVal >= 0 ? '#4ade80' : '#f87171'
  const fillPoints = `${points.split(' ')[0].split(',')[0]},${H - pad} ${points} ${points.split(' ').at(-1).split(',')[0]},${H - pad}`

  return (
    <div className="glass-card p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Equity Curve</p>
        <span className={`text-sm font-bold font-mono ${lastVal >= 0 ? 'text-profit' : 'text-loss'}`}>
          {lastVal >= 0 ? '+' : ''}{lastVal.toFixed(2)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill="url(#eqGrad)" />
        {min < 0 && max > 0 && (
          <line x1={pad} y1={H - pad - ((0 - min) / range) * (H - pad * 2)}
            x2={W - pad} y2={H - pad - ((0 - min) / range) * (H - pad * 2)}
            stroke="#555861" strokeWidth="0.5" strokeDasharray="4,4" />
        )}
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {curve.map((p, i) => {
          const x = pad + (i / (curve.length - 1)) * (W - pad * 2)
          const y = H - pad - ((p.value - min) / range) * (H - pad * 2)
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2" fill={lineColor} opacity="0.8" />
        })}
        {(() => {
          const x = W - pad
          const y = H - pad - ((lastVal - min) / range) * (H - pad * 2)
          return <>
            <circle cx={x} cy={y.toFixed(1)} r="6" fill={lineColor} opacity="0.15" />
            <circle cx={x} cy={y.toFixed(1)} r="3" fill={lineColor} />
          </>
        })()}
      </svg>
    </div>
  )
}

// --- Bar chart for win rate by category ---
function WinRateBarChart({ title, data, labelKey = 'label', emptyMsg = 'No data' }) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-4">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">{title}</p>
        <p className="text-xs text-text-muted text-center py-4">{emptyMsg}</p>
      </div>
    )
  }

  const maxTotal = Math.max(...data.map(d => d.total))

  return (
    <div className="glass-card p-4">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-text-muted w-10 text-right flex-shrink-0">{d[labelKey]}</span>
            <div className="flex-1 h-5 bg-surface-50 rounded overflow-hidden relative">
              <div
                className="h-full rounded bg-profit/30"
                style={{ width: `${(d.total / maxTotal) * 100}%` }}
              />
              <div
                className="h-full rounded bg-profit absolute top-0 left-0"
                style={{ width: `${(d.wins / maxTotal) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-text-secondary w-10 flex-shrink-0">
              {(d.winRate * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] text-text-muted w-6 flex-shrink-0 text-right">{d.total}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[9px] text-text-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-profit inline-block" /> Wins</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-profit/30 inline-block" /> Total</span>
      </div>
    </div>
  )
}

// --- Asset breakdown table ---
function AssetBreakdown({ assets }) {
  if (assets.length === 0) return null
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 pt-3.5 pb-2">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Trades by Asset</p>
      </div>
      <div className="divide-y divide-border/60">
        {assets.map(a => (
          <div key={a.symbol} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text font-mono">{a.symbol}</span>
              <span className="text-[10px] text-text-muted">{a.count} trades</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-text-muted">
                {a.winRate != null ? `${(a.winRate * 100).toFixed(0)}% WR` : '—'}
              </span>
              <span className={`text-sm font-bold font-mono ${a.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                {a.totalPnL >= 0 ? '+' : ''}{a.totalPnL.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Gamification widget ---
function GamificationWidget({ gam }) {
  const level = gam.getLevel()
  const pet = gam.getPetStage()
  const s = gam.state

  return (
    <div className="glass-card p-4 shadow-glow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{pet.emoji}</span>
          <div>
            <p className="text-xs font-bold text-text">{s.pet_name}</p>
            <p className="text-[10px] text-text-muted">{pet.name} · HP {s.pet_health}%</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-accent">Lv.{level.level} {level.name}</p>
          <p className="text-[10px] text-text-muted font-mono">{s.xp} XP</p>
        </div>
      </div>

      {/* XP progress bar */}
      {level.next && (
        <div className="mb-3">
          <div className="h-1.5 bg-surface-50 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${level.progress * 100}%` }} />
          </div>
          <p className="text-[9px] text-text-muted mt-1 text-right">{level.xpInLevel}/{level.xpForNext} to Lv.{level.next.level}</p>
        </div>
      )}

      {/* Pet health bar */}
      <div className="mb-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1d27' }}>
          <div className={`h-full rounded-full transition-all duration-500 ${
            s.pet_health >= 60 ? 'bg-profit' : s.pet_health >= 30 ? 'bg-accent' : 'bg-loss'
          }`} style={{ width: `${s.pet_health}%` }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold font-mono text-accent">{s.journal_streak}</p>
          <p className="text-[9px] text-text-muted">Day Streak</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-text">{s.longest_streak}</p>
          <p className="text-[9px] text-text-muted">Best Streak</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-text">{s.total_trade_journals + s.total_daily_journals + s.total_weekly_journals}</p>
          <p className="text-[9px] text-text-muted">Total Entries</p>
        </div>
      </div>
    </div>
  )
}

// --- Main Dashboard ---
export default function Dashboard({ onNavigateTrade }) {
  const { trades: allTrades, loading, error } = useTrades({})
  const gam = useGamification()

  // Filters
  const [dateMode, setDateMode] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedWeek, setSelectedWeek] = useState(() => getMonday(new Date().toISOString().split('T')[0]))
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().split('T')[0])
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterAsset, setFilterAsset] = useState('')

  // Account list
  const [accounts, setAccounts] = useState([])
  useEffect(() => {
    supabase.from('trades').select('account').not('account', 'is', null).then(({ data }) => {
      const unique = [...new Set((data ?? []).map(r => r.account).filter(Boolean))].sort()
      setAccounts(unique)
    })
  }, [allTrades])

  // Asset list
  const assets = useMemo(() => [...new Set(allTrades.map(t => t.symbol))].sort(), [allTrades])

  // Week and month options (derived from all trades)
  const weekOptions = useMemo(() => getWeekOptions(allTrades), [allTrades])
  const monthOptions = useMemo(() => getMonthOptions(allTrades), [allTrades])

  // Filter trades
  const trades = useMemo(() => {
    let filtered = [...allTrades]
    const dates = getDateRangeFromMode(dateMode, selectedMonth, selectedWeek, selectedDay, customFrom, customTo)
    if (dates.from) filtered = filtered.filter(t => t.date >= dates.from)
    if (dates.to) filtered = filtered.filter(t => t.date <= dates.to)
    if (filterAccount) filtered = filtered.filter(t => t.account === filterAccount)
    if (filterAsset) filtered = filtered.filter(t => t.symbol === filterAsset)
    return filtered
  }, [allTrades, dateMode, selectedMonth, selectedWeek, selectedDay, customFrom, customTo, filterAccount, filterAsset])

  // Computed stats
  const curve = useMemo(() => getEquityCurve(trades), [trades])
  const totalPnL = useMemo(() => getTotalPnL(trades), [trades])
  const winRate = useMemo(() => getWinRate(trades), [trades])
  const pf = useMemo(() => getProfitFactor(trades), [trades])
  const avgRR = useMemo(() => getAvgRR(trades), [trades])
  const avgWin = useMemo(() => getAvgWin(trades), [trades])
  const avgLoss = useMemo(() => getAvgLoss(trades), [trades])
  const maxDd = useMemo(() => getMaxDrawdown(trades), [trades])
  const streak = useMemo(() => getStreaks(trades), [trades])
  const assetStats = useMemo(() => getTradesByAsset(trades), [trades])
  const todStats = useMemo(() => getTimeOfDayStats(trades), [trades])
  const durStats = useMemo(() => getTradeDurationStats(trades), [trades])

  const closedTrades = trades.filter(t => t.exit_price != null)
  const sorted = [...closedTrades].sort((a, b) => resolvePnL(b) - resolvePnL(a))
  const bestTrade = sorted[0]
  const worstTrade = sorted[sorted.length - 1]
  const recentTrades = [...trades].slice(0, 5)
  const defaultCurrency = trades[0]?.currency ?? 'USD'

  function fmt(val, decimals = 2) {
    if (val == null || !isFinite(val)) return '—'
    return val.toFixed(decimals)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <ErrorBanner message={error} />

      {/* Gamification */}
      {!gam.loading && <GamificationWidget gam={gam} />}

      {/* Filters */}
      <div className="glass-card p-3 space-y-2.5">
        {/* Date mode tabs */}
        <div className="flex gap-1">
          {DATE_MODES.map(m => (
            <button key={m.value} onClick={() => setDateMode(m.value)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
                dateMode === m.value
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-text-muted border border-transparent hover:text-text-secondary hover:bg-surface-50'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Month picker */}
        {dateMode === 'month' && (
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className={filterClass + ' w-full'}>
            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}

        {/* Week picker */}
        {dateMode === 'week' && (
          <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}
            className={filterClass + ' w-full'}>
            {weekOptions.length > 0
              ? weekOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)
              : <option value={selectedWeek}>{formatWeekLabel(selectedWeek)}</option>}
          </select>
        )}

        {/* Day picker */}
        {dateMode === 'day' && (
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const d = new Date(selectedDay); d.setDate(d.getDate() - 1)
              setSelectedDay(d.toISOString().split('T')[0])
            }} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-50 transition-colors flex-shrink-0">&#8249;</button>
            <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
              className={filterClass + ' flex-1 text-center'} />
            <button onClick={() => {
              const d = new Date(selectedDay); d.setDate(d.getDate() + 1)
              setSelectedDay(d.toISOString().split('T')[0])
            }} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-50 transition-colors flex-shrink-0">&#8250;</button>
          </div>
        )}

        {/* Custom range */}
        {dateMode === 'custom' && (
          <div className="flex gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className={filterClass + ' flex-1'} />
            <span className="text-text-muted self-center text-xs">→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className={filterClass + ' flex-1'} />
          </div>
        )}

        {/* Account & Asset filters */}
        {(accounts.length > 0 || assets.length > 0) && (
          <div className="flex gap-2">
            {accounts.length > 0 && (
              <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} className={filterClass + ' flex-1'}>
                <option value="">All accounts</option>
                {accounts.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            {assets.length > 0 && (
              <select value={filterAsset} onChange={e => setFilterAsset(e.target.value)} className={filterClass + ' flex-1'}>
                <option value="">All assets</option>
                {assets.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {trades.length === 0 ? (
        <EmptyState icon="📊" message="No trades yet" sub="Log your first trade in the Trades tab" />
      ) : (
        <>
          {/* Hero P&L */}
          <div className={`glass-card p-5 text-center ${totalPnL >= 0 ? 'shadow-glow-profit' : 'shadow-glow-loss'}`}>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Total P&L</p>
            <p className={`text-3xl font-extrabold font-mono tracking-tight ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalPnL >= 0 ? '+' : ''}{fmt(totalPnL)}
              <span className="text-base font-semibold text-text-muted ml-1.5">{defaultCurrency}</span>
            </p>
            <p className="text-xs text-text-muted mt-1.5">{closedTrades.length} closed trades</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Win Rate" value={winRate != null ? `${(winRate * 100).toFixed(0)}%` : '—'}
              sub={winRate != null ? `${Math.round(winRate * closedTrades.length)}W / ${Math.round((1 - winRate) * closedTrades.length)}L` : ''} />
            <StatCard label="Profit Factor" value={pf != null ? (isFinite(pf) ? fmt(pf) : '∞') : '—'} />
            <StatCard label="Avg R:R" value={avgRR != null ? fmt(avgRR) : '—'} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Avg Win" value={avgWin != null ? `+${fmt(avgWin)}` : '—'} valueClass="text-profit" />
            <StatCard label="Avg Loss" value={avgLoss != null ? fmt(avgLoss) : '—'} valueClass="text-loss" />
          </div>

          <EquityCurve curve={curve} />

          {/* Drawdown & Streak */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Max Drawdown" value={maxDd > 0 ? `-${fmt(maxDd)}` : '—'}
              sub={maxDd > 0 ? defaultCurrency : undefined} valueClass="text-loss"
              glowClass={maxDd > 0 ? 'shadow-glow-loss' : ''} />
            <StatCard label="Current Streak"
              value={streak.count > 0 ? `${streak.count} ${streak.type}${streak.count > 1 ? 's' : ''}` : '—'}
              valueClass={streak.type === 'win' ? 'text-profit' : streak.type === 'loss' ? 'text-loss' : 'text-text'}
              glowClass={streak.type === 'win' ? 'shadow-glow-profit' : ''} />
          </div>

          {/* Best / Worst */}
          {bestTrade && (
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-3.5 border-l-2 border-l-profit">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Best Trade</p>
                <p className="font-bold text-sm text-text tracking-tight">{bestTrade.symbol}</p>
                <p className="text-sm font-bold font-mono text-profit">+{fmt(resolvePnL(bestTrade))} {bestTrade.currency}</p>
                <p className="text-[10px] text-text-muted font-mono mt-1">{bestTrade.date}</p>
              </div>
              {worstTrade && worstTrade.id !== bestTrade.id && (
                <div className="glass-card p-3.5 border-l-2 border-l-loss">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Worst Trade</p>
                  <p className="font-bold text-sm text-text tracking-tight">{worstTrade.symbol}</p>
                  <p className="text-sm font-bold font-mono text-loss">{fmt(resolvePnL(worstTrade))} {worstTrade.currency}</p>
                  <p className="text-[10px] text-text-muted font-mono mt-1">{worstTrade.date}</p>
                </div>
              )}
            </div>
          )}

          {/* Trades by Asset */}
          <AssetBreakdown assets={assetStats} />

          {/* Time of Day chart */}
          <WinRateBarChart title="Win Rate by Time of Day" data={todStats}
            emptyMsg="Add entry_time to trades to see this chart" />

          {/* Duration chart */}
          <WinRateBarChart title="Win Rate by Duration" data={durStats}
            emptyMsg="Add entry/exit times to trades to see this chart" />

          {/* Recent trades (clickable) */}
          {recentTrades.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-4 pt-3.5 pb-2">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Recent Trades</p>
              </div>
              <div className="divide-y divide-border/60">
                {recentTrades.map(t => {
                  const pnl = resolvePnL(t)
                  const isOpen = t.exit_price == null
                  return (
                    <div key={t.id}
                      onClick={() => onNavigateTrade && onNavigateTrade(t.id)}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-50/50 transition-colors cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text tracking-tight">{t.symbol}</span>
                          <span className={`text-[10px] font-semibold uppercase ${t.direction === 'long' ? 'text-profit' : 'text-loss'}`}>{t.direction}</span>
                          {t.account && <span className="text-[10px] text-text-muted">{t.account}</span>}
                        </div>
                        <p className="text-[10px] text-text-muted font-mono mt-0.5">{t.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-mono ${isOpen ? 'text-text-muted' : pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                        </span>
                        <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
