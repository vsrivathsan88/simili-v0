// Simple API route for Socket.IO status and Gemini Live proxy
// This provides a bridge between the client and Gemini Live without complex server setup

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ready',
      message: 'Socket.IO client ready for connection',
      timestamp: new Date().toISOString(),
      features: ['auto-reconnect', 'message-buffering', 'fallback']
    })
  } catch (error) {
    console.error('❌ Socket API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json()
    
    switch (action) {
      case 'get-gemini-url':
        // Return Gemini Live WebSocket URL for client-side connection
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
          return NextResponse.json(
            { error: 'Gemini API key not configured' },
            { status: 500 }
          )
        }
        
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`
        return NextResponse.json({ wsUrl })
      
      case 'validate-connection':
        // Test API connectivity
        const testApiKey = process.env.GEMINI_API_KEY
        if (!testApiKey) {
          return NextResponse.json({ valid: false, error: 'API key not configured' })
        }
        
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${testApiKey}`
          )
          const isValid = response.ok
          return NextResponse.json({ valid: isValid })
        } catch (error) {
          return NextResponse.json({ valid: false, error: 'Connection failed' })
        }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Socket API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
