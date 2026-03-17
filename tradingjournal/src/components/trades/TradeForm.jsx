import { useState, useEffect, useContext } from 'react'
import { SettingsContext } from '../../App'
import ImageUpload from '../shared/ImageUpload'
import { calcPnL } from '../../lib/tradeCalc'

const CURRENCIES = ['USD', 'SGD', 'EUR', 'GBP', 'JPY']

export const SETUP_TAGS = [
  'breakout', 'reversal', 'trend-follow', 'pullback', 'range', 'news', 'scalp', 'swing', 'other'
]

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
    pnl_override: trade?.pnl != null,
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // Auto-calculate P&L when prices/size/direction change (unless overridden)
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
      }
      await onSubmit(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
          <input type="text" placeholder="EURUSD" value={form.symbol} onChange={e => set('symbol', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instrument</label>
        <div className="flex gap-2">
          {['forex', 'futures'].map(type => (
            <button key={type} type="button" onClick={() => set('instrument', type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                form.instrument === type ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'
              }`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => set('direction', 'long')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.direction === 'long' ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600'
            }`}>
            Long
          </button>
          <button type="button" onClick={() => set('direction', 'short')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.direction === 'short' ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600'
            }`}>
            Short
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Entry Price</label>
          <input type="number" step="any" placeholder="1.0850" value={form.entry_price}
            onChange={e => set('entry_price', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Exit Price</label>
          <input type="number" step="any" placeholder="1.0900" value={form.exit_price}
            onChange={e => set('exit_price', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {form.instrument === 'futures' ? 'Contracts' : 'Lots'}
          </label>
          <input type="number" step="any" min="0" placeholder="1" value={form.size}
            onChange={e => set('size', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            P&amp;L ({form.currency})
            {!form.pnl_override && form.exit_price && (
              <span className="font-normal text-gray-400 ml-1">auto</span>
            )}
          </label>
          <input type="number" step="0.01" placeholder="0.00" value={form.pnl}
            onChange={e => {
              set('pnl', e.target.value)
              set('pnl_override', true)
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Setup Tag</label>
        <select value={form.setup_tag} onChange={e => set('setup_tag', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">— none —</option>
          {SETUP_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea rows={3} placeholder="What did you see? Why did you enter?" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
      </div>

      <ImageUpload label="Screenshot (optional)" value={form.screenshot_url}
        onChange={url => set('screenshot_url', url)} folder="trade-screenshots" />

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Trade'}
        </button>
      </div>
    </form>
  )
}
