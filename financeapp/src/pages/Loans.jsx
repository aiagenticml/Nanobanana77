import { useState, useContext } from 'react'
import { SettingsContext } from '../App'
import { useLoans } from '../hooks/useLoans'
import LoanCard from '../components/loans/LoanCard'
import LoanForm from '../components/loans/LoanForm'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'

export default function Loans() {
  const { showToast } = useContext(SettingsContext)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const { loans, loading, addLoan, updateLoan, deleteLoan } = useLoans()

  async function handleAdd(data) {
    await addLoan(data)
    setShowForm(false)
    showToast('Loan added')
  }

  async function handleEdit(data) {
    await updateLoan(editing.id, data)
    setEditing(null)
    showToast('Loan updated')
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)}
        className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium">
        + Add Loan
      </button>

      {loading ? (
        <div className="text-center text-text-muted py-8 text-sm">Loading...</div>
      ) : loans.length === 0 ? (
        <EmptyState icon="🏦" message="No loans tracked" sub="Add your car loan, personal loan, etc." />
      ) : (
        <div className="space-y-3">
          {loans.map(loan => (
            <LoanCard key={loan.id} loan={loan} onDelete={id => setDeleting(id)} onEdit={setEditing} />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add Loan" onClose={() => setShowForm(false)}>
          <LoanForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Loan" onClose={() => setEditing(null)}>
          <LoanForm loan={editing} onSubmit={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-text-primary font-medium mb-4">Delete this loan?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
              <button onClick={async () => { await deleteLoan(deleting); setDeleting(null) }} className="flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
