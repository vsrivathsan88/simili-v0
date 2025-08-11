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

  useEffect(() => {
    // Check if browser supports voice
    const supportsVoice = typeof navigator !== 'undefined' && 
                         navigator.mediaDevices && 
                         navigator.mediaDevices.getUserMedia
    
    setHasPermissions(supportsVoice)
  }, [])

  const handleStart = () => {
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
              Meet Pi, Your Math Tutor!
            </h2>
            <p className="text-gray-600">
              Pi can see your drawings and help you explore math concepts in real-time.
            </p>
          </div>

          {/* Voice Option */}
          {hasPermissions && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="enableVoice"
                  checked={enableVoice}
                  onChange={(e) => setEnableVoice(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="enableVoice" className="text-sm font-medium text-blue-900 cursor-pointer">
                    🎤 Enable Voice Chat
                  </label>
                  <p className="text-xs text-blue-700 mt-1">
                    Talk to Pi about your mathematical thinking! (Optional)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features Preview */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <span className="text-gray-700">Pi watches your canvas and provides hints</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <span className="text-gray-700">Ask questions anytime through chat</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <span className="text-gray-700">Pi can draw helpful annotations</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleStart}
              className="flex-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <span>🚀</span>
              <span>Start Learning with Pi</span>
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Pi only sees your drawings during this session. No data is stored permanently.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
