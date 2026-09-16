import { Cabecera, Contenido } from '@/components/shell/Shell'
import { ListaActividad } from '@/components/ListaActividad'
import { cargarActividad } from '@/lib/datos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Actividad' }

export default async function PaginaActividad() {
  const eventos = await cargarActividad()

  return (
    <>
      <Cabecera
        titulo="Actividad"
        descripcion="Cada intento de generación que ha pasado por n8n, del más reciente al más viejo."
      />
      <Contenido>
        <ListaActividad eventos={eventos} />
      </Contenido>
    </>
  )
}
