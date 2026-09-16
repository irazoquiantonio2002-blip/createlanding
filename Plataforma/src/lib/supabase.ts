import { createClient } from '@supabase/supabase-js'

// ============================================================
//  Cliente de Supabase para el SERVIDOR.
//
//  Usa la service role key, que se salta RLS. Por eso este módulo no debe
//  importarse nunca desde un componente de cliente: las tablas `negocios` y
//  `sitio_generaciones` tienen RLS activo y sin políticas permisivas, así que
//  el navegador no puede tocarlas ni con la anon key. Todo pasa por las
//  rutas /api.
// ============================================================

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en .env.local')
if (!serviceKey) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en .env.local')

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const BUCKET = 'negocios'
