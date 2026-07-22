import { useState } from 'react'
import { Sprout } from 'lucide-react'
import { supabase, isConfigured } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function sendLink(e) {
    e.preventDefault()
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grace-50 p-4">
      <div className="card w-full max-w-md text-center">
        <Sprout className="mx-auto mb-3 h-12 w-12 text-grace-600" aria-hidden />
        <h1 className="text-2xl font-bold text-grace-800">VRCC</h1>
        <p className="mb-6 text-grace-600">Virginia Recovery Connection Center</p>
        {!isConfigured && (
          <p className="mb-4 rounded-xl bg-gold-400/20 p-3 text-sm text-night-800">
            Supabase keys are not configured. Set VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY, then rebuild.
          </p>
        )}
        {sent ? (
          <p className="text-grace-700">
            Check your email — we sent you a sign-in link. It works even on a
            slow connection.
          </p>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <label className="block text-left text-sm font-medium text-grace-800" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="btn-primary w-full">
              Email me a sign-in link
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
