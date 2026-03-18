export default function EmptyState({ icon = '📭', message = 'Nothing here yet', sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-text-muted animate-fade-in">
      <span className="text-4xl mb-4 opacity-60">{icon}</span>
      <p className="text-sm font-semibold text-text-secondary tracking-tight">{message}</p>
      {sub && <p className="text-xs mt-1.5 text-text-muted">{sub}</p>}
    </div>
  )
}
