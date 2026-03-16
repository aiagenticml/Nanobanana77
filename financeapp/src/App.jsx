import { useState, createContext, useEffect, useCallback, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import Toast from './components/shared/Toast'
import Auth from './pages/Auth'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Loans = lazy(() => import('./pages/Loans'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Settings = lazy(() => import('./pages/Settings'))

export const SettingsContext = createContext({
  defaultCurrency: 'SGD',
  setDefaultCurrency: () => {},
  showToast: () => {},
  user: null,
})

const PAGE_TITLES = {
  dashboard: 'Finance Planner',
  expenses: 'Daily Expenses',
  loans: 'Loan Tracker',
  subscriptions: 'Subscriptions',
  settings: 'Settings',
}

const PageLoader = () => (
  <div className="text-center text-gray-400 py-16 text-sm">Loading...</div>
)

function TabPanel({ active, children }) {
  return <div style={{ display: active ? 'block' : 'none' }}>{children}</div>
}

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [defaultCurrency, setDefaultCurrency] = useState('SGD')
  const [toast, setToast] = useState('')
  const [legalPage, setLegalPage] = useState(null)

  const showToast = useCallback((msg) => setToast(msg), [])

  useEffect(() => {
    if (!user) return
    supabase.from('settings').select('default_currency').eq('user_id', user.id).single().then(({ data }) => {
      if (data?.default_currency) setDefaultCurrency(data.default_currency)
    })
  }, [user])

  if (legalPage === 'privacy') {
    return <PrivacyPolicy onBack={() => setLegalPage(null)} />
  }
  if (legalPage === 'terms') {
    return <TermsOfService onBack={() => setLegalPage(null)} />
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <Auth
        onSignIn={signIn}
        onSignUp={signUp}
        onShowPrivacy={() => setLegalPage('privacy')}
        onShowTerms={() => setLegalPage('terms')}
      />
    )
  }

  return (
    <SettingsContext.Provider value={{ defaultCurrency, setDefaultCurrency, showToast, user, signOut }}>
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <TopBar title={PAGE_TITLES[tab]} />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <Suspense fallback={<PageLoader />}>
            <TabPanel active={tab === 'dashboard'}><Dashboard /></TabPanel>
            <TabPanel active={tab === 'expenses'}><Expenses /></TabPanel>
            <TabPanel active={tab === 'loans'}><Loans /></TabPanel>
            <TabPanel active={tab === 'subscriptions'}><Subscriptions /></TabPanel>
            <TabPanel active={tab === 'settings'}><Settings /></TabPanel>
          </Suspense>
        </main>
        <BottomNav active={tab} onChange={setTab} />
        <Toast message={toast} onDone={() => setToast('')} />
      </div>
    </SettingsContext.Provider>
  )
}
