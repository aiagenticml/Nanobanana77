import { useState, useContext } from 'react'
import { SettingsContext } from '../App'
import { useSubscriptions } from '../hooks/useSubscriptions'
import SubscriptionList from '../components/subscriptions/SubscriptionList'
import SubscriptionForm from '../components/subscriptions/SubscriptionForm'
import Modal from '../components/shared/Modal'
import { formatAmount } from '../lib/currencyUtils'
import ErrorBanner from '../components/shared/ErrorBanner'

export default function Subscriptions() {
  const { defaultCurrency, showToast } = useContext(SettingsContext)
  const [showForm, setShowForm] = useState(false)
  const { subscriptions, loading, error, addSubscription, updateSubscription, deleteSubscription, markPaid } = useSubscriptions()

  const monthlyTotal = subscriptions
    .filter(s => s.currency === defaultCurrency)
    .reduce((sum, s) => {
      const amt = parseFloat(s.amount)
      if (s.billing_cycle === 'monthly') return sum + amt
      if (s.billing_cycle === 'yearly') return sum + amt / 12
      if (s.billing_cycle === 'weekly') return sum + amt * 4.33
      return sum
    }, 0)

  async function handleAdd(data) {
    await addSubscription(data)
    setShowForm(false)
    showToast('Subscription added')
  }

  async function handleMarkPaid(sub) {
    await markPaid(sub)
    showToast('Marked as paid')
  }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
        <span className="text-sm text-blue-700 font-medium">Est. monthly cost ({defaultCurrency})</span>
        <span className="font-bold text-blue-800">{formatAmount(monthlyTotal, defaultCurrency)}</span>
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
          onMarkPaid={handleMarkPaid}
          onUpdate={updateSubscription}
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
