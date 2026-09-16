import { NextResponse } from 'next/server'
import { COOKIE_SESION } from '@/lib/adminAuth'

export async function POST() {
  const respuesta = NextResponse.json({ ok: true })
  respuesta.cookies.delete(COOKIE_SESION)
  return respuesta
}
