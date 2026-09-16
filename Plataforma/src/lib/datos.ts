import { BUCKET, supabase } from './supabase'
import type { ProyectoFila } from '@/components/TablaProyectos'
import type { Generacion, Negocio } from './tipos'

export type Resumen = {
  filas: ProyectoFila[]
  total: number
  publicadas: number
  enCurso: number
  conError: number
  error: string | null
}

/**
 * Los negocios con el estado de su última generación. Es lo que pintan los dos
 * dashboards, así que vive aquí en vez de repetirse en cada página.
 */
export async function cargarResumen(): Promise<Resumen> {
  const vacio: Resumen = {
    filas: [],
    total: 0,
    publicadas: 0,
    enCurso: 0,
    conError: 0,
    error: null,
  }

  const { data: negociosRaw, error } = await supabase
    .from('negocios')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) return { ...vacio, error: error.message }

  const negocios = (negociosRaw ?? []) as Negocio[]
  const { ultima, ultimaPublicada } = await generacionesPorNegocio(negocios.map((n) => n.id))

  const filas: ProyectoFila[] = negocios.map((n) => {
    const g = ultima.get(n.id) ?? null
    // Los enlaces salen de la última generación PUBLICADA, no de la última a
    // secas: un reintento fallido encima de una página viva dejaba la fila sin
    // repo ni URL, como si el sitio no existiera.
    const viva = ultimaPublicada.get(n.id) ?? null
    return {
      id: n.id,
      nombre: n.nombre_negocio,
      descripcion: n.descripcion,
      giro: n.giro,
      logoUrl: n.logo_url,
      color: n.color_marca,
      creadoEn: n.creado_en,
      estado: g?.estado ?? null,
      repoUrl: viva?.repo_url ?? null,
      deploymentUrl: viva?.deployment_url ?? null,
    }
  })

  const vistas = [...ultima.values()]

  return {
    filas,
    total: negocios.length,
    // "Publicadas" cuenta negocios con página viva, aunque el último intento
    // haya fallado: la página anterior sigue en línea.
    publicadas: ultimaPublicada.size,
    enCurso: vistas.filter((g) => g.estado === 'encolado' || g.estado === 'generando').length,
    conError: vistas.filter((g) => g.estado === 'error').length,
    error: null,
  }
}

async function generacionesPorNegocio(ids: string[]): Promise<{
  ultima: Map<string, Generacion>
  ultimaPublicada: Map<string, Generacion>
}> {
  const ultima = new Map<string, Generacion>()
  const ultimaPublicada = new Map<string, Generacion>()
  if (!ids.length) return { ultima, ultimaPublicada }

  const { data } = await supabase
    .from('sitio_generaciones')
    .select('*')
    .in('negocio_id', ids)
    .order('creado_en', { ascending: false })

  // Llegan de la más nueva a la más vieja: la primera de cada negocio manda.
  for (const g of (data ?? []) as Generacion[]) {
    if (!ultima.has(g.negocio_id)) ultima.set(g.negocio_id, g)
    if (g.estado === 'desplegado' && g.deployment_url && !ultimaPublicada.has(g.negocio_id)) {
      ultimaPublicada.set(g.negocio_id, g)
    }
  }
  return { ultima, ultimaPublicada }
}

export type UsoCarpeta = {
  carpeta: string
  nombre: string
  huerfana: boolean
  archivos: number
  bytes: number
}

/**
 * Lo que ocupa cada negocio en el bucket de Storage.
 *
 * Ojo con el emparejado: la carpeta NO es el id del negocio. Los archivos
 * suben antes de guardar la fila, a una carpeta con un uuid que inventa el
 * navegador, así que el único puente entre carpeta y negocio son las rutas que
 * quedaron guardadas en `logo_path` e `imagenes`. Lo que no empareja es basura
 * de un formulario que alguien empezó y nunca envió.
 */
export async function cargarAlmacenamiento(): Promise<{
  carpetas: UsoCarpeta[]
  totalBytes: number
  totalArchivos: number
  bytesHuerfanos: number
}> {
  const { data: raiz } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })
  const carpetas = (raiz ?? []).filter((e) => e.id === null)

  const { data: negociosRaw } = await supabase
    .from('negocios')
    .select('nombre_negocio, logo_path, imagenes')

  const nombrePorCarpeta = new Map<string, string>()
  for (const n of (negociosRaw ?? []) as Pick<
    Negocio,
    'nombre_negocio' | 'logo_path' | 'imagenes'
  >[]) {
    const rutas = [n.logo_path, ...(n.imagenes ?? []).map((i) => i.path)]
    for (const ruta of rutas) {
      const carpeta = ruta?.split('/')[0]
      if (carpeta) nombrePorCarpeta.set(carpeta, n.nombre_negocio)
    }
  }

  const usos = await Promise.all(
    carpetas.map(async (c): Promise<UsoCarpeta> => {
      const { data } = await supabase.storage.from(BUCKET).list(c.name, { limit: 1000 })
      const archivos = data ?? []
      const nombre = nombrePorCarpeta.get(c.name)
      return {
        carpeta: c.name,
        nombre: nombre ?? 'Sin negocio asociado',
        huerfana: !nombre,
        archivos: archivos.length,
        bytes: archivos.reduce((t, a) => t + Number(a.metadata?.size ?? 0), 0),
      }
    }),
  )

  usos.sort((a, b) => b.bytes - a.bytes)

  return {
    carpetas: usos,
    totalBytes: usos.reduce((t, u) => t + u.bytes, 0),
    totalArchivos: usos.reduce((t, u) => t + u.archivos, 0),
    bytesHuerfanos: usos.filter((u) => u.huerfana).reduce((t, u) => t + u.bytes, 0),
  }
}

export type EventoActividad = Generacion & { nombre_negocio: string }

/** El historial completo de generaciones, lo más nuevo primero. */
export async function cargarActividad(limite = 60): Promise<EventoActividad[]> {
  const { data } = await supabase
    .from('sitio_generaciones')
    .select('*, negocios(nombre_negocio)')
    .order('creado_en', { ascending: false })
    .limit(limite)

  type Fila = Generacion & { negocios: { nombre_negocio: string } | null }

  return ((data ?? []) as unknown as Fila[]).map((g) => ({
    ...g,
    nombre_negocio: g.negocios?.nombre_negocio ?? 'Negocio eliminado',
  }))
}
