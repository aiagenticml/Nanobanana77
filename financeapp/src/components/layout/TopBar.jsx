export default function TopBar({ title }) {
  return (
    <div className="px-4 py-3 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-accent inline-block"></span>
      <h1 className="text-lg font-medium text-text-primary">{title}</h1>
    </div>
  )
}
