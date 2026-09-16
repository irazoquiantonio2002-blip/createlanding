'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Rol } from '@/lib/auth'

export function FormularioLogin({ rol, titulo, nota }: { rol: Rol; titulo: string; nota: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, rol }),
    })

    const body = await res.json().catch(() => null)

    if (!res.ok) {
      setError(body?.error ?? 'No se pudo entrar')
      setPassword('')
      setCargando(false)
      return
    }

    router.replace(body?.destino ?? '/')
    router.refresh()
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-[320px]">
        <div className="mb-9 flex flex-col items-center gap-3.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            H
          </span>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">{titulo}</h1>
            <p className="mt-1 text-[13px] text-slate-500">{nota}</p>
          </div>
        </div>

        <form onSubmit={enviar} className="rounded-xl border border-slate-200 bg-white p-5">
          <label htmlFor="password" className="block text-xs font-medium text-slate-600">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
          />

          <button
            type="submit"
            disabled={cargando || !password}
            className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-30"
          >
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>

          {error && (
            <p role="alert" className="mt-3 text-center text-xs text-rose-600">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
