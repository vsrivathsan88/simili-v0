// Enhanced WebSocket Client with Socket.IO-like Reliability
// Provides auto-reconnection, message buffering, and robust error handling

'use client'

// Module-level cache to avoid repeated /api/gemini-live calls across re-mounts
let CACHED_WS_URL: string | null = null
let IN_FLIGHT_WS_URL_PROMISE: Promise<string> | null = null

import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  lastError: string | null
  geminiConnected: boolean
  reconnectAttempts: number
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

interface UseWebSocketReturn {
  state: WebSocketState
  sendToGemini: (message: Record<string, unknown>) => void
  sendCanvasUpdate: (canvasData: Record<string, unknown>) => void
  setupGemini: (config: Record<string, unknown>) => void
  connect: () => Promise<void>
  disconnect: () => void
}

export function useSocketIO(
  onGeminiResponse?: (response: GeminiResponse) => void,
  onStatusChange?: (status: string) => void
): UseWebSocketReturn {
  const liveDisabled = process.env.NEXT_PUBLIC_DISABLE_LIVE_WS === 'true'
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    lastError: null,
    geminiConnected: false,
    reconnectAttempts: 0
  })

  const onGeminiResponseRef = useRef(onGeminiResponse)
  const onStatusChangeRef = useRef(onStatusChange)
  const messageQueue = useRef<Record<string, unknown>[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const setupQueuedOrSent = useRef<boolean>(false)
  const inFlightConnect = useRef<boolean>(false)
  const wsUrlRef = useRef<string | null>(null)

  // Update refs when callbacks change
  useEffect(() => {
    onGeminiResponseRef.current = onGeminiResponse
    onStatusChangeRef.current = onStatusChange
  }, [onGeminiResponse, onStatusChange])

  // Get WebSocket URL from server
  const getWebSocketUrl = useCallback(async (): Promise<string> => {
    try {
      if (CACHED_WS_URL) {
        wsUrlRef.current = CACHED_WS_URL
        return CACHED_WS_URL
      }
      // Prefer local relay if available
      const relayUrl = `ws://localhost:${process.env.NEXT_PUBLIC_LIVE_RELAY_PORT || 8787}/live`
      CACHED_WS_URL = relayUrl
      wsUrlRef.current = relayUrl
      return relayUrl
    } catch (error) {
      console.error('❌ Failed to get WebSocket URL:', error)
      IN_FLIGHT_WS_URL_PROMISE = null
      throw error
    }
  }, [])

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (liveDisabled) {
      console.log('🔇 Live WS disabled by flag (NEXT_PUBLIC_DISABLE_LIVE_WS=true)')
      return
    }
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    if (inFlightConnect.current) return
    inFlightConnect.current = true
    setState(prev => ({ ...prev, isConnecting: true, lastError: null }))

    try {
      const wsUrl = await getWebSocketUrl()
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('🔗 WebSocket connected to Gemini Live')
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          lastError: null,
          reconnectAttempts: 0
        }))
        onStatusChangeRef.current?.('connected')
        inFlightConnect.current = false

        // Process queued messages
        while (messageQueue.current.length > 0) {
          const queuedMessage = messageQueue.current.shift()
          if (queuedMessage) {
            ws.send(JSON.stringify(queuedMessage))
          }
        }
      }

      ws.onmessage = (event) => {
        const handlePayload = (raw: string) => {
          try {
            const data = JSON.parse(raw)

            // Setup acknowledgement (different casings)
            if (data.setupComplete === true || data.setup_complete === true) {
              setState(prev => ({ ...prev, geminiConnected: true }))
              onStatusChangeRef.current?.('gemini_connected')
              return
            }

            // Server content mapping
            const serverContent = data.serverContent || data.server_content
            const modelTurn = serverContent?.modelTurn || serverContent?.model_turn
            const parts = modelTurn?.parts
            if (Array.isArray(parts)) {
              if (!state.geminiConnected) {
                setState(prev => ({ ...prev, geminiConnected: true }))
                onStatusChangeRef.current?.('gemini_connected')
              }
              const firstText = parts.find((p: any) => typeof p.text === 'string')?.text
              if (firstText) {
                console.log('📨 Received Gemini response')
                onGeminiResponseRef.current?.({ text: firstText } as any)
                return
              }
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error)
          }
        }

        if (typeof event.data === 'string') {
          handlePayload(event.data)
        } else if (event.data instanceof Blob) {
          event.data.text().then(handlePayload).catch(err => {
            console.error('❌ Error reading Blob message:', err)
          })
        } else if (event.data instanceof ArrayBuffer) {
          try {
            const text = new TextDecoder().decode(event.data)
            handlePayload(text)
          } catch (err) {
            console.error('❌ Error decoding ArrayBuffer message:', err)
          }
        } else {
          console.warn('⚠️ Unknown message type from WS:', typeof event.data)
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setState(prev => ({
          ...prev,
          isConnected: false,
          geminiConnected: false,
          isConnecting: false
        }))
        onStatusChangeRef.current?.('disconnected')
        inFlightConnect.current = false

        // Clear heartbeat (not used with Gemini Live schema)
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current)
          heartbeatInterval.current = null
        }

        // Allow setup to be sent again on next connect
        setupQueuedOrSent.current = false

        // Stop reconnecting for policy violations (e.g., wrong model)
        if (event.code === 1008) {
          setState(prev => ({
            ...prev,
            lastError: event.reason || 'Policy error (1008)'
          }))
          return
        }

        // Auto-reconnect with exponential backoff
        if (state.reconnectAttempts < 10) {
          const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000)
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts + 1})`)
          
          reconnectTimeout.current = setTimeout(() => {
            setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }))
            onStatusChangeRef.current?.('reconnecting')
            connect()
          }, delay)
        } else {
          setState(prev => ({ 
            ...prev, 
            lastError: 'Max reconnection attempts reached',
            reconnectAttempts: 0
          }))
          onStatusChangeRef.current?.('failed')
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setState(prev => ({ 
          ...prev, 
          lastError: 'Connection error',
          isConnecting: false
        }))
        inFlightConnect.current = false
      }

      wsRef.current = ws
    } catch (error) {
      console.error('❌ Failed to connect:', error)
      setState(prev => ({ 
        ...prev, 
        lastError: error instanceof Error ? error.message : 'Connection failed',
        isConnecting: false
      }))
      inFlightConnect.current = false
    }
  }, [getWebSocketUrl, state.reconnectAttempts, liveDisabled])

  // Setup Gemini Live connection (maps to BidiGenerateContent schema)
  const setupGemini = useCallback((rawConfig: Record<string, unknown>) => {
    if (setupQueuedOrSent.current) return
    const cfg = rawConfig as Record<string, any>
    const setup: any = {
      generationConfig: {
        temperature: Number(cfg?.generationConfig?.temperature ?? 0.7),
        maxOutputTokens: Number(cfg?.generationConfig?.maxOutputTokens ?? 96)
      },
      systemInstruction: {
        parts: [{ text: String(cfg.systemInstruction ?? '') }]
      }
    }
    if (typeof cfg.model === 'string' && cfg.model.trim()) {
      setup.model = cfg.model.startsWith('models/') ? cfg.model : `models/${cfg.model}`
    }
    const payload = { setup }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
      setupQueuedOrSent.current = true
    } else {
      console.warn('⚠️  WebSocket not connected, queuing Gemini setup')
      messageQueue.current.push(payload)
      setupQueuedOrSent.current = true
    }
  }, [])

  // Send message to Gemini Live (map to client_content)
  const sendToGemini = useCallback((message: Record<string, unknown>) => {
    const msg = message as Record<string, any>
    let text: string | undefined
    if (typeof msg.text === 'string') text = msg.text
    else if (Array.isArray(msg.contents) && msg.contents[0]?.parts?.[0]?.text) text = String(msg.contents[0].parts[0].text)

    const payload = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: text ? [{ text }] : []
          }
        ],
        turnComplete: true
      }
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    } else {
      console.log('📦 Queuing message for Gemini (disconnected)')
      messageQueue.current.push(payload)
      // Do not auto-connect here; connection is triggered explicitly by Start Pi
    }
  }, [connect])

  // Send canvas update
  const sendCanvasUpdate = useCallback((canvasData: Record<string, unknown>) => {
    const payload = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: String(canvasData?.base64Png ?? '')
                }
              }
            ]
          }
        ],
        turnComplete: true
      }
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    } else {
      console.log('📦 Canvas update queued (disconnected)')
      messageQueue.current.push(payload)
    }
  }, [])

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current)
      heartbeatInterval.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setState({
      isConnected: false,
      isConnecting: false,
      lastError: null,
      geminiConnected: false,
      reconnectAttempts: 0
    })
  }, [])

  // Expose manual connect; cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    state,
    sendToGemini,
    sendCanvasUpdate,
    setupGemini,
    connect,
    disconnect
  }
}
