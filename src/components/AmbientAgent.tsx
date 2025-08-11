'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocketIO } from '@/lib/useSocketIO'

interface AmbientAgentProps {
  isActive: boolean
  studentContext: {
    gradeLevel: number
    subject: 'mathematics' | 'science' | 'language' | 'general'
    currentTopic: string
  }
}

interface ObservationEvent {
  type: 'drawing' | 'manipulative' | 'pause' | 'activity'
  timestamp: number
  data: Record<string, unknown>
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

const AmbientAgent = ({ isActive, studentContext }: AmbientAgentProps) => {
  const [piState, setPiState] = useState<'observing' | 'thinking' | 'speaking'>('observing')
  const [currentThought, setCurrentThought] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  const observationBuffer = useRef<ObservationEvent[]>([])
  const lastInteraction = useRef<number>(Date.now())

  // Socket.IO connection with auto-reconnection and message buffering
  const { state, sendToGemini, setupGemini, disconnect } = useSocketIO(
    handleGeminiResponse,
    handleStatusChange
  )
  
  // Handle Gemini Live responses
  function handleGeminiResponse(data: GeminiResponse) {
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const response = data.candidates[0].content.parts?.[0]?.text
      if (response && response.trim()) {
        speakThought(response.trim())
      }
    }
  }

  // Handle connection status changes
  function handleStatusChange(status: string) {
    console.log(`🔗 Pi connection status: ${status}`)
    
    switch (status) {
      case 'connected':
        setPiState('observing')
        break
      case 'reconnecting':
        setPiState('thinking')
        break
      case 'failed':
        setPiState('observing')
        break
    }
  }

  // Initialize client-side and setup Gemini Live
  useEffect(() => {
    setIsClient(true)
    
    if (isActive && state.isConnected && !state.geminiConnected) {
      // Setup Gemini Live with Socket.IO
      setupGemini({
        model: "gemini-2.0-flash-exp",
        tools: [
          {
            name: "mark_reasoning_step",
            description: "Mark when student shows mathematical reasoning"
          },
          {
            name: "suggest_gentle_hint", 
            description: "Provide Socratic guidance when student is stuck"
          },
          {
            name: "celebrate_discovery",
            description: "Acknowledge student insights and discoveries"
          }
        ],
        systemInstruction: `You are Pi, a warm, patient math tutor for elementary students. 

CORE PRINCIPLES:
- You are AMBIENT - speak only when genuinely helpful
- Use Socratic method - ask questions, don't give answers
- Celebrate thinking and exploration, even if incorrect
- Match student's energy and emotional state
- Keep responses under 15 words

WHEN TO SPEAK:
- Student adds a new manipulative tool
- Student shows mathematical reasoning
- Student appears stuck for >30 seconds
- Student makes a discovery or insight

TONE:
- Warm, encouraging, curious
- Grade ${studentContext.gradeLevel} appropriate language
- Never judgmental about mistakes
- Focus on process over answers

CURRENT CONTEXT: Student is exploring ${studentContext.currentTopic}`
      })
    }

    return () => {
      if (!isActive) {
        disconnect()
      }
    }
  }, [isActive, state.isConnected, state.geminiConnected, studentContext, setupGemini, disconnect])

  // Start ambient observation when activated
  useEffect(() => {
    if (!isActive || !isClient) return

    console.log('🔮 Pi is now watching your math work...')
    
    // Set up observation cycle
    const observationCycle = setInterval(() => {
      analyzeRecentActivity()
    }, 15000) // Check every 15 seconds

    return () => clearInterval(observationCycle)
  }, [isActive, isClient, analyzeRecentActivity])

  // Listen for canvas activity
  useEffect(() => {
    if (!isActive || !isClient) return

    const handleDrawing = (event: CustomEvent<Record<string, unknown>>) => {
      addObservation({
        type: 'drawing',
        timestamp: Date.now(),
        data: event.detail
      })
    }

    const handleManipulative = (event: CustomEvent<Record<string, unknown>>) => {
      addObservation({
        type: 'manipulative', 
        timestamp: Date.now(),
        data: event.detail
      })
    }

    window.addEventListener('simili-drawing-event', handleDrawing as EventListener)
    window.addEventListener('simili-manipulative-event', handleManipulative as EventListener)

    return () => {
      window.removeEventListener('simili-drawing-event', handleDrawing as EventListener)
      window.removeEventListener('simili-manipulative-event', handleManipulative as EventListener)
    }
  }, [isActive, isClient])

  // Add observation to buffer
  const addObservation = (event: ObservationEvent) => {
    observationBuffer.current.push(event)
    // Keep only last 10 observations
    if (observationBuffer.current.length > 10) {
      observationBuffer.current = observationBuffer.current.slice(-10)
    }
  }

  // Analyze recent activity and respond appropriately
  const analyzeRecentActivity = useCallback(() => {
    const now = Date.now()
    const recentEvents = observationBuffer.current.filter(
      event => now - event.timestamp < 30000 // Last 30 seconds
    )

    // Don't interrupt too frequently (minimum 2 minutes between speaking)
    if (now - lastInteraction.current < 120000) {
      return
    }

    let shouldSpeak = false
    let message = ''

    // Pattern 1: Student added a new tool (good moment to guide)
    const recentManipulative = recentEvents.find(e => e.type === 'manipulative')
    if (recentManipulative) {
      shouldSpeak = true
      if (state.geminiConnected) {
        // Send context to Gemini Live for AI response via Socket.IO
        sendToGemini({
          contents: [{
            parts: [{
              text: `Student just added a ${recentManipulative.data.manipulativeType} to explore. Respond as Pi with a brief, warm question or encouragement (under 15 words).`
            }]
          }]
        })
        return
      } else {
        // Fallback to local messages when Gemini Live is not connected
        message = getLocalManipulativeMessage(recentManipulative.data.manipulativeType)
      }
    }
    // Pattern 2: Lots of drawing activity (encourage thinking)
    else if (recentEvents.filter(e => e.type === 'drawing').length >= 3) {
      shouldSpeak = true
      if (state.geminiConnected) {
        sendToGemini({
          contents: [{
            parts: [{
              text: `Student is actively drawing and sketching - showing lots of mathematical thinking. Respond as Pi with a brief, encouraging question (under 15 words).`
            }]
          }]
        })
        return
      } else {
        message = getLocalDrawingMessage()
      }
    }
    // Pattern 3: Long pause (gentle check-in)
    else if (recentEvents.length === 0 && Math.random() > 0.8) {
      shouldSpeak = true
      if (state.geminiConnected) {
        sendToGemini({
          contents: [{
            parts: [{
              text: `Student has been quiet for a while. Respond as Pi with a gentle, warm check-in question (under 15 words).`
            }]
          }]
        })
        return
      } else {
        message = getLocalPauseMessage()
      }
    }

    if (shouldSpeak && message) {
      speakThought(message)
    }
  }, [state.geminiConnected, sendToGemini])

  // Local fallback messages when Gemini Live is not connected
  const getLocalManipulativeMessage = (toolType: string) => {
    const messages = {
      'number-line': "I see you're exploring with a number line. What are you thinking about?",
      'fraction-bar': "Fractions can be tricky! What do you notice about the parts?",
      'graph-paper': "Graph paper is great for seeing patterns. What are you exploring?",
      'calculator': "Good thinking to grab a calculator. What problem are you working on?",
      'circle': "Circles are everywhere in math! What do you want to discover?",
      'square': "I love squares! What makes a square special to you?",
      'triangle': "Triangles are fascinating! What do you notice about triangles?"
    }
    return messages[toolType as keyof typeof messages] || 
           "I see you're trying something new. What are you curious about?"
  }

  const getLocalDrawingMessage = () => {
    const messages = [
      "I'm watching you work! What are you thinking about?",
      "Your drawing is taking shape. What's your strategy?",
      "I'm curious about your approach. Tell me what you're exploring.",
      "You're doing lots of thinking! What have you discovered?"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getLocalPauseMessage = () => {
    const messages = [
      "I'm here if you want to talk through any ideas.",
      "Take your time thinking. What questions do you have?",
      "Sometimes the best math happens when we pause to think.",
      "I wonder what's going through your mind right now?"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // Speak a thought using browser speech synthesis
  const speakThought = (message: string) => {
    setPiState('thinking')
    setCurrentThought(message)

    // Brief pause before speaking
    setTimeout(() => {
      setPiState('speaking')
      
      // Use browser speech synthesis for output
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(message)
        utterance.rate = 0.9
        utterance.pitch = 1.1
        utterance.volume = 0.7
        
        utterance.onend = () => {
          setPiState('observing')
          setCurrentThought(null)
        }
        
        window.speechSynthesis.speak(utterance)
      } else {
        // Fallback: just show text for 3 seconds
        setTimeout(() => {
          setPiState('observing')
          setCurrentThought(null)
        }, 3000)
      }
      
      lastInteraction.current = Date.now()
    }, 1000)
  }

  if (!isActive || !isClient) return null

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-30">
      {/* Subtle Pi Indicator */}
      <div className={`transition-all duration-500 ${
        piState === 'observing' ? 'opacity-50 scale-95' :
        piState === 'thinking' ? 'opacity-80 scale-100' :
        'opacity-100 scale-105'
      }`}>
        <div className="bg-white/90 backdrop-blur-sm border border-purple-200 rounded-full px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              piState === 'observing' ? 'bg-blue-400' :
              piState === 'thinking' ? 'bg-yellow-400 animate-pulse' :
              'bg-purple-500 animate-bounce'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">Pi</span>
            {piState === 'speaking' && (
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thought Bubble (Only when thinking/speaking) */}
      {currentThought && (
        <div className="mt-2 max-w-xs">
          <div className={`bg-purple-50 border border-purple-200 rounded-lg p-3 shadow-sm transition-all duration-300 ${
            piState === 'speaking' ? 'scale-100 opacity-100' : 'scale-95 opacity-80'
          }`}>
            <div className="text-sm text-purple-800 leading-relaxed">
              {currentThought}
            </div>
            {piState === 'thinking' && (
              <div className="text-xs text-purple-600 mt-1 italic">
                Pi is thinking...
              </div>
            )}
          </div>
          {/* Speech bubble pointer */}
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-purple-50 border-l border-b border-purple-200 transform rotate-45 -mt-1.5"></div>
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Observations: {observationBuffer.current.length} | 
          State: {piState} |
          Socket: {state.isConnected ? '✓' : '✗'} |
          Gemini: {state.geminiConnected ? '✓' : '✗'}
          {state.reconnectAttempts > 0 && ` | Retries: ${state.reconnectAttempts}`}
        </div>
      )}
    </div>
  )
}

export default AmbientAgent