import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const url = new URL(request.url)
  const skipGemini = url.searchParams.get('skipGemini') === '1' || url.searchParams.get('mode') === 'env'
  const modelOverride = url.searchParams.get('model')
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const defaultModel = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash'
    const allowed = new Set(['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'])
    const modelName = modelOverride && allowed.has(modelOverride) ? modelOverride : defaultModel

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        error: 'Missing GEMINI_API_KEY',
        durationMs: Date.now() - startedAt,
        checks: { env: false, model: modelName, gemini: skipGemini ? 'skipped' : 'not-checked' }
      }, { status: 500 })
    }

    if (skipGemini) {
      return NextResponse.json({
        ok: true,
        durationMs: Date.now() - startedAt,
        checks: { env: true, model: modelName, gemini: 'skipped' }
      })
    }

    // Minimal cost text ping with small retry loop (handles transient 5xx)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0, maxOutputTokens: 1 }
    })

    let lastErr: any = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await model.generateContent('ping')
        return NextResponse.json({
          ok: true,
          durationMs: Date.now() - startedAt,
          checks: { env: true, model: modelName, gemini: 'ok' }
        })
      } catch (e) {
        lastErr = e
        await new Promise(r => setTimeout(r, 250 * (attempt + 1)))
      }
    }

    const message = lastErr?.message || 'Unknown error'
    return NextResponse.json({
      ok: false,
      error: message,
      durationMs: Date.now() - startedAt,
    }, { status: 500 })
  } catch (error: any) {
    const message = error?.message || 'Unknown error'
    return NextResponse.json({
      ok: false,
      error: message,
      durationMs: Date.now() - startedAt,
    }, { status: 500 })
  }
}


