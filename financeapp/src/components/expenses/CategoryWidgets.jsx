import { useState } from 'react'
import { formatAmount } from '../../lib/currencyUtils'

export default function CategoryWidgets({ categories, expenses, selectedCategory, onSelect, onManageClick, defaultCurrency }) {
  const [tapped, setTapped] = useState(null)

  // Calculate spend per category
  const spendByCategory = {}
  let totalSpend = 0
  for (const exp of expenses) {
    if (exp.currency === defaultCurrency) {
      const amt = parseFloat(exp.amount)
      spendByCategory[exp.category] = (spendByCategory[exp.category] || 0) + amt
      totalSpend += amt
    }
  }

  function handleClick(catName) {
    if (selectedCategory === catName) {
      onSelect(null)
    } else {
      onSelect(catName)
    }
    setTapped(catName)
    setTimeout(() => setTapped(null), 150)
  }

  return (
    <div className="relative">
      {/* Gear icon top-right */}
      <button
        onClick={onManageClick}
        className="absolute -top-1 -right-1 p-1 z-10"
        title="Manage categories"
      >
        <svg className="w-4 h-4 text-text-muted hover:text-text-primary cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div className="grid grid-cols-3 gap-2">
        {/* "All" card */}
        <button
          onClick={() => { onSelect(null); setTapped('__all__'); setTimeout(() => setTapped(null), 150) }}
          className={`bg-card border rounded-lg p-2 cursor-pointer border-t-[3px] transition-colors text-left ${
            selectedCategory === null ? 'ring-1 ring-accent border-accent' : 'border-border'
          } ${tapped === '__all__' ? 'animate-tap' : ''}`}
          style={{ borderTopColor: '#9a8e80' }}
        >
          <div className="text-xs text-text-primary truncate">All</div>
          <div className="font-mono text-xs text-highlight">{formatAmount(totalSpend, defaultCurrency)}</div>
        </button>

        {/* Category cards */}
        {categories.map(cat => (
          <button
            key={cat.id || cat.name}
            onClick={() => handleClick(cat.name)}
            className={`bg-card border rounded-lg p-2 cursor-pointer border-t-[3px] transition-colors text-left ${
              selectedCategory === cat.name ? 'ring-1 ring-accent border-accent' : 'border-border'
            } ${tapped === cat.name ? 'animate-tap' : ''}`}
            style={{ borderTopColor: cat.color_hex }}
          >
            <div className="text-xs text-text-primary truncate">{cat.name}</div>
            <div className="font-mono text-xs text-highlight">
              {formatAmount(spendByCategory[cat.name] || 0, defaultCurrency)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
