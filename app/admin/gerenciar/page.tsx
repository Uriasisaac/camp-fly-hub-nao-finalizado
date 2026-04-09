'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { getEffectiveStatus } from '@/lib/types'

function formatBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  finished: 'Encerrado',
  upcoming: 'Em breve',
}

export default function GerenciarListPage() {
  const router = useRouter()
  const isAdmin = useStore((s) => s.isAdmin)
  const championships = useStore((s) => s.championships)

  useEffect(() => {
    if (!isAdmin) router.replace('/admin/login')
  }, [isAdmin, router])

  if (!isAdmin) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-[#AAFF00]/25 bg-[#AAFF00]/10 px-3 py-1.5 text-xs font-bold text-[#AAFF00] transition-all hover:bg-[#AAFF00] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
        >
          Voltar
        </button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-black text-pretty text-white">Gerenciar Campeonatos</h1>
          <Link
            href="/admin/criar"
            className="flex-none rounded-full bg-[#AAFF00] px-4 py-2 text-xs font-bold text-black transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            + Novo
          </Link>
        </div>
      </div>

      {championships.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1A1A1A] p-12 text-center">
          <p className="text-[#444]">Nenhum campeonato criado ainda.</p>
          <Link
            href="/admin/criar"
            className="mt-4 inline-block rounded-full bg-[#AAFF00] px-5 py-2 text-sm font-bold text-black"
          >
            Criar primeiro campeonato
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {championships.map((c) => {
            const distributed = c.ranking.reduce((s, r) => s + (r.prize || 0), 0)
            const total = c.mainPositions.reduce((s, p) => s + p.prize, 0) + c.secondaryObjectives.reduce((s, o) => {
              if (!o.type || o.type === 'ranking') return s + (o.positions ?? []).reduce((ps, p) => ps + p.prize, 0)
              return s + (o.prizePerCompletion ?? 0) * (o.maxCompletions ?? 0)
            }, 0)

            return (
              <li key={c.id}>
                <Link
                  href={`/admin/gerenciar/${c.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-4 transition-all hover:border-[#AAFF00]/30 hover:bg-[#111] [touch-action:manipulation]"
                  aria-label={`Gerenciar ${c.name}`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {/* Cover thumbnail */}
                    <div
                      className="flex-none overflow-hidden rounded-lg"
                      style={{ width: 44, aspectRatio: '1080/1400' }}
                    >
                      {c.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.cover} alt="" width={44} height={57} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ background: c.coverGradient || '#111' }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold text-white transition-colors group-hover:text-[#AAFF00]">
                        {c.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#555]">
                        <span
                          className="rounded-full px-2 py-0.5"
                          style={{
                            background: getEffectiveStatus(c) === 'active' ? '#AAFF0015' : '#1A1A1A',
                            color: getEffectiveStatus(c) === 'active' ? '#AAFF00' : '#555',
                          }}
                        >
                          {STATUS_LABEL[getEffectiveStatus(c)]}
                        </span>
                        <span>{c.participants.length} participantes</span>
                        <span>{c.videos.length} vídeos</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-none text-right">
                    <p className="text-sm font-bold tabular-nums text-[#AAFF00]">{formatBRL(total)}</p>
                    <p className="text-xs text-[#444]">
                      {formatBRL(distributed)} dist.
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
