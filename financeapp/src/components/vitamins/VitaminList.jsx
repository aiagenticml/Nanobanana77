import { useState } from 'react'
import { formatAmount } from '../../lib/currencyUtils'
import { daysUntilRestock } from '../../hooks/useVitamins'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'
import VitaminForm from './VitaminForm'

function restockBadge(days) {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-danger/10 text-danger' }
  if (days === 0) return { label: 'Restock today!', cls: 'bg-danger/10 text-danger' }
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-warning/10 text-warning' }
  if (days <= 14) return { label: `${days}d left`, cls: 'bg-highlight/10 text-highlight' }
  return { label: `${days}d left`, cls: 'text-positive' }
}

export default function VitaminList({ vitamins, onDelete, onUpdate, onRebuy }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  if (vitamins.length === 0) {
    return <EmptyState icon="💊" message="No vitamins yet" sub="Track your supplements and restock dates" />
  }

  async function handleSave(data) {
    await onUpdate(editing.id, data)
    setEditing(null)
  }

  const sorted = [...vitamins].sort((a, b) =>
    daysUntilRestock(a.date_purchased, a.servings) - daysUntilRestock(b.date_purchased, b.servings)
  )

  return (
    <>
      <div className="space-y-2">
        {sorted.map(v => {
          const days = daysUntilRestock(v.date_purchased, v.servings)
          const badge = restockBadge(days)
          return (
            <div key={v.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(v)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary text-sm">{v.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {v.servings} servings · Bought: {v.date_purchased}
                  {v.purchase_count > 1 && ` · Purchased ${v.purchase_count}x`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary text-sm whitespace-nowrap">
                  {formatAmount(v.cost, v.currency)}
                </span>
                <button onClick={() => onRebuy(v)}
                  className="text-xs bg-accent text-white rounded-lg px-3 py-1.5 font-medium">Rebuy</button>
                <button onClick={() => setDeleting(v.id)} className="text-text-muted hover:text-danger text-2xl leading-none p-1">&times;</button>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <Modal title="Edit Vitamin" onClose={() => setEditing(null)}>
          <VitaminForm initial={editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-text-primary font-medium mb-4">Delete this vitamin?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
              <button onClick={async () => { await onDelete(deleting); setDeleting(null) }} className="flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
