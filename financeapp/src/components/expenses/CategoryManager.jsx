import { useState } from 'react'

const PRESET_COLORS = [
  '#c47a5a', '#5a7a94', '#94707a', '#7a6a94', '#7a8c6e',
  '#c9a040', '#6b6058', '#8c946e', '#5a8c8c', '#9a8e80',
]

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete }) {
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [expandedKeywords, setExpandedKeywords] = useState(null)
  const [newKeyword, setNewKeyword] = useState('')

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    onAdd({
      name,
      color_bg: 'bg-gray-100',
      color_text: 'text-gray-700',
      color_hex: selectedColor,
      keywords: [],
    })
    setNewName('')
  }

  function handleRemoveKeyword(cat, kw) {
    const updated = (cat.keywords ?? []).filter(k => k !== kw)
    onUpdate(cat.id, { keywords: updated })
  }

  function handleAddKeyword(cat) {
    const kw = newKeyword.trim().toLowerCase()
    if (!kw) return
    const updated = [...(cat.keywords ?? []), kw]
    onUpdate(cat.id, { keywords: updated })
    setNewKeyword('')
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Category list */}
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id || cat.name}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color_hex }} />
              <span className="text-text-primary text-sm flex-1">{cat.name}</span>
              <button
                onClick={() => setExpandedKeywords(expandedKeywords === cat.id ? null : cat.id)}
                className="text-text-muted hover:text-text-primary text-xs px-1.5 py-0.5 rounded border border-border"
              >
                Keywords
              </button>
              <button
                onClick={() => onDelete(cat.id)}
                className="text-text-muted hover:text-danger text-lg leading-none px-1"
              >
                &times;
              </button>
            </div>

            {/* Keyword section */}
            {expandedKeywords === cat.id && (
              <div className="ml-5 mt-1.5 space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {(cat.keywords ?? []).map(kw => (
                    <span key={kw} className="bg-base border border-border text-text-secondary text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      {kw}
                      <button onClick={() => handleRemoveKeyword(cat, kw)} className="text-text-muted hover:text-danger leading-none">&times;</button>
                    </span>
                  ))}
                  {(cat.keywords ?? []).length === 0 && (
                    <span className="text-xs text-text-muted">No keywords</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(cat) } }}
                    placeholder="Add keyword..."
                    className="bg-input border border-border text-text-primary rounded-lg px-2 py-1 text-xs flex-1"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add category row */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="Category name"
            className="bg-input border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm flex-1"
          />
          <button onClick={handleAdd} className="bg-accent text-white rounded-lg px-3 py-1.5 text-sm">
            Add
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-5 h-5 rounded-full cursor-pointer border-2 ${
                selectedColor === color ? 'border-accent' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
