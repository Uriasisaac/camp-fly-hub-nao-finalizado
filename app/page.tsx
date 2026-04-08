'use client'
import { useStore } from '@/lib/store'
import ChampionshipCard from '@/components/ChampionshipCard'
import { getEffectiveStatus } from '@/lib/types'

export default function HomePage() {
  const championships = useStore((s) => s.championships)
  const active = championships.filter((c) => getEffectiveStatus(c) === 'active')
  const upcoming = championships.filter((c) => getEffectiveStatus(c) === 'upcoming')
  const finished = championships.filter((c) => getEffectiveStatus(c) === 'finished')

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1
          className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          CAMPEONATOS{' '}
          <span className="text-[#AAFF00]" translate="no">
            FLY HUB
          </span>
        </h1>
        <p className="mt-3 text-sm text-[#666] sm:text-base">
          Acompanhe rankings, premiações e resultados.
        </p>
      </section>

      {/* Active championships */}
      {active.length > 0 && (
        <section aria-labelledby="ativos-heading" className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="h-2 w-2 rounded-full bg-[#AAFF00]"
              aria-hidden="true"
              style={{ boxShadow: '0 0 6px #AAFF00' }}
            />
            <h2
              id="ativos-heading"
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#888]"
            >
              Campeonatos Ativos
            </h2>
          </div>

          <div
            className="carousel-track flex gap-4 overflow-x-auto pb-4"
            role="list"
            aria-label="Campeonatos ativos"
          >
            {active.map((c) => (
              <div key={c.id} role="listitem">
                <ChampionshipCard championship={c} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#FFB800]" aria-hidden="true" />
            <h2
              id="upcoming-heading"
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#888]"
            >
              Em Breve
            </h2>
          </div>
          <div
            className="carousel-track flex gap-4 overflow-x-auto pb-4"
            role="list"
            aria-label="Campeonatos em breve"
          >
            {upcoming.map((c) => (
              <div key={c.id} role="listitem">
                <ChampionshipCard championship={c} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Finished */}
      {finished.length > 0 && (
        <section aria-labelledby="finished-heading">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#333]" aria-hidden="true" />
            <h2
              id="finished-heading"
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#555]"
            >
              Encerrados
            </h2>
          </div>
          <div
            className="carousel-track flex gap-4 overflow-x-auto pb-4"
            role="list"
            aria-label="Campeonatos encerrados"
          >
            {finished.map((c) => (
              <div key={c.id} role="listitem">
                <ChampionshipCard championship={c} />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
