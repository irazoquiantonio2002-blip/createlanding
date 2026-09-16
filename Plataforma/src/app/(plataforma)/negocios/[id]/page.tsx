import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EstadoBadge } from '@/components/EstadoBadge'
import { PanelGeneracion } from '@/components/PanelGeneracion'
import type { Generacion, Negocio } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: negocioRaw } = await supabase
    .from('negocios')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!negocioRaw) notFound()
  const n = negocioRaw as Negocio

  const { data: generacionesRaw } = await supabase
    .from('sitio_generaciones')
    .select('*')
    .eq('negocio_id', id)
    .order('creado_en', { ascending: false })

  const generaciones = (generacionesRaw ?? []) as Generacion[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-slate-900">
          Negocios
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-900">{n.nombre_negocio}</span>
      </nav>

      <header className="mb-8 flex items-center gap-4">
        {n.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={n.logo_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl bg-white object-contain ring-1 ring-slate-200 ring-inset"
          />
        ) : (
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-base font-semibold text-white"
            style={{ background: n.color_marca ?? '#64748b' }}
          >
            {iniciales(n.nombre_negocio)}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
            {n.nombre_negocio}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{n.giro || 'Sin giro capturado'}</p>
        </div>
      </header>

      <div className="space-y-6">
        <PanelGeneracion negocioId={n.id} inicial={generaciones[0] ?? null} />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 border-b border-slate-100 pb-4 text-base font-semibold text-slate-900">
            Información del negocio
          </h2>

          <dl className="space-y-4">
            <Dato etiqueta="Descripción">
              <p className="whitespace-pre-line">{n.descripcion}</p>
            </Dato>

            {n.servicios.length > 0 && (
              <Dato etiqueta="Servicios">
                <ul className="flex flex-wrap gap-1.5">
                  {n.servicios.map((s) => (
                    <li
                      key={s}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </Dato>
            )}

            <Dato etiqueta="Color de marca">
              {n.color_marca ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded ring-1 ring-slate-300 ring-inset"
                    style={{ background: n.color_marca }}
                  />
                  <span className="font-mono text-xs">{n.color_marca}</span>
                </span>
              ) : (
                <span className="text-slate-400">Lo deduce la IA del logo</span>
              )}
            </Dato>

            <Dato etiqueta="WhatsApp">{n.telefono_whatsapp}</Dato>

            {n.telefonos_adicionales.length > 0 && (
              <Dato etiqueta="Otros teléfonos">{n.telefonos_adicionales.join(' · ')}</Dato>
            )}

            {n.ubicaciones.length > 0 && (
              <Dato etiqueta="Sucursales">
                <ul className="space-y-1">
                  {n.ubicaciones.map((u) => (
                    <li key={u} className="break-words">
                      {u}
                    </li>
                  ))}
                </ul>
              </Dato>
            )}

            {n.horarios && (
              <Dato etiqueta="Horarios">
                <p className="whitespace-pre-line">{n.horarios}</p>
              </Dato>
            )}

            {(n.instagram_url || n.facebook_url) && (
              <Dato etiqueta="Redes">
                <span className="flex flex-wrap gap-3">
                  {n.instagram_url && <Enlace url={n.instagram_url} texto="Instagram" />}
                  {n.facebook_url && <Enlace url={n.facebook_url} texto="Facebook" />}
                </span>
              </Dato>
            )}

            <Dato etiqueta={`Imágenes (${n.imagenes.length})`}>
              {n.imagenes.length === 0 ? (
                <span className="text-slate-400">Ninguna. La página usará fotos de banco.</span>
              ) : (
                <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {n.imagenes.map((img) => (
                    <li
                      key={img.path}
                      className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.nombre} className="h-full w-full object-cover" />
                    </li>
                  ))}
                </ul>
              )}
            </Dato>
          </dl>
        </section>

        {generaciones.length > 1 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 border-b border-slate-100 pb-4 text-base font-semibold text-slate-900">
              Intentos anteriores
            </h2>
            <ul className="divide-y divide-slate-100">
              {generaciones.slice(1).map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <EstadoBadge estado={g.estado} />
                  <span className="text-slate-500">
                    {new Date(g.creado_en).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  {g.deployment_url && (
                    <a
                      href={g.deployment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-marca-600 hover:underline"
                    >
                      Abrir
                    </a>
                  )}
                  {g.error && (
                    <span className="ml-auto max-w-sm truncate text-xs text-rose-600" title={g.error}>
                      {g.error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{etiqueta}</dt>
      <dd className="min-w-0 text-sm text-slate-800">{children}</dd>
    </div>
  )
}

function Enlace({ url, texto }: { url: string; texto: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-marca-600 hover:underline"
    >
      {texto}
    </a>
  )
}

function iniciales(nombre: string): string {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'NN'
  )
}
