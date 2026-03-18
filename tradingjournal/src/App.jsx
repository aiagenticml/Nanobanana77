import { useState, createContext, useCallback } from 'react'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import Toast from './components/shared/Toast'
import Dashboard from './pages/Dashboard'
import Trades from './pages/Trades'
import Journal from './pages/Journal'
import Settings from './pages/Settings'

export const SettingsContext = createContext({
  defaultCurrency: 'USD',
  setDefaultCurrency: () => {},
  showToast: () => {},
})

const PAGE_TITLES = {
  dashboard: 'Trading Journal',
  trades: 'Trade Log',
  journal: 'Journal',
  settings: 'Settings',
}

function TabPanel({ active, children }) {
  return <div style={{ display: active ? 'block' : 'none' }}>{children}</div>
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [toast, setToast] = useState('')
  const [journalTradeId, setJournalTradeId] = useState(null)

  const showToast = useCallback((msg) => setToast(msg), [])

  // Navigate from dashboard recent trade → journal for that trade
  function handleNavigateTrade(tradeId) {
    setJournalTradeId(tradeId)
    setTab('journal')
  }

  // Navigate from trades tab → journal for that trade
  function handleViewJournal(tradeId) {
    setJournalTradeId(tradeId)
    setTab('journal')
  }

  return (
    <SettingsContext.Provider value={{ defaultCurrency, setDefaultCurrency, showToast }}>
      <div className="min-h-screen bg-surface flex flex-col max-w-4xl mx-auto relative">
        <TopBar title={PAGE_TITLES[tab]} />
        <main className="flex-1 overflow-y-auto px-4 py-3 pb-24">
          <TabPanel active={tab === 'dashboard'}>
            <Dashboard onNavigateTrade={handleNavigateTrade} />
          </TabPanel>
          <TabPanel active={tab === 'trades'}>
            <Trades onViewJournal={handleViewJournal} />
          </TabPanel>
          <TabPanel active={tab === 'journal'}>
            <Journal focusTradeId={journalTradeId} onClearFocus={() => setJournalTradeId(null)} />
          </TabPanel>
          <TabPanel active={tab === 'settings'}><Settings /></TabPanel>
        </main>
        <BottomNav active={tab} onChange={(t) => { setTab(t); if (t !== 'journal') setJournalTradeId(null) }} />
        <Toast message={toast} onDone={() => setToast('')} />
      </div>
    </SettingsContext.Provider>
  )
}
