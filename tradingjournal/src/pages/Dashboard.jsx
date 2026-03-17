import { useMemo } from 'react'
import { useTrades } from '../hooks/useTrades'
import {
  getWinRate, getProfitFactor, getAvgRR, getEquityCurve,
  getMaxDrawdown, getStreaks, getTotalPnL, resolvePnL
} from '../lib/tradeCalc'
import ErrorBanner from '../components/shared/ErrorBanner'
import EmptyState from '../components/shared/EmptyState'

function StatCard({ label, value, sub, valueClass = 'text-gray-800' }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function EquityCurve({ curve }) {
  if (curve.length < 2) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-2">Equity Curve</p>
        <div className="h-24 flex items-center justify-center text-xs text-gray-300">
          Not enough data
        </div>
      </div>
    )
  }

  const values = curve.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 300
  const H = 80
  const pad = 4

  const points = curve.map((p, i) => {
    const x = pad + (i / (curve.length - 1)) * (W - pad * 2)
    const y = H - pad - ((p.value - min) / range) * (H - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const lastVal = curve[curve.length - 1].value
  const lineColor = lastVal >= 0 ? '#16a34a' : '#dc2626'

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-medium text-gray-500">Equity Curve</p>
        <span className={`text-xs font-semibold ${lastVal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {lastVal >= 0 ? '+' : ''}{lastVal.toFixed(2)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        {/* Zero line */}
        {min < 0 && max > 0 && (
          <line
            x1={pad} y1={H - pad - ((0 - min) / range) * (H - pad * 2)}
            x2={W - pad} y2={H - pad - ((0 - min) / range) * (H - pad * 2)}
            stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
        )}
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Dots at each point */}
        {curve.map((p, i) => {
          const x = pad + (i / (curve.length - 1)) * (W - pad * 2)
          const y = H - pad - ((p.value - min) / range) * (H - pad * 2)
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill={lineColor} />
        })}
      </svg>
    </div>
  )
}

export default function Dashboard() {
  const { trades, loading, error } = useTrades({})

  const curve = useMemo(() => getEquityCurve(trades), [trades])
  const totalPnL = useMemo(() => getTotalPnL(trades), [trades])
  const winRate = useMemo(() => getWinRate(trades), [trades])
  const pf = useMemo(() => getProfitFactor(trades), [trades])
  const avgRR = useMemo(() => getAvgRR(trades), [trades])
  const maxDd = useMemo(() => getMaxDrawdown(trades), [trades])
  const streak = useMemo(() => getStreaks(trades), [trades])

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

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />

      {trades.length === 0 ? (
        <EmptyState icon="📊" message="No trades yet" sub="Log your first trade in the Trades tab" />
      ) : (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Total P&L"
              value={`${totalPnL >= 0 ? '+' : ''}${fmt(totalPnL)} ${defaultCurrency}`}
              sub={`${closedTrades.length} closed trades`}
              valueClass={totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}
            />
            <StatCard
              label="Win Rate"
              value={winRate != null ? `${(winRate * 100).toFixed(0)}%` : '—'}
              sub={winRate != null ? `${Math.round(winRate * closedTrades.length)}W / ${Math.round((1 - winRate) * closedTrades.length)}L` : ''}
            />
            <StatCard
              label="Profit Factor"
              value={pf != null ? (isFinite(pf) ? fmt(pf) : '∞') : '—'}
              sub="gross profit / gross loss"
            />
            <StatCard
              label="Avg R:R"
              value={avgRR != null ? fmt(avgRR) : '—'}
              sub="avg win / avg loss"
            />
          </div>

          {/* Equity curve */}
          <EquityCurve curve={curve} />

          {/* Drawdown & streak */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Max Drawdown"
              value={maxDd > 0 ? `-${fmt(maxDd)} ${defaultCurrency}` : '—'}
              valueClass="text-red-500"
            />
            <StatCard
              label="Current Streak"
              value={streak.count > 0 ? `${streak.count} ${streak.type}${streak.count > 1 ? 's' : ''}` : '—'}
              valueClass={streak.type === 'win' ? 'text-green-600' : streak.type === 'loss' ? 'text-red-500' : 'text-gray-800'}
            />
          </div>

          {/* Best / worst */}
          {bestTrade && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Best Trade</p>
                <p className="font-semibold text-gray-800">{bestTrade.symbol}</p>
                <p className="text-sm font-bold text-green-600">+{fmt(resolvePnL(bestTrade))} {bestTrade.currency}</p>
                <p className="text-xs text-gray-400">{bestTrade.date}</p>
              </div>
              {worstTrade && worstTrade.id !== bestTrade.id && (
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">Worst Trade</p>
                  <p className="font-semibold text-gray-800">{worstTrade.symbol}</p>
                  <p className="text-sm font-bold text-red-500">{fmt(resolvePnL(worstTrade))} {worstTrade.currency}</p>
                  <p className="text-xs text-gray-400">{worstTrade.date}</p>
                </div>
              )}
            </div>
          )}

          {/* Recent trades */}
          {recentTrades.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <p className="text-xs font-medium text-gray-500 px-4 pt-3 pb-2">Recent Trades</p>
              <div className="divide-y divide-gray-50">
                {recentTrades.map(t => {
                  const pnl = resolvePnL(t)
                  const isOpen = t.exit_price == null
                  return (
                    <div key={t.id} className="flex items-center justify-between px-4 py-2">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{t.symbol}</span>
                        <span className={`ml-2 text-xs ${t.direction === 'long' ? 'text-green-600' : 'text-red-500'}`}>{t.direction}</span>
                        <p className="text-xs text-gray-400">{t.date}</p>
                      </div>
                      <span className={`text-sm font-semibold ${isOpen ? 'text-gray-400' : pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                      </span>
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
