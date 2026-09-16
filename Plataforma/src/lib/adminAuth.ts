// ============================================================
//  Sesión del admin: una sola contraseña (ADMIN_PASSWORD) y una cookie
//  firmada con HMAC-SHA256 (ADMIN_SESSION_SECRET). Sin cuentas, sin base
//  de datos de usuarios: el candado está en el middleware, no en Supabase.
// ============================================================

export const COOKIE_SESION = 'admin_session'
const DURACION_MS = 1000 * 60 * 60 * 24 * 7 // 7 días

function secreto(): string {
  const valor = process.env.ADMIN_SESSION_SECRET
  if (!valor) throw new Error('Falta ADMIN_SESSION_SECRET en .env.local')
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
  const firma = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(payload))
  return hex(firma)
}

export async function crearCookieSesion(): Promise<{ valor: string; maxAgeSeg: number }> {
  const expira = Date.now() + DURACION_MS
  const payload = String(expira)
  const firma = await firmar(payload)
  return { valor: `${payload}.${firma}`, maxAgeSeg: DURACION_MS / 1000 }
}

export async function sesionValida(cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false
  const [payload, firma] = cookie.split('.')
  if (!payload || !firma) return false
  if (Number(payload) < Date.now()) return false
  const esperada = await firmar(payload)
  return firma === esperada
}
