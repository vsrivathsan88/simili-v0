// Vision snapshot endpoint: accepts base64 PNG, returns one-sentence coaching text

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { photoStore } from '../store'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Robustly parse body; handle empty or invalid JSON without throwing
    let bodyText = ''
    try {
      bodyText = await request.text()
    } catch {}
    if (!bodyText || bodyText.trim().length === 0) {
      return NextResponse.json({ error: 'Missing JSON body' }, { status: 400 })
    }
    let body: any
    try {
      body = JSON.parse(bodyText)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const base64Png: string | undefined = body?.base64Png
    const topic: string = body?.topic || 'math exploration'
    const sessionId: string = body?.sessionId || 'local'
    const widthPx = typeof body?.widthPx === 'number' ? Math.max(1, Math.floor(body.widthPx)) : undefined
    const heightPx = typeof body?.heightPx === 'number' ? Math.max(1, Math.floor(body.heightPx)) : undefined
    const manipulatives = Array.isArray(body?.manipulatives) ? body.manipulatives : []

    if (!base64Png || typeof base64Png !== 'string' || base64Png.length < 10) {
      return NextResponse.json({ error: 'Missing base64Png' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash'
    const model = genAI.getGenerativeModel({ model: modelName })

    const sys = `You are Pi, a warm, encouraging elementary math tutor.
You will be given an optional reference photo and the student's current canvas snapshot.
Task 1: Provide ONE short sentence (<= 18 words) that gently nudges thinking with a single question. Do not give answers.
Task 2: Extract a tiny analysis JSON of what's visible (e.g., { shapes: ["circle"], numberLine: { markers: [5,10] } }). Keep it small.
Output JSON only in the following schema with no extra text:
{"summary": string, "analysis": {}}
If you cannot analyze, set analysis to an empty object.`

    const parts: any[] = [{ text: sys }]
    // Include the active photo if present for the session
    const photo = photoStore[sessionId]
    if (photo?.base64) {
      parts.push({ text: 'Reference photo:' })
      parts.push({ inlineData: { mimeType: 'image/png', data: photo.base64 } })
    }
    parts.push({ text: 'Student canvas snapshot:' })
    parts.push({ inlineData: { mimeType: 'image/png', data: base64Png } })
    const sizeHint = widthPx && heightPx ? ` CanvasSizePx: { width: ${widthPx}, height: ${heightPx} }.` : ''
    const mHint = manipulatives.length > 0 ? ` Manipulatives (approx, normalized): ${JSON.stringify(manipulatives.slice(0,3))}. If helpful, place the annotation near the most relevant manipulative (e.g., highlight a specific marker, shaded part, or point).` : ''
    parts.push({ text: `Current topic: ${topic}.${sizeHint}${mHint} Return only the JSON as described. Always return annotation coordinates normalized (0..1) in the same space as the canvas snapshot.` })

    const result = await model.generateContent(parts)
    const raw = String(result?.response?.text?.() || '')
    let text = ''
    let analysis: Record<string, unknown> | undefined
    // Robust normalization: accept either exact JSON or free-form, extract first {...}
    const trimmed = raw.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const json = JSON.parse(trimmed)
        text = typeof json?.summary === 'string' ? json.summary : ''
        analysis = typeof json?.analysis === 'object' ? json.analysis : undefined
      } catch {
        text = trimmed
      }
    } else {
      const match = /\{[\s\S]*\}/.exec(trimmed)
      if (match) {
        try {
          const json = JSON.parse(match[0])
          text = typeof json?.summary === 'string' ? json.summary : ''
          analysis = typeof json?.analysis === 'object' ? json.analysis : undefined
        } catch {
          text = trimmed.replace(/^[\s\S]*?summary\s*[:=]\s*/i, '').split(/\n|\r/)[0].slice(0, 140)
        }
      } else {
        text = trimmed
      }
    }
    // Ensure plain text to end user
    if (text && /\{\s*\"?analysis\"?\s*:/i.test(text)) {
      text = text.replace(/\{[\s\S]*\}$/,'').trim()
    }
    return NextResponse.json({ text, analysis, sessionId })
  } catch (error) {
    console.error('pi/canvas error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


