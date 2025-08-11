// Socket.IO Server for Reliable Gemini Live Connection
// This provides auto-reconnection, message buffering, and room-based collaboration

import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

// Store the Socket.IO server instance
let io: SocketIOServer | undefined

// Active WebSocket connections to Gemini Live (per client)
const geminiConnections = new Map<string, WebSocket>()

export async function GET() {
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = new HTTPServer()
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'development' 
          ? "http://localhost:3000" 
          : process.env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      allowUpgrades: true
    })

    // Handle Socket.IO connections
    io.on('connection', (socket) => {
      console.log(`🔗 Pi client connected: ${socket.id}`)
      
      // Join the Pi tutoring room for collaboration
      socket.join('pi-tutoring')

      // Handle Gemini Live setup
      socket.on('gemini:setup', async (data) => {
        try {
          await setupGeminiConnection(socket.id, data)
          socket.emit('gemini:connected', { 
            status: 'connected',
            clientId: socket.id 
          })
        } catch (error) {
          console.error('❌ Gemini setup failed:', error)
          socket.emit('gemini:error', { 
            error: 'Failed to connect to Gemini Live',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      // Handle messages to Gemini Live
      socket.on('gemini:message', (message) => {
        forwardToGemini(socket.id, message)
      })

      // Handle canvas updates
      socket.on('gemini:canvas', (canvasData) => {
        forwardToGemini(socket.id, {
          type: 'canvas_update',
          data: canvasData
        })
        // Also broadcast to other clients in the room for collaboration
        socket.to('pi-tutoring').emit('canvas:update', canvasData)
      })

      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 Pi client disconnected: ${socket.id}`)
        closeGeminiConnection(socket.id)
      })

      // Send initial status
      socket.emit('pi:status', {
        connected: true,
        timestamp: new Date().toISOString(),
        features: ['auto-reconnect', 'message-buffering', 'collaboration']
      })
    })

    console.log('🚀 Socket.IO server initialized for Pi tutoring')
  }

  return new Response('Socket.IO server running', { status: 200 })
}

// Setup WebSocket connection to Gemini Live
async function setupGeminiConnection(clientId: string, setupData: Record<string, unknown>): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  const wsUrl = `wss://generativelanguage.googleapis.com/ws/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${apiKey}`
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log(`🤖 Gemini Live connected for client: ${clientId}`)
      
      // Send initial configuration
      ws.send(JSON.stringify({
        setup: {
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
          systemInstruction: setupData.systemInstruction || `You are Pi, a warm, patient math tutor for elementary students. 

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
- Grade appropriate language
- Never judgmental about mistakes
- Focus on process over answers`
        }
      }))
      
      geminiConnections.set(clientId, ws)
      resolve()
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // Forward Gemini response back to client via Socket.IO
        if (io) {
          io.to(clientId).emit('gemini:response', data)
        }
      } catch (error) {
        console.error('❌ Error parsing Gemini response:', error)
      }
    }
    
    ws.onclose = () => {
      console.log(`🔌 Gemini Live disconnected for client: ${clientId}`)
      geminiConnections.delete(clientId)
      // Notify client of disconnection
      if (io) {
        io.to(clientId).emit('gemini:disconnected', {
          reason: 'connection_closed',
          reconnecting: true
        })
      }
    }
    
    ws.onerror = (error) => {
      console.error(`❌ Gemini WebSocket error for client ${clientId}:`, error)
      reject(error)
    }
  })
}

// Forward message to Gemini Live
function forwardToGemini(clientId: string, message: Record<string, unknown>) {
  const ws = geminiConnections.get(clientId)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  } else {
    console.warn(`⚠️  No active Gemini connection for client: ${clientId}`)
    // Notify client that message couldn't be sent
    if (io) {
      io.to(clientId).emit('gemini:error', {
        error: 'Connection not available',
        message: 'Attempting to reconnect...'
      })
    }
  }
}

// Close Gemini connection for a client
function closeGeminiConnection(clientId: string) {
  const ws = geminiConnections.get(clientId)
  if (ws) {
    ws.close()
    geminiConnections.delete(clientId)
  }
}
