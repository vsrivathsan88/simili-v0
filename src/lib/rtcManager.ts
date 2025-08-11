// Real-Time Communication Manager for Simili
// Handles WebRTC, canvas streaming, and AI pipeline integration

export interface RTCConfiguration {
  iceServers: RTCIceServer[]
  iceTransportPolicy?: RTCIceTransportPolicy
  bundlePolicy?: RTCBundlePolicy
}

export interface CanvasStream {
  canvas: HTMLCanvasElement
  stream: MediaStream
  fps: number
  quality: number
}

export interface AIStreamingPipeline {
  audioStream: MediaStream | null
  canvasStream: MediaStream | null
  metadataStream: string[] // JSON strings for drawing events
  isStreaming: boolean
  endpoint: string // Future Gemini Live endpoint
}

export interface PeerConnection {
  id: string
  connection: RTCPeerConnection
  dataChannel: RTCDataChannel | null
  audioChannel: RTCDataChannel | null
  canvasChannel: RTCDataChannel | null
  status: 'connecting' | 'connected' | 'disconnected' | 'failed'
  role: 'student' | 'teacher' | 'ai-tutor'
  lastActivity: number
}

class RTCManager {
  private peers = new Map<string, PeerConnection>()
  private localAudioStream: MediaStream | null = null
  private canvasStream: CanvasStream | null = null
  private aiPipeline: AIStreamingPipeline | null = null
  private isHost = false
  private roomId: string | null = null

  // Default configuration for educational use
  private readonly defaultConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // In production, add TURN servers for NAT traversal
      // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'balanced'
  }

  constructor() {
    // Only setup event listeners on client side
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  // Initialize real-time collaboration room
  async initializeRoom(roomId: string, isHost: boolean = false): Promise<boolean> {
    try {
      this.roomId = roomId
      this.isHost = isHost
      
      console.log(`🏠 Initializing RTC room: ${roomId} as ${isHost ? 'host' : 'participant'}`)
      
      // Setup local audio stream
      await this.setupLocalAudio()
      
      // If host, setup canvas streaming
      if (isHost) {
        await this.setupCanvasStreaming()
      }
      
      // Initialize AI streaming pipeline
      this.setupAIStreamingPipeline()
      
      return true
    } catch (error) {
      console.error('Failed to initialize RTC room:', error)
      return false
    }
  }

  // Setup local audio stream for voice communication
  async setupLocalAudio(): Promise<void> {
    try {
      // Enhanced audio constraints for educational use
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000, // High quality for speech
        channelCount: 1
      }

      this.localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false
      })

      console.log('🎤 Local audio stream setup complete')
      
      // Notify UI of audio setup
      window.dispatchEvent(new CustomEvent('simili-audio-ready', {
        detail: { hasAudio: true }
      }))
    } catch (error) {
      console.error('Failed to setup audio:', error)
      window.dispatchEvent(new CustomEvent('simili-audio-error', {
        detail: { error: error instanceof Error ? error.message : String(error) }
      }))
    }
  }

  // Setup canvas streaming for real-time drawing sync
  async setupCanvasStreaming(): Promise<void> {
    try {
      const canvas = document.querySelector('svg') as any // Our drawing SVG
      if (!canvas) {
        throw new Error('Canvas not found')
      }

      // Create a hidden canvas to capture SVG
      const captureCanvas = document.createElement('canvas')
      captureCanvas.width = 1920
      captureCanvas.height = 1080
      const ctx = captureCanvas.getContext('2d')!

      // Setup high-quality streaming
      const stream = captureCanvas.captureStream(30) // 30 FPS for smooth drawing
      
      this.canvasStream = {
        canvas: captureCanvas,
        stream,
        fps: 30,
        quality: 0.8
      }

      console.log('🎨 Canvas streaming setup complete')
      
      // Start streaming canvas updates
      this.startCanvasCapture(canvas, ctx)
      
    } catch (error) {
      console.error('Failed to setup canvas streaming:', error)
    }
  }

  // Capture SVG and stream it
  private startCanvasCapture(svgElement: SVGElement, ctx: CanvasRenderingContext2D): void {
    const captureFrame = () => {
      try {
        // Convert SVG to image data
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const img = new Image()
        
        img.onload = () => {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
          ctx.drawImage(img, 0, 0)
        }
        
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        img.src = url
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100)
        
      } catch (error) {
        console.error('Canvas capture error:', error)
      }
      
      requestAnimationFrame(captureFrame)
    }
    
    captureFrame()
  }

  // Setup AI streaming pipeline for Gemini Live integration
  setupAIStreamingPipeline(): void {
    this.aiPipeline = {
      audioStream: this.localAudioStream,
      canvasStream: this.canvasStream?.stream || null,
      metadataStream: [],
      isStreaming: false,
      endpoint: 'wss://future-gemini-live-endpoint.googleapis.com' // Placeholder
    }

    console.log('🤖 AI streaming pipeline ready')
  }

  // Create peer connection for student-to-student or student-to-teacher collaboration
  async createPeerConnection(peerId: string, role: 'student' | 'teacher' | 'ai-tutor'): Promise<PeerConnection> {
    const connection = new RTCPeerConnection(this.defaultConfig)
    
    // Setup data channels for different types of communication
    const dataChannel = connection.createDataChannel('drawing-events', {
      ordered: true,
      maxRetransmits: 3
    })
    
    const audioChannel = connection.createDataChannel('audio-metadata', {
      ordered: false
    })
    
    const canvasChannel = connection.createDataChannel('canvas-sync', {
      ordered: false,
      maxPacketLifeTime: 1000 // 1 second max latency for real-time feel
    })

    const peer: PeerConnection = {
      id: peerId,
      connection,
      dataChannel,
      audioChannel,
      canvasChannel,
      status: 'connecting',
      role,
      lastActivity: Date.now()
    }

    // Add local streams
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localAudioStream!)
      })
    }

    if (this.canvasStream?.stream) {
      this.canvasStream.stream.getTracks().forEach(track => {
        connection.addTrack(track, this.canvasStream!.stream)
      })
    }

    // Setup event handlers
    this.setupPeerEventHandlers(peer)
    
    this.peers.set(peerId, peer)
    return peer
  }

  // Setup event handlers for peer connections
  private setupPeerEventHandlers(peer: PeerConnection): void {
    const { connection, dataChannel, audioChannel, canvasChannel } = peer

    // Connection state changes
    connection.onconnectionstatechange = () => {
      peer.status = connection.connectionState as any
      peer.lastActivity = Date.now()
      
      console.log(`🔗 Peer ${peer.id} connection state: ${peer.status}`)
      
      window.dispatchEvent(new CustomEvent('simili-peer-status', {
        detail: { peerId: peer.id, status: peer.status, role: peer.role }
      }))
    }

    // ICE candidate handling
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this via signaling server
        console.log('🧊 ICE candidate for', peer.id, event.candidate)
      }
    }

    // Remote stream handling
    connection.ontrack = (event) => {
      console.log('📡 Received remote stream from', peer.id)
      
      window.dispatchEvent(new CustomEvent('simili-remote-stream', {
        detail: { 
          peerId: peer.id, 
          stream: event.streams[0],
          role: peer.role
        }
      }))
    }

    // Data channel message handling
    if (dataChannel) {
      dataChannel.onopen = () => {
        console.log('📡 Drawing events channel open with', peer.id)
      }

      dataChannel.onmessage = (event) => {
        try {
          const drawingEvent = JSON.parse(event.data)
          this.handleRemoteDrawingEvent(drawingEvent, peer)
        } catch (error) {
          console.error('Failed to parse drawing event:', error)
        }
      }
    }

    // Audio metadata channel
    if (audioChannel) {
      audioChannel.onmessage = (event) => {
        try {
          const audioMetadata = JSON.parse(event.data)
          this.handleAudioMetadata(audioMetadata, peer)
        } catch (error) {
          console.error('Failed to parse audio metadata:', error)
        }
      }
    }
  }

  // Send drawing event to all connected peers
  broadcastDrawingEvent(event: any): void {
    const eventData = JSON.stringify(event)
    
    this.peers.forEach(peer => {
      if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
        try {
          peer.dataChannel.send(eventData)
        } catch (error) {
          console.error(`Failed to send drawing event to ${peer.id}:`, error)
        }
      }
    })

    // Also add to AI pipeline for Gemini Live
    if (this.aiPipeline) {
      this.aiPipeline.metadataStream.push(eventData)
      
      // Keep only last 100 events for AI context
      if (this.aiPipeline.metadataStream.length > 100) {
        this.aiPipeline.metadataStream = this.aiPipeline.metadataStream.slice(-100)
      }
    }
  }

  // Handle incoming drawing events from peers
  private handleRemoteDrawingEvent(event: any, peer: PeerConnection): void {
    console.log('🎨 Remote drawing event from', peer.id, event.type)
    
    window.dispatchEvent(new CustomEvent('simili-remote-drawing', {
      detail: { 
        peerId: peer.id,
        role: peer.role,
        event
      }
    }))

    peer.lastActivity = Date.now()
  }

  // Handle audio metadata (voice commands, speech-to-text, etc.)
  private handleAudioMetadata(metadata: any, peer: PeerConnection): void {
    console.log('🎤 Audio metadata from', peer.id, metadata)
    
    window.dispatchEvent(new CustomEvent('simili-remote-audio-metadata', {
      detail: {
        peerId: peer.id,
        role: peer.role,
        metadata
      }
    }))
  }

  // Stream to AI tutor (Gemini Live integration point)
  async startAIStreaming(): Promise<boolean> {
    if (!this.aiPipeline) {
      console.error('AI pipeline not initialized')
      return false
    }

    try {
      // This is where we'd connect to Gemini Live API when available
      console.log('🤖 Starting AI streaming to:', this.aiPipeline.endpoint)
      
      // For now, simulate AI streaming by processing metadata locally
      this.aiPipeline.isStreaming = true
      
      // Send periodic updates to AI with canvas state + audio context
      setInterval(() => {
        if (this.aiPipeline?.isStreaming) {
          this.sendAIUpdate()
        }
      }, 2000) // Every 2 seconds
      
      return true
    } catch (error) {
      console.error('Failed to start AI streaming:', error)
      return false
    }
  }

  // Send contextual update to AI tutor
  private sendAIUpdate(): void {
    if (!this.aiPipeline) return

    const aiContext = {
      timestamp: Date.now(),
      roomId: this.roomId,
      canvasState: this.aiPipeline.metadataStream.slice(-10), // Last 10 events
      activeParticipants: Array.from(this.peers.values()).filter(p => p.status === 'connected').length,
      hasAudio: !!this.localAudioStream,
      hasCanvas: !!this.canvasStream
    }

    // In real implementation, send to Gemini Live WebSocket
    console.log('🤖 AI Context Update:', aiContext)
    
    // Simulate AI response
    setTimeout(() => {
      this.simulateAIResponse(aiContext)
    }, 500)
  }

  // Simulate AI tutor response (replace with real Gemini Live integration)
  private simulateAIResponse(context: any): void {
    const responses = [
      "I notice you're working on fractions. Would you like me to suggest some exercises?",
      "Great progress! Your drawing shows good understanding of number relationships.",
      "I see you're collaborating well. Keep sharing your mathematical thinking!",
      "The pattern you're creating reminds me of geometric sequences. Shall we explore that?"
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    window.dispatchEvent(new CustomEvent('simili-ai-suggestion', {
      detail: {
        text: randomResponse,
        context: 'collaboration',
        confidence: 0.85,
        timestamp: Date.now()
      }
    }))
  }

  // Setup global event listeners (client-side only)
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return
    
    // Listen for canvas drawing events to broadcast
    window.addEventListener('simili-drawing-event', (event: any) => {
      this.broadcastDrawingEvent(event.detail)
    })

    // Listen for manipulative interactions
    window.addEventListener('simili-manipulative-event', (event: any) => {
      this.broadcastDrawingEvent({
        type: 'manipulative',
        ...event.detail
      })
    })

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup()
    })
  }

  // Cleanup connections
  cleanup(): void {
    console.log('🧹 Cleaning up RTC connections')
    
    this.peers.forEach(peer => {
      peer.connection.close()
    })
    this.peers.clear()

    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach(track => track.stop())
    }

    if (this.aiPipeline) {
      this.aiPipeline.isStreaming = false
    }
  }

  // Get connection stats
  getConnectionStats(): any {
    return {
      roomId: this.roomId,
      isHost: this.isHost,
      connectedPeers: Array.from(this.peers.values()).filter(p => p.status === 'connected').length,
      totalPeers: this.peers.size,
      hasAudio: !!this.localAudioStream,
      hasCanvas: !!this.canvasStream,
      aiStreaming: this.aiPipeline?.isStreaming || false
    }
  }
}

// Singleton instance
export const rtcManager = new RTCManager()

// React hook for RTC features
export function useRTC() {
  return {
    initializeRoom: (roomId: string, isHost?: boolean) => rtcManager.initializeRoom(roomId, isHost),
    createPeer: (peerId: string, role: 'student' | 'teacher' | 'ai-tutor') => 
      rtcManager.createPeerConnection(peerId, role),
    broadcastDrawing: (event: any) => rtcManager.broadcastDrawingEvent(event),
    startAIStreaming: () => rtcManager.startAIStreaming(),
    getStats: () => rtcManager.getConnectionStats(),
    cleanup: () => rtcManager.cleanup()
  }
}
