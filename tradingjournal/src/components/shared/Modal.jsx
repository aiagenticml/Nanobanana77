export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-border shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-bold text-text tracking-tight">{title}</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-50 transition-colors text-lg leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
