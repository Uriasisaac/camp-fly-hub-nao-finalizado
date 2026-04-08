'use client'
import { use } from 'react'
import { useStore } from '@/lib/store'
import { getRuleText, getRuleUrl, getEffectiveMainRanking, getEffectiveSecondaryRanking, computeDirectRanking, buildSubjectiveRanking } from '@/lib/types'
import ProgressBar from '@/components/ProgressBar'
import RankingTable from '@/components/RankingTable'
import Link from 'next/link'
import Image from 'next/image'

function getDayStats(startDate: string, endDate: string) {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T23:59:59')
  const now = new Date()
  const total = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const passed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  return { total, passed: Math.min(passed, total) }
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso + 'T12:00:00'))
}

export default function ChampionshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const championship = useStore((s) => s.championships.find((c) => c.id === id))

  if (!championship) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[#444]">Campeonato não encontrado.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#AAFF00]/25 bg-[#AAFF00]/10 px-3 py-1.5 text-xs font-bold text-[#AAFF00] transition-all hover:bg-[#AAFF00] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const { total: totalDays, passed: daysPassed } = getDayStats(championship.startDate, championship.endDate)
  const daysLeft = totalDays - daysPassed
  const grandTotal =
    championship.mainPositions.reduce((s, p) => s + p.prize, 0) +
    championship.secondaryObjectives.reduce((s, obj) => {
      if (obj.type === 'completion') return s + (obj.prizePerCompletion ?? 0) * (obj.maxCompletions ?? 0)
      return s + (obj.positions ?? []).reduce((ps, p) => ps + p.prize, 0)
    }, 0)

  const effectiveMainRanking = getEffectiveMainRanking(championship)
  const distributedPrize =
    effectiveMainRanking.reduce((s, r) => s + (r.prize ?? 0), 0) +
    championship.secondaryObjectives.reduce((s, obj) => {
      if (obj.type === 'completion') return s + (obj.completions ?? []).length * (obj.prizePerCompletion ?? 0)
      if (obj.type === 'direct') {
        const r = getEffectiveSecondaryRanking(obj, championship)
        return s + r.reduce((ps, e) => ps + (e.prize ?? 0), 0)
      }
      return s + (obj.positions ?? []).filter((p) => p.winnerId).reduce((ps, p) => ps + p.prize, 0)
    }, 0)

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center justify-center rounded-lg border border-[#AAFF00]/40 px-4 py-1.5 text-sm font-bold text-[#AAFF00] transition-all hover:bg-[#AAFF00]/10"
      >
        Voltar
      </Link>

      {/* Header */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-[#1A1A1A]">
        {/* Cover image — internal banner 1920×600 */}
        <div className="relative w-full" style={{ aspectRatio: '16/5', minHeight: 120 }}>
          {(championship.coverInternal || championship.cover) ? (
            <Image
              src={championship.coverInternal || championship.cover!}
              alt={championship.name}
              fill
              className="object-cover object-center"
              priority
              fetchPriority="high"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: championship.coverGradient || 'linear-gradient(160deg, #111 0%, #000 100%)' }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(rgba(170,255,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(170,255,0,0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent" />
        </div>

        {/* Info */}
        <div className="bg-[#0D0D0D] p-5 sm:p-6">
          <div>
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black text-white sm:text-2xl">{championship.name}</h1>
                <p className="mt-1 text-xs text-[#555]">
                  {formatDate(championship.startDate)} → {formatDate(championship.endDate)}
                </p>
              </div>
              <div className="flex-none text-right">
                <p className="text-xs text-[#555]">Premiação total</p>
                <p className="text-xl font-black text-[#AAFF00]">{formatBRL(grandTotal)}</p>
              </div>
            </div>
            {championship.description && (
              <p className="mt-3 text-sm leading-relaxed text-[#777]">{championship.description}</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#1A1A1A] px-3 py-1 text-xs text-[#888]">
              {championship.participants.length} participantes
            </span>
            {daysLeft > 0 ? (
              <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 text-xs font-bold text-[#AAFF00]">
                {daysLeft} dias restantes
              </span>
            ) : (
              <span className="rounded-full bg-[#1A1A1A] px-3 py-1 text-xs text-[#555]">
                Encerrado
              </span>
            )}
            {championship.rankingDate && (
              <span className="rounded-full bg-[#1A1A1A] px-3 py-1 text-xs text-[#888]">
                Ranking final: {formatDate(championship.rankingDate)}
              </span>
            )}
            {championship.paymentDeadline && (
              <span className="rounded-full bg-[#1A1A1A] px-3 py-1 text-xs text-[#888]">
                Pagamento até: {formatDate(championship.paymentDeadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <section
        aria-labelledby="progresso-heading"
        className="mb-8 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-5"
      >
        <h2 id="progresso-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
          Progresso
        </h2>
        <div className="flex flex-col gap-4">
          <ProgressBar
            label="Dias do campeonato"
            value={daysPassed}
            max={totalDays}
            formatValue={(v) => `${v} dias`}
            formatMax={(v) => `${v} dias`}
          />
          <ProgressBar
            label="Premiação distribuída"
            value={distributedPrize}
            max={grandTotal}
            color="#AAFF00"
            formatValue={(v) => formatBRL(v)}
            formatMax={(v) => formatBRL(v)}
          />
        </div>
      </section>

      {/* Objetivo Principal */}
      {championship.mainPositions.length > 0 && (
        <section
          aria-labelledby="main-obj-heading"
          className="mb-4 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-5"
        >
          <h2 id="main-obj-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
            Objetivo {championship.mainObjectiveDescription || 'Principal'}
          </h2>
          <RankingTable championship={championship} />
        </section>
      )}

      {/* Objetivos Secundários — cada um em card separado */}
      {championship.secondaryObjectives.map((obj) => (
        <section
          key={obj.id}
          aria-labelledby={`obj-${obj.id}-heading`}
          className="mb-4 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-5"
        >
          <h2 id={`obj-${obj.id}-heading`} className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
            Objetivo {obj.description}
          </h2>
          {obj.details && (
            <p className="mb-3 text-xs leading-relaxed text-[#555]">{obj.details}</p>
          )}

          {/* Direct type: auto-computed or manual override ranking */}
          {obj.type === 'direct' && obj.metric && (() => {
            const ranking = getEffectiveSecondaryRanking(obj, championship)
            return (
              <div className="flex flex-col gap-2">
                {(obj.positions ?? []).map((pos) => {
                  const entry = ranking.find((r) => r.position === pos.place)
                  const participant = entry ? championship.participants.find((p) => p.id === entry.participantId) : null
                  const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                  return (
                    <div key={pos.place} className="flex items-center gap-3 rounded-lg bg-[#111] px-4 py-2.5">
                      <span className="text-base" aria-label={`${pos.place}º lugar`}>{medal}</span>
                      <span className="flex-1 text-sm text-[#888]">
                        {participant ? participant.name : <span className="text-[#333]">A definir</span>}
                      </span>
                      {entry && <span className="text-xs tabular-nums text-[#555]">{formatViews(entry.views)}</span>}
                      <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 text-xs font-bold tabular-nums text-[#AAFF00]">
                        {formatBRL(pos.prize)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* Subjective/Manual type: direct winner per position */}
          {obj.type === 'subjective' && (
            <div className="flex flex-col gap-2">
              {(obj.positions ?? []).map((pos) => {
                const winner = championship.participants.find((p) => p.id === pos.winnerId)
                const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                return (
                  <div key={pos.place} className="flex items-center gap-3 rounded-lg bg-[#111] px-4 py-2.5">
                    <span className="text-base" aria-label={`${pos.place}º lugar`}>{medal}</span>
                    <span className="flex-1 text-sm text-[#888]">
                      {winner ? winner.name : <span className="text-[#333]">A definir</span>}
                    </span>
                    <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 text-xs font-bold tabular-nums text-[#AAFF00]">
                      {formatBRL(pos.prize)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legacy ranking type: position-by-position */}
          {(!obj.type || obj.type === 'ranking') && (
            <div className="flex flex-col gap-2">
              {(obj.positions ?? []).map((pos) => {
                const winner = championship.participants.find((p) => p.id === pos.winnerId)
                const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                return (
                  <div key={pos.place} className="flex items-center gap-3 rounded-lg bg-[#111] px-4 py-2.5">
                    <span className="text-base" aria-label={`${pos.place}º lugar`}>{medal}</span>
                    <span className="flex-1 text-sm text-[#888]">
                      {winner ? winner.name : <span className="text-[#333]">A definir</span>}
                    </span>
                    <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 text-xs font-bold tabular-nums text-[#AAFF00]">
                      {formatBRL(pos.prize)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Completion type */}
          {obj.type === 'completion' && (() => {
            const completions = obj.completions ?? []
            const max = obj.maxCompletions ?? 0
            const prizeEach = obj.prizePerCompletion ?? 0
            const grouped = championship.participants
              .map((p) => ({ participant: p, count: completions.filter((c) => c.participantId === p.id).length }))
              .filter((g) => g.count > 0)
            return (
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 text-xs font-bold text-[#AAFF00]">
                    {formatBRL(prizeEach)} por conclusão
                  </span>
                  <span className="rounded-full bg-[#1A1A1A] px-3 py-1 text-xs text-[#888]">
                    {completions.length} / {max} conclusões
                  </span>
                </div>
                {grouped.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {grouped.map(({ participant, count }) => (
                      <div key={participant.id} className="flex items-center gap-3 rounded-lg bg-[#111] px-4 py-2.5">
                        <span className="flex-1 text-sm text-[#888]">{participant.name}</span>
                        <span className="text-xs text-[#555]">{count}×</span>
                        <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 text-xs font-bold tabular-nums text-[#AAFF00]">
                          {formatBRL(prizeEach * count)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#333]">Nenhuma conclusão atribuída ainda.</p>
                )}
              </div>
            )
          })()}
        </section>
      ))}

      {/* Valid Content */}
      {championship.validContent.length > 0 && (
        <section
          aria-labelledby="conteudos-heading"
          className="mb-8 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-5"
        >
          <h2 id="conteudos-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
            Conteúdos Válidos
          </h2>
          <ol className="flex flex-col gap-2">
            {championship.validContent.map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-[#111] px-4 py-3">
                <span className="mt-0.5 w-6 flex-none text-center text-xs font-bold tabular-nums text-[#444]">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  {item.title && <span className="text-sm leading-relaxed text-[#888]">{item.title}</span>}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-[#AAFF00]/70 transition-colors hover:text-[#AAFF00] truncate"
                    >
                      <span aria-hidden="true">↗</span>
                      <span className="truncate">{item.url}</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Rules */}
      <section
        aria-labelledby="regras-heading"
        className="mb-8 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-5"
      >
        <h2 id="regras-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
          Regras
        </h2>
        <ol className="flex flex-col gap-2">
          {championship.rules.map((rule, i) => {
            const text = getRuleText(rule)
            const url = getRuleUrl(rule)
            return (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-[#111] px-4 py-3">
                <span className="mt-0.5 w-6 flex-none text-center text-xs font-bold tabular-nums text-[#444]">
                  {i + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm leading-relaxed text-[#777]">{text}</span>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-[#AAFF00]/70 transition-colors hover:text-[#AAFF00] truncate"
                    >
                      <span aria-hidden="true">↗</span>
                      <span className="truncate">{url}</span>
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        {championship.paymentInfo && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#444] mb-3">Informações sobre o Pagamento</p>
            <div className="flex flex-col gap-3">
              {championship.paymentInfo.split('\n\n').filter(Boolean).map((block, i) => (
                <div key={i} className="rounded-lg bg-[#111] px-4 py-3 text-sm leading-relaxed text-[#777]">
                  {block.trim()}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </article>
  )
}
