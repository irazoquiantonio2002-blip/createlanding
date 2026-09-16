import Link from 'next/link'
import { BotonSalir } from '@/components/BotonSalir'
import { NavLink } from '@/components/NavLink'

export default function LayoutCaptura({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
              H
            </span>
            <span className="text-[13px] font-semibold tracking-tight text-slate-900">
              Generador
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink href="/">Negocios</NavLink>
            <NavLink href="/negocios/nuevo">Nuevo</NavLink>
          </nav>

          <div className="ml-auto">
            <BotonSalir a="/login" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  )
}
