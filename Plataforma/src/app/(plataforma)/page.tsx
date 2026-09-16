import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { EstadoBadge } from '@/components/EstadoBadge'
import type { Generacion, Negocio } from '@/lib/tipos'

// El listado tiene que reflejar lo que acaba de pasar en n8n, así que no se cachea.
export const dynamic = 'force-dynamic'

export default async function Pagina() {
  const { data: negociosRaw, error } = await supabase
    .from('negocios')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) return <ErrorCaja mensaje={error.message} />

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Negocios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Captura la información de un negocio y genera su página web.
          </p>
        </div>
        <Link
          href="/negocios/nuevo"
          className="rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-marca-700"
        >
          Nuevo negocio
        </Link>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Negocios" valor={negocios.length} />
        <Tarjeta titulo="Páginas publicadas" valor={publicadas} />
        <Tarjeta titulo="Generándose ahora" valor={enCurso} />
      </div>

      {negocios.length === 0 ? <Vacio /> : <Tabla negocios={negocios} ultima={ultima} />}
    </div>
  )
}

function Tabla({
  negocios,
  ultima,
}: {
  negocios: Negocio[]
  ultima: Map<string, Generacion>
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Negocio</th>
              <th className="px-5 py-3 font-medium">Marca</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Página</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {negocios.map((n) => {
              const g = ultima.get(n.id) ?? null
              return (
                <tr key={n.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <Link href={`/negocios/${n.id}`} className="flex items-center gap-3">
                      <Logo negocio={n} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">
                          {n.nombre_negocio}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {n.giro || n.descripcion.slice(0, 60)}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    {n.color_marca ? (
                      <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                        <span
                          className="h-4 w-4 rounded ring-1 ring-slate-300 ring-inset"
                          style={{ background: n.color_marca }}
                        />
                        {n.color_marca}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Lo decide la IA</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <EstadoBadge estado={g?.estado ?? null} />
                  </td>
                  <td className="px-5 py-4">
                    {g?.deployment_url ? (
                      <a
                        href={g.deployment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-marca-600 hover:text-marca-700 hover:underline"
                      >
                        Abrir
                      </a>
                    ) : (
                      <Link href={`/negocios/${n.id}`} className="text-slate-500 hover:text-slate-900">
                        Ver detalle
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Vacio() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-900">Todavía no hay negocios</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Da de alta el primero con su nombre, descripción, servicios, color de marca, logo e
        imágenes. Después se genera su página con un clic.
      </p>
      <Link
        href="/negocios/nuevo"
        className="mt-5 inline-block rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-marca-700"
      >
        Dar de alta un negocio
      </Link>
    </div>
  )
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valor}</p>
    </div>
  )
}

function Logo({ negocio }: { negocio: Negocio }) {
  if (negocio.logo_url) {
    return (
      // El logo viene de Storage con tamaño desconocido; next/image no aporta
      // aquí y obligaría a configurar tamaños por cada negocio.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={negocio.logo_url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain ring-1 ring-slate-200 ring-inset"
      />
    )
  }

  const iniciales = negocio.nombre_negocio
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white"
      style={{ background: negocio.color_marca ?? '#64748b' }}
    >
      {iniciales || 'NN'}
    </span>
  )
}

function ErrorCaja({ mensaje }: { mensaje: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
        <p className="text-sm font-medium text-rose-900">No se pudo leer Supabase</p>
        <p className="mt-1 text-sm text-rose-700">{mensaje}</p>
        <p className="mt-3 text-xs text-rose-600">
          Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
        </p>
      </div>
    </div>
  )
}
