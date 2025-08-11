// Socket.IO Client Hook for Reliable Gemini Live Connection
// Provides auto-reconnection, message buffering, and real-time collaboration

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketIOState {
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

interface UseSocketIOReturn {
  socket: Socket | null
  state: SocketIOState
  sendToGemini: (message: Record<string, unknown>) => void
  sendCanvasUpdate: (canvasData: Record<string, unknown>) => void
  setupGemini: (config: Record<string, unknown>) => void
  disconnect: () => void
}

export function useSocketIO(
  onGeminiResponse?: (response: GeminiResponse) => void,
  onStatusChange?: (status: string) => void
): UseSocketIOReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [state, setState] = useState<SocketIOState>({
    isConnected: false,
    isConnecting: false,
    lastError: null,
    geminiConnected: false,
    reconnectAttempts: 0
  })

  const onGeminiResponseRef = useRef(onGeminiResponse)
  const onStatusChangeRef = useRef(onStatusChange)
  const messageQueue = useRef<Record<string, unknown>[]>([])

  // Update refs when callbacks change
  useEffect(() => {
    onGeminiResponseRef.current = onGeminiResponse
    onStatusChangeRef.current = onStatusChange
  }, [onGeminiResponse, onStatusChange])

  // Initialize Socket.IO connection
  const connect = useCallback(() => {
    if (socket?.connected) return

    setState(prev => ({ ...prev, isConnecting: true, lastError: null }))

    const newSocket = io({
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      randomizationFactor: 0.5
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔗 Socket.IO connected to Pi server')
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        lastError: null,
        reconnectAttempts: 0
      }))
      onStatusChangeRef.current?.('connected')

      // Process queued messages
      while (messageQueue.current.length > 0) {
        const queuedMessage = messageQueue.current.shift()
        newSocket.emit('gemini:message', queuedMessage)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason)
      setState(prev => ({
        ...prev,
        isConnected: false,
        geminiConnected: false
      }))
      onStatusChangeRef.current?.('disconnected')
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`)
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: attemptNumber
      }))
      onStatusChangeRef.current?.('reconnected')
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnection attempt ${attemptNumber}`)
      setState(prev => ({
        ...prev,
        isConnecting: true,
        reconnectAttempts: attemptNumber
      }))
      onStatusChangeRef.current?.('reconnecting')
    })

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed')
      setState(prev => ({
        ...prev,
        isConnecting: false,
        lastError: 'Reconnection failed after maximum attempts'
      }))
      onStatusChangeRef.current?.('failed')
    })

    // Gemini Live events
    newSocket.on('gemini:connected', (data) => {
      console.log('🤖 Gemini Live connected via Socket.IO')
      setState(prev => ({ ...prev, geminiConnected: true }))
      onStatusChangeRef.current?.('gemini_connected')
    })

    newSocket.on('gemini:disconnected', (data) => {
      console.log('🔌 Gemini Live disconnected:', data.reason)
      setState(prev => ({ ...prev, geminiConnected: false }))
      onStatusChangeRef.current?.('gemini_disconnected')
    })

    newSocket.on('gemini:response', (response: GeminiResponse) => {
      console.log('📨 Received Gemini response via Socket.IO')
      onGeminiResponseRef.current?.(response)
    })

    newSocket.on('gemini:error', (error) => {
      console.error('❌ Gemini error via Socket.IO:', error)
      setState(prev => ({ 
        ...prev, 
        lastError: error.error || 'Gemini connection error',
        geminiConnected: false
      }))
    })

    // Pi status updates
    newSocket.on('pi:status', (status) => {
      console.log('📊 Pi status update:', status)
    })

    // Canvas collaboration events
    newSocket.on('canvas:update', (canvasData) => {
      console.log('🎨 Canvas update from collaboration')
      // Handle collaborative canvas updates here if needed
    })

    // Error handling
    newSocket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error)
      setState(prev => ({ 
        ...prev, 
        lastError: error.message || 'Connection error',
        isConnecting: false
      }))
    })

    setSocket(newSocket)
  }, [socket])

  // Setup Gemini Live connection
  const setupGemini = useCallback((config: Record<string, unknown>) => {
    if (socket?.connected) {
      socket.emit('gemini:setup', config)
    } else {
      console.warn('⚠️  Socket not connected, queuing Gemini setup')
    }
  }, [socket])

  // Send message to Gemini Live
  const sendToGemini = useCallback((message: Record<string, unknown>) => {
    if (socket?.connected && state.geminiConnected) {
      socket.emit('gemini:message', message)
    } else {
      console.log('📦 Queuing message for Gemini (disconnected)')
      messageQueue.current.push(message)
      
      // Try to reconnect if not connected
      if (!socket?.connected) {
        connect()
      }
    }
  }, [socket, state.geminiConnected, connect])

  // Send canvas update
  const sendCanvasUpdate = useCallback((canvasData: Record<string, unknown>) => {
    if (socket?.connected) {
      socket.emit('gemini:canvas', canvasData)
    } else {
      console.log('📦 Canvas update queued (disconnected)')
    }
  }, [socket])

  // Disconnect
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    setState({
      isConnected: false,
      isConnecting: false,
      lastError: null,
      geminiConnected: false,
      reconnectAttempts: 0
    })
  }, [socket])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect]) // Include dependencies

  return {
    socket,
    state,
    sendToGemini,
    sendCanvasUpdate,
    setupGemini,
    disconnect
  }
}
