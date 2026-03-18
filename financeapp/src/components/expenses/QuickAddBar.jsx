import { useState, useContext, useMemo } from 'react'
import { SettingsContext } from '../../App'

export default function QuickAddBar({ onAdd, keywordMap, categoryNames }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  // Build reverse map: category -> keywords[]
  const keywordsByCategory = useMemo(() => {
    const map = {}
    if (!keywordMap) return map
    for (const [kw, cat] of Object.entries(keywordMap)) {
      if (!map[cat]) map[cat] = []
      map[cat].push(kw)
    }
    return map
  }, [keywordMap])

  const catNames = categoryNames || []

  function parse(raw) {
    const tokens = raw.trim().split(/\s+/)
    if (tokens.length === 0) return null

    // Find the amount token (can be anywhere)
    let amountIdx = -1
    let amount = NaN
    for (let i = 0; i < tokens.length; i++) {
      const v = parseFloat(tokens[i])
      if (!isNaN(v) && v > 0) {
        amount = v
        amountIdx = i
        break
      }
    }
    if (isNaN(amount)) return null

    // Remaining tokens (everything except amount)
    const rest = tokens.filter((_, i) => i !== amountIdx)

    // 1) Try exact category match first
    let category = null
    let categoryIdx = -1
    for (let i = 0; i < rest.length; i++) {
      const matched = catNames.find(c => c.toLowerCase() === rest[i].toLowerCase())
      if (matched) {
        category = matched
        categoryIdx = i
        break
      }
    }

    // 2) If no exact match, try keyword matching
    if (!category && keywordMap) {
      for (let i = 0; i < rest.length; i++) {
        const kw = rest[i].toLowerCase()
        if (keywordMap[kw]) {
          category = keywordMap[kw]
          break // don't remove keyword from notes — it's useful context
        }
      }
    }

    category = category ?? 'Other'

    // Notes = everything that's not the amount or exact category name
    const notes = rest.filter((_, i) => i !== categoryIdx).join(' ')

    return {
      date: new Date().toISOString().split('T')[0],
      amount,
      category,
      notes,
      currency: defaultCurrency,
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const data = parse(input)
    if (!data) {
      setError('Include an amount — e.g. "12.50 lunch" or "5 mrt"')
      return
    }
    try {
      await onAdd(data)
      setInput('')
    } catch (err) {
      setError(err.message || 'Failed to add expense')
    }
  }

  return (
    <div className="space-y-1">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder='Quick add: "12.50 lunch" or "5 mrt"'
            className="w-full bg-input border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
          />
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
        <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
          + Add
        </button>
      </form>
      <button type="button" onClick={() => setShowGuide(v => !v)}
        className="text-xs text-accent hover:underline">
        {showGuide ? 'Hide' : 'Show'} keyword guide
      </button>
      {showGuide && (
        <div className="bg-base rounded-lg p-3 text-xs text-text-secondary space-y-1.5">
          <p className="font-medium text-text-primary">Type an amount + a keyword and it auto-picks the category:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(keywordsByCategory).map(([cat, keywords]) => (
              <div key={cat}>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{cat}:</span>{' '}
                {keywords.slice(0, 7).join(', ')}
                {keywords.length > 7 ? '...' : ''}
              </div>
            ))}
          </div>
          <p className="text-text-muted">e.g. "12.50 lunch at hawker" → Food · "3.20 mrt" → Transport</p>
        </div>
      )}
    </div>
  )
}
