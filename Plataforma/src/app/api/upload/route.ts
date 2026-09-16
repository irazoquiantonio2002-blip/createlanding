import { NextResponse } from 'next/server'
import { BUCKET, supabase } from '@/lib/supabase'
import { sesionActual } from '@/lib/sesion'

// ============================================================
//  POST /api/upload
//  Sube un archivo a Supabase Storage y devuelve su URL pública.
//
//  El bucket es público a propósito: n8n baja el logo y las fotos por URL
//  desde otro servidor, sin credenciales de Supabase.
// ============================================================

const TIPOS_OK = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml',
])
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: Request) {
  if ((await sesionActual()) !== 'dev') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Se esperaba multipart/form-data' }, { status: 400 })

  const archivo = form.get('archivo')
  const carpeta = String(form.get('carpeta') ?? '').trim()

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
  }
  if (!/^[a-f0-9-]{36}$/i.test(carpeta)) {
    return NextResponse.json({ error: 'Carpeta inválida' }, { status: 400 })
  }
  if (!TIPOS_OK.has(archivo.type)) {
    return NextResponse.json(
      { error: `Formato no permitido (${archivo.type || 'desconocido'}). Usa PNG, JPG, WEBP, GIF o SVG.` },
      { status: 400 },
    )
  }
  if (archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo pasa de 10 MB' }, { status: 400 })
  }

  // El nombre original puede traer acentos, espacios y hasta barras: si se
  // usara tal cual, Storage crearía subcarpetas o rechazaría la subida.
  const limpio = archivo.name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-60) || 'archivo'
  const ruta = `${carpeta}/${Date.now()}-${limpio}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: `No se pudo subir: ${error.message}` }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
  return NextResponse.json({ url: data.publicUrl, path: ruta, nombre: archivo.name })
}
