'use client'

import { useId } from 'react'

// ============================================================
//  Piezas sueltas del formulario. Viven aparte para que
//  FormularioNegocio se lea como lo que es: la lista de datos que
//  necesita la página, no un muro de clases de Tailwind.
// ============================================================

const ENTRADA =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20 focus:outline-none'

export function Campo({
  etiqueta,
  ayuda,
  obligatorio,
  children,
}: {
  etiqueta: string
  ayuda?: string
  obligatorio?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-800">
        {etiqueta}
        {obligatorio && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {ayuda && <span className="mt-1.5 block text-xs text-slate-500">{ayuda}</span>}
    </label>
  )
}

export function Texto({
  valor,
  cambiar,
  ...resto
}: {
  valor: string
  cambiar: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...resto}
      className={ENTRADA}
      value={valor}
      onChange={(e) => cambiar(e.target.value)}
    />
  )
}

export function AreaTexto({
  valor,
  cambiar,
  filas = 4,
  ...resto
}: {
  valor: string
  cambiar: (v: string) => void
  filas?: number
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'>) {
  return (
    <textarea
      {...resto}
      rows={filas}
      className={`${ENTRADA} resize-y`}
      value={valor}
      onChange={(e) => cambiar(e.target.value)}
    />
  )
}

/**
 * Lista de renglones que crece sola. Se usa para servicios, teléfonos
 * y sucursales: son cosas de las que el negocio puede tener una o siete,
 * y obligarlos a un solo campo con comas mezclaba direcciones enteras.
 */
export function ListaDinamica({
  valores,
  cambiar,
  marcador,
  textoAgregar,
}: {
  valores: string[]
  cambiar: (v: string[]) => void
  marcador: string
  textoAgregar: string
}) {
  const filas = valores.length ? valores : ['']

  const editar = (i: number, v: string) => {
    const copia = [...filas]
    copia[i] = v
    cambiar(copia)
  }

  const quitar = (i: number) => cambiar(filas.filter((_, j) => j !== i))

  return (
    <div className="space-y-2">
      {filas.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={ENTRADA}
            value={v}
            placeholder={marcador}
            onChange={(e) => editar(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => quitar(i)}
            disabled={filas.length === 1 && !v}
            aria-label="Quitar este renglón"
            className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => cambiar([...filas, ''])}
        className="text-sm font-medium text-marca-600 transition hover:text-marca-700"
      >
        + {textoAgregar}
      </button>
    </div>
  )
}

/**
 * El color es opcional a propósito. Si se deja en automático, el workflow
 * mira el logo y deduce el color dominante de la marca; si se fija aquí,
 * ese análisis se salta y de este color sale toda la paleta.
 */
export function SelectorColor({
  valor,
  cambiar,
}: {
  valor: string
  cambiar: (v: string) => void
}) {
  const id = useId()
  const automatico = !valor

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Opcion activa={automatico} alPulsar={() => cambiar('')}>
          Lo deduce la IA del logo
        </Opcion>
        <Opcion activa={!automatico} alPulsar={() => cambiar(valor || '#4f46e5')}>
          Lo defino yo
        </Opcion>
      </div>

      {!automatico && (
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(valor) ? valor : '#4f46e5'}
            onChange={(e) => cambiar(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
          />
          <input
            className={`${ENTRADA} max-w-[10rem] font-mono`}
            value={valor}
            placeholder="#4f46e5"
            onChange={(e) => cambiar(e.target.value)}
          />
          <span className="text-xs text-slate-500">
            De este color sale la paleta completa de la página.
          </span>
        </div>
      )}
    </div>
  )
}

function Opcion({
  activa,
  alPulsar,
  children,
}: {
  activa: boolean
  alPulsar: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={alPulsar}
      className={
        'rounded-lg border px-3 py-2 text-sm font-medium transition ' +
        (activa
          ? 'border-marca-500 bg-marca-50 text-marca-700'
          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50')
      }
    >
      {children}
    </button>
  )
}

export function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}
