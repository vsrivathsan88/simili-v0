import { useThreeActStore } from '../stores/threeActStore';

export class PiOrchestrator {
  private static instance: PiOrchestrator;
  
  private constructor() {}
  
  static getInstance(): PiOrchestrator {
    if (!PiOrchestrator.instance) {
      PiOrchestrator.instance = new PiOrchestrator();
    }
    return PiOrchestrator.instance;
  }
  
  // Check if Pi's response is appropriate for the current act
  validateResponse(response: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const { currentAct } = useThreeActStore.getState();
    
    // Check for tool mentions in Act 1
    if (currentAct === 'act1') {
      const toolMentions = [
        'pizza', 'fraction bar', 'bars', 'manipulative',
        'tool', 'draw', 'pencil', 'eraser'
      ];
      
      toolMentions.forEach(tool => {
        if (response.toLowerCase().includes(tool)) {
          issues.push(`Mentioned "${tool}" in Act 1 when no tools are available`);
        }
      });
    }
    
    // Check for counting accuracy
    const numberMatches = response.match(/\d+/g);
    if (numberMatches) {
      // For LEGO blocks problem
      if (response.includes('block') || response.includes('LEGO')) {
        const hasCorrectTotal = numberMatches.includes('6');
        const hasCorrectBlue = numberMatches.includes('2');
        const hasCorrectGray = numberMatches.includes('4');
        
        // Check for wrong totals
        if (numberMatches.includes('4') && response.includes('total')) {
          issues.push('Incorrect total count: said 4 blocks total instead of 6');
        }
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  // Get context-aware hints for Pi
  getContextHints(): string {
    const { currentAct, unlockedTools } = useThreeActStore.getState();
    
    let hints = `Current Act: ${currentAct}\n`;
    
    switch (currentAct) {
      case 'act1':
        hints += 'Remember: NO TOOLS available. Focus on noticing and wondering.\n';
        hints += 'Do NOT mention drawing, tools, or manipulatives.\n';
        break;
        
      case 'act2':
        hints += 'Tools are NOW available:\n';
        if (unlockedTools.pencil) hints += '- Pencil for drawing\n';
        if (unlockedTools.eraser) hints += '- Eraser\n';
        if (unlockedTools.fractionBar) hints += '- Fraction bars\n';
        if (unlockedTools.pizza) hints += '- Pizza fractions\n';
        hints += 'You can now suggest using these tools!\n';
        break;
        
      case 'act3':
        hints += 'Showcase mode - focus on their solution and thinking.\n';
        break;
    }
    
    hints += '\nProblem details: 6 LEGO blocks total (2 blue, 4 gray)\n';
    hints += 'Correct answer: 2/6 or 1/3 of blocks are blue\n';
    
    return hints;
  }
  
  // Monitor for common Pi errors
  checkForCommonErrors(toolCall: any): string | null {
    if (toolCall.name === 'mark_reasoning_step') {
      const { transcript, classification } = toolCall.args;
      
      // Check if Pi marked wrong answers as correct
      if (classification === 'correct') {
        if (transcript.includes('2/4') || transcript.includes('2 out of 4')) {
          return 'Student said 2/4 but there are 6 blocks total, not 4. This should be marked as incorrect.';
        }
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const piOrchestrator = PiOrchestrator.getInstance();