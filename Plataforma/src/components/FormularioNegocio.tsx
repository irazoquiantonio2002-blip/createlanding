'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnalizarAnuncio } from './AnalizarAnuncio'
import { AreaTexto, Campo, ListaDinamica, Seccion, SelectorColor, Texto } from './campos'
import { SubidorImagenes, SubidorLogo } from './subidores'
import type { FormularioNegocio as Datos } from '@/lib/tipos'

const VACIO: Datos = {
  nombre_negocio: '',
  descripcion: '',
  servicios: [''],
  giro: '',
  telefono_whatsapp: '',
  telefonos_adicionales: [''],
  horarios: '',
  ubicaciones: [''],
  instagram_url: '',
  facebook_url: '',
  color_marca: '',
  logo_url: null,
  logo_path: null,
  imagenes: [],
}

export function FormularioNegocio() {
  const router = useRouter()
  const [carpeta] = useState(() => crypto.randomUUID())
  const [d, setD] = useState<Datos>(VACIO)
  const [enviando, setEnviando] = useState<null | 'guardar' | 'generar'>(null)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof Datos>(campo: K, valor: Datos[K]) =>
    setD((previo) => ({ ...previo, [campo]: valor }))

  const enviar = async (accion: 'guardar' | 'generar') => {
    setEnviando(accion)
    setError(null)

    try {
      const alta = await fetch('/api/negocios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      })
      const datos = await alta.json().catch(() => ({}))
      if (!alta.ok) throw new Error(datos.error ?? 'No se pudo guardar el negocio')

      const id = datos.negocio.id as string

      if (accion === 'generar') {
        // Si el disparo falla, el negocio YA quedó guardado. Se manda igual
        // al detalle, donde el error se explica y se puede reintentar, en
        // vez de perder todo lo que se capturó.
        await fetch(`/api/negocios/${id}/generar`, { method: 'POST' }).catch(() => null)
      }

      router.push(`/negocios/${id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal')
      setEnviando(null)
    }
  }

  const listo = d.nombre_negocio.trim() && d.descripcion.trim() &&
    d.telefono_whatsapp.replace(/\D/g, '').length >= 10

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        enviar('generar')
      }}
    >
      <Seccion
        titulo="El negocio"
        descripcion="De aquí salen el título, el copy y el tono de toda la página."
      >
        <Campo etiqueta="Nombre del negocio" obligatorio>
          <Texto
            valor={d.nombre_negocio}
            cambiar={(v) => set('nombre_negocio', v)}
            placeholder="Clínica Dental Sonrisa"
          />
        </Campo>

        <Campo
          etiqueta="Giro"
          ayuda="Ayuda a elegir tipografía, colores y las fotos de relleno."
        >
          <Texto valor={d.giro} cambiar={(v) => set('giro', v)} placeholder="Clínica dental" />
        </Campo>

        <Campo
          etiqueta="Descripción del negocio"
          obligatorio
          ayuda="Entre más concreto, mejor sale el texto de la página. Qué hacen, a quién le sirven, qué los distingue. O súbelo de un flyer del negocio: esa imagen solo se lee, no se guarda."
        >
          <AreaTexto
            valor={d.descripcion}
            cambiar={(v) => set('descripcion', v)}
            filas={5}
            placeholder="Somos una clínica dental en Culiacán con 12 años de experiencia. Atendemos urgencias el mismo día y trabajamos con todas las aseguradoras…"
          />
          <AnalizarAnuncio
            hayTexto={d.descripcion.trim().length > 0}
            onTexto={(v) => set('descripcion', v)}
          />
        </Campo>

        <Campo etiqueta="Servicios" ayuda="Uno por renglón. Salen como tarjetas en la página.">
          <ListaDinamica
            valores={d.servicios}
            cambiar={(v) => set('servicios', v)}
            marcador="Ortodoncia"
            textoAgregar="Agregar servicio"
          />
        </Campo>
      </Seccion>

      <Seccion
        titulo="Marca"
        descripcion="Color, logo e imágenes. Es lo que hace que la página se vea suya y no de plantilla."
      >
        <Campo etiqueta="Color de marca">
          <SelectorColor valor={d.color_marca} cambiar={(v) => set('color_marca', v)} />
        </Campo>

        <Campo etiqueta="Logo">
          <SubidorLogo
            carpeta={carpeta}
            url={d.logo_url}
            cambiar={(v) =>
              setD((p) => ({ ...p, logo_url: v?.url ?? null, logo_path: v?.path ?? null }))
            }
          />
        </Campo>

        <Campo etiqueta="Imágenes del negocio">
          <SubidorImagenes
            carpeta={carpeta}
            imagenes={d.imagenes}
            cambiar={(v) => set('imagenes', v)}
          />
        </Campo>
      </Seccion>

      <Seccion
        titulo="Contacto"
        descripcion="Va en el encabezado, en los botones de WhatsApp y en el pie de la página."
      >
        <Campo
          etiqueta="WhatsApp principal"
          obligatorio
          ayuda="Con lada del país. Es el número de todos los botones de contacto."
        >
          <Texto
            valor={d.telefono_whatsapp}
            cambiar={(v) => set('telefono_whatsapp', v)}
            placeholder="52 667 123 4567"
            inputMode="tel"
          />
        </Campo>

        <Campo etiqueta="Otros teléfonos">
          <ListaDinamica
            valores={d.telefonos_adicionales}
            cambiar={(v) => set('telefonos_adicionales', v)}
            marcador="667 765 4321"
            textoAgregar="Agregar teléfono"
          />
        </Campo>

        <Campo
          etiqueta="Sucursales o direcciones"
          ayuda="Una por renglón. Puede ser la dirección escrita o un enlace de Google Maps."
        >
          <ListaDinamica
            valores={d.ubicaciones}
            cambiar={(v) => set('ubicaciones', v)}
            marcador="Av. Álvaro Obregón 123, Col. Centro, Culiacán"
            textoAgregar="Agregar sucursal"
          />
        </Campo>

        <Campo
          etiqueta="Horarios"
          ayuda="Tal cual se quieren ver en la página. Sin esto la IA se inventa un horario."
        >
          <AreaTexto
            valor={d.horarios}
            cambiar={(v) => set('horarios', v)}
            filas={3}
            placeholder={'Lunes a viernes de 9:00 a 19:00\nSábados de 9:00 a 14:00'}
          />
        </Campo>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Instagram">
            <Texto
              valor={d.instagram_url}
              cambiar={(v) => set('instagram_url', v)}
              placeholder="https://instagram.com/tunegocio"
              type="url"
            />
          </Campo>
          <Campo etiqueta="Facebook">
            <Texto
              valor={d.facebook_url}
              cambiar={(v) => set('facebook_url', v)}
              placeholder="https://facebook.com/tunegocio"
              type="url"
            />
          </Campo>
        </div>
      </Seccion>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-gris-200 bg-white/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        {!listo && (
          <p className="mr-auto text-xs text-gris-500">
            Faltan nombre, descripción y WhatsApp.
          </p>
        )}
        <button
          type="button"
          disabled={!listo || enviando !== null}
          onClick={() => enviar('guardar')}
          className="rounded-lg border border-gris-300 bg-white px-4 py-2.5 text-sm font-medium text-gris-700 transition hover:bg-gris-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando === 'guardar' ? 'Guardando…' : 'Solo guardar'}
        </button>
        <button
          type="submit"
          disabled={!listo || enviando !== null}
          className="rounded-lg bg-gris-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gris-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando === 'generar' ? 'Enviando a n8n…' : 'Generar página web'}
        </button>
      </div>
    </form>
  )
}
