import { resolvePnL } from '../../lib/tradeCalc'

const INSTRUMENT_COLORS = {
  forex: 'bg-accent-muted/30 text-accent',
  futures: 'bg-purple-900/30 text-purple-300',
}

export default function TradeCard({ trade, onClick, onDelete }) {
  const pnl = resolvePnL(trade)
  const isOpen = trade.exit_price == null
  const pnlColor = isOpen ? 'text-text-muted' : pnl >= 0 ? 'text-profit' : 'text-loss'

  return (
    <div className="bg-card rounded-xl p-3 flex items-center gap-3 border border-border hover:bg-card-hover transition-colors">
      {trade.screenshot_url && (
        <img src={trade.screenshot_url} alt="Screenshot"
          className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0 cursor-pointer"
          onClick={() => onClick(trade)} />
      )}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(trade)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text text-sm">{trade.symbol}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSTRUMENT_COLORS[trade.instrument] ?? 'bg-surface-100 text-text-secondary'}`}>
            {trade.instrument}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            trade.direction === 'long' ? 'bg-profit-muted/30 text-profit' : 'bg-loss-muted/30 text-loss'
          }`}>
            {trade.direction}
          </span>
          {isOpen && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-muted/30 text-accent">open</span>}
          {trade.account && <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-text-secondary">{trade.account}</span>}
          {trade.setup_tag && <span className="text-xs text-text-muted">{trade.setup_tag}</span>}
        </div>
        <p className="text-xs text-text-muted mt-0.5">{trade.date}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-semibold text-sm whitespace-nowrap ${pnlColor}`}>
          {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ${trade.currency}`}
        </span>
        <button onClick={() => onDelete(trade.id)} className="text-text-muted hover:text-loss text-2xl leading-none p-1">x</button>
      </div>
    </div>
  )
}
