import { useState, useRef } from 'react'
import { uploadImage } from '../../lib/uploadImage'

function RatingInput({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
            value === n ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface-50 border border-border text-text-muted hover:text-text-secondary hover:border-border-light'
          }`}>
          {n}
        </button>
      ))}
    </div>
  )
}

function ChecklistInput({ options, value = [], onChange }) {
  function toggle(opt) {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }

  return (
    <div className="space-y-1.5">
      {(options || []).map(opt => (
        <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
            value.includes(opt) ? 'bg-accent border-accent' : 'border-border group-hover:border-accent-muted'
          }`}>
            {value.includes(opt) && (
              <svg className="w-3 h-3 text-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-text-secondary">{opt}</span>
        </label>
      ))}
    </div>
  )
}

function ScreenshotGallery({ screenshots, onChange }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [editingLabel, setEditingLabel] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'journal-screenshots')
      onChange([...screenshots, { url, label: '' }])
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function updateLabel(idx, label) {
    const next = [...screenshots]
    next[idx] = { ...next[idx], label }
    onChange(next)
  }

  function remove(idx) {
    onChange(screenshots.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider">Screenshots</label>

      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {screenshots.map((ss, i) => (
            <div key={i} className="relative group">
              <img src={ss.url} alt={ss.label || 'Screenshot'}
                className="w-full aspect-video object-cover rounded-xl border border-border" />
              <button onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 bg-surface/80 text-text-muted hover:text-loss rounded-lg w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                &times;
              </button>
              {editingLabel === i ? (
                <input type="text" value={ss.label} autoFocus
                  onChange={e => updateLabel(i, e.target.value)}
                  onBlur={() => setEditingLabel(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditingLabel(null)}
                  className="mt-1 w-full bg-surface-50 border border-border rounded-lg px-2 py-1 text-xs text-text placeholder-text-muted focus:border-accent/60 focus:outline-none"
                  placeholder="Add label..." />
              ) : (
                <p onClick={() => setEditingLabel(i)}
                  className="mt-1 text-[10px] text-text-muted truncate cursor-pointer hover:text-text-secondary">
                  {ss.label || 'Click to add label'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="w-full py-2.5 border-2 border-dashed border-border-light rounded-xl text-xs text-text-muted hover:border-accent-muted hover:text-accent transition-colors disabled:opacity-50">
        {uploading ? 'Uploading...' : '+ Add Screenshot'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}

export default function JournalEntryForm({ fields, entry, onSave, saving, extraLabel }) {
  const [answers, setAnswers] = useState(entry?.answers ?? {})
  const [screenshots, setScreenshots] = useState(entry?.screenshots ?? [])

  function setAnswer(fieldId, value) {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  function handleSave() {
    onSave({ answers, screenshots })
  }

  return (
    <div className="space-y-4">
      {extraLabel && (
        <p className="text-xs text-accent/70 italic">{extraLabel}</p>
      )}

      {fields.map(field => (
        <div key={field.id}>
          <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{field.label}</label>

          {field.type === 'text' && (
            <textarea rows={2} value={answers[field.id] ?? ''} placeholder="Write here..."
              onChange={e => setAnswer(field.id, e.target.value)}
              className="input-field resize-none" />
          )}

          {field.type === 'dropdown' && (
            <select value={answers[field.id] ?? ''} onChange={e => setAnswer(field.id, e.target.value)}
              className="input-field">
              <option value="">— Select —</option>
              {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}

          {field.type === 'rating' && (
            <RatingInput value={answers[field.id]} onChange={v => setAnswer(field.id, v)} />
          )}

          {field.type === 'checkbox' && (
            <ChecklistInput options={field.options} value={answers[field.id] ?? []}
              onChange={v => setAnswer(field.id, v)} />
          )}
        </div>
      ))}

      <ScreenshotGallery screenshots={screenshots} onChange={setScreenshots} />

      <button onClick={handleSave} disabled={saving} className="w-full btn-primary disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Journal Entry'}
      </button>
    </div>
  )
}
