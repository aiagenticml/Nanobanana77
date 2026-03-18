export default function TopBar({ title }) {
  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center">
      <h1 className="text-lg font-bold text-text">{title}</h1>
    </div>
  )
}
