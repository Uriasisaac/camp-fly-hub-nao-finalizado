import { Championship, getEffectiveMainRanking } from '@/lib/types'

interface RankingTableProps {
  championship: Championship
}

const MEDALS = ['🥇', '🥈', '🥉']

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

export default function RankingTable({ championship }: RankingTableProps) {
  const { participants, mainPositions } = championship
  const ranking = getEffectiveMainRanking(championship)

  const prizedRows = mainPositions.map((pos) => {
    const entry = ranking.find((r) => r.position === pos.place)
    const participant = entry ? participants.find((p) => p.id === entry.participantId) ?? null : null
    return { position: pos.place, prize: pos.prize, participant, views: entry?.views ?? null }
  })

  const extraRows = ranking
    .filter((r) => r.position > mainPositions.length)
    .map((r) => ({
      position: r.position,
      prize: 0,
      participant: participants.find((p) => p.id === r.participantId) ?? null,
      views: r.views,
    }))

  const rows = [...prizedRows, ...extraRows]

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-1 grid grid-cols-[2rem_1fr_auto_auto] gap-x-3 border-b border-[#1A1A1A] pb-2">
        <span className="text-xs font-medium text-[#555]">#</span>
        <span className="text-xs font-medium text-[#555]">Participante</span>
        <span className="text-right text-xs font-medium text-[#555]">Views</span>
        <span className="text-right text-xs font-medium text-[#555]">Prêmio</span>
      </div>

      {rows.length === 0 && (
        <p className="py-12 text-center text-sm text-[#444]">Ranking ainda não disponível</p>
      )}

      <div className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.position}
            className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-x-3 border-b border-[#0F0F0F] py-3 transition-colors hover:bg-[#0D0D0D]"
          >
            {/* Posição */}
            <span className="font-bold tabular-nums" aria-label={`${row.position}º lugar`}>
              {row.position <= 3
                ? MEDALS[row.position - 1]
                : <span className="text-sm text-[#555]">{row.position}º</span>}
            </span>

            {/* Participante */}
            <div className="min-w-0">
              {row.participant ? (
                <>
                  <p className="truncate text-sm font-semibold text-white">{row.participant.name}</p>
                  <p className="truncate text-xs text-[#555]">{row.participant.handle}</p>
                </>
              ) : (
                <span className="text-sm text-[#333]">A definir</span>
              )}
            </div>

            {/* Views */}
            <span className="text-right text-sm font-bold tabular-nums text-white">
              {row.views !== null ? formatViews(row.views) : <span className="text-[#222]">—</span>}
            </span>

            {/* Prêmio */}
            <span className="text-right">
              {row.prize > 0 ? (
                <span className="rounded-full bg-[#AAFF00]/10 px-2.5 py-1 text-xs font-bold tabular-nums text-[#AAFF00]">
                  {formatBRL(row.prize)}
                </span>
              ) : (
                <span className="text-sm text-[#333]">—</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
