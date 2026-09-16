import { ExternalLink } from 'lucide-react'
import { EstadoBadge } from '@/components/EstadoBadge'
import type { EventoActividad } from '@/lib/datos'

export function ListaActividad({ eventos }: { eventos: EventoActividad[] }) {
  if (eventos.length === 0) {
    return (
      <div className="rounded-xl border border-gris-200 bg-white px-6 py-14 text-center">
        <p className="text-[13px] font-medium text-gris-950">Sin actividad todavía</p>
        <p className="mt-1 text-[13px] text-gris-500">
          Aquí aparece cada intento de generación, con su resultado.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gris-200 bg-white">
      <div className="hidden items-center gap-4 border-b border-gris-200 bg-gris-50 px-4 py-2 text-[11px] font-medium text-gris-500 lg:flex">
        <span className="w-28">Estado</span>
        <span className="flex-1">Negocio</span>
        <span className="w-20 text-right">Duración</span>
        <span className="w-36 text-right">Cuándo</span>
      </div>

      <ul className="divide-y divide-gris-100">
        {eventos.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-gris-50"
          >
            <div className="w-28">
              <EstadoBadge estado={e.estado} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-gris-950">{e.nombre_negocio}</p>
              <p className="truncate text-[12px] text-gris-500">
                {e.error ? (
                  <span className="text-rojo-700">{e.error}</span>
                ) : e.deployment_url ? (
                  <a
                    href={e.deployment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono hover:text-gris-950 hover:underline"
                  >
                    {e.deployment_url.replace(/^https?:\/\//, '')}
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  (e.paso ?? '—')
                )}
              </p>
            </div>

            <span className="w-20 text-right font-mono text-[12px] text-gris-500 tabular-nums">
              {duracion(e.creado_en, e.terminado_en)}
            </span>

            <span className="w-36 text-right text-[12px] text-gris-500">
              {new Date(e.creado_en).toLocaleString('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function duracion(inicio: string, fin: string | null): string {
  if (!fin) return '—'
  const seg = Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 1000)
  if (seg < 60) return `${seg}s`
  return `${Math.floor(seg / 60)}m ${seg % 60}s`
}
