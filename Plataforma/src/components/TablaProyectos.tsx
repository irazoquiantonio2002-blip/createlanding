'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ExternalLink,
  Eye,
  GitBranch,
  Globe,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react'
import { EstadoBadge } from '@/components/EstadoBadge'
import { LogoNegocio } from '@/components/LogoNegocio'
import { Modal } from '@/components/ui/Modal'
import { ETIQUETA_ESTADO, type EstadoGeneracion, type Generacion, type Negocio } from '@/lib/tipos'

export type ProyectoFila = {
  id: string
  nombre: string
  descripcion: string
  giro: string | null
  logoUrl: string | null
  color: string | null
  creadoEn: string
  estado: EstadoGeneracion | null
  repoUrl: string | null
  deploymentUrl: string | null
}

const FILTROS: { valor: string; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'desplegado', etiqueta: ETIQUETA_ESTADO.desplegado },
  { valor: 'generando', etiqueta: 'En curso' },
  { valor: 'error', etiqueta: ETIQUETA_ESTADO.error },
  { valor: 'sin', etiqueta: 'Sin generar' },
]

export function TablaProyectos({
  filas,
  modo,
}: {
  filas: ProyectoFila[]
  modo: 'admin' | 'dev'
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [menu, setMenu] = useState<string | null>(null)
  const [aEliminar, setAEliminar] = useState<ProyectoFila | null>(null)
  const [detalleId, setDetalleId] = useState<string | null>(null)

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return filas.filter((f) => {
      if (q && !`${f.nombre} ${f.descripcion} ${f.giro ?? ''}`.toLowerCase().includes(q)) {
        return false
      }
      if (filtro === 'todos') return true
      if (filtro === 'sin') return f.estado === null
      if (filtro === 'generando') return f.estado === 'generando' || f.estado === 'encolado'
      return f.estado === filtro
    })
  }, [filas, busqueda, filtro])

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gris-400"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar proyecto…"
            className="w-full rounded-lg border border-gris-200 bg-white py-1.5 pr-3 pl-8 text-[13px] text-gris-950 outline-none transition placeholder:text-gris-400 focus:border-gris-400"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-gris-200 bg-white p-0.5">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded-md px-2 py-1 text-[12px] transition ${
                filtro === f.valor
                  ? 'bg-gris-100 font-medium text-gris-950'
                  : 'text-gris-600 hover:text-gris-950'
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[12px] text-gris-500 tabular-nums">
          {visibles.length} de {filas.length}
        </span>
      </div>

      {/* Sin overflow-hidden a propósito: recortaría el menú de acciones. Las
          esquinas se redondean fila por fila. */}
      <div className="rounded-xl border border-gris-200 bg-white">
        <div className="hidden items-center gap-4 border-b border-gris-200 bg-gris-50 px-4 py-2 text-[11px] font-medium text-gris-500 lg:flex">
          <span className="flex-1">Proyecto</span>
          <span className="w-28">Estado</span>
          <span className="w-44">Enlaces</span>
          <span className="w-20 text-right">Creado</span>
          <span className="w-7" />
        </div>

        {visibles.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[13px] font-medium text-gris-950">Sin resultados</p>
            <p className="mt-1 text-[13px] text-gris-500">
              {filas.length === 0
                ? 'Todavía no hay negocios dados de alta.'
                : 'Prueba con otra búsqueda o quita el filtro.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gris-100 [&>li:first-child]:rounded-t-[11px] [&>li:last-child]:rounded-b-[11px]">
            {visibles.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition hover:bg-gris-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <LogoNegocio nombre={f.nombre} url={f.logoUrl} color={f.color} />
                  <div className="min-w-0">
                    {modo === 'dev' ? (
                      <Link
                        href={`/negocios/${f.id}`}
                        className="block truncate text-[13px] font-medium text-gris-950 hover:underline"
                      >
                        {f.nombre}
                      </Link>
                    ) : (
                      <button
                        onClick={() => setDetalleId(f.id)}
                        className="block max-w-full truncate text-left text-[13px] font-medium text-gris-950 hover:underline"
                      >
                        {f.nombre}
                      </button>
                    )}
                    <p className="truncate font-mono text-[11px] text-gris-500">
                      {f.deploymentUrl ? host(f.deploymentUrl) : (f.giro ?? 'sin publicar')}
                    </p>
                  </div>
                </div>

                <div className="w-28">
                  <EstadoBadge estado={f.estado} />
                </div>

                <div className="flex w-44 items-center gap-1.5">
                  {f.deploymentUrl && (
                    <Enlace href={f.deploymentUrl} icono={Globe}>
                      Página
                    </Enlace>
                  )}
                  {f.repoUrl && (
                    <Enlace href={f.repoUrl} icono={GitBranch}>
                      Repo
                    </Enlace>
                  )}
                  {!f.deploymentUrl && !f.repoUrl && (
                    <span className="text-[12px] text-gris-400">—</span>
                  )}
                </div>

                <span className="w-20 text-right text-[12px] text-gris-500 tabular-nums">
                  {fechaCorta(f.creadoEn)}
                </span>

                <div className="relative w-7">
                  <button
                    onClick={() => setMenu(menu === f.id ? null : f.id)}
                    aria-label={`Acciones de ${f.nombre}`}
                    className="rounded-md p-1.5 text-gris-500 transition hover:bg-gris-100 hover:text-gris-950"
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {menu === f.id && (
                    <>
                      <button
                        tabIndex={-1}
                        aria-hidden
                        onClick={() => setMenu(null)}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                      <div className="absolute top-8 right-0 z-20 w-52 overflow-hidden rounded-lg border border-gris-200 bg-white py-1 shadow-lg">
                        {modo === 'admin' ? (
                          <ItemMenu
                            icono={Eye}
                            onClick={() => {
                              setMenu(null)
                              setDetalleId(f.id)
                            }}
                          >
                            Ver detalles
                          </ItemMenu>
                        ) : (
                          <ItemMenu icono={Eye} href={`/negocios/${f.id}`}>
                            Ver detalles
                          </ItemMenu>
                        )}

                        {f.deploymentUrl && (
                          <ItemMenu icono={ExternalLink} href={f.deploymentUrl} externo>
                            Abrir página
                          </ItemMenu>
                        )}
                        {f.repoUrl && (
                          <ItemMenu icono={GitBranch} href={f.repoUrl} externo>
                            Abrir repositorio
                          </ItemMenu>
                        )}

                        {modo === 'admin' && (
                          <>
                            <div className="my-1 border-t border-gris-100" />
                            <ItemMenu
                              icono={Trash2}
                              peligro
                              onClick={() => {
                                setMenu(null)
                                setAEliminar(f)
                              }}
                            >
                              Eliminar proyecto
                            </ItemMenu>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ModalDetalle id={detalleId} onCerrar={() => setDetalleId(null)} />
      <ModalEliminar
        proyecto={aEliminar}
        onCerrar={() => setAEliminar(null)}
        onListo={() => {
          setAEliminar(null)
          router.refresh()
        }}
      />
    </>
  )
}

// ---------- modal de detalle ----------

function ModalDetalle({ id, onCerrar }: { id: string | null; onCerrar: () => void }) {
  const [datos, setDatos] = useState<{ negocio: Negocio; generaciones: Generacion[] } | null>(null)
  const [cargando, setCargando] = useState(false)

  // El detalle completo se pide al abrir, no viaja con el listado.
  useEffect(() => {
    if (!id) return
    let vigente = true

    setDatos(null)
    setCargando(true)
    fetch(`/api/negocios/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vigente) return
        setDatos(d)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [id])

  return (
    <Modal
      abierto={id !== null}
      onCerrar={onCerrar}
      titulo={datos?.negocio.nombre_negocio ?? 'Detalles del proyecto'}
      descripcion={datos?.negocio.giro ?? undefined}
      ancho="40rem"
    >
      {cargando && <p className="py-6 text-center text-[13px] text-gris-500">Cargando…</p>}

      {datos && (
        <div className="space-y-5">
          <Campo etiqueta="Descripción">{datos.negocio.descripcion}</Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="WhatsApp">{datos.negocio.telefono_whatsapp}</Campo>
            <Campo etiqueta="Color de marca">
              {datos.negocio.color_marca ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded border border-gris-200"
                    style={{ background: datos.negocio.color_marca }}
                  />
                  <span className="font-mono text-[12px]">{datos.negocio.color_marca}</span>
                </span>
              ) : (
                <span className="text-gris-400">Lo deduce la IA</span>
              )}
            </Campo>
          </div>

          {datos.negocio.servicios.length > 0 && (
            <Campo etiqueta="Servicios">
              <span className="flex flex-wrap gap-1.5">
                {datos.negocio.servicios.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-gris-200 bg-gris-50 px-1.5 py-0.5 text-[11px] text-gris-700"
                  >
                    {s}
                  </span>
                ))}
              </span>
            </Campo>
          )}

          <Campo etiqueta={`Imágenes (${datos.negocio.imagenes.length})`}>
            {datos.negocio.imagenes.length === 0 ? (
              <span className="text-gris-400">Ninguna. La página usó fotos de banco.</span>
            ) : (
              <span className="grid grid-cols-6 gap-1.5">
                {datos.negocio.imagenes.slice(0, 12).map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.path}
                    src={img.url}
                    alt=""
                    className="aspect-square w-full rounded-md border border-gris-200 object-cover"
                  />
                ))}
              </span>
            )}
          </Campo>

          <CambiarDominio
            negocioId={datos.negocio.id}
            publicada={datos.generaciones.find((g) => g.estado === 'desplegado' && g.deployment_url) ?? null}
          />

          <div>
            <p className="mb-1.5 text-[11px] font-medium text-gris-500">
              Historial de generaciones ({datos.generaciones.length})
            </p>
            <ul className="divide-y divide-gris-100 overflow-hidden rounded-lg border border-gris-200">
              {datos.generaciones.slice(0, 6).map((g) => (
                <li key={g.id} className="flex items-center gap-3 px-3 py-2">
                  <EstadoBadge estado={g.estado} />
                  <span className="text-[12px] text-gris-500">{fechaLarga(g.creado_en)}</span>
                  {g.error && (
                    <span className="ml-auto max-w-[14rem] truncate text-[11px] text-rojo-700" title={g.error}>
                      {g.error}
                    </span>
                  )}
                  {!g.error && g.deployment_url && (
                    <a
                      href={g.deployment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[12px] text-azul-600 hover:underline"
                    >
                      Abrir
                    </a>
                  )}
                </li>
              ))}
              {datos.generaciones.length === 0 && (
                <li className="px-3 py-3 text-[12px] text-gris-500">Nunca se ha generado.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ---------- modal de borrado ----------

function ModalEliminar({
  proyecto,
  onCerrar,
  onListo,
}: {
  proyecto: ProyectoFila | null
  onCerrar: () => void
  onListo: () => void
}) {
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function eliminar() {
    if (!proyecto) return
    setBorrando(true)
    setError(null)

    const res = await fetch(`/api/negocios/${proyecto.id}`, { method: 'DELETE' })
    setBorrando(false)

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'No se pudo eliminar')
      return
    }
    onListo()
  }

  return (
    <Modal
      abierto={proyecto !== null}
      onCerrar={onCerrar}
      titulo="Eliminar proyecto"
      descripcion={proyecto?.nombre}
      pie={
        <>
          <button
            onClick={onCerrar}
            disabled={borrando}
            className="rounded-lg border border-gris-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gris-700 transition hover:bg-gris-50 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={eliminar}
            disabled={borrando}
            className="rounded-lg bg-rojo-600 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-rojo-700 disabled:opacity-40"
          >
            {borrando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-gris-700">
        Se borra el negocio de la plataforma, su historial de generaciones y las imágenes que subió
        a Storage. Esta acción no se puede deshacer.
      </p>
      <p className="mt-3 rounded-lg border border-gris-200 bg-gris-50 px-3 py-2 text-[12px] leading-relaxed text-gris-600">
        El repositorio de GitHub y la página publicada en Vercel <strong>siguen vivos</strong>: los
        creó el workflow de n8n con credenciales que la plataforma no tiene.
      </p>
      {error && <p className="mt-3 text-[12px] font-medium text-rojo-700">{error}</p>}
    </Modal>
  )
}

// ---------- piezas ----------

function ItemMenu({
  icono: Icono,
  children,
  onClick,
  href,
  externo,
  peligro,
}: {
  icono: typeof Eye
  children: React.ReactNode
  onClick?: () => void
  href?: string
  externo?: boolean
  peligro?: boolean
}) {
  const clase = `flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition ${
    peligro ? 'text-rojo-700 hover:bg-rojo-100' : 'text-gris-700 hover:bg-gris-50'
  }`

  if (href) {
    return (
      <a
        href={href}
        {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={clase}
      >
        <Icono size={14} className={peligro ? '' : 'text-gris-500'} />
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={clase}>
      <Icono size={14} className={peligro ? '' : 'text-gris-500'} />
      {children}
    </button>
  )
}

function Enlace({
  href,
  icono: Icono,
  children,
}: {
  href: string
  icono: typeof Globe
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-gris-200 bg-white px-1.5 py-0.5 text-[11px] text-gris-600 transition hover:border-gris-300 hover:text-gris-950"
    >
      <Icono size={11} />
      {children}
    </a>
  )
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-gris-500">{etiqueta}</p>
      <div className="text-[13px] leading-relaxed text-gris-800">{children}</div>
    </div>
  )
}

function host(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

// ---------- cambiar el dominio de la pagina publicada ----------

function CambiarDominio({
  negocioId,
  publicada,
}: {
  negocioId: string
  publicada: Generacion | null
}) {
  const router = useRouter()
  const actual = publicada?.deployment_url ? host(publicada.deployment_url) : ''
  const [nombre, setNombre] = useState(actual.replace(/\.vercel\.app$/i, ''))
  const [estado, setEstado] = useState<{ libre: boolean; motivo?: string } | null>(null)
  const [comprobando, setComprobando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<string | null>(null)

  if (!publicada) {
    return (
      <div className="rounded-lg border border-gris-200 bg-gris-50 px-3 py-2.5">
        <p className="text-[11px] font-medium text-gris-500">Dominio</p>
        <p className="mt-1 text-[13px] text-gris-600">
          Se puede cambiar cuando la página esté publicada.
        </p>
      </div>
    )
  }

  const sinCambio = nombre.trim().toLowerCase() === actual.replace(/\.vercel\.app$/i, '')

  async function comprobar() {
    setComprobando(true)
    setError(null)
    setEstado(null)

    const res = await fetch(
      `/api/negocios/${negocioId}/dominio?nombre=${encodeURIComponent(nombre.trim().toLowerCase())}`,
    )
    const body = await res.json().catch(() => null)
    setComprobando(false)

    if (!res.ok) {
      setError(body?.error ?? 'No se pudo comprobar')
      return
    }
    setEstado(body)
  }

  async function aplicar() {
    setAplicando(true)
    setError(null)

    const res = await fetch(`/api/negocios/${negocioId}/dominio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim().toLowerCase() }),
    })
    const body = await res.json().catch(() => null)
    setAplicando(false)

    if (!res.ok) {
      setError(body?.error ?? 'No se pudo cambiar el dominio')
      return
    }
    setHecho(body.deployment_url)
    setEstado(null)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-gris-200 px-3 py-2.5">
      <p className="text-[11px] font-medium text-gris-500">Dominio</p>

      <p className="mt-1 font-mono text-[12px] text-gris-600">
        {hecho ? host(hecho) : actual}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            setEstado(null)
            setError(null)
            setHecho(null)
          }}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-md border border-gris-200 px-2 py-1.5 font-mono text-[12px] text-gris-950 outline-none transition focus:border-gris-400"
        />
        <span className="shrink-0 font-mono text-[12px] text-gris-500">.vercel.app</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={comprobar}
          disabled={comprobando || aplicando || !nombre.trim() || sinCambio}
          className="rounded-md border border-gris-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gris-700 transition hover:bg-gris-50 disabled:opacity-40"
        >
          {comprobando ? 'Comprobando…' : 'Comprobar si está libre'}
        </button>

        {estado?.libre && (
          <button
            type="button"
            onClick={aplicar}
            disabled={aplicando}
            className="rounded-md bg-gris-950 px-2.5 py-1 text-[12px] font-medium text-white transition hover:bg-gris-800 disabled:opacity-40"
          >
            {aplicando ? 'Cambiando…' : 'Cambiar dominio'}
          </button>
        )}
      </div>

      {estado && (
        <p
          className={`mt-2 text-[12px] ${estado.libre ? 'text-verde-700' : 'text-rojo-700'}`}
        >
          {estado.libre
            ? `${nombre.trim().toLowerCase()}.vercel.app está libre. Al cambiarlo, la dirección anterior deja de responder.`
            : estado.motivo}
        </p>
      )}

      {hecho && (
        <p className="mt-2 text-[12px] text-verde-700">
          Listo, la página quedó en {host(hecho)}
        </p>
      )}

      {error && <p className="mt-2 text-[12px] text-rojo-700">{error}</p>}
    </div>
  )
}
