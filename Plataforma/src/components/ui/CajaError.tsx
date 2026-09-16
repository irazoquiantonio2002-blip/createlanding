export function CajaError({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-rojo-100 bg-rojo-100 px-4 py-3">
      <p className="text-[13px] font-medium text-rojo-700">No se pudo leer Supabase</p>
      <p className="mt-1 text-[13px] text-rojo-700/80">{mensaje}</p>
    </div>
  )
}
