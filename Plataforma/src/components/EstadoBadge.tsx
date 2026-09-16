import type { EstadoGeneracion } from '@/lib/tipos'
import { ETIQUETA_ESTADO } from '@/lib/tipos'

const ESTILO: Record<EstadoGeneracion, string> = {
  encolado:   'bg-slate-100 text-slate-700 ring-slate-200',
  generando:  'bg-amber-50 text-amber-800 ring-amber-200',
  desplegado: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  error:      'bg-rose-50 text-rose-800 ring-rose-200',
}

const PUNTO: Record<EstadoGeneracion, string> = {
  encolado:   'bg-slate-400',
  generando:  'bg-amber-500 late',
  desplegado: 'bg-emerald-500',
  error:      'bg-rose-500',
}

export function EstadoBadge({ estado }: { estado: EstadoGeneracion | null }) {
  if (!estado) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 ring-inset">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        Sin generar
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${ESTILO[estado]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${PUNTO[estado]}`} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  )
}
