import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = {
  title: 'Generador de páginas web',
  description: 'Captura la información del negocio y genera su página web.',
}

// Layout raíz sin cromo: cada área (captura, admin, login) pone el suyo.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  )
}
