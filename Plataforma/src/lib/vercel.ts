// ============================================================
//  Lo justo de la API de Vercel para cambiarle el dominio a una página ya
//  publicada. El token es el mismo tipo de credencial que usa n8n, pero la
//  plataforma trae el suyo: n8n guarda las credenciales cifradas y no las
//  presta.
// ============================================================

const API = 'https://api.vercel.com'

type Proyecto = { id: string; name: string }

function cabeceras(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

/** Reglas de Vercel para el nombre de un proyecto. */
export function validarNombre(nombre: string): string | null {
  const n = (nombre ?? '').trim().toLowerCase()
  if (!n) return 'Escribe un nombre'
  if (n.length < 3) return 'Necesita al menos 3 letras'
  if (n.length > 63) return 'No puede pasar de 63 caracteres'
  if (!/^[a-z0-9-]+$/.test(n)) return 'Solo minúsculas, números y guiones'
  if (n.startsWith('-') || n.endsWith('-')) return 'No puede empezar ni terminar con guion'
  if (n.includes('---')) return 'No puede llevar tres guiones seguidos'
  return null
}

/** El prefijo del host: mariachi-abc.vercel.app -> mariachi-abc */
export function nombreDesdeUrl(url: string): string {
  return String(url)
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.vercel\.app$/i, '')
}

export async function revisarDisponibilidad(
  nombre: string,
): Promise<{ libre: boolean; motivo?: string }> {
  // 1. ¿ya es un proyecto de esta cuenta?
  const mio = await fetch(`${API}/v9/projects/${encodeURIComponent(nombre)}`, {
    headers: cabeceras(),
  })
  if (mio.ok) return { libre: false, motivo: 'Ya tienes un proyecto con ese nombre' }
  if (mio.status !== 404) {
    return { libre: false, motivo: `Vercel respondió ${mio.status} al consultar el nombre` }
  }

  // 2. El .vercel.app es global: puede estar tomado por otra cuenta. Vercel
  //    contesta 404 en los que nadie reclamó, asi que se prueba el dominio.
  try {
    const vivo = await fetch(`https://${nombre}.vercel.app`, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    })
    if (vivo.status !== 404) {
      return { libre: false, motivo: 'Ese dominio ya lo usa otra página en Vercel' }
    }
  } catch {
    // Sin respuesta no se puede afirmar que este ocupado; el renombrado
    // fallara mas adelante si lo estaba, y ahi se ve el motivo real.
  }

  return { libre: true }
}

/**
 * El dominio .vercel.app se trunca respecto al nombre del proyecto
 * (proyecto-largo-de-mas -> proyecto-largo-de-ma.vercel.app), asi que el host
 * guardado no siempre es el nombre. Se intenta directo y si no, se busca.
 */
export async function buscarProyectoVercel(aprox: string): Promise<Proyecto | null> {
  const directo = await fetch(`${API}/v9/projects/${encodeURIComponent(aprox)}`, {
    headers: cabeceras(),
  })
  if (directo.ok) {
    const p = (await directo.json()) as Proyecto
    return { id: p.id, name: p.name }
  }

  const lista = await fetch(
    `${API}/v9/projects?search=${encodeURIComponent(aprox)}&limit=20`,
    { headers: cabeceras() },
  )
  if (!lista.ok) return null

  const { projects } = (await lista.json()) as { projects?: Proyecto[] }
  const candidatos = projects ?? []
  return candidatos.find((p) => p.name.startsWith(aprox)) ?? candidatos[0] ?? null
}

export async function renombrarProyecto(
  proyectoId: string,
  nombre: string,
): Promise<{ ok: true; dominio: string } | { ok: false; error: string }> {
  const r = await fetch(`${API}/v9/projects/${proyectoId}`, {
    method: 'PATCH',
    headers: cabeceras(),
    body: JSON.stringify({ name: nombre }),
  })

  if (!r.ok) {
    const cuerpo = (await r.json().catch(() => null)) as { error?: { message?: string } } | null
    return { ok: false, error: cuerpo?.error?.message ?? `Vercel respondió ${r.status}` }
  }

  return { ok: true, dominio: await dominioCanonico(proyectoId, nombre) }
}

/** El dominio que Vercel deja servido tras el cambio. */
async function dominioCanonico(proyectoId: string, nombre: string): Promise<string> {
  const r = await fetch(`${API}/v9/projects/${proyectoId}/domains?limit=50`, {
    headers: cabeceras(),
  })
  if (!r.ok) return `${nombre}.vercel.app`

  const { domains } = (await r.json()) as { domains?: { name: string }[] }
  const vercelApp = (domains ?? [])
    .map((d) => d.name)
    .filter((n) => n.endsWith('.vercel.app'))
    // el canonico es el corto; los largos son alias de cada despliegue
    .sort((a, b) => a.length - b.length)

  return vercelApp[0] ?? `${nombre}.vercel.app`
}
