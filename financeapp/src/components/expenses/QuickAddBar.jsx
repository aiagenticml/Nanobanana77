import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'
import { CATEGORIES } from './ExpenseForm'

export default function QuickAddBar({ onAdd }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function parse(raw) {
    const tokens = raw.trim().split(/\s+/)
    const amount = parseFloat(tokens[0])
    if (isNaN(amount) || amount <= 0) return null

    const categoryToken = tokens[1]?.toLowerCase()
    const matched = CATEGORIES.find(c => c.toLowerCase() === categoryToken)
    const category = matched ?? 'Other'
    const notes = matched ? tokens.slice(2).join(' ') : tokens.slice(1).join(' ')

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
      setError('Format: amount [category] [notes] — e.g. "12.50 food hawker lunch"')
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
          placeholder='Quick add: "12.50 food hawker lunch"'
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
