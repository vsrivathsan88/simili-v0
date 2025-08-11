'use client'

import { useState, useEffect } from 'react'
import SimpleDrawingCanvas from '@/components/SimpleDrawingCanvas'
import GeminiLiveTutor from '@/components/GeminiLiveTutor'
import SessionStartDialog from '@/components/SessionStartDialog'

export default function SimplePage() {
  const [showStartDialog, setShowStartDialog] = useState(true)
  const [sessionActive, setSessionActive] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  const handleStartSession = (enableVoice: boolean) => {
    setVoiceEnabled(enableVoice)
    setSessionActive(true)
    setShowStartDialog(false)
  }

  const handleSkipSession = () => {
    setSessionActive(false)
    setShowStartDialog(false)
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden flex flex-col">
      {/* Minimal Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📚</span>
            <span>Simili</span>
          </h1>
          
          {sessionActive && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600">Pi is helping</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Clean Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Canvas Area - Full width when no session */}
        <div className={`transition-all duration-300 ${
          sessionActive ? 'w-2/3' : 'w-full'
        } h-full p-4`}>
          <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <SimpleDrawingCanvas />
          </div>
        </div>

        {/* Tutor Panel - Slides in when session active */}
        {sessionActive && (
          <div className="w-1/3 h-full p-4 pl-0">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
              <GeminiLiveTutor 
                className="h-full" 
                autoStartVoice={voiceEnabled}
              />
            </div>
          </div>
        )}
      </main>

      {/* Session Start Dialog */}
      <SessionStartDialog
        isOpen={showStartDialog}
        onStart={handleStartSession}
        onSkip={handleSkipSession}
      />

      {/* Floating Action Button - Show when no session */}
      {!sessionActive && !showStartDialog && (
        <button
          onClick={() => setShowStartDialog(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-2xl"
          aria-label="Start learning with Pi"
        >
          🔮
        </button>
      )}
    </div>
  )
}
