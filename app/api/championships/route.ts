import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TABLE = 'store'
const ROW_KEY = 'championships'

function supabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Supabase env vars not set')
  return { url, key }
}

export async function GET() {
  try {
    const { url, key } = supabase()
    const res = await fetch(
      `${url}/rest/v1/${TABLE}?key=eq.${ROW_KEY}&select=value&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    if (!res.ok) return NextResponse.json(null)
    const rows = await res.json()
    const data = rows?.[0]?.value ?? null
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(null)
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  const session = req.cookies.get('admin-session')?.value
  const expected = secret || 'dev'
  if (session !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url, key } = supabase()
    const championships = await req.json()
    const res = await fetch(`${url}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: ROW_KEY, value: championships }),
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 503 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 })
  }
}
