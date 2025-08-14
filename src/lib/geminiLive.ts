// Gemini Live 2.0 Integration
// Real-time multimodal AI tutor with tool calling

import { useState, useEffect } from 'react'

interface GeminiLiveConfig {
  model: string
  voice: {
    style: string
    speed: number
    pitch: number
  }
  systemInstruction: string
  tools: ToolDefinition[]
}

interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, any>
}

interface ReasoningStep {
  id: string
  timestamp: number
  transcript: string
  classification: 'correct' | 'partial' | 'incorrect' | 'exploring'
  concepts: string[]
  confidence: number
}

interface MisconceptionFlag {
  type: 'unequal_parts' | 'counting_not_measuring' | 'whole_unclear'
  evidence: string
  severity: 'minor' | 'major'
}

interface Hint {
  level: 'encouragement' | 'question' | 'visual_hint' | 'worked_example'
  content: string
}

interface Celebration {
  message: string
  animation: 'sparkle' | 'grow' | 'bounce'
}

interface Annotation {
  type: 'arrow' | 'circle' | 'underline'
  coordinates: { x: number, y: number }[]
  color: string
  message: string
}

class GeminiLiveClient {
  private socket: WebSocket | null = null
  private isConnected = false
  private isClient = false
  private mediaStream: MediaStream | null = null
  private sessionId: string | null = null
  
  // Callback handlers for tool calls
  private toolHandlers: Map<string, (params: any) => Promise<any>> = new Map()
  
  // Event handlers
  private eventHandlers: Map<string, (data: any) => void> = new Map()

  constructor() {
    if (typeof window !== 'undefined') {
      this.isClient = true
    }
  }

  // Initialize Gemini Live connection with Pi personality
  async initialize(): Promise<boolean> {
    if (!this.isClient) {
      console.warn('⚠️  Gemini Live can only run on client side')
      return false
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      console.warn('⚠️  Gemini API key not found')
      return false
    }

    try {
      // Note: This is a conceptual implementation
      // The actual Gemini Live WebSocket endpoint may differ
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`
      
      this.socket = new WebSocket(wsUrl)
      
      this.socket.onopen = () => {
        console.log('🔮 Connected to Gemini Live')
        this.isConnected = true
        this.sendConfiguration()
      }
      
      this.socket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }
      
      this.socket.onclose = () => {
        console.log('🔌 Gemini Live disconnected')
        this.isConnected = false
      }
      
      this.socket.onerror = (error) => {
        console.error('🚨 Gemini Live error:', error)
        this.isConnected = false
      }

      // Set up tool handlers
      this.setupToolHandlers()
      
      return true
    } catch (error) {
      console.error('Failed to initialize Gemini Live:', error)
      return false
    }
  }

  // Send Pi configuration to Gemini Live
  private sendConfiguration() {
    if (!this.socket || !this.isConnected) return

    const config: GeminiLiveConfig = {
      model: "gemini-2.5-flash",
      voice: {
        style: "friendly_patient",
        speed: 0.95, // Slightly slower for kids
        pitch: 1.1   // Slightly higher, warmer
      },
      
      systemInstruction: `
        You are Pi, a curious coach in the Pi Lab for grade 3 students. Treat students as capable junior investigators.

        PERSONALITY:
        - Warm, patient, and professional
        - Celebrate productive struggle; call it "debugging"
        - Use concise, clear language; avoid baby talk
        - Ask, don't tell; never give direct answers

        APPROACH:
        - Frame work as Plan → Execute → Check
        - Prefer nudges over hints; ask one question at a time
        - Use the student's own words and drawings as evidence
        - Pause to let thinking happen

        TOOL POLICY:
        - When student explains reasoning, call mark_reasoning_step
        - When detecting a misconception, call flag_misconception
        - When the student is stuck or requests help, call suggest_hint (call it a "nudge")
        - When the student iterates or explores, call celebrate_exploration

        CRITICAL: Let students think. Don't interrupt productive struggle. Intervene only when stuck or invited.
      `,
      
      tools: [
        {
          name: "mark_reasoning_step",
          description: "Record a step in student's reasoning",
          parameters: {
            transcript: "string",
            classification: "correct | partial | incorrect | exploring",
            concepts: "string[]",
            confidence: "number"
          }
        },
        {
          name: "flag_misconception",
          description: "Identify a mathematical misconception",
          parameters: {
            type: "unequal_parts | counting_not_measuring | whole_unclear",
            evidence: "string",
            severity: "minor | major"
          }
        },
        {
          name: "suggest_hint",
          description: "Provide a concise nudge (question or small prompt)",
          parameters: {
            level: "encouragement | question | visual_hint | worked_example",
            content: "string"
          }
        },
        {
          name: "celebrate_exploration",
          description: "Acknowledge productive struggle",
          parameters: {
            message: "string",
            animation: "sparkle | grow | bounce"
          }
        },
        {
          name: "annotate_canvas",
          description: "Draw on student's canvas",
          parameters: {
            type: "arrow | circle | underline",
            coordinates: "Point[]",
            color: "string",
            message: "string"
          }
        }
      ]
    }

    this.socket.send(JSON.stringify({
      type: 'configure',
      config
    }))
  }

  // Set up tool function handlers
  private setupToolHandlers() {
    // Tool: Mark reasoning step
    this.toolHandlers.set('mark_reasoning_step', async (params: ReasoningStep) => {
      console.log('📝 Reasoning step captured:', params)
      
      // Dispatch event for reasoning map to catch
      window.dispatchEvent(new CustomEvent('simili-reasoning-step', {
        detail: params
      }))
      
      return { success: true }
    })

    // Tool: Flag misconception
    this.toolHandlers.set('flag_misconception', async (params: MisconceptionFlag) => {
      console.log('🚩 Misconception flagged:', params)
      
      // Dispatch event for UI to handle
      window.dispatchEvent(new CustomEvent('simili-misconception', {
        detail: params
      }))
      
      return { success: true }
    })

    // Tool: Suggest hint
    this.toolHandlers.set('suggest_hint', async (params: Hint) => {
      console.log('💡 Hint suggested:', params)
      
      // Dispatch event for UI to show hint
      window.dispatchEvent(new CustomEvent('simili-hint', {
        detail: params
      }))
      
      return { success: true }
    })

    // Tool: Celebrate exploration
    this.toolHandlers.set('celebrate_exploration', async (params: Celebration) => {
      console.log('🎉 Celebration triggered:', params)
      
      // Dispatch event for celebration animation
      window.dispatchEvent(new CustomEvent('simili-celebration', {
        detail: params
      }))
      
      return { success: true }
    })

    // Tool: Annotate canvas
    this.toolHandlers.set('annotate_canvas', async (params: Annotation) => {
      console.log('✏️  Canvas annotation:', params)
      
      // Dispatch event for canvas to add annotation
      window.dispatchEvent(new CustomEvent('simili-annotation', {
        detail: params
      }))
      
      return { success: true }
    })
  }

  // Handle incoming messages from Gemini Live
  private async handleMessage(message: any) {
    switch (message.type) {
      case 'tool_call':
        await this.handleToolCall(message.tool, message.parameters)
        break
        
      case 'audio_response':
        this.handleAudioResponse(message.audio)
        break
        
      case 'session_started':
        this.sessionId = message.sessionId
        console.log('🎯 Gemini Live session started:', this.sessionId)
        break
        
      case 'error':
        console.error('🚨 Gemini Live error:', message.error)
        break
    }
  }

  // Handle tool function calls from Gemini
  private async handleToolCall(toolName: string, parameters: any) {
    const handler = this.toolHandlers.get(toolName)
    if (handler) {
      try {
        const result = await handler(parameters)
        
        // Send result back to Gemini
        this.socket?.send(JSON.stringify({
          type: 'tool_result',
          tool: toolName,
          result
        }))
      } catch (error) {
        console.error(`Tool ${toolName} error:`, error)
      }
    } else {
      console.warn(`Unknown tool called: ${toolName}`)
    }
  }

  // Handle audio responses from Pi
  private handleAudioResponse(audioData: any) {
    // This would play Pi's voice response
    // For now, we'll emit an event
    window.dispatchEvent(new CustomEvent('simili-pi-speaking', {
      detail: { audioData }
    }))
  }

  // Start capturing student's screen/canvas for Gemini to see
  async startScreenCapture() {
    if (!this.isClient) return false

    try {
      // Use getDisplayMedia for screen sharing
      // Note: In a real implementation, we'd want to capture just the canvas area
      const getDM = navigator.mediaDevices.getDisplayMedia?.bind(navigator.mediaDevices)
      if (!getDM) throw new Error('getDisplayMedia not supported')
      this.mediaStream = await getDM({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 10 } // Lower frame rate to save bandwidth
        },
        audio: true // Include audio for voice interaction
      })

      // Send video stream to Gemini Live
      if (this.socket && this.isConnected) {
        // Note: This is conceptual - actual implementation would need
        // to convert MediaStream to format Gemini Live expects
        this.socket.send(JSON.stringify({
          type: 'start_video_stream',
          streamId: 'canvas_capture'
        }))
      }

      console.log('📺 Screen capture started for Gemini Live')
      return true
    } catch (error) {
      console.error('Screen capture failed:', error)
      return false
    }
  }

  // Send canvas snapshot to Gemini for analysis
  async sendCanvasSnapshot(canvasElement: HTMLCanvasElement) {
    if (!this.socket || !this.isConnected) return

    try {
      // Convert canvas to base64 image
      const imageData = canvasElement.toDataURL('image/png')
      
      this.socket.send(JSON.stringify({
        type: 'canvas_update',
        image: imageData,
        timestamp: Date.now(),
        context: 'Student mathematical work in progress'
      }))
    } catch (error) {
      console.error('Failed to send canvas snapshot:', error)
    }
  }

  // Send student voice input to Gemini
  async startVoiceCapture() {
    if (!this.isClient) return false

    try {
      const getUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      const audioStream = await getUM({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })

      // Connect audio stream to Gemini Live
      if (this.socket && this.isConnected) {
        this.socket.send(JSON.stringify({
          type: 'start_audio_stream',
          streamId: 'student_voice'
        }))
      }

      console.log('🎤 Voice capture started')
      return true
    } catch (error) {
      console.error('Voice capture failed:', error)
      return false
    }
  }

  // Disconnect from Gemini Live
  disconnect() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
    }
    
    if (this.socket) {
      this.socket.close()
    }
    
    this.isConnected = false
    console.log('👋 Disconnected from Gemini Live')
  }

  // Check if connected
  isLiveConnected(): boolean {
    return this.isConnected
  }

  // Register event handlers
  on(event: string, handler: (data: any) => void) {
    this.eventHandlers.set(event, handler)
  }

  // Emit events
  private emit(event: string, data: any) {
    const handler = this.eventHandlers.get(event)
    if (handler) {
      handler(data)
    }
  }
}

// Singleton instance
export const geminiLive = new GeminiLiveClient()

// React hook for Gemini Live integration
export function useGeminiLive() {
  const [isConnected, setIsConnected] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    const initializeLive = async () => {
      const success = await geminiLive.initialize()
      setIsConnected(success)
    }

    initializeLive()

    return () => {
      geminiLive.disconnect()
    }
  }, [])

  const startCapture = async () => {
    const screenSuccess = await geminiLive.startScreenCapture()
    const voiceSuccess = await geminiLive.startVoiceCapture()
    setIsCapturing(screenSuccess && voiceSuccess)
  }

  const sendCanvasUpdate = (canvas: HTMLCanvasElement) => {
    geminiLive.sendCanvasSnapshot(canvas)
  }

  return {
    isConnected,
    isCapturing,
    startCapture,
    sendCanvasUpdate,
    disconnect: () => {
      geminiLive.disconnect()
      setIsConnected(false)
      setIsCapturing(false)
    }
  }
}
