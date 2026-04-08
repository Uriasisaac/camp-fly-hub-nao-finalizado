export interface Participant {
  id: string
  name: string
  handle: string
}

export interface ValidContentItem {
  title: string
  url?: string
}

export interface RuleItem {
  text: string
  url?: string
}

export function getRuleText(rule: string | RuleItem): string {
  return typeof rule === 'string' ? rule : rule.text
}
export function getRuleUrl(rule: string | RuleItem): string | undefined {
  return typeof rule === 'string' ? undefined : rule.url
}

export type DirectMetric = 'views_totais' | 'melhor_video'

export const DIRECT_METRIC_LABEL: Record<DirectMetric, string> = {
  views_totais: 'Views Totais',
  melhor_video: '+ Views P/ Vídeo',
}

export interface VideoReview {
  videoId: string
  participantId: string
  place: number | null
}

export interface Video {
  id: string
  participantId: string
  title: string
  views: number
  postedAt: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'kwai'
  url?: string
}

export interface Position {
  place: number
  prize: number
  winnerId?: string
}

export interface SecondaryObjective {
  id: string
  description: string
  details?: string
  type?: 'ranking' | 'completion' | 'direct' | 'subjective'
  // direct
  metric?: DirectMetric
  // ranking / subjective / direct — prize structure
  positions?: Position[]
  // completion
  prizePerCompletion?: number
  maxCompletions?: number
  completions?: { participantId: string }[]
  // subjective — admin video reviews
  videoReviews?: VideoReview[]
}

export interface RankingEntry {
  position: number
  participantId: string
  views: number
  prize?: number
  adminAssigned?: boolean
}

export type MainObjectiveType = 'direct' | 'subjective' | 'manual'

export interface Championship {
  id: string
  name: string
  description?: string
  cover?: string
  coverInternal?: string
  coverGradient?: string
  mainObjectiveDescription: string
  mainObjectiveType?: MainObjectiveType
  mainObjectiveMetric?: DirectMetric
  mainVideoReviews?: VideoReview[]
  mainPositions: Position[]
  secondaryObjectives: SecondaryObjective[]
  startDate: string
  endDate: string
  rankingDate?: string
  paymentDeadline?: string
  validContent: ValidContentItem[]
  rules: Array<string | RuleItem>
  paymentInfo?: string
  participants: Participant[]
  videos: Video[]
  ranking: RankingEntry[]
  status: 'active' | 'finished' | 'upcoming'
}

export function getEffectiveStatus(c: Championship): 'active' | 'finished' | 'upcoming' {
  const now = new Date()
  if (new Date(c.endDate + 'T23:59:59') < now) return 'finished'
  if (new Date(c.startDate + 'T00:00:00') > now) return 'upcoming'
  return 'active'
}

export function computeDirectRanking(
  c: Championship,
  metric: DirectMetric,
  positions: Position[]
): RankingEntry[] {
  const scores = c.participants.map((p) => {
    const pvids = c.videos.filter((v) => v.participantId === p.id)
    let score = 0
    if (metric === 'views_totais') score = pvids.reduce((s, v) => s + v.views, 0)
    else if (metric === 'melhor_video') score = pvids.length ? Math.max(...pvids.map((v) => v.views)) : 0
    return { participantId: p.id, score }
  })
  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({
      position: i + 1,
      participantId: s.participantId,
      views: s.score,
      prize: positions[i]?.prize ?? 0,
      adminAssigned: false,
    }))
}

export function buildSubjectiveRanking(
  reviews: VideoReview[],
  positions: Position[],
  c: Championship
): RankingEntry[] {
  return reviews
    .filter((r) => r.place !== null)
    .sort((a, b) => (a.place as number) - (b.place as number))
    .map((r) => {
      const video = c.videos.find((v) => v.id === r.videoId)
      return {
        position: r.place as number,
        participantId: r.participantId,
        views: video?.views ?? 0,
        prize: positions[(r.place as number) - 1]?.prize ?? 0,
        adminAssigned: true,
      }
    })
}

export function getEffectiveMainRanking(c: Championship): RankingEntry[] {
  if (c.mainObjectiveType === 'direct' && c.mainObjectiveMetric) {
    return computeDirectRanking(c, c.mainObjectiveMetric, c.mainPositions)
  }
  if (c.mainObjectiveType === 'subjective') {
    return buildSubjectiveRanking(c.mainVideoReviews ?? [], c.mainPositions, c)
  }
  return c.ranking
}

export function getPendingReviewCount(championships: Championship[]): number {
  let count = 0
  for (const c of championships) {
    const allIds = new Set(c.videos.map((v) => v.id))
    if (c.mainObjectiveType === 'subjective') {
      const reviewed = new Set((c.mainVideoReviews ?? []).map((r) => r.videoId))
      allIds.forEach((id) => { if (!reviewed.has(id)) count++ })
    }
    for (const obj of c.secondaryObjectives) {
      if (obj.type === 'subjective') {
        const reviewed = new Set((obj.videoReviews ?? []).map((r) => r.videoId))
        allIds.forEach((id) => { if (!reviewed.has(id)) count++ })
      }
    }
  }
  return count
}

export function getTotalPrize(c: Championship): number {
  const main = c.mainPositions.reduce((s, p) => s + p.prize, 0)
  const secondary = c.secondaryObjectives.reduce((s, o) => {
    if (o.type === 'completion') return s + (o.prizePerCompletion ?? 0) * (o.maxCompletions ?? 0)
    return s + (o.positions ?? []).reduce((ps, p) => ps + p.prize, 0)
  }, 0)
  return main + secondary
}

export function getMainTotal(c: Championship): number {
  return c.mainPositions.reduce((s, p) => s + p.prize, 0)
}

export function getDistributedPrize(c: Championship): number {
  const mainRanking = getEffectiveMainRanking(c)
  const main = mainRanking.filter((r) => r.prize && r.prize > 0).reduce((s, r) => s + (r.prize ?? 0), 0)
  const secondary = c.secondaryObjectives.reduce((s, o) => {
    if (o.type === 'completion') return s + (o.completions ?? []).length * (o.prizePerCompletion ?? 0)
    if (o.type === 'direct' && o.metric) {
      const ranking = computeDirectRanking(c, o.metric, o.positions ?? [])
      return s + ranking.filter((r) => r.prize && r.prize > 0).reduce((ps, r) => ps + (r.prize ?? 0), 0)
    }
    if (o.type === 'subjective') {
      const ranking = buildSubjectiveRanking(o.videoReviews ?? [], o.positions ?? [], c)
      return s + ranking.reduce((ps, r) => ps + (r.prize ?? 0), 0)
    }
    // ranking (legacy)
    return s + (o.positions ?? []).filter((p) => p.winnerId).reduce((ps, p) => ps + p.prize, 0)
  }, 0)
  return main + secondary
}
