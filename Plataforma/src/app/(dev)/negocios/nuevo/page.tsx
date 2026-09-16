import Link from 'next/link'
import { FormularioNegocio } from '@/components/FormularioNegocio'

export const metadata = { title: 'Nuevo negocio' }

export default function Pagina() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-[13px]">
        <Link href="/" className="text-slate-500 transition hover:text-slate-900">
          Negocios
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-900">Nuevo</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Nuevo negocio</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Todo lo que captures aquí es lo que va a salir en la página. Los campos marcados con{' '}
          <span className="text-rose-500">*</span> son los mínimos para poder generarla.
        </p>
      </header>

      <FormularioNegocio />
    </div>
  )
}
