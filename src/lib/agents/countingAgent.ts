import { 
  VerifyCountingInputSchema, 
  VerifyCountingOutputSchema,
  type VerifyCountingInput, 
  type VerifyCountingOutput 
} from './schemas';

/**
 * Counting Agent: Ensures Pi always counts correctly
 * This is a "module" in DSPy terms - a discrete, testable unit
 */
export class CountingAgent {
  private readonly correctCounts = {
    'lego-blocks': { total: 6, blue: 2, gray: 4 }
  };
  
  /**
   * The "prompt" for this agent - manually optimized for reliability
   */
  private buildPrompt(input: VerifyCountingInput): string {
    return `You are verifying a student's counting in a fraction problem.

Problem type: ${input.problemType}
Student said: "${input.studentStatement}"

For LEGO blocks problems, the CORRECT counts are:
- Total blocks: 6 (not 4!)
- Blue blocks: 2
- Gray blocks: 4
- Correct fraction: 2/6 or 1/3

Analyze the student's statement and determine if they counted correctly.
If they said "2 out of 4" or "2/4", they miscounted the total.`;
  }
  
  /**
   * Process the verification - in real implementation, this would call Gemini
   * For now, we'll use rule-based logic
   */
  async verify(input: VerifyCountingInput): Promise<VerifyCountingOutput> {
    // Validate input
    const validInput = VerifyCountingInputSchema.parse(input);
    
    // Extract numbers from student statement
    const numbers = validInput.studentStatement.match(/\d+/g) || [];
    const hasTwo = numbers.some(n => n === '2');
    const hasFour = numbers.some(n => n === '4');
    const hasSix = numbers.some(n => n === '6');
    
    // Check for common errors
    const saidTwoOutOfFour = 
      validInput.studentStatement.includes('2 out of 4') ||
      validInput.studentStatement.includes('2/4') ||
      (hasTwo && hasFour && validInput.studentStatement.toLowerCase().includes('total'));
    
    const isCorrect = 
      (hasTwo && hasSix) || 
      validInput.studentStatement.includes('1/3') ||
      validInput.studentStatement.includes('one third');
    
    const output: VerifyCountingOutput = {
      totalObjects: saidTwoOutOfFour ? 4 : 6,
      targetObjects: 2,
      studentAnswer: validInput.studentStatement,
      isCorrect,
      correction: saidTwoOutOfFour 
        ? "The student counted 4 blocks total, but there are actually 6 blocks (2 blue, 4 gray)"
        : undefined
    };
    
    // Validate output
    return VerifyCountingOutputSchema.parse(output);
  }
  
  /**
   * Generate a focusing question based on the verification
   */
  generateResponse(verification: VerifyCountingOutput): string {
    if (verification.isCorrect) {
      return "Yes! You found that 2 out of 6 blocks are blue. How did you figure that out?";
    }
    
    if (verification.totalObjects === 4) {
      // Student miscounted - use focusing question
      return "I see you're thinking about the blocks. Can you count ALL the blocks again? How many do you see altogether?";
    }
    
    return "Interesting thinking! Tell me more about how you're counting the blocks.";
  }
}