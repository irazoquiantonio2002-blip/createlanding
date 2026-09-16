import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Generador de páginas web',
  description: 'Captura la información del negocio y genera su página web.',
}

const NAV = [
  { href: '/', etiqueta: 'Negocios', icono: '▦' },
  { href: '/negocios/nuevo', etiqueta: 'Nuevo negocio', icono: '＋' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside className="flex shrink-0 flex-col gap-1 border-b border-slate-200 bg-white px-4 py-4 lg:w-60 lg:border-b-0 lg:border-r lg:py-6">
            <Link href="/" className="mb-4 flex items-center gap-2 px-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca-600 text-sm font-bold text-white">
                H
              </span>
              <span className="text-sm leading-tight font-semibold text-slate-900">
                Generador
                <span className="block text-xs font-normal text-slate-500">de páginas web</span>
              </span>
            </Link>

            <nav className="flex gap-1 lg:flex-col">
              {NAV.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <span className="text-slate-400">{i.icono}</span>
                  {i.etiqueta}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
