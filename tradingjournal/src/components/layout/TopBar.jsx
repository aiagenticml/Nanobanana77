export default function TopBar({ title }) {
  return (
    <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border px-4 py-3.5 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
      <h1 className="text-base font-bold text-text tracking-tight">{title}</h1>
    </div>
  )
}
