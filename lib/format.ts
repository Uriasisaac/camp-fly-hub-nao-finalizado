/** Aplica máscara de data dd/mm/aaaa enquanto o usuário digita */
export function applyDateMask(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** Completa o ano atual ao sair do campo (onBlur), se só dia/mês foram digitados */
export function completeDateYear(v: string): string {
  const d = v.replace(/\D/g, '')
  if (d.length === 4) return `${d.slice(0, 2)}/${d.slice(2)}/${new Date().getFullYear()}`
  return applyDateMask(v)
}

/** "25/04/2026" → "2026-04-25" */
export function toISODate(br: string): string {
  const parts = br.split('/')
  if (parts.length !== 3 || parts[2].length < 4) return ''
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
}

/** "2026-04-25" → "25/04/2026" */
export function toBRDate(iso: string): string {
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.split('-')
  return d && m && y ? `${d}/${m}/${y}` : ''
}

/** Formata número como moeda BR: 3000 → "R$ 3.000,00" */
export function formatPrizeBR(n: number): string {
  if (!n) return ''
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** "R$ 3.000,00" ou "3.000" ou "3000" → número */
export function parsePrizeBR(s: string): number {
  const cleaned = s.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim()
  return parseFloat(cleaned) || 0
}
