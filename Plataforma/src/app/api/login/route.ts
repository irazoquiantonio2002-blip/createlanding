import { NextResponse } from 'next/server'
import { COOKIE_SESION, crearCookieSesion, inicioDe, rolDeContrasena, type Rol } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''
  const rolPedido: Rol = body?.rol === 'admin' ? 'admin' : 'dev'

  const rol = rolDeContrasena(password, rolPedido)
  if (!rol) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const { valor, maxAgeSeg } = await crearCookieSesion(rol)
  const respuesta = NextResponse.json({ ok: true, destino: inicioDe(rol) })
  respuesta.cookies.set(COOKIE_SESION, valor, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeg,
  })
  return respuesta
}
