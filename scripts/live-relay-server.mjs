#!/usr/bin/env node
// Minimal WS relay: browser <-> local relay <-> Gemini Live
// Run locally with: npm run relay

import http from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const PORT = process.env.LIVE_RELAY_PORT ? Number(process.env.LIVE_RELAY_PORT) : 8787
const GEMINI_KEY = process.env.GEMINI_API_KEY
const PRIMARY_MODEL = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash'

if (!GEMINI_KEY) {
  console.error('GEMINI_API_KEY is required')
  process.exit(1)
}

// Build a list of candidate upstream WS URLs to try in order
function buildCandidateUrls(key, model) {
  const models = Array.from(new Set([
    model,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ].filter(Boolean)))

  const urls = []
  // 1) BidiGenerateContent (service path). Model provided in setup frame
  urls.push(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent?key=${key}`)
  // 1b) Alternate dot variant (some runtimes accept dot between service and method)
  urls.push(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`)

  // 2) Model-scoped streaming endpoints (older style)
  for (const m of models) {
    urls.push(`wss://generativelanguage.googleapis.com/ws/v1beta/models/${m}:streamGenerateContent?key=${key}`)
    urls.push(`wss://generativelanguage.googleapis.com/ws/v1beta/models/${m}:generateContent?key=${key}`)
  }
  return urls
}

function toSnakeCaseFrame(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const mapKey = (k) => ({
    generationConfig: 'generation_config',
    systemInstruction: 'system_instruction',
    clientContent: 'client_content',
    turnComplete: 'turn_complete',
    inlineData: 'inline_data',
    mimeType: 'mime_type',
  })[k] || k
  if (Array.isArray(obj)) return obj.map(toSnakeCaseFrame)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[mapKey(k)] = toSnakeCaseFrame(v)
  }
  return out
}

const server = http.createServer()
const wss = new WebSocketServer({ server, path: '/live' })

wss.on('connection', async (client) => {
  console.log('Client connected to relay')

  // Connect to first working upstream
  const candidateUrls = buildCandidateUrls(GEMINI_KEY, PRIMARY_MODEL)
  let upstream = null
  let chosenUrl = null
  let chosenModel = PRIMARY_MODEL

  let useSnake = false
  for (const url of candidateUrls) {
    try {
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(url)
        const timer = setTimeout(() => {
          try { ws.terminate() } catch {}
          reject(new Error('upstream_connect_timeout'))
        }, 6000)
        ws.on('open', () => {
          clearTimeout(timer)
          upstream = ws
          chosenUrl = url
          useSnake = /GenerativeService/.test(url)
          resolve(null)
        })
        ws.on('error', (e) => {
          clearTimeout(timer)
          reject(e)
        })
        ws.on('close', (code) => {
          clearTimeout(timer)
          reject(new Error(`closed_${code}`))
        })
      })
      break
    } catch (e) {
      continue
    }
  }

  if (!upstream) {
    console.error('Relay failed to connect upstream to any candidate URL')
    try { client.send(JSON.stringify({ error: 'no_upstream' })) } catch {}
    client.close(1011, 'no_upstream')
    return
  }

  console.log('Relay connected upstream to Google at', chosenUrl)

  // If the chosen URL embeds a model name, extract it to keep client setup consistent
  const match = /models\/([^:]+):/.exec(chosenUrl || '')
  if (match && match[1]) {
    chosenModel = match[1]
  }

  upstream.on('message', (data) => {
    try {
      const preview = data instanceof Buffer ? data.toString('utf8').slice(0,200) : String(data).slice(0,200)
      console.log('Upstream -> client:', preview)
    } catch {}
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })

  upstream.on('close', (code, reason) => {
    console.log('Upstream closed', code, reason.toString())
    if (client.readyState === WebSocket.OPEN) client.close(code, reason.toString())
  })

  upstream.on('error', (err) => {
    console.error('Upstream error', err)
    try { client.send(JSON.stringify({ error: 'upstream_error' })) } catch {}
  })

  // Browser -> Upstream (with optional setup model rewrite)
  client.on('message', (data) => {
    let forwarded = data
    try {
      const text = typeof data === 'string' ? data : (data instanceof Buffer ? data.toString('utf8') : null)
      if (text) {
        const obj = JSON.parse(text)
        if (obj?.setup && typeof obj.setup === 'object') {
          const m = obj.setup.model
          if (typeof m === 'string') {
            obj.setup.model = m.startsWith('models/') ? m : `models/${chosenModel}`
          } else if (!m) {
            obj.setup.model = `models/${chosenModel}`
          }
          // normalize generationConfig casing
          if (obj.setup.generation_config && !obj.setup.generationConfig) {
            obj.setup.generationConfig = obj.setup.generation_config
            delete obj.setup.generation_config
          }
          if (useSnake) {
            // default to TEXT modality for service path
            if (!obj.setup.responseModalities && !obj.setup.response_modalities) {
              obj.setup.responseModalities = ['TEXT']
            }
            const snake = toSnakeCaseFrame(obj)
            forwarded = JSON.stringify(snake)
          } else {
            // model-scoped paths prefer camelCase; avoid responseModalities to reduce schema errors
            forwarded = JSON.stringify(obj)
          }
        }
      }
    } catch { /* pass-through on non-JSON frames */ }
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.send(forwarded)
    }
  })

  client.on('close', (code, reason) => {
    console.log('Client closed', code, reason.toString())
    if (upstream.readyState === WebSocket.OPEN) upstream.close(1000, 'client_closed')
  })

  client.on('error', (err) => {
    console.error('Client error', err)
    if (upstream.readyState === WebSocket.OPEN) upstream.close(1011, 'client_error')
  })
})

server.listen(PORT, () => {
  console.log(`Live relay listening on ws://localhost:${PORT}/live`)
})


