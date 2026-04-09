'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export default function ServerSync() {
  const loadFromServer = useStore((s) => s.loadFromServer)
  const isAdmin = useStore((s) => s.isAdmin)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load from server once on mount (for everyone)
  // Admin: only this initial load — local changes are authoritative after that
  // Visitors: also poll every 30s to see admin updates
  useEffect(() => {
    loadFromServer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic refresh only for visitors (not admin — would overwrite pending edits)
  useEffect(() => {
    if (isAdmin) return
    const interval = setInterval(loadFromServer, 30_000)
    return () => clearInterval(interval)
  }, [isAdmin, loadFromServer])

  // Auto-sync to server when admin changes championships (debounced 800ms)
  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      if (state.championships !== prevState.championships && state.isAdmin) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          useStore.getState().syncToServer().catch(() => {})
        }, 800)
      }
    })
    return () => {
      unsub()
      clearTimeout(timerRef.current)
    }
  }, [])

  return null
}
