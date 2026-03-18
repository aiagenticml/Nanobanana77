export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="bg-loss-muted/20 border border-loss-muted rounded-xl p-3 flex justify-between items-center">
      <span className="text-sm text-loss">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-loss-muted hover:text-loss text-lg leading-none ml-2">&times;</button>
      )}
    </div>
  )
}
