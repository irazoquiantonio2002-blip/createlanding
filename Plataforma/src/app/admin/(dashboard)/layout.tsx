import { BotonSalir } from '@/components/BotonSalir'

export const metadata = { title: 'Admin · Proyectos' }

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2.5 px-5 sm:px-8">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            H
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-slate-900">
            Administración
          </span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            admin
          </span>

          <div className="ml-auto">
            <BotonSalir a="/admin/login" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  )
}
