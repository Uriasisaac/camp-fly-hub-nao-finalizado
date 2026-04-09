'use client'
import { useEffect, useRef } from 'react'
import { useStore, markLocalMutation } from '@/lib/store'

export default function ServerSync() {
  const loadFromServer = useStore((s) => s.loadFromServer)
  const isAdmin = useStore((s) => s.isAdmin)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load from server once on mount (for everyone).
  // loadFromServer internally checks if a local mutation happened during the
  // fetch and discards the response if so — no race condition.
  useEffect(() => {
    loadFromServer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic refresh for visitors (admin never polls — would overwrite pending edits)
  useEffect(() => {
    if (isAdmin) return
    const interval = setInterval(loadFromServer, 30_000)
    return () => clearInterval(interval)
  }, [isAdmin, loadFromServer])

  // Auto-sync to server when admin changes championships (debounced 800ms).
  // markLocalMutation() is called immediately so loadFromServer knows a change
  // happened — even if the debounced sync hasn't fired yet.
  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      if (state.championships !== prevState.championships && state.isAdmin) {
        markLocalMutation()
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
