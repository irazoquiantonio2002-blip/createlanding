'use client'

import { useRef, useState } from 'react'
import { ImageUp, Loader2 } from 'lucide-react'

/**
 * Saca la descripción del negocio de una imagen publicitaria y la escribe en
 * el campo. La imagen solo viaja para que la lean: no se guarda en ningún lado.
 */
export function AnalizarAnuncio({
  hayTexto,
  onTexto,
}: {
  hayTexto: boolean
  onTexto: (texto: string) => void
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [analizando, setAnalizando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState<string | null>(null)

  async function analizar(archivo: File) {
    setAnalizando(true)
    setError(null)

    const cuerpo = new FormData()
    cuerpo.append('archivo', archivo)

    const res = await fetch('/api/analizar-anuncio', { method: 'POST', body: cuerpo })
    const datos = await res.json().catch(() => null)
    setAnalizando(false)

    if (!res.ok) {
      setError(datos?.error ?? 'No se pudo analizar la imagen')
      return
    }

    // Si ya había algo escrito, se pregunta antes de pisarlo.
    if (hayTexto) setPendiente(datos.descripcion)
    else onTexto(datos.descripcion)
  }

  return (
    <div className="mt-2">
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          e.target.value = ''
          if (archivo) analizar(archivo)
        }}
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={analizando}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gris-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gris-700 transition hover:bg-gris-50 disabled:opacity-50"
      >
        {analizando ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Leyendo la imagen…
          </>
        ) : (
          <>
            <ImageUp size={13} className="text-gris-500" />
            Llenar desde una imagen publicitaria
          </>
        )}
      </button>

      {error && <p className="mt-1.5 text-[11px] text-rojo-700">{error}</p>}

      {pendiente && (
        <div className="mt-2 rounded-lg border border-ambar-100 bg-ambar-100 px-3 py-2">
          <p className="text-[12px] text-ambar-600">
            Ya hay una descripción escrita. ¿La reemplazo con lo que dice la imagen?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onTexto(pendiente)
                setPendiente(null)
              }}
              className="rounded-md bg-gris-950 px-2.5 py-1 text-[12px] font-medium text-white transition hover:bg-gris-800"
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => setPendiente(null)}
              className="rounded-md px-2.5 py-1 text-[12px] text-gris-600 transition hover:bg-white"
            >
              Dejar lo que está
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
