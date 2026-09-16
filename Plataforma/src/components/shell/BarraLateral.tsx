'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Activity,
  HardDrive,
  LayoutGrid,
  LogOut,
  Plus,
  type LucideIcon,
} from 'lucide-react'

type Item = { href: string; etiqueta: string; icono: LucideIcon; exacto?: boolean }

// La navegación vive del lado del cliente porque los iconos son componentes y
// no cruzan la frontera servidor→cliente como props.
const NAV: Record<Area, Item[]> = {
  admin: [
    { href: '/admin', etiqueta: 'Proyectos', icono: LayoutGrid, exacto: true },
    { href: '/admin/actividad', etiqueta: 'Actividad', icono: Activity },
    { href: '/admin/almacenamiento', etiqueta: 'Almacenamiento', icono: HardDrive },
  ],
  dev: [
    { href: '/', etiqueta: 'Negocios', icono: LayoutGrid, exacto: true },
    { href: '/negocios/nuevo', etiqueta: 'Nuevo negocio', icono: Plus },
    { href: '/actividad', etiqueta: 'Actividad', icono: Activity },
  ],
}

export type Area = 'admin' | 'dev'

export function BarraLateral({ area }: { area: Area }) {
  const pathname = usePathname()
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await fetch('/api/logout', { method: 'POST' })
    router.replace(area === 'admin' ? '/admin/login' : '/login')
    router.refresh()
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gris-200 bg-gris-50 lg:flex">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gris-950 text-xs font-bold text-white">
          H
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-gris-950">Agencia Hello</p>
          <p className="truncate text-[11px] text-gris-500">
            {area === 'admin' ? 'Administración' : 'Desarrollo'}
          </p>
        </div>
        <span className="rounded border border-gris-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gris-600">
          {area}
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {NAV[area].map((i) => {
          const activo = i.exacto ? pathname === i.href : pathname.startsWith(i.href)
          const Icono = i.icono
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={activo ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition ${
                activo
                  ? 'bg-white font-medium text-gris-950 shadow-[0_0_0_1px_rgba(0,0,0,.06)]'
                  : 'text-gris-600 hover:bg-white/70 hover:text-gris-950'
              }`}
            >
              <Icono size={15} strokeWidth={2} className={activo ? '' : 'text-gris-500'} />
              {i.etiqueta}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-gris-200 p-2">
        <button
          onClick={salir}
          disabled={saliendo}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-gris-600 transition hover:bg-white hover:text-gris-950 disabled:opacity-40"
        >
          <LogOut size={15} strokeWidth={2} className="text-gris-500" />
          {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}

/** En pantallas chicas la navegación se vuelve una tira horizontal arriba. */
export function NavMovil({ area }: { area: Area }) {
  const pathname = usePathname()
  const router = useRouter()

  async function salir() {
    await fetch('/api/logout', { method: 'POST' })
    router.replace(area === 'admin' ? '/admin/login' : '/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 border-b border-gris-200 bg-gris-50 px-3 py-2 lg:hidden">
      <span className="mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gris-950 text-[10px] font-bold text-white">
        H
      </span>
      <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {NAV[area].map((i) => {
          const activo = i.exacto ? pathname === i.href : pathname.startsWith(i.href)
          const Icono = i.icono
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition ${
                activo ? 'bg-white font-medium text-gris-950' : 'text-gris-600'
              }`}
            >
              <Icono size={13} strokeWidth={2} />
              {i.etiqueta}
            </Link>
          )
        })}
      </nav>
      <button onClick={salir} className="shrink-0 rounded-md p-1.5 text-gris-500 hover:text-gris-950">
        <LogOut size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
