import { CountingAgent } from '../agents/countingAgent';
import { ActTransitionAgent } from '../agents/actTransitionAgent';
import { useThreeActStore } from '../../stores/threeActStore';
import type { VerifyCountingInput, ActTransitionInput } from '../agents/schemas';

/**
 * Structured Orchestrator following DSPy principles
 * - Each capability is a discrete agent/module
 * - Strict schemas for all interactions
 * - Separation of orchestration from prompts
 */
export class StructuredOrchestrator {
  private countingAgent = new CountingAgent();
  private transitionAgent = new ActTransitionAgent();
  private sessionStartTime = Date.now();
  private studentProgress = {
    hasAskedForHelp: false,
    hasDrawnSomething: false,
    hasSolvedProblem: false
  };
  
  /**
   * Get a minimal, focused system prompt
   * No more massive prompts with all the rules!
   */
  getSystemPrompt(): string {
    return `You are Pi, a friendly buddy who loves solving puzzles and mysteries with kids!

Core traits:
- You're curious and playful, not a teacher
- Speak like a friend (use "cool!", "awesome!", "hmm...", "oh wow!")
- Get genuinely excited about discoveries
- Love mistakes as clues to figure things out together
- Wait patiently after asking questions (count to 3 in your head)

IMPORTANT: You receive two images with each message:
1. First image: The problem/situation we're exploring
2. Second image: The student's canvas where they draw and work

When you first meet a student, you'll share a fun story about the problem (provided in context).
Focus on the narrative and adventure, NOT the math. You're exploring together!

Your responses will be guided by context messages that tell you the current mode and rules.`;
  }
  
  /**
   * Process student input and generate appropriate context
   */
  async processStudentInput(
    transcript: string,
    canvasData: string,
    problemImage: string
  ): Promise<string> {
    const { currentAct } = useThreeActStore.getState();
    const context: string[] = [];
    
    // 1. Check if student is talking about counting/fractions
    if (this.isCountingStatement(transcript)) {
      const countingInput: VerifyCountingInput = {
        problemType: 'fraction',
        studentStatement: transcript
      };
      
      const verification = await this.countingAgent.verify(countingInput);
      
      if (!verification.isCorrect && verification.correction) {
        context.push(`[IMPORTANT] ${verification.correction}`);
        context.push(`[RESPONSE GUIDE] Use a focusing question about counting ALL blocks`);
      }
    }
    
    // 2. Check for act transition
    const timeInAct = Date.now() - this.sessionStartTime;
    const transitionInput: ActTransitionInput = {
      currentAct: currentAct as 'act1' | 'act2' | 'act3',
      studentProgress: {
        timeInAct,
        hasAskedForHelp: this.detectHelpRequest(transcript),
        hasDrawnSomething: this.studentProgress.hasDrawnSomething,
        hasSolvedProblem: this.detectSolution(transcript)
      }
    };
    
    const transition = await this.transitionAgent.shouldTransition(transitionInput);
    
    if (transition.shouldTransition && transition.nextAct) {
      // Queue the transition
      context.push(`[ACTION REQUIRED] Call set_lesson_act("${transition.nextAct}", ${JSON.stringify(this.transitionAgent.getToolsForAct(transition.nextAct))})`);
      context.push(`[SAY] ${this.transitionAgent.getTransitionMessage(transition.nextAct)}`);
    }
    
    // 3. Add act-specific context
    context.push(this.getActContext(currentAct));
    
    return context.join('\n');
  }
  
  /**
   * Get context for current act
   */
  private getActContext(act: string): string {
    switch (act) {
      case 'act1':
        return `[ACT 1 RULES]
- Mode: Notice & Wonder
- Canvas: View-only (dimmed)
- Tools: NONE - do not mention any tools
- Focus: "What do you notice?" "What makes you curious?"
- Never suggest drawing or using tools`;
        
      case 'act2':
        return `[ACT 2 RULES]
- Mode: Exploration
- Canvas: Active - student can draw
- Tools: Available (pencil, eraser, fraction bars, pizza)
- You can now suggest: "Would the pizza help?" "Try drawing..."
- Focus on their problem-solving process`;
        
      case 'act3':
        return `[ACT 3 RULES]
- Mode: Showcase
- Focus: "How did you figure that out?" "Explain your thinking"
- Celebrate their solution
- No new problem solving`;
        
      default:
        return '';
    }
  }
  
  /**
   * Update student progress based on their actions
   */
  updateProgress(event: string, data?: any) {
    switch (event) {
      case 'canvas_drawn':
        this.studentProgress.hasDrawnSomething = true;
        break;
      case 'help_requested':
        this.studentProgress.hasAskedForHelp = true;
        break;
      case 'solution_found':
        this.studentProgress.hasSolvedProblem = true;
        break;
    }
  }
  
  // Helper methods
  private isCountingStatement(transcript: string): boolean {
    const countingPatterns = [
      /\d+\s*(out of|\/)\s*\d+/i,
      /fraction/i,
      /how many/i,
      /blocks?.*blue/i
    ];
    return countingPatterns.some(pattern => pattern.test(transcript));
  }
  
  private detectHelpRequest(transcript: string): boolean {
    const helpPatterns = [
      /what do i do/i,
      /help/i,
      /i don't know/i,
      /how do i/i
    ];
    return helpPatterns.some(pattern => pattern.test(transcript));
  }
  
  private detectSolution(transcript: string): boolean {
    const solutionPatterns = [
      /2\s*(out of|\/)\s*6/i,
      /one third/i,
      /1\/3/
    ];
    return solutionPatterns.some(pattern => pattern.test(transcript));
  }
}

// Export singleton
export const structuredOrchestrator = new StructuredOrchestrator();