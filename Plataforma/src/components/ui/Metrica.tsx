import type { LucideIcon } from 'lucide-react'

export function Metricas({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
  )
}

export function Metrica({
  valor,
  etiqueta,
  icono: Icono,
  tono = 'neutro',
  pie,
}: {
  valor: number | string
  etiqueta: string
  icono: LucideIcon
  tono?: 'neutro' | 'verde' | 'ambar' | 'rojo'
  pie?: string
}) {
  const tonos = {
    neutro: 'bg-gris-100 text-gris-600',
    verde: 'bg-verde-100 text-verde-700',
    ambar: 'bg-ambar-100 text-ambar-600',
    rojo: 'bg-rojo-100 text-rojo-700',
  }

  return (
    <div className="rounded-xl border border-gris-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-gris-600">{etiqueta}</p>
        <span className={`grid h-6 w-6 place-items-center rounded-md ${tonos[tono]}`}>
          <Icono size={13} strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gris-950 tabular-nums">
        {valor}
      </p>
      {pie && <p className="mt-0.5 text-[11px] text-gris-500">{pie}</p>}
    </div>
  )
}
