// Server-side API route for Gemini Live WebSocket proxy
// This keeps the API key secure on the server side

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    // Server-side API key (secure)
    const apiKey = process.env.GEMINI_API_KEY // No NEXT_PUBLIC prefix!
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'get-websocket-url':
        // Prefer the service path for BidiGenerateContent (more reliable for Live)
        // Model is provided in the setup frame, so we don't embed it here
        // Example: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=API_KEY
        {
          const serviceUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`
          return NextResponse.json({ wsUrl: serviceUrl })
        }
      
      case 'validate-connection':
        // Test API connectivity
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
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
    console.error('Gemini Live API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY
  return NextResponse.json({
    configured: !!apiKey,
    timestamp: new Date().toISOString()
  })
}
