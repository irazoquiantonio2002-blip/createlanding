import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Admin · Proyectos entregados',
}

// Root layout aparte: el admin no comparte el sidebar de "Negocios" ni ningún
// otro cromo de la plataforma. Es su propia superficie, minimalista a propósito.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  )
}
