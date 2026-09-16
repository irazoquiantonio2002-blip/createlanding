'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancho = '32rem',
}: {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  children?: React.ReactNode
  pie?: React.ReactNode
  ancho?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      // Clic en el fondo (fuera del panel) cierra: el target es el propio dialog.
      onClick={(e) => {
        if (e.target === ref.current) onCerrar()
      }}
      style={{ width: `min(92vw, ${ancho})` }}
      className="m-auto rounded-xl border border-gris-200 bg-white p-0 text-gris-950 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gris-200 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-[13px] text-gris-600">{descripcion}</p>}
        </div>
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="-mr-1 shrink-0 rounded-md p-1 text-gris-500 transition hover:bg-gris-100 hover:text-gris-950"
        >
          <X size={16} />
        </button>
      </div>

      {children && <div className="px-5 py-4">{children}</div>}

      {pie && (
        <div className="flex items-center justify-end gap-2 border-t border-gris-200 bg-gris-50 px-5 py-3">
          {pie}
        </div>
      )}
    </dialog>
  )
}
