'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { SecondaryObjective, Position, ValidContentItem, RuleItem, DirectMetric, MainObjectiveType, DIRECT_METRIC_LABEL } from '@/lib/types'
import { applyDateMask, toISODate } from '@/lib/format'
import PrizeInput from '@/components/PrizeInput'

function InputField({
  label, id, type = 'text', value, onChange, placeholder, required, hint,
}: {
  label: string; id: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#888]">
        {label}{required && <span className="ml-0.5 text-[#AAFF00]" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-[#444]">{hint}</p>}
    </div>
  )
}

function TextareaField({
  label, id, value, onChange, placeholder, required, rows = 4,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#888]">
        {label}{required && <span className="ml-0.5 text-[#AAFF00]" aria-hidden="true">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full resize-y rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
      />
    </div>
  )
}

export default function CriarCampeonatoPage() {
  const router = useRouter()
  const isAdmin = useStore((s) => s.isAdmin)
  const addChampionship = useStore((s) => s.addChampionship)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState<string>('')
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [coverInternal, setCoverInternal] = useState<string>('')
  const [coverInternalPreview, setCoverInternalPreview] = useState<string>('')
  const [mainObjectiveDescription, setMainObjectiveDescription] = useState('')
  const [mainObjectiveType, setMainObjectiveType] = useState<MainObjectiveType>('direct')
  const [mainObjectiveMetric, setMainObjectiveMetric] = useState<DirectMetric>('views_totais')
  const [mainPositions, setMainPositions] = useState<Position[]>([
    { place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 },
  ])
  const [secondaryObjs, setSecondaryObjs] = useState<Omit<SecondaryObjective, 'id'>[]>([
    { description: '', type: 'subjective', positions: [{ place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 }] },
  ])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rankingDate, setRankingDate] = useState('')
  const [paymentDeadline, setPaymentDeadline] = useState('')
  const [validContent, setValidContent] = useState<ValidContentItem[]>([{ title: '', url: '' }])
  const [rules, setRules] = useState<RuleItem[]>([{ text: '' }])
  const [paymentInfo, setPaymentInfo] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!isAdmin) router.replace('/admin/login')
  }, [isAdmin, router])

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setCover(result)
      setCoverPreview(result)
    }
    reader.readAsDataURL(file)
  }

  function addSecondaryObj() {
    setSecondaryObjs((prev) => [
      ...prev,
      { description: '', type: 'subjective', positions: [{ place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 }] },
    ])
  }

  function updateSecondaryDetails(index: number, value: string) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) => i === index ? { ...o, details: value } : o)
    )
  }

  function updateSecondaryType(index: number, type: SecondaryObjective['type']) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) => {
        if (i !== index) return o
        if (type === 'completion') return { ...o, type, positions: undefined, prizePerCompletion: 0, maxCompletions: 20, metric: undefined }
        if (type === 'direct') return { ...o, type, metric: 'views_totais' as DirectMetric, prizePerCompletion: undefined, maxCompletions: undefined, positions: [{ place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 }] }
        return { ...o, type, metric: undefined, prizePerCompletion: undefined, maxCompletions: undefined, positions: [{ place: 1, prize: 0 }, { place: 2, prize: 0 }, { place: 3, prize: 0 }] }
      })
    )
  }

  function updateSecondaryMetric(index: number, metric: DirectMetric) {
    setSecondaryObjs((prev) => prev.map((o, i) => i === index ? { ...o, metric } : o))
  }

  function updateCompletionPrize(index: number, prize: number) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) => i === index ? { ...o, prizePerCompletion: prize } : o)
    )
  }
  function updateCompletionMax(index: number, value: string) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) => i === index ? { ...o, maxCompletions: parseInt(value) || 0 } : o)
    )
  }

  function removeSecondaryObj(index: number) {
    setSecondaryObjs((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSecondaryDesc(index: number, value: string) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) => i === index ? { ...o, description: value } : o)
    )
  }

  function updateMainPosition(place: number, prize: number) {
    setMainPositions((prev) => prev.map((p) => p.place === place ? { ...p, prize } : p))
  }
  function addMainPosition() {
    setMainPositions((prev) => [...prev, { place: prev.length + 1, prize: 0 }])
  }
  function removeMainPosition(place: number) {
    setMainPositions((prev) =>
      prev.filter((p) => p.place !== place).map((p, i) => ({ ...p, place: i + 1 }))
    )
  }

  function updateSecondaryPosition(objIndex: number, place: number, prize: number) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) =>
        i === objIndex
          ? { ...o, positions: (o.positions ?? []).map((p: Position) => p.place === place ? { ...p, prize } : p) }
          : o
      )
    )
  }

  function addPosition(objIndex: number) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) => {
        if (i !== objIndex) return o
        const cur = o.positions ?? []
        return { ...o, positions: [...cur, { place: cur.length + 1, prize: 0 }] }
      })
    )
  }

  function removePosition(objIndex: number, place: number) {
    setSecondaryObjs((prev) =>
      prev.map((o, i) => {
        if (i !== objIndex) return o
        const filtered = (o.positions ?? []).filter((p: Position) => p.place !== place)
        return { ...o, positions: filtered.map((p: Position, idx: number) => ({ ...p, place: idx + 1 })) }
      })
    )
  }

  function addValidContent() {
    if (validContent.length >= 20) return
    setValidContent((prev) => [...prev, { title: '', url: '' }])
  }
  function removeValidContent(i: number) {
    setValidContent((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateValidContentField(i: number, field: 'title' | 'url', value: string) {
    setValidContent((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function addRule() {
    if (rules.length >= 20) return
    setRules((prev) => [...prev, { text: '' }])
  }
  function removeRule(i: number) {
    setRules((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateRule(i: number, field: 'text' | 'url', value: string) {
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function validate(): string[] {
    const errs: string[] = []
    if (!name.trim()) errs.push('Nome do campeonato é obrigatório.')
    if (!startDate) errs.push('Data de início é obrigatória.')
    if (!endDate) errs.push('Data de término é obrigatória.')
    if (startDate && endDate && toISODate(startDate) >= toISODate(endDate)) errs.push('Data de término deve ser após o início.')
    if (!validContent.some((v) => v.title.trim() || v.url?.trim())) errs.push('Adicione ao menos um conteúdo válido.')
    if (!rules.some((r) => r.text.trim() || r.url?.trim())) errs.push('Adicione ao menos uma regra.')
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setSaving(true)

    setTimeout(() => {
      addChampionship({
        name: name.trim(),
        description: description.trim() || undefined,
        cover: cover || undefined,
        coverInternal: coverInternal || undefined,
        mainObjectiveDescription: mainObjectiveDescription.trim(),
        mainObjectiveType,
        mainObjectiveMetric: mainObjectiveType === 'direct' ? mainObjectiveMetric : undefined,
        mainVideoReviews: [],
        mainPositions: mainPositions.filter((p) => p.prize > 0),
        secondaryObjectives: secondaryObjs
          .filter((o) => o.description.trim())
          .map((o, i) => ({
            id: `s${Date.now()}_${i}`,
            description: o.description,
            details: o.details?.trim() || undefined,
            type: o.type ?? 'ranking',
            ...(o.type === 'completion'
              ? { prizePerCompletion: o.prizePerCompletion ?? 0, maxCompletions: o.maxCompletions ?? 0, completions: [] }
              : { positions: (o.positions ?? []).filter((p: Position) => p.prize > 0) }
            ),
          })),
        startDate: toISODate(startDate),
        endDate: toISODate(endDate),
        rankingDate: toISODate(rankingDate) || undefined,
        paymentDeadline: toISODate(paymentDeadline) || undefined,
        validContent: validContent.filter((v) => v.title.trim() || v.url?.trim()).map((v) => ({ title: v.title.trim(), url: v.url?.trim() || undefined })),
        rules: rules.filter((r) => r.text.trim() || r.url?.trim()).map((r) => ({ text: r.text.trim(), url: r.url?.trim() || undefined })),
        paymentInfo: paymentInfo.trim() || undefined,
      })
      router.push('/admin/gerenciar')
    }, 600)
  }

  if (!isAdmin) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#AAFF00]/25 bg-[#AAFF00]/10 px-3 py-1.5 text-xs font-bold text-[#AAFF00] transition-all hover:bg-[#AAFF00] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
        >
          Voltar
        </button>
        <h1 className="text-xl font-black text-white">Criar Novo Campeonato</h1>
      </div>

      {errors.length > 0 && (
        <div
          className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
          role="alert"
          aria-live="polite"
        >
          <ul className="list-inside list-disc text-sm text-red-400 space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* Section: Identidade */}
        <section className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-5" aria-labelledby="sec-identidade">
          <h2 id="sec-identidade" className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
            Identidade
          </h2>
          <div className="flex flex-col gap-5">
            <InputField
              label="Nome do Campeonato"
              id="nome"
              value={name}
              onChange={setName}
              placeholder="Ex: Campeonato do Eagle Trindade"
              required
            />
            <TextareaField
              label="Descrição do Campeonato"
              id="description"
              value={description}
              onChange={setDescription}
              placeholder="Explique o objetivo geral do campeonato"
              rows={3}
            />

            {/* Cover upload */}
            <div>
              <label htmlFor="capa" className="mb-1.5 block text-xs font-medium text-[#888]">
                Capa Principal
                <span className="ml-1 text-[#444]">(1080 × 1400 px)</span>
              </label>
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <label
                  htmlFor="capa"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#1A1A1A] bg-[#111] px-6 py-5 text-center transition-colors hover:border-[#AAFF00]/40 focus-within:border-[#AAFF00]"
                >
                  <span className="text-2xl" aria-hidden="true">🖼️</span>
                  <span className="text-xs text-[#555]">Clique para selecionar imagem</span>
                  <input
                    id="capa"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="sr-only"
                    aria-label="Selecionar capa do campeonato"
                  />
                </label>
                {coverPreview && (
                  <div
                    className="relative flex-none overflow-hidden rounded-xl border border-[#1A1A1A]"
                    style={{ width: 90, aspectRatio: '1080/1400' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreview}
                      alt="Prévia da capa"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Internal cover upload */}
            <div>
              <label htmlFor="capa-interna" className="mb-1.5 block text-xs font-medium text-[#888]">
                Capa Interna
                <span className="ml-1 text-[#444]">(1920 × 600 px)</span>
              </label>
              <div className="flex flex-col items-start gap-4">
                <label
                  htmlFor="capa-interna"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#1A1A1A] bg-[#111] px-6 py-5 text-center transition-colors hover:border-[#AAFF00]/40 focus-within:border-[#AAFF00]"
                >
                  <span className="text-2xl" aria-hidden="true">🖼️</span>
                  <span className="text-xs text-[#555]">Clique para selecionar imagem</span>
                  <input
                    id="capa-interna"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Selecionar capa interna do campeonato"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string
                        setCoverInternal(result)
                        setCoverInternalPreview(result)
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
                {coverInternalPreview && (
                  <div
                    className="w-full overflow-hidden rounded-xl border border-[#1A1A1A]"
                    style={{ aspectRatio: '16/5' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverInternalPreview}
                      alt="Prévia da capa interna"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Objetivo Principal */}
        <section className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-5" aria-labelledby="sec-objetivo">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="sec-objetivo" className="text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
              Objetivo Principal
            </h2>
            {mainPositions.length < 20 && (
              <button
                type="button"
                onClick={addMainPosition}
                className="rounded-full border border-[#1A1A1A] px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
              >
                + Posição
              </button>
            )}
          </div>
          <div className="mb-4 flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-[#888]">Tipo</p>
              <div className="flex gap-2">
                {([['direct', 'Direto'], ['manual', 'Manual']] as [MainObjectiveType, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMainObjectiveType(val)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${mainObjectiveType === val ? 'bg-[#AAFF00] text-black' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-[#444]">
                {mainObjectiveType === 'direct' && 'Ranking calculado automaticamente a partir dos dados da plataforma.'}
                {mainObjectiveType === 'manual' && 'Você atribui as posições manualmente no painel de gerenciamento.'}
              </p>
            </div>

            {mainObjectiveType === 'direct' && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-[#888]">Métrica</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(DIRECT_METRIC_LABEL) as [DirectMetric, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMainObjectiveMetric(val)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${mainObjectiveMetric === val ? 'bg-[#AAFF00]/20 text-[#AAFF00] border border-[#AAFF00]/40' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="main-obj-desc" className="mb-1.5 block text-xs font-medium text-[#888]">
                Nome do Objetivo
              </label>
              <input
                id="main-obj-desc"
                type="text"
                value={mainObjectiveDescription}
                onChange={(e) => setMainObjectiveDescription(e.target.value)}
                placeholder="Ex: Ranking de Views"
                autoComplete="off"
                className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-2.5 text-sm font-medium text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {mainPositions.map((pos) => (
              <div key={pos.place} className="flex items-center gap-3">
                <span className="w-14 flex-none text-xs font-bold text-[#555]">
                  {pos.place}º lugar
                </span>
                <div className="flex-1">
                  <label htmlFor={`main-place-${pos.place}`} className="sr-only">
                    Prêmio do {pos.place}º lugar
                  </label>
                  <PrizeInput
                    id={`main-place-${pos.place}`}
                    value={pos.prize}
                    onChange={(n) => updateMainPosition(pos.place, n)}
                    aria-label={`Prêmio do ${pos.place}º lugar`}
                    className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-4 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                  />
                </div>
                {mainPositions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMainPosition(pos.place)}
                    className="flex-none text-xs text-[#333] transition-colors hover:text-red-400"
                    aria-label={`Remover ${pos.place}º lugar`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section: Objetivos Secundários */}
        <section className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-5" aria-labelledby="sec-secundario">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="sec-secundario" className="text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
              Objetivos Secundários
            </h2>
            <button
              type="button"
              onClick={addSecondaryObj}
              className="rounded-full border border-[#1A1A1A] px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]"
            >
              + Adicionar
            </button>
          </div>
          <div className="flex flex-col gap-5">
            {secondaryObjs.map((obj, i) => (
              <div key={i} className="rounded-xl border border-[#1A1A1A] bg-[#111] p-4">
                {/* Header: nome + remover */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex-1">
                    <label htmlFor={`sec-desc-${i}`} className="sr-only">
                      Nome do objetivo secundário {i + 1}
                    </label>
                    <input
                      id={`sec-desc-${i}`}
                      type="text"
                      value={obj.description}
                      onChange={(e) => updateSecondaryDesc(i, e.target.value)}
                      placeholder="Ex: Melhores Edições…"
                      autoComplete="off"
                      className="w-full rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-2.5 text-sm font-medium text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                    />
                  </div>
                  {secondaryObjs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSecondaryObj(i)}
                      className="flex-none rounded-lg border border-[#1A1A1A] px-3 py-2.5 text-sm text-[#555] transition-colors hover:border-red-500/40 hover:text-red-400"
                      aria-label={`Remover objetivo ${i + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Optional details */}
                <div className="mb-4">
                  <label htmlFor={`sec-details-${i}`} className="sr-only">
                    Descrição / explicação do objetivo {i + 1}
                  </label>
                  <textarea
                    id={`sec-details-${i}`}
                    value={obj.details ?? ''}
                    onChange={(e) => updateSecondaryDetails(i, e.target.value)}
                    placeholder="Explique como esse objetivo funciona"
                    rows={2}
                    className="w-full resize-y rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                  />
                </div>

                {/* Type selector */}
                <div className="mb-3">
                <p className="mb-1.5 text-xs font-medium text-[#888]">Tipo</p>
                <div className="flex flex-wrap gap-2">
                  {([['direct', 'Direto'], ['subjective', 'Manual'], ['completion', 'Conclusão']] as [SecondaryObjective['type'], string][]).map(([t, label]) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateSecondaryType(i, t)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${(obj.type ?? 'subjective') === t ? 'bg-[#AAFF00] text-black' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                </div>

                {/* Type hints */}
                {obj.type === 'direct' && (
                  <p className="mb-3 text-[10px] text-[#444]">Ranking calculado automaticamente a partir dos dados da plataforma.</p>
                )}
                {(obj.type === 'subjective' || obj.type === 'ranking') && (
                  <p className="mb-3 text-[10px] text-[#444]">Você atribui as posições manualmente no painel de gerenciamento.</p>
                )}
                {obj.type === 'completion' && (
                  <p className="mb-3 text-[10px] text-[#444]">Cada participante recebe um prêmio fixo ao cumprir o objetivo. Você registra as conclusões no painel de gerenciamento.</p>
                )}

                {/* Direct: metric selector */}
                {obj.type === 'direct' && (
                  <div className="mb-3">
                  <p className="mb-1.5 text-xs font-medium text-[#888]">Métrica</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(DIRECT_METRIC_LABEL) as [DirectMetric, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateSecondaryMetric(i, val)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${(obj.metric ?? 'views_totais') === val ? 'bg-[#AAFF00]/20 text-[#AAFF00] border border-[#AAFF00]/40' : 'border border-[#1A1A1A] text-[#555] hover:text-white'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  </div>
                )}

                {/* Direct/Subjective/Ranking: positions */}
                {(obj.type === 'direct' || obj.type === 'subjective' || obj.type === 'ranking' || !obj.type) && (
                  <>
                    <div className="flex flex-col gap-2">
                      {(obj.positions ?? []).map((pos: Position) => (
                        <div key={pos.place} className="flex items-center gap-3">
                          <span className="w-14 flex-none text-xs font-bold text-[#555]">
                            {pos.place}º lugar
                          </span>
                          <div className="flex-1">
                            <label htmlFor={`sec-${i}-place-${pos.place}`} className="sr-only">
                              Prêmio do {pos.place}º lugar — {obj.description}
                            </label>
                            <PrizeInput
                              id={`sec-${i}-place-${pos.place}`}
                              value={pos.prize}
                              onChange={(n) => updateSecondaryPosition(i, pos.place, n)}
                              aria-label={`Prêmio do ${pos.place}º lugar — ${obj.description}`}
                              className="w-full rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                            />
                          </div>
                          {(obj.positions ?? []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePosition(i, pos.place)}
                              className="flex-none text-xs text-[#333] transition-colors hover:text-red-400"
                              aria-label={`Remover ${pos.place}º lugar`}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {(obj.positions ?? []).length < 20 && (
                      <button
                        type="button"
                        onClick={() => addPosition(i)}
                        className="mt-3 text-xs text-[#444] transition-colors hover:text-[#AAFF00]"
                      >
                        + Adicionar posição
                      </button>
                    )}
                  </>
                )}

                {/* Completion: prize + limit */}
                {obj.type === 'completion' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label htmlFor={`sec-${i}-prize`} className="mb-1.5 block text-xs text-[#555]">
                          Prêmio por conclusão (R$)
                        </label>
                        <PrizeInput
                          id={`sec-${i}-prize`}
                          value={obj.prizePerCompletion ?? 0}
                          onChange={(n) => updateCompletionPrize(i, n)}
                          aria-label="Prêmio por conclusão"
                          className="w-full rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`sec-${i}-max`} className="mb-1.5 block text-xs text-[#555]">
                          Limite de conclusões
                        </label>
                        <input
                          id={`sec-${i}-max`}
                          type="number"
                          value={obj.maxCompletions || ''}
                          onChange={(e) => updateCompletionMax(i, e.target.value)}
                          placeholder="Ex: 20"
                          autoComplete="off"
                          className="w-full rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                        />
                      </div>
                    </div>
                    {(obj.prizePerCompletion ?? 0) > 0 && (obj.maxCompletions ?? 0) > 0 && (
                      <p className="text-xs text-[#555]">
                        Premiação total possível:{' '}
                        <span className="font-bold text-[#AAFF00]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format((obj.prizePerCompletion ?? 0) * (obj.maxCompletions ?? 0))}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section: Calendário */}
        <section className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-5" aria-labelledby="sec-calendario">
          <h2 id="sec-calendario" className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
            Calendário
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Data de Início"
              id="startDate"
              type="text"
              value={startDate}
              onChange={(v) => setStartDate(applyDateMask(v))}
              placeholder="dd/mm/aaaa"
              required
            />
            <InputField
              label="Data de Término"
              id="endDate"
              type="text"
              value={endDate}
              onChange={(v) => setEndDate(applyDateMask(v))}
              placeholder="dd/mm/aaaa"
              required
            />
            <InputField
              label="Data de Ranking Final"
              id="rankingDate"
              type="text"
              value={rankingDate}
              onChange={(v) => setRankingDate(applyDateMask(v))}
              placeholder="dd/mm/aaaa"
              hint="Quando o ranking será fechado definitivamente"
            />
            <InputField
              label="Limite de Pagamento"
              id="paymentDeadline"
              type="text"
              value={paymentDeadline}
              onChange={(v) => setPaymentDeadline(applyDateMask(v))}
              placeholder="dd/mm/aaaa"
              hint="Prazo máximo para os pagamentos serem efetuados"
            />
          </div>
        </section>

        {/* Section: Conteúdo, Regras e Pagamento */}
        <section className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-5" aria-labelledby="sec-regras">
          <h2 id="sec-regras" className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#555]">
            Conteúdo, Regras e Pagamento
          </h2>
          <div className="flex flex-col gap-6">
            {/* Conteúdos Válidos */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-medium text-[#888]">
                  Conteúdos Válidos<span className="ml-0.5 text-[#AAFF00]" aria-hidden="true">*</span>
                </label>
                {validContent.length < 20 && (
                  <button type="button" onClick={addValidContent}
                    className="rounded-full border border-[#1A1A1A] px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]">
                    + Adicionar
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {validContent.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-2.5 w-7 flex-none text-center text-xs font-bold tabular-nums text-[#444]">
                      {i + 1}.
                    </span>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <textarea
                        value={item.title}
                        onChange={(e) => updateValidContentField(i, 'title', e.target.value)}
                        placeholder={`Conteúdo ${i + 1}…`}
                        rows={2}
                        aria-label={`Descrição do conteúdo ${i + 1}`}
                        className="w-full resize-y rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                      <input
                        type="url"
                        value={item.url ?? ''}
                        onChange={(e) => updateValidContentField(i, 'url', e.target.value)}
                        placeholder="Link (opcional)…"
                        aria-label={`Link do conteúdo ${i + 1}`}
                        autoComplete="off"
                        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                    </div>
                    {validContent.length > 1 && (
                      <button type="button" onClick={() => removeValidContent(i)}
                        className="mt-2.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#1A1A1A] text-[#555] transition-colors hover:border-red-500/40 hover:text-red-400"
                        aria-label={`Remover conteúdo ${i + 1}`}>×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Regras */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-medium text-[#888]">
                  Regras do Campeonato<span className="ml-0.5 text-[#AAFF00]" aria-hidden="true">*</span>
                </label>
                {rules.length < 20 && (
                  <button type="button" onClick={addRule}
                    className="rounded-full border border-[#1A1A1A] px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#AAFF00]/40 hover:text-[#AAFF00]">
                    + Adicionar regra
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-2.5 w-7 flex-none text-center text-xs font-bold tabular-nums text-[#444]">
                      {i + 1}.
                    </span>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <textarea
                        value={rule.text}
                        onChange={(e) => updateRule(i, 'text', e.target.value)}
                        placeholder={`Regra ${i + 1}…`}
                        rows={2}
                        aria-label={`Texto da regra ${i + 1}`}
                        className="w-full resize-y rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                      <input
                        type="url"
                        value={rule.url ?? ''}
                        onChange={(e) => updateRule(i, 'url', e.target.value)}
                        placeholder="Link (opcional)…"
                        aria-label={`Link da regra ${i + 1}`}
                        autoComplete="off"
                        className="w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#333] transition-colors focus-visible:border-[#AAFF00] focus-visible:outline-none"
                      />
                    </div>
                    {rules.length > 1 && (
                      <button type="button" onClick={() => removeRule(i)}
                        className="mt-2.5 flex-none text-xs text-[#333] transition-colors hover:text-red-400"
                        aria-label={`Remover regra ${i + 1}`}>×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Informações sobre o Pagamento */}
            <TextareaField
              label="Informações sobre o Pagamento"
              id="paymentInfo"
              value={paymentInfo}
              onChange={setPaymentInfo}
              placeholder="Descreva como será feito o pagamento, chave Pix, prazo, condições…"
              rows={4}
            />
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#AAFF00] py-3.5 text-sm font-bold text-black transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" aria-hidden="true" />
              Criando…
            </>
          ) : (
            'Criar Campeonato'
          )}
        </button>
      </form>
    </div>
  )
}
