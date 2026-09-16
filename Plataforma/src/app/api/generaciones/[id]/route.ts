import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sesionActual } from '@/lib/sesion'
import type { Generacion } from '@/lib/tipos'

// GET /api/generaciones/:id -> lo consulta el dashboard mientras trabaja n8n
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await sesionActual())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await ctx.params

  const { data, error } = await supabase
    .from('sitio_generaciones').select('*').eq('id', id).maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Generación no encontrada' }, { status: 404 })

  return NextResponse.json({ generacion: data as Generacion })
}
