// Robust Gemini Live WebSocket Implementation
// Real-time bidirectional streaming with canvas integration

interface GeminiLiveMessage {
  type: 'setup' | 'clientContent' | 'serverContent' | 'toolCall' | 'toolResponse' | 'setupComplete' | 'interrupt'
  setupComplete?: boolean
  clientContent?: {
    turns: Turn[]
    turnComplete: boolean
  }
  serverContent?: {
    modelTurn?: {
      parts: Part[]
    }
    turnComplete?: boolean
    interrupted?: boolean
  }
  toolCall?: {
    functionCalls: FunctionCall[]
  }
  toolResponse?: {
    functionResponses: FunctionResponse[]
  }
}

interface Turn {
  role: 'user' | 'model'
  parts: Part[]
}

interface Part {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
  functionCall?: FunctionCall
  functionResponse?: FunctionResponse
}

interface FunctionCall {
  name: string
  args: Record<string, any>
}

interface FunctionResponse {
  name: string
  response: Record<string, any>
}

interface TutorSystemPrompt {
  text: string
  tools: ToolDefinition[]
}

interface ToolDefinition {
  functionDeclarations: FunctionDeclaration[]
}

interface FunctionDeclaration {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export class GeminiLiveWebSocketClient {
  private ws: WebSocket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private heartbeatInterval: number | null = null
  private setupComplete = false
  
  // Event handlers
  private eventHandlers: Map<string, (data: any) => void> = new Map()
  
  // Tool handlers for Pi's tutoring functions
  private toolHandlers: Map<string, (params: any) => Promise<any>> = new Map()
  
  // Canvas and audio streaming
  private canvasStream: MediaStream | null = null
  private audioStream: MediaStream | null = null
  private isStreamingCanvas = false
  private isStreamingAudio = false

  constructor() {
    this.setupToolHandlers()
  }

  async connect(): Promise<boolean> {
    try {
      // Get secure WebSocket URL from server-side API
      const response = await fetch('/api/gemini-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-websocket-url' })
      })
      
      if (!response.ok) {
        console.error('🚨 Failed to get WebSocket URL from server')
        return false
      }
      
      const { wsUrl, error } = await response.json()
      if (error) {
        console.error('🚨 Server error:', error)
        return false
      }
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('🔮 Connected to Gemini Live')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.setupSession()
        this.startHeartbeat()
        this.emit('connected', { status: 'connected' })
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: GeminiLiveMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      this.ws.onclose = (event) => {
        console.log('🔌 Gemini Live disconnected:', event.code, event.reason)
        this.isConnected = false
        this.setupComplete = false
        this.stopHeartbeat()
        this.emit('disconnected', { code: event.code, reason: event.reason })
        
        // Auto-reconnect if not a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('🚨 Gemini Live WebSocket error:', error)
        this.emit('error', { error })
      }
      
      return true
    } catch (error) {
      console.error('Failed to connect to Gemini Live:', error)
      return false
    }
  }

  private setupSession() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const tutorPrompt = this.getTutorSystemPrompt()

    // Send setup frame with model and generation config
    const setupFrame = {
      setup: {
        // Live models expect the fully qualified name
        model: 'models/gemini-2.5-flash',
        generationConfig: {
          temperature: Number(process.env.NEXT_PUBLIC_GEMINI_TEMPERATURE ?? 0.7),
          maxOutputTokens: Number(process.env.NEXT_PUBLIC_GEMINI_MAX_TOKENS ?? 96)
        },
        systemInstruction: {
          parts: [{ text: tutorPrompt.text }]
        }
      }
    }

    this.ws.send(JSON.stringify(setupFrame))
    console.log('📚 Sent setup frame to Gemini Live')
  }

  private getTutorSystemPrompt(): TutorSystemPrompt {
    return {
      text: `You are Pi, a curious coach in the Pi Lab for grade 3 students. Treat students as capable junior investigators. You can see their canvas in real-time.

CORE PERSONALITY:
- Warm, patient, and professional
- Celebrate curiosity and productive struggle (call it "debugging")  
- Use concise, clear language
- Ask thoughtful questions instead of giving direct answers
- Encourage students to explain their thinking out loud

TUTORING APPROACH:
- Plan → Execute → Check
- Use nudges (short questions) rather than long hints
- Connect math concepts to real-world examples students understand
- Acknowledge effort and process, not just correct answers
- Wait for students to think - don't interrupt productive struggle

CANVAS INTERACTION:
- You can see what students draw on their canvas in real-time
- Use the annotate_canvas tool to highlight parts of their work
- Suggest drawing activities when helpful for understanding
- Celebrate creative problem-solving approaches

RESPONSE GUIDELINES:
- Keep responses to 1-2 sentences maximum
- Ask one clear question at a time
- Use evidence-based prompts: "I notice...", "What does your drawing show?"
- When detecting misconceptions, guide with a nudge rather than correcting directly

Remember: Your goal is to help students discover mathematical understanding through their own thinking and exploration.`,
      
      tools: [{
        functionDeclarations: [
          {
            name: 'mark_reasoning_step',
            description: 'Record and classify a step in the student\'s mathematical reasoning',
            parameters: {
              type: 'object',
              properties: {
                transcript: { type: 'string', description: 'What the student said or explained' },
                classification: { 
                  type: 'string', 
                  enum: ['correct', 'partial', 'incorrect', 'exploring'],
                  description: 'Classification of the reasoning step'
                },
                concepts: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Mathematical concepts involved'
                },
                confidence: { 
                  type: 'number', 
                  minimum: 0, 
                  maximum: 1,
                  description: 'Confidence in the assessment (0-1)'
                }
              },
              required: ['transcript', 'classification', 'concepts', 'confidence']
            }
          },
          {
            name: 'flag_misconception',
            description: 'Identify a mathematical misconception that needs gentle correction',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['unequal_parts', 'counting_not_measuring', 'whole_unclear', 'operation_confusion', 'place_value_error'],
                  description: 'Type of misconception detected'
                },
                evidence: { 
                  type: 'string',
                  description: 'Specific evidence of the misconception in student work'
                },
                severity: {
                  type: 'string',
                  enum: ['minor', 'major'],
                  description: 'How critical this misconception is to address'
                }
              },
              required: ['type', 'evidence', 'severity']
            }
          },
          {
            name: 'suggest_hint',
            description: 'Provide scaffolded support when student is stuck',
            parameters: {
              type: 'object',
              properties: {
                level: {
                  type: 'string',
                  enum: ['encouragement', 'question', 'visual_hint', 'worked_example'],
                  description: 'Level of support to provide'
                },
                content: {
                  type: 'string',
                  description: 'The actual hint or support content'
                }
              },
              required: ['level', 'content']
            }
          },
          {
            name: 'celebrate_discovery',
            description: 'Acknowledge breakthrough moments and productive struggle',
            parameters: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Celebration message for the student'
                },
                achievement: {
                  type: 'string',
                  description: 'What the student accomplished'
                },
                animation: {
                  type: 'string',
                  enum: ['sparkle', 'bounce', 'grow', 'confetti'],
                  description: 'Visual celebration to show'
                }
              },
              required: ['message', 'achievement', 'animation']
            }
          },
          {
            name: 'annotate_canvas',
            description: 'Draw helpful annotations on the student\'s canvas',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['arrow', 'circle', 'underline', 'bracket', 'dotted_line'],
                  description: 'Type of annotation to draw'
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      x: { type: 'number' },
                      y: { type: 'number' }
                    },
                    required: ['x', 'y']
                  },
                  description: 'Points defining the annotation'
                },
                color: {
                  type: 'string',
                  enum: ['blue', 'green', 'purple', 'orange', 'red'],
                  description: 'Color for the annotation'
                },
                message: {
                  type: 'string',
                  description: 'Optional message to show with the annotation'
                }
              },
              required: ['type', 'coordinates', 'color']
            }
          },
          {
            name: 'request_canvas_focus',
            description: 'Ask student to focus on specific part of their drawing',
            parameters: {
              type: 'object',
              properties: {
                area: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' }
                  },
                  required: ['x', 'y', 'width', 'height']
                },
                prompt: {
                  type: 'string',
                  description: 'What to ask about this area'
                }
              },
              required: ['area', 'prompt']
            }
          }
        ]
      }]
    }
  }

  private setupToolHandlers() {
    // Handle reasoning step marking
    this.toolHandlers.set('mark_reasoning_step', async (params) => {
      console.log('📝 Reasoning step captured:', params)
      this.emit('reasoning-step', params)
      return { success: true, recorded: true }
    })

    // Handle misconception flagging
    this.toolHandlers.set('flag_misconception', async (params) => {
      console.log('🚩 Misconception flagged:', params)
      this.emit('misconception-detected', params)
      return { success: true, flagged: true }
    })

    // Handle hint suggestions
    this.toolHandlers.set('suggest_hint', async (params) => {
      console.log('💡 Hint suggested:', params)
      this.emit('hint-suggested', params)
      return { success: true, provided: true }
    })

    // Handle celebrations
    this.toolHandlers.set('celebrate_discovery', async (params) => {
      console.log('🎉 Discovery celebrated:', params)
      this.emit('celebrate', params)
      return { success: true, celebrated: true }
    })

    // Handle canvas annotations
    this.toolHandlers.set('annotate_canvas', async (params) => {
      console.log('✏️ Canvas annotation:', params)
      this.emit('canvas-annotation', params)
      return { success: true, annotated: true }
    })

    // Handle canvas focus requests
    this.toolHandlers.set('request_canvas_focus', async (params) => {
      console.log('🎯 Canvas focus requested:', params)
      this.emit('canvas-focus', params)
      return { success: true, focused: true }
    })
  }

  private async handleMessage(message: any) {
    // Setup complete acknowledgement
    if (message?.setupComplete === true || message?.setup_complete === true) {
      this.setupComplete = true
      console.log('✅ Gemini Live setup complete')
      this.emit('setup-complete', {})
      return
    }

    // Server content frames
    const serverContent = message.serverContent || message.server_content
    const modelTurn = serverContent?.modelTurn || serverContent?.model_turn
    const parts = modelTurn?.parts
    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (typeof part.text === 'string' && part.text.length > 0) {
          console.log('🔮 Pi says:', part.text)
          this.emit('pi-response', { text: part.text })
        }
        if (part.functionCall) {
          await this.handleToolCall(part.functionCall)
        }
      }
      return
    }

    // Tool call frames
    const toolCall = message.toolCall || message.tool_call
    if (toolCall?.functionCalls) {
      for (const functionCall of toolCall.functionCalls) {
        await this.handleToolCall(functionCall)
      }
      return
    }

    // Ignore unrecognized frames silently
  }

  private async handleToolCall(functionCall: FunctionCall) {
    console.log('🔧 Tool call received:', functionCall.name, functionCall.args)
    
    const handler = this.toolHandlers.get(functionCall.name)
    if (handler) {
      try {
        const result = await handler(functionCall.args)
        
        // Send tool response back to Gemini
        const toolResponse: GeminiLiveMessage = {
          type: 'toolResponse',
          toolResponse: {
            functionResponses: [{
              name: functionCall.name,
              response: result
            }]
          }
        }
        
        this.ws?.send(JSON.stringify(toolResponse))
      } catch (error) {
        console.error(`Tool ${functionCall.name} failed:`, error)
        
        // Send error response
        const errorResponse: GeminiLiveMessage = {
          type: 'toolResponse',
          toolResponse: {
            functionResponses: [{
              name: functionCall.name,
              response: { error: 'Tool execution failed', details: error }
            }]
          }
        }
        
        this.ws?.send(JSON.stringify(errorResponse))
      }
    } else {
      console.warn(`Unknown tool called: ${functionCall.name}`)
    }
  }

  // Send canvas snapshot to Pi for analysis
  async sendCanvasSnapshot(canvasElement: HTMLCanvasElement) {
    if (!this.isConnected || !this.setupComplete) {
      console.warn('Cannot send canvas - not connected or setup incomplete')
      return
    }

    try {
      // Convert canvas to base64
      const imageData = canvasElement.toDataURL('image/png')
      const base64Data = imageData.split(',')[1] // Remove data:image/png;base64, prefix
      
      const frame = {
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            }]
          }],
          turnComplete: true
        }
      }

      this.ws?.send(JSON.stringify(frame))
      console.log('📸 Canvas snapshot sent to Pi')
    } catch (error) {
      console.error('Failed to send canvas snapshot:', error)
    }
  }

  // Send text message from student
  async sendTextMessage(text: string) {
    if (!this.isConnected || !this.setupComplete) {
      console.warn('Cannot send message - not connected or setup incomplete')
      return
    }

    const frame = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    }

    this.ws?.send(JSON.stringify(frame))
    console.log('💬 Student message sent:', text)
  }

  // Start audio streaming (for voice interaction)
  async startAudioStream(): Promise<boolean> {
    if (this.isStreamingAudio) return true

    try {
      const getUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      this.audioStream = await getUM({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })

      // Set up audio processing for real-time streaming
      const audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(this.audioStream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      
      processor.onaudioprocess = (event) => {
        if (this.isConnected && this.setupComplete) {
          const audioData = event.inputBuffer.getChannelData(0)
          // Convert to base64 for transmission
          // Note: In production, you'd want to use more efficient audio encoding
          this.sendAudioChunk(audioData)
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)
      
      this.isStreamingAudio = true
      console.log('🎤 Audio streaming started')
      return true
    } catch (error) {
      console.error('Failed to start audio stream:', error)
      return false
    }
  }

  private sendAudioChunk(audioData: Float32Array) {
    // Convert Float32Array to base64 for transmission
    // This is a simplified implementation - production would use proper audio encoding
    const buffer = new ArrayBuffer(audioData.length * 4)
    const view = new Float32Array(buffer)
    for (let i = 0; i < audioData.length; i++) {
      view[i] = audioData[i]
    }
    
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    
    const frame = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{
            inlineData: {
              mimeType: 'audio/pcm',
              data: base64
            }
          }]
        }],
        turnComplete: false
      }
    }

    this.ws?.send(JSON.stringify(frame))
  }

  // Connection management
  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect()
      }
    }, delay)
  }

  private startHeartbeat() {
    // Gemini Live does not support custom heartbeat frames; rely on socket keepalive
    this.heartbeatInterval = null
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Event handling
  on(event: string, handler: (data: any) => void) {
    this.eventHandlers.set(event, handler)
  }

  off(event: string) {
    this.eventHandlers.delete(event)
  }

  private emit(event: string, data: any) {
    const handler = this.eventHandlers.get(event)
    if (handler) {
      handler(data)
    }
    
    // Also emit as DOM event for components to catch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`simili-${event}`, { detail: data }))
    }
  }

  // Cleanup
  disconnect() {
    this.isConnected = false
    this.setupComplete = false
    this.stopHeartbeat()
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
      this.isStreamingAudio = false
    }
    
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach(track => track.stop())
      this.canvasStream = null
      this.isStreamingCanvas = false
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    
    console.log('👋 Disconnected from Gemini Live')
  }

  // Status getters
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      setupComplete: this.setupComplete,
      streamingAudio: this.isStreamingAudio,
      streamingCanvas: this.isStreamingCanvas,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Singleton instance
export const geminiLiveClient = new GeminiLiveWebSocketClient()
