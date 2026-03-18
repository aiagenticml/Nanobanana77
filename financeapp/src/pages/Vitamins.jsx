import { useState, useContext } from 'react'
import { SettingsContext } from '../App'
import { useVitamins } from '../hooks/useVitamins'
import VitaminList from '../components/vitamins/VitaminList'
import VitaminForm from '../components/vitamins/VitaminForm'
import Modal from '../components/shared/Modal'
import { formatAmount } from '../lib/currencyUtils'

export default function Vitamins() {
  const { defaultCurrency, showToast } = useContext(SettingsContext)
  const [showForm, setShowForm] = useState(false)
  const { vitamins, loading, addVitamin, updateVitamin, deleteVitamin, rebuy } = useVitamins()

  const totalSpent = vitamins
    .filter(v => v.currency === defaultCurrency)
    .reduce((sum, v) => sum + parseFloat(v.cost) * (v.purchase_count || 1), 0)

  async function handleAdd(data) {
    await addVitamin(data)
    setShowForm(false)
    showToast('Vitamin added')
  }

  async function handleRebuy(vitamin) {
    await rebuy(vitamin)
    showToast(`${vitamin.name} marked as rebought`)
  }

  return (
    <div className="space-y-4">
      <div className="bg-positive/10 border border-positive/20 rounded-xl p-3 flex justify-between items-center">
        <span className="text-sm text-positive font-medium">Total spent on vitamins ({defaultCurrency})</span>
        <span className="font-bold text-positive">{formatAmount(totalSpent, defaultCurrency)}</span>
      </div>

      <button onClick={() => setShowForm(true)}
        className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium">
        + Add Vitamin
      </button>

      {loading ? (
        <div className="text-center text-text-muted py-8 text-sm">Loading...</div>
      ) : (
        <VitaminList
          vitamins={vitamins}
          onDelete={deleteVitamin}
          onUpdate={updateVitamin}
          onRebuy={handleRebuy}
        />
      )}

      {showForm && (
        <Modal title="Add Vitamin" onClose={() => setShowForm(false)}>
          <VitaminForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
