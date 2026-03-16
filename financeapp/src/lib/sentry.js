import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Only send errors in production to avoid noise during development
    enabled: import.meta.env.PROD,
    // Sample 100% of errors, 10% of transactions for performance
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    // Don't send PII (personal identifiable information)
    sendDefaultPii: false,
  })
}

export { Sentry }
