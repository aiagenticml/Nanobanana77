export default function BudgetProgress({ label, allocated, spent, onEdit, onDelete }) {
  const hasSpent = spent !== null && spent !== undefined
  const ratio = hasSpent && allocated > 0 ? spent / allocated : 0
  const fillPercent = Math.min(ratio * 100, 100)

  let fillColor = 'bg-positive'
  if (ratio > 1) fillColor = 'bg-danger'
  else if (ratio >= 0.8) fillColor = 'bg-warning'

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span className="text-text-primary text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-highlight">
            {hasSpent ? `${spent.toFixed(2)} / ${allocated.toFixed(2)}` : `— / ${allocated.toFixed(2)}`}
          </span>
          <button
            onClick={onEdit}
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-text-muted hover:text-danger transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {hasSpent && (
        <div className="mt-2 bg-base rounded-full h-1.5">
          <div
            className={`${fillColor} rounded-full h-1.5 progress-animate`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      )}
    </div>
  )
}
