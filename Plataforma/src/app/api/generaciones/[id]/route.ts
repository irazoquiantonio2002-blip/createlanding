import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Generacion } from '@/lib/tipos'

// GET /api/generaciones/:id -> lo consulta el dashboard mientras trabaja n8n
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const { data, error } = await supabase
    .from('sitio_generaciones').select('*').eq('id', id).maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Generación no encontrada' }, { status: 404 })

  return NextResponse.json({ generacion: data as Generacion })
}
