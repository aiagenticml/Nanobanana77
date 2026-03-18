import { useEffect } from 'react'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [message, onDone])

  if (!message) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-surface-100 text-text text-sm px-4 py-2.5 rounded-xl shadow-lg border border-border backdrop-blur-xl animate-slide-up">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-profit" />
        {message}
      </div>
    </div>
  )
}
