import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Cabecera, Contenido } from '@/components/shell/Shell'
import { EstadoBadge } from '@/components/EstadoBadge'
import { LogoNegocio } from '@/components/LogoNegocio'
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
    <>
      <Cabecera
        titulo={n.nombre_negocio}
        descripcion={n.giro || 'Sin giro capturado'}
        previo={
          <LogoNegocio
            nombre={n.nombre_negocio}
            url={n.logo_url}
            color={n.color_marca}
            tamano="md"
          />
        }
        acciones={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gris-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gris-700 transition hover:bg-gris-50"
          >
            <ArrowLeft size={14} />
            Volver
          </Link>
        }
      />

      <Contenido>
        <div className="mx-auto max-w-4xl space-y-5">
        <PanelGeneracion negocioId={n.id} inicial={generaciones[0] ?? null} />

        <section className="rounded-xl border border-gris-200 bg-white p-5">
          <h2 className="mb-5 border-b border-gris-100 pb-4 text-[14px] font-semibold text-gris-950">
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
                      className="rounded-md bg-gris-100 px-2 py-1 text-xs font-medium text-gris-700"
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
                    className="h-4 w-4 rounded ring-1 ring-gris-300 ring-inset"
                    style={{ background: n.color_marca }}
                  />
                  <span className="font-mono text-xs">{n.color_marca}</span>
                </span>
              ) : (
                <span className="text-gris-400">Lo deduce la IA del logo</span>
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
                <span className="text-gris-400">Ninguna. La página usará fotos de banco.</span>
              ) : (
                <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {n.imagenes.map((img) => (
                    <li
                      key={img.path}
                      className="aspect-square overflow-hidden rounded-lg border border-gris-200 bg-gris-50"
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
          <section className="rounded-xl border border-gris-200 bg-white p-5">
            <h2 className="mb-4 border-b border-gris-100 pb-4 text-[14px] font-semibold text-gris-950">
              Intentos anteriores
            </h2>
            <ul className="divide-y divide-gris-100">
              {generaciones.slice(1).map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <EstadoBadge estado={g.estado} />
                  <span className="text-gris-500">
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
                      className="ml-auto text-azul-600 hover:underline"
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
      </Contenido>
    </>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-gris-500">{etiqueta}</dt>
      <dd className="min-w-0 text-sm text-gris-800">{children}</dd>
    </div>
  )
}

function Enlace({ url, texto }: { url: string; texto: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-azul-600 hover:underline"
    >
      {texto}
    </a>
  )
}

