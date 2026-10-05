'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react'

type AllowedUrl = { url: string; comment?: string }
type Config = { title: string; allowed_urls: AllowedUrl[]; can_edit?: boolean }

function normalizeConfig(value: unknown): Config | null {
  if (typeof value === 'string') {
    try {
      return normalizeConfig(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (!value || typeof value !== 'object') return null
  const candidate = value as { title?: unknown; allowed_urls?: unknown; can_edit?: unknown }
  if (typeof candidate.title !== 'string' || !Array.isArray(candidate.allowed_urls)) return null
  const allowed_urls = candidate.allowed_urls.flatMap((item): AllowedUrl[] => {
    if (typeof item === 'string' && item.trim()) return [{ url: item.trim() }]
    if (!item || typeof item !== 'object') return []
    const entry = item as { url?: unknown; comment?: unknown }
    if (typeof entry.url !== 'string' || !entry.url.trim()) return []
    return [{ url: entry.url.trim(), ...(typeof entry.comment === 'string' && entry.comment.trim() ? { comment: entry.comment.trim() } : {}) }]
  })
  return { title: candidate.title, allowed_urls, can_edit: candidate.can_edit === true }
}

const fallback: Config = {
  title: 'URL allowlist',
  allowed_urls: [
    { url: 'https://github.com', comment: 'Source code and collaboration' },
    { url: 'https://www.youtube.com', comment: 'Video platform' },
    { url: 'https://en.wikipedia.org', comment: 'Reference articles' },
  ],
}

export default function AllowedUrlsPage() {
  const [config, setConfig] = useState<Config>(fallback)
  const [title, setTitle] = useState(fallback.title)
  const [urls, setUrls] = useState(fallback.allowed_urls)
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    fetch('/api/allowed_urls', { cache: 'no-store' })
      .then((response) => response.json())
      .then((rawData: unknown) => {
        const data = normalizeConfig(rawData)
        if (!data) throw new Error('Invalid allowlist response')
        setUnlocked(params.get('edit') === '1' && data.can_edit === true)
        setConfig(data)
        setTitle(data.title)
        setUrls(data.allowed_urls)
      })
      .catch(() => setError('Could not load the current URL list.'))
  }, [])

  const json = useMemo(() => JSON.stringify(config, null, 2), [config])

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch('/api/allowed_urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!response.ok) return setError('Incorrect password.')
    setUnlocked(true)
    setError('')
  }

  function addUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const parsed = new URL(url.trim())
      const normalized = `${parsed.protocol}//${parsed.host}`
      if (!['http:', 'https:'].includes(parsed.protocol) || urls.some((item) => item.url === normalized)) throw new Error()
      setUrls((current) => [...current, { url: normalized, ...(comment.trim() ? { comment: comment.trim() } : {}) }])
      setUrl('')
      setComment('')
      setError('')
    } catch {
      setError('Enter a new valid http:// or https:// URL.')
    }
  }

  async function save() {
    setError('')
    const response = await fetch('/api/allowed_urls', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, allowed_urls: urls }),
    })
    if (!response.ok) return setError(response.status === 401 ? 'Your login has expired. Please sign in again.' : 'Could not save changes.')
    const data = (await response.json()) as Config
    setConfig(data)
    setTitle(data.title)
    setUrls(data.allowed_urls)
    setMessage('Changes saved.')
    window.history.replaceState({}, '', '/allowed_urls?edit=1')
    window.setTimeout(() => setMessage(''), 2500)
  }

  async function copyJson() {
    await navigator.clipboard?.writeText(json)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#17202b]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#18232f] text-white"><ShieldCheck className="size-5" /></span>
            <div><p className="text-sm font-semibold">/allowed_urls</p><p className="text-xs text-[#7a8591]">Public URL access control</p></div>
          </div>
          <span className="rounded-full border border-[#dfe4e9] bg-white px-3 py-1.5 text-xs font-medium text-[#66717d]">{config.allowed_urls.length} allowed</span>
        </header>

        {!unlocked ? (
          <section className="rounded-2xl border border-[#dfe4e9] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6"><h1 className="text-2xl font-semibold">{config.title}</h1><p className="mt-2 text-sm text-[#697581]">Only URLs with a comment are shown publicly.</p></div>
            <div className="divide-y divide-[#e8ebee] rounded-xl border border-[#e8ebee]">{config.allowed_urls.filter((item) => item.comment).map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 px-4 py-3.5 text-sm hover:bg-[#f7f8fa]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e9f5ed] text-[#1e6545]"><Check className="size-4" /></span><span><span className="block font-medium">{item.url}</span><span className="mt-1 block text-xs text-[#697581]">{item.comment}</span></span></a>)}</div>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-[#dfe4e9] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center justify-between"><div><h1 className="font-semibold">Edit allowlist</h1><p className="mt-1 text-sm text-[#7b8691]">Changes are saved permanently.</p></div><button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-[#1e6545] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#164d35]"><Save className="size-4" /> Save</button></div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium">Title</label><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} className="mb-6 w-full rounded-lg border border-[#dfe4e9] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#80b797]" />
              <div className="space-y-2">{urls.map((item) => <div key={item.url} className="flex items-center gap-3 rounded-xl border border-[#e8ebee] px-3.5 py-3"><span className="flex size-6 items-center justify-center rounded-full bg-[#e9f5ed] text-[#1e6545]"><Check className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm">{item.url}</p><p className="mt-1 truncate text-xs text-[#697581]">{item.comment || 'No comment — hidden from public list'}</p></div><button onClick={() => setUrls((current) => current.filter((entry) => entry.url !== item.url))} aria-label={`Remove ${item.url}`} className="text-[#bd5b55] hover:text-[#8f3d39]"><Trash2 className="size-4" /></button></div>)}</div>
              <form onSubmit={addUrl} className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input value={url} onChange={(event) => setUrl(event.target.value)} className="min-w-0 rounded-lg border border-[#dfe4e9] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#80b797]" placeholder="https://example.com" aria-label="New URL" /><input value={comment} onChange={(event) => setComment(event.target.value)} className="min-w-0 rounded-lg border border-[#dfe4e9] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#80b797]" placeholder="Comment (optional)" aria-label="Comment for new URL" /><button className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#dfe4e9] px-3 py-2.5 text-sm font-medium hover:bg-[#f7f8fa]"><Plus className="size-4" /> Add</button></form>
              {message && <p className="mt-3 text-sm text-[#1e6545]">{message}</p>}{error && <p role="alert" className="mt-3 text-sm text-[#bd5b55]">{error}</p>}
            </section>
            <section className="rounded-2xl border border-[#dfe4e9] bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">JSON output</h2><p className="mt-1 text-sm text-[#7b8691]">The public representation of this list.</p></div><button onClick={copyJson} aria-label="Copy JSON" className="rounded-lg border border-[#dfe4e9] p-2 hover:bg-[#f7f8fa]"><Copy className="size-4" /></button></div><pre className="overflow-auto rounded-xl bg-[#18232f] p-4 text-xs leading-6 text-[#d9e7df]">{json}</pre>{copied && <p className="mt-2 text-xs text-[#1e6545]">Copied.</p>}</section>
          </div>
        )}
      </div>
    </main>
  )
}
