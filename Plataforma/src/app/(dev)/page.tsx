import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { EstadoBadge } from '@/components/EstadoBadge'
import { LogoNegocio } from '@/components/LogoNegocio'
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
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Negocios</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Captura la información de un negocio y genera su página web.
          </p>
        </div>
        <Link
          href="/negocios/nuevo"
          className="rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-slate-800"
        >
          Nuevo negocio
        </Link>
      </header>

      {negocios.length > 0 && (
        <div className="mb-6 grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Dato valor={negocios.length} etiqueta="Negocios" />
          <Dato valor={publicadas} etiqueta="Publicadas" />
          <Dato valor={enCurso} etiqueta="En curso" />
        </div>
      )}

      {negocios.length === 0 ? <Vacio /> : <Lista negocios={negocios} ultima={ultima} />}
    </>
  )
}

function Lista({ negocios, ultima }: { negocios: Negocio[]; ultima: Map<string, Generacion> }) {
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {negocios.map((n) => {
        const g = ultima.get(n.id) ?? null
        return (
          <li key={n.id}>
            <Link
              href={`/negocios/${n.id}`}
              className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-slate-50"
            >
              <LogoNegocio nombre={n.nombre_negocio} url={n.logo_url} color={n.color_marca} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{n.nombre_negocio}</p>
                <p className="truncate text-xs text-slate-500">
                  {n.giro || n.descripcion}
                </p>
              </div>

              <EstadoBadge estado={g?.estado ?? null} />

              <span className="hidden w-24 text-right text-xs text-slate-400 sm:block">
                {fecha(n.creado_en)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Dato({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xl font-semibold tracking-tight text-slate-900 tabular-nums">{valor}</p>
      <p className="mt-0.5 text-xs text-slate-500">{etiqueta}</p>
    </div>
  )
}

function Vacio() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-900">Todavía no hay negocios</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
        Da de alta el primero con su nombre, descripción, servicios, color de marca, logo e
        imágenes. Después se genera su página con un clic.
      </p>
      <Link
        href="/negocios/nuevo"
        className="mt-5 inline-block rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-slate-800"
      >
        Dar de alta un negocio
      </Link>
    </div>
  )
}

function ErrorCaja({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
      <p className="text-sm font-medium text-rose-900">No se pudo leer Supabase</p>
      <p className="mt-1 text-[13px] text-rose-700">{mensaje}</p>
      <p className="mt-3 text-xs text-rose-600">
        Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.
      </p>
    </div>
  )
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}
