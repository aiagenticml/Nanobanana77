import { useState, useEffect, useContext } from 'react'
import { SettingsContext } from '../../App'
import ImageUpload from '../shared/ImageUpload'
import { calcPnL } from '../../lib/tradeCalc'

const CURRENCIES = ['USD', 'SGD', 'EUR', 'GBP', 'JPY']

export const SETUP_TAGS = [
  'breakout', 'reversal', 'trend-follow', 'pullback', 'range', 'news', 'scalp', 'swing', 'other'
]

const inputClass = 'w-full bg-surface-50 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:border-accent focus:outline-none'
const labelClass = 'block text-sm font-medium text-text-secondary mb-1'

export default function TradeForm({ trade, onSubmit, onCancel }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const today = new Date().toISOString().split('T')[0]
  const isEdit = !!trade

  const [form, setForm] = useState({
    date: trade?.date ?? today,
    symbol: trade?.symbol ?? '',
    instrument: trade?.instrument ?? 'forex',
    direction: trade?.direction ?? 'long',
    entry_price: trade ? String(trade.entry_price) : '',
    exit_price: trade?.exit_price ? String(trade.exit_price) : '',
    size: trade ? String(trade.size) : '',
    pnl: trade?.pnl != null ? String(trade.pnl) : '',
    currency: trade?.currency ?? defaultCurrency ?? 'USD',
    setup_tag: trade?.setup_tag ?? '',
    notes: trade?.notes ?? '',
    screenshot_url: trade?.screenshot_url ?? null,
    account: trade?.account ?? '',
    pnl_override: trade?.pnl != null,
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  useEffect(() => {
    if (form.pnl_override) return
    const entry = parseFloat(form.entry_price)
    const exit = parseFloat(form.exit_price)
    const size = parseFloat(form.size)
    if (!isNaN(entry) && !isNaN(exit) && !isNaN(size) && size > 0) {
      const calculated = calcPnL({ entry_price: entry, exit_price: exit, size, direction: form.direction })
      if (calculated != null) {
        setForm(f => ({ ...f, pnl: calculated.toFixed(2) }))
      }
    }
  }, [form.entry_price, form.exit_price, form.size, form.direction, form.pnl_override])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        symbol: form.symbol.toUpperCase(),
        instrument: form.instrument,
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
        size: parseFloat(form.size),
        pnl: form.pnl !== '' ? parseFloat(form.pnl) : null,
        currency: form.currency,
        setup_tag: form.setup_tag || null,
        notes: form.notes || null,
        screenshot_url: form.screenshot_url,
        account: form.account || null,
      }
      await onSubmit(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Date</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          className={inputClass} required />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className={labelClass}>Symbol</label>
          <input type="text" placeholder="EURUSD" value={form.symbol} onChange={e => set('symbol', e.target.value)}
            className={`${inputClass} uppercase`} required />
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className={inputClass}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Instrument</label>
        <div className="flex gap-2">
          {['forex', 'futures'].map(type => (
            <button key={type} type="button" onClick={() => set('instrument', type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                form.instrument === type ? 'bg-accent text-surface border-accent' : 'border-border text-text-secondary'
              }`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Direction</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => set('direction', 'long')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.direction === 'long' ? 'bg-profit text-surface border-profit' : 'border-border text-text-secondary'
            }`}>
            Long
          </button>
          <button type="button" onClick={() => set('direction', 'short')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.direction === 'short' ? 'bg-loss text-surface border-loss' : 'border-border text-text-secondary'
            }`}>
            Short
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className={labelClass}>Entry Price</label>
          <input type="number" step="any" placeholder="1.0850" value={form.entry_price}
            onChange={e => set('entry_price', e.target.value)}
            className={inputClass} required />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Exit Price</label>
          <input type="number" step="any" placeholder="1.0900" value={form.exit_price}
            onChange={e => set('exit_price', e.target.value)}
            className={inputClass} />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className={labelClass}>
            {form.instrument === 'futures' ? 'Contracts' : 'Lots'}
          </label>
          <input type="number" step="any" min="0" placeholder="1" value={form.size}
            onChange={e => set('size', e.target.value)}
            className={inputClass} required />
        </div>
        <div className="flex-1">
          <label className={labelClass}>
            P&amp;L ({form.currency})
            {!form.pnl_override && form.exit_price && (
              <span className="font-normal text-text-muted ml-1">auto</span>
            )}
          </label>
          <input type="number" step="0.01" placeholder="0.00" value={form.pnl}
            onChange={e => {
              set('pnl', e.target.value)
              set('pnl_override', true)
            }}
            className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Setup Tag</label>
        <select value={form.setup_tag} onChange={e => set('setup_tag', e.target.value)}
          className={inputClass}>
          <option value="">— none —</option>
          {SETUP_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Account</label>
        <input type="text" placeholder="e.g. FTMO, IC Markets Live" value={form.account}
          onChange={e => set('account', e.target.value)}
          className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea rows={3} placeholder="What did you see? Why did you enter?" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className={`${inputClass} resize-none`} />
      </div>

      <ImageUpload label="Screenshot (optional)" value={form.screenshot_url}
        onChange={url => set('screenshot_url', url)} folder="trade-screenshots" />

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-accent text-surface rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Trade'}
        </button>
      </div>
    </form>
  )
}
