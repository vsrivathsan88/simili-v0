'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { buildPiNudgePrompt } from '@/lib/prompt'
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
  const outageUntilRef = useRef<number>(0)

  // Socket.IO connection with auto-reconnection and message buffering
  const { state, sendToGemini, sendCanvasUpdate, setupGemini, connect, disconnect } = useSocketIO(
    handleGeminiResponse,
    handleStatusChange
  )
  
  // Handle Gemini Live responses
  function handleGeminiResponse(data: any) {
    // Accept either structured candidates or plain text
    const text = typeof data?.text === 'string'
      ? data.text
      : data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text && String(text).trim()) {
      speakThought(String(text).trim())
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
    
    const ensureConnected = async () => {
      if (isActive && !state.isConnected) {
        await connect()
      }
      if (isActive && state.isConnected && !state.geminiConnected) {
        // Setup Gemini Live session with full config
        setupGemini({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are Pi, a curious coach in the Pi Lab for grade 3 students. Treat students as capable junior investigators.

PERSONALITY:
- Warm, patient, professional
- Celebrate productive struggle; call it "debugging"
- Use concise, clear language
- Ask questions; never give direct answers

APPROACH:
- Frame work as Plan → Execute → Check
- Prefer nudges (short questions) over long hints
- Use the student's drawings and words as evidence
- Pause to let thinking happen

TOOL POLICY:
- When student explains reasoning, call mark_reasoning_step
- When detecting a misconception, call flag_misconception
- When the student is stuck or asks for help, call suggest_hint (present it as a "nudge")
- When the student iterates or explores, call celebrate_exploration

CRITICAL: Let students think. Do not interrupt productive struggle. Intervene only when stuck or invited.

CURRENT CONTEXT: Student is exploring ${studentContext.currentTopic}`,
          generationConfig: {
            temperature: Number(process.env.NEXT_PUBLIC_GEMINI_TEMPERATURE ?? 0.7),
            maxOutputTokens: Number(process.env.NEXT_PUBLIC_GEMINI_MAX_TOKENS ?? 96)
          },
          voice: { style: 'friendly_patient', speed: 0.95, pitch: 1.1 },
          tools: [
            {
              name: 'mark_reasoning_step',
              description: "Record a step in student's reasoning",
              parameters: {
                transcript: 'string',
                classification: 'correct | partial | incorrect | exploring',
                concepts: 'string[]',
                confidence: 'number'
              }
            },
            {
              name: 'flag_misconception',
              description: 'Identify a mathematical misconception',
              parameters: {
                type: 'unequal_parts | counting_not_measuring | whole_unclear',
                evidence: 'string',
                severity: 'minor | major'
              }
            },
            {
              name: 'suggest_hint',
              description: 'Provide a concise nudge (question or small prompt)',
              parameters: {
                level: 'encouragement | question | visual_hint | worked_example',
                content: 'string'
              }
            },
            {
              name: 'celebrate_exploration',
              description: 'Acknowledge productive struggle',
              parameters: {
                message: 'string',
                animation: 'sparkle | grow | bounce'
              }
            },
            {
              name: 'annotate_canvas',
              description: "Draw on student's canvas",
              parameters: {
                type: 'arrow | circle | underline',
                coordinates: 'Point[]',
                color: 'string',
                message: 'string'
              }
            }
          ]
        })
      }
    }

    ensureConnected()

    return () => {
      if (!isActive) {
        disconnect()
      }
    }
  }, [isActive, state.isConnected, state.geminiConnected, setupGemini, connect, disconnect])

  // Sync backoff between components
  useEffect(() => {
    const handleBackoff = (e: any) => {
      const until = Number(e?.detail?.until || 0)
      if (until > Date.now()) {
        outageUntilRef.current = until
        console.log('simili:tutor:throttle', { reason: 'backoff-sync', until })
      }
    }
    window.addEventListener('simili-tutor-backoff', handleBackoff as EventListener)
    return () => window.removeEventListener('simili-tutor-backoff', handleBackoff as EventListener)
  }, [])

  const beginBackoff = useCallback((reason: string) => {
    const until = Date.now() + 60_000
    outageUntilRef.current = until
    console.log('simili:tutor:throttle', { reason, until })
    window.dispatchEvent(new CustomEvent('simili-tutor-backoff', { detail: { until } }))
    speakThought("I'm having trouble reaching Gemini. Keep exploring—I’ll chime in soon.")
  }, [])

  // Analyze recent activity and respond appropriately
  const analyzeRecentActivity = useCallback(() => {
    const now = Date.now()
    const recentEvents = observationBuffer.current.filter(
      event => now - event.timestamp < 30000
    )
    if (now - lastInteraction.current < 120000) return

    // Decide a brief context
    let context = ''
    const recentManipulative = recentEvents.find(e => e.type === 'manipulative') as any
    if (recentManipulative) {
      const d = recentManipulative.data || {}
      const coords = typeof d.x === 'number' && typeof d.y === 'number' ? ` at (${d.x}, ${d.y})` : ''
      const shapeType = d.shapeType ? `; shapeType: ${d.shapeType}` : ''
      context = `Student added ${d.manipulativeType || 'a tool'}${coords}${shapeType}.`
    } else if (recentEvents.filter(e => e.type === 'drawing').length >= 3) {
      context = 'Student is actively sketching and exploring ideas.'
    } else if (recentEvents.length === 0) {
      context = 'Student paused for a bit.'
    }
    if (!context) return

    if (Date.now() < outageUntilRef.current) {
      console.log('simili:tutor:throttle', { reason: 'backoff-window', until: outageUntilRef.current })
      return
    }
    console.log('simili:tutor:request', { trigger: 'analyzeRecentActivity', context, ts: now })
    fetch('/api/gemini-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `You are Pi, a friendly elementary math tutor. ${context} Current topic: ${studentContext.currentTopic}. Respond in ONE short sentence with warmth and a single question that nudges thinking. Avoid answers.`,
        temperature: Number(process.env.NEXT_PUBLIC_GEMINI_TEMPERATURE ?? 0.7),
        maxTokens: Number(process.env.NEXT_PUBLIC_GEMINI_MAX_TOKENS ?? 96),
        // Model selection is server-controlled
        model: undefined
      })
    }).then(async r => {
      if (!r.ok) {
        console.log('simili:tutor:error', { status: r.status, statusText: r.statusText, ts: Date.now() })
        beginBackoff(`http_${r.status}`)
        return
      }
      const { text } = await r.json()
      if (text && typeof text === 'string' && text.trim()) {
        console.log('simili:tutor:response', { source: 'gemini-text', text: text.trim(), ts: Date.now() })
        speakThought(text.trim())
      } else {
        beginBackoff('empty_text')
      }
    }).catch(e => {
      console.log('simili:tutor:error', { error: e instanceof Error ? e.message : String(e), ts: Date.now() })
      beginBackoff('network_error')
    })
  }, [studentContext.currentTopic])

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

  // Listen for canvas activity and vision responses
  useEffect(() => {
    if (!isActive || !isClient) return

    const handleDrawing = async (event: CustomEvent<Record<string, unknown>>) => {
      addObservation({
        type: 'drawing',
        timestamp: Date.now(),
        data: event.detail
      })

      // Text-only ping: send a short coaching prompt after a drawing event
      try {
        // Pre-throttle: if cadence rules would suppress, skip the call
        const now = Date.now()
        const suppressWhenBubble = process.env.NEXT_PUBLIC_TUTOR_SUPPRESS_WHEN_BUBBLE !== 'false'
        if (suppressWhenBubble && currentThought) return
        if (now - lastInteraction.current < Number(process.env.NEXT_PUBLIC_TUTOR_MIN_GAP_MS ?? 15000)) return
        if (Date.now() < outageUntilRef.current) {
          console.log('simili:tutor:throttle', { reason: 'backoff-window', until: outageUntilRef.current })
          return
        }
        console.log('simili:tutor:request', {
          trigger: 'drawing',
          topic: studentContext.currentTopic,
          ts: Date.now()
        })
        const res = await fetch('/api/gemini-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: buildPiNudgePrompt({
              trigger: 'drawing',
              contextLine: 'Student is drawing on the canvas.',
              student: studentContext,
              analysis: (latestAnalysisRef as any).current
            }),
            temperature: Number(process.env.NEXT_PUBLIC_GEMINI_TEMPERATURE ?? 0.7),
            maxTokens: Number(process.env.NEXT_PUBLIC_GEMINI_MAX_TOKENS ?? 96),
            model: undefined
          })
        })
        if (res.ok) {
          const { text } = await res.json()
          if (text && typeof text === 'string' && text.trim().length > 0) {
            console.log('simili:tutor:response', {
              source: 'gemini-text',
              text: text.trim(),
              ts: Date.now()
            })
            speakThought(text.trim())
          } else {
            beginBackoff('empty_text')
          }
        } else {
          console.log('simili:tutor:error', {
            status: res.status,
            statusText: res.statusText,
            ts: Date.now()
          })
          beginBackoff(`http_${res.status}`)
        }
      } catch (e) {
        console.log('simili:tutor:error', {
          error: e instanceof Error ? e.message : String(e),
          ts: Date.now()
        })
        beginBackoff('network_error')
      }
    }

    const handleManipulative = (event: CustomEvent<Record<string, unknown>>) => {
      addObservation({
        type: 'manipulative', 
        timestamp: Date.now(),
        data: event.detail
      })

      // Immediately nudge Pi with richer manipulative context (text-only route)
      const details = event.detail as any
      const tool = details?.manipulativeType || 'tool'
      const coords = typeof details?.x === 'number' && typeof details?.y === 'number' ? ` at (${details.x}, ${details.y})` : ''
      const shapeType = details?.shapeType ? `; shapeType: ${details.shapeType}` : ''
      // Pre-throttle
      const now = Date.now()
      const suppressWhenBubble = process.env.NEXT_PUBLIC_TUTOR_SUPPRESS_WHEN_BUBBLE !== 'false'
      if (!(suppressWhenBubble && currentThought) && (now - lastInteraction.current >= Number(process.env.NEXT_PUBLIC_TUTOR_MIN_GAP_MS ?? 15000))) {
        fetch('/api/gemini-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPiNudgePrompt({
            trigger: 'manipulative',
            contextLine: `Student added a ${tool}${coords}${shapeType}.`,
            student: studentContext,
            analysis: (latestAnalysisRef as any).current
          }),
          temperature: Number(process.env.NEXT_PUBLIC_GEMINI_TEMPERATURE ?? 0.7),
          maxTokens: Number(process.env.NEXT_PUBLIC_GEMINI_MAX_TOKENS ?? 96),
          model: undefined
        })
      }).then(async (r) => {
        if (!r.ok) return
        const { text } = await r.json()
        if (text && typeof text === 'string' && text.trim()) {
          console.log('simili:tutor:response', { source: 'gemini-text', text: text.trim(), ts: Date.now() })
          speakThought(text.trim())
        }
      }).catch((e) => {
        console.log('simili:tutor:error', { error: e instanceof Error ? e.message : String(e), ts: Date.now() })
      })
      }
    }

    const handleCanvasSnapshot = (event: CustomEvent<{ base64Png: string }>) => {
      if (!state.geminiConnected) return
      // Send the image frame via WS (inlineData inside clientContent)
      sendCanvasUpdate({ base64Png: event.detail.base64Png })
      // Prompt Pi to comment briefly on the canvas
      sendToGemini({ text: 'Look at the latest drawing and ask a short, encouraging question.' })
    }

    const latestAnalysisRef = { current: undefined as any }

    const handleVisionResponse = (event: CustomEvent<{ text: string; analysis?: Record<string, unknown> }>) => {
      const t = event.detail?.text
      if (event.detail?.analysis && typeof event.detail.analysis === 'object') {
        latestAnalysisRef.current = event.detail.analysis
      }
      if (t && typeof t === 'string' && t.trim()) {
        speakThought(t.trim())
      }
    }

    window.addEventListener('simili-drawing-event', handleDrawing as EventListener)
    window.addEventListener('simili-manipulative-event', handleManipulative as EventListener)
    window.addEventListener('simili-canvas-snapshot', handleCanvasSnapshot as EventListener)
    window.addEventListener('simili-tutor-vision', handleVisionResponse as EventListener)

    return () => {
      window.removeEventListener('simili-drawing-event', handleDrawing as EventListener)
      window.removeEventListener('simili-manipulative-event', handleManipulative as EventListener)
      window.removeEventListener('simili-canvas-snapshot', handleCanvasSnapshot as EventListener)
      window.removeEventListener('simili-tutor-vision', handleVisionResponse as EventListener)
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
  const minGapMs = Number(process.env.NEXT_PUBLIC_TUTOR_MIN_GAP_MS ?? 15000)
  const maxMsgsPerMin = Number(process.env.NEXT_PUBLIC_TUTOR_MAX_MSGS_PER_MIN ?? 4)
  const suppressWhenBubble = process.env.NEXT_PUBLIC_TUTOR_SUPPRESS_WHEN_BUBBLE !== 'false'
  const msgsWindowRef = useRef<number[]>([])

  const speakThought = (message: string) => {
    // Cadence guards
    const now = Date.now()
    if (suppressWhenBubble && currentThought) {
      console.log('simili:tutor:cadence-suppressed', { reason: 'bubble-visible', ts: now })
      return
    }
    if (now - lastInteraction.current < minGapMs) {
      console.log('simili:tutor:cadence-suppressed', { reason: 'min-gap', gap: now - lastInteraction.current, ts: now })
      return
    }
    // sliding 60s window
    msgsWindowRef.current = msgsWindowRef.current.filter(t => now - t < 60000)
    if (msgsWindowRef.current.length >= maxMsgsPerMin) {
      console.log('simili:tutor:cadence-suppressed', { reason: 'max-per-minute', count: msgsWindowRef.current.length, ts: now })
      return
    }
    msgsWindowRef.current.push(now)
    setPiState('thinking')
    setCurrentThought(message)

    // Brief pause before speaking
    setTimeout(() => {
      setPiState('speaking')
      
      // Use browser speech synthesis for output (guarded by env flag)
      const ttsEnabled = process.env.NEXT_PUBLIC_ENABLE_TTS !== 'false'
      if (ttsEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
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