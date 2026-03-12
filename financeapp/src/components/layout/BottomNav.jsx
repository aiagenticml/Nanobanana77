const tabs = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'expenses', label: 'Spend', icon: '💸' },
  { id: 'loans', label: 'Loans', icon: '🏦' },
  { id: 'subscriptions', label: 'Subs', icon: '🔄' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40 max-w-lg mx-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${
            active === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-lg mb-0.5">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
