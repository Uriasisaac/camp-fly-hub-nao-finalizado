import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.ADMIN_SECRET || 'dev-token'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const ok = password === TOKEN

  const res = NextResponse.json({ ok })
  if (ok) {
    res.cookies.set('admin-session', TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })
  }
  return res
}
