import { useState, useContext } from 'react'
import { SettingsContext } from '../../App'
import { CATEGORIES } from './ExpenseForm'

// Common keywords that auto-map to categories
const KEYWORD_MAP = {
  // Food
  lunch: 'Food', dinner: 'Food', breakfast: 'Food', hawker: 'Food', makan: 'Food',
  coffee: 'Food', tea: 'Food', snack: 'Food', supper: 'Food', brunch: 'Food',
  grab: 'Food', foodpanda: 'Food', deliveroo: 'Food', mcdonalds: 'Food', kfc: 'Food',
  bubble: 'Food', boba: 'Food', rice: 'Food', noodle: 'Food', noodles: 'Food',
  // Transport
  mrt: 'Transport', bus: 'Transport', taxi: 'Transport', fuel: 'Transport',
  petrol: 'Transport', parking: 'Transport', ezlink: 'Transport', uber: 'Transport',
  toll: 'Transport', train: 'Transport',
  // Shopping
  clothes: 'Shopping', shoes: 'Shopping', shirt: 'Shopping', pants: 'Shopping',
  online: 'Shopping', shopee: 'Shopping', lazada: 'Shopping', amazon: 'Shopping',
  // Entertainment
  movie: 'Entertainment', movies: 'Entertainment', netflix: 'Entertainment',
  concert: 'Entertainment', game: 'Entertainment', games: 'Entertainment',
  karaoke: 'Entertainment', spotify: 'Entertainment',
  // Health
  doctor: 'Health', clinic: 'Health', medicine: 'Health', pharmacy: 'Health',
  dental: 'Health', dentist: 'Health', gym: 'Health', vitamin: 'Health',
  // Education
  book: 'Education', books: 'Education', course: 'Education', tuition: 'Education',
  udemy: 'Education', class: 'Education',
  // Utilities
  electric: 'Utilities', water: 'Utilities', internet: 'Utilities', phone: 'Utilities',
  wifi: 'Utilities', bill: 'Utilities', mobile: 'Utilities',
  // Groceries
  grocery: 'Groceries', groceries: 'Groceries', supermarket: 'Groceries',
  fairprice: 'Groceries', coldstore: 'Groceries', sheng: 'Groceries',
  // Travel
  hotel: 'Travel', flight: 'Travel', airbnb: 'Travel', luggage: 'Travel',
  visa: 'Travel', airport: 'Travel',
}

export default function QuickAddBar({ onAdd }) {
  const { defaultCurrency } = useContext(SettingsContext)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

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
      const matched = CATEGORIES.find(c => c.toLowerCase() === rest[i].toLowerCase())
      if (matched) {
        category = matched
        categoryIdx = i
        break
      }
    }

    // 2) If no exact match, try keyword matching
    if (!category) {
      for (let i = 0; i < rest.length; i++) {
        const kw = rest[i].toLowerCase()
        if (KEYWORD_MAP[kw]) {
          category = KEYWORD_MAP[kw]
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
          + Add
        </button>
      </form>
      <button type="button" onClick={() => setShowGuide(v => !v)}
        className="text-xs text-blue-500 hover:underline">
        {showGuide ? 'Hide' : 'Show'} keyword guide
      </button>
      {showGuide && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
          <p className="font-medium text-gray-700">Type an amount + a keyword and it auto-picks the category:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="font-medium text-orange-600">Food:</span> lunch, dinner, breakfast, coffee, hawker, grab, makan</div>
            <div><span className="font-medium text-blue-600">Transport:</span> mrt, bus, taxi, fuel, petrol, parking, ezlink</div>
            <div><span className="font-medium text-pink-600">Shopping:</span> clothes, shoes, shopee, lazada, amazon</div>
            <div><span className="font-medium text-purple-600">Entertainment:</span> movie, netflix, concert, game, karaoke</div>
            <div><span className="font-medium text-green-600">Health:</span> doctor, clinic, medicine, pharmacy, gym, dental</div>
            <div><span className="font-medium text-yellow-600">Education:</span> book, course, tuition, udemy</div>
            <div><span className="font-medium text-gray-600">Utilities:</span> electric, water, internet, phone, bill</div>
            <div><span className="font-medium text-lime-600">Groceries:</span> grocery, supermarket, fairprice, coldstore</div>
            <div><span className="font-medium text-cyan-600">Travel:</span> hotel, flight, airbnb, airport</div>
          </div>
          <p className="text-gray-400">e.g. "12.50 lunch at hawker" → Food · "3.20 mrt" → Transport</p>
        </div>
      )}
    </div>
  )
}
