// ============================================================
//  Tipos compartidos entre el servidor y el navegador.
//  Reflejan 1 a 1 las tablas `negocios` y `sitio_generaciones`.
// ============================================================

export type EstadoGeneracion = 'encolado' | 'generando' | 'desplegado' | 'error'

export type ImagenNegocio = {
  url: string
  path: string
  nombre: string
}

export type Negocio = {
  id: string
  nombre_negocio: string
  descripcion: string
  servicios: string[]
  giro: string | null
  telefono_whatsapp: string
  telefonos_adicionales: string[]
  horarios: string | null
  ubicaciones: string[]
  instagram_url: string | null
  facebook_url: string | null
  color_marca: string | null
  logo_url: string | null
  logo_path: string | null
  imagenes: ImagenNegocio[]
  plantilla_slug: string
  creado_en: string
  actualizado_en: string
}

export type Generacion = {
  id: string
  negocio_id: string
  estado: EstadoGeneracion
  paso: string | null
  deployment_url: string | null
  repo_url: string | null
  proyecto_id: number | null
  sitio_id: number | null
  n8n_execution_id: string | null
  error: string | null
  creado_en: string
  actualizado_en: string
  terminado_en: string | null
}

export type NegocioConUltimaGeneracion = Negocio & {
  ultima_generacion: Generacion | null
}

/** Lo que manda el formulario. Sin ids ni fechas: eso lo pone la base. */
export type FormularioNegocio = {
  nombre_negocio: string
  descripcion: string
  servicios: string[]
  giro: string
  telefono_whatsapp: string
  telefonos_adicionales: string[]
  horarios: string
  ubicaciones: string[]
  instagram_url: string
  facebook_url: string
  color_marca: string
  logo_url: string | null
  logo_path: string | null
  imagenes: ImagenNegocio[]
}

/**
 * Una generación que lleva más de esto sin terminar se da por perdida.
 * Puede pasar si n8n se cae a medio camino o si no logra avisar de vuelta
 * (credencial de Supabase mal puesta, por ejemplo). Sin este tope el
 * dashboard se quedaría girando para siempre y el botón de generar bloqueado.
 */
export const MINUTOS_ABANDONO = 15

export function estaAbandonada(g: Generacion): boolean {
  if (ESTADO_TERMINADO[g.estado]) return false
  return Date.now() - new Date(g.creado_en).getTime() > MINUTOS_ABANDONO * 60_000
}

/** Un estado terminal ya no hay que seguir consultándolo. */
export const ESTADO_TERMINADO: Record<EstadoGeneracion, boolean> = {
  encolado: false,
  generando: false,
  desplegado: true,
  error: true,
}

export const ETIQUETA_ESTADO: Record<EstadoGeneracion, string> = {
  encolado: 'En cola',
  generando: 'Generando',
  desplegado: 'Publicada',
  error: 'Con error',
}
