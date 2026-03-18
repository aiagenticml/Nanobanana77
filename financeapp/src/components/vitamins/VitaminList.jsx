import { useState } from 'react'
import { formatAmount } from '../../lib/currencyUtils'
import { daysUntilRestock } from '../../hooks/useVitamins'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'
import VitaminForm from './VitaminForm'

function restockBadge(days) {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-red-100 text-red-700' }
  if (days === 0) return { label: 'Restock today!', cls: 'bg-red-100 text-red-700' }
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-orange-100 text-orange-700' }
  if (days <= 14) return { label: `${days}d left`, cls: 'bg-yellow-100 text-yellow-700' }
  return { label: `${days}d left`, cls: 'bg-green-100 text-green-700' }
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
            <div key={v.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(v)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{v.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {v.servings} servings · Bought: {v.date_purchased}
                  {v.purchase_count > 1 && ` · Purchased ${v.purchase_count}x`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">
                  {formatAmount(v.cost, v.currency)}
                </span>
                <button onClick={() => onRebuy(v)}
                  className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 font-medium">Rebuy</button>
                <button onClick={() => setDeleting(v.id)} className="text-gray-300 hover:text-red-400 text-2xl leading-none p-1">&times;</button>
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
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-gray-800 font-medium mb-4">Delete this vitamin?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={async () => { await onDelete(deleting); setDeleting(null) }} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
