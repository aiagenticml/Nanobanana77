import { useState, createContext, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import Toast from './components/shared/Toast'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Budget from './pages/Budget'
import Loans from './pages/Loans'
import Subscriptions from './pages/Subscriptions'
import Vitamins from './pages/Vitamins'
import Settings from './pages/Settings'

export const SettingsContext = createContext({
  defaultCurrency: 'SGD',
  setDefaultCurrency: () => {},
  showToast: () => {},
})

const PAGE_TITLES = {
  dashboard: 'Finance Planner',
  expenses: 'Daily Expenses',
  budget: 'Monthly Budget',
  loans: 'Loan Tracker',
  subscriptions: 'Subscriptions',
  vitamins: 'Vitamins',
  settings: 'Settings',
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [defaultCurrency, setDefaultCurrency] = useState('SGD')
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg) => setToast(msg), [])

  useEffect(() => {
    supabase.from('settings').select('default_currency').eq('id', 1).single().then(({ data }) => {
      if (data?.default_currency) setDefaultCurrency(data.default_currency)
    })
  }, [])

  return (
    <SettingsContext.Provider value={{ defaultCurrency, setDefaultCurrency, showToast }}>
      <div className="min-h-screen flex flex-col max-w-lg mx-auto">
        <TopBar title={PAGE_TITLES[tab]} />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'expenses' && <Expenses />}
          {tab === 'budget' && <Budget />}
          {tab === 'loans' && <Loans />}
          {tab === 'subscriptions' && <Subscriptions />}
          {tab === 'vitamins' && <Vitamins />}
          {tab === 'settings' && <Settings />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
        <Toast message={toast} onDone={() => setToast('')} />
      </div>
    </SettingsContext.Provider>
  )
}
