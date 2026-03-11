import { useState } from 'react'
import { useLoans } from '../hooks/useLoans'
import LoanCard from '../components/loans/LoanCard'
import LoanForm from '../components/loans/LoanForm'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'

export default function Loans() {
  const [showForm, setShowForm] = useState(false)
  const { loans, loading, addLoan, deleteLoan } = useLoans()

  async function handleAdd(data) {
    await addLoan(data)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
        + Add Loan
      </button>

      {loading ? (
        <div className="text-center text-gray-400 py-8 text-sm">Loading...</div>
      ) : loans.length === 0 ? (
        <EmptyState icon="🏦" message="No loans tracked" sub="Add your car loan, personal loan, etc." />
      ) : (
        <div className="space-y-3">
          {loans.map(loan => (
            <LoanCard key={loan.id} loan={loan} onDelete={deleteLoan} />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add Loan" onClose={() => setShowForm(false)}>
          <LoanForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
