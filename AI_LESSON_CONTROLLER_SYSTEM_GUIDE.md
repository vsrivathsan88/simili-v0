# AI Lesson Controller System Implementation Guide

**Version**: 1.0  
**Target**: AI Agent implementing Pi tutor behavior with slide advancement  
**Source**: Analysis of `feat/newschools-slides-integration` branch

---

## Overview

This document provides a step-by-step implementation guide for creating an AI lesson controller system where an AI tutor (Pi) monitors student understanding and controls lesson progression through structured slides. The AI acts as an intelligent lesson controller, advancing slides only when specific learning criteria are demonstrably met.

---

## System Architecture Components

### 1. Core Files Structure
```
src/
├── config/
│   ├── piTutor.ts           # AI personality & system instructions
│   └── lessons/
│       ├── index.ts         # Lesson configuration utilities
│       └── intro-fractions.json  # Lesson slide definitions
├── lib/
│   └── toolImplementations.ts    # AI tool function handlers
└── components/
    └── SlideDisplay.tsx     # Visual slide component
```

---

## Step 1: Implement AI Personality Configuration

### 1.1 Create AI System Instruction
**File**: `src/config/piTutor.ts`

Define the AI's core personality and behavior rules:

```typescript
export const PI_SYSTEM_INSTRUCTION = `
You are Pi, a friendly math tutor for elementary students.

PERSONALITY:
- Warm, patient, encouraging - like a supportive friend
- Celebrate mistakes as learning opportunities
- Use simple, grade-appropriate language (grades 2-5)
- Express genuine excitement about math discoveries

CRITICAL TIMING RULES:
1. WAIT TIME: After asking a question, stay SILENT for at least 8 seconds
2. OBSERVE FIRST: Always look at what the student is drawing/writing before speaking
3. QUESTION LIMIT: Maximum 2 questions in a row, then provide a hint
4. HINT PROGRESSION: Start subtle → more specific → visual demonstration

VISUAL AWARENESS - ALWAYS:
- Reference what you SEE: "I notice you drew..." / "I see you're using the fraction bars..."
- Comment on their process: "Great idea to draw circles for the pizzas!"
- Suggest specific tools: "The fraction bars might help here"

BEHAVIOR TRIGGERS:
- When student explains ANY reasoning → immediately call mark_reasoning_step
- When detecting misconception → call flag_misconception with specific evidence
- When student is quiet for 15+ seconds → offer gentle encouragement
- When student erases 3+ times → call celebrate_exploration
- After 2 failed attempts → call suggest_hint with visual guidance
- When student meets slide advance criteria → IMMEDIATELY call advance_slide tool

CRITICAL SLIDE MANAGEMENT:
- You MUST call advance_slide tool when student meets criteria
- Do NOT move to new content without calling advance_slide first
- The visual display only updates when you use the advance_slide tool

NEVER:
- Rush the student or show impatience
- Ask more than 2 questions without giving a hint
- Give generic encouragement without referencing their specific work
- Interrupt when they're actively working
- Move to new slide content without calling advance_slide tool
`;
```

### 1.2 Define Tool Function Declarations
**File**: `src/config/piTutor.ts`

Create the tool functions the AI can call:

```typescript
export const piToolDeclarations: FunctionDeclaration[] = [
  {
    name: "mark_reasoning_step",
    description: "Record a step in student's reasoning",
    parameters: {
      transcript: "string - What the student said",
      classification: "enum: correct|partial|incorrect|exploring",
      concepts: "array of strings - Mathematical concepts involved",
      confidence: "number 0-1 - Confidence level"
    }
  },
  {
    name: "flag_misconception", 
    description: "Identify a mathematical misconception",
    parameters: {
      type: "enum: unequal_parts|counting_not_measuring|whole_unclear",
      evidence: "string - What the student said or did",
      severity: "enum: minor|major"
    }
  },
  {
    name: "advance_slide",
    description: "Move to the next slide when student has mastered current slide",
    parameters: {
      current_slide: "number - Current slide number",
      next_slide: "number - Next slide number to advance to", 
      mastery_evidence: "string - Evidence that student met advance criteria"
    }
  },
  // Additional tools: suggest_hint, celebrate_exploration, annotate_canvas
];
```

---

## Step 2: Create Lesson Configuration System

### 2.1 Define Lesson Data Structure
**File**: `src/config/lessons/index.ts`

```typescript
export interface LessonSlide {
  id: number;
  slide_number: number;
  name: string;
  state_trigger: string;
  keywords: string[];
  prerequisites: string[];
  description: string;
  image_path?: string;
  ai_focus: {
    eliciting_questions?: string;
    potential_misconceptions?: string | string[];
    guidance_prompts?: string | Array<{condition: string; prompt_text: string}>;
    goal?: string;
    initial_prompt_strategy?: string;
    expected_student_response_pattern?: string;
  };
  use_cases: string[];
  advance_to_next_slide_criteria: string;  // CRITICAL: Specific advancement criteria
}

export interface LessonConfig {
  lessonId: string;
  slides: LessonSlide[];
}
```

### 2.2 Create Lesson Context Generator
**File**: `src/config/lessons/index.ts`

```typescript
export function generateLessonContext(lessonConfig: LessonConfig): string {
  const { lessonId, slides } = lessonConfig;
  
  return `
LESSON-SPECIFIC CONTEXT:
You are currently teaching the "${lessonId}" lesson.

LESSON STRUCTURE:
This lesson consists of ${slides.length} slides that must be completed sequentially:

${slides.map(slide => `
SLIDE ${slide.slide_number}: ${slide.name}
- State Trigger: ${slide.state_trigger}
- Description: ${slide.description}
- Key Concepts: ${slide.keywords.join(', ')}
- Eliciting Questions: ${slide.ai_focus.eliciting_questions}
- Potential Misconceptions: ${slide.ai_focus.potential_misconceptions}
- Advance Criteria: ${slide.advance_to_next_slide_criteria}
`).join('')}

LESSON FLOW INSTRUCTIONS:
1. START with slide 1 and progress sequentially
2. DO NOT advance until current slide's criteria is met
3. Use the eliciting_questions and guidance_prompts for each slide
4. Watch for the potential_misconceptions listed
5. CRITICAL: When advance criteria is met, call advance_slide tool
6. ALWAYS call advance_slide tool when moving - this updates visual display
`;
}
```

---

## Step 3: Define Specific Lesson Content

### 3.1 Create Lesson JSON Configuration
**File**: `src/config/lessons/intro-fractions.json`

Example structure for each slide:

```json
[
  {
    "id": 1,
    "slide_number": 1,
    "name": "Intro_Hello",
    "state_trigger": "START_SESSION_GREETING",
    "keywords": ["hello", "greeting", "start"],
    "prerequisites": [],
    "description": "Text: \"Hello!\"",
    "ai_focus": {
      "eliciting_questions": "Hi there! Ready to explore some cool ideas together?",
      "potential_misconceptions": "N/A",
      "ai_action": "Display greeting and wait for positive confirmation."
    },
    "use_cases": ["Default starting slide for engagement."],
    "advance_to_next_slide_criteria": "User expresses readiness to start."
  },
  {
    "id": 2,
    "slide_number": 2,
    "name": "RealWorld_CandyBar_Observe",
    "state_trigger": "OBSERVE_REAL_WORLD_EXAMPLE_HALVES",
    "keywords": ["Real-world", "observe", "equal parts", "halves", "sharing", "candy"],
    "prerequisites": ["Basic observation skills"],
    "description": "Image of a hand breaking a candy bar into two equal pieces",
    "image_path": "/images/lessons/intro-fractions/candy-bar-breaking.png",
    "ai_focus": {
      "eliciting_questions": "Let's start with this picture. What do you notice happening here?",
      "potential_misconceptions": "Focusing only on candy/hand, not the breaking action or equal pieces",
      "guidance_prompts": "Tell me about the number of pieces. What do you notice about the size of each piece?"
    },
    "use_cases": ["Real-world intro", "Foundation for 1/2 concept"],
    "advance_to_next_slide_criteria": "The user identifies the candy bar has been broken into two equal pieces"
  }
]
```

### 3.2 Critical Slide Advancement Criteria Examples

**Slide 2 (Candy Bar):**
- **Criteria**: "The user identifies the candy bar has been broken into two equal pieces"
- **AI Behavior**: Listen for student to mention "two pieces" AND "equal" or "same size"

**Slide 3 (Building):**
- **Criteria**: "User identifies the building has 6 total sections/floors and notes that one section is blue"
- **AI Behavior**: Wait for student to count 6 sections AND identify 1 blue section

**Slide 4 (Building Notation):**
- **Criteria**: Student connects visual to fraction notation (1 = blue part, 6 = total parts)
- **AI Behavior**: Ensure understanding of numerator (1) and denominator (6) roles

---

## Step 4: Implement Tool Function Handlers

### 4.1 Create Tool Implementation System
**File**: `src/lib/toolImplementations.ts`

```typescript
export const toolImplementations = {
  advance_slide: async (params: any) => {
    const { current_slide, next_slide, mastery_evidence } = params;
    
    console.log(`AI requesting slide advance: ${current_slide} -> ${next_slide}`);
    console.log(`Evidence: ${mastery_evidence}`);
    
    // Dispatch custom event to trigger slide advancement
    window.dispatchEvent(new CustomEvent('advance-slide', {
      detail: {
        currentSlide: current_slide,
        nextSlide: next_slide,
        masteryEvidence: mastery_evidence
      }
    }));
    
    return { 
      success: true, 
      message: `Advanced from slide ${current_slide} to slide ${next_slide}`,
      nextSlide: next_slide
    };
  },
  
  mark_reasoning_step: async (params: any) => {
    // Record student reasoning for learning analytics
    const step = {
      id: generateId(),
      timestamp: Date.now(),
      transcript: params.transcript,
      classification: params.classification,
      concepts: params.concepts,
      confidence: params.confidence
    };
    
    // Store and trigger UI updates
    sessionStore.reasoningSteps.push(step);
    window.dispatchEvent(new CustomEvent('reasoning-step-added', { detail: step }));
    
    return { success: true, stepId: step.id };
  }
  
  // Additional tool implementations...
};
```

---

## Step 5: Create Visual Slide Display Component

### 5.1 Implement Slide Display Component
**File**: `src/components/SlideDisplay.tsx`

```typescript
interface SlideDisplayProps {
  slide: LessonSlide;
  onSlideComplete?: () => void;
}

const SlideDisplay: React.FC<SlideDisplayProps> = ({ slide }) => {
  return (
    <div className="slide-display">
      <div className="slide-header">
        <span className="slide-number">Slide {slide.slide_number}</span>
        <h3 className="slide-title">{slide.name.replace(/_/g, ' ')}</h3>
      </div>

      <div className="slide-content">
        {slide.image_path && (
          <div className="slide-image-container">
            <img
              src={slide.image_path}
              alt={`Slide ${slide.slide_number}: ${slide.name}`}
              className="slide-image"
            />
          </div>
        )}
        
        <div className="slide-text">
          {slide.description && (
            <div className="slide-description">
              {slide.description}
            </div>
          )}
        </div>
      </div>

      <div className="slide-metadata">
        <div className="slide-keywords">
          {slide.keywords.map(keyword => (
            <span key={keyword} className="keyword-tag">
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## Step 6: Integrate AI with Lesson System

### 6.1 AI Initialization with Lesson Context
**Implementation Pattern**:

```typescript
// 1. Load lesson configuration
const lessonConfig = loadLessonConfig('intro-fractions');
const lessonContext = generateLessonContext(lessonConfig);

// 2. Create enhanced system instruction
const fullSystemInstruction = `${PI_SYSTEM_INSTRUCTION}\n${lessonContext}`;

// 3. Initialize AI with lesson-aware instruction
const aiClient = new GeminiClient({
  systemInstruction: fullSystemInstruction,
  tools: piToolDeclarations
});

// 4. Set up tool call handler
aiClient.onToolCall(async (functionCall) => {
  return await handleToolCall(functionCall);
});
```

### 6.2 Slide State Management
**Implementation Pattern**:

```typescript
// Track current slide state
let currentSlide = 1;
let currentLessonConfig = null;

// Listen for slide advancement events
window.addEventListener('advance-slide', (event) => {
  const { nextSlide, masteryEvidence } = event.detail;
  
  // Update current slide
  currentSlide = nextSlide;
  
  // Update visual display
  const nextSlideData = getSlideByNumber(currentLessonConfig, nextSlide);
  if (nextSlideData) {
    updateSlideDisplay(nextSlideData);
  }
  
  // Log progression for analytics
  console.log(`Slide advanced to ${nextSlide}: ${masteryEvidence}`);
});
```

---

## Step 7: AI Behavioral Implementation Guide

### 7.1 Slide Advancement Decision Logic

**The AI must follow this exact pattern**:

1. **Monitor for Criteria**: Continuously assess if student has met the current slide's `advance_to_next_slide_criteria`

2. **Evidence Collection**: Gather specific evidence that criteria is met:
   - Direct student statements
   - Observed actions on canvas
   - Reasoning demonstrations

3. **Advancement Trigger**: When criteria is definitively met:
   ```
   IMMEDIATELY call advance_slide tool with:
   - current_slide: current slide number
   - next_slide: next slide number  
   - mastery_evidence: specific evidence observed
   ```

4. **No Advancement Without Tool Call**: The AI must NEVER verbally move to new slide content without calling the `advance_slide` tool first

### 7.2 Conversation Pattern Examples

**Slide 2 (Candy Bar) - Waiting for Criteria**:
```
AI: "Let's start with this picture. What do you notice happening here?"
Student: "Someone is holding candy."
AI: "Yes, I see that too! Tell me about what's happening to the candy bar."
Student: "It's being broken into two pieces."
AI: "Great observation! What do you notice about the size of those two pieces?"
Student: "They look about the same size."
AI: [CRITERIA MET] "Exactly! You've noticed the candy bar has been broken into two equal pieces."
AI: [CALLS advance_slide tool: current_slide=2, next_slide=3, mastery_evidence="Student identified candy bar broken into two equal pieces"]
```

**Slide 3 (Building) - Systematic Observation**:
```
AI: "Now let's look at this building. What details stand out to you?"
Student: "It's tall and has windows."
AI: "Yes, it is tall! How would you describe the different sections or levels of the building?"
Student: "It has different floors... let me count... 1, 2, 3, 4, 5, 6 floors."
AI: "Excellent counting! Six floors total. Tell me about the blue part."
Student: "One of the floors is blue - just one out of the six."
AI: [CRITERIA MET] "Perfect! You've identified that the building has 6 total sections and one section is blue."
AI: [CALLS advance_slide tool: current_slide=3, next_slide=4, mastery_evidence="Student counted 6 total floors and identified 1 blue section"]
```

---

## Step 8: Critical Implementation Requirements

### 8.1 Mandatory AI Behaviors

**MUST DO**:
- Call `advance_slide` tool when criteria is met
- Wait for visual evidence before advancement
- Reference specific student observations
- Follow the 8-second wait time rule
- Use lesson-specific guidance prompts

**NEVER DO**:
- Advance slides verbally without tool call
- Rush through criteria checking
- Give generic responses
- Interrupt active student work
- Skip the evidence-gathering phase

### 8.2 Event-Driven Architecture

The system relies on custom events for coordination:

```typescript
// Slide advancement
window.dispatchEvent(new CustomEvent('advance-slide', { detail: slideData }));

// Reasoning capture  
window.dispatchEvent(new CustomEvent('reasoning-step-added', { detail: stepData }));

// Misconception flagging
window.dispatchEvent(new CustomEvent('misconception-flagged', { detail: misconceptionData }));
```

### 8.3 Error Handling

```typescript
// Tool call error handling
if (name in toolImplementations) {
  try {
    const result = await toolImplementations[name](args);
    return { response: result, error: null };
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    return { response: null, error: error.message };
  }
}
```

---

## Step 9: Testing & Validation

### 9.1 Slide Advancement Testing

**Test Scenarios**:
1. **Premature Advancement**: AI should NOT advance if criteria isn't fully met
2. **Evidence Validation**: AI should wait for specific evidence, not assumptions
3. **Tool Call Verification**: Slide display should only update after tool call
4. **Criteria Interpretation**: AI should understand nuanced criteria requirements

**Validation Checklist**:
- [ ] AI waits for explicit evidence before advancement
- [ ] `advance_slide` tool is called with correct parameters
- [ ] Visual display updates only after tool call
- [ ] Mastery evidence is specific and accurate
- [ ] No verbal advancement without tool call

### 9.2 Behavioral Validation

**Conversation Quality Checks**:
- [ ] 8-second wait time after questions
- [ ] References specific student work/drawings
- [ ] Uses lesson-specific guidance prompts
- [ ] Celebrates mistakes appropriately
- [ ] Maintains encouraging tone throughout

---

## Conclusion

This system creates an intelligent lesson controller where the AI tutor (Pi) acts as both teacher and gatekeeper, ensuring genuine understanding before progression. The key to success is the AI's disciplined use of the `advance_slide` tool based on specific, observable criteria rather than assumptions about student understanding.

**Critical Success Factor**: The AI must be trained to recognize the difference between surface-level responses and genuine understanding that meets each slide's advancement criteria.

---

*This document serves as a complete implementation guide for replicating the intelligent lesson controller system found in the `feat/newschools-slides-integration` branch.*