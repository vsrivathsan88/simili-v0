'use client'

import { useState, useEffect } from 'react'
import PhotoPanel from '@/components/PhotoPanel'
import SimiliCanvas from '@/components/SimiliCanvas'
import InsightsPanel from '@/components/InsightsPanel'
import AccessibleButton from '@/components/AccessibleButton'
// Shape suggestions disabled in favor of vision analysis
import { type DetectedShape, type SmartSuggestion } from '@/lib/shapeDetection'
import { useSessionManager, sessionManager } from '@/lib/sessionManager'
import { useCollaboration } from '@/lib/collaborationManager'
import ShareDialog from '@/components/ShareDialog'
// Temporarily disable problematic imports while fixing SSR issues
// import VoiceControl from '@/components/VoiceControl'
// import RealtimeCollaboration from '@/components/RealtimeCollaboration'
import AmbientAgent from '@/components/AmbientAgent'
import SessionStartDialog from '@/components/SessionStartDialog'
import ReasoningMap from '@/components/ReasoningMap'

type PiState = 'idle' | 'listening' | 'thinking' | 'suggesting'

export default function Home() {
  // Use the singleton directly to avoid recreating the object
  const sessionManager = useSessionManager()
  const collaboration = useCollaboration()
  const [sessionStarted, setSessionStarted] = useState(false)
  const [canvasHasPaths, setCanvasHasPaths] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [currentSessionName, setCurrentSessionName] = useState('')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [canvasRef, setCanvasRef] = useState<any>(null) // Ref to canvas for voice commands
  const [collaborationRoomId, setCollaborationRoomId] = useState<string | null>(null)
  const [isCollaborationHost, setIsCollaborationHost] = useState(false)
  const [ambientAgentActive, setAmbientAgentActive] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(true)
  const [piState, setPiState] = useState<PiState>('idle')
  const [detectedShapes, setDetectedShapes] = useState<DetectedShape[]>([])
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([])
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([])
  const [showReasoningMap, setShowReasoningMap] = useState(false)

  const handleStartSession = () => {
    setSessionStarted(true)
  }

  const handleAutoAddManipulative = (type: string) => {
    // Log activity for progress tracking
    sessionManager.logActivity('manipulative_added', { manipulativeType: type })
    // This will be handled by the canvas directly now
    setPiState('idle') // Hide suggestion after adding
  }

  // Initialize session on component mount
  useEffect(() => {
    console.log('🚀 Initializing session...')
    
    // Check for shared session in URL
    const urlParams = new URLSearchParams(window.location.search)
    const shareCode = urlParams.get('share')
    
    let session
    if (shareCode) {
      console.log('🔗 Found share code in URL:', shareCode)
      const importedSession = collaboration.importSharedSession(shareCode)
      if (importedSession) {
        session = sessionManager.loadSession(importedSession.id)
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
    
    // Fallback to existing session or create new
    if (!session) {
      session = sessionManager.getCurrentSession() || sessionManager.startNewSession()
    }
    
    if (session) {
      console.log('📝 Session loaded:', session.name, 'with', session.paths.length, 'paths')
      setCurrentSessionName(session.name)
      setSessionStarted(true)
      
      // Initialize collaboration room based on session
      const roomId = `simili-${session.id.slice(-8)}`
      setCollaborationRoomId(roomId)
      setIsCollaborationHost(true)
    }

    // Set up auto-save listener
    const handleAutoSave = () => {
      console.log('🔄 Auto-save triggered')
    }

    window.addEventListener('simili-auto-save', handleAutoSave)
    return () => window.removeEventListener('simili-auto-save', handleAutoSave)
  }, [])

  const handleOpenInsights = () => {
    setInsightsOpen(true)
  }

  const handleShapeDetected = () => {
    // No-op: local suggestions removed in favor of Gemini vision
  }

  // Fallback Pi state changes when no shapes are detected
  useEffect(() => {
    if (detectedShapes.length === 0) {
      const states: PiState[] = ['idle', 'listening']
      let currentIndex = 0

      const interval = setInterval(() => {
        if (piState === 'idle' || piState === 'listening') {
          currentIndex = (currentIndex + 1) % states.length
          setPiState(states[currentIndex])
        }
      }, 5000) // Change state every 5 seconds when idle

      return () => clearInterval(interval)
    }
  }, [detectedShapes.length, piState])

  return (
    <div className="h-screen w-screen bg-paper overflow-hidden flex flex-col">
      {/* Simple Student Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/90 backdrop-blur-sm z-20 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2" style={{ fontFamily: 'Caveat, cursive' }}>
            <span>📚</span>
            <span>Simili</span>
          </h1>
          {ambientAgentActive && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600">Pi is helping</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Start Pi button */}
          <AccessibleButton 
            onClick={() => setShowStartDialog(true)}
            variant="ghost"
            aria-label="Start Pi"
            className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            🤖 Start Pi
          </AccessibleButton>

          {/* Teacher View Link */}
          <AccessibleButton 
            onClick={() => window.open('/teacher', '_blank')}
            variant="ghost"
            aria-label="Teacher view"
            className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            👩‍🏫 Teacher View
          </AccessibleButton>
          
          {/* Share */}
          <AccessibleButton 
            onClick={() => setShareDialogOpen(true)}
            variant="ghost"
            aria-label="Share workspace"
            className="bg-white/80 border border-gray-200 shadow-sm hover:shadow-md w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200"
          >
            <span className="text-xl">🔗</span>
          </AccessibleButton>
        </div>
      </header>

      {/* Pi State Container */}
      <div className="p-3 shrink-0 z-10">
        <div className={`backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl flex items-center justify-center p-3 transition-all duration-500 ${
          piState === 'idle' ? 'bg-gray-500/10' :
          piState === 'listening' ? 'bg-blue-500/20' :
          piState === 'thinking' ? 'bg-purple-500/20' :
          'bg-green-500/20'
        }`}>
          <span className={`text-3xl transition-all duration-300 ${
            piState === 'thinking' ? 'animate-pulse' : 
            piState === 'listening' ? 'animate-bounce' : ''
          }`}>
            {piState === 'idle' ? '🤖' :
             piState === 'listening' ? '👂' :
             piState === 'thinking' ? '🤔' :
             '💡'}
          </span>
          
          {/* Show detected shapes count */}
          {detectedShapes.length > 0 && (
            <span className="ml-2 text-xs bg-white/80 text-gray-700 px-2 py-1 rounded-full">
              {detectedShapes.length} shape{detectedShapes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {/* Local suggestions removed: vision-first tutoring */}
      </div>
      
            {/* Main Content Container - Photo + Canvas Focus */}
      <main className="flex-grow flex flex-row overflow-hidden p-2 pt-0 gap-2">
        {/* Photo Panel (30%) - Real world math connection */}
        <div className="w-[30%] h-full">
          <PhotoPanel />
        </div>

        {/* Main Canvas Area (70%) - Drawing + Widgets */}
        <div className="w-[70%] h-full relative">
          <SimiliCanvas />
        </div>
      </main>

      {/* Panels (absolutely positioned) */}
      <InsightsPanel 
        isOpen={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        sessionStarted={sessionStarted}
      />
      
      {/* Share Dialog */}
      <ShareDialog 
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
      
      {/* Voice Control - Temporarily disabled for debugging */}
      {/* <VoiceControl 
        onModeChange={(mode) => {
          window.dispatchEvent(new CustomEvent('simili-mode-change', { detail: { mode } }))
        }}
        onAddManipulative={(type) => {
          handleAutoAddManipulative(type)
        }}
        onClearCanvas={() => {
          window.dispatchEvent(new CustomEvent('simili-clear-canvas'))
        }}
        onUndo={() => {
          window.dispatchEvent(new CustomEvent('simili-undo'))
        }}
        onRedo={() => {
          window.dispatchEvent(new CustomEvent('simili-redo'))
        }}
        onShowShare={() => setShareDialogOpen(true)}
        onShowProgress={() => setInsightsOpen(true)}
      /> */}
      
      {/* Real-time Collaboration - Temporarily disabled for testing */}
      {/* {collaborationRoomId && (
        <RealtimeCollaboration 
          roomId={collaborationRoomId}
          isHost={isCollaborationHost}
          onParticipantJoin={(participant) => {
            console.log('👥 Participant joined:', participant.name)
          }}
          onParticipantLeave={(participantId) => {
            console.log('👋 Participant left:', participantId)
          }}
        />
      )} */}
      
      {/* Reasoning Map Overlay */}
      {showReasoningMap && (
        <div className="fixed top-20 right-4 w-96 z-40">
          <ReasoningMap isVisible={showReasoningMap} />
        </div>
      )}
      
      {/* Ambient Agent */}
      <AmbientAgent 
        isActive={ambientAgentActive}
        studentContext={{
          gradeLevel: 3,
          subject: 'mathematics',
          currentTopic: 'fractions and shapes'
        }}
      />

      {/* Start Dialog */}
      <SessionStartDialog
        isOpen={showStartDialog}
        onStart={(enableVoice: boolean) => {
          setAmbientAgentActive(true)
          setShowStartDialog(false)
          setSessionStarted(true)
          // voice handled in Gemini components; here we just toggle agent
        }}
        onSkip={() => {
          setShowStartDialog(false)
        }}
      />
    </div>
  )
}
