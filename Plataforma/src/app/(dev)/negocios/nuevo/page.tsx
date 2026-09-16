import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Cabecera, Contenido } from '@/components/shell/Shell'
import { FormularioNegocio } from '@/components/FormularioNegocio'

export const metadata = { title: 'Nuevo negocio' }

export default function Pagina() {
  return (
    <>
      <Cabecera
        titulo="Nuevo negocio"
        descripcion="Todo lo que captures aquí es lo que va a salir en la página."
        acciones={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gris-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gris-700 transition hover:bg-gris-50"
          >
            <ArrowLeft size={14} />
            Volver
          </Link>
        }
      />
      <Contenido>
        <div className="mx-auto max-w-3xl">
          <FormularioNegocio />
        </div>
      </Contenido>
    </>
  )
}
