import { EventEmitter } from 'events';
import { useThreeActStore } from '../../stores/threeActStore';

/**
 * System Monitor: Non-invasive monitoring and debugging
 * Watches everything but doesn't interfere with Gemini Live
 */
export class SystemMonitor extends EventEmitter {
  private logs: SystemLog[] = [];
  private sessionId = `session-${Date.now()}`;
  private isRecording = true;
  
  // State snapshots for debugging
  private stateHistory: StateSnapshot[] = [];
  
  constructor() {
    super();
    this.setupMonitoring();
  }
  
  /**
   * Log all events without blocking
   */
  log(event: SystemEvent) {
    if (!this.isRecording) return;
    
    const log: SystemLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...event
    };
    
    this.logs.push(log);
    this.emit('log', log);
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
  
  /**
   * Take a snapshot of current system state
   */
  snapshot(trigger: string) {
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      trigger,
      state: {
        act: useThreeActStore.getState().currentAct,
        tools: useThreeActStore.getState().unlockedTools,
        connected: (window as any).geminiConnected || false,
        contextCards: this.getActiveContextCards(),
        agentStates: this.getAgentStates()
      }
    };
    
    this.stateHistory.push(snapshot);
    this.emit('snapshot', snapshot);
  }
  
  /**
   * Monitor for common issues
   */
  private setupMonitoring() {
    // Monitor act transitions
    useThreeActStore.subscribe((state, prevState) => {
      if (state.currentAct !== prevState.currentAct) {
        this.log({
          type: 'act_transition',
          level: 'info',
          message: `Act changed: ${prevState.currentAct} → ${state.currentAct}`,
          data: { from: prevState.currentAct, to: state.currentAct }
        });
        this.snapshot('act_transition');
      }
    });
    
    // Monitor tool calls
    window.addEventListener('toolcall' as any, (event: CustomEvent) => {
      this.log({
        type: 'tool_call',
        level: 'info',
        message: `Tool called: ${event.detail.name}`,
        data: event.detail
      });
    });
    
    // Monitor errors
    window.addEventListener('error', (event) => {
      this.log({
        type: 'error',
        level: 'error',
        message: event.message,
        data: { 
          stack: event.error?.stack,
          filename: event.filename,
          line: event.lineno 
        }
      });
    });
  }
  
  /**
   * Get debug report without affecting performance
   */
  getDebugReport(): DebugReport {
    const recentLogs = this.logs.slice(-100);
    const errorLogs = recentLogs.filter(l => l.level === 'error');
    const warnings = this.detectWarnings();
    
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      summary: {
        totalLogs: this.logs.length,
        errors: errorLogs.length,
        warnings: warnings.length,
        currentAct: useThreeActStore.getState().currentAct,
        connected: (window as any).geminiConnected || false
      },
      recentLogs,
      warnings,
      stateHistory: this.stateHistory.slice(-10)
    };
  }
  
  /**
   * Detect potential issues from patterns
   */
  private detectWarnings(): Warning[] {
    const warnings: Warning[] = [];
    const recentLogs = this.logs.slice(-50);
    
    // Check for rapid act transitions
    const actTransitions = recentLogs.filter(l => l.type === 'act_transition');
    if (actTransitions.length > 2) {
      warnings.push({
        type: 'rapid_transitions',
        message: 'Multiple act transitions detected in short time',
        severity: 'medium'
      });
    }
    
    // Check for repeated errors
    const errors = recentLogs.filter(l => l.level === 'error');
    const errorMessages = errors.map(e => e.message);
    const duplicates = errorMessages.filter((msg, idx) => 
      errorMessages.indexOf(msg) !== idx
    );
    
    if (duplicates.length > 0) {
      warnings.push({
        type: 'repeated_errors',
        message: `Repeated errors detected: ${duplicates[0]}`,
        severity: 'high'
      });
    }
    
    return warnings;
  }
  
  /**
   * Export logs for debugging (non-blocking)
   */
  async exportLogs(): Promise<string> {
    return new Promise((resolve) => {
      // Use setTimeout to avoid blocking
      setTimeout(() => {
        const report = this.getDebugReport();
        resolve(JSON.stringify(report, null, 2));
      }, 0);
    });
  }
  
  private getActiveContextCards(): any {
    // Simplified - would get from context card system
    return [];
  }
  
  private getAgentStates(): any {
    // Simplified - would get from agents
    return {};
  }
}

// Types
interface SystemEvent {
  type: 'act_transition' | 'tool_call' | 'error' | 'warning' | 'info';
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

interface SystemLog extends SystemEvent {
  id: string;
  timestamp: number;
  sessionId: string;
}

interface StateSnapshot {
  timestamp: number;
  trigger: string;
  state: {
    act: string;
    tools: any;
    connected: boolean;
    contextCards: any[];
    agentStates: any;
  };
}

interface Warning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface DebugReport {
  sessionId: string;
  timestamp: number;
  summary: {
    totalLogs: number;
    errors: number;
    warnings: number;
    currentAct: string;
    connected: boolean;
  };
  recentLogs: SystemLog[];
  warnings: Warning[];
  stateHistory: StateSnapshot[];
}

// Global instance
export const systemMonitor = new SystemMonitor();

// Attach to window for debugging
if (typeof window !== 'undefined') {
  (window as any).systemMonitor = systemMonitor;
}