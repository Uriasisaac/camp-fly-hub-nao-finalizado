'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Championship, RankingEntry, Participant, VideoReview } from './types'
import { MOCK_CHAMPIONSHIPS } from './mock-data'

interface AppStore {
  championships: Championship[]
  isAdmin: boolean
  login: () => void
  logout: () => void
  resetToDefaults: () => void
  addChampionship: (data: Omit<Championship, 'id' | 'participants' | 'videos' | 'ranking' | 'status'>) => void
  updateChampionshipInfo: (id: string, fields: {
    name?: string; description?: string; cover?: string; coverInternal?: string
    rankingDate?: string; paymentDeadline?: string; paymentInfo?: string
    validContent?: Championship['validContent']; rules?: Championship['rules']
  }) => void
  deleteChampionship: (id: string) => void
  updateRanking: (id: string, ranking: RankingEntry[]) => void
  assignMainPositionWinner: (cId: string, place: number, winnerId: string) => void
  assignSecondaryWinner: (cId: string, oId: string, place: number, winnerId: string) => void
  addCompletion: (cId: string, oId: string, participantId: string) => void
  removeCompletion: (cId: string, oId: string, index: number) => void
  addParticipant: (cId: string, participant: Omit<Participant, 'id'>) => void
  removeParticipant: (cId: string, participantId: string) => void
  // Video review actions
  setMainVideoReview: (cId: string, review: VideoReview) => void
  setObjVideoReview: (cId: string, objId: string, review: VideoReview) => void
  removeMainVideoReview: (cId: string, videoId: string) => void
  removeObjVideoReview: (cId: string, objId: string, videoId: string) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      championships: MOCK_CHAMPIONSHIPS,
      isAdmin: false,

      login: () => set({ isAdmin: true }),
      logout: () => set({ isAdmin: false }),
      resetToDefaults: () => set({ championships: MOCK_CHAMPIONSHIPS }),

      addChampionship: (data) => {
        const newChamp: Championship = {
          ...data,
          id: Date.now().toString(),
          participants: [],
          videos: [],
          ranking: [],
          status: 'upcoming',
        }
        set((s) => ({ championships: [...s.championships, newChamp] }))
      },

      updateChampionshipInfo: (id, fields) => {
        set((s) => ({
          championships: s.championships.map((c) => c.id === id ? { ...c, ...fields } : c),
        }))
      },

      updateRanking: (id, ranking) => {
        set((s) => ({
          championships: s.championships.map((c) => c.id === id ? { ...c, ranking } : c),
        }))
      },

      assignMainPositionWinner: (cId, place, winnerId) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? { ...c, mainPositions: c.mainPositions.map((p) => p.place === place ? { ...p, winnerId } : p) }
              : c
          ),
        }))
      },

      assignSecondaryWinner: (cId, oId, place, winnerId) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? {
                  ...c,
                  secondaryObjectives: c.secondaryObjectives.map((o) =>
                    o.id === oId
                      ? { ...o, positions: (o.positions ?? []).map((p) => p.place === place ? { ...p, winnerId } : p) }
                      : o
                  ),
                }
              : c
          ),
        }))
      },

      deleteChampionship: (id) => {
        set((s) => ({ championships: s.championships.filter((c) => c.id !== id) }))
      },

      addCompletion: (cId, oId, participantId) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? {
                  ...c,
                  secondaryObjectives: c.secondaryObjectives.map((o) =>
                    o.id === oId
                      ? { ...o, completions: [...(o.completions ?? []), { participantId }] }
                      : o
                  ),
                }
              : c
          ),
        }))
      },

      removeCompletion: (cId, oId, index) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? {
                  ...c,
                  secondaryObjectives: c.secondaryObjectives.map((o) =>
                    o.id === oId
                      ? { ...o, completions: (o.completions ?? []).filter((_, i) => i !== index) }
                      : o
                  ),
                }
              : c
          ),
        }))
      },

      addParticipant: (cId, participant) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? { ...c, participants: [...c.participants, { ...participant, id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }] }
              : c
          ),
        }))
      },

      removeParticipant: (cId, participantId) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? { ...c, participants: c.participants.filter((p) => p.id !== participantId) }
              : c
          ),
        }))
      },

      setMainVideoReview: (cId, review) => {
        set((s) => ({
          championships: s.championships.map((c) => {
            if (c.id !== cId) return c
            const existing = (c.mainVideoReviews ?? []).filter((r) => r.videoId !== review.videoId)
            return { ...c, mainVideoReviews: [...existing, review] }
          }),
        }))
      },

      removeMainVideoReview: (cId, videoId) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? { ...c, mainVideoReviews: (c.mainVideoReviews ?? []).filter((r) => r.videoId !== videoId) }
              : c
          ),
        }))
      },

      setObjVideoReview: (cId, objId, review) => {
        set((s) => ({
          championships: s.championships.map((c) => {
            if (c.id !== cId) return c
            return {
              ...c,
              secondaryObjectives: c.secondaryObjectives.map((o) => {
                if (o.id !== objId) return o
                const existing = (o.videoReviews ?? []).filter((r) => r.videoId !== review.videoId)
                return { ...o, videoReviews: [...existing, review] }
              }),
            }
          }),
        }))
      },

      removeObjVideoReview: (cId, objId, videoId) => {
        set((s) => ({
          championships: s.championships.map((c) =>
            c.id === cId
              ? {
                  ...c,
                  secondaryObjectives: c.secondaryObjectives.map((o) =>
                    o.id === objId
                      ? { ...o, videoReviews: (o.videoReviews ?? []).filter((r) => r.videoId !== videoId) }
                      : o
                  ),
                }
              : c
          ),
        }))
      },
    }),
    {
      name: 'fly-hub-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
