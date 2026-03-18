import { resolvePnL } from '../../lib/tradeCalc'

export default function TradeStats({ trades }) {
  if (trades.length === 0) {
    return (
      <div className="bg-surface-50 rounded-xl px-3 py-3 text-center text-xs text-text-muted">
        No trades in this period
      </div>
    )
  }

  const closed = trades.filter(t => t.exit_price != null)
  const totalPnL = trades.reduce((s, t) => s + resolvePnL(t), 0)
  const wins = closed.filter(t => resolvePnL(t) > 0).length
  const losses = closed.filter(t => resolvePnL(t) < 0).length
  const winRate = closed.length > 0 ? (wins / closed.length * 100).toFixed(0) : null

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: 'Trades', value: trades.length, cls: 'text-text' },
        { label: 'P&L', value: `${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}`, cls: totalPnL >= 0 ? 'text-profit' : 'text-loss' },
        { label: 'Win Rate', value: winRate != null ? `${winRate}%` : '—', cls: 'text-text' },
        { label: 'W / L', value: `${wins} / ${losses}`, cls: 'text-text' },
      ].map(s => (
        <div key={s.label} className="bg-surface-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">{s.label}</p>
          <p className={`text-sm font-bold font-mono ${s.cls}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}
