import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const secret = process.env.ADMIN_SECRET

  // If no secret configured, allow any password (dev mode)
  const ok = !secret || password === secret
  return NextResponse.json({ ok })
}
