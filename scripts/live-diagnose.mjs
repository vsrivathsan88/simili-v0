#!/usr/bin/env node
// Quick Gemini Live diagnostic via local relay
import WebSocket from 'ws'

const RELAY_PORT = process.env.LIVE_RELAY_PORT || process.env.NEXT_PUBLIC_LIVE_RELAY_PORT || 8787
const url = `ws://localhost:${RELAY_PORT}/live`

const ws = new WebSocket(url)

const log = (label, data) => {
  try {
    const str = typeof data === 'string' ? data : Buffer.isBuffer(data) ? data.toString('utf8') : String(data)
    console.log(label, str.slice(0, 500))
  } catch {
    console.log(label, '[binary]')
  }
}

ws.on('open', () => {
  console.log('diagnose: connected to relay', url)
  const setup = {
    setup: {
      model: 'models/gemini-2.0-flash',
      generationConfig: { temperature: 0.2, maxOutputTokens: 64 },
      systemInstruction: { parts: [{ text: 'You are a helpful tutor.' }] }
    }
  }
  ws.send(JSON.stringify(setup))

  const ask = {
    clientContent: {
      turns: [{ role: 'user', parts: [{ text: 'Say hello in 5 words.' }] }],
      turnComplete: true
    }
  }
  setTimeout(() => ws.send(JSON.stringify(ask)), 300)

  // auto close after 10s
  setTimeout(() => {
    console.log('diagnose: closing')
    try { ws.close() } catch {}
  }, 10000)
})

ws.on('message', (data) => {
  log('recv:', data)
})

ws.on('close', (code, reason) => {
  console.log('diagnose: closed', code, reason?.toString?.() || '')
})

ws.on('error', (err) => {
  console.error('diagnose: error', err)
})


