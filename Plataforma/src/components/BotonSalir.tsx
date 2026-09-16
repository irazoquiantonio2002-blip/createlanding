'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function BotonSalir({ a }: { a: string }) {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await fetch('/api/logout', { method: 'POST' })
    router.replace(a)
    router.refresh()
  }

  return (
    <button
      onClick={salir}
      disabled={saliendo}
      className="rounded-md px-2 py-1 text-[13px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
    >
      Salir
    </button>
  )
}
