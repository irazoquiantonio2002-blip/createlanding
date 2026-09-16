import { NextResponse } from 'next/server'
import { COOKIE_SESION, crearCookieSesion } from '@/lib/adminAuth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Falta ADMIN_PASSWORD en .env.local' }, { status: 500 })
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const { valor, maxAgeSeg } = await crearCookieSesion()
  const respuesta = NextResponse.json({ ok: true })
  respuesta.cookies.set(COOKIE_SESION, valor, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeg,
  })
  return respuesta
}
