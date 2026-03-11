import { useState } from 'react'
import { useSubscriptions } from '../hooks/useSubscriptions'
import SubscriptionList from '../components/subscriptions/SubscriptionList'
import SubscriptionForm from '../components/subscriptions/SubscriptionForm'
import Modal from '../components/shared/Modal'
import { formatAmount } from '../lib/currencyUtils'

export default function Subscriptions() {
  const [showForm, setShowForm] = useState(false)
  const { subscriptions, loading, addSubscription, deleteSubscription, markPaid } = useSubscriptions()

  const monthlyTotal = subscriptions.reduce((sum, s) => {
    const amt = parseFloat(s.amount)
    if (s.billing_cycle === 'monthly') return sum + amt
    if (s.billing_cycle === 'yearly') return sum + amt / 12
    if (s.billing_cycle === 'weekly') return sum + amt * 4.33
    return sum
  }, 0)

  async function handleAdd(data) {
    await addSubscription(data)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
        <span className="text-sm text-blue-700 font-medium">Est. monthly cost</span>
        <span className="font-bold text-blue-800">{formatAmount(monthlyTotal)}</span>
      </div>

      <button onClick={() => setShowForm(true)}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
        + Add Subscription
      </button>

      {loading ? (
        <div className="text-center text-gray-400 py-8 text-sm">Loading...</div>
      ) : (
        <SubscriptionList
          subscriptions={subscriptions}
          onDelete={deleteSubscription}
          onMarkPaid={markPaid}
        />
      )}

      {showForm && (
        <Modal title="Add Subscription" onClose={() => setShowForm(false)}>
          <SubscriptionForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
