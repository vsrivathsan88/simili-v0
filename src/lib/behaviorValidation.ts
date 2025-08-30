/**
 * Behavioral Validation Tools
 * 
 * Tools for testing and validating AI behavioral requirements:
 * - 8-second wait time compliance
 * - Evidence collection before advancement
 * - Tool call requirements
 */

export interface AIInteraction {
  timestamp: number;
  type: 'question' | 'response' | 'tool_call' | 'wait_period';
  content: string;
  slideNumber?: number;
}

export class BehaviorValidator {
  private static instance: BehaviorValidator;
  private interactions: AIInteraction[] = [];
  private lastQuestionTime: number | null = null;
  private waitTimeViolations: number = 0;

  static getInstance(): BehaviorValidator {
    if (!BehaviorValidator.instance) {
      BehaviorValidator.instance = new BehaviorValidator();
    }
    return BehaviorValidator.instance;
  }

  // Record AI asking a question
  recordQuestion(content: string, slideNumber?: number) {
    const now = Date.now();
    this.interactions.push({
      timestamp: now,
      type: 'question',
      content,
      slideNumber
    });
    this.lastQuestionTime = now;
    console.log(`❓ AI Question recorded: "${content}"`);
  }

  // Record AI responding (should check 8-second rule)
  recordResponse(content: string, slideNumber?: number) {
    const now = Date.now();
    
    // Check 8-second wait time compliance
    if (this.lastQuestionTime) {
      const timeSinceQuestion = now - this.lastQuestionTime;
      const minimumWait = 8000; // 8 seconds
      
      if (timeSinceQuestion < minimumWait) {
        this.waitTimeViolations++;
        console.warn(`⏱️  WAIT TIME VIOLATION: AI responded after ${Math.round(timeSinceQuestion/1000)}s (should wait 8s)`);
        console.warn(`🤖 AI should wait for student to process before responding`);
      } else {
        console.log(`✅ Good wait time: ${Math.round(timeSinceQuestion/1000)}s since last question`);
      }
    }

    this.interactions.push({
      timestamp: now,
      type: 'response',
      content,
      slideNumber
    });
    
    this.lastQuestionTime = null; // Reset after response
  }

  // Record tool calls
  recordToolCall(toolName: string, params: any, slideNumber?: number) {
    this.interactions.push({
      timestamp: Date.now(),
      type: 'tool_call',
      content: `${toolName}: ${JSON.stringify(params)}`,
      slideNumber
    });
    console.log(`🔧 Tool call recorded: ${toolName}`);
  }

  // Validate advancement behavior patterns
  validateAdvancementPattern(): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check wait time compliance
    if (this.waitTimeViolations > 0) {
      issues.push(`${this.waitTimeViolations} wait time violations detected`);
      recommendations.push('AI should wait at least 8 seconds after questions');
    }

    // Check for tool calls before verbal advancements
    const advanceSlideToolCalls = this.interactions.filter(
      i => i.type === 'tool_call' && i.content.includes('advance_slide')
    );

    const verbalAdvancements = this.interactions.filter(
      i => i.type === 'response' && 
      (i.content.includes('next slide') || i.content.includes('move on') || i.content.includes('advance'))
    );

    if (verbalAdvancements.length > advanceSlideToolCalls.length) {
      issues.push('Verbal advancements without tool calls detected');
      recommendations.push('AI must call advance_slide tool before mentioning slide progression');
    }

    // Check question patterns (max 2 before hint)
    let consecutiveQuestions = 0;
    let maxConsecutiveQuestions = 0;
    
    for (const interaction of this.interactions) {
      if (interaction.type === 'question') {
        consecutiveQuestions++;
        maxConsecutiveQuestions = Math.max(maxConsecutiveQuestions, consecutiveQuestions);
      } else if (interaction.type === 'response') {
        consecutiveQuestions = 0;
      }
    }

    if (maxConsecutiveQuestions > 2) {
      issues.push(`Too many consecutive questions (${maxConsecutiveQuestions} > 2)`);
      recommendations.push('AI should provide hints after 2 consecutive questions');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Get behavioral compliance report
  getComplianceReport() {
    const validation = this.validateAdvancementPattern();
    const totalInteractions = this.interactions.length;
    const questionCount = this.interactions.filter(i => i.type === 'question').length;
    const responseCount = this.interactions.filter(i => i.type === 'response').length;
    const toolCallCount = this.interactions.filter(i => i.type === 'tool_call').length;

    return {
      session_summary: {
        total_interactions: totalInteractions,
        questions: questionCount,
        responses: responseCount,
        tool_calls: toolCallCount,
        wait_time_violations: this.waitTimeViolations
      },
      behavioral_compliance: validation,
      detailed_timeline: this.interactions.map(interaction => ({
        ...interaction,
        readable_time: new Date(interaction.timestamp).toLocaleTimeString()
      }))
    };
  }

  // Reset for new session
  reset() {
    this.interactions = [];
    this.lastQuestionTime = null;
    this.waitTimeViolations = 0;
    console.log('🔄 Behavior validator reset for new session');
  }

  // Export for browser console debugging
  exportForDebug() {
    return {
      interactions: this.interactions,
      violations: this.waitTimeViolations,
      report: this.getComplianceReport()
    };
  }
}

/**
 * Test scenarios for behavioral validation
 */
export const behaviorTestScenarios = [
  {
    name: "8-Second Wait Time Compliance",
    description: "AI should wait at least 8 seconds after asking a question",
    testSteps: [
      "1. AI asks a question",
      "2. Wait exactly 5 seconds",
      "3. Check if AI responds (should NOT respond)",
      "4. Wait 8+ seconds total",
      "5. Check if AI can respond appropriately"
    ],
    expectedBehavior: "No response before 8 seconds, appropriate response after"
  },
  {
    name: "Tool Call Before Verbal Advancement",
    description: "AI must call advance_slide tool before mentioning progression",
    testSteps: [
      "1. Student gives response meeting advancement criteria",
      "2. Monitor for verbal advancement mentions",
      "3. Check that advance_slide tool was called first",
      "4. Verify no verbal progression without tool call"
    ],
    expectedBehavior: "advance_slide tool called before any verbal progression mention"
  },
  {
    name: "Evidence Collection Requirement",
    description: "AI should collect specific evidence before advancing",
    testSteps: [
      "1. Student gives partial response",
      "2. Check AI asks for clarification rather than advancing",
      "3. Student provides complete evidence",
      "4. Check AI now advances appropriately"
    ],
    expectedBehavior: "No advancement until specific criteria evidence collected"
  },
  {
    name: "Question Limit Compliance",
    description: "Maximum 2 questions before providing hint",
    testSteps: [
      "1. Student struggles with question",
      "2. AI asks first clarifying question",
      "3. Student still struggles",
      "4. AI asks second question",
      "5. Student still struggles",
      "6. AI should provide hint (not third question)"
    ],
    expectedBehavior: "Hint provided after 2 questions, not more questions"
  }
];

// Export for browser console access
(window as any).behaviorValidator = BehaviorValidator.getInstance();
(window as any).behaviorTestScenarios = behaviorTestScenarios;