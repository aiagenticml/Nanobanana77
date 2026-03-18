import { useState } from 'react'
import TradeCard from './TradeCard'
import TradeForm from './TradeForm'
import Modal from '../shared/Modal'
import EmptyState from '../shared/EmptyState'

export default function TradeList({ trades, onDelete, onUpdate, onViewJournal }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  if (trades.length === 0) {
    return <EmptyState icon="📋" message="No trades yet" sub="Tap + to log your first trade" />
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
            onViewJournal={onViewJournal}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 max-w-xs w-full text-center animate-slide-up">
            <div className="w-10 h-10 rounded-full bg-loss/10 border border-loss/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-loss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-text mb-1">Delete this trade?</p>
            <p className="text-xs text-text-muted mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-loss text-surface font-semibold rounded-xl text-sm hover:bg-loss-light active:scale-[0.98] transition-all duration-150">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
