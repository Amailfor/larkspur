'use client'

import { FormEvent, useState } from 'react'
import { Check, Clipboard, Copy, Globe2, Plus, ShieldCheck, Trash2 } from 'lucide-react'

const initialUrls = ['https://github.com', 'https://www.youtube.com', 'https://en.wikipedia.org']

export default function SlashAllowlistPage() {
  const [urls, setUrls] = useState(initialUrls)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify({ allowlist: urls }, null, 2)

  function addUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = url.trim()
    if (!value) return

    try {
      const parsed = new URL(value)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
      const normalized = `${parsed.protocol}//${parsed.host}`
      if (urls.includes(normalized)) {
        setError('That URL is already on the allowlist.')
        return
      }
      setUrls((current) => [...current, normalized])
      setUrl('')
      setError('')
    } catch {
      setError('Enter a valid http:// or https:// URL.')
    }
  }

  async function copyJson() {
    await navigator.clipboard?.writeText(json)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#17202b]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-16">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#18232f] text-white shadow-sm"><ShieldCheck className="size-5" /></span>
            <div><p className="text-sm font-semibold tracking-tight">/allowlist</p><p className="text-xs text-[#7a8591]">Safe URL access control</p></div>
          </div>
          <span className="rounded-full border border-[#dfe4e9] bg-white px-3 py-1.5 text-xs font-medium text-[#66717d]">{urls.length} allowed</span>
        </header>

        <section className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c9570]">AI-readable configuration</p>
          <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">URL allowlist</h1>
          <p className="mt-4 text-base leading-7 text-[#697581]">These are the only website origins the user is allowed to add or use. Copy the JSON below and give it directly to an AI or tool.</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-[#dfe4e9] bg-white p-5 shadow-[0_8px_30px_rgba(29,43,56,0.04)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="font-semibold">Allowed URLs</h2><p className="mt-1 text-sm text-[#7b8691]">Trusted origins for user access.</p></div><Globe2 className="size-5 text-[#7ca58d]" /></div>
            <div className="space-y-2">{urls.map((site) => <div key={site} className="flex items-center gap-3 rounded-xl border border-[#e8ebee] px-3.5 py-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e9f5ed] text-[#4a956d]"><Check className="size-3.5" /></span><code className="min-w-0 truncate text-sm text-[#344250]">{site}</code>{!initialUrls.includes(site) && <button onClick={() => setUrls((current) => current.filter((item) => item !== site))} className="ml-auto rounded-md p-1.5 text-[#9aa3ad] hover:bg-[#fff1f0] hover:text-[#bd5b55]" aria-label={`Remove ${site}`}><Trash2 className="size-4" /></button>}</div>)}</div>
            <form onSubmit={addUrl} className="mt-6 border-t border-[#edf0f2] pt-5"><label htmlFor="new-url" className="mb-2 block text-sm font-medium">Add an allowed URL</label><div className="flex gap-2"><input id="new-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" className="min-w-0 flex-1 rounded-lg border border-[#dfe4e9] bg-[#fbfcfd] px-3 py-2.5 text-sm outline-none ring-[#80b797] placeholder:text-[#a4adb6] focus:ring-2" /><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#1e6545] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#164d35]"><Plus className="size-4" /> Add</button></div>{error && <p className="mt-2 text-xs text-[#bd5b55]">{error}</p>}</form>
          </section>

          <section className="rounded-2xl bg-[#18232f] p-5 text-[#dce5eb] shadow-[0_8px_30px_rgba(29,43,56,0.12)] sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88c0a0]">slashallowlist</p><h2 className="mt-1 font-semibold text-white">Configuration JSON</h2></div><button onClick={copyJson} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#b9c6cf] hover:bg-white/10 hover:text-white" aria-label="Copy JSON"><Copy className="size-3.5" />{copied ? 'Copied' : 'Copy'}</button></div><pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#111a23] p-4 font-mono text-[13px] leading-7"><code><span className="text-[#a8d2b5]">{json}</span></code></pre><div className="mt-5 flex gap-3 rounded-xl border border-[#d9b46d]/20 bg-[#d9b46d]/10 p-3 text-xs leading-5 text-[#d9c99f]"><Clipboard className="mt-0.5 size-4 shrink-0" /><p>Use this JSON as the source of truth. New user URLs should be reviewed before they are added.</p></div></section>
        </div>
      </div>
    </main>
  )
}

void Clipboard
