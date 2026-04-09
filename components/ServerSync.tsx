'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export default function ServerSync() {
  const loadFromServer = useStore((s) => s.loadFromServer)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load authoritative data from KV on first render
  useEffect(() => {
    loadFromServer()
  }, [loadFromServer])

  // Auto-sync to KV whenever championships change (admin only, debounced)
  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      if (state.championships !== prevState.championships && state.isAdmin) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          useStore.getState().syncToServer()
        }, 1500)
      }
    })
    return () => {
      unsub()
      clearTimeout(timerRef.current)
    }
  }, [])

  return null
}
