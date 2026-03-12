import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'
import { CATEGORIES } from './ExpenseForm'

export default function QuickAddBar({ onAdd }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

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

    // Find category match in remaining tokens
    let category = 'Other'
    let categoryIdx = -1
    for (let i = 0; i < rest.length; i++) {
      const matched = CATEGORIES.find(c => c.toLowerCase() === rest[i].toLowerCase())
      if (matched) {
        category = matched
        categoryIdx = i
        break
      }
    }

    // Notes = everything that's not the amount or category
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
      setError('Include an amount — e.g. "12.50 food hawker lunch" or "food 12.50 lunch"')
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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          placeholder='Quick add: "12.50 food lunch" or "food 12.50"'
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
        + Add
      </button>
    </form>
  )
}
