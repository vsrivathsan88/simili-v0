'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SessionStartDialogProps {
  isOpen: boolean
  onStart: (enableVoice: boolean) => void
  onSkip: () => void
}

export default function SessionStartDialog({ isOpen, onStart, onSkip }: SessionStartDialogProps) {
  const [enableVoice, setEnableVoice] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)
  const [quick, setQuick] = useState<null | 'draw' | 'measure' | 'explain'>(null)

  useEffect(() => {
    // Check if browser supports voice (boolean), avoid passing function to setState
    const supportsVoice = typeof navigator !== 'undefined' &&
      !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')
    setHasPermissions(supportsVoice)
  }, [])

  const handleStart = async () => {
    // Proactively request microphone permission so getUserMedia works later
    if (enableVoice && typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Immediately stop tracks; we only wanted the permission grant
        stream.getTracks().forEach(t => t.stop())
      } catch (e) {
        console.warn('Microphone permission denied or unavailable:', e)
      }
    }

    // Simple quick-start actions
    try {
      if (quick === 'draw') {
        window.dispatchEvent(new CustomEvent('simili-mode-change', { detail: { mode: 'pencil' } }))
      } else if (quick === 'measure') {
        window.dispatchEvent(new CustomEvent('simili-add-manipulative', { detail: { type: 'number-line' } }))
        window.dispatchEvent(new CustomEvent('simili-mode-change', { detail: { mode: 'pointer' } }))
      } else if (quick === 'explain') {
        window.dispatchEvent(new CustomEvent('simili-mode-change', { detail: { mode: 'pointer' } }))
      }
    } catch {}
    onStart(enableVoice)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔮</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Pi Lab
            </h2>
            <p className="text-gray-600">
              Sketch. Think. Check.
            </p>
          </div>

          {/* Quick-start chips */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'draw', label: 'Draw', emoji: '✏️' },
                { id: 'measure', label: 'Measure', emoji: '📏' },
                { id: 'explain', label: 'Explain', emoji: '💬' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setQuick(item.id as any)}
                  className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    quick === item.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-pressed={quick === (item.id as any)}
                >
                  <span className="mr-1">{item.emoji}</span>{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Option (compact) */}
          {hasPermissions && (
            <label className="flex items-center gap-2 mb-6 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={enableVoice}
                onChange={(e) => setEnableVoice(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Add voice (optional)</span>
            </label>
          )}

          {/* Features Preview */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <span className="text-gray-700">Pi watches your canvas and offers nudges</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <span className="text-gray-700">Ask questions anytime in chat</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <span className="text-gray-700">Pi can draw helpful annotations</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex">
            <button
              onClick={handleStart}
              className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>Enter</span>
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Your work stays on this device for this session only.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
