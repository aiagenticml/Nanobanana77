const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'loans', label: 'Loans', icon: '🏦' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '🔄' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
            active === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-xl mb-0.5">{tab.icon}</span>
          <span className="hidden sm:block">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
