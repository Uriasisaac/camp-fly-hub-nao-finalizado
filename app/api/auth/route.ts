import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const secret = process.env.ADMIN_SECRET

  // If ADMIN_SECRET is set, require exact match. Otherwise allow any non-empty password.
  const ok = secret ? password === secret : password.length > 0

  const res = NextResponse.json({ ok })
  if (ok) {
    const cookieValue = secret || 'dev'
    res.cookies.set('admin-session', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }
  return res
}
