import { useState, createContext, useEffect } from 'react'
import { supabase } from './lib/supabase'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Loans from './pages/Loans'
import Subscriptions from './pages/Subscriptions'
import Settings from './pages/Settings'

export const SettingsContext = createContext({ defaultCurrency: 'SGD', setDefaultCurrency: () => {} })

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

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [defaultCurrency, setDefaultCurrency] = useState('SGD')

  useEffect(() => {
    supabase.from('settings').select('default_currency').eq('id', 1).single().then(({ data }) => {
      if (data?.default_currency) setDefaultCurrency(data.default_currency)
    })
  }, [])

  return (
    <SettingsContext.Provider value={{ defaultCurrency, setDefaultCurrency }}>
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
      </div>
    </SettingsContext.Provider>
  )
}
