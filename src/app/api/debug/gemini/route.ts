import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(_req: NextRequest) {
  const startedAt = Date.now()
  const rawKey = process.env.GEMINI_API_KEY ?? ''
  const key = rawKey.trim()
  const keyLen = key.length
  const masked = keyLen > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '(too short)'
  const headHex = keyLen > 0 ? key.charCodeAt(0).toString(16) : ''
  const tailHex = keyLen > 0 ? key.charCodeAt(keyLen - 1).toString(16) : ''
  const model = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash'

  const result: any = {
    ok: !!keyLen,
    durationMs: Date.now() - startedAt,
    env: {
      keyPresent: !!keyLen,
      keyMasked: masked,
      keyLength: keyLen,
      firstCharHex: headHex,
      lastCharHex: tailHex,
      model
    }
  }

  if (!keyLen) {
    return NextResponse.json(result)
  }

  try {
    const genAI = new GoogleGenerativeAI(key)
    const modelHandle = genAI.getGenerativeModel({ model, generationConfig: { temperature: 0, maxOutputTokens: 1 } })
    await modelHandle.generateContent('ping')
    result.gemini = { status: 'ok' }
  } catch (e: any) {
    result.gemini = { status: 'error', message: e?.message || String(e) }
  }

  result.durationMs = Date.now() - startedAt
  return NextResponse.json(result)
}


