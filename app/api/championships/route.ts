import { NextRequest, NextResponse } from 'next/server'

const KV_KEY = 'fly-hub-championships'

async function getKV() {
  const { kv } = await import('@vercel/kv')
  return kv
}

export async function GET() {
  try {
    const kv = await getKV()
    const data = await kv.get(KV_KEY)
    return NextResponse.json(data ?? null)
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
    const kv = await getKV()
    const body = await req.json()
    await kv.set(KV_KEY, body)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  }
}
