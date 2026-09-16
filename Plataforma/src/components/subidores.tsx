'use client'

import { useRef, useState } from 'react'
import type { ImagenNegocio } from '@/lib/tipos'

// ============================================================
//  Subida de logo e imágenes a Supabase Storage.
//
//  Los archivos suben ANTES de guardar el negocio, a una carpeta con un id
//  que se genera al abrir el formulario. Así el servidor solo recibe URLs
//  y n8n puede bajarlas después sin credenciales, en vez de que la página
//  mande megas de base64 por el webhook.
// ============================================================

async function subir(archivo: File, carpeta: string): Promise<ImagenNegocio> {
  const cuerpo = new FormData()
  cuerpo.append('archivo', archivo)
  cuerpo.append('carpeta', carpeta)

  const r = await fetch('/api/upload', { method: 'POST', body: cuerpo })
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(datos.error ?? 'No se pudo subir el archivo')

  return datos as ImagenNegocio
}

export function SubidorLogo({
  carpeta,
  url,
  cambiar,
}: {
  carpeta: string
  url: string | null
  cambiar: (v: { url: string; path: string } | null) => void
}) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)

  const elegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setCargando(true)
    setError(null)
    try {
      const subido = await subir(archivo, carpeta)
      cambiar({ url: subido.url, path: subido.path })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falló la subida')
    } finally {
      setCargando(false)
      if (entrada.current) entrada.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Logo del negocio" className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="text-xs text-slate-400">Sin logo</span>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={entrada}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => elegir(e.target.files?.[0])}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cargando}
              onClick={() => entrada.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {cargando ? 'Subiendo…' : url ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => cambiar(null)}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-rose-600"
              >
                Quitar
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            PNG, JPG, WEBP o SVG, hasta 10 MB. Si no hay logo se dibuja un monograma con las
            iniciales.
          </p>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  )
}

export function SubidorImagenes({
  carpeta,
  imagenes,
  cambiar,
}: {
  carpeta: string
  imagenes: ImagenNegocio[]
  cambiar: (v: ImagenNegocio[]) => void
}) {
  const [cargando, setCargando] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)

  const elegir = async (lista: FileList | null) => {
    if (!lista?.length) return
    const archivos = [...lista]
    setCargando(archivos.length)
    setError(null)

    const resultados = await Promise.allSettled(archivos.map((a) => subir(a, carpeta)))
    const ok = resultados
      .filter((r): r is PromiseFulfilledResult<ImagenNegocio> => r.status === 'fulfilled')
      .map((r) => r.value)
    const fallaron = resultados.filter((r) => r.status === 'rejected').length

    if (ok.length) cambiar([...imagenes, ...ok])
    if (fallaron) setError(`${fallaron} archivo(s) no se pudieron subir`)

    setCargando(0)
    if (entrada.current) entrada.current.value = ''
  }

  const quitar = (path: string) => cambiar(imagenes.filter((i) => i.path !== path))

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => elegir(e.target.files)}
      />

      {imagenes.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {imagenes.map((img, i) => (
            <li key={img.path} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.nombre} className="h-full w-full object-cover" />
              </div>
              <span className="absolute top-1 left-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => quitar(img.path)}
                aria-label={`Quitar ${img.nombre}`}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900/70 text-sm text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600 focus:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={cargando > 0}
        onClick={() => entrada.current?.click()}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {cargando > 0 ? `Subiendo ${cargando}…` : 'Agregar imágenes'}
      </button>

      <p className="mt-2 text-xs text-slate-500">
        La página usa 16 imágenes. Las que subas van a los lugares más visibles, en el orden en
        que aparecen aquí: portada, servicios, resultados y galería. Lo que falte se completa con
        fotos de banco.
      </p>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  )
}
