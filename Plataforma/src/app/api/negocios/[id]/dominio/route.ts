import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sesionActual } from '@/lib/sesion'
import {
  buscarProyectoVercel,
  nombreDesdeUrl,
  renombrarProyecto,
  revisarDisponibilidad,
  validarNombre,
} from '@/lib/vercel'
import type { Generacion } from '@/lib/tipos'

// ============================================================
//  GET  /api/negocios/:id/dominio?nombre=x  -> ¿está libre?
//  POST /api/negocios/:id/dominio           -> renombra el proyecto
//
//  Solo admin: cambiar el dominio tumba la URL anterior, y la anterior es la
//  que el cliente ya tiene repartida.
// ============================================================

async function generacionPublicada(negocioId: string): Promise<Generacion | null> {
  const { data } = await supabase
    .from('sitio_generaciones')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('estado', 'desplegado')
    .not('deployment_url', 'is', null)
    .order('creado_en', { ascending: false })
    .limit(1)

  const filas = (data ?? []) as Generacion[]
  return filas[0] ?? null
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await sesionActual()) !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!process.env.VERCEL_TOKEN) {
    return NextResponse.json({ error: 'Falta VERCEL_TOKEN en las variables de entorno' }, { status: 500 })
  }

  const nombre = new URL(req.url).searchParams.get('nombre') ?? ''
  const problema = validarNombre(nombre)
  if (problema) return NextResponse.json({ libre: false, motivo: problema })

  return NextResponse.json(await revisarDisponibilidad(nombre))
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await sesionActual()) !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!process.env.VERCEL_TOKEN) {
    return NextResponse.json({ error: 'Falta VERCEL_TOKEN en las variables de entorno' }, { status: 500 })
  }

  const { id } = await ctx.params
  const cuerpo = await req.json().catch(() => null)
  const nombre = typeof cuerpo?.nombre === 'string' ? cuerpo.nombre.trim().toLowerCase() : ''

  const problema = validarNombre(nombre)
  if (problema) return NextResponse.json({ error: problema }, { status: 400 })

  const generacion = await generacionPublicada(id)
  if (!generacion?.deployment_url) {
    return NextResponse.json({ error: 'Este negocio no tiene una página publicada' }, { status: 404 })
  }

  const estado = await revisarDisponibilidad(nombre)
  if (!estado.libre) {
    return NextResponse.json({ error: estado.motivo ?? 'Ese dominio ya está ocupado' }, { status: 409 })
  }

  // El dominio .vercel.app se trunca respecto al nombre del proyecto, así que
  // el host guardado no sirve para identificarlo: hay que buscarlo.
  const proyecto = await buscarProyectoVercel(nombreDesdeUrl(generacion.deployment_url))
  if (!proyecto) {
    return NextResponse.json(
      { error: 'No se encontró el proyecto en Vercel para esta página' },
      { status: 404 },
    )
  }

  const r = await renombrarProyecto(proyecto.id, nombre)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })

  const nuevaUrl = `https://${r.dominio}`
  const { error } = await supabase
    .from('sitio_generaciones')
    .update({ deployment_url: nuevaUrl })
    .eq('id', generacion.id)

  if (error) {
    return NextResponse.json(
      { error: `Vercel ya quedó en ${r.dominio}, pero no se pudo guardar: ${error.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, deployment_url: nuevaUrl })
}
