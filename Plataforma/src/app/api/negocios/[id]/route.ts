import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Generacion, Negocio } from '@/lib/tipos'

// GET /api/negocios/:id -> el negocio y su historial de generaciones
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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
