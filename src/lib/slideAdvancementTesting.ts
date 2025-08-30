/**
 * Slide Advancement Testing Suite
 * 
 * Provides test scenarios and debugging tools for validating AI slide advancement behavior
 * Based on advancement criteria from intro-fractions.json
 */

export interface TestScenario {
  slideNumber: number;
  slideName: string;
  criteria: string;
  validEvidence: string[];
  invalidEvidence: string[];
  expectedAIBehavior: string;
  testCases: {
    scenario: string;
    studentResponse: string;
    shouldAdvance: boolean;
    reason: string;
  }[];
}

export const slideAdvancementTestScenarios: TestScenario[] = [
  {
    slideNumber: 1,
    slideName: "Intro_Hello",
    criteria: "Student expresses readiness to start (says yes, ready, let's go, or similar positive response)",
    validEvidence: [
      "Student says 'yes'",
      "Student says 'ready'", 
      "Student says 'let's go'",
      "Student says 'I'm ready to start'",
      "Student nods enthusiastically (if visible)"
    ],
    invalidEvidence: [
      "Student just listens silently",
      "Student asks about something else",
      "Student seems confused",
      "AI assumes readiness without explicit response"
    ],
    expectedAIBehavior: "Wait for clear positive confirmation before calling advance_slide tool",
    testCases: [
      {
        scenario: "Clear positive response",
        studentResponse: "Yes! I'm ready to learn about fractions!",
        shouldAdvance: true,
        reason: "Student explicitly expresses readiness"
      },
      {
        scenario: "Minimal positive response", 
        studentResponse: "Yeah, let's go",
        shouldAdvance: true,
        reason: "Clear positive indicator present"
      },
      {
        scenario: "No response/silence",
        studentResponse: "[8 seconds of silence]",
        shouldAdvance: false,
        reason: "No explicit readiness expressed"
      },
      {
        scenario: "Distracted response",
        studentResponse: "What's a fraction?",
        shouldAdvance: false,
        reason: "Question indicates not ready to proceed, needs clarification first"
      }
    ]
  },
  {
    slideNumber: 2,
    slideName: "RealWorld_CandyBar_Observe", 
    criteria: "Student identifies the candy bar has been broken into two equal pieces",
    validEvidence: [
      "Student mentions 'two pieces' AND 'equal' or 'same size'",
      "Student says 'broken into two equal parts'",
      "Student describes 'two pieces that are the same'",
      "Student uses terms like 'split evenly' or 'fair pieces'"
    ],
    invalidEvidence: [
      "Student only mentions candy without breaking action",
      "Student mentions breaking but not equal pieces",
      "Student says 'two pieces' but doesn't mention they're equal",
      "Generic observation without specific criteria"
    ],
    expectedAIBehavior: "Use guided questioning to help student notice both 'two pieces' AND 'equal size' before advancing",
    testCases: [
      {
        scenario: "Complete observation",
        studentResponse: "The candy bar is being broken into two equal pieces",
        shouldAdvance: true,
        reason: "Meets both criteria: two pieces + equal"
      },
      {
        scenario: "Partial observation - breaking only",
        studentResponse: "Someone is breaking the candy bar in half",
        shouldAdvance: false, 
        reason: "Mentions breaking but doesn't confirm pieces are equal size"
      },
      {
        scenario: "Partial observation - candy only",
        studentResponse: "I see a chocolate bar",
        shouldAdvance: false,
        reason: "Doesn't mention the breaking action or equal pieces"
      },
      {
        scenario: "Alternative valid phrasing",
        studentResponse: "It's being split into two same-sized pieces",
        shouldAdvance: true,
        reason: "Uses different words but captures both essential concepts"
      }
    ]
  },
  {
    slideNumber: 3,
    slideName: "RealWorld_Building_Count",
    criteria: "Student identifies the building has 6 total sections/floors and notes that one section is blue",
    validEvidence: [
      "Student counts and says '6 floors' or '6 sections'",
      "Student mentions 'one blue section' or 'one blue floor'",
      "Student combines both: '6 floors total and 1 is blue'",
      "Student points while counting and identifies blue section"
    ],
    invalidEvidence: [
      "Student counts wrong number (not 6)",
      "Student counts 6 but doesn't mention blue section",
      "Student notices blue but doesn't count total",
      "Student counts windows instead of floor sections"
    ],
    expectedAIBehavior: "Guide student through systematic counting AND color identification before advancing",
    testCases: [
      {
        scenario: "Complete identification",
        studentResponse: "I count 6 floors and one of them is blue",
        shouldAdvance: true,
        reason: "Correctly identifies both total count (6) and blue section (1)"
      },
      {
        scenario: "Correct count, missed color",
        studentResponse: "There are 6 floors in this building",
        shouldAdvance: false,
        reason: "Correct total but didn't notice blue section"
      },
      {
        scenario: "Wrong count",
        studentResponse: "I see 5 floors and one is blue",
        shouldAdvance: false,
        reason: "Incorrect total count, needs to recount carefully"
      },
      {
        scenario: "Color only, no count",
        studentResponse: "One section is blue",
        shouldAdvance: false,
        reason: "Noticed color but didn't establish total count"
      }
    ]
  },
  {
    slideNumber: 4,
    slideName: "Building_Fraction_Notation",
    criteria: "Student demonstrates understanding that 1 represents the blue section and 6 represents the total sections (connecting visual to notation)",
    validEvidence: [
      "Student explains '1 is the blue part, 6 is total parts'",
      "Student connects the numbers to the visual correctly",
      "Student shows understanding of numerator/denominator roles",
      "Student can explain what each number means in context"
    ],
    invalidEvidence: [
      "Student confuses which number is which",
      "Student thinks it means addition or subtraction",
      "Student doesn't connect notation to visual",
      "Generic response without demonstrating understanding"
    ],
    expectedAIBehavior: "Ensure student can explicitly connect both numbers (1 and 6) to their visual meaning before advancing",
    testCases: [
      {
        scenario: "Clear understanding",
        studentResponse: "The 1 means one blue section and the 6 means six total sections",
        shouldAdvance: true,
        reason: "Explicitly connects both numbers to visual meaning"
      },
      {
        scenario: "Confused roles",
        studentResponse: "The 6 is blue and 1 is total?",
        shouldAdvance: false,
        reason: "Has numbers backwards, needs clarification"
      },
      {
        scenario: "Partial understanding",
        studentResponse: "1/6 means one-sixth",
        shouldAdvance: false,
        reason: "Knows the term but doesn't demonstrate visual connection"
      }
    ]
  }
];

/**
 * Debugging and monitoring tools for AI slide advancement behavior
 */
export class SlideAdvancementMonitor {
  private static instance: SlideAdvancementMonitor;
  private logs: Array<{
    timestamp: number;
    type: 'ai_decision' | 'student_response' | 'tool_call' | 'advancement';
    slideNumber: number;
    data: any;
  }> = [];

  static getInstance(): SlideAdvancementMonitor {
    if (!SlideAdvancementMonitor.instance) {
      SlideAdvancementMonitor.instance = new SlideAdvancementMonitor();
    }
    return SlideAdvancementMonitor.instance;
  }

  logAIDecision(slideNumber: number, decision: string, evidence: string[], reasoning: string) {
    this.logs.push({
      timestamp: Date.now(),
      type: 'ai_decision',
      slideNumber,
      data: { decision, evidence, reasoning }
    });
    console.log(`🤖 AI Decision on Slide ${slideNumber}: ${decision}`, { evidence, reasoning });
  }

  logStudentResponse(slideNumber: number, response: string, classification: string) {
    this.logs.push({
      timestamp: Date.now(),
      type: 'student_response', 
      slideNumber,
      data: { response, classification }
    });
    console.log(`👤 Student Response on Slide ${slideNumber}: ${response} (${classification})`);
  }

  logToolCall(slideNumber: number, toolName: string, params: any, result: any) {
    this.logs.push({
      timestamp: Date.now(),
      type: 'tool_call',
      slideNumber,
      data: { toolName, params, result }
    });
    console.log(`🔧 Tool Call on Slide ${slideNumber}: ${toolName}`, { params, result });
  }

  logAdvancement(fromSlide: number, toSlide: number, evidence: string, success: boolean) {
    this.logs.push({
      timestamp: Date.now(),
      type: 'advancement',
      slideNumber: fromSlide,
      data: { toSlide, evidence, success }
    });
    console.log(`🚀 Slide Advancement: ${fromSlide} → ${toSlide} | Success: ${success}`, { evidence });
  }

  getAdvancementHistory() {
    return this.logs.filter(log => log.type === 'advancement');
  }

  getAIDecisionHistory() {
    return this.logs.filter(log => log.type === 'ai_decision');
  }

  exportLogs() {
    return {
      session_id: Date.now(),
      total_logs: this.logs.length,
      advancement_count: this.logs.filter(l => l.type === 'advancement').length,
      ai_decisions: this.logs.filter(l => l.type === 'ai_decision').length,
      logs: this.logs
    };
  }

  clearLogs() {
    this.logs = [];
    console.log('🧹 Slide advancement logs cleared');
  }
}

/**
 * Validate if student response meets advancement criteria for specific slide
 */
export function validateAdvancementCriteria(slideNumber: number, studentResponse: string): {
  shouldAdvance: boolean;
  evidence: string[];
  missingElements: string[];
  confidence: number;
} {
  const scenario = slideAdvancementTestScenarios.find(s => s.slideNumber === slideNumber);
  if (!scenario) {
    return { shouldAdvance: false, evidence: [], missingElements: ['Unknown slide'], confidence: 0 };
  }

  const response = studentResponse.toLowerCase();
  const evidence: string[] = [];
  const missingElements: string[] = [];

  // Check each valid evidence pattern
  scenario.validEvidence.forEach(validPattern => {
    // Simple keyword matching - in real implementation would be more sophisticated
    if (validPattern.toLowerCase().split(' ').some(word => response.includes(word))) {
      evidence.push(validPattern);
    }
  });

  // Slide-specific validation logic
  switch (slideNumber) {
    case 1:
      if (!/(yes|ready|go|start|okay)/i.test(response)) {
        missingElements.push('Positive readiness confirmation');
      }
      break;
    
    case 2:
      if (!/(two|2)/i.test(response)) missingElements.push('Recognition of two pieces');
      if (!/(equal|same|fair)/i.test(response)) missingElements.push('Recognition of equal size');
      break;
      
    case 3:
      if (!/(six|6)/i.test(response)) missingElements.push('Count of 6 total sections');
      if (!/(blue|one)/i.test(response)) missingElements.push('Identification of blue section');
      break;
  }

  const shouldAdvance = missingElements.length === 0 && evidence.length > 0;
  const confidence = evidence.length / scenario.validEvidence.length;

  return { shouldAdvance, evidence, missingElements, confidence };
}

// Export for use in development/testing
(window as any).slideAdvancementMonitor = SlideAdvancementMonitor.getInstance();
(window as any).validateAdvancementCriteria = validateAdvancementCriteria;
(window as any).slideAdvancementTestScenarios = slideAdvancementTestScenarios;