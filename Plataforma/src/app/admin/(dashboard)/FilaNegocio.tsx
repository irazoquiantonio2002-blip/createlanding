'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EstadoBadge } from '@/components/EstadoBadge'
import { LogoNegocio } from '@/components/LogoNegocio'
import type { EstadoGeneracion } from '@/lib/tipos'

export type FilaDatos = {
  id: string
  nombre: string
  descripcion: string
  logoUrl: string | null
  color: string | null
  creadoEn: string
  estado: EstadoGeneracion | null
  repoUrl: string | null
  deploymentUrl: string | null
}

export function FilaNegocio({ negocio }: { negocio: FilaDatos }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function eliminar() {
    setBorrando(true)
    setError(null)

    const res = await fetch(`/api/negocios/${negocio.id}`, { method: 'DELETE' })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'No se pudo eliminar')
      setBorrando(false)
      return
    }

    setConfirmando(false)
    setBorrando(false)
    router.refresh()
  }

  return (
    <li className="px-4 py-4 transition hover:bg-slate-50/60">
      <div className="flex items-start gap-3.5">
        <LogoNegocio
          nombre={negocio.nombre}
          url={negocio.logoUrl}
          color={negocio.color}
          tamano="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-slate-900">{negocio.nombre}</h2>
              <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">
                {negocio.descripcion}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <EstadoBadge estado={negocio.estado} />
              {!confirmando && (
                <button
                  onClick={() => setConfirmando(true)}
                  className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {negocio.repoUrl && <Pastilla href={negocio.repoUrl}>Repositorio</Pastilla>}
            {negocio.deploymentUrl && <Pastilla href={negocio.deploymentUrl}>Vercel</Pastilla>}
            <span className="ml-auto text-xs text-slate-400">{fecha(negocio.creadoEn)}</span>
          </div>

          {confirmando && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <p className="text-xs text-rose-900">
                Se borra el negocio, su historial y sus imágenes. El repositorio y la página
                publicada siguen vivos.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={eliminar}
                  disabled={borrando}
                  className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-40"
                >
                  {borrando ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
                <button
                  onClick={() => {
                    setConfirmando(false)
                    setError(null)
                  }}
                  disabled={borrando}
                  className="rounded-md px-2.5 py-1 text-xs text-rose-700 transition hover:bg-rose-100 disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
              {error && <p className="mt-2 text-xs font-medium text-rose-700">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function Pastilla({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
    >
      {children}
      <span aria-hidden className="text-slate-400">
        ↗
      </span>
    </a>
  )
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}
