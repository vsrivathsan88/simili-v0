import { sessionStore } from './toolImplementations';

export interface SessionEvent {
  type: 'tool_call' | 'canvas_change' | 'audio_start' | 'audio_stop';
  timestamp: number;
  data: any;
}

export interface Session {
  id: string;
  problemId: string;
  startTime: number;
  endTime?: number;
  events: SessionEvent[];
  reasoningSteps: any[];
  misconceptions: any[];
  canvasSnapshots: string[];
}

export class SessionRecorder {
  private currentSession: Session | null = null;
  private events: SessionEvent[] = [];
  private canvasSnapshotInterval: NodeJS.Timeout | null = null;

  startSession(problemId: string) {
    this.currentSession = {
      id: `session-${Date.now()}`,
      problemId,
      startTime: Date.now(),
      events: [],
      reasoningSteps: [],
      misconceptions: [],
      canvasSnapshots: []
    };
    
    // Listen for events
    window.addEventListener('reasoning-step-added', this.handleReasoningStep);
    window.addEventListener('misconception-flagged', this.handleMisconception);
    window.addEventListener('canvas-snapshot', this.handleCanvasSnapshot);
    
    console.log('Session started:', this.currentSession.id);
  }

  private handleReasoningStep = (event: Event) => {
    const customEvent = event as CustomEvent;
    this.addEvent({
      type: 'tool_call',
      timestamp: Date.now(),
      data: { tool: 'mark_reasoning_step', params: customEvent.detail }
    });
    
    if (this.currentSession) {
      this.currentSession.reasoningSteps.push(customEvent.detail);
    }
  };

  private handleMisconception = (event: Event) => {
    const customEvent = event as CustomEvent;
    this.addEvent({
      type: 'tool_call',
      timestamp: Date.now(),
      data: { tool: 'flag_misconception', params: customEvent.detail }
    });
    
    if (this.currentSession) {
      this.currentSession.misconceptions.push(customEvent.detail);
    }
  };

  private handleCanvasSnapshot = (event: Event) => {
    const customEvent = event as CustomEvent;
    this.addEvent({
      type: 'canvas_change',
      timestamp: Date.now(),
      data: { snapshot: customEvent.detail }
    });
    
    if (this.currentSession) {
      this.currentSession.canvasSnapshots.push(customEvent.detail);
    }
  };

  addEvent(event: SessionEvent) {
    this.events.push(event);
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }
  }

  endSession() {
    if (!this.currentSession) return null;
    
    this.currentSession.endTime = Date.now();
    
    // Save to localStorage
    const sessions = this.getAllSessions();
    sessions.push(this.currentSession);
    localStorage.setItem('simili-sessions', JSON.stringify(sessions));
    
    // Clean up
    window.removeEventListener('reasoning-step-added', this.handleReasoningStep);
    window.removeEventListener('misconception-flagged', this.handleMisconception);
    window.removeEventListener('canvas-snapshot', this.handleCanvasSnapshot);
    
    if (this.canvasSnapshotInterval) {
      clearInterval(this.canvasSnapshotInterval);
    }
    
    console.log('Session ended:', this.currentSession.id);
    const session = this.currentSession;
    this.currentSession = null;
    
    return session;
  }

  getAllSessions(): Session[] {
    try {
      const stored = localStorage.getItem('simili-sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getSession(id: string): Session | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === id) || null;
  }

  clearAllSessions() {
    localStorage.removeItem('simili-sessions');
  }
}

export const sessionRecorder = new SessionRecorder();