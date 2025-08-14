'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type DailyCall = any

export type DailyVoiceStatus =
  | 'idle'
  | 'joining'
  | 'joined'
  | 'leaving'
  | 'error'

interface JoinResult {
  roomUrl: string
  token: string
}

async function fetchDailyToken(): Promise<JoinResult> {
  const res = await fetch('/api/daily/token')
  if (!res.ok) throw new Error(`token_http_${res.status}`)
  const json = await res.json()
  if (!json?.roomUrl || !json?.token) throw new Error('token_missing')
  return { roomUrl: json.roomUrl, token: json.token }
}

export function useDailyVoice() {
  const callRef = useRef<DailyCall | null>(null)
  const [status, setStatus] = useState<DailyVoiceStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const join = useCallback(async () => {
    if (status === 'joining' || status === 'joined') return true
    setError(null)
    setStatus('joining')
    try {
      const DailyIframe = (await import('@daily-co/daily-js')).default
      if (!callRef.current) {
        callRef.current = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: false
        })
      }
      const { roomUrl, token } = await fetchDailyToken()
      await callRef.current.join({ url: roomUrl, token })
      setStatus('joined')
      return true
    } catch (e: any) {
      setError(e?.message || String(e))
      setStatus('error')
      return false
    }
  }, [status])

  const leave = useCallback(async () => {
    if (!callRef.current) return
    setStatus('leaving')
    try {
      await callRef.current.leave()
    } catch {}
    try {
      callRef.current.destroy?.()
    } catch {}
    callRef.current = null
    setStatus('idle')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callRef.current) {
        try { callRef.current.leave() } catch {}
        try { callRef.current.destroy?.() } catch {}
        callRef.current = null
      }
    }
  }, [])

  return { status, error, join, leave }
}


