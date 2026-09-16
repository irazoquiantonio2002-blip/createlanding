import { NextResponse } from 'next/server'
import { BUCKET, supabase } from '@/lib/supabase'
import { sesionActual } from '@/lib/sesion'
import type { Generacion, ImagenNegocio, Negocio } from '@/lib/tipos'

// GET /api/negocios/:id -> el negocio y su historial de generaciones
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await sesionActual())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await ctx.params

  const { data: negocio, error } = await supabase
    .from('negocios').select('*').eq('id', id).maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!negocio) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const { data: generaciones } = await supabase
    .from('sitio_generaciones').select('*')
    .eq('negocio_id', id)
    .order('creado_en', { ascending: false })

  return NextResponse.json({
    negocio: negocio as Negocio,
    generaciones: (generaciones ?? []) as Generacion[],
  })
}

// ============================================================
//  DELETE /api/negocios/:id  (solo admin)
//
//  Borra el negocio de la plataforma: la fila, su historial de generaciones
//  (se va en cascada) y los archivos que subió a Storage. El repo de GitHub,
//  el proyecto de Vercel y la fila de `proyectos` en n8n NO se tocan: los creó
//  el workflow con credenciales que la plataforma no tiene.
// ============================================================
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await sesionActual()) !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await ctx.params

  const { data: negocio, error: errLectura } = await supabase
    .from('negocios').select('*').eq('id', id).maybeSingle()

  if (errLectura) return NextResponse.json({ error: errLectura.message }, { status: 500 })
  if (!negocio) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const n = negocio as Negocio
  const rutas = [
    ...(n.logo_path ? [n.logo_path] : []),
    ...(n.imagenes ?? []).map((img: ImagenNegocio) => img.path).filter(Boolean),
  ]

  // Si Storage falla quedan archivos huérfanos en un bucket, que es inofensivo;
  // lo que no puede quedar a medias es la fila, así que esa sí se revisa.
  if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas)

  const { error } = await supabase.from('negocios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
