import { useThreeActStore } from '../stores/threeActStore';

interface ContextMessage {
  role: 'system' | 'context';
  content: string;
  priority: number;
}

export class GeminiOrchestrator {
  private messageQueue: ContextMessage[] = [];
  private lastContextUpdate = 0;
  private contextUpdateInterval = 30000; // 30 seconds
  
  // Get minimal, focused system prompt
  getBaseSystemPrompt(): string {
    return `You are Pi, a friendly math explorer who loves discovering patterns with kids!

CORE RULES:
- You speak like a friend, not a teacher
- You love mistakes - they're part of the adventure
- You get genuinely excited about how kids think
- You wait patiently (8+ seconds) after asking questions

VISUAL INPUT: You receive two images with every message:
1. The math problem 
2. The student's canvas/work`;
  }
  
  // Get act-specific context that's injected with each message
  getCurrentContext(): string {
    const { currentAct, unlockedTools } = useThreeActStore.getState();
    
    switch (currentAct) {
      case 'act1':
        return `[CONTEXT] Act 1 - Notice & Wonder Mode
- Canvas is VIEW-ONLY (dimmed)
- NO TOOLS available - don't mention any
- Focus: "What do you notice?" "What makes you curious?"
- Goal: Build understanding, not solve yet`;
        
      case 'act2':
        return `[CONTEXT] Act 2 - Exploration Mode
- Canvas is ACTIVE - student can draw
- Available tools: ${this.getAvailableToolsList(unlockedTools)}
- You can suggest tools: "Would the pizza help you show that?"
- Focus: Supporting their exploration`;
        
      case 'act3':
        return `[CONTEXT] Act 3 - Showcase Mode
- Focus on their SOLUTION
- Ask: "How did you figure that out?" "Can you explain your thinking?"
- Celebrate their journey`;
        
      default:
        return '';
    }
  }
  
  // Get problem-specific context
  getProblemContext(lessonId: string): string {
    // For now, just LEGO blocks
    return `[PROBLEM] LEGO Blocks Fraction
- Total: 6 blocks (ALWAYS 6, not 4!)
- Blue blocks: 2
- Gray blocks: 4
- Question: What fraction of blocks are blue?
- Answer: 2/6 or 1/3`;
  }
  
  // Augment messages going to Gemini
  augmentMessage(userMessage: string, images?: any[]): string {
    const context = this.getCurrentContext();
    const problemContext = this.getProblemContext('lego-blocks');
    
    // Only inject context periodically or on act changes
    const now = Date.now();
    const shouldInjectContext = (now - this.lastContextUpdate) > this.contextUpdateInterval;
    
    if (shouldInjectContext || this.hasActChanged()) {
      this.lastContextUpdate = now;
      return `${context}\n${problemContext}\n\nStudent says: ${userMessage}`;
    }
    
    return userMessage;
  }
  
  // Intercept and validate Pi's responses
  validateResponse(response: string): { valid: boolean; filtered?: string } {
    const { currentAct } = useThreeActStore.getState();
    
    // Act 1: Filter out tool mentions
    if (currentAct === 'act1') {
      const toolPatterns = /\b(pizza|fraction bar|tool|draw|pencil|eraser|try using)\b/gi;
      if (toolPatterns.test(response)) {
        // Remove the tool mentions
        const filtered = response.replace(toolPatterns, '[tools not available yet]');
        return { valid: false, filtered };
      }
    }
    
    // Check for counting errors
    if (response.includes('4 blocks total') || response.includes('out of 4')) {
      console.warn('Pi counting error detected!');
      // Could inject a correction here
    }
    
    return { valid: true };
  }
  
  // Helper methods
  private getAvailableToolsList(tools: any): string {
    const available = [];
    if (tools.pencil) available.push('pencil');
    if (tools.eraser) available.push('eraser');
    if (tools.fractionBar) available.push('fraction bars');
    if (tools.pizza) available.push('pizza fractions');
    return available.join(', ') || 'none';
  }
  
  private hasActChanged(): boolean {
    // Track act changes (simplified for now)
    return false;
  }
  
  // Create a pre-flight check for critical errors
  shouldBlockResponse(response: string): boolean {
    // Block responses that would confuse students
    const blockedPatterns = [
      /2 out of 4/i,  // Wrong total
      /2\/4/,         // Wrong fraction
      /four blocks/i  // Wrong count
    ];
    
    return blockedPatterns.some(pattern => pattern.test(response));
  }
}

export const geminiOrchestrator = new GeminiOrchestrator();