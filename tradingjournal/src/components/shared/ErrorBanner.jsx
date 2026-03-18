export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="bg-loss/5 border border-loss/20 rounded-xl p-3 flex justify-between items-center animate-slide-up">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-loss animate-pulse" />
        <span className="text-sm text-loss">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-loss/50 hover:text-loss hover:bg-loss/10 transition-colors text-sm">
          &times;
        </button>
      )}
    </div>
  )
}
