import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Generador de páginas web',
  description: 'Captura la información del negocio y genera su página web.',
}

// Layout raíz sin cromo: cada área (captura, admin, login) pone el suyo.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
