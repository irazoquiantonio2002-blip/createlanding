import { supabase } from '@/lib/supabase'

// Refleja lo que hay en Supabase en el momento, igual que el resto del dashboard.
export const dynamic = 'force-dynamic'

type ProyectoDesplegado = {
  id: string
  negocio_id: string
  deployment_url: string | null
  repo_url: string | null
  negocios: { nombre_negocio: string; descripcion: string } | null
}

export default async function PaginaAdmin() {
  const { data, error } = await supabase
    .from('sitio_generaciones')
    .select('id, negocio_id, deployment_url, repo_url, negocios(nombre_negocio, descripcion)')
    .eq('estado', 'desplegado')
    .order('terminado_en', { ascending: false })

  if (error) {
    return <p className="text-sm text-rose-400">No se pudo leer Supabase: {error.message}</p>
  }

  // Un negocio puede tener varias generaciones desplegadas (regeneraciones);
  // solo interesa la más reciente de cada uno, y ya vienen ordenadas para eso.
  const vistos = new Set<string>()
  const proyectos = (data as unknown as ProyectoDesplegado[]).filter((g) => {
    if (vistos.has(g.negocio_id)) return false
    vistos.add(g.negocio_id)
    return true
  })

  if (proyectos.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay proyectos publicados.</p>
  }

  return (
    <ul className="divide-y divide-slate-900">
      {proyectos.map((p) => (
        <li key={p.id} className="py-6 first:pt-0">
          <h2 className="text-base font-medium text-slate-100">
            {p.negocios?.nombre_negocio ?? 'Sin nombre'}
          </h2>
          {p.negocios?.descripcion && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-400">
              {p.negocios.descripcion}
            </p>
          )}
          <div className="mt-3 flex gap-5 text-xs">
            {p.repo_url && <Enlace href={p.repo_url}>Repositorio</Enlace>}
            {p.deployment_url && <Enlace href={p.deployment_url}>Vercel</Enlace>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-slate-300 transition hover:text-white hover:underline"
    >
      {children}
    </a>
  )
}
