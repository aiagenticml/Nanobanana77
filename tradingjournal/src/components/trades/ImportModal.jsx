import { useState, useContext, useRef } from 'react'
import Modal from '../shared/Modal'
import { SettingsContext } from '../../App'
import { parseTradeCSV, deduplicateTrades } from '../../lib/csvParser'
import { supabase } from '../../lib/supabase'

const PLATFORM_LABELS = { mt5: 'MetaTrader 5', tradovate: 'Tradovate', unknown: 'Unknown' }

export default function ImportModal({ onClose, onImported }) {
  const { defaultCurrency, showToast } = useContext(SettingsContext)
  const fileRef = useRef()

  const [step, setStep] = useState('upload')
  const [parsed, setParsed] = useState(null)
  const [deduped, setDeduped] = useState(null)
  const [account, setAccount] = useState('')
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    try {
      const text = await file.text()
      const result = parseTradeCSV(text, defaultCurrency)

      if (result.trades.length === 0) {
        setError('No trades found in this CSV. Check that it\'s a trade history export from MT5 or Tradovate.')
        return
      }

      const { data: existing } = await supabase.from('trades').select('date,symbol,entry_price,direction')
      const { unique, duplicates } = deduplicateTrades(result.trades, existing ?? [])

      setParsed(result)
      setDeduped({ unique, duplicates })
      setStep('preview')
    } catch (err) {
      setError('Failed to parse CSV: ' + err.message)
    }
  }

  async function handleImport() {
    if (!deduped?.unique.length) return
    setStep('importing')

    try {
      const tradesToInsert = account.trim()
        ? deduped.unique.map(t => ({ ...t, account: account.trim() }))
        : deduped.unique
      const { error: insertErr } = await supabase.from('trades').insert(tradesToInsert)
      if (insertErr) throw new Error(insertErr.message)

      showToast(`${deduped.unique.length} trade${deduped.unique.length === 1 ? '' : 's'} imported`)
      onImported?.()
      onClose()
    } catch (err) {
      setError('Import failed: ' + err.message)
      setStep('preview')
    }
  }

  return (
    <Modal title="Import Trades" onClose={onClose}>
      {error && (
        <div className="mb-4 bg-loss-muted/20 border border-loss-muted text-loss rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Upload a CSV export from MetaTrader 5 or Tradovate. The platform will be auto-detected.
          </p>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Account (optional)</label>
            <input type="text" placeholder="e.g. FTMO, IC Markets Live"
              value={account} onChange={e => setAccount(e.target.value)}
              className="w-full bg-surface-50 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:border-accent focus:outline-none" />
            <p className="text-xs text-text-muted mt-1">Label these trades for account filtering.</p>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border-light rounded-xl p-8 text-center cursor-pointer hover:border-accent-muted transition-colors"
          >
            <p className="text-sm font-medium text-text-secondary">Click to select CSV file</p>
            <p className="text-xs text-text-muted mt-1">.csv files only</p>
          </div>

          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
      )}

      {step === 'preview' && parsed && deduped && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 bg-accent-muted/30 text-accent rounded-full text-xs font-medium">
              {PLATFORM_LABELS[parsed.platform]}
            </span>
            <span className="text-text-secondary">
              {parsed.trades.length} trade{parsed.trades.length === 1 ? '' : 's'} found
            </span>
          </div>

          {deduped.duplicates.length > 0 && (
            <div className="bg-accent-muted/20 border border-accent-muted rounded-lg px-3 py-2 text-sm text-accent">
              {deduped.duplicates.length} duplicate{deduped.duplicates.length === 1 ? '' : 's'} will be skipped
            </div>
          )}

          {deduped.unique.length === 0 ? (
            <div className="bg-surface-50 rounded-lg px-3 py-4 text-center text-sm text-text-secondary">
              All trades already exist in your journal.
            </div>
          ) : (
            <>
              <div className="max-h-60 overflow-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-surface-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-text-muted font-medium">Date</th>
                      <th className="px-2 py-1.5 text-left text-text-muted font-medium">Symbol</th>
                      <th className="px-2 py-1.5 text-left text-text-muted font-medium">Dir</th>
                      <th className="px-2 py-1.5 text-right text-text-muted font-medium">Entry</th>
                      <th className="px-2 py-1.5 text-right text-text-muted font-medium">Exit</th>
                      <th className="px-2 py-1.5 text-right text-text-muted font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deduped.unique.map((t, i) => (
                      <tr key={i} className="hover:bg-surface-50">
                        <td className="px-2 py-1.5 text-text-secondary">{t.date}</td>
                        <td className="px-2 py-1.5 text-text font-medium">{t.symbol}</td>
                        <td className="px-2 py-1.5">
                          <span className={t.direction === 'long' ? 'text-profit' : 'text-loss'}>{t.direction}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right text-text-secondary">{t.entry_price}</td>
                        <td className="px-2 py-1.5 text-right text-text-secondary">{t.exit_price ?? '—'}</td>
                        <td className={`px-2 py-1.5 text-right font-medium ${
                          t.pnl == null ? 'text-text-muted' : t.pnl >= 0 ? 'text-profit' : 'text-loss'
                        }`}>
                          {t.pnl != null ? t.pnl.toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={onClose}
                  className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">
                  Cancel
                </button>
                <button onClick={handleImport}
                  className="flex-1 py-2 bg-accent text-surface rounded-lg text-sm font-medium">
                  Import {deduped.unique.length} Trade{deduped.unique.length === 1 ? '' : 's'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'importing' && (
        <div className="py-8 text-center text-sm text-text-secondary">Importing trades...</div>
      )}
    </Modal>
  )
}
