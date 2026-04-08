'use client'
import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { RankingEntry, Video, ValidContentItem, RuleItem, SecondaryObjective, Position, MainObjectiveType, DirectMetric, getRuleText, getRuleUrl, computeDirectRanking, buildManualOverrideRanking, DIRECT_METRIC_LABEL } from '@/lib/types'
import { applyDateMask, completeDateYear, toBRDate, toISODate } from '@/lib/format'
import PrizeInput from '@/components/PrizeInput'

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
function formatBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

const PLATFORM_ICON: Record<string, string> = {
  youtube: '▶️',
  instagram: '📷',
  tiktok: '🎵',
  kwai: '🎬',
}

export default function GerenciarCampeonatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isAdmin = useStore((s) => s.isAdmin)
  const championship = useStore((s) => s.championships.find((c) => c.id === id))
  const updateRanking = useStore((s) => s.updateRanking)
  const updateChampionshipInfo = useStore((s) => s.updateChampionshipInfo)
  const deleteChampionship = useStore((s) => s.deleteChampionship)
  const assignMainPositionWinner = useStore((s) => s.assignMainPositionWinner)
  const assignSecondaryWinner = useStore((s) => s.assignSecondaryWinner)
  const addCompletion = useStore((s) => s.addCompletion)
  const removeCompletion = useStore((s) => s.removeCompletion)
  const addParticipant = useStore((s) => s.addParticipant)
  const removeParticipant = useStore((s) => s.removeParticipant)
  const addVideo = useStore((s) => s.addVideo)
  const setMainVideoReview = useStore((s) => s.setMainVideoReview)
  const setObjVideoReview = useStore((s) => s.setObjVideoReview)
  const removeMainVideoReview = useStore((s) => s.removeMainVideoReview)
  const removeObjVideoReview = useStore((s) => s.removeObjVideoReview)
  const setMainObjectiveManualOverride = useStore((s) => s.setMainObjectiveManualOverride)
  const setSecondaryObjectiveManualOverride = useStore((s) => s.setSecondaryObjectiveManualOverride)
  const updateMainObjectivePeriod = useStore((s) => s.updateMainObjectivePeriod)
  const updateSecondaryObjectivePeriod = useStore((s) => s.updateSecondaryObjectivePeriod)

  const [localRanking, setLocalRanking] = useState<RankingEntry[]>([])
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'participantes' | 'videos' | 'premiacoes' | 'editar'>('participantes')
  const [isDirty, setIsDirty] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrize, setEditPrize] = useState('')
  const [editCoverPreview, setEditCoverPreview] = useState<string>('')
  const [editCover, setEditCover] = useState<string>('')
  const [editCoverInternalPreview, setEditCoverInternalPreview] = useState<string>('')
  const [editCoverInternal, setEditCoverInternal] = useState<string>('')
  const [editSaved, setEditSaved] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'password'>('idle')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editRankingDate, setEditRankingDate] = useState('')
  const [editPaymentDeadline, setEditPaymentDeadline] = useState('')
  const [editPaymentInfo, setEditPaymentInfo] = useState('')
  const [completionSelects, setCompletionSelects] = useState<Record<string, string>>({})
  const [mainPeriodStart, setMainPeriodStart] = useState('')
  const [mainPeriodEnd, setMainPeriodEnd] = useState('')
  const [secPeriodStart, setSecPeriodStart] = useState<Record<string, string>>({})
  const [secPeriodEnd, setSecPeriodEnd] = useState<Record<string, string>>({})
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantHandle, setNewParticipantHandle] = useState('')
  const [editValidContent, setEditValidContent] = useState<ValidContentItem[]>([])
  const [editRules, setEditRules] = useState<RuleItem[]>([])
  const [editMainObjDesc, setEditMainObjDesc] = useState('')
  const [editMainObjType, setEditMainObjType] = useState<MainObjectiveType>('direct')
  const [editMainObjMetric, setEditMainObjMetric] = useState<DirectMetric>('views_totais')
  const [editMainPositions, setEditMainPositions] = useState<Position[]>([])
  const [editSecondaryObjs, setEditSecondaryObjs] = useState<SecondaryObjective[]>([])
  const [editMainObjPeriodStart, setEditMainObjPeriodStart] = useState('')
  const [editMainObjPeriodEnd, setEditMainObjPeriodEnd] = useState('')
  const [editSecObjPeriods, setEditSecObjPeriods] = useState<Record<string, { start: string; end: string }>>({})
  const [reviewedVideoIds, setReviewedVideoIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`reviewed-videos-${id}`)
      if (stored) setReviewedVideoIds(new Set(JSON.parse(stored)))
    } catch {}
  }, [id])

  function markVideoReviewed(videoId: string) {
    setReviewedVideoIds((prev) => {
      const next = new Set(prev)
      next.add(videoId)
      try { localStorage.setItem(`reviewed-videos-${id}`, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  useEffect(() => {
    if (!isAdmin) router.replace('/admin/login')
  }, [isAdmin, router])

  const initedRef = useRef(false)
  useEffect(() => {
    if (championship) {
      setEditName(championship.name)
      setEditDescription(championship.description || '')
      setEditCoverPreview(championship.cover || '')
      setEditCoverInternalPreview(championship.coverInternal || '')
      setEditStartDate(toBRDate(championship.startDate || ''))
      setEditEndDate(toBRDate(championship.endDate || ''))
      setEditRankingDate(toBRDate(championship.rankingDate || ''))
      setEditPaymentDeadline(toBRDate(championship.paymentDeadline || ''))
      setEditPaymentInfo(championship.paymentInfo || '')
      setEditValidContent(championship.validContent.map((v) => ({ ...v })))
      setEditRules(championship.rules.map((r) => ({ text: getRuleText(r), url: getRuleUrl(r) })))
      setEditMainObjDesc(championship.mainObjectiveDescription)
      setEditMainObjType(championship.mainObjectiveType ?? 'direct')
      setEditMainObjMetric(championship.mainObjectiveMetric ?? 'views_totais')
      setEditMainPositions(championship.mainPositions.map((p) => ({ ...p })))
      setEditSecondaryObjs(championship.secondaryObjectives.map((o) => ({ ...o, positions: o.positions?.map((p) => ({ ...p })) })))
      setEditMainObjPeriodStart(toBRDate(championship.mainObjectivePeriodStart || ''))
      setEditMainObjPeriodEnd(toBRDate(championship.mainObjectivePeriodEnd || ''))
      const periods: Record<string, { start: string; end: string }> = {}
      championship.secondaryObjectives.forEach((o) => {
        periods[o.id] = { start: toBRDate(o.periodStart || ''), end: toBRDate(o.periodEnd || '') }
      })
      setEditSecObjPeriods(periods)
      setLocalRanking(championship.ranking.map((r) => ({ ...r })))
      setIsDirty(false)
      setEditCover('')
      setEditCoverInternal('')
      setMainPeriodStart(toBRDate(championship.mainObjectivePeriodStart || ''))
      setMainPeriodEnd(toBRDate(championship.mainObjectivePeriodEnd || ''))
      const starts: Record<string, string> = {}
      const ends: Record<string, string> = {}
      championship.secondaryObjectives.forEach((o) => {
        starts[o.id] = toBRDate(o.periodStart || '')
        ends[o.id] = toBRDate(o.periodEnd || '')
      })
      setSecPeriodStart(starts)
      setSecPeriodEnd(ends)
      initedRef.current = true
    }
  }, [championship?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  if (!isAdmin) return null
  if (!championship) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-[#444]">Campeonato não encontrado.</p>
        <Link href="/admin/gerenciar" className="text-sm text-[#555] hover:text-white">Voltar</Link>
      </div>
    )
  }

  // Add video to ranking
  function addToRanking(video: Video) {
    const participant = championship!.participants.find((p) => p.id === video.participantId)
    if (!participant) return
    const alreadyIn = localRanking.some((r) => r.participantId === video.participantId)
    if (alreadyIn) return
    const nextPos = localRanking.length + 1
    if (nextPos > 20) return
    setLocalRanking((prev) => [
      ...prev,
      { position: nextPos, participantId: video.participantId, views: video.views, adminAssigned: true },
    ])
  }

  function moveUp(index: number) {
    if (index === 0) return
    setLocalRanking((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((r, i) => ({ ...r, position: i + 1 }))
    })
  }

  function moveDown(index: number) {
    if (index >= localRanking.length - 1) return
    setLocalRanking((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((r, i) => ({ ...r, position: i + 1 }))
    })
  }

  function removeFromRanking(index: number) {
    setLocalRanking((prev) =>
      prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, position: i + 1 }))
    )
  }

  function saveRanking() {
    updateRanking(id, localRanking)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function saveEdits() {
    if (!championship) return
    updateChampionshipInfo(id, {
      name: editName.trim() || championship.name,
      description: editDescription.trim() || undefined,
      cover: editCover || championship.cover,
      coverInternal: editCoverInternal || championship.coverInternal,
      startDate: toISODate(editStartDate) || championship.startDate,
      endDate: toISODate(editEndDate) || championship.endDate,
      rankingDate: toISODate(editRankingDate) || undefined,
      paymentDeadline: toISODate(editPaymentDeadline) || undefined,
      paymentInfo: editPaymentInfo.trim() || undefined,
      validContent: editValidContent.filter((v) => v.title.trim() || v.url?.trim()),
      rules: editRules.filter((r) => r.text.trim() || r.url?.trim()).map((r) => ({ text: r.text.trim(), url: r.url?.trim() || undefined })),
      mainObjectiveDescription: editMainObjDesc.trim() || championship.mainObjectiveDescription,
      mainObjectiveType: editMainObjType,
      mainObjectiveMetric: editMainObjType === 'direct' ? editMainObjMetric : undefined,
      mainObjectivePeriodStart: editMainObjType === 'direct' ? (toISODate(editMainObjPeriodStart) || undefined) : undefined,
      mainObjectivePeriodEnd: editMainObjType === 'direct' ? (toISODate(editMainObjPeriodEnd) || undefined) : undefined,
      mainPositions: editMainPositions.filter((p) => p.prize > 0),
      secondaryObjectives: editSecondaryObjs.filter((o) => o.description.trim()).map((editObj) => {
        const current = championship.secondaryObjectives.find((co) => co.id === editObj.id)
        const period = editSecObjPeriods[editObj.id]
        return {
          ...editObj,
          periodStart: editObj.type === 'direct' ? (toISODate(period?.start ?? '') || current?.periodStart) : undefined,
          periodEnd: editObj.type === 'direct' ? (toISODate(period?.end ?? '') || current?.periodEnd) : undefined,
          positions: editObj.positions?.map((ep) => ({
            ...ep,
            winnerId: current?.positions?.find((cp) => cp.place === ep.place)?.winnerId,
          })),
          videoReviews: current?.videoReviews,
          completions: current?.completions,
        }
      }),
    })
    setEditSaved(true)
    setIsDirty(false)
    setTimeout(() => setEditSaved(false), 2000)
  }

  const videosNotInRanking = championship.videos.filter(
    (v) => !localRanking.some((r) => r.participantId === v.participantId)
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => {
            if (isDirty && !window.confirm('Você tem alterações não salvas. Sair sem salvar?')) return
            router.push('/admin/gerenciar')
          }}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-[#AAFF00]/25 bg-[#AAFF00]/10 px-3 py-1.5 text-xs font-bold text-[#AAFF00] transition-all hover:bg-[#AAFF00] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
        >
          Gerenciar
        </button>
        <h1 className="text-xl font-black text-white">{championship.name}</h1>
        <p className="mt-1 text-xs text-[#555]">
          {championship.participants.length} participantes · {championship.videos.length} vídeos
        </p>
      </div>

      {/* Tabs */}
      <div
        className="mb-6 flex gap-1 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-1"
        role="tablist"
        aria-label="Seções do campeonato"
      >
        {([
          { key: 'participantes', label: 'Participantes' },
          { key: 'videos', label: 'Vídeos' },
          { key: 'premiacoes', label: 'Premiações' },
          { key: 'editar', label: 'Editar' },
        ] as { key: typeof activeTab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[#AAFF00] text-black'
                : 'text-[#555] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Participantes */}
      {activeTab === 'participantes' && (
        <div role="tabpanel" aria-label="Participantes">
          {/* Adicionar participante */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const name = newParticipantName.trim()
              const handle = newParticipantHandle.trim()
              if (!name) return
              addParticipant(id, { name, handle: handle || `@${name.toLowerCase().replace(/\s+/g, '')}` })
              setNewParticipantName('')
              setNewParticipantHandle('')
            }}
            className="mb-4 flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              placeholder="Nome do participante…"
              aria-label="Nome do participante"
              autoComplete="off"
              className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
            />
            <input
              type="text"
              value={newParticipantHandle}
              onChange={(e) => setNewParticipantHandle(e.target.value)}
              placeholder="@handle (opcional)"
              aria-label="Handle do participante"
              autoComplete="off"
              className="rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none sm:w-36"
            />
            <button
              type="submit"
              disabled={!newParticipantName.trim()}
              className="rounded-full bg-[#AAFF00] px-4 py-2.5 text-xs font-bold text-black transition-opacity hover:opacity-80 disabled:opacity-30"
            >
              + Adicionar
            </button>
          </form>

          {/* Botão de teste */}
          {championship.participants.length === 0 && (
            <button
              type="button"
              onClick={() => {
                const testParticipants = [
                  { name: 'João Camargo', handle: '@joaocamargo' },
                  { name: 'Felipe Oliveira', handle: '@felipeoliveira' },
                  { name: 'Lucas Mendes', handle: '@lucasmendes' },
                  { name: 'Gabriel Santos', handle: '@gabrielsantos' },
                  { name: 'Matheus Ferreira', handle: '@matheusferreira' },
                  { name: 'Rafael Costa', handle: '@rafaelcosta' },
                  { name: 'Pedro Alves', handle: '@pedroalves' },
                  { name: 'Bruno Lima', handle: '@brunolima' },
                  { name: 'Diego Souza', handle: '@diegosouza' },
                  { name: 'Thiago Rodrigues', handle: '@thiagorodrigues' },
                  { name: 'Ana Silva', handle: '@anasilva' },
                  { name: 'Beatriz Pereira', handle: '@beatrizpereira' },
                  { name: 'Camila Martins', handle: '@camilamartins' },
                  { name: 'Larissa Nunes', handle: '@larissanunes' },
                  { name: 'Juliana Barbosa', handle: '@julianabarbosa' },
                  { name: 'Fernanda Carvalho', handle: '@fernandacarvalho' },
                  { name: 'Mariana Ribeiro', handle: '@marianaribeiro' },
                  { name: 'Letícia Gomes', handle: '@leticiagomes' },
                  { name: 'Aline Machado', handle: '@alinemachado' },
                  { name: 'Priscila Rocha', handle: '@priscilarocha' },
                ]
                testParticipants.forEach((p) => addParticipant(id, p))
              }}
              className="mb-4 w-full rounded-full border border-dashed border-[#AAFF00]/30 py-2.5 text-xs font-medium text-[#AAFF00]/60 transition-colors hover:border-[#AAFF00]/60 hover:text-[#AAFF00]"
            >
              Adicionar 20 participantes de teste
            </button>
          )}

          {/* Lista */}
          <ul className="flex flex-col gap-2" role="list">
            {championship.participants.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-3"
              >
                <span className="w-6 text-center text-xs tabular-nums text-[#444]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-[#555]">{p.handle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeParticipant(id, p.id)}
                  aria-label={`Remover ${p.name}`}
                  className="text-xs text-[#333] transition-colors hover:text-red-400"
                >
                  ×
                </button>
              </li>
            ))}
            {championship.participants.length === 0 && (
              <li className="py-10 text-center text-sm text-[#444]">
                Nenhum participante ainda.
              </li>
            )}
          </ul>
          <div className="mt-6">
            <button
              type="button"
              onClick={saveEdits}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#AAFF00] py-3 text-sm font-bold text-black transition-opacity hover:opacity-80"
            >
              {editSaved ? '✓ Salvo com sucesso' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Videos */}
      {activeTab === 'videos' && (
        <div role="tabpanel" aria-label="Vídeos postados">
          {championship.participants.length === 0 && (
            <p className="mb-4 rounded-xl border border-dashed border-[#555]/30 py-3 text-center text-xs text-[#555]">
              Adicione participantes primeiro antes de gerar vídeos.
            </p>
          )}
          {championship.videos.length === 0 && championship.participants.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const platforms = ['youtube', 'instagram', 'tiktok', 'kwai'] as const
                const platformUrls: Record<string, (handle: string, code: string) => string> = {
                  youtube: (_, c) => `https://youtube.com/watch?v=${c}`,
                  instagram: (h, c) => `https://instagram.com/p/${c}`,
                  tiktok: (h, c) => `https://tiktok.com/${h}/video/${c}`,
                  kwai: (h, c) => `https://kwai.com/u/${c}`,
                }
                const participants = championship.participants
                const startMs = new Date('2026-03-08').getTime()
                const endMs = new Date('2026-04-07').getTime()
                Array.from({ length: 50 }, (_, i) => {
                  const participant = participants[i % participants.length]
                  const platform = platforms[i % platforms.length]
                  const views = Math.floor(Math.random() * (1_000_000 - 10_000 + 1)) + 10_000
                  const postedAt = new Date(startMs + Math.random() * (endMs - startMs)).toISOString().split('T')[0]
                  const code = Math.random().toString(36).slice(2, 13).toUpperCase()
                  const url = platformUrls[platform](participant.handle.replace('@', ''), code)
                  addVideo(id, {
                    participantId: participant.id,
                    title: `Vídeo de teste ${i + 1} — ${participant.name}`,
                    views,
                    postedAt,
                    platform,
                    url,
                  })
                })
              }}
              className="mb-4 w-full rounded-full border border-dashed border-[#AAFF00]/30 py-2.5 text-xs font-medium text-[#AAFF00]/60 transition-colors hover:border-[#AAFF00]/60 hover:text-[#AAFF00]"
            >
              Gerar 50 vídeos de demonstração
            </button>
          )}
          <ul className="flex flex-col gap-2" role="list">
            {championship.videos.map((video) => {
              const participant = championship.participants.find((p) => p.id === video.participantId)
              const dateBR = video.postedAt
                ? video.postedAt.split('-').reverse().join('/')
                : null
              const reviewed = reviewedVideoIds.has(video.id)
              return (
                <li
                  key={video.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${reviewed ? 'border-[#AAFF00]/20 bg-[#AAFF00]/5' : 'border-[#1A1A1A] bg-[#0D0D0D]'}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg" aria-hidden="true">{PLATFORM_ICON[video.platform]}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{video.title}</p>
                      <p className="text-xs text-[#555]">
                        {participant?.name} · {participant?.handle}
                        {dateBR && <span className="ml-2">· {dateBR}</span>}
                      </p>
                      {video.url && (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markVideoReviewed(video.id)}
                          className="mt-0.5 block truncate text-xs text-[#AAFF00]/60 hover:text-[#AAFF00]"
                        >
                          Ver vídeo ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    {reviewed && (
                      <span className="text-xs font-bold text-[#AAFF00]/60">✓ Revisado</span>
                    )}
                    <span className="text-sm font-bold tabular-nums text-[#888]">
                      {formatViews(video.views)}
                    </span>
                  </div>
                </li>
              )
            })}
            {championship.videos.length === 0 && (
              <li className="py-10 text-center text-[#444] text-sm">
                Nenhum vídeo registrado neste campeonato.
              </li>
            )}
          </ul>
          <div className="mt-6">
            <button
              type="button"
              onClick={saveEdits}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#AAFF00] py-3 text-sm font-bold text-black transition-opacity hover:opacity-80"
            >
              {editSaved ? '✓ Salvo com sucesso' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Premiações */}
      {activeTab === 'premiacoes' && (
        <div role="tabpanel" aria-label="Atribuição de premiações">
          {/* Main objective */}
          <section aria-labelledby="main-prizes-heading" className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <h2 id="main-prizes-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
                Objetivo Principal
              </h2>
              {championship.mainObjectiveType === 'direct' && !championship.mainObjectiveManualOverride && (
                <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-0.5 text-xs font-bold text-[#AAFF00]">
                  Automático
                </span>
              )}
              {championship.mainObjectiveType === 'direct' && championship.mainObjectiveManualOverride && (
                <span className="rounded-full bg-[#FFB800]/10 px-2.5 py-0.5 text-xs font-bold text-[#FFB800]">
                  Ajuste Manual
                </span>
              )}
              {championship.mainObjectiveType === 'subjective' && (
                <span className="rounded-full bg-[#FFB800]/10 px-2.5 py-0.5 text-xs font-bold text-[#FFB800]">
                  Revisão manual
                </span>
              )}
              {championship.mainObjectiveType === 'direct' && (
                <button
                  type="button"
                  onClick={() => setMainObjectiveManualOverride(id, !championship.mainObjectiveManualOverride)}
                  className="ml-auto rounded-full border border-[#1A1A1A] px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#FFB800]/40 hover:text-[#FFB800]"
                >
                  {championship.mainObjectiveManualOverride ? 'Usar automático' : 'Ajustes Manuais'}
                </button>
              )}
            </div>
            {championship.mainObjectiveDescription && (
              <p className="mb-4 text-sm font-semibold text-white">{championship.mainObjectiveDescription}</p>
            )}

            {/* Period fields for direct objective */}
            {championship.mainObjectiveType === 'direct' && (
              <div className="mb-4 flex flex-col gap-2">
                <p className="text-xs font-medium text-[#888]">
                  Período de Validade <span className="text-[#444]">(opcional)</span>
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="main-period-start" className="sr-only">Início do período</label>
                    <input
                      id="main-period-start"
                      type="text"
                      inputMode="numeric"
                      value={mainPeriodStart}
                      onChange={(e) => setMainPeriodStart(applyDateMask(e.target.value))}
                      onBlur={() => { const v = completeDateYear(mainPeriodStart); setMainPeriodStart(v); updateMainObjectivePeriod(id, toISODate(v) || undefined, toISODate(mainPeriodEnd) || undefined) }}
                      placeholder="Início dd/mm/aaaa"
                      autoComplete="off"
                      className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="main-period-end" className="sr-only">Fim do período</label>
                    <input
                      id="main-period-end"
                      type="text"
                      inputMode="numeric"
                      value={mainPeriodEnd}
                      onChange={(e) => setMainPeriodEnd(applyDateMask(e.target.value))}
                      onBlur={() => { const v = completeDateYear(mainPeriodEnd); setMainPeriodEnd(v); updateMainObjectivePeriod(id, toISODate(mainPeriodStart) || undefined, toISODate(v) || undefined) }}
                      placeholder="Fim dd/mm/aaaa"
                      autoComplete="off"
                      className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Direct: auto-computed ranking */}
            {championship.mainObjectiveType === 'direct' && championship.mainObjectiveMetric && !championship.mainObjectiveManualOverride && (() => {
              const ranking = computeDirectRanking(championship, championship.mainObjectiveMetric, championship.mainPositions)
              return (
                <div className="flex flex-col gap-2">
                  {ranking.map((entry) => {
                    const p = championship.participants.find((pa) => pa.id === entry.participantId)
                    const pos = championship.mainPositions.find((mp) => mp.place === entry.position)
                    const medal = ['🥇', '🥈', '🥉'][entry.position - 1] ?? `${entry.position}º`
                    return (
                      <div key={entry.participantId} className="flex items-center gap-3 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-3">
                        <span className="w-8 text-center text-base" aria-label={`${entry.position}º lugar`}>{medal}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{p?.name ?? '—'}</p>
                          <p className="text-xs text-[#555]">{p?.handle}</p>
                        </div>
                        <span className="text-xs tabular-nums text-[#888]">{formatViews(entry.views)}</span>
                        {pos && (
                          <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">
                            {formatBRL(pos.prize)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {/* unranked positions */}
                  {championship.mainPositions.slice(ranking.length).map((pos) => {
                    const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                    return (
                      <div key={pos.place} className="flex items-center gap-3 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-3 opacity-40">
                        <span className="w-8 text-center text-base">{medal}</span>
                        <p className="flex-1 text-sm text-[#444]">Sem participante</p>
                        <span className="rounded-full bg-[#1A1A1A] px-2.5 py-1 text-xs font-bold text-[#555]">
                          {formatBRL(pos.prize)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Direct: manual override */}
            {championship.mainObjectiveType === 'direct' && championship.mainObjectiveManualOverride && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#FFB800]/70">Atribuindo posições manualmente — o cálculo automático será ignorado para estas posições.</p>
                {championship.mainPositions.map((pos) => {
                  const winner = championship.participants.find((p) => p.id === pos.winnerId)
                  const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                  return (
                    <div key={pos.place} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#FFB800]/20 bg-[#0D0D0D] p-3">
                      <span className="text-base" aria-label={`${pos.place}º lugar`}>{medal}</span>
                      <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">{formatBRL(pos.prize)}</span>
                      {winner && <span className="text-xs text-[#AAFF00]">{winner.name}</span>}
                      <div className="w-full sm:ml-auto sm:w-auto">
                        <label htmlFor={`main-override-${pos.place}`} className="sr-only">Vencedor do {pos.place}º lugar</label>
                        <select
                          id={`main-override-${pos.place}`}
                          value={pos.winnerId || ''}
                          onChange={(e) => assignMainPositionWinner(id, pos.place, e.target.value)}
                          className="w-full rounded-lg border border-[#FFB800]/30 bg-[#111] px-3 py-2 text-sm text-white transition-colors focus-visible:border-[#FFB800] focus-visible:outline-none sm:w-56"
                          style={{ backgroundColor: '#111', color: '#fff' }}
                        >
                          <option value="">Selecionar participante…</option>
                          {championship.participants.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.handle})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
                {championship.mainPositions.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#444]">Nenhuma posição definida.</p>
                )}
              </div>
            )}

            {/* Subjective: video review list */}
            {championship.mainObjectiveType === 'subjective' && (() => {
              const reviews = championship.mainVideoReviews ?? []
              return (
                <div className="flex flex-col gap-2">
                  {championship.videos.map((video) => {
                    const p = championship.participants.find((pa) => pa.id === video.participantId)
                    const review = reviews.find((r) => r.videoId === video.id)
                    const currentPlace = review?.place ?? null
                    return (
                      <div key={video.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-3">
                        <span className="text-lg" aria-hidden="true">{PLATFORM_ICON[video.platform]}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{video.title}</p>
                          <p className="text-xs text-[#555]">{p?.name} · {p?.handle}</p>
                        </div>
                        {video.url && (
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-[#1A1A1A] px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
                          >
                            Abrir ↗
                          </a>
                        )}
                        <div>
                          <label htmlFor={`main-review-${video.id}`} className="sr-only">
                            Posição do vídeo {video.title}
                          </label>
                          <select
                            id={`main-review-${video.id}`}
                            value={currentPlace ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              if (!val) {
                                removeMainVideoReview(id, video.id)
                              } else {
                                setMainVideoReview(id, { videoId: video.id, participantId: video.participantId, place: Number(val) })
                              }
                            }}
                            className="rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                            style={{ backgroundColor: '#111', color: '#fff' }}
                          >
                            <option value="">— Sem posição</option>
                            {Array.from({ length: Math.max(championship.mainPositions.length, 3) }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}º lugar</option>
                            ))}
                          </select>
                        </div>
                        {currentPlace && (() => {
                          const pos = championship.mainPositions.find((p) => p.place === currentPlace)
                          return pos ? (
                            <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">
                              {formatBRL(pos.prize)}
                            </span>
                          ) : null
                        })()}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Manual: position-by-position selector */}
            {(!championship.mainObjectiveType || championship.mainObjectiveType === 'manual') && (
              <div className="flex flex-col gap-3">
                {championship.mainPositions.map((pos) => {
                  const winner = championship.participants.find((p) => p.id === pos.winnerId)
                  const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                  return (
                    <div key={pos.place} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-3">
                      <span className="text-base" aria-label={`${pos.place}º lugar`}>{medal}</span>
                      <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">
                        {formatBRL(pos.prize)}
                      </span>
                      {winner && <span className="text-xs text-[#AAFF00]">{winner.name}</span>}
                      <div className="w-full sm:ml-auto sm:w-auto">
                        <label htmlFor={`main-pos-${pos.place}`} className="sr-only">
                          Vencedor do {pos.place}º lugar
                        </label>
                        <select
                          id={`main-pos-${pos.place}`}
                          value={pos.winnerId || ''}
                          onChange={(e) => assignMainPositionWinner(id, pos.place, e.target.value)}
                          className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none sm:w-56"
                          style={{ backgroundColor: '#111', color: '#fff' }}
                        >
                          <option value="">Selecionar vencedor…</option>
                          {championship.participants.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.handle})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
                {championship.mainPositions.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#444]">Nenhuma posição definida.</p>
                )}
              </div>
            )}
          </section>

          {/* Secondary objectives */}
          {championship.secondaryObjectives.length > 0 && (
            <section aria-labelledby="sec-prizes-heading">
              <h2 id="sec-prizes-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
                Objetivos Secundários
              </h2>
              <ul className="flex flex-col gap-4" role="list">
                {championship.secondaryObjectives.map((obj) => (
                  <li key={obj.id} className="rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-4">
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{obj.description}</p>
                      {obj.type === 'direct' && !obj.manualOverride && (
                        <span className="rounded-full bg-[#AAFF00]/10 px-2 py-0.5 text-xs font-bold text-[#AAFF00]">Automático</span>
                      )}
                      {obj.type === 'direct' && obj.manualOverride && (
                        <span className="rounded-full bg-[#FFB800]/10 px-2 py-0.5 text-xs font-bold text-[#FFB800]">Ajuste Manual</span>
                      )}
                      {obj.type === 'subjective' && (
                        <span className="rounded-full bg-[#FFB800]/10 px-2 py-0.5 text-xs font-bold text-[#FFB800]">Revisão manual</span>
                      )}
                      {obj.type === 'direct' && (
                        <button
                          type="button"
                          onClick={() => setSecondaryObjectiveManualOverride(id, obj.id, !obj.manualOverride)}
                          className="ml-auto rounded-full border border-[#1A1A1A] px-2.5 py-0.5 text-xs text-[#555] transition-colors hover:border-[#FFB800]/40 hover:text-[#FFB800]"
                        >
                          {obj.manualOverride ? 'Usar automático' : 'Ajustes Manuais'}
                        </button>
                      )}
                    </div>
                    {obj.details && (
                      <p className="mb-4 text-xs leading-relaxed text-[#555]">{obj.details}</p>
                    )}

                    {/* Period fields for direct secondary objective */}
                    {obj.type === 'direct' && (
                      <div className="mb-4 flex flex-col gap-2">
                        <p className="text-xs font-medium text-[#888]">
                          Período de Validade <span className="text-[#444]">(opcional)</span>
                        </p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label htmlFor={`sec-ps-${obj.id}`} className="sr-only">Início do período</label>
                            <input
                              id={`sec-ps-${obj.id}`}
                              type="text"
                              inputMode="numeric"
                              value={secPeriodStart[obj.id] ?? ''}
                              onChange={(e) => setSecPeriodStart((prev) => ({ ...prev, [obj.id]: applyDateMask(e.target.value) }))}
                              onBlur={() => { const v = completeDateYear(secPeriodStart[obj.id] ?? ''); setSecPeriodStart((p) => ({ ...p, [obj.id]: v })); updateSecondaryObjectivePeriod(id, obj.id, toISODate(v) || undefined, toISODate(secPeriodEnd[obj.id] ?? '') || undefined) }}
                              placeholder="Início dd/mm/aaaa"
                              autoComplete="off"
                              className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor={`sec-pe-${obj.id}`} className="sr-only">Fim do período</label>
                            <input
                              id={`sec-pe-${obj.id}`}
                              type="text"
                              inputMode="numeric"
                              value={secPeriodEnd[obj.id] ?? ''}
                              onChange={(e) => setSecPeriodEnd((prev) => ({ ...prev, [obj.id]: applyDateMask(e.target.value) }))}
                              onBlur={() => { const v = completeDateYear(secPeriodEnd[obj.id] ?? ''); setSecPeriodEnd((p) => ({ ...p, [obj.id]: v })); updateSecondaryObjectivePeriod(id, obj.id, toISODate(secPeriodStart[obj.id] ?? '') || undefined, toISODate(v) || undefined) }}
                              placeholder="Fim dd/mm/aaaa"
                              autoComplete="off"
                              className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Direct type: auto-computed ranking */}
                    {obj.type === 'direct' && obj.metric && !obj.manualOverride && (() => {
                      const ranking = computeDirectRanking(championship, obj.metric, obj.positions ?? [])
                      return (
                        <div className="flex flex-col gap-2">
                          {ranking.map((entry) => {
                            const p = championship.participants.find((pa) => pa.id === entry.participantId)
                            const pos = (obj.positions ?? []).find((op) => op.place === entry.position)
                            const medal = ['🥇', '🥈', '🥉'][entry.position - 1] ?? `${entry.position}º`
                            return (
                              <div key={entry.participantId} className="flex items-center gap-3 rounded-lg border border-[#1A1A1A] bg-[#111] p-3">
                                <span className="w-8 text-center text-base">{medal}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">{p?.name ?? '—'}</p>
                                  <p className="text-xs text-[#555]">{p?.handle}</p>
                                </div>
                                <span className="text-xs tabular-nums text-[#888]">{formatViews(entry.views)}</span>
                                {pos && (
                                  <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">
                                    {formatBRL(pos.prize)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Direct type: manual override */}
                    {obj.type === 'direct' && obj.manualOverride && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-[#FFB800]/70">Atribuindo posições manualmente — o cálculo automático será ignorado para estas posições.</p>
                        {(obj.positions ?? []).map((pos) => {
                          const winner = championship.participants.find((p) => p.id === pos.winnerId)
                          const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                          return (
                            <div key={pos.place} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#FFB800]/20 bg-[#111] p-3">
                              <span className="w-8 flex-none text-center text-base">{medal}</span>
                              <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">{formatBRL(pos.prize)}</span>
                              {winner && <span className="text-xs text-[#AAFF00]">{winner.name}</span>}
                              <div className="w-full sm:ml-auto sm:w-auto">
                                <label htmlFor={`sec-override-${obj.id}-${pos.place}`} className="sr-only">Vencedor do {pos.place}º lugar — {obj.description}</label>
                                <select
                                  id={`sec-override-${obj.id}-${pos.place}`}
                                  value={pos.winnerId || ''}
                                  onChange={(e) => assignSecondaryWinner(id, obj.id, pos.place, e.target.value)}
                                  className="w-full rounded-lg border border-[#FFB800]/30 bg-[#0D0D0D] px-3 py-2 text-sm text-white transition-colors focus-visible:border-[#FFB800] focus-visible:outline-none sm:w-56"
                                  style={{ backgroundColor: '#0D0D0D', color: '#fff' }}
                                >
                                  <option value="">Selecionar participante…</option>
                                  {championship.participants.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.handle})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Subjective/Manual type: direct winner selector per position */}
                    {obj.type === 'subjective' && (
                      <div className="flex flex-col gap-2">
                        {(obj.positions ?? []).map((pos) => {
                          const winner = championship.participants.find((p) => p.id === pos.winnerId)
                          const medal = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                          return (
                            <div key={pos.place} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#1A1A1A] bg-[#111] p-3">
                              <span className="text-base" aria-label={`${pos.place}º lugar`}>{medal}</span>
                              <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">{formatBRL(pos.prize)}</span>
                              {winner && <span className="text-xs text-[#AAFF00]">{winner.name}</span>}
                              <div className="w-full sm:ml-auto sm:w-auto">
                                <label htmlFor={`sec-subj-${obj.id}-${pos.place}`} className="sr-only">Vencedor do {pos.place}º lugar — {obj.description}</label>
                                <select
                                  id={`sec-subj-${obj.id}-${pos.place}`}
                                  value={pos.winnerId || ''}
                                  onChange={(e) => assignSecondaryWinner(id, obj.id, pos.place, e.target.value)}
                                  className="w-full rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-3 py-2 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none sm:w-56"
                                  style={{ backgroundColor: '#0D0D0D', color: '#fff' }}
                                >
                                  <option value="">Selecionar vencedor…</option>
                                  {championship.participants.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.handle})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Legacy ranking type: position-by-position selector */}
                    {(!obj.type || obj.type === 'ranking') && (
                      <div className="flex flex-col gap-3">
                        {(obj.positions ?? []).map((pos) => {
                          const winner = championship.participants.find((p) => p.id === pos.winnerId)
                          const placeLabel = ['🥇', '🥈', '🥉'][pos.place - 1] ?? `${pos.place}º`
                          return (
                            <div key={pos.place} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#1A1A1A] bg-[#111] p-3">
                              <span className="w-8 flex-none text-center text-base" aria-label={`${pos.place}º lugar`}>
                                {placeLabel}
                              </span>
                              <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold text-[#AAFF00]">
                                {formatBRL(pos.prize)}
                              </span>
                              {winner && (
                                <span className="text-xs text-[#AAFF00]">{winner.name}</span>
                              )}
                              <div className="w-full sm:ml-auto sm:w-auto">
                                <label htmlFor={`sec-${obj.id}-${pos.place}`} className="sr-only">
                                  Vencedor do {pos.place}º lugar — {obj.description}
                                </label>
                                <select
                                  id={`sec-${obj.id}-${pos.place}`}
                                  value={pos.winnerId || ''}
                                  onChange={(e) => assignSecondaryWinner(id, obj.id, pos.place, e.target.value)}
                                  className="w-full rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-3 py-2 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none sm:w-56"
                                  style={{ backgroundColor: '#0D0D0D', color: '#fff' }}
                                >
                                  <option value="">Selecionar vencedor…</option>
                                  {championship.participants.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} ({p.handle})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Completion type */}
                    {obj.type === 'completion' && (() => {
                      const completions = obj.completions ?? []
                      const max = obj.maxCompletions ?? 0
                      const used = completions.length
                      const remaining = max - used
                      const selectVal = completionSelects[obj.id] ?? ''
                      return (
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 text-xs font-bold text-[#AAFF00]">
                              {formatBRL(obj.prizePerCompletion ?? 0)} por conclusão
                            </span>
                            <span className="rounded-full bg-[#1A1A1A] px-3 py-1 text-xs text-[#888]">
                              {used} / {max} conclusões
                            </span>
                            {remaining > 0 && (
                              <span className="text-xs text-[#444]">{remaining} restante{remaining !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                          {completions.length > 0 && (
                            <ul className="mb-3 flex flex-col gap-2" role="list">
                              {completions.map((c, idx) => {
                                const p = championship.participants.find((pa) => pa.id === c.participantId)
                                return (
                                  <li key={idx} className="flex items-center gap-3 rounded-lg bg-[#111] px-3 py-2">
                                    <span className="flex-1 text-sm text-white">{p?.name ?? '—'}</span>
                                    <span className="text-xs text-[#555]">{p?.handle}</span>
                                    <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold tabular-nums text-[#AAFF00]">
                                      {formatBRL(obj.prizePerCompletion ?? 0)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeCompletion(id, obj.id, idx)}
                                      className="ml-1 text-xs text-[#333] transition-colors hover:text-red-400"
                                      aria-label={`Remover conclusão de ${p?.name}`}
                                    >
                                      ×
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                          {remaining > 0 && championship.participants.length > 0 && (
                            <div className="flex gap-2">
                              <label htmlFor={`comp-sel-${obj.id}`} className="sr-only">
                                Participante para adicionar conclusão
                              </label>
                              <select
                                id={`comp-sel-${obj.id}`}
                                value={selectVal}
                                onChange={(e) => setCompletionSelects((prev) => ({ ...prev, [obj.id]: e.target.value }))}
                                className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                                style={{ backgroundColor: '#111', color: '#fff' }}
                              >
                                <option value="">Selecionar participante…</option>
                                {championship.participants.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.handle})</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={!selectVal}
                                onClick={() => {
                                  if (!selectVal) return
                                  addCompletion(id, obj.id, selectVal)
                                  setCompletionSelects((prev) => ({ ...prev, [obj.id]: '' }))
                                }}
                                className="rounded-full bg-[#AAFF00] px-4 py-2 text-xs font-bold text-black transition-opacity hover:opacity-80 disabled:opacity-30"
                              >
                                + Conclusão
                              </button>
                            </div>
                          )}
                          {remaining === 0 && (
                            <p className="text-xs text-[#444]">Limite de conclusões atingido.</p>
                          )}
                        </div>
                      )
                    })()}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={saveEdits}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#AAFF00] py-3 text-sm font-bold text-black transition-opacity hover:opacity-80"
            >
              {editSaved ? '✓ Salvo com sucesso' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Editar */}
      {activeTab === 'editar' && (
        <div role="tabpanel" aria-label="Editar campeonato">
          <form
            onSubmit={(e) => { e.preventDefault(); saveEdits() }}
            className="flex flex-col gap-5"
            noValidate
          >
            {/* Nome */}
            <div>
              <label htmlFor="edit-name" className="mb-1.5 block text-xs font-medium text-[#888]">
                Nome do Campeonato
              </label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setIsDirty(true) }}
                autoComplete="off"
                className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
              />
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="edit-description" className="mb-1.5 block text-xs font-medium text-[#888]">
                Descrição do Campeonato
              </label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => { setEditDescription(e.target.value); setIsDirty(true) }}
                rows={3}
                placeholder="Explique o objetivo geral do campeonato…"
                className="w-full resize-y rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
              />
            </div>

            {/* Capa */}
            <div>
              <label htmlFor="edit-cover" className="mb-1.5 block text-xs font-medium text-[#888]">
                Capa Principal
                <span className="ml-1 text-[#444]">(1080 × 1400 px)</span>
              </label>
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-stretch">
                <label
                  htmlFor="edit-cover"
                  className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#1A1A1A] bg-[#111] px-6 py-5 text-center transition-colors hover:border-[#AAFF00]/40"
                >
                  <span className="text-2xl" aria-hidden="true">🖼️</span>
                  <span className="text-xs text-[#555]">Trocar imagem</span>
                  <input
                    id="edit-cover"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Selecionar nova capa"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string
                        setEditCover(result)
                        setEditCoverPreview(result)
                        setIsDirty(true)
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
                {(editCoverPreview || championship.coverGradient) && (
                  <div
                    className="relative flex-none overflow-hidden rounded-xl border border-[#1A1A1A]"
                    style={{ width: 90, aspectRatio: '1080/1400' }}
                  >
                    {editCoverPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editCoverPreview} alt="Prévia da capa" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: championship.coverGradient }} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Capa Interna */}
            <div>
              <label htmlFor="edit-cover-internal" className="mb-1.5 block text-xs font-medium text-[#888]">
                Capa Interna
                <span className="ml-1 text-[#444]">(1920 × 600 px)</span>
              </label>
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="edit-cover-internal"
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#1A1A1A] bg-[#111] py-5 text-center transition-colors hover:border-[#AAFF00]/40"
                  style={{ aspectRatio: '16/5' }}
                >
                  <span className="text-2xl" aria-hidden="true">🖼️</span>
                  <span className="text-xs text-[#555]">Trocar banner interno</span>
                  <input
                    id="edit-cover-internal"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Selecionar nova capa interna"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string
                        setEditCoverInternal(result)
                        setEditCoverInternalPreview(result)
                        setIsDirty(true)
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
                {editCoverInternalPreview && (
                  <div
                    className="w-full overflow-hidden rounded-xl border border-[#1A1A1A]"
                    style={{ aspectRatio: '16/5' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editCoverInternalPreview}
                      alt="Prévia da capa interna"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                )}
                {!editCoverInternalPreview && (
                  <div
                    className="w-full overflow-hidden rounded-xl border border-[#1A1A1A]"
                    style={{ aspectRatio: '16/5', background: championship.coverGradient || '#111' }}
                  >
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs text-[#333]">Sem capa interna — usando gradiente padrão</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações sobre o pagamento */}
            <div>
              <label htmlFor="edit-payment-info" className="mb-1.5 block text-xs font-medium text-[#888]">
                Informações sobre o Pagamento
              </label>
              <textarea
                id="edit-payment-info"
                value={editPaymentInfo}
                onChange={(e) => { setEditPaymentInfo(e.target.value); setIsDirty(true) }}
                rows={4}
                placeholder="Descreva como será feito o pagamento, chave Pix, prazo, condições…"
                className="w-full resize-y rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
              />
            </div>

            {/* Datas do campeonato */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-start-date" className="mb-1.5 block text-xs font-medium text-[#888]">
                  Data de Início
                </label>
                <input
                  id="edit-start-date"
                  type="text"
                  inputMode="numeric"
                  value={editStartDate}
                  onChange={(e) => { setEditStartDate(applyDateMask(e.target.value)); setIsDirty(true) }}
                  onBlur={() => setEditStartDate(completeDateYear(editStartDate))}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                />
              </div>
              <div>
                <label htmlFor="edit-end-date" className="mb-1.5 block text-xs font-medium text-[#888]">
                  Data de Término
                </label>
                <input
                  id="edit-end-date"
                  type="text"
                  inputMode="numeric"
                  value={editEndDate}
                  onChange={(e) => { setEditEndDate(applyDateMask(e.target.value)); setIsDirty(true) }}
                  onBlur={() => setEditEndDate(completeDateYear(editEndDate))}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                />
              </div>
            </div>

            {/* Datas extras */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-ranking-date" className="mb-1.5 block text-xs font-medium text-[#888]">
                  Data de Ranking Final
                </label>
                <input
                  id="edit-ranking-date"
                  type="text"
                  inputMode="numeric"
                  value={editRankingDate}
                  onChange={(e) => { setEditRankingDate(applyDateMask(e.target.value)); setIsDirty(true) }}
                  onBlur={() => setEditRankingDate(completeDateYear(editRankingDate))}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                />
              </div>
              <div>
                <label htmlFor="edit-payment-deadline" className="mb-1.5 block text-xs font-medium text-[#888]">
                  Limite de Pagamento
                </label>
                <input
                  id="edit-payment-deadline"
                  type="text"
                  inputMode="numeric"
                  value={editPaymentDeadline}
                  onChange={(e) => { setEditPaymentDeadline(applyDateMask(e.target.value)); setIsDirty(true) }}
                  onBlur={() => setEditPaymentDeadline(completeDateYear(editPaymentDeadline))}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                />
              </div>
            </div>

            {/* Conteúdos Válidos */}
            <div>
              <p className="mb-2 text-xs font-medium text-[#888]">Conteúdos Válidos</p>
              <div className="flex flex-col gap-2">
                {editValidContent.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          setEditValidContent((prev) =>
                            prev.map((v, i) => (i === idx ? { ...v, title: e.target.value } : v))
                          )
                          setIsDirty(true)
                        }}
                        placeholder="Descrição do conteúdo válido…"
                        aria-label={`Descrição do conteúdo ${idx + 1}`}
                        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                      <input
                        type="url"
                        value={item.url ?? ''}
                        onChange={(e) =>
                          setEditValidContent((prev) =>
                            prev.map((v, i) => (i === idx ? { ...v, url: e.target.value || undefined } : v))
                          )
                        }
                        placeholder="Link (opcional)…"
                        aria-label={`Link do conteúdo ${idx + 1}`}
                        autoComplete="off"
                        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditValidContent((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remover conteúdo ${idx + 1}`}
                      className="mt-2.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#1A1A1A] text-[#555] transition-colors hover:border-red-500/40 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditValidContent((prev) => [...prev, { title: '' }])}
                  className="rounded-full border border-dashed border-[#1A1A1A] py-2 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
                >
                  + Adicionar conteúdo
                </button>
              </div>
            </div>

            {/* Regras */}
            <div>
              <p className="mb-2 text-xs font-medium text-[#888]">Regras</p>
              <div className="flex flex-col gap-2">
                {editRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <input
                        type="text"
                        value={rule.text}
                        onChange={(e) =>
                          setEditRules((prev) => prev.map((r, i) => i === idx ? { ...r, text: e.target.value } : r))
                        }
                        placeholder={`Regra ${idx + 1}…`}
                        aria-label={`Texto da regra ${idx + 1}`}
                        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                      <input
                        type="url"
                        value={rule.url ?? ''}
                        onChange={(e) =>
                          setEditRules((prev) => prev.map((r, i) => i === idx ? { ...r, url: e.target.value || undefined } : r))
                        }
                        placeholder="Link (opcional)…"
                        aria-label={`Link da regra ${idx + 1}`}
                        autoComplete="off"
                        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditRules((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remover regra ${idx + 1}`}
                      className="mt-2.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#1A1A1A] text-[#555] transition-colors hover:border-red-500/40 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditRules((prev) => [...prev, { text: '' }])}
                  className="rounded-full border border-dashed border-[#1A1A1A] py-2 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
                >
                  + Adicionar regra
                </button>
              </div>
            </div>

            {/* ── Objetivo Principal ── */}
            <div className="rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-4">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">Objetivo Principal</p>

              {/* Tipo */}
              <div className="mb-4">
                <p className="mb-1.5 text-xs font-medium text-[#888]">Tipo</p>
                <div className="flex flex-wrap gap-2">
                  {([['direct', 'Automático'], ['subjective', 'Revisão Manual'], ['manual', 'Manual']] as [MainObjectiveType, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setEditMainObjType(val); setIsDirty(true) }}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${editMainObjType === val ? 'bg-[#AAFF00] text-black' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Métrica (só direct) */}
              {editMainObjType === 'direct' && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-medium text-[#888]">Métrica</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(DIRECT_METRIC_LABEL) as [DirectMetric, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setEditMainObjMetric(val); setIsDirty(true) }}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${editMainObjMetric === val ? 'bg-[#AAFF00]/20 text-[#AAFF00] border border-[#AAFF00]/40' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Período de Validade (só direct) */}
              {editMainObjType === 'direct' && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-medium text-[#888]">
                    Período de Validade <span className="text-[#444]">(opcional)</span>
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editMainObjPeriodStart}
                      onChange={(e) => { setEditMainObjPeriodStart(applyDateMask(e.target.value)); setIsDirty(true) }}
                      onBlur={() => setEditMainObjPeriodStart(completeDateYear(editMainObjPeriodStart))}
                      placeholder="Início dd/mm/aaaa"
                      autoComplete="off"
                      className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editMainObjPeriodEnd}
                      onChange={(e) => { setEditMainObjPeriodEnd(applyDateMask(e.target.value)); setIsDirty(true) }}
                      onBlur={() => setEditMainObjPeriodEnd(completeDateYear(editMainObjPeriodEnd))}
                      placeholder="Fim dd/mm/aaaa"
                      autoComplete="off"
                      className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div className="mb-4">
                <label htmlFor="edit-main-desc" className="mb-1.5 block text-xs font-medium text-[#888]">Nome do Objetivo</label>
                <input
                  id="edit-main-desc"
                  type="text"
                  value={editMainObjDesc}
                  onChange={(e) => { setEditMainObjDesc(e.target.value); setIsDirty(true) }}
                  placeholder="Ex: Ranking de Views…"
                  autoComplete="off"
                  className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                />
              </div>

              {/* Posições/prêmios */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-[#888]">Prêmios por Posição</p>
                {editMainPositions.map((pos) => (
                  <div key={pos.place} className="flex items-center gap-3">
                    <span className="w-14 flex-none text-xs font-bold text-[#555]">{pos.place}º lugar</span>
                    <div className="flex-1">
                      <label htmlFor={`edit-main-pos-${pos.place}`} className="sr-only">Prêmio {pos.place}º lugar</label>
                      <PrizeInput
                        id={`edit-main-pos-${pos.place}`}
                        value={pos.prize}
                        onChange={(n) => { setEditMainPositions((prev) => prev.map((p) => p.place === pos.place ? { ...p, prize: n } : p)); setIsDirty(true) }}
                        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                    </div>
                    {editMainPositions.length > 1 && (
                      <button type="button" onClick={() => { setEditMainPositions((prev) => prev.filter((p) => p.place !== pos.place)); setIsDirty(true) }} className="text-xs text-[#333] hover:text-red-400">×</button>
                    )}
                  </div>
                ))}
                {editMainPositions.length < 20 && (
                  <button
                    type="button"
                    onClick={() => { setEditMainPositions((prev) => [...prev, { place: prev.length + 1, prize: 0 }]); setIsDirty(true) }}
                    className="rounded-full border border-dashed border-[#1A1A1A] py-2 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
                  >
                    + Adicionar posição
                  </button>
                )}
              </div>
            </div>

            {/* ── Objetivos Secundários ── */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#555]">Objetivos Secundários</p>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `s_${Date.now()}`
                    setEditSecondaryObjs((prev) => [...prev, {
                      id: newId,
                      description: '',
                      type: 'subjective',
                      positions: [{ place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 }],
                    }])
                    setEditSecObjPeriods((prev) => ({ ...prev, [newId]: { start: '', end: '' } }))
                    setIsDirty(true)
                  }}
                  className="rounded-full border border-[#1A1A1A] px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
                >
                  + Adicionar
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {editSecondaryObjs.map((obj, i) => (
                  <div key={obj.id} className="rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] p-4">

                    {/* Header */}
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={obj.description}
                        onChange={(e) => { setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, description: e.target.value } : o)); setIsDirty(true) }}
                        placeholder="Nome do objetivo…"
                        autoComplete="off"
                        aria-label={`Nome do objetivo secundário ${i + 1}`}
                        className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm font-medium text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => { setEditSecondaryObjs((prev) => prev.filter((_, oi) => oi !== i)); setIsDirty(true) }}
                        aria-label={`Remover objetivo ${i + 1}`}
                        className="rounded-lg border border-[#1A1A1A] px-3 py-2 text-sm text-[#555] transition-colors hover:border-red-500/40 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>

                    {/* Detalhes */}
                    <textarea
                      value={obj.details ?? ''}
                      onChange={(e) => { setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, details: e.target.value } : o)); setIsDirty(true) }}
                      placeholder="Explique como esse objetivo funciona…"
                      rows={2}
                      aria-label={`Descrição do objetivo ${i + 1}`}
                      className="mb-3 w-full resize-y rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                    />

                    {/* Tipo */}
                    <div className="mb-3">
                      <p className="mb-1.5 text-xs font-medium text-[#888]">Tipo</p>
                      <div className="flex flex-wrap gap-2">
                        {([['direct', 'Automático'], ['subjective', 'Manual'], ['completion', 'Conclusão']] as [SecondaryObjective['type'], string][]).map(([t, label]) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setEditSecondaryObjs((prev) => prev.map((o, oi) => {
                                if (oi !== i) return o
                                if (t === 'completion') return { ...o, type: t, metric: undefined, positions: undefined, prizePerCompletion: o.prizePerCompletion ?? 0, maxCompletions: o.maxCompletions ?? 20 }
                                if (t === 'direct') return { ...o, type: t, metric: o.metric ?? 'views_totais' as DirectMetric, prizePerCompletion: undefined, positions: o.positions ?? [{ place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 }] }
                                return { ...o, type: t, metric: undefined, prizePerCompletion: undefined, positions: o.positions ?? [{ place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 }] }
                              }))
                              setIsDirty(true)
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${(obj.type ?? 'subjective') === t ? 'bg-[#AAFF00] text-black' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Métrica (só direct) */}
                    {obj.type === 'direct' && (
                      <div className="mb-3">
                        <p className="mb-1.5 text-xs font-medium text-[#888]">Métrica</p>
                        <div className="flex flex-wrap gap-2">
                          {(Object.entries(DIRECT_METRIC_LABEL) as [DirectMetric, string][]).map(([val, label]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => { setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, metric: val } : o)); setIsDirty(true) }}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${(obj.metric ?? 'views_totais') === val ? 'bg-[#AAFF00]/20 text-[#AAFF00] border border-[#AAFF00]/40' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Período de Validade (só direct) */}
                    {obj.type === 'direct' && (
                      <div className="mb-3">
                        <p className="mb-1.5 text-xs font-medium text-[#888]">
                          Período de Validade <span className="text-[#444]">(opcional)</span>
                        </p>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editSecObjPeriods[obj.id]?.start ?? ''}
                            onChange={(e) => { setEditSecObjPeriods((prev) => ({ ...prev, [obj.id]: { ...prev[obj.id], start: applyDateMask(e.target.value) } })); setIsDirty(true) }}
                            onBlur={() => { const v = completeDateYear(editSecObjPeriods[obj.id]?.start ?? ''); setEditSecObjPeriods((prev) => ({ ...prev, [obj.id]: { ...prev[obj.id], start: v } })) }}
                            placeholder="Início dd/mm/aaaa"
                            autoComplete="off"
                            className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editSecObjPeriods[obj.id]?.end ?? ''}
                            onChange={(e) => { setEditSecObjPeriods((prev) => ({ ...prev, [obj.id]: { ...prev[obj.id], end: applyDateMask(e.target.value) } })); setIsDirty(true) }}
                            onBlur={() => { const v = completeDateYear(editSecObjPeriods[obj.id]?.end ?? ''); setEditSecObjPeriods((prev) => ({ ...prev, [obj.id]: { ...prev[obj.id], end: v } })) }}
                            placeholder="Fim dd/mm/aaaa"
                            autoComplete="off"
                            className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Prêmios por posição (direct/subjective) */}
                    {(obj.type === 'direct' || obj.type === 'subjective' || obj.type === 'ranking' || !obj.type) && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-[#888]">Prêmios por Posição</p>
                        {(obj.positions ?? []).map((pos) => (
                          <div key={pos.place} className="flex items-center gap-3">
                            <span className="w-14 flex-none text-xs font-bold text-[#555]">{pos.place}º lugar</span>
                            <div className="flex-1">
                              <label htmlFor={`edit-sec-${i}-pos-${pos.place}`} className="sr-only">Prêmio {pos.place}º — {obj.description}</label>
                              <PrizeInput
                                id={`edit-sec-${i}-pos-${pos.place}`}
                                value={pos.prize}
                                onChange={(n) => {
                                  setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, positions: (o.positions ?? []).map((p) => p.place === pos.place ? { ...p, prize: n } : p) } : o))
                                  setIsDirty(true)
                                }}
                                className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                              />
                            </div>
                            {(obj.positions ?? []).length > 1 && (
                              <button type="button" onClick={() => { setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, positions: (o.positions ?? []).filter((p) => p.place !== pos.place) } : o)); setIsDirty(true) }} className="text-xs text-[#333] hover:text-red-400">×</button>
                            )}
                          </div>
                        ))}
                        {(obj.positions ?? []).length < 20 && (
                          <button
                            type="button"
                            onClick={() => { setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, positions: [...(o.positions ?? []), { place: (o.positions ?? []).length + 1, prize: 0 }] } : o)); setIsDirty(true) }}
                            className="rounded-full border border-dashed border-[#1A1A1A] py-2 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
                          >
                            + Adicionar posição
                          </button>
                        )}
                      </div>
                    )}

                    {/* Conclusão */}
                    {obj.type === 'completion' && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <label htmlFor={`edit-sec-${i}-prize`} className="mb-1.5 block text-xs font-medium text-[#888]">Prêmio por Conclusão</label>
                          <PrizeInput
                            id={`edit-sec-${i}-prize`}
                            value={obj.prizePerCompletion ?? 0}
                            onChange={(n) => { setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, prizePerCompletion: n } : o)); setIsDirty(true) }}
                            className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor={`edit-sec-${i}-max`} className="mb-1.5 block text-xs font-medium text-[#888]">Máximo de Conclusões</label>
                          <input
                            id={`edit-sec-${i}-max`}
                            type="number"
                            min={1}
                            value={obj.maxCompletions ?? 0}
                            onChange={(e) => { setEditSecondaryObjs((prev) => prev.map((o, oi) => oi === i ? { ...o, maxCompletions: parseInt(e.target.value) || 0 } : o)); setIsDirty(true) }}
                            className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {editSecondaryObjs.length === 0 && (
                  <p className="py-4 text-center text-sm text-[#444]">Nenhum objetivo secundário.</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#AAFF00] py-3 text-sm font-bold text-black transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {editSaved ? '✓ Salvo com sucesso' : 'Salvar Alterações'}
            </button>
          </form>

          {/* Delete */}
          <div className="mt-8 pt-2">
            {deleteStep === 'idle' && (
              <button
                type="button"
                onClick={() => { setDeleteStep('confirm'); setDeleteError('') }}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-xs text-red-500/60 transition-colors hover:border-red-500/50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40"
              >
                Excluir campeonato
              </button>
            )}

            {deleteStep === 'confirm' && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-[#666]">
                  Esta ação é <span className="font-semibold text-red-400">permanente</span>. Tem certeza?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep('password')}
                    className="rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/25"
                  >
                    Sim, excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep('idle')}
                    className="rounded-full border border-[#1A1A1A] px-3 py-1.5 text-xs text-[#555] transition-colors hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 'password' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#666]">Digite a senha para confirmar a exclusão:</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                    placeholder="Senha…"
                    autoComplete="off"
                    className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-red-400 focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!deletePassword.trim()) {
                        setDeleteError('Digite uma senha para continuar.')
                        return
                      }
                      deleteChampionship(id)
                      router.replace('/admin/gerenciar')
                    }}
                    className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeleteError('') }}
                    className="rounded-full border border-[#1A1A1A] px-3 py-2 text-xs text-[#555] transition-colors hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
                {deleteError && (
                  <p className="text-xs text-red-400">{deleteError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky save bar — visible on all tabs when there are unsaved changes */}
      {isDirty && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1A1A1A] px-4 py-3"
          style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(12px)' }}
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <p className="text-xs text-[#888]">
              Alterações não salvas na aba <span className="font-semibold text-white">Editar</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('editar')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-full border border-[#1A1A1A] px-4 py-2 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-white"
              >
                Ver edições
              </button>
              <button
                type="button"
                onClick={saveEdits}
                className="rounded-full bg-[#AAFF00] px-5 py-2 text-xs font-bold text-black transition-opacity hover:opacity-80"
              >
                {editSaved ? '✓ Salvo' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
