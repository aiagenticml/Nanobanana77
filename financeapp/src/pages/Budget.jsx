import EmptyState from '../components/shared/EmptyState'

export default function Budget() {
  return (
    <div className="space-y-4">
      <EmptyState icon="📊" message="Budget planner coming soon" sub="Plan your monthly allowance" />
    </div>
  )
}
