import { useState, useRef } from 'react'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30000 // 30 seconds

export default function Auth({ onSignIn, onSignUp, onShowPrivacy, onShowTerms }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const failedAttempts = useRef(0)
  const lockoutUntil = useRef(0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Brute force protection
    if (Date.now() < lockoutUntil.current) {
      const secs = Math.ceil((lockoutUntil.current - Date.now()) / 1000)
      setError(`Too many attempts. Try again in ${secs} seconds.`)
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        await onSignUp(email, password)
        setSignUpSuccess(true)
        failedAttempts.current = 0
      } else {
        await onSignIn(email, password)
        failedAttempts.current = 0
      }
    } catch (err) {
      failedAttempts.current++
      if (failedAttempts.current >= MAX_ATTEMPTS) {
        lockoutUntil.current = Date.now() + LOCKOUT_MS
        setError(`Too many failed attempts. Locked out for 30 seconds.`)
        failedAttempts.current = 0
      } else {
        setError(err.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm text-center">
          <span className="text-4xl">📧</span>
          <h2 className="text-lg font-bold text-gray-800 mt-3">Check your email</h2>
          <p className="text-sm text-gray-500 mt-2">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          <button onClick={() => { setIsSignUp(false); setSignUpSuccess(false) }}
            className="mt-4 text-sm text-blue-600 hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">💰</span>
          <h1 className="text-xl font-bold text-gray-800 mt-2">Finance Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required maxLength={254}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Min 8 characters' : 'Your password'}
              required minLength={8} maxLength={128}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="text-blue-600 hover:underline font-medium">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
        <div className="flex justify-center gap-3 mt-3 text-xs text-gray-400">
          <button onClick={onShowPrivacy} className="hover:text-blue-600 hover:underline">Privacy Policy</button>
          <span>·</span>
          <button onClick={onShowTerms} className="hover:text-blue-600 hover:underline">Terms of Service</button>
        </div>
      </div>
    </div>
  )
}
