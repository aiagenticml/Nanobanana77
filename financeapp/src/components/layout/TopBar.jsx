export default function TopBar({ title }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
      <span className="text-xl mr-2">💰</span>
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
    </div>
  )
}
