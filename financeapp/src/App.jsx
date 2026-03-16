import { useState, createContext, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import Toast from './components/shared/Toast'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Loans from './pages/Loans'
import Subscriptions from './pages/Subscriptions'
import Settings from './pages/Settings'
import Auth from './pages/Auth'

export const SettingsContext = createContext({
  defaultCurrency: 'SGD',
  setDefaultCurrency: () => {},
  showToast: () => {},
  userId: null,
})

const PAGE_TITLES = {
  dashboard: 'Finance Planner',
  expenses: 'Daily Expenses',
  loans: 'Loan Tracker',
  subscriptions: 'Subscriptions',
  settings: 'Settings',
}

function TabPanel({ active, children }) {
  return <div style={{ display: active ? 'block' : 'none' }}>{children}</div>
}

function AppShell() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [defaultCurrency, setDefaultCurrency] = useState('SGD')
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg) => setToast(msg), [])

  useEffect(() => {
    if (!user) return
    supabase.from('settings').select('default_currency').eq('user_id', user.id).single().then(({ data }) => {
      if (data?.default_currency) setDefaultCurrency(data.default_currency)
    })
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <SettingsContext.Provider value={{ defaultCurrency, setDefaultCurrency, showToast, userId: user.id }}>
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <TopBar title={PAGE_TITLES[tab]} />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <TabPanel active={tab === 'dashboard'}><Dashboard /></TabPanel>
          <TabPanel active={tab === 'expenses'}><Expenses /></TabPanel>
          <TabPanel active={tab === 'loans'}><Loans /></TabPanel>
          <TabPanel active={tab === 'subscriptions'}><Subscriptions /></TabPanel>
          <TabPanel active={tab === 'settings'}><Settings /></TabPanel>
        </main>
        <BottomNav active={tab} onChange={setTab} />
        <Toast message={toast} onDone={() => setToast('')} />
      </div>
    </SettingsContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
