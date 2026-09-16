import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE_SESION, sesionValida } from '@/lib/adminAuth'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

  const cookie = request.cookies.get(COOKIE_SESION)?.value
  if (await sesionValida(cookie)) return NextResponse.next()

  const login = request.nextUrl.clone()
  login.pathname = '/admin/login'
  login.search = ''
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/admin/:path*'],
}
