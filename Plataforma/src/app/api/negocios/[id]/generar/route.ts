import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { dispararGeneracion } from '@/lib/n8n'
import { MINUTOS_ABANDONO, estaAbandonada, type Generacion, type Negocio } from '@/lib/tipos'

// ============================================================
//  POST /api/negocios/:id/generar
//
//  Da de alta la generación en Supabase y avisa a n8n. No espera el
//  resultado: el workflow tarda minutos y va escribiendo su avance en la
//  misma fila, que el dashboard consulta cada pocos segundos.
// ============================================================

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const { data: negocio, error: errNegocio } = await supabase
    .from('negocios').select('*').eq('id', id).maybeSingle()

  if (errNegocio) return NextResponse.json({ error: errNegocio.message }, { status: 500 })
  if (!negocio) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  // Dos generaciones a la vez del mismo negocio chocarían en n8n: las dos
  // reservan el mismo sitio y la segunda pisa el trabajo de la primera.
  const { data: enVueloRaw } = await supabase
    .from('sitio_generaciones').select('*')
    .eq('negocio_id', id)
    .in('estado', ['encolado', 'generando'])

  const enVuelo = (enVueloRaw ?? []) as Generacion[]
  const viva = enVuelo.find((g) => !estaAbandonada(g))

  if (viva) {
    return NextResponse.json(
      { error: 'Ya hay una generación en curso para este negocio', generacion: viva },
      { status: 409 },
    )
  }

  // Las que pasaron del tope se dan por perdidas: si no se cierran, el
  // negocio queda bloqueado para siempre porque nunca deja de haber una
  // "en curso".
  if (enVuelo.length) {
    await supabase
      .from('sitio_generaciones')
      .update({
        estado: 'error',
        paso: null,
        error: `n8n no reportó nada en ${MINUTOS_ABANDONO} minutos. Se dio por perdida.`,
        terminado_en: new Date().toISOString(),
      })
      .in('id', enVuelo.map((g) => g.id))
  }

  const { data: generacion, error: errAlta } = await supabase
    .from('sitio_generaciones')
    .insert({ negocio_id: id, estado: 'encolado', paso: 'Enviando a n8n' })
    .select().single()

  if (errAlta) return NextResponse.json({ error: errAlta.message }, { status: 500 })

  const r = await dispararGeneracion(negocio as Negocio, generacion as Generacion)

  if (!r.ok) {
    // Si n8n ni siquiera acusó recibo, la fila se queda en 'encolado' para
    // siempre y el dashboard giraría sin fin. Se cierra aquí.
    const { data: fallida } = await supabase
      .from('sitio_generaciones')
      .update({ estado: 'error', error: r.error, paso: null, terminado_en: new Date().toISOString() })
      .eq('id', generacion.id).select().single()

    return NextResponse.json({ error: r.error, generacion: fallida }, { status: 502 })
  }

  return NextResponse.json({ generacion: generacion as Generacion }, { status: 202 })
}
