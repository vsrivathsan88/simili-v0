import { systemMonitor } from '../monitoring/systemMonitor';
import { contextCards } from '../contextCards';
import { useThreeActStore } from '../../stores/threeActStore';

/**
 * Reliability Layer: Ensures system consistency without blocking Gemini
 */
export class ReliabilityLayer {
  private lastHealthCheck = 0;
  private healthCheckInterval = 5000; // 5 seconds
  
  /**
   * Pre-flight checks before sending to Gemini
   * Fast, non-blocking validation
   */
  async preFlightCheck(message: string, images: any[]): Promise<ValidationResult> {
    const start = performance.now();
    const issues: string[] = [];
    
    try {
      // 1. Verify images are valid
      if (!images || images.length !== 2) {
        issues.push('Invalid image count - expected 2 images');
      }
      
      // 2. Check state consistency
      const currentAct = useThreeActStore.getState().currentAct;
      const hasValidAct = ['act1', 'act2', 'act3'].includes(currentAct);
      if (!hasValidAct) {
        issues.push(`Invalid act state: ${currentAct}`);
      }
      
      // 3. Verify context cards are reasonable
      const activeCards = contextCards.getActiveCards();
      if (activeCards.length > 10) {
        issues.push('Too many context cards - may confuse Pi');
      }
      
      // Log the check
      systemMonitor.log({
        type: 'info',
        level: 'debug',
        message: 'Pre-flight check completed',
        data: { 
          duration: performance.now() - start,
          issues: issues.length,
          passed: issues.length === 0
        }
      });
      
      return {
        passed: issues.length === 0,
        issues,
        suggestions: this.getSuggestions(issues)
      };
      
    } catch (error) {
      systemMonitor.log({
        type: 'error',
        level: 'error',
        message: 'Pre-flight check failed',
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      
      return {
        passed: false,
        issues: ['Pre-flight check error'],
        suggestions: ['Check system monitor logs']
      };
    }
  }
  
  /**
   * Post-response validation (after Pi speaks)
   * Non-blocking analysis of what happened
   */
  async validateResponse(transcript: string, toolCalls: any[]): Promise<void> {
    // Run asynchronously to not block
    setTimeout(() => {
      const currentAct = useThreeActStore.getState().currentAct;
      
      // Check for act violations
      if (currentAct === 'act1') {
        const toolMentions = /\b(pizza|fraction bar|draw|pencil|tool)\b/i;
        if (toolMentions.test(transcript)) {
          systemMonitor.log({
            type: 'warning',
            level: 'warning',
            message: 'Pi mentioned tools in Act 1',
            data: { transcript, violation: 'tool_mention_act1' }
          });
        }
      }
      
      // Check for counting errors
      if (/2\s*(out of|\/)\s*4/.test(transcript)) {
        systemMonitor.log({
          type: 'warning',
          level: 'warning',
          message: 'Pi may have accepted wrong answer (2/4)',
          data: { transcript, violation: 'counting_error' }
        });
      }
      
      // Validate tool calls
      toolCalls.forEach(call => {
        if (call.name === 'mark_reasoning_step' && 
            call.args?.classification === 'correct' &&
            call.args?.transcript?.includes('2/4')) {
          systemMonitor.log({
            type: 'error',
            level: 'error',
            message: 'Pi marked 2/4 as correct',
            data: call
          });
        }
      });
    }, 0);
  }
  
  /**
   * Periodic health checks
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return { healthy: true, cached: true };
    }
    
    this.lastHealthCheck = now;
    const checks: HealthCheck[] = [];
    
    // Check 1: State consistency
    const storeAct = useThreeActStore.getState().currentAct;
    const contextAct = contextCards.getActiveCards()
      .find(c => c.type === 'act_rules')?.content;
    
    checks.push({
      name: 'state_consistency',
      passed: contextAct?.includes(storeAct) ?? false,
      message: 'Act state matches context cards'
    });
    
    // Check 2: Memory usage
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;
    const memoryLimit = (performance as any).memory?.jsHeapSizeLimit;
    const memoryPercent = memoryUsage && memoryLimit 
      ? (memoryUsage / memoryLimit) * 100 
      : 0;
    
    checks.push({
      name: 'memory_usage',
      passed: memoryPercent < 80,
      message: `Memory usage: ${memoryPercent.toFixed(1)}%`
    });
    
    // Check 3: Recent errors
    const report = systemMonitor.getDebugReport();
    checks.push({
      name: 'error_rate',
      passed: report.summary.errors === 0,
      message: `${report.summary.errors} errors in recent logs`
    });
    
    const allPassed = checks.every(c => c.passed);
    
    systemMonitor.log({
      type: 'info',
      level: allPassed ? 'info' : 'warning',
      message: `Health check: ${allPassed ? 'PASSED' : 'FAILED'}`,
      data: checks
    });
    
    return {
      healthy: allPassed,
      checks,
      timestamp: now
    };
  }
  
  /**
   * Recovery strategies for common issues
   */
  async attemptRecovery(issue: string): Promise<boolean> {
    systemMonitor.log({
      type: 'info',
      level: 'warning',
      message: `Attempting recovery for: ${issue}`,
      data: { issue }
    });
    
    switch (issue) {
      case 'state_mismatch':
        // Re-sync state
        const currentAct = useThreeActStore.getState().currentAct;
        contextCards.addCard({
          id: 'recovery-sync',
          type: 'act_rules',
          content: `[RECOVERY] Confirming we are in ${currentAct}`,
          priority: 'high',
          expiresAfter: 10000
        });
        return true;
        
      case 'counting_error':
        // Inject correction
        contextCards.addCard({
          id: 'recovery-count',
          type: 'correction',
          content: '[CORRECTION] Remember: 6 blocks total (2 blue, 4 gray)',
          priority: 'high',
          expiresAfter: 30000
        });
        return true;
        
      default:
        return false;
    }
  }
  
  private getSuggestions(issues: string[]): string[] {
    const suggestions: string[] = [];
    
    issues.forEach(issue => {
      if (issue.includes('image')) {
        suggestions.push('Verify problem image is loaded');
      }
      if (issue.includes('act state')) {
        suggestions.push('Check useThreeActStore state');
      }
      if (issue.includes('context cards')) {
        suggestions.push('Clear expired context cards');
      }
    });
    
    return suggestions;
  }
}

// Types
interface ValidationResult {
  passed: boolean;
  issues: string[];
  suggestions: string[];
}

interface HealthCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface HealthStatus {
  healthy: boolean;
  checks?: HealthCheck[];
  cached?: boolean;
  timestamp?: number;
}

// Export singleton
export const reliabilityLayer = new ReliabilityLayer();