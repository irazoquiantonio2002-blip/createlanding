import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { sesionActual } from '@/lib/sesion'

// ============================================================
//  POST /api/analizar-anuncio
//
//  Recibe una imagen publicitaria (flyer, lona, post) y devuelve la
//  descripción del negocio que se alcance a leer en ella, para llenar el
//  campo "Descripción del negocio" del formulario.
//
//  La imagen NO se guarda: va del navegador a Claude y se descarta.
// ============================================================

// Claude no lee SVG: solo estos cuatro formatos.
const TIPOS_OK = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type TipoImagen = (typeof TIPOS_OK)[number]

const MAX_BYTES = 5 * 1024 * 1024

const INSTRUCCIONES = `Eres quien captura negocios para una agencia que les arma su página web.

Te paso una imagen publicitaria de un negocio (un flyer, una lona, un post de redes).
Escribe la descripción del negocio con TODO lo que se alcance a leer o deducir de la imagen:
a qué se dedica, qué vende o qué servicios da, a quién le sirve, qué lo distingue, y los datos
de contacto que aparezcan (teléfonos, dirección, horarios, redes sociales, sitio web).

Reglas:
- Escribe en español, en prosa corrida, de 3 a 6 oraciones. Nada de listas ni markdown.
- Solo lo que realmente se vea en la imagen. No inventes servicios, años de experiencia,
  sucursales ni teléfonos: si no está, no lo pongas.
- Copia los teléfonos, direcciones y horarios tal cual aparecen.
- No describas el diseño del anuncio ("fondo rojo", "letras grandes"); describe el negocio.
- Responde únicamente con la descripción, sin preámbulo ni comillas.

Si la imagen no es de un negocio o no se lee nada aprovechable, responde exactamente: SIN_DATOS`

export async function POST(req: Request) {
  if ((await sesionActual()) !== 'dev') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Falta ANTHROPIC_API_KEY en las variables de entorno' },
      { status: 500 },
    )
  }

  const form = await req.formData().catch(() => null)
  const archivo = form?.get('archivo')

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
  }
  if (!TIPOS_OK.includes(archivo.type as TipoImagen)) {
    return NextResponse.json(
      { error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' },
      { status: 400 },
    )
  }
  if (archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: 'La imagen pasa de 5 MB' }, { status: 400 })
  }

  // El cliente se arma aquí y no en el módulo: si se armara arriba y faltara la
  // llave, reventaría al recolectar las rutas durante el build.
  const anthropic = new Anthropic()

  try {
    const respuesta = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4000,
      output_config: { effort: 'medium' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: archivo.type as TipoImagen,
                data: Buffer.from(await archivo.arrayBuffer()).toString('base64'),
              },
            },
            { type: 'text', text: INSTRUCCIONES },
          ],
        },
      ],
    })

    if (respuesta.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: 'Claude no pudo procesar esta imagen. Prueba con otra.' },
        { status: 422 },
      )
    }

    const descripcion = respuesta.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    if (!descripcion || descripcion === 'SIN_DATOS') {
      return NextResponse.json(
        { error: 'No se alcanza a leer información del negocio en esa imagen.' },
        { status: 422 },
      )
    }

    return NextResponse.json({ descripcion })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'La ANTHROPIC_API_KEY no es válida' }, { status: 500 })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones a Claude. Espera unos segundos.' },
        { status: 429 },
      )
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude respondió ${error.status}` }, { status: 502 })
    }
    throw error
  }
}
