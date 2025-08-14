// Accepts a photo that Pi should consider alongside the canvas
import { NextRequest, NextResponse } from 'next/server'
import { photoStore } from '../store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const base64: string | undefined = body?.base64
    const sessionId: string = body?.sessionId || 'local'
    const name: string | undefined = body?.name
    if (!base64 || base64.length < 10) {
      return NextResponse.json({ error: 'Missing photo' }, { status: 400 })
    }
    photoStore[sessionId] = { base64, ts: Date.now(), name }
    return NextResponse.json({ ok: true, sessionId })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ storedSessions: Object.keys(photoStore).length })
}


