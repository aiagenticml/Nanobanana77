export default function EmptyState({ icon = '📭', message = 'Nothing here yet', sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-5xl mb-3">{icon}</span>
      <p className="text-base font-medium">{message}</p>
      {sub && <p className="text-sm mt-1">{sub}</p>}
    </div>
  )
}
