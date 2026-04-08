'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const login = useStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const userRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const { ok } = await res.json()
      if (ok) {
        login(password)
        // Sync local data to KV immediately after login
        await useStore.getState().syncToServer()
        router.push('/admin')
      } else {
        setError('Usuário ou senha inválidos.')
        setLoading(false)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="" width={48} height={48} className="object-contain" />
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#555]">Acesso Restrito</p>
            <h1 className="mt-1 text-xl font-black text-white">Painel Administrativo</h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-6"
          noValidate
        >
          <div className="mb-4">
            <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-[#888]">
              Usuário
            </label>
            <input
              id="username"
              ref={userRef}
              type="text"
              name="username"
              autoComplete="username"
              spellCheck={false}
              required
              placeholder="seu usuário…"
              className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[#888]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="sua senha…"
              className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#AAFF00] py-3 text-sm font-bold text-black transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
                  aria-hidden="true"
                />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>

          <p className="mt-4 text-center text-xs text-[#333]">
            Acesso restrito ao administrador
          </p>
        </form>
      </div>
    </div>
  )
}
