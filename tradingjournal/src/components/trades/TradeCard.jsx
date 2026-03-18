import { resolvePnL } from '../../lib/tradeCalc'

const INSTRUMENT_COLORS = {
  forex: 'bg-accent/10 text-accent border border-accent/20',
  futures: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

export default function TradeCard({ trade, onClick, onDelete, onViewJournal }) {
  const pnl = resolvePnL(trade)
  const isOpen = trade.exit_price == null
  const pnlColor = isOpen ? 'text-text-muted' : pnl >= 0 ? 'text-profit' : 'text-loss'
  const glowClass = isOpen ? '' : pnl >= 0 ? 'hover:shadow-glow-profit' : 'hover:shadow-glow-loss'

  return (
    <div className={`glass-card-hover p-3.5 flex items-center gap-3 group ${glowClass}`}>
      {/* P&L indicator bar */}
      <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${
        isOpen ? 'bg-text-muted/30' : pnl >= 0 ? 'bg-profit' : 'bg-loss'
      }`} />

      {trade.screenshot_url && (
        <img src={trade.screenshot_url} alt=""
          className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
          onClick={() => onClick(trade)} />
      )}

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(trade)}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-text text-sm tracking-tight">{trade.symbol}</span>
          <span className={`badge ${INSTRUMENT_COLORS[trade.instrument] ?? 'bg-surface-100 text-text-secondary'}`}>
            {trade.instrument}
          </span>
          <span className={`badge ${
            trade.direction === 'long' ? 'bg-profit/10 text-profit border border-profit/20' : 'bg-loss/10 text-loss border border-loss/20'
          }`}>
            {trade.direction}
          </span>
          {isOpen && <span className="badge bg-accent/10 text-accent border border-accent/20">open</span>}
          {trade.account && <span className="badge bg-surface-100 text-text-secondary">{trade.account}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-text-muted font-mono">{trade.date}</span>
          {trade.entry_time && <span className="text-[10px] text-text-muted/70 font-mono">{trade.entry_time}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`font-bold text-sm font-mono whitespace-nowrap ${pnlColor}`}>
          {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
        </span>
        {!isOpen && (
          <span className="text-[10px] text-text-muted font-mono">{trade.currency}</span>
        )}
        {/* Journal link button */}
        {onViewJournal && (
          <button onClick={(e) => { e.stopPropagation(); onViewJournal(trade.id) }}
            title="View journal"
            className="text-text-muted/40 hover:text-accent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button onClick={() => onDelete(trade.id)}
          className="text-text-muted/40 hover:text-loss text-lg leading-none p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          &times;
        </button>
      </div>
    </div>
  )
}
