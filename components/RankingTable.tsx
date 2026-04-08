import { Championship, getEffectiveMainRanking } from '@/lib/types'

interface RankingTableProps {
  championship: Championship
}

const MEDALS = ['🥇', '🥈', '🥉']
const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YT',
  instagram: 'IG',
  tiktok: 'TK',
  kwai: 'KW',
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

export default function RankingTable({ championship }: RankingTableProps) {
  const { participants, videos, mainPositions } = championship
  const ranking = getEffectiveMainRanking(championship)

  // Build rows: always show prized positions, fill with ranking entries if available
  const prizedRows = mainPositions.map((pos) => {
    const entry = ranking.find((r) => r.position === pos.place)
    const participant = entry ? participants.find((p) => p.id === entry.participantId) ?? null : null
    return {
      position: pos.place,
      prize: pos.prize,
      participant,
      views: entry?.views ?? null,
    }
  })

  // Extra ranking entries beyond prized positions (prize = 0)
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
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[400px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#1A1A1A]">
            <th className="py-3 pr-4 text-left text-xs font-medium text-[#555] w-10">#</th>
            <th className="py-3 pr-4 text-left text-xs font-medium text-[#555]">Participante</th>
            <th className="py-3 pr-4 text-right text-xs font-medium text-[#555]">Views</th>
            <th className="py-3 text-right text-xs font-medium text-[#555]">Prêmio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const participantVideos = row.participant
              ? videos.filter((v) => v.participantId === row.participant!.id)
              : []

            return (
              <tr
                key={row.position}
                className="border-b border-[#0F0F0F] transition-colors hover:bg-[#0D0D0D]"
              >
                <td className="py-3.5 pr-4 font-bold tabular-nums">
                  {row.position <= 3 ? (
                    <span aria-label={`${row.position}º lugar`}>{MEDALS[row.position - 1]}</span>
                  ) : (
                    <span className="text-[#555]">{row.position}º</span>
                  )}
                </td>
                <td className="py-3.5 pr-4">
                  {row.participant ? (
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold text-white">{row.participant.name}</span>
                      <span className="text-xs text-[#555]">{row.participant.handle}</span>
                      {participantVideos.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {participantVideos.map((v) => (
                            <span
                              key={v.id}
                              className="rounded bg-[#1A1A1A] px-1.5 py-0.5 text-[10px] text-[#666]"
                            >
                              {PLATFORM_LABELS[v.platform]} · {v.title.slice(0, 22)}{v.title.length > 22 ? '…' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#333]">A definir</span>
                  )}
                </td>
                <td className="py-3.5 pr-4 text-right font-bold tabular-nums text-white">
                  {row.views !== null ? formatViews(row.views) : <span className="text-[#222]">—</span>}
                </td>
                <td className="py-3.5 text-right">
                  {row.prize > 0 ? (
                    <span className="rounded-full bg-[#AAFF00]/10 px-3 py-1 font-bold tabular-nums text-[#AAFF00]">
                      {formatBRL(row.prize)}
                    </span>
                  ) : (
                    <span className="text-[#333]">—</span>
                  )}
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-[#444]">
                Ranking ainda não disponível
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
