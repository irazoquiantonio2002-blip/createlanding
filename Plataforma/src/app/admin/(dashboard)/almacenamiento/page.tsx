import { Files, FolderOpen, HardDrive, TriangleAlert } from 'lucide-react'
import { Cabecera, Contenido } from '@/components/shell/Shell'
import { Metrica, Metricas } from '@/components/ui/Metrica'
import { cargarAlmacenamiento } from '@/lib/datos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Almacenamiento · Admin' }

export default async function PaginaAlmacenamiento() {
  const { carpetas, totalBytes, totalArchivos, bytesHuerfanos } = await cargarAlmacenamiento()
  const mayor = Math.max(1, ...carpetas.map((c) => c.bytes))
  const huerfanas = carpetas.filter((c) => c.huerfana).length

  return (
    <>
      <Cabecera
        titulo="Almacenamiento"
        descripcion="Logos e imágenes que subió cada negocio al bucket de Supabase."
      />

      <Contenido>
        <div className="mb-5">
          <Metricas>
            <Metrica valor={peso(totalBytes)} etiqueta="Espacio usado" icono={HardDrive} />
            <Metrica valor={totalArchivos} etiqueta="Archivos" icono={Files} />
            <Metrica valor={carpetas.length} etiqueta="Carpetas" icono={FolderOpen} />
            <Metrica
              valor={peso(bytesHuerfanos)}
              etiqueta="Sin negocio"
              icono={TriangleAlert}
              tono={huerfanas > 0 ? 'ambar' : 'neutro'}
              pie={huerfanas > 0 ? `${huerfanas} carpeta(s) de borradores` : 'Nada suelto'}
            />
          </Metricas>
        </div>

        <div className="overflow-hidden rounded-xl border border-gris-200 bg-white">
          <div className="hidden items-center gap-4 border-b border-gris-200 bg-gris-50 px-4 py-2 text-[11px] font-medium text-gris-500 lg:flex">
            <span className="flex-1">Negocio</span>
            <span className="w-40">Uso</span>
            <span className="w-20 text-right">Archivos</span>
            <span className="w-20 text-right">Peso</span>
          </div>

          {carpetas.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-[13px] font-medium text-gris-950">El bucket está vacío</p>
              <p className="mt-1 text-[13px] text-gris-500">
                Todavía nadie ha subido un logo ni imágenes.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gris-100">
              {carpetas.map((c) => (
                <li
                  key={c.carpeta}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-gris-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[13px] font-medium text-gris-950">
                      {c.nombre}
                      {c.huerfana && (
                        <span className="rounded border border-ambar-100 bg-ambar-100 px-1.5 py-0.5 text-[10px] font-medium text-ambar-600">
                          borrador
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-[11px] text-gris-500">{c.carpeta}</p>
                  </div>

                  <div className="w-40">
                    <div className="h-1.5 overflow-hidden rounded-full bg-gris-100">
                      <div
                        className={`h-full rounded-full ${c.huerfana ? 'bg-ambar-600' : 'bg-gris-800'}`}
                        style={{ width: `${Math.max(2, (c.bytes / mayor) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <span className="w-20 text-right text-[12px] text-gris-600 tabular-nums">
                    {c.archivos}
                  </span>
                  <span className="w-20 text-right font-mono text-[12px] text-gris-950 tabular-nums">
                    {peso(c.bytes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Contenido>
    </>
  )
}

function peso(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
