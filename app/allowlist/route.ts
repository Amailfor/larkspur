import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db, sql } from '@/lib/db'

type AllowedUrl = { url: string; comment?: string }

const defaults = {
  title: 'URL allowlist',
  allowed_urls: [
    { url: 'https://github.com', comment: 'Source code and collaboration' },
    { url: 'https://www.youtube.com', comment: 'Video platform' },
    { url: 'https://en.wikipedia.org', comment: 'Reference articles' },
  ],
}

function normalizeUrls(value: unknown): AllowedUrl[] {
  if (typeof value === 'string') {
    try {
      return normalizeUrls(JSON.parse(value))
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item === 'string') return [{ url: item }]
    if (!item || typeof item !== 'object' || typeof (item as { url?: unknown }).url !== 'string') return []
    const entry = item as { url: string; comment?: unknown }
    return [{ url: entry.url, ...(typeof entry.comment === 'string' && entry.comment.trim() ? { comment: entry.comment.trim() } : {}) }]
  })
}

async function getConfig() {
  const result = await db.execute(sql`SELECT title, allowed_urls FROM allowlist_config WHERE id = 1`)
  const row = result.rows[0] as { title: string; allowed_urls: unknown } | undefined
  return row ? { title: row.title, allowed_urls: normalizeUrls(row.allowed_urls) } : defaults
}

export async function GET() {
  const config = await getConfig().catch(() => defaults)
  const cookieStore = await cookies()
  return Response.json({ ...config, can_edit: cookieStore.get('allowlist_admin')?.value === '1' }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (body?.password !== '12345') return Response.json({ error: 'Invalid password.' }, { status: 401 })
  const response = Response.json({ ok: true })
  response.headers.append('Set-Cookie', 'allowlist_admin=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400')
  return response
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('allowlist_admin')?.value !== '1') return Response.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const urls = Array.isArray(body?.allowed_urls)
    ? body.allowed_urls.map((value: unknown) => {
        if (typeof value === 'string') return { url: value.trim() }
        if (!value || typeof value !== 'object' || typeof (value as { url?: unknown }).url !== 'string') return value
        const entry = value as { url: string; comment?: unknown }
        return { url: entry.url.trim(), ...(typeof entry.comment === 'string' && entry.comment.trim() ? { comment: entry.comment.trim() } : {}) }
      })
    : []
  const validUrls = urls.every((value: unknown) => {
    if (!value || typeof value !== 'object' || typeof (value as { url?: unknown }).url !== 'string') return false
    try {
      const parsed = new URL((value as { url: string }).url)
      return ['http:', 'https:'].includes(parsed.protocol) && parsed.pathname === '/' && !parsed.search && !parsed.hash
    } catch {
      return false
    }
  })

  if (!title || urls.length === 0 || !validUrls || new Set(urls.map((value) => (value as { url: string }).url)).size !== urls.length) {
    return Response.json({ error: 'Enter a title and unique valid URL origins.' }, { status: 400 })
  }

  try {
    await db.execute(sql`
      INSERT INTO allowlist_config (id, title, allowed_urls, updated_at)
      VALUES (1, ${title}, ${JSON.stringify(urls)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, allowed_urls = EXCLUDED.allowed_urls, updated_at = now()
    `)
    return Response.json({ title, allowed_urls: urls }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'The URL list could not be saved.' }, { status: 500 })
  }
}
