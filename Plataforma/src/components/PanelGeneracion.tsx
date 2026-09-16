'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { EstadoBadge } from './EstadoBadge'
import { ESTADO_TERMINADO, MINUTOS_ABANDONO, estaAbandonada, type Generacion } from '@/lib/tipos'

// ============================================================
//  El botón de generar y el seguimiento de lo que hace n8n.
//
//  Generar una página son varios minutos: visión sobre el logo, cuatro
//  llamadas de IA para el copy, GitHub y Vercel. Por eso el servidor solo
//  acusa recibo y aquí se consulta el avance cada pocos segundos.
// ============================================================

const CADA_MS = 4000

export function PanelGeneracion({
  negocioId,
  inicial,
}: {
  negocioId: string
  inicial: Generacion | null
}) {
  const router = useRouter()
  const [generacion, setGeneracion] = useState<Generacion | null>(inicial)
  const [disparando, setDisparando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // `atascada` se recalcula en cada consulta porque el intervalo cambia el
  // estado; no hace falta un temporizador aparte para que se note.
  const atascada = generacion !== null && estaAbandonada(generacion)
  const enVuelo = generacion !== null && !ESTADO_TERMINADO[generacion.estado] && !atascada

  // ---------- consultar avance ----------
  useEffect(() => {
    if (!generacion || !enVuelo) return

    let vivo = true
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/generaciones/${generacion.id}`, { cache: 'no-store' })
        if (!r.ok) return
        const { generacion: fresca } = (await r.json()) as { generacion: Generacion }
        if (!vivo) return

        setGeneracion(fresca)
        // Al terminar se recarga el servidor para que el resto de la página
        // (historial, encabezado) deje de mostrar datos viejos.
        if (ESTADO_TERMINADO[fresca.estado]) router.refresh()
      } catch {
        // Un fallo de red suelto no debe romper el seguimiento: se reintenta
        // en el siguiente ciclo.
      }
    }, CADA_MS)

    return () => {
      vivo = false
      clearInterval(id)
    }
  }, [generacion, enVuelo, router])

  // ---------- disparar ----------
  const generar = useCallback(async () => {
    setDisparando(true)
    setError(null)
    try {
      const r = await fetch(`/api/negocios/${negocioId}/generar`, { method: 'POST' })
      const datos = await r.json().catch(() => ({}))

      if (datos.generacion) setGeneracion(datos.generacion as Generacion)
      if (!r.ok) setError(datos.error ?? `El servidor respondió ${r.status}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo llamar al servidor')
    } finally {
      setDisparando(false)
    }
  }, [negocioId, router])

  const estado = generacion?.estado ?? null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Página web</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {estado === 'desplegado'
              ? 'La página está publicada y en línea.'
              : enVuelo
                ? 'n8n está armando la página. Puedes cerrar esta pestaña y volver después.'
                : 'Se genera con la plantilla cargada en n8n, usando los datos de este negocio.'}
          </p>
        </div>
        <EstadoBadge estado={estado} />
      </div>

      {enVuelo && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="late h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <p className="text-sm font-medium text-amber-900">
              {generacion?.paso ?? 'Trabajando…'}
            </p>
          </div>
          <p className="mt-1.5 pl-[1.125rem] text-xs text-amber-700">
            Suele tardar entre 2 y 5 minutos.
          </p>
        </div>
      )}

      {atascada && (
        <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-sm font-medium text-orange-900">Sin noticias de n8n</p>
          <p className="mt-1 text-xs text-orange-700">
            Pasaron más de {MINUTOS_ABANDONO} minutos sin que el workflow reportara nada. O falló
            a medio camino, o no pudo avisar de vuelta. Revisa la ejecución en n8n y vuelve a
            generar.
          </p>
        </div>
      )}

      {estado === 'desplegado' && generacion?.deployment_url && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">
            Página publicada
          </p>
          <a
            href={generacion.deployment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block break-all text-sm font-medium text-emerald-900 hover:underline"
          >
            {generacion.deployment_url}
          </a>
          {generacion.repo_url && (
            <a
              href={generacion.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-emerald-700 hover:underline"
            >
              Ver el repositorio en GitHub
            </a>
          )}
        </div>
      )}

      {estado === 'error' && generacion?.error && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-medium text-rose-900">La generación falló</p>
          <p className="mt-1 break-words text-xs text-rose-700">{generacion.error}</p>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={generar}
          disabled={disparando || enVuelo}
          className="rounded-lg bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-marca-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disparando
            ? 'Enviando…'
            : enVuelo
              ? 'Generando…'
              : estado === null
                ? 'Generar página web'
                : 'Volver a generar'}
        </button>

        {estado === 'desplegado' && generacion?.deployment_url && (
          <a
            href={generacion.deployment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Abrir la página
          </a>
        )}
      </div>
    </div>
  )
}
