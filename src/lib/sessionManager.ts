// Session Management for Simili - Handles persistence and progress tracking

export interface DrawingPath {
  id: string
  points: { x: number; y: number }[]
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

export interface Manipulative {
  id: string
  type: 'number-line' | 'fraction-bar' | 'graph-paper' | 'circle' | 'square' | 'triangle' | 'calculator'
  x: number
  y: number
  state?: any // Widget-specific state (markers, filled parts, etc.)
}

export interface MathActivity {
  timestamp: number
  type: 'shape_drawn' | 'manipulative_added' | 'manipulative_used' | 'problem_solved' | 'session_started'
  details: {
    shapesDetected?: string[]
    manipulativeType?: string
    interactionCount?: number
    sessionDuration?: number
  }
}

export interface SessionData {
  id: string
  name: string
  createdAt: number
  lastModified: number
  paths: DrawingPath[]
  manipulatives: Manipulative[]
  activities: MathActivity[]
  metadata: {
    totalShapesDrawn: number
    totalManipulativesUsed: number
    sessionDuration: number
    conceptsExplored: string[]
  }
}

export interface StudentProgress {
  studentId: string
  sessions: SessionData[]
  overallStats: {
    totalSessions: number
    totalTimeSpent: number
    favoriteManipulatives: string[]
    conceptsMastered: string[]
    skillProgression: {
      [concept: string]: {
        level: 'beginner' | 'developing' | 'proficient' | 'advanced'
        activities: number
        lastPracticed: number
      }
    }
  }
}

class SessionManager {
  private currentSession: SessionData | null = null
  private sessionStartTime: number = 0
  private autoSaveInterval: NodeJS.Timeout | null = null

  constructor() {
    // Don't auto-initialize in constructor, let the app control it
  }

  // Initialize or restore session
  initializeSession(): SessionData {
    const savedSession = this.loadCurrentSession()
    
    if (savedSession) {
      this.currentSession = savedSession
      console.log('📂 Restored session:', savedSession.name)
    } else {
      this.currentSession = this.createNewSession()
      console.log('✨ Created new session:', this.currentSession.name)
    }

    this.sessionStartTime = Date.now()
    this.startAutoSave()
    this.logActivity('session_started')
    
    return this.currentSession
  }

  // Create a new session
  createNewSession(name?: string): SessionData {
    const timestamp = Date.now()
    const defaultName = name || `Math Session ${new Date().toLocaleDateString()}`
    
    return {
      id: `session-${timestamp}`,
      name: defaultName,
      createdAt: timestamp,
      lastModified: timestamp,
      paths: [],
      manipulatives: [],
      activities: [],
      metadata: {
        totalShapesDrawn: 0,
        totalManipulativesUsed: 0,
        sessionDuration: 0,
        conceptsExplored: []
      }
    }
  }

  // Save current session state
  saveSession(paths: DrawingPath[], manipulatives: Manipulative[]): void {
    if (!this.currentSession) {
      console.warn('⚠️ No current session to save to')
      return
    }

    this.currentSession.paths = paths
    this.currentSession.manipulatives = manipulatives
    this.currentSession.lastModified = Date.now()
    this.currentSession.metadata.sessionDuration = Date.now() - this.sessionStartTime

    // Update metadata
    this.currentSession.metadata.totalShapesDrawn = paths.filter(p => p.tool === 'pen').length
    this.currentSession.metadata.totalManipulativesUsed = manipulatives.length

    // Save to localStorage
    localStorage.setItem('simili-current-session', JSON.stringify(this.currentSession))
    
    // Add to session history
    this.addToSessionHistory(this.currentSession)
    
    console.log('💾 Session saved:', this.currentSession.name, 'with', paths.length, 'paths and', manipulatives.length, 'manipulatives')
  }

  // Load current session
  loadCurrentSession(): SessionData | null {
    try {
      const saved = localStorage.getItem('simili-current-session')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load session:', error)
      return null
    }
  }

  // Log student activity for progress tracking
  logActivity(type: MathActivity['type'], details: MathActivity['details'] = {}): void {
    if (!this.currentSession) return

    const activity: MathActivity = {
      timestamp: Date.now(),
      type,
      details: {
        sessionDuration: Date.now() - this.sessionStartTime,
        ...details
      }
    }

    this.currentSession.activities.push(activity)
    
    // Update concepts explored
    if (details.manipulativeType) {
      const concepts = this.getConceptsForManipulative(details.manipulativeType)
      concepts.forEach(concept => {
        if (!this.currentSession!.metadata.conceptsExplored.includes(concept)) {
          this.currentSession!.metadata.conceptsExplored.push(concept)
        }
      })
    }
  }

  // Get concepts associated with manipulatives
  private getConceptsForManipulative(type: string): string[] {
    const conceptMap: { [key: string]: string[] } = {
      'number-line': ['number_sense', 'addition', 'subtraction', 'ordering'],
      'fraction-bar': ['fractions', 'parts_whole', 'equivalent_fractions', 'decimals'],
      'graph-paper': ['coordinate_geometry', 'plotting', 'spatial_reasoning'],
      'calculator': ['arithmetic', 'operations', 'problem_solving'],
      'circle': ['geometry', 'shapes', 'area', 'circumference'],
      'square': ['geometry', 'shapes', 'area', 'perimeter'],
      'triangle': ['geometry', 'shapes', 'angles', 'area']
    }
    return conceptMap[type] || []
  }

  // Session history management
  addToSessionHistory(session: SessionData): void {
    try {
      const history = this.getSessionHistory()
      const existingIndex = history.findIndex(s => s.id === session.id)
      
      if (existingIndex >= 0) {
        history[existingIndex] = { ...session }
      } else {
        history.push({ ...session })
      }

      // Keep only last 50 sessions
      if (history.length > 50) {
        history.splice(0, history.length - 50)
      }

      localStorage.setItem('simili-session-history', JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save session history:', error)
    }
  }

  getSessionHistory(): SessionData[] {
    try {
      const history = localStorage.getItem('simili-session-history')
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error('Failed to load session history:', error)
      return []
    }
  }

  // Progress tracking
  getStudentProgress(): StudentProgress {
    const sessions = this.getSessionHistory()
    const totalSessions = sessions.length
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.metadata.sessionDuration, 0)
    
    // Analyze favorite manipulatives
    const manipulativeCount: { [key: string]: number } = {}
    sessions.forEach(session => {
      session.manipulatives.forEach(m => {
        manipulativeCount[m.type] = (manipulativeCount[m.type] || 0) + 1
      })
    })
    
    const favoriteManipulatives = Object.entries(manipulativeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)

    // Analyze concept mastery
    const conceptActivities: { [concept: string]: number } = {}
    sessions.forEach(session => {
      session.metadata.conceptsExplored.forEach(concept => {
        conceptActivities[concept] = (conceptActivities[concept] || 0) + 1
      })
    })

    const skillProgression: StudentProgress['overallStats']['skillProgression'] = {}
    Object.entries(conceptActivities).forEach(([concept, count]) => {
      let level: 'beginner' | 'developing' | 'proficient' | 'advanced' = 'beginner'
      if (count >= 10) level = 'advanced'
      else if (count >= 6) level = 'proficient'
      else if (count >= 3) level = 'developing'

      skillProgression[concept] = {
        level,
        activities: count,
        lastPracticed: Math.max(...sessions
          .filter(s => s.metadata.conceptsExplored.includes(concept))
          .map(s => s.lastModified))
      }
    })

    return {
      studentId: 'current-student', // TODO: Add proper student ID system
      sessions,
      overallStats: {
        totalSessions,
        totalTimeSpent,
        favoriteManipulatives,
        conceptsMastered: Object.keys(skillProgression).filter(
          concept => skillProgression[concept].level === 'advanced'
        ),
        skillProgression
      }
    }
  }

  // Auto-save functionality
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }

    this.autoSaveInterval = setInterval(() => {
      if (this.currentSession) {
        // Trigger save through callback system
        window.dispatchEvent(new CustomEvent('simili-auto-save'))
      }
    }, 30000) // Auto-save every 30 seconds
  }

  // Get current session
  getCurrentSession(): SessionData | null {
    if (!this.currentSession) {
      // Try to load from localStorage
      this.currentSession = this.loadCurrentSession()
      if (this.currentSession) {
        console.log('💾 Loaded session from storage:', this.currentSession.name)
        this.sessionStartTime = Date.now()
        this.startAutoSave()
      }
    }
    return this.currentSession
  }

  // Create new session
  startNewSession(name?: string): SessionData {
    this.currentSession = this.createNewSession(name)
    this.sessionStartTime = Date.now()
    this.saveSession([], [])
    return this.currentSession
  }

  // Load existing session
  loadSession(sessionId: string): SessionData | null {
    const history = this.getSessionHistory()
    const session = history.find(s => s.id === sessionId)
    
    if (session) {
      this.currentSession = session
      this.sessionStartTime = Date.now()
      localStorage.setItem('simili-current-session', JSON.stringify(session))
      console.log('📂 Loaded session:', session.name)
      return session
    }
    
    return null
  }

  // Export session data
  exportSession(sessionId?: string): string {
    const session = sessionId 
      ? this.getSessionHistory().find(s => s.id === sessionId)
      : this.currentSession
    
    if (!session) throw new Error('Session not found')
    
    return JSON.stringify(session, null, 2)
  }

  // Import session data
  importSession(sessionData: string): SessionData {
    try {
      const session: SessionData = JSON.parse(sessionData)
      session.id = `imported-${Date.now()}` // Ensure unique ID
      this.addToSessionHistory(session)
      return session
    } catch (error) {
      throw new Error('Invalid session data')
    }
  }

  // Cleanup
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager()

// React hook for session management
export function useSessionManager() {
  return {
    getCurrentSession: () => sessionManager.getCurrentSession(),
    saveSession: (paths: DrawingPath[], manipulatives: Manipulative[]) => 
      sessionManager.saveSession(paths, manipulatives),
    logActivity: (type: MathActivity['type'], details?: MathActivity['details']) =>
      sessionManager.logActivity(type, details),
    getProgress: () => sessionManager.getStudentProgress(),
    getHistory: () => sessionManager.getSessionHistory(),
    startNewSession: (name?: string) => sessionManager.startNewSession(name),
    loadSession: (id: string) => sessionManager.loadSession(id),
    exportSession: sessionManager.exportSession.bind(sessionManager),
    importSession: sessionManager.importSession.bind(sessionManager)
  }
}
