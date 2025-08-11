'use client'

import { useState, useEffect } from 'react'
import { useVoice } from '@/lib/voiceManager'
import AccessibleButton from './AccessibleButton'

interface VoiceControlProps {
  onModeChange: (mode: 'pointer' | 'pencil') => void
  onAddManipulative: (type: string) => void
  onClearCanvas: () => void
  onUndo: () => void
  onRedo: () => void
  onShowShare: () => void
  onShowProgress: () => void
}

const VoiceControl = ({
  onModeChange,
  onAddManipulative,
  onClearCanvas,
  onUndo,
  onRedo,
  onShowShare,
  onShowProgress
}: VoiceControlProps) => {
  const voice = useVoice()
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [showCommands, setShowCommands] = useState(false)

  // Register voice commands
  useEffect(() => {
    voice.registerCommand('switch_mode', (params: any) => {
      onModeChange(params?.mode || 'pointer')
    })

    voice.registerCommand('add_manipulative', (params: any) => {
      onAddManipulative(params?.type || 'number-line')
    })

    voice.registerCommand('clear_canvas', () => {
      onClearCanvas()
    })

    voice.registerCommand('undo', () => {
      onUndo()
    })

    voice.registerCommand('redo', () => {
      onRedo()
    })

    voice.registerCommand('share_session', () => {
      onShowShare()
    })

    voice.registerCommand('show_progress', () => {
      onShowProgress()
    })
  }, [onModeChange, onAddManipulative, onClearCanvas, onUndo, onRedo, onShowShare, onShowProgress])

  // Listen for voice events
  useEffect(() => {
    const handleVoiceStarted = () => setIsListening(true)
    const handleVoiceEnded = () => setIsListening(false)
    const handleVoiceCommand = (event: any) => {
      setLastCommand(event.detail.command.description)
      setTimeout(() => setLastCommand(null), 3000)
    }

    window.addEventListener('simili-voice-started', handleVoiceStarted)
    window.addEventListener('simili-voice-ended', handleVoiceEnded)
    window.addEventListener('simili-voice-command', handleVoiceCommand)

    return () => {
      window.removeEventListener('simili-voice-started', handleVoiceStarted)
      window.removeEventListener('simili-voice-ended', handleVoiceEnded)
      window.removeEventListener('simili-voice-command', handleVoiceCommand)
    }
  }, [])

  const handleVoiceToggle = () => {
    if (isListening) {
      voice.stopListening()
    } else {
      voice.startListening()
    }
  }

  if (!voice.isSupported()) {
    return null // Don't render if voice is not supported
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
      {/* Command Help Panel */}
      {showCommands && (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">🎤 Voice Commands</h3>
            <button
              onClick={() => setShowCommands(false)}
              className="text-gray-400 hover:text-gray-600 text-lg"
              aria-label="Close commands"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <div className="font-medium text-gray-700">🎨 Drawing:</div>
              <div className="text-gray-600 ml-2">
                • "Clear canvas"<br/>
                • "Undo" / "Redo"<br/>
                • "Pencil mode" / "Pointer mode"
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-gray-700">🔧 Tools:</div>
              <div className="text-gray-600 ml-2">
                • "Add number line"<br/>
                • "Add fraction bar"<br/>
                • "Add calculator"
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-gray-700">📊 Session:</div>
              <div className="text-gray-600 ml-2">
                • "Share my work"<br/>
                • "Show progress"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Command Feedback */}
      {lastCommand && (
        <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 shadow-sm">
          <div className="text-sm text-green-800 font-medium">
            ✓ {lastCommand}
          </div>
        </div>
      )}

      {/* Voice Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Commands Help */}
        <AccessibleButton
          onClick={() => setShowCommands(!showCommands)}
          className="w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-lg transition-all duration-200"
          aria-label="Show voice commands"
        >
          <span className="text-lg">❓</span>
        </AccessibleButton>

        {/* Main Voice Button */}
        <AccessibleButton
          onClick={handleVoiceToggle}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start voice commands'}
        >
          <span className="text-2xl">
            {isListening ? '🔴' : '🎤'}
          </span>
        </AccessibleButton>
      </div>

      {/* Voice Status Indicator */}
      {(isListening || isSpeaking) && (
        <div className="text-center">
          <div className={`text-xs font-medium ${
            isListening ? 'text-red-600' : 'text-blue-600'
          }`}>
            {isListening ? '🎤 Listening...' : '🔊 Speaking...'}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceControl
