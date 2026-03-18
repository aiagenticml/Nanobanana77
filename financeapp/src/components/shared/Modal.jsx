export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-backdrop">
      <div className="bg-card border border-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}
