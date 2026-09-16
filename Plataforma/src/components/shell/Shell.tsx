import { BarraLateral, NavMovil, type Area } from './BarraLateral'

export function Shell({ area, children }: { area: Area; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <BarraLateral area={area} />
      <div className="flex min-w-0 flex-1 flex-col">
        <NavMovil area={area} />
        {children}
      </div>
    </div>
  )
}

/** Cabecera de página: título, texto de apoyo y acciones a la derecha. */
export function Cabecera({
  titulo,
  descripcion,
  acciones,
  previo,
}: {
  titulo: string
  descripcion?: string
  acciones?: React.ReactNode
  previo?: React.ReactNode
}) {
  return (
    <div className="border-b border-gris-200 px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {previo}
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-semibold tracking-tight text-gris-950">
              {titulo}
            </h1>
            {descripcion && <p className="mt-0.5 text-[13px] text-gris-600">{descripcion}</p>}
          </div>
        </div>
        {acciones}
      </div>
    </div>
  )
}

export function Contenido({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-gris-50 px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  )
}
