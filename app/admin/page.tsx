'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { getEffectiveStatus } from '@/lib/types'
import Image from 'next/image'

export default function AdminPage() {
  const router = useRouter()
  const isAdmin = useStore((s) => s.isAdmin)
  const logout = useStore((s) => s.logout)
  const championships = useStore((s) => s.championships)
  const syncToServer = useStore((s) => s.syncToServer)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    if (!isAdmin) router.replace('/admin/login')
  }, [isAdmin, router])

  if (!isAdmin) return null

  function handleLogout() {
    logout()
    router.push('/')
  }

  async function handleSync() {
    setSyncStatus('syncing')
    try {
      await syncToServer()
      setSyncStatus('ok')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown'
      setSyncError(msg)
      setSyncStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={28} height={28} className="object-contain" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#555]">Painel</p>
            <h1 className="text-lg font-black text-white">Administrador</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              className={`rounded-full border px-4 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                syncStatus === 'ok' ? 'border-[#AAFF00]/40 text-[#AAFF00]' :
                syncStatus === 'error' ? 'border-red-500/40 text-red-400' :
                'border-[#1A1A1A] text-[#555] hover:border-[#AAFF00]/40 hover:text-[#AAFF00]'
              }`}
            >
              {syncStatus === 'syncing' ? 'Sincronizando…' :
               syncStatus === 'ok' ? '✓ Sincronizado' :
               syncStatus === 'error' ? 'Erro no sync' :
               'Sincronizar'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-[#1A1A1A] px-4 py-1.5 text-xs text-[#555] transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              Sair
            </button>
          </div>
          {syncStatus === 'error' && syncError && (
            <p className="text-[10px] text-red-400">{syncError}</p>
          )}
        </div>
      </div>

      {/* Main actions */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/criar"
          className="group flex flex-col gap-3 rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-6 transition-all hover:border-[#AAFF00]/40 hover:bg-[#111] focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#AAFF00]/10">
            <span className="text-xl text-[#AAFF00]" aria-hidden="true">+</span>
          </div>
          <div>
            <h2 className="font-bold text-white transition-colors group-hover:text-[#AAFF00]">
              Criar Novo Campeonato
            </h2>
            <p className="mt-1 text-sm text-[#555]">
              Crie o nome, objetivos, conteúdos válidos e regras...
            </p>
          </div>
        </Link>

        <Link
          href="/admin/gerenciar"
          className="group flex flex-col gap-3 rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-6 transition-all hover:border-[#AAFF00]/40 hover:bg-[#111] focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A1A]">
            <span className="text-xl" aria-hidden="true">⚙️</span>
          </div>
          <div>
            <h2 className="font-bold text-white transition-colors group-hover:text-[#AAFF00]">
              Gerenciar Campeonatos
            </h2>
            <p className="mt-1 text-sm text-[#555]">
              Veja os participantes, vídeos, atribua premiações e edite.
            </p>
          </div>
        </Link>
      </div>

      {/* Quick stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
          Visão Geral
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: championships.length },
            { label: 'Ativos', value: championships.filter((c) => getEffectiveStatus(c) === 'active').length },
            { label: 'Em breve', value: championships.filter((c) => getEffectiveStatus(c) === 'upcoming').length },
            { label: 'Encerrados', value: championships.filter((c) => getEffectiveStatus(c) === 'finished').length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-4 text-center"
            >
              <p className="text-2xl font-black tabular-nums text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-[#555]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
