// Collaboration Manager for Simili - Handles sharing and real-time features

import { SessionData, sessionManager } from './sessionManager'

export interface ShareableSession {
  id: string
  name: string
  createdBy: string
  sharedAt: number
  sessionData: SessionData
  shareCode: string
  permissions: {
    canEdit: boolean
    canView: boolean
    canComment: boolean
  }
}

export interface CollaborationEvent {
  id: string
  timestamp: number
  userId: string
  type: 'drawing' | 'manipulative' | 'cursor' | 'comment'
  data: any
}

class CollaborationManager {
  private shareableCache = new Map<string, ShareableSession>()
  
  // Generate shareable session
  generateShareLink(sessionId?: string): ShareableSession {
    const session = sessionId 
      ? sessionManager.getSessionHistory().find(s => s.id === sessionId)
      : sessionManager.getCurrentSession()
    
    if (!session) {
      throw new Error('No session to share')
    }

    // Generate unique share code
    const shareCode = this.generateShareCode()
    
    const shareableSession: ShareableSession = {
      id: `share-${Date.now()}`,
      name: session.name,
      createdBy: 'current-student', // TODO: Add proper user system
      sharedAt: Date.now(),
      sessionData: { ...session },
      shareCode,
      permissions: {
        canEdit: true,
        canView: true,
        canComment: true
      }
    }

    // Store in localStorage for now (later: cloud storage)
    this.storeSharedSession(shareableSession)
    
    console.log('🔗 Generated share link:', shareCode)
    return shareableSession
  }

  // Import shared session
  importSharedSession(shareCode: string): SessionData | null {
    try {
      const sharedSession = this.getSharedSession(shareCode)
      if (!sharedSession) {
        throw new Error('Share code not found')
      }

      // Create a new session based on shared data
      const importedSession: SessionData = {
        ...sharedSession.sessionData,
        id: `imported-${Date.now()}`,
        name: `${sharedSession.sessionData.name} (Shared)`,
        createdAt: Date.now(),
        lastModified: Date.now()
      }

      // Import into session manager
      // Store the imported session
    const history = sessionManager.getSessionHistory()
    history.push(importedSession)
    localStorage.setItem('simili-session-history', JSON.stringify(history))
      
      console.log('📥 Imported shared session:', importedSession.name)
      return importedSession
    } catch (error) {
      console.error('Failed to import shared session:', error)
      return null
    }
  }

  // Generate human-readable share code
  private generateShareCode(): string {
    const adjectives = ['happy', 'clever', 'bright', 'quick', 'smart', 'cool', 'fun', 'nice']
    const animals = ['cat', 'dog', 'bird', 'fish', 'bear', 'lion', 'fox', 'owl']
    const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const animal = animals[Math.floor(Math.random() * animals.length)]
    
    return `${adjective}-${animal}-${numbers}`
  }

  // Store shared session
  private storeSharedSession(shareableSession: ShareableSession): void {
    try {
      const existing = this.getSharedSessions()
      existing.push(shareableSession)
      
      // Keep only last 20 shared sessions
      if (existing.length > 20) {
        existing.splice(0, existing.length - 20)
      }
      
      localStorage.setItem('simili-shared-sessions', JSON.stringify(existing))
      this.shareableCache.set(shareableSession.shareCode, shareableSession)
    } catch (error) {
      console.error('Failed to store shared session:', error)
    }
  }

  // Get shared session by code
  private getSharedSession(shareCode: string): ShareableSession | null {
    // Check cache first
    if (this.shareableCache.has(shareCode)) {
      return this.shareableCache.get(shareCode)!
    }

    // Check localStorage
    const sessions = this.getSharedSessions()
    const session = sessions.find(s => s.shareCode === shareCode)
    
    if (session) {
      this.shareableCache.set(shareCode, session)
    }
    
    return session || null
  }

  // Get all shared sessions
  getSharedSessions(): ShareableSession[] {
    try {
      const stored = localStorage.getItem('simili-shared-sessions')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load shared sessions:', error)
      return []
    }
  }

  // Export session as QR code data
  generateQRData(shareCode: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}?share=${shareCode}`
  }

  // Generate collaboration room for real-time features
  createCollaborationRoom(sessionId: string): string {
    const roomId = `room-${sessionId}-${Date.now()}`
    
    // Store room info
    const roomData = {
      id: roomId,
      sessionId,
      createdAt: Date.now(),
      participants: ['current-student'],
      isActive: true
    }
    
    localStorage.setItem(`simili-room-${roomId}`, JSON.stringify(roomData))
    
    console.log('🏠 Created collaboration room:', roomId)
    return roomId
  }

  // Real-time event broadcasting (simplified for now)
  broadcastEvent(roomId: string, event: CollaborationEvent): void {
    // In a real implementation, this would use WebSockets/WebRTC
    // For now, just store locally for demonstration
    const events = this.getRoomEvents(roomId)
    events.push(event)
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100)
    }
    
    localStorage.setItem(`simili-room-events-${roomId}`, JSON.stringify(events))
    
    // Simulate real-time by dispatching custom event
    window.dispatchEvent(new CustomEvent('simili-collaboration-event', {
      detail: { roomId, event }
    }))
  }

  // Get room events
  getRoomEvents(roomId: string): CollaborationEvent[] {
    try {
      const stored = localStorage.getItem(`simili-room-events-${roomId}`)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load room events:', error)
      return []
    }
  }

  // Cleanup old rooms
  cleanupRooms(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('simili-room-')) {
        try {
          const roomData = JSON.parse(localStorage.getItem(key) || '{}')
          if (roomData.createdAt < cutoff) {
            localStorage.removeItem(key)
            localStorage.removeItem(`simili-room-events-${roomData.id}`)
          }
        } catch (error) {
          // Invalid room data, remove it
          localStorage.removeItem(key)
        }
      }
    })
  }
}

// Singleton instance
export const collaborationManager = new CollaborationManager()

// React hook for collaboration
export function useCollaboration() {
  return {
    generateShareLink: (sessionId?: string) => collaborationManager.generateShareLink(sessionId),
    importSharedSession: (shareCode: string) => collaborationManager.importSharedSession(shareCode),
    getSharedSessions: () => collaborationManager.getSharedSessions(),
    generateQRData: (shareCode: string) => collaborationManager.generateQRData(shareCode),
    createRoom: (sessionId: string) => collaborationManager.createCollaborationRoom(sessionId),
    broadcastEvent: (roomId: string, event: CollaborationEvent) => 
      collaborationManager.broadcastEvent(roomId, event),
    getRoomEvents: (roomId: string) => collaborationManager.getRoomEvents(roomId),
    cleanupRooms: () => collaborationManager.cleanupRooms()
  }
}
