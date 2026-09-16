import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE_SESION, inicioDe, rolDeCookie } from '@/lib/auth'

const LOGINS = ['/login', '/admin/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rol = await rolDeCookie(request.cookies.get(COOKIE_SESION)?.value)
  const esRutaAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  // En un login: si ya hay sesión no tiene caso enseñarlo otra vez.
  if (LOGINS.includes(pathname)) {
    return rol ? NextResponse.redirect(destino(request, inicioDe(rol))) : NextResponse.next()
  }

  if (!rol) {
    return NextResponse.redirect(destino(request, esRutaAdmin ? '/admin/login' : '/login'))
  }

  // Cada rol solo en su mitad: el admin no captura negocios y el
  // desarrollador no ve el panel de entregados.
  if (esRutaAdmin !== (rol === 'admin')) {
    return NextResponse.redirect(destino(request, inicioDe(rol)))
  }

  return NextResponse.next()
}

function destino(request: NextRequest, pathname: string): URL {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  return url
}

export const config = {
  // Todo menos las rutas de API (se protegen solas, cada una según su rol)
  // y los archivos estáticos.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
