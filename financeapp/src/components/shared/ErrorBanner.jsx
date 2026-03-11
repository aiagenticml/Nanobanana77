export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between items-center">
      <span className="text-sm text-red-700">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-lg leading-none ml-2">&times;</button>
      )}
    </div>
  )
}
