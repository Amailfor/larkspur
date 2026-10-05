'use client'

import { FormEvent, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        setError('Incorrect password.')
        return
      }
      window.location.href = '/allowed_urls'
    } catch {
      setError('Unable to connect to the dashboard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-[#17202b]">
      <section className="w-full max-w-md rounded-2xl border border-[#dfe4e9] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#18232f] text-white">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Allowlist dashboard</p>
            <p className="text-xs text-[#7a8591]">Manage allowed_urls</p>
          </div>
        </div>
        <div className="mb-6 flex size-10 items-center justify-center rounded-lg bg-[#e9f5ed] text-[#1e6545]">
          <LockKeyhole className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-2 text-sm leading-6 text-[#697581]">Sign in to add, edit, or remove allowed URLs.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-[#dfe4e9] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#80b797]" placeholder="Enter password" autoComplete="current-password" required />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#1e6545] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#164d35] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Signing in...' : 'Open dashboard'}
          </button>
          {error && <p role="alert" className="text-xs text-[#bd5b55]">{error}</p>}
        </form>
      </section>
    </main>
  )
}
