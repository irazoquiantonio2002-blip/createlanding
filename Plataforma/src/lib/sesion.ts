import { cookies } from 'next/headers'
import { COOKIE_SESION, rolDeCookie, type Rol } from './auth'

/**
 * El rol de quien hace esta petición, o null si no hay sesión válida.
 * Para páginas y route handlers. proxy.ts no puede usarla (no hay `cookies()`
 * ahí); ese lee la cookie del request directamente.
 */
export async function sesionActual(): Promise<Rol | null> {
  return rolDeCookie((await cookies()).get(COOKIE_SESION)?.value)
}
