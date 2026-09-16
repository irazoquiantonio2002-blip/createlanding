'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={salir}
      disabled={saliendo}
      className="text-xs font-medium text-slate-500 transition hover:text-slate-100 disabled:opacity-40"
    >
      Salir
    </button>
  )
}
