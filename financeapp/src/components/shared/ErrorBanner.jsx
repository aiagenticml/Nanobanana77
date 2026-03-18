export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex justify-between items-center">
      <span className="text-sm text-danger">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-danger hover:text-danger text-lg leading-none ml-2">&times;</button>
      )}
    </div>
  )
}
