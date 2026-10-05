import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db, sql } from '@/lib/db'

const defaults = {
  title: 'URL allowlist',
  allowed_urls: ['https://github.com', 'https://www.youtube.com', 'https://en.wikipedia.org'],
}

async function getConfig() {
  const result = await db.execute(sql`SELECT title, allowed_urls FROM allowlist_config WHERE id = 1`)
  const row = result.rows[0] as { title: string; allowed_urls: string[] } | undefined
  return row ? { title: row.title, allowed_urls: row.allowed_urls } : defaults
}

export async function GET() {
  try {
    return Response.json(await getConfig(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json(defaults, { headers: { 'Cache-Control': 'no-store' } })
  }
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
  const urls = Array.isArray(body?.allowed_urls) ? body.allowed_urls : []
  if (!title || urls.length === 0 || urls.some((value: unknown) => typeof value !== 'string' || !/^https?:\/\/[^/]+$/.test(value))) {
    return Response.json({ error: 'Enter a title and valid URL origins.' }, { status: 400 })
  }

  await db.execute(sql`
    INSERT INTO allowlist_config (id, title, allowed_urls, updated_at)
    VALUES (1, ${title}, ${JSON.stringify(urls)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, allowed_urls = EXCLUDED.allowed_urls, updated_at = now()
  `)
  return Response.json({ title, allowed_urls: urls })
}
