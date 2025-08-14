// Server-side text generation endpoint for Pi tutor (keeps API key off client)

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Robustly parse body; handle empty or invalid JSON without throwing
    let raw = ''
    try {
      raw = await request.text()
    } catch {}
    if (!raw || raw.trim().length === 0) {
      return NextResponse.json({ error: 'Missing body' }, { status: 400 })
    }
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { prompt, temperature, maxTokens, model } = parsed || {}
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // Server owns the model choice; ignore client override for stability/cost control
    const chosenModel = (process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash')

    const generationConfig: Record<string, unknown> = {
      temperature: typeof temperature === 'number' ? temperature : Number(process.env.GEMINI_TEMPERATURE ?? 0.7),
      maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : Number(process.env.GEMINI_MAX_TOKENS ?? 96)
    }

    const modelHandle = genAI.getGenerativeModel({ model: chosenModel as string, generationConfig })
    const result = await modelHandle.generateContent(prompt)
    const text = result?.response?.text?.() || ''
    return NextResponse.json({ text })
  } catch (error) {
    console.error('gemini-text route error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


