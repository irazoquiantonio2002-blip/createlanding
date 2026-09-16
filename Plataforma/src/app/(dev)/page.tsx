import Link from 'next/link'
import { CircleCheck, CircleDashed, Loader, Plus, TriangleAlert } from 'lucide-react'
import { Cabecera, Contenido } from '@/components/shell/Shell'
import { CajaError } from '@/components/ui/CajaError'
import { Metrica, Metricas } from '@/components/ui/Metrica'
import { TablaProyectos } from '@/components/TablaProyectos'
import { cargarResumen } from '@/lib/datos'

export const dynamic = 'force-dynamic'

export default async function PaginaNegocios() {
  const r = await cargarResumen()

  return (
    <>
      <Cabecera
        titulo="Negocios"
        descripcion="Captura la información de un negocio y genera su página web."
        acciones={
          <Link
            href="/negocios/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gris-950 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-gris-800"
          >
            <Plus size={14} />
            Nuevo negocio
          </Link>
        }
      />

      <Contenido>
        {r.error ? (
          <CajaError mensaje={r.error} />
        ) : (
          <>
            <div className="mb-5">
              <Metricas>
                <Metrica valor={r.total} etiqueta="Negocios" icono={CircleDashed} />
                <Metrica
                  valor={r.publicadas}
                  etiqueta="Publicadas"
                  icono={CircleCheck}
                  tono="verde"
                />
                <Metrica valor={r.enCurso} etiqueta="En curso" icono={Loader} tono="ambar" />
                <Metrica
                  valor={r.conError}
                  etiqueta="Con error"
                  icono={TriangleAlert}
                  tono={r.conError > 0 ? 'rojo' : 'neutro'}
                />
              </Metricas>
            </div>

            <TablaProyectos filas={r.filas} modo="dev" />
          </>
        )}
      </Contenido>
    </>
  )
}
