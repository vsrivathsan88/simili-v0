'use client'

import { useState, useEffect, useRef } from 'react'
import { geminiLiveClient } from '@/lib/geminiLiveWebSocket'
import { motion, AnimatePresence } from 'framer-motion'

interface TutorMessage {
  id: string
  text: string
  timestamp: number
  type: 'response' | 'hint' | 'celebration' | 'question'
}

interface CanvasAnnotation {
  id: string
  type: 'arrow' | 'circle' | 'underline' | 'bracket' | 'dotted_line'
  coordinates: { x: number; y: number }[]
  color: string
  message?: string
  timestamp: number
}

interface TutorState {
  connected: boolean
  setupComplete: boolean
  streamingAudio: boolean
  messages: TutorMessage[]
  annotations: CanvasAnnotation[]
  lastCanvasUpdate: number
}

export function useGeminiLiveTutor() {
  const [state, setState] = useState<TutorState>({
    connected: false,
    setupComplete: false,
    streamingAudio: false,
    messages: [],
    annotations: [],
    lastCanvasUpdate: 0
  })
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const messageIdCounter = useRef(0)
  const annotationIdCounter = useRef(0)

  useEffect(() => {
    // Set up event listeners for Gemini Live events
    const handleConnected = () => {
      setState(prev => ({ ...prev, connected: true }))
    }

    const handleDisconnected = () => {
      setState(prev => ({ 
        ...prev, 
        connected: false, 
        setupComplete: false,
        streamingAudio: false 
      }))
    }

    const handleSetupComplete = () => {
      setState(prev => ({ ...prev, setupComplete: true }))
    }

    const handlePiResponse = (event: CustomEvent) => {
      const { text } = event.detail
      const message: TutorMessage = {
        id: `msg-${++messageIdCounter.current}`,
        text,
        timestamp: Date.now(),
        type: 'response'
      }
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages.slice(-4), message] // Keep last 5 messages
      }))
    }

    const handleHintSuggested = (event: CustomEvent) => {
      const { content } = event.detail
      const message: TutorMessage = {
        id: `hint-${++messageIdCounter.current}`,
        text: content,
        timestamp: Date.now(),
        type: 'hint'
      }
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages.slice(-4), message]
      }))
    }

    const handleCelebration = (event: CustomEvent) => {
      const { message: celebrationText, achievement } = event.detail
      const message: TutorMessage = {
        id: `celebration-${++messageIdCounter.current}`,
        text: `${celebrationText} You ${achievement}! 🎉`,
        timestamp: Date.now(),
        type: 'celebration'
      }
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages.slice(-4), message]
      }))
    }

    const handleCanvasAnnotation = (event: CustomEvent) => {
      const { type, coordinates, color, message } = event.detail
      const annotation: CanvasAnnotation = {
        id: `annotation-${++annotationIdCounter.current}`,
        type,
        coordinates,
        color,
        message,
        timestamp: Date.now()
      }
      
      setState(prev => ({
        ...prev,
        annotations: [...prev.annotations.slice(-9), annotation] // Keep last 10 annotations
      }))
    }

    // Add event listeners
    geminiLiveClient.on('connected', handleConnected)
    geminiLiveClient.on('disconnected', handleDisconnected)
    geminiLiveClient.on('setup-complete', handleSetupComplete)
    
    window.addEventListener('simili-pi-response', handlePiResponse as EventListener)
    window.addEventListener('simili-hint-suggested', handleHintSuggested as EventListener)
    window.addEventListener('simili-celebrate', handleCelebration as EventListener)
    window.addEventListener('simili-canvas-annotation', handleCanvasAnnotation as EventListener)

    // Initialize connection
    geminiLiveClient.connect()

    return () => {
      // Cleanup
      geminiLiveClient.off('connected')
      geminiLiveClient.off('disconnected')
      geminiLiveClient.off('setup-complete')
      
      window.removeEventListener('simili-pi-response', handlePiResponse as EventListener)
      window.removeEventListener('simili-hint-suggested', handleHintSuggested as EventListener)
      window.removeEventListener('simili-celebrate', handleCelebration as EventListener)
      window.removeEventListener('simili-canvas-annotation', handleCanvasAnnotation as EventListener)
      
      geminiLiveClient.disconnect()
    }
  }, [])

  const sendCanvasUpdate = (canvas: HTMLCanvasElement) => {
    if (state.connected && state.setupComplete) {
      const now = Date.now()
      // Throttle canvas updates to avoid overwhelming the API
      if (now - state.lastCanvasUpdate > 2000) { // Max once per 2 seconds
        geminiLiveClient.sendCanvasSnapshot(canvas)
        setState(prev => ({ ...prev, lastCanvasUpdate: now }))
      }
    }
  }

  const sendStudentMessage = (text: string) => {
    if (state.connected && state.setupComplete) {
      geminiLiveClient.sendTextMessage(text)
    }
  }

  const startVoiceChat = async () => {
    if (state.connected && state.setupComplete && !state.streamingAudio) {
      const success = await geminiLiveClient.startAudioStream()
      if (success) {
        setState(prev => ({ ...prev, streamingAudio: true }))
      }
      return success
    }
    return false
  }

  const setCanvasRef = (canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
  }

  return {
    ...state,
    sendCanvasUpdate,
    sendStudentMessage,
    startVoiceChat,
    setCanvasRef,
    reconnect: () => geminiLiveClient.connect()
  }
}

interface GeminiLiveTutorProps {
  className?: string
  autoStartVoice?: boolean
}

export default function GeminiLiveTutor({ className = '', autoStartVoice = false }: GeminiLiveTutorProps) {
  const tutor = useGeminiLiveTutor()
  const [studentInput, setStudentInput] = useState('')
  const [showVoiceButton, setShowVoiceButton] = useState(false)

  useEffect(() => {
    // Check if browser supports audio streaming
    const hasVoiceSupport = typeof navigator !== 'undefined' && 
                           navigator.mediaDevices && 
                           navigator.mediaDevices.getUserMedia
    setShowVoiceButton(hasVoiceSupport)
    
    // Auto-start voice if requested and supported
    if (autoStartVoice && hasVoiceSupport && tutor.connected && tutor.setupComplete && !tutor.streamingAudio) {
      setTimeout(() => {
        tutor.startVoiceChat()
      }, 1000) // Small delay to ensure everything is ready
    }
  }, [autoStartVoice, tutor.connected, tutor.setupComplete, tutor.streamingAudio])

  const handleSendMessage = () => {
    if (studentInput.trim()) {
      tutor.sendStudentMessage(studentInput.trim())
      setStudentInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getStatusColor = () => {
    if (!tutor.connected) return 'bg-red-500'
    if (!tutor.setupComplete) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!tutor.connected) return 'Disconnected'
    if (!tutor.setupComplete) return 'Connecting...'
    return 'Pi is ready!'
  }

  const getMessageIcon = (type: TutorMessage['type']) => {
    switch (type) {
      case 'hint': return '💡'
      case 'celebration': return '🎉'
      case 'question': return '❓'
      default: return '🔮'
    }
  }

  const getMessageStyle = (type: TutorMessage['type']) => {
    switch (type) {
      case 'hint': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'celebration': return 'bg-green-50 border-green-200 text-green-800'
      case 'question': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header with status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <h3 className="font-semibold text-gray-800">Pi, Your Math Tutor</h3>
        </div>
        <span className="text-sm text-gray-600">{getStatusText()}</span>
      </div>

      {/* Messages */}
      <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
        <AnimatePresence>
          {tutor.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-lg border ${getMessageStyle(message.type)}`}
            >
              <div className="flex items-start space-x-2">
                <span className="text-lg">{getMessageIcon(message.type)}</span>
                <p className="text-sm flex-1">{message.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tutor.messages.length === 0 && tutor.setupComplete && (
          <div className="text-center text-gray-500 text-sm py-4">
            Start drawing on the canvas and I&apos;ll help you explore math concepts! 📝
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Pi a question or explain your thinking..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!tutor.setupComplete}
          />
          <button
            onClick={handleSendMessage}
            disabled={!tutor.setupComplete || !studentInput.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {/* Voice chat button */}
        {showVoiceButton && (
          <button
            onClick={tutor.startVoiceChat}
            disabled={!tutor.setupComplete || tutor.streamingAudio}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              tutor.streamingAudio
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white hover:bg-green-600'
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {tutor.streamingAudio ? '🎤 Voice Chat Active' : '🎤 Start Voice Chat'}
          </button>
        )}
      </div>

      {/* Connection issues */}
      {!tutor.connected && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-700">Connection lost</span>
            <button
              onClick={tutor.reconnect}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div>Connected: {tutor.connected ? '✅' : '❌'}</div>
          <div>Setup: {tutor.setupComplete ? '✅' : '❌'}</div>
          <div>Audio: {tutor.streamingAudio ? '🎤' : '🔇'}</div>
          <div>Messages: {tutor.messages.length}</div>
          <div>Annotations: {tutor.annotations.length}</div>
        </div>
      )}
    </div>
  )
}
