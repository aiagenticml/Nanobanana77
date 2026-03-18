import { resolvePnL } from '../../lib/tradeCalc'

export default function TradeStats({ trades }) {
  if (trades.length === 0) {
    return (
      <div className="bg-surface-50 rounded-lg px-3 py-3 text-center text-sm text-text-muted">
        No trades in this period
      </div>
    )
  }

  const closed = trades.filter(t => t.exit_price != null)
  const totalPnL = trades.reduce((s, t) => s + resolvePnL(t), 0)
  const wins = closed.filter(t => resolvePnL(t) > 0).length
  const losses = closed.filter(t => resolvePnL(t) < 0).length
  const winRate = closed.length > 0 ? (wins / closed.length * 100).toFixed(0) : null
  const currency = trades[0]?.currency ?? 'USD'

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-surface-50 rounded-lg p-2 text-center">
        <p className="text-[10px] text-text-muted">Trades</p>
        <p className="text-sm font-semibold text-text">{trades.length}</p>
      </div>
      <div className="bg-surface-50 rounded-lg p-2 text-center">
        <p className="text-[10px] text-text-muted">P&L</p>
        <p className={`text-sm font-semibold ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
          {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
        </p>
      </div>
      <div className="bg-surface-50 rounded-lg p-2 text-center">
        <p className="text-[10px] text-text-muted">Win Rate</p>
        <p className="text-sm font-semibold text-text">{winRate != null ? `${winRate}%` : '—'}</p>
      </div>
      <div className="bg-surface-50 rounded-lg p-2 text-center">
        <p className="text-[10px] text-text-muted">W / L</p>
        <p className="text-sm font-semibold text-text">{wins} / {losses}</p>
      </div>
    </div>
  )
}
