import { useState } from 'react'
import { useTrades } from '../hooks/useTrades'
import Modal from '../components/shared/Modal'
import TradeForm from '../components/trades/TradeForm'
import EmptyState from '../components/shared/EmptyState'
import ErrorBanner from '../components/shared/ErrorBanner'
import { resolvePnL } from '../lib/tradeCalc'

export default function Journal() {
  const [filters] = useState({})
  const { trades, loading, error, updateTrade, deleteTrade } = useTrades(filters)
  const [expanded, setExpanded] = useState(null)
  const [editing, setEditing] = useState(null)
  const [viewingScreenshot, setViewingScreenshot] = useState(null)

  const journaled = trades.filter(t => t.notes || t.screenshot_url || t.setup_tag)

  async function handleSave(id, data) {
    await updateTrade(id, data)
    setEditing(null)
  }

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>

  return (
    <div className="space-y-3">
      <ErrorBanner message={error} />

      {journaled.length === 0 ? (
        <EmptyState icon="📝" message="No journal entries yet"
          sub="Add notes or screenshots when logging a trade" />
      ) : (
        journaled.map(t => {
          const pnl = resolvePnL(t)
          const isOpen = t.exit_price == null
          const pnlColor = isOpen ? 'text-gray-400' : pnl >= 0 ? 'text-green-600' : 'text-red-500'
          const isExpanded = expanded === t.id

          return (
            <div key={t.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : t.id)}>
                {t.screenshot_url && (
                  <img src={t.screenshot_url} alt="Screenshot"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    onClick={e => { e.stopPropagation(); setViewingScreenshot(t.screenshot_url) }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{t.symbol}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.direction === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{t.direction}</span>
                    {t.setup_tag && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.setup_tag}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
                </div>
                <span className={`font-semibold text-sm whitespace-nowrap ${pnlColor}`}>
                  {isOpen ? 'Open' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ${t.currency}`}
                </span>
                <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  {t.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.notes}</p>
                    </div>
                  )}
                  {t.screenshot_url && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Screenshot</p>
                      <img src={t.screenshot_url} alt="Trade chart"
                        className="rounded-lg border border-gray-200 max-w-full cursor-pointer"
                        onClick={() => setViewingScreenshot(t.screenshot_url)} />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400">Entry</p>
                      <p className="font-medium text-gray-700">{t.entry_price}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400">Exit</p>
                      <p className="font-medium text-gray-700">{t.exit_price ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400">Size</p>
                      <p className="font-medium text-gray-700">{t.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(t)}
                      className="flex-1 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600">Edit</button>
                    <button onClick={() => { if (confirm('Delete this trade?')) deleteTrade(t.id) }}
                      className="py-1.5 px-3 border border-red-200 rounded-lg text-xs text-red-500">Delete</button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {editing && (
        <Modal title="Edit Trade" onClose={() => setEditing(null)}>
          <TradeForm trade={editing} onSubmit={data => handleSave(editing.id, data)} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingScreenshot(null)}>
          <img src={viewingScreenshot} alt="Trade screenshot" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
