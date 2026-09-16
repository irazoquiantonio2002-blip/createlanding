// ============================================================
//  Dos accesos, dos contraseñas:
//
//    dev   -> el dashboard de captura (/)         DEV_PASSWORD
//    admin -> el panel de entregados (/admin)     ADMIN_PASSWORD
//
//  La sesión es una cookie firmada con HMAC-SHA256: `rol.expira.firma`.
//  No hay tabla de usuarios ni Supabase Auth: el candado vive en proxy.ts
//  (para las páginas) y en cada route handler (para los datos).
//
//  Este módulo no importa `next/headers` a propósito: también lo usa
//  proxy.ts, que corre antes de que exista un contexto de request.
// ============================================================

export type Rol = 'admin' | 'dev'

export const COOKIE_SESION = 'sesion'
const DURACION_MS = 1000 * 60 * 60 * 24 * 7 // 7 días

function secreto(): string {
  const valor = process.env.ADMIN_SESSION_SECRET
  if (!valor) throw new Error('Falta ADMIN_SESSION_SECRET en las variables de entorno')
  return valor
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function firmar(payload: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(payload)))
}

/** La contraseña decide el rol. Si no coincide con ninguna, no hay acceso. */
export function rolDeContrasena(password: string, rolPedido: Rol): Rol | null {
  const esperada = rolPedido === 'admin' ? process.env.ADMIN_PASSWORD : process.env.DEV_PASSWORD
  if (!esperada || !password) return null
  return password === esperada ? rolPedido : null
}

export async function crearCookieSesion(rol: Rol): Promise<{ valor: string; maxAgeSeg: number }> {
  const payload = `${rol}.${Date.now() + DURACION_MS}`
  return {
    valor: `${payload}.${await firmar(payload)}`,
    maxAgeSeg: DURACION_MS / 1000,
  }
}

export async function rolDeCookie(cookie: string | undefined): Promise<Rol | null> {
  if (!cookie) return null

  const [rol, expira, firma] = cookie.split('.')
  if (rol !== 'admin' && rol !== 'dev') return null
  if (!expira || !firma) return null
  if (Number(expira) < Date.now()) return null

  const esperada = await firmar(`${rol}.${expira}`)
  return firma === esperada ? rol : null
}

/** A dónde va cada rol cuando aterriza donde no le toca. */
export function inicioDe(rol: Rol): string {
  return rol === 'admin' ? '/admin' : '/'
}
