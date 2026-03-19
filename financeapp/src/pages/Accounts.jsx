import { useState, useContext } from 'react'
import { SettingsContext } from '../App'
import { useAccounts } from '../hooks/useAccounts'
import { formatAmount } from '../lib/currencyUtils'
import EmptyState from '../components/shared/EmptyState'
import ErrorBanner from '../components/shared/ErrorBanner'

const ACCOUNT_COLORS = [
  '#c47a5a', '#d4a574', '#7a8c6e', '#5a7a94',
  '#9a7080', '#7a6a94', '#5a8c8c', '#9a8e80',
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function AccountForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [colorHex, setColorHex] = useState(ACCOUNT_COLORS[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || null, color_hex: colorHex })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input
        type="text"
        placeholder="Account name (e.g. IBKR, DBS Savings)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <div className="flex gap-2 flex-wrap">
        {ACCOUNT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColorHex(c)}
            className={`w-7 h-7 rounded-full transition-transform ${colorHex === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-card' : ''}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="border border-border text-text-secondary rounded-lg px-4 py-2 text-sm hover:bg-card-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
        >
          Create Account
        </button>
      </div>
    </form>
  )
}

function EntryForm({ onSubmit, onCancel }) {
  const [entryType, setEntryType] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [entryDate, setEntryDate] = useState(todayStr())

  function handleSubmit(e) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt) return
    onSubmit({ amount: amt, note: note.trim() || null, entry_date: entryDate, entry_type: entryType })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-base rounded-lg p-3 space-y-2 mt-2">
      <div className="flex gap-1 p-0.5 bg-input rounded-lg">
        <button
          type="button"
          onClick={() => setEntryType('deposit')}
          className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${entryType === 'deposit' ? 'bg-positive text-white' : 'text-text-muted'}`}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => setEntryType('withdrawal')}
          className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${entryType === 'withdrawal' ? 'bg-danger text-white' : 'text-text-muted'}`}
        >
          Withdrawal
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Amount"
          step="0.01"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        />
      </div>
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-text-muted text-sm px-2">Cancel</button>
        <button
          type="submit"
          className={`text-white rounded-lg px-3 py-1.5 text-sm transition-colors ${entryType === 'withdrawal' ? 'bg-danger hover:bg-danger/80' : 'bg-accent hover:bg-accent-hover'}`}
        >
          Add
        </button>
      </div>
    </form>
  )
}

export default function Accounts() {
  const { defaultCurrency } = useContext(SettingsContext)
  const { accounts, entries, loading, error, addAccount, deleteAccount, addEntry, deleteEntry, balanceByAccount, totalNetWorth } = useAccounts()

  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [addingEntryFor, setAddingEntryFor] = useState(null)

  async function handleAddAccount(data) {
    try {
      await addAccount(data)
      setShowForm(false)
    } catch { /* error surfaced via hook state */ }
  }

  async function handleAddEntry(accountId, data) {
    try {
      await addEntry(accountId, data)
      setAddingEntryFor(null)
    } catch { /* error surfaced via hook state */ }
  }

  async function handleDeleteEntry(id) {
    try {
      await deleteEntry(id)
    } catch { /* error surfaced via hook state */ }
  }

  async function handleDeleteAccount(id) {
    try {
      await deleteAccount(id)
      if (expandedId === id) setExpandedId(null)
    } catch { /* error surfaced via hook state */ }
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

      {/* Net Worth Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-text-muted text-xs mb-1">Total Net Worth</p>
        <p className="text-3xl font-mono text-highlight">{formatAmount(totalNetWorth, defaultCurrency)}</p>
        <p className="text-text-muted text-xs mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 && !showForm && (
        <EmptyState icon="🏦" message="No accounts yet" sub="Create accounts to track where your money goes" />
      )}

      {accounts.map((account) => {
        const balance = balanceByAccount[account.id] || 0
        const accountEntries = entries
          .filter(e => e.account_id === account.id)
          .sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))
        const isExpanded = expandedId === account.id

        return (
          <div key={account.id} className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header row */}
            <button
              className="w-full p-4 flex items-center justify-between text-left"
              onClick={() => setExpandedId(isExpanded ? null : account.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: account.color_hex }} />
                <div>
                  <p className="text-text-primary font-medium text-sm">{account.name}</p>
                  {account.description && <p className="text-text-muted text-xs">{account.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-highlight text-sm">{formatAmount(balance, defaultCurrency)}</span>
                <svg
                  className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded entries */}
            {isExpanded && (
              <div className="border-t border-border px-4 pb-4">
                <div className="flex justify-between items-center pt-3 pb-2">
                  <span className="text-text-muted text-xs">{accountEntries.length} entr{accountEntries.length !== 1 ? 'ies' : 'y'}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAddingEntryFor(addingEntryFor === account.id ? null : account.id)}
                      className="bg-accent text-white rounded-lg px-3 py-1 text-xs hover:bg-accent-hover transition-colors"
                    >
                      + Add entry
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-text-muted hover:text-danger transition-colors"
                      title="Delete account"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {addingEntryFor === account.id && (
                  <EntryForm
                    onSubmit={(data) => handleAddEntry(account.id, data)}
                    onCancel={() => setAddingEntryFor(null)}
                  />
                )}

                {accountEntries.length === 0 && addingEntryFor !== account.id && (
                  <p className="text-text-muted text-xs py-2">No deposits yet. Add your first one above.</p>
                )}

                {accountEntries.map((entry) => {
                  const isWithdrawal = entry.entry_type === 'withdrawal'
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className={`font-mono text-sm ${isWithdrawal ? 'text-danger' : 'text-highlight'}`}>
                          {isWithdrawal ? '−' : '+'}{formatAmount(parseFloat(entry.amount), defaultCurrency)}
                        </span>
                        {entry.note && <span className="text-text-muted text-xs ml-2">{entry.note}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-xs">{entry.entry_date}</span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
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
      })}

      {/* Add Account */}
      {showForm ? (
        <AccountForm onSubmit={handleAddAccount} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-card border border-border border-dashed rounded-xl p-3 text-text-muted hover:text-text-primary hover:border-border-focus transition-colors text-sm flex items-center justify-center gap-1"
        >
          <span className="text-lg leading-none">+</span> Add account
        </button>
      )}
    </div>
  )
}
