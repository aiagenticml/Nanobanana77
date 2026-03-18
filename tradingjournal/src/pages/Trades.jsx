import { useState, useEffect } from 'react'
import { useTrades } from '../hooks/useTrades'
import { supabase } from '../lib/supabase'
import TradeList from '../components/trades/TradeList'
import TradeForm from '../components/trades/TradeForm'
import Modal from '../components/shared/Modal'
import ErrorBanner from '../components/shared/ErrorBanner'

const CURRENT_MONTH = new Date().toISOString().slice(0, 7)
const selectClass = 'bg-surface-50 border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none'

export default function Trades() {
  const [filters, setFilters] = useState({ month: CURRENT_MONTH })
  const [showAdd, setShowAdd] = useState(false)
  const [accounts, setAccounts] = useState([])
  const { trades, loading, error, addTrade, updateTrade, deleteTrade } = useTrades(filters)

  useEffect(() => {
    supabase.from('trades').select('account').not('account', 'is', null).then(({ data }) => {
      const unique = [...new Set((data ?? []).map(r => r.account).filter(Boolean))].sort()
      setAccounts(unique)
    })
  }, [trades])

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

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <input type="month" value={filters.month ?? ''}
            onChange={e => setFilter('month', e.target.value)}
            className={selectClass} />
          {filters.month && (
            <button onClick={() => setFilter('month', '')}
              className="text-text-muted hover:text-text-secondary text-lg leading-none px-1" title="Show all time">
              &times;
            </button>
          )}
        </div>
        <select value={filters.instrument ?? ''} onChange={e => setFilter('instrument', e.target.value)}
          className={selectClass}>
          <option value="">All instruments</option>
          <option value="forex">Forex</option>
          <option value="futures">Futures</option>
        </select>
        <select value={filters.direction ?? ''} onChange={e => setFilter('direction', e.target.value)}
          className={selectClass}>
          <option value="">Long &amp; Short</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
        {accounts.length > 0 && (
          <select value={filters.account ?? ''} onChange={e => setFilter('account', e.target.value)}
            className={selectClass}>
            <option value="">All accounts</option>
            {accounts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted text-center py-8">Loading...</p>
      ) : (
        <TradeList trades={trades} onDelete={deleteTrade} onUpdate={updateTrade} />
      )}

      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 bg-accent text-surface rounded-full w-12 h-12 text-2xl shadow-lg flex items-center justify-center z-30 hover:bg-accent-hover transition-colors">
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
