import { resolvePnL } from '../../lib/tradeCalc'

const INSTRUMENT_COLORS = {
  forex: 'bg-blue-100 text-blue-700',
  futures: 'bg-purple-100 text-purple-700',
}

export default function TradeCard({ trade, onClick, onDelete }) {
  const pnl = resolvePnL(trade)
  const isOpen = trade.exit_price == null
  const pnlColor = isOpen ? 'text-gray-400' : pnl >= 0 ? 'text-green-600' : 'text-red-500'

  return (
    <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
      {trade.screenshot_url && (
        <img src={trade.screenshot_url} alt="Screenshot"
          className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 cursor-pointer"
          onClick={() => onClick(trade)} />
      )}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(trade)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-800 text-sm">{trade.symbol}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSTRUMENT_COLORS[trade.instrument] ?? 'bg-gray-100 text-gray-600'}`}>
            {trade.instrument}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            trade.direction === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trade.direction}
          </span>
          {isOpen && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">open</span>}
          {trade.setup_tag && <span className="text-xs text-gray-400">{trade.setup_tag}</span>}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{trade.date}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-semibold text-sm whitespace-nowrap ${pnlColor}`}>
          {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ${trade.currency}`}
        </span>
        <button onClick={() => onDelete(trade.id)} className="text-gray-300 hover:text-red-400 text-2xl leading-none p-1">×</button>
      </div>
    </div>
  )
}
