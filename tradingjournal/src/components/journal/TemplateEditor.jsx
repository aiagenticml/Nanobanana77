import { useState, useContext } from 'react'
import Modal from '../shared/Modal'
import { useTemplates } from '../../hooks/useJournal'
import { SettingsContext } from '../../App'

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'checkbox', label: 'Checklist' },
]

const TAB_LABELS = { trade: 'Per-Trade', daily: 'Daily', weekly: 'Weekly' }
const inputClass = 'w-full bg-surface-50 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:border-accent focus:outline-none'

function FieldEditor({ field, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editingOptions, setEditingOptions] = useState(false)
  const [newOption, setNewOption] = useState('')

  function addOption() {
    if (!newOption.trim()) return
    onChange({ ...field, options: [...(field.options || []), newOption.trim()] })
    setNewOption('')
  }

  function removeOption(idx) {
    onChange({ ...field, options: field.options.filter((_, i) => i !== idx) })
  }

  return (
    <div className="bg-surface-50 rounded-lg p-3 space-y-2 border border-border">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst}
            className="text-text-muted hover:text-text disabled:opacity-20 text-xs leading-none">&#9650;</button>
          <button onClick={onMoveDown} disabled={isLast}
            className="text-text-muted hover:text-text disabled:opacity-20 text-xs leading-none">&#9660;</button>
        </div>
        <input type="text" value={field.label} placeholder="Question label"
          onChange={e => onChange({ ...field, label: e.target.value })}
          className="flex-1 bg-card border border-border rounded px-2 py-1.5 text-sm text-text placeholder-text-muted focus:border-accent focus:outline-none" />
        <select value={field.type}
          onChange={e => onChange({ ...field, type: e.target.value })}
          className="bg-card border border-border rounded px-2 py-1.5 text-xs text-text-secondary focus:border-accent focus:outline-none">
          {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
        </select>
        <button onClick={onRemove} className="text-text-muted hover:text-loss text-lg leading-none px-1">x</button>
      </div>

      {(field.type === 'dropdown' || field.type === 'checkbox') && (
        <div className="pl-6 space-y-2">
          <button onClick={() => setEditingOptions(!editingOptions)}
            className="text-xs text-accent hover:text-accent-hover">
            {editingOptions ? 'Hide options' : `Edit options (${(field.options || []).length})`}
          </button>
          {editingOptions && (
            <div className="space-y-1.5">
              {(field.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary flex-1">{opt}</span>
                  <button onClick={() => removeOption(i)} className="text-text-muted hover:text-loss text-xs">remove</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input type="text" value={newOption} placeholder="New option"
                  onChange={e => setNewOption(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  className="flex-1 bg-card border border-border rounded px-2 py-1 text-xs text-text placeholder-text-muted focus:border-accent focus:outline-none" />
                <button onClick={addOption}
                  className="text-xs text-accent hover:text-accent-hover px-2">Add</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TemplateEditor({ onClose }) {
  const { templates, loading, saveTemplate } = useTemplates()
  const { showToast } = useContext(SettingsContext)
  const [activeTab, setActiveTab] = useState('trade')
  const [fields, setFields] = useState(null)
  const [saving, setSaving] = useState(false)

  // Sync local state when templates load or tab changes
  const currentFields = fields ?? templates[activeTab] ?? []

  function switchTab(tab) {
    setFields(null)
    setActiveTab(tab)
  }

  function updateField(idx, updated) {
    const next = [...currentFields]
    next[idx] = updated
    setFields(next)
  }

  function removeField(idx) {
    setFields(currentFields.filter((_, i) => i !== idx))
  }

  function moveField(idx, dir) {
    const next = [...currentFields]
    const swap = idx + dir
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setFields(next)
  }

  function addField() {
    const id = Date.now().toString()
    setFields([...currentFields, { id, type: 'text', label: '' }])
  }

  async function handleSave() {
    setSaving(true)
    await saveTemplate(activeTab, currentFields)
    setSaving(false)
    showToast('Template saved')
  }

  if (loading) {
    return (
      <Modal title="Journal Templates" onClose={onClose}>
        <p className="text-sm text-text-muted text-center py-8">Loading...</p>
      </Modal>
    )
  }

  return (
    <Modal title="Journal Templates" onClose={onClose}>
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-50 rounded-lg p-1">
          {Object.entries(TAB_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => switchTab(key)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === key ? 'bg-card text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Fields list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {currentFields.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No fields yet. Add one below.</p>
          ) : (
            currentFields.map((field, i) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={updated => updateField(i, updated)}
                onRemove={() => removeField(i)}
                onMoveUp={() => moveField(i, -1)}
                onMoveDown={() => moveField(i, 1)}
                isFirst={i === 0}
                isLast={i === currentFields.length - 1}
              />
            ))
          )}
        </div>

        {/* Actions */}
        <button onClick={addField}
          className="w-full py-2 border border-dashed border-border-light rounded-lg text-sm text-text-muted hover:border-accent-muted hover:text-accent transition-colors">
          + Add Field
        </button>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 bg-accent text-surface rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
