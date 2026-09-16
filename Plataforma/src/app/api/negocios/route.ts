import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sesionActual } from '@/lib/sesion'
import type { Generacion, Negocio, NegocioConUltimaGeneracion } from '@/lib/tipos'

// ============================================================
//  GET  /api/negocios  -> listado con la última generación de cada uno
//  POST /api/negocios  -> alta (solo el rol dev, que es quien captura)
// ============================================================

export async function GET() {
  if (!(await sesionActual())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: negocios, error } = await supabase
    .from('negocios')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (negocios ?? []).map((n) => n.id)
  let generaciones: Generacion[] = []

  if (ids.length) {
    const { data } = await supabase
      .from('sitio_generaciones')
      .select('*')
      .in('negocio_id', ids)
      .order('creado_en', { ascending: false })
    generaciones = (data ?? []) as Generacion[]
  }

  // Las generaciones llegan de la más nueva a la más vieja, así que la
  // primera de cada negocio es la que vale.
  const ultima = new Map<string, Generacion>()
  for (const g of generaciones) if (!ultima.has(g.negocio_id)) ultima.set(g.negocio_id, g)

  const salida: NegocioConUltimaGeneracion[] = (negocios ?? []).map((n) => ({
    ...(n as Negocio),
    ultima_generacion: ultima.get(n.id) ?? null,
  }))

  return NextResponse.json({ negocios: salida })
}

export async function POST(req: Request) {
  if ((await sesionActual()) !== 'dev') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const cuerpo = await req.json().catch(() => null)
  if (!cuerpo) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })

  const problema = validar(cuerpo)
  if (problema) return NextResponse.json({ error: problema }, { status: 400 })

  const fila = {
    nombre_negocio: texto(cuerpo.nombre_negocio),
    descripcion: texto(cuerpo.descripcion),
    servicios: lista(cuerpo.servicios),
    giro: texto(cuerpo.giro) || null,
    telefono_whatsapp: texto(cuerpo.telefono_whatsapp),
    telefonos_adicionales: lista(cuerpo.telefonos_adicionales),
    horarios: texto(cuerpo.horarios) || null,
    ubicaciones: lista(cuerpo.ubicaciones),
    instagram_url: texto(cuerpo.instagram_url) || null,
    facebook_url: texto(cuerpo.facebook_url) || null,
    color_marca: texto(cuerpo.color_marca).toLowerCase() || null,
    logo_url: texto(cuerpo.logo_url) || null,
    logo_path: texto(cuerpo.logo_path) || null,
    imagenes: Array.isArray(cuerpo.imagenes) ? cuerpo.imagenes : [],
  }

  const { data, error } = await supabase.from('negocios').insert(fila).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ negocio: data as Negocio }, { status: 201 })
}

// ---------- validación ----------

function validar(c: Record<string, unknown>): string | null {
  if (!texto(c.nombre_negocio)) return 'El nombre del negocio es obligatorio'
  if (!texto(c.descripcion)) return 'La descripción del negocio es obligatoria'

  const tel = texto(c.telefono_whatsapp).replace(/\D/g, '')
  // El workflow arma el enlace de WhatsApp con este número y lo pone en toda
  // la página; si viene mal, la página sale con un botón que no lleva a nadie.
  if (tel.length < 10) return 'El WhatsApp necesita al menos 10 dígitos'

  const color = texto(c.color_marca)
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return 'El color de marca debe ir en formato #RRGGBB'
  }
  return null
}

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function lista(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
}
