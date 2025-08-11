'use client'

import { useState, useEffect, useRef } from 'react'
import { useRTC } from '@/lib/rtcManager'
import { useAIStreaming } from '@/lib/aiStreamingPipeline'
import AccessibleButton from './AccessibleButton'

interface Participant {
  id: string
  name: string
  role: 'student' | 'teacher' | 'ai-tutor'
  status: 'connected' | 'disconnected' | 'connecting'
  hasAudio: boolean
  hasVideo: boolean
  lastActivity: number
}

interface RealtimeCollaborationProps {
  roomId: string
  isHost: boolean
  onParticipantJoin?: (participant: Participant) => void
  onParticipantLeave?: (participantId: string) => void
}

const RealtimeCollaboration = ({ 
  roomId, 
  isHost,
  onParticipantJoin,
  onParticipantLeave 
}: RealtimeCollaborationProps) => {
  const rtc = useRTC()
  const aiStreaming = useAIStreaming()
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [aiStreamingActive, setAIStreamingActive] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [canvasStreamEnabled, setCanvasStreamEnabled] = useState(true)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())

  // Initialize real-time collaboration
  useEffect(() => {
    const initializeCollaboration = async () => {
      if (isInitialized) return
      
      console.log('🚀 Initializing real-time collaboration for room:', roomId)
      setConnectionStatus('connecting')
      
      try {
        // Initialize RTC room
        const rtcSuccess = await rtc.initializeRoom(roomId, isHost)
        if (!rtcSuccess) {
          throw new Error('Failed to initialize RTC room')
        }
        
        // Start AI streaming if host
        if (isHost) {
          const aiSuccess = await aiStreaming.start({
            gradeLevel: 3,
            subject: 'mathematics',
            learningObjectives: ['fraction understanding', 'collaborative problem solving'],
            currentActivity: 'drawing',
            studentState: 'engaged'
          })
          setAIStreamingActive(aiSuccess)
        }
        
        setConnectionStatus('connected')
        setIsInitialized(true)
        
        console.log('✅ Real-time collaboration initialized')
        
      } catch (error) {
        console.error('Failed to initialize collaboration:', error)
        setConnectionStatus('disconnected')
      }
    }

    initializeCollaboration()
  }, [roomId, isHost, isInitialized])

  // Listen for RTC events
  useEffect(() => {
    const handlePeerStatus = (event: any) => {
      const { peerId, status, role } = event.detail
      
      setParticipants(prev => {
        const existing = prev.find(p => p.id === peerId)
        if (existing) {
          return prev.map(p => 
            p.id === peerId 
              ? { ...p, status, lastActivity: Date.now() }
              : p
          )
        } else {
          const newParticipant: Participant = {
            id: peerId,
            name: `${role === 'teacher' ? 'Teacher' : 'Student'} ${peerId.slice(-4)}`,
            role,
            status,
            hasAudio: false,
            hasVideo: false,
            lastActivity: Date.now()
          }
          onParticipantJoin?.(newParticipant)
          return [...prev, newParticipant]
        }
      })
    }

    const handleRemoteStream = (event: any) => {
      const { peerId, stream, role } = event.detail
      
      console.log('📡 Received remote stream from', peerId, role)
      remoteStreamsRef.current.set(peerId, stream)
      
      // Update participant with stream info
      setParticipants(prev => 
        prev.map(p => 
          p.id === peerId 
            ? { 
                ...p, 
                hasAudio: stream.getAudioTracks().length > 0,
                hasVideo: stream.getVideoTracks().length > 0 
              }
            : p
        )
      )
      
      // Auto-play audio for voice communication
      if (stream.getAudioTracks().length > 0 && audioRef.current) {
        audioRef.current.srcObject = stream
        audioRef.current.play().catch(console.error)
      }
    }

    const handleRemoteDrawing = (event: any) => {
      const { peerId, role, event: drawingEvent } = event.detail
      
      console.log('🎨 Remote drawing from', peerId, drawingEvent.type)
      
      // Apply remote drawing event to canvas
      window.dispatchEvent(new CustomEvent('simili-apply-remote-drawing', {
        detail: { peerId, role, drawingEvent }
      }))
      
      // Update participant activity
      setParticipants(prev => 
        prev.map(p => 
          p.id === peerId 
            ? { ...p, lastActivity: Date.now() }
            : p
        )
      )
    }

    const handleAIResponse = (event: any) => {
      const response = event.detail
      console.log('🤖 AI Tutor Response:', response.content.text)
      
      // Show AI response in UI
      window.dispatchEvent(new CustomEvent('simili-show-ai-response', {
        detail: response
      }))
    }

    window.addEventListener('simili-peer-status', handlePeerStatus)
    window.addEventListener('simili-remote-stream', handleRemoteStream)
    window.addEventListener('simili-remote-drawing', handleRemoteDrawing)
    window.addEventListener('simili-ai-response', handleAIResponse)

    return () => {
      window.removeEventListener('simili-peer-status', handlePeerStatus)
      window.removeEventListener('simili-remote-stream', handleRemoteStream)
      window.removeEventListener('simili-remote-drawing', handleRemoteDrawing)
      window.removeEventListener('simili-ai-response', handleAIResponse)
    }
  }, [onParticipantJoin])

  // Broadcast drawing events
  useEffect(() => {
    const handleDrawingEvent = (event: any) => {
      if (isInitialized) {
        rtc.broadcastDrawing(event.detail)
      }
    }

    window.addEventListener('simili-drawing-event', handleDrawingEvent)
    return () => window.removeEventListener('simili-drawing-event', handleDrawingEvent)
  }, [isInitialized])

  // Handle audio toggle
  const toggleAudio = async () => {
    setAudioEnabled(!audioEnabled)
    // In real implementation, mute/unmute local audio track
    console.log('🎤 Audio', audioEnabled ? 'disabled' : 'enabled')
  }

  // Handle canvas streaming toggle
  const toggleCanvasStream = () => {
    setCanvasStreamEnabled(!canvasStreamEnabled)
    console.log('🎨 Canvas streaming', canvasStreamEnabled ? 'disabled' : 'enabled')
  }

  // Get connection stats
  const getStats = () => {
    return rtc.getStats()
  }

  if (!isInitialized && connectionStatus === 'connecting') {
    return (
      <div className="fixed bottom-4 left-4 z-30">
        <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-800 font-medium">
              Connecting to collaboration room...
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!isInitialized) return null

  return (
    <div className="fixed bottom-4 left-4 z-30 flex flex-col gap-2">
      {/* Hidden audio element for remote streams */}
      <audio ref={audioRef} autoPlay playsInline hidden />
      
      {/* Participants Panel */}
      {showParticipants && (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">👥 Collaboration Room</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="text-gray-400 hover:text-gray-600 text-lg"
              aria-label="Close participants"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            {/* Room Info */}
            <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
              <div>Room: {roomId}</div>
              <div>Role: {isHost ? 'Host' : 'Participant'}</div>
              <div>AI Tutor: {aiStreamingActive ? '🤖 Active' : '😴 Sleeping'}</div>
            </div>
            
            {/* Participants */}
            {participants.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700">Participants:</div>
                {participants.map(participant => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        participant.status === 'connected' ? 'bg-green-500' :
                        participant.status === 'connecting' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="font-medium">{participant.name}</span>
                      <span className="text-gray-500">({participant.role})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {participant.hasAudio && <span>🎤</span>}
                      {participant.hasVideo && <span>📹</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                No other participants yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="flex items-center gap-2">
        {/* Participants Button */}
        <AccessibleButton
          onClick={() => setShowParticipants(!showParticipants)}
          className={`w-10 h-10 rounded-full shadow-lg transition-all duration-200 ${
            participants.filter(p => p.status === 'connected').length > 0
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
          aria-label="Show participants"
        >
          <span className="text-lg">👥</span>
          {participants.filter(p => p.status === 'connected').length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {participants.filter(p => p.status === 'connected').length}
            </div>
          )}
        </AccessibleButton>

        {/* Audio Toggle */}
        <AccessibleButton
          onClick={toggleAudio}
          className={`w-10 h-10 rounded-full shadow-lg transition-all duration-200 ${
            audioEnabled
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          <span className="text-lg">{audioEnabled ? '🎤' : '🔇'}</span>
        </AccessibleButton>

        {/* Canvas Stream Toggle */}
        <AccessibleButton
          onClick={toggleCanvasStream}
          className={`w-10 h-10 rounded-full shadow-lg transition-all duration-200 ${
            canvasStreamEnabled
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
          aria-label={canvasStreamEnabled ? 'Stop canvas sharing' : 'Start canvas sharing'}
        >
          <span className="text-lg">{canvasStreamEnabled ? '🎨' : '🚫'}</span>
        </AccessibleButton>

        {/* Connection Status Indicator */}
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          'bg-red-500'
        }`} title={`Connection: ${connectionStatus}`}></div>
      </div>

      {/* Status Message */}
      <div className="text-xs text-center">
        <div className={`font-medium ${
          connectionStatus === 'connected' ? 'text-green-600' :
          connectionStatus === 'connecting' ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {connectionStatus === 'connected' && '🌐 Real-time collaboration active'}
          {connectionStatus === 'connecting' && '🔄 Connecting...'}
          {connectionStatus === 'disconnected' && '💔 Disconnected'}
        </div>
        {aiStreamingActive && (
          <div className="text-blue-600 font-medium">🤖 AI Tutor watching</div>
        )}
      </div>
    </div>
  )
}

export default RealtimeCollaboration
