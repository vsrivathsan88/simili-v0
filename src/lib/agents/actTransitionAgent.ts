import { 
  ActTransitionInputSchema, 
  type ActTransitionInput, 
  type ActTransitionOutput 
} from './schemas';

/**
 * Act Transition Agent: Decides when to move between acts
 * Replaces ad-hoc timing rules with structured decision-making
 */
export class ActTransitionAgent {
  /**
   * Determine if we should transition to the next act
   */
  async shouldTransition(input: ActTransitionInput): Promise<ActTransitionOutput> {
    const validInput = ActTransitionInputSchema.parse(input);
    
    switch (validInput.currentAct) {
      case 'act1':
        // Transition to Act 2 when:
        // - Student has spent 30+ seconds observing
        // - OR student asks for help
        // - OR student shows understanding
        if (validInput.studentProgress.timeInAct > 30000 || 
            validInput.studentProgress.hasAskedForHelp) {
          return {
            shouldTransition: true,
            nextAct: 'act2',
            reason: validInput.studentProgress.hasAskedForHelp 
              ? 'Student asked for help - unlocking tools'
              : 'Student has observed long enough - time to explore'
          };
        }
        break;
        
      case 'act2':
        // Transition to Act 3 when:
        // - Student has solved the problem
        // - OR significant progress + 2+ minutes
        if (validInput.studentProgress.hasSolvedProblem ||
            (validInput.studentProgress.hasDrawnSomething && 
             validInput.studentProgress.timeInAct > 120000)) {
          return {
            shouldTransition: true,
            nextAct: 'act3',
            reason: 'Student ready to showcase their solution'
          };
        }
        break;
        
      case 'act3':
        // No transition from Act 3
        break;
    }
    
    return {
      shouldTransition: false,
      reason: 'Not ready to transition yet'
    };
  }
  
  /**
   * Get the tools to unlock for a given act
   */
  getToolsForAct(act: 'act1' | 'act2' | 'act3'): string[] {
    switch (act) {
      case 'act1':
        return []; // No tools
      case 'act2':
        return ['pencil', 'eraser', 'fractionBar', 'pizza'];
      case 'act3':
        return []; // Tools hidden during showcase
    }
  }
  
  /**
   * Generate the transition message
   */
  getTransitionMessage(nextAct: 'act1' | 'act2' | 'act3'): string {
    switch (nextAct) {
      case 'act2':
        return "Great noticing! Now let's work on this together. I've unlocked some tools for you!";
      case 'act3':
        return "Wow, look at all your thinking! Let's showcase what you discovered!";
      default:
        return "";
    }
  }
}