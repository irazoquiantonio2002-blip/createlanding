'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaginaLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'No se pudo entrar')
      setCargando(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={enviar} className="w-full max-w-[280px]">
        <div className="mb-10 flex flex-col items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sm font-bold text-slate-950">
            H
          </span>
          <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">Admin</p>
        </div>

        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          placeholder="Contraseña"
          className="w-full border-0 border-b border-slate-800 bg-transparent px-1 py-2.5 text-center text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-slate-400"
        />

        <button
          type="submit"
          disabled={cargando || !password}
          className="mt-6 w-full rounded-md bg-slate-100 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-white disabled:opacity-30"
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>

        {error && <p className="mt-4 text-center text-xs text-rose-400">{error}</p>}
      </form>
    </div>
  )
}
