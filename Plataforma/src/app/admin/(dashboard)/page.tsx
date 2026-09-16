import { supabase } from '@/lib/supabase'
import { FilaNegocio, type FilaDatos } from './FilaNegocio'
import type { Generacion, Negocio } from '@/lib/tipos'

// Refleja lo que hay en Supabase en el momento, igual que el resto del dashboard.
export const dynamic = 'force-dynamic'

export default async function PaginaAdmin() {
  const { data: negociosRaw, error } = await supabase
    .from('negocios')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
        <p className="text-sm font-medium text-rose-900">No se pudo leer Supabase</p>
        <p className="mt-1 text-[13px] text-rose-700">{error.message}</p>
      </div>
    )
  }

  const negocios = (negociosRaw ?? []) as Negocio[]
  const ultima = new Map<string, Generacion>()

  if (negocios.length) {
    const { data } = await supabase
      .from('sitio_generaciones')
      .select('*')
      .in('negocio_id', negocios.map((n) => n.id))
      .order('creado_en', { ascending: false })

    // Llegan de la más nueva a la más vieja: la primera de cada negocio manda.
    for (const g of (data ?? []) as Generacion[]) {
      if (!ultima.has(g.negocio_id)) ultima.set(g.negocio_id, g)
    }
  }

  const vistas = [...ultima.values()]
  const publicadas = vistas.filter((g) => g.estado === 'desplegado').length
  const enCurso = vistas.filter((g) => g.estado === 'encolado' || g.estado === 'generando').length
  const conError = vistas.filter((g) => g.estado === 'error').length

  const filas: FilaDatos[] = negocios.map((n) => {
    const g = ultima.get(n.id) ?? null
    return {
      id: n.id,
      nombre: n.nombre_negocio,
      descripcion: n.descripcion,
      logoUrl: n.logo_url,
      color: n.color_marca,
      creadoEn: n.creado_en,
      estado: g?.estado ?? null,
      repoUrl: g?.repo_url ?? null,
      deploymentUrl: g?.deployment_url ?? null,
    }
  })

  return (
    <>
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Proyectos</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Todos los negocios dados de alta, con su página publicada y su repositorio.
        </p>
      </header>

      {negocios.length > 0 && (
        <div className="mb-6 grid grid-cols-2 divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x">
          <Dato valor={negocios.length} etiqueta="Negocios" />
          <Dato valor={publicadas} etiqueta="Publicadas" />
          <Dato valor={enCurso} etiqueta="En curso" />
          <Dato valor={conError} etiqueta="Con error" />
        </div>
      )}

      {filas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-900">Todavía no hay proyectos</p>
          <p className="mt-1.5 text-[13px] text-slate-500">
            Cuando el equipo dé de alta un negocio y genere su página, aparece aquí.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filas.map((f) => (
            <FilaNegocio key={f.id} negocio={f} />
          ))}
        </ul>
      )}
    </>
  )
}

function Dato({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0">
      <p className="text-xl font-semibold tracking-tight text-slate-900 tabular-nums">{valor}</p>
      <p className="mt-0.5 text-xs text-slate-500">{etiqueta}</p>
    </div>
  )
}
