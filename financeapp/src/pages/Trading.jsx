import { useState } from 'react'
import { useTrading } from '../hooks/useTrading'
import EmptyState from '../components/shared/EmptyState'
import ErrorBanner from '../components/shared/ErrorBanner'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function EntryForm({ type, onSubmit, onCancel }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [entryDate, setEntryDate] = useState(todayStr())

  function handleSubmit(e) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    onSubmit({ type, amount: amt, description: description.trim() || null, entry_date: entryDate })
  }

  const isEarning = type === 'earning'

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-text-primary">
        {isEarning ? '+ Add Earning' : '− Add Expense'}
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount (SGD)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
          required
          className="flex-1 bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
        <input
          type="date"
          value={entryDate}
          onChange={e => setEntryDate(e.target.value)}
          className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
      </div>
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="border border-border text-text-secondary rounded-lg px-4 py-2 text-sm hover:bg-card-hover transition-colors">Cancel</button>
        <button
          type="submit"
          className={`text-white rounded-lg px-4 py-2 text-sm transition-colors ${isEarning ? 'bg-positive hover:bg-positive/80' : 'bg-danger hover:bg-danger/80'}`}
        >
          Add
        </button>
      </div>
    </form>
  )
}

export default function Trading() {
  const { entries, loading, error, addEntry, deleteEntry, totalNet, totalEarnings, totalExpenses } = useTrading()
  const [addingType, setAddingType] = useState(null) // 'expense' | 'earning' | null

  async function handleAdd(data) {
    try {
      await addEntry(data)
      setAddingType(null)
    } catch { /* surfaced via hook state */ }
  }

  const netColor = totalNet > 0 ? 'text-positive' : totalNet < 0 ? 'text-danger' : 'text-text-muted'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-44">
      {error && <ErrorBanner message={error} onDismiss={() => {}} />}

      {/* Net total */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-text-muted text-xs mb-1">Total Net (SGD)</p>
        <p className={`text-3xl font-mono ${netColor}`}>
          {totalNet >= 0 ? '+' : ''}S$ {totalNet.toFixed(2)}
        </p>
        <div className="flex gap-4 mt-2">
          <div>
            <span className="text-xs text-text-muted">Earnings: </span>
            <span className="text-xs font-mono text-positive">+S$ {totalEarnings.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-xs text-text-muted">Expenses: </span>
            <span className="text-xs font-mono text-danger">−S$ {totalExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {addingType === null && (
        <div className="flex gap-2">
          <button
            onClick={() => setAddingType('earning')}
            className="flex-1 py-2.5 bg-positive/10 border border-positive/30 text-positive rounded-xl text-sm font-medium hover:bg-positive/20 transition-colors"
          >
            + Add Earning
          </button>
          <button
            onClick={() => setAddingType('expense')}
            className="flex-1 py-2.5 bg-danger/10 border border-danger/30 text-danger rounded-xl text-sm font-medium hover:bg-danger/20 transition-colors"
          >
            − Add Expense
          </button>
        </div>
      )}

      {/* Entry form */}
      {addingType && (
        <EntryForm
          type={addingType}
          onSubmit={handleAdd}
          onCancel={() => setAddingType(null)}
        />
      )}

      {/* Entry list */}
      {entries.length === 0 && (
        <EmptyState icon="📈" message="No trading entries yet" sub="Track your trading earnings and expenses" />
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isEarning = entry.type === 'earning'
            return (
              <div key={entry.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${isEarning ? 'bg-positive' : 'bg-danger'}`} />
                <div className="flex-1 min-w-0">
                  {entry.description && (
                    <p className="text-sm text-text-primary truncate">{entry.description}</p>
                  )}
                  <p className="text-xs text-text-muted">{entry.entry_date} · {isEarning ? 'Earning' : 'Expense'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-mono text-sm font-medium ${isEarning ? 'text-positive' : 'text-danger'}`}>
                    {isEarning ? '+' : '−'}S$ {parseFloat(entry.amount).toFixed(2)}
                  </span>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-text-muted hover:text-danger transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
