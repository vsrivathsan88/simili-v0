// Mint an ephemeral Daily meeting token and ensure a room exists
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const apiKey = (process.env.DAILY_API_KEY || '').trim()
    const domain = (process.env.DAILY_DOMAIN || '').trim()
    if (!apiKey || !domain) {
      return NextResponse.json({ error: 'Missing DAILY_API_KEY or DAILY_DOMAIN' }, { status: 500 })
    }

    // Create or reuse a room
    const roomName = `simili-voice`
    const roomUrl = `https://${domain}.daily.co/${roomName}`

    // Try to create the room idempotently
    await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          enable_screenshare: false,
          enable_chat: false,
          start_video_off: true,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 // expire in 60m
        }
      })
    }).catch(() => {})

    // Create a meeting token for this room
    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: false,
          user_name: 'student'
        }
      })
    })
    if (!tokenRes.ok) {
      const text = await tokenRes.text()
      return NextResponse.json({ error: 'Failed to create token', details: text }, { status: 500 })
    }
    const tokenJson = await tokenRes.json()
    const token = tokenJson?.token || tokenJson?.access_token || null
    if (!token) return NextResponse.json({ error: 'No token returned' }, { status: 500 })

    return NextResponse.json({ roomUrl, roomName, token })
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', details: e?.message || String(e) }, { status: 500 })
  }
}


