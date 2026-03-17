import { useState } from 'react'
import TradeCard from './TradeCard'
import TradeForm from './TradeForm'
import Modal from '../shared/Modal'
import EmptyState from '../shared/EmptyState'

export default function TradeList({ trades, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  if (trades.length === 0) {
    return <EmptyState icon="📋" message="No trades yet" sub="Tap + Add Trade to log your first trade" />
  }

  async function handleSave(id, data) {
    await onUpdate(id, data)
    setEditing(null)
  }

  async function confirmDelete() {
    await onDelete(deleting)
    setDeleting(null)
  }

  return (
    <>
      <div className="space-y-2">
        {trades.map(t => (
          <TradeCard
            key={t.id}
            trade={t}
            onClick={setEditing}
            onDelete={id => setDeleting(id)}
          />
        ))}
      </div>

      {editing && (
        <Modal title="Edit Trade" onClose={() => setEditing(null)}>
          <TradeForm
            trade={editing}
            onSubmit={data => handleSave(editing.id, data)}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-gray-800 font-medium mb-4">Delete this trade?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={confirmDelete}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
