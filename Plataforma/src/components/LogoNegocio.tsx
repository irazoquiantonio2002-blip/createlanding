const TAMANOS = {
  sm: 'h-8 w-8 rounded-lg text-[10px]',
  md: 'h-10 w-10 rounded-xl text-xs',
  lg: 'h-14 w-14 rounded-2xl text-base',
}

export function LogoNegocio({
  nombre,
  url,
  color,
  tamano = 'sm',
}: {
  nombre: string
  url: string | null
  color: string | null
  tamano?: keyof typeof TAMANOS
}) {
  const clase = TAMANOS[tamano]

  if (url) {
    return (
      // El logo viene de Storage con tamaño desconocido; next/image obligaría
      // a declarar dimensiones por negocio sin aportar nada aquí.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={`${clase} shrink-0 bg-white object-contain ring-1 ring-slate-200 ring-inset`}
      />
    )
  }

  const iniciales =
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'NN'

  return (
    <span
      className={`${clase} grid shrink-0 place-items-center font-semibold text-white`}
      style={{ background: color ?? '#64748b' }}
    >
      {iniciales}
    </span>
  )
}
