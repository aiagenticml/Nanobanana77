import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSentry, Sentry } from './lib/sentry'
import './index.css'
import App from './App.jsx'

initSentry()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm text-center">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-lg font-bold text-gray-800 mt-3">Something went wrong</h2>
        <p className="text-sm text-gray-500 mt-2">An unexpected error occurred. Please refresh the page.</p>
        <button onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
          Refresh
        </button>
      </div>
    </div>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
