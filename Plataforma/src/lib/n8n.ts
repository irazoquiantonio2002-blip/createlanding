import type { Generacion, Negocio } from './tipos'

// ============================================================
//  Puente hacia n8n.
//
//  La plataforma NO espera a que termine la generación: el workflow tarda
//  minutos (visión sobre el logo, varias llamadas de IA, GitHub, Vercel) y
//  cualquier proxy cortaría la conexión antes. El webhook contesta de
//  inmediato y n8n va escribiendo el avance directo en Supabase; el
//  dashboard lo consulta cada pocos segundos.
// ============================================================

export type RespuestaDisparo = { ok: true } | { ok: false; error: string }

/** Tope del logo que viaja en el webhook. Por encima, la petición se vuelve
 *  pesada y el análisis de visión tampoco gana nada. */
const MAX_LOGO_BYTES = 4 * 1024 * 1024

export async function dispararGeneracion(
  negocio: Negocio,
  generacion: Generacion,
): Promise<RespuestaDisparo> {
  const webhook = process.env.N8N_WEBHOOK_URL
  if (!webhook) return { ok: false, error: 'Falta N8N_WEBHOOK_URL en .env.local' }

  // El logo va en base64 porque el workflow lo necesita en dos momentos: se
  // lo pasa al análisis de visión y lo sube como archivo al repo de GitHub.
  // Las demás imágenes van como URL: la plantilla las referencia tal cual.
  const logo = await logoEnBase64(negocio.logo_url)

  const cuerpo = {
    // Identidad del lado de la plataforma, para que n8n sepa a qué fila de
    // Supabase contestarle.
    generacion_id: generacion.id,
    negocio_id: negocio.id,
    origen: 'plataforma',

    // Datos del negocio, ya normalizados. n8n no tiene que adivinar formatos.
    nombre_negocio: negocio.nombre_negocio,
    descripcion_servicios: componerDescripcion(negocio),
    giro: negocio.giro ?? '',
    telefono: soloDigitos(negocio.telefono_whatsapp),
    telefonos: negocio.telefonos_adicionales.map(soloDigitos).filter(Boolean).join('\n'),
    horarios: negocio.horarios ?? '',
    ubicacion_url: negocio.ubicaciones.join('\n'),
    redes_sociales: [negocio.instagram_url, negocio.facebook_url].filter(Boolean).join(' '),

    // Marca. Si color_marca viene, manda sobre el análisis de visión.
    color_marca: negocio.color_marca ?? '',
    logo_url: negocio.logo_url ?? '',
    logo_base64: logo?.base64 ?? '',
    logo_mime: logo?.mime ?? '',

    // URLs públicas de Supabase Storage: van a los huecos más visibles y
    // Pexels rellena lo que falte para llegar a los 16 que pide la plantilla.
    imagenes: negocio.imagenes.map((i) => i.url),

    plantilla_slug: negocio.plantilla_slug,

    // Desde el dashboard NO se le escribe al dueño por WhatsApp: la agencia
    // revisa primero y decide cuándo enseñársela.
    avisar_whatsapp: false,
  }

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_TOKEN
          ? { 'x-plataforma-token': process.env.N8N_WEBHOOK_TOKEN }
          : {}),
      },
      body: JSON.stringify(cuerpo),
      // El webhook solo acusa recibo; si no contesta en 30s es que algo está
      // mal en n8n, no que la página tarde.
      signal: AbortSignal.timeout(30_000),
    })

    const texto = (await r.text().catch(() => '')).trim()

    if (!r.ok) {
      return { ok: false, error: `n8n respondió ${r.status}. ${texto.slice(0, 300)}` }
    }

    // Ojo: cuando el workflow revienta ANTES de llegar a "Acusar recibo"
    // -por ejemplo si el payload no pasa la validación- n8n cierra la
    // conexión con 200 y cuerpo vacío, no con un 5xx. Sin esta comprobación
    // la generación se quedaría en 'encolado' para siempre y el dashboard
    // girando. El acuse bueno siempre trae { ok: true }.
    let acuse: { ok?: boolean; error?: string; message?: string } = {}
    try {
      acuse = texto ? JSON.parse(texto) : {}
    } catch {
      acuse = {}
    }

    if (acuse.ok !== true) {
      const detalle = acuse.error ?? acuse.message ?? texto.slice(0, 300)
      return {
        ok: false,
        error: detalle
          ? `n8n rechazó la petición: ${detalle}`
          : 'n8n aceptó la conexión pero no acusó recibo. Revisa la última ejecución del workflow.',
      }
    }

    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `No se pudo llamar a n8n: ${msg}` }
  }
}

/**
 * El workflow lee UN solo campo de texto para deducir giro, servicios y copy.
 * Aquí se junta la descripción con la lista de servicios para que no se
 * pierda nada de lo que capturó el formulario.
 */
function componerDescripcion(n: Negocio): string {
  const partes = [n.descripcion.trim()]
  if (n.giro) partes.push(`Giro: ${n.giro.trim()}`)
  if (n.servicios.length) {
    partes.push(`Servicios: ${n.servicios.map((s) => s.trim()).filter(Boolean).join(', ')}`)
  }
  return partes.filter(Boolean).join('\n\n')
}

async function logoEnBase64(url: string | null): Promise<{ base64: string; mime: string } | null> {
  if (!url) return null
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!r.ok) return null

    const bytes = new Uint8Array(await r.arrayBuffer())
    // Un logo que no cabe no debe tumbar la generación: la página sale con
    // el monograma de iniciales, que es el respaldo que ya trae el workflow.
    if (bytes.byteLength > MAX_LOGO_BYTES) return null

    const mime = (r.headers.get('content-type') ?? 'image/png').split(';')[0].trim()
    return { base64: Buffer.from(bytes).toString('base64'), mime }
  } catch {
    return null
  }
}

function soloDigitos(t: string): string {
  return (t ?? '').replace(/\D/g, '')
}
