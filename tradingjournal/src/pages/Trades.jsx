import { useState } from 'react'
import { useTrades } from '../hooks/useTrades'
import TradeList from '../components/trades/TradeList'
import TradeForm from '../components/trades/TradeForm'
import Modal from '../components/shared/Modal'
import ErrorBanner from '../components/shared/ErrorBanner'

const CURRENT_MONTH = new Date().toISOString().slice(0, 7)

export default function Trades() {
  const [filters, setFilters] = useState({ month: CURRENT_MONTH })
  const [showAdd, setShowAdd] = useState(false)
  const { trades, loading, error, addTrade, updateTrade, deleteTrade } = useTrades(filters)

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value || undefined }))
  }

  async function handleAdd(data) {
    await addTrade(data)
    setShowAdd(false)
  }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input type="month" value={filters.month ?? ''}
          onChange={e => setFilter('month', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <select value={filters.instrument ?? ''} onChange={e => setFilter('instrument', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All instruments</option>
          <option value="forex">Forex</option>
          <option value="futures">Futures</option>
        </select>
        <select value={filters.direction ?? ''} onChange={e => setFilter('direction', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">Long &amp; Short</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
      ) : (
        <TradeList trades={trades} onDelete={deleteTrade} onUpdate={updateTrade} />
      )}

      {/* Floating add button */}
      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 bg-blue-600 text-white rounded-full w-12 h-12 text-2xl shadow-lg flex items-center justify-center z-30">
        +
      </button>

      {showAdd && (
        <Modal title="Add Trade" onClose={() => setShowAdd(false)}>
          <TradeForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
