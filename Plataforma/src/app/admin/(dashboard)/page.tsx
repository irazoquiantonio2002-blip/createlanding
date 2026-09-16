import { CircleCheck, CircleDashed, Loader, TriangleAlert } from 'lucide-react'
import { Cabecera, Contenido } from '@/components/shell/Shell'
import { CajaError } from '@/components/ui/CajaError'
import { Metrica, Metricas } from '@/components/ui/Metrica'
import { TablaProyectos } from '@/components/TablaProyectos'
import { cargarResumen } from '@/lib/datos'

export const dynamic = 'force-dynamic'

export default async function PaginaProyectos() {
  const r = await cargarResumen()

  return (
    <>
      <Cabecera
        titulo="Proyectos"
        descripcion="Todos los negocios dados de alta, con su página publicada y su repositorio."
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

            <TablaProyectos filas={r.filas} modo="admin" />
          </>
        )}
      </Contenido>
    </>
  )
}
