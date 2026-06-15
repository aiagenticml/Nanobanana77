import { useState } from 'react'
import { useTrips, STANDARD_TRIP_CATEGORIES } from '../hooks/useTrips'
import { TRIP_CURRENCIES } from '../lib/currencyUtils'
import EmptyState from '../components/shared/EmptyState'
import ErrorBanner from '../components/shared/ErrorBanner'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function TripForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    destination: '',
    currency: 'JPY',
    exchange_rate_to_sgd: '',
    start_date: todayStr(),
    end_date: '',
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.exchange_rate_to_sgd) return
    onSubmit({
      name: form.name.trim(),
      destination: form.destination.trim() || null,
      currency: form.currency,
      exchange_rate_to_sgd: parseFloat(form.exchange_rate_to_sgd),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-text-primary">New Trip</p>
      <input
        type="text"
        placeholder="Trip name (e.g. Tokyo 2025)"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        autoFocus
        required
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <input
        type="text"
        placeholder="Destination (optional)"
        value={form.destination}
        onChange={e => set('destination', e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1">Currency</label>
          <select
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
          >
            {Object.keys(TRIP_CURRENCIES).sort().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1">Rate to SGD (1 {form.currency} = ? SGD)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 0.0089"
            value={form.exchange_rate_to_sgd}
            onChange={e => set('exchange_rate_to_sgd', e.target.value)}
            required
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1">Start date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1">End date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={e => set('end_date', e.target.value)}
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="border border-border text-text-secondary rounded-lg px-4 py-2 text-sm hover:bg-card-hover transition-colors">Cancel</button>
        <button type="submit" className="bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors">Create Trip</button>
      </div>
    </form>
  )
}

function ExpenseForm({ tripCurrency, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    date: todayStr(),
    category: STANDARD_TRIP_CATEGORIES[0],
    amount: '',
    note: '',
    currency: tripCurrency,
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    onSubmit({ date: form.date, category: form.category, amount: amt, note: form.note.trim() || null, currency: form.currency })
  }

  const currencyOptions = [...new Set([tripCurrency, 'SGD', 'USD', 'EUR'])]

  return (
    <form onSubmit={handleSubmit} className="bg-bg-base rounded-lg p-3 space-y-2 mt-2 border border-border/50">
      <div className="flex gap-2">
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className="flex-1 bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        >
          {STANDARD_TRIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
          className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={form.currency}
          onChange={e => set('currency', e.target.value)}
          className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        >
          {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          autoFocus
          required
          className="flex-1 bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
      </div>
      <input
        type="text"
        placeholder="Note (optional)"
        value={form.note}
        onChange={e => set('note', e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-text-muted text-sm px-2">Cancel</button>
        <button type="submit" className="bg-accent text-white rounded-lg px-3 py-1.5 text-sm hover:bg-accent-hover transition-colors">Add</button>
      </div>
    </form>
  )
}

function EditExpenseForm({ expense, tripCurrency, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: expense.date,
    category: expense.category,
    amount: String(expense.amount),
    note: expense.note || '',
    currency: expense.currency || tripCurrency,
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    onSave({ date: form.date, category: form.category, amount: amt, note: form.note.trim() || null, currency: form.currency })
  }

  const currencyOptions = [...new Set([tripCurrency, 'SGD', 'USD', 'EUR'])]

  return (
    <form onSubmit={handleSubmit} className="bg-bg-base rounded-lg p-3 space-y-2 border border-accent/30">
      <div className="flex gap-2">
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className="flex-1 bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        >
          {STANDARD_TRIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
          className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={form.currency}
          onChange={e => set('currency', e.target.value)}
          className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        >
          {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          autoFocus
          required
          className="flex-1 bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
      </div>
      <input
        type="text"
        placeholder="Note (optional)"
        value={form.note}
        onChange={e => set('note', e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-text-muted text-sm px-2">Cancel</button>
        <button type="submit" className="bg-accent text-white rounded-lg px-3 py-1.5 text-sm hover:bg-accent-hover transition-colors">Save</button>
      </div>
    </form>
  )
}

function EditTripRateForm({ trip, onSave, onCancel }) {
  const [rate, setRate] = useState(String(trip.exchange_rate_to_sgd))

  function handleSubmit(e) {
    e.preventDefault()
    const r = parseFloat(rate)
    if (!r || r <= 0) return
    onSave({ exchange_rate_to_sgd: r })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <span className="text-xs text-text-muted">1 {trip.currency} =</span>
      <input
        type="text"
        inputMode="decimal"
        value={rate}
        onChange={e => setRate(e.target.value)}
        autoFocus
        className="w-28 bg-input border border-border text-text-primary rounded-lg px-2 py-1 text-xs focus:border-border-focus focus:outline-none"
      />
      <span className="text-xs text-text-muted">SGD</span>
      <button type="submit" className="bg-accent text-white rounded px-2 py-1 text-xs hover:bg-accent-hover">Save</button>
      <button type="button" onClick={onCancel} className="text-text-muted text-xs px-1">Cancel</button>
    </form>
  )
}

export default function Overseas() {
  const {
    trips, loading, error,
    addTrip, updateTrip, deleteTrip,
    addTripExpense, updateTripExpense, deleteTripExpense,
    expensesForTrip, totalForTrip, totalSGDForTrip,
  } = useTrips()

  const [showTripForm, setShowTripForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [addingExpenseFor, setAddingExpenseFor] = useState(null)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [editingRateFor, setEditingRateFor] = useState(null)
  const [deletingTripId, setDeletingTripId] = useState(null)

  async function handleAddTrip(data) {
    try {
      await addTrip(data)
      setShowTripForm(false)
    } catch { /* surfaced via hook state */ }
  }

  async function handleAddExpense(tripId, data) {
    try {
      await addTripExpense(tripId, data)
      setAddingExpenseFor(null)
    } catch { /* surfaced via hook state */ }
  }

  async function handleUpdateExpense(expenseId, data) {
    try {
      await updateTripExpense(expenseId, data)
      setEditingExpenseId(null)
    } catch { /* surfaced via hook state */ }
  }

  async function handleUpdateRate(tripId, data) {
    try {
      await updateTrip(tripId, data)
      setEditingRateFor(null)
    } catch { /* surfaced via hook state */ }
  }

  async function handleDeleteTrip(id) {
    try {
      await deleteTrip(id)
      setDeletingTripId(null)
      if (expandedId === id) setExpandedId(null)
    } catch { /* surfaced via hook state */ }
  }

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

      {/* Header summary */}
      {trips.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-text-muted text-xs mb-1">Total trips</p>
          <p className="text-2xl font-mono text-highlight">{trips.length}</p>
          <p className="text-text-muted text-xs mt-1">
            Combined SGD spend: S$ {trips.reduce((sum, t) => sum + totalSGDForTrip(t), 0).toFixed(2)}
          </p>
        </div>
      )}

      {/* Trip cards */}
      {trips.length === 0 && !showTripForm && (
        <EmptyState icon="✈️" message="No trips yet" sub="Track your overseas spending by trip" />
      )}

      {trips.map((trip) => {
        const expenses = expensesForTrip(trip.id)
        const total = totalForTrip(trip)
        const totalSGD = totalSGDForTrip(trip)
        const isExpanded = expandedId === trip.id

        // Build category totals in SGD — always show all standard categories
        const rate = parseFloat(trip.exchange_rate_to_sgd || 1)
        const byCategory = Object.fromEntries(STANDARD_TRIP_CATEGORIES.map(c => [c, 0]))
        for (const e of expenses) {
          const amt = parseFloat(e.amount || 0)
          const cur = e.currency || trip.currency
          const sgd = cur === 'SGD' ? amt : cur === trip.currency ? amt * rate : 0
          if (byCategory[e.category] !== undefined) {
            byCategory[e.category] += sgd
          } else {
            byCategory[e.category] = sgd
          }
        }

        return (
          <div key={trip.id} className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Trip header */}
            <button
              className="w-full p-4 flex items-center justify-between text-left"
              onClick={() => setExpandedId(isExpanded ? null : trip.id)}
            >
              <div>
                <p className="text-text-primary font-medium text-sm">{trip.name}</p>
                {trip.destination && <p className="text-text-muted text-xs">{trip.destination}</p>}
                <p className="text-text-muted text-xs mt-0.5">
                  {trip.start_date && trip.end_date ? `${trip.start_date} → ${trip.end_date}` : trip.start_date || ''}
                </p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="font-mono text-highlight text-sm">S$ {totalSGD.toFixed(2)}</p>
                </div>
                <svg className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border">
                {/* Exchange rate row */}
                <div className="px-4 py-3 border-b border-border/50 bg-card-hover/30">
                  {editingRateFor === trip.id ? (
                    <EditTripRateForm
                      trip={trip}
                      onSave={(data) => handleUpdateRate(trip.id, data)}
                      onCancel={() => setEditingRateFor(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">
                        Exchange rate: 1 {trip.currency} = {trip.exchange_rate_to_sgd} SGD
                      </span>
                      <button
                        onClick={() => setEditingRateFor(trip.id)}
                        className="text-xs text-accent hover:underline"
                      >
                        Edit rate
                      </button>
                    </div>
                  )}
                </div>

                {/* Category breakdown — always show all 6 */}
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-xs text-text-muted mb-2">By category</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(byCategory).map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between items-center py-0.5">
                        <span className={`text-xs ${amt > 0 ? 'text-text-secondary' : 'text-text-muted'}`}>{cat}</span>
                        <span className={`text-xs font-mono ${amt > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                          S$ {amt.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expenses list */}
                <div className="px-4 pb-4">
                  <div className="flex justify-between items-center pt-3 pb-2">
                    <span className="text-text-muted text-xs">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setAddingExpenseFor(addingExpenseFor === trip.id ? null : trip.id)}
                        className="bg-accent text-white rounded-lg px-3 py-1 text-xs hover:bg-accent-hover transition-colors"
                      >
                        + Add expense
                      </button>
                      <button
                        onClick={() => setDeletingTripId(trip.id)}
                        className="text-text-muted hover:text-danger transition-colors"
                        title="Delete trip"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {addingExpenseFor === trip.id && (
                    <ExpenseForm
                      tripCurrency={trip.currency}
                      onSubmit={(data) => handleAddExpense(trip.id, data)}
                      onCancel={() => setAddingExpenseFor(null)}
                    />
                  )}

                  {expenses.length === 0 && addingExpenseFor !== trip.id && (
                    <p className="text-text-muted text-xs py-2">No expenses yet. Add your first one above.</p>
                  )}

                  {expenses
                    .slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((entry) => (
                    <div key={entry.id} className="py-2 border-b border-border last:border-0">
                      {editingExpenseId === entry.id ? (
                        <EditExpenseForm
                          expense={entry}
                          tripCurrency={trip.currency}
                          onSave={(data) => handleUpdateExpense(entry.id, data)}
                          onCancel={() => setEditingExpenseId(null)}
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted bg-card-hover px-1.5 py-0.5 rounded">{entry.category}</span>
                              {entry.note && <span className="text-xs text-text-secondary truncate">{entry.note}</span>}
                            </div>
                            <span className="text-xs text-text-muted">{entry.date}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <span className="font-mono text-sm text-text-primary">{entry.currency || trip.currency} {parseFloat(entry.amount).toFixed(2)}</span>
                              {(() => {
                                const cur = entry.currency || trip.currency
                                if (cur === 'SGD') return null
                                const amt = parseFloat(entry.amount || 0)
                                const sgd = cur === trip.currency ? amt * rate : 0
                                return sgd > 0 ? <p className="font-mono text-xs text-text-muted">≈ S$ {sgd.toFixed(2)}</p> : null
                              })()}
                            </div>
                            <button
                              onClick={() => setEditingExpenseId(entry.id)}
                              className="text-text-muted hover:text-accent transition-colors"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteTripExpense(entry.id)}
                              className="text-text-muted hover:text-danger transition-colors"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Add trip form or button */}
      {showTripForm ? (
        <TripForm onSubmit={handleAddTrip} onCancel={() => setShowTripForm(false)} />
      ) : (
        <button
          onClick={() => setShowTripForm(true)}
          className="w-full bg-card border border-border border-dashed rounded-xl p-3 text-text-muted hover:text-text-primary hover:border-border-focus transition-colors text-sm flex items-center justify-center gap-1"
        >
          <span className="text-lg leading-none">+</span> New trip
        </button>
      )}

      {/* Delete confirmation dialog */}
      {deletingTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-text-primary font-medium mb-2">Delete this trip?</p>
            <p className="text-text-muted text-xs mb-4">All expenses for this trip will be deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingTripId(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
              <button onClick={() => handleDeleteTrip(deletingTripId)} className="flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
