import { useAuth } from '../../contexts/AuthContext'

export default function TopBar({ title }) {
  const { signOut } = useAuth()

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
      <span className="text-xl mr-2">💰</span>
      <h1 className="text-lg font-bold text-gray-800 flex-1">{title}</h1>
      <button
        onClick={signOut}
        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
