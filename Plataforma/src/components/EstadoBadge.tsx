import type { EstadoGeneracion } from '@/lib/tipos'
import { ETIQUETA_ESTADO } from '@/lib/tipos'

const ESTILO: Record<EstadoGeneracion, string> = {
  encolado:   'border-gris-200 bg-gris-50 text-gris-700',
  generando:  'border-ambar-100 bg-ambar-100 text-ambar-600',
  desplegado: 'border-verde-100 bg-verde-100 text-verde-700',
  error:      'border-rojo-100 bg-rojo-100 text-rojo-700',
}

const PUNTO: Record<EstadoGeneracion, string> = {
  encolado:   'bg-gris-400',
  generando:  'bg-ambar-600 late',
  desplegado: 'bg-verde-600',
  error:      'bg-rojo-600',
}

export function EstadoBadge({ estado }: { estado: EstadoGeneracion | null }) {
  if (!estado) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gris-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gris-500">
        <span className="h-1.5 w-1.5 rounded-full bg-gris-300" />
        Sin generar
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ESTILO[estado]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${PUNTO[estado]}`} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  )
}
