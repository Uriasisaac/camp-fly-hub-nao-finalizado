import Link from 'next/link'
import Image from 'next/image'
import { Championship, getEffectiveStatus, getTotalPrize, getDistributedPrize } from '@/lib/types'

interface ChampionshipCardProps {
  championship: Championship
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  finished: 'Encerrado',
  upcoming: 'Em breve',
}
const STATUS_COLOR: Record<string, string> = {
  active: '#AAFF00',
  finished: '#555',
  upcoming: '#FFB800',
}

function daysRemaining(endDate: string): number {
  const end = new Date(endDate + 'T23:59:59')
  const now = new Date()
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function ChampionshipCard({ championship }: ChampionshipCardProps) {
  const status = getEffectiveStatus(championship)
  const days = daysRemaining(championship.endDate)
  const total = getTotalPrize(championship)
  const distributed = getDistributedPrize(championship)
  const distributedPct = total > 0 ? Math.min(100, (distributed / total) * 100) : 0
  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
  const totalPrize = fmt(total)

  return (
    <Link
      href={`/campeonato/${championship.id}`}
      className="carousel-item group relative block flex-none rounded-xl border border-[#1A1A1A] transition-all duration-300 hover:border-[#AAFF00]/40 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
      style={{ width: 'clamp(180px, 44vw, 260px)' }}
      aria-label={`${championship.name} — ${STATUS_LABEL[status]}`}
    >
      <div className="overflow-hidden rounded-xl">
      {/* Cover */}
      <div
        className="relative w-full"
        style={{ aspectRatio: '1080/1400' }}
      >
        {championship.cover ? (
          <Image
            src={championship.cover}
            alt={championship.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 44vw, 260px"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: championship.coverGradient || 'linear-gradient(160deg, #111 0%, #000 100%)' }}
          >
            {/* Decorative grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(170,255,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(170,255,0,0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" fill="none" className="w-16 opacity-20">
                <path
                  d="M15 85 C20 70, 35 55, 55 45 C70 37, 85 30, 90 15 C85 25, 75 30, 65 32 C72 22, 80 18, 88 12 C78 18, 65 22, 55 28 C62 18, 72 12, 82 8 C68 15, 52 20, 42 30 C50 20, 62 14, 74 10 C58 18, 42 25, 32 38 C40 28, 52 22, 64 18 C48 28, 32 38, 22 52 C28 42, 40 35, 52 32 C36 44, 22 58, 15 75 Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${STATUS_COLOR[status]}20`,
              color: STATUS_COLOR[status],
              border: `1px solid ${STATUS_COLOR[status]}40`,
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Days badge */}
        {status === 'active' && days > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
              {days}d
            </span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Distributed prize indicator */}
        {distributed > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#666]" aria-hidden="true">
                Distribuído
              </span>
              <span className="text-[10px] font-bold tabular-nums text-[#AAFF00]">
                {fmt(distributed)}
              </span>
            </div>
            <div
              className="h-[2px] w-full rounded-full bg-white/10"
              role="progressbar"
              aria-label={`${fmt(distributed)} distribuído de ${fmt(total)}`}
              aria-valuenow={Math.round(distributedPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#AAFF00]"
                style={{ width: `${distributedPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-[#0D0D0D] p-3">
        <h3
          className="text-sm font-bold leading-tight text-white"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {championship.name}
        </h3>
        <p className="mt-1 text-xs font-bold text-[#AAFF00]">{totalPrize}</p>
      </div>
      </div>
    </Link>
  )
}
