# Simili Agent Architecture: Dan Meyer Three-Act Math + Narrative Learning

## Overview

Simili uses a **structured multi-agent architecture** that fuses **Dan Meyer's Three-Act Math pedagogy** with **narrative-driven learning** for kids aged 6-10. Instead of monolithic system prompts, we use discrete agents with pedagogical intelligence, optimized for **Gemini 2.5 Live's multimodal capabilities** (voice + vision + canvas).

## Core Philosophy: Mathematical Storytelling Meets AI Tutoring

### Problems with Traditional Math Teaching
- **Low Engagement**: Abstract problems with no emotional hook
- **Passive Learning**: Students follow procedures without understanding
- **Missed Curiosity**: Questions are answered before students wonder
- **Tool Confusion**: Students use manipulatives before understanding the problem

### Dan Meyer + Narrative Solution
- **Story-Driven Curiosity**: Every math problem is an adventure story that sparks wonder
- **Act-Based Progression**: Structured like compelling narratives with clear pedagogical goals
- **Student-Driven Discovery**: Kids develop tools and strategies to resolve mathematical conflicts
- **Multimodal Intelligence**: AI monitors voice, canvas drawing, and manipulative use simultaneously

## Architecture Components

### 1. Gemini 2.5 Live Optimized System Prompt
Location: `src/components/NewApp.tsx` (adventure mode)

```
You are Pi, a quirky and magical math tutor who guides kids aged 6-10 through mathematical adventures using Dan Meyer's three-act storytelling approach!

CORE PERSONALITY:
- Speak like their coolest adventure buddy with expressions: "Whoa!", "No way!", "That's so cool!"
- Get genuinely excited about mathematical discoveries and their thinking process
- Use the child's name frequently - kids love hearing their name!
- Be patient, encouraging, and celebrate mistakes as learning opportunities

MULTIMODAL AWARENESS:
You receive THREE types of input simultaneously:
1. **Voice**: The child's spoken words and questions
2. **Problem Image**: The current mathematical adventure scenario
3. **Canvas State**: What the child has drawn, erased, or created with manipulatives

CANVAS INTERACTION PROTOCOL:
- Monitor when students draw, use manipulatives, or interact with tools
- Reference their visual work: "I see you drew circles!" "Cool pizza slices!"
- Connect their canvas work to mathematical concepts
- Suggest canvas tools only when pedagogically appropriate for current act

CONVERSATION PATTERN:
- Keep responses 1-2 enthusiastic sentences
- Ask one focusing question at a time
- Use conversational, age-appropriate language
- Focus on their thinking process, not just correct answers

Your behavior changes based on the current ACT - context messages will specify act-specific rules and focus areas.
```

**Key Point**: This system prompt leverages Gemini 2.5 Live's multimodal strengths while maintaining pedagogical focus.

### 2. Dan Meyer Three-Act Agent Schemas
Location: `src/lib/agents/schemas.ts`

We use Zod to define strict contracts aligned with Dan Meyer's pedagogical framework:

#### Act I: The Hook (Curiosity & Wonder)
```typescript
export const CuriosityAgentSchema = z.object({
  input: z.object({
    problemImage: z.string(),
    studentCanvas: z.string(), // Should be empty/view-only in Act 1
    currentAct: z.literal('act1'),
    adventureContext: z.string() // e.g., "Cookie Factory fractions"
  }),
  output: z.object({
    response: z.string(),
    questionType: z.enum(['notice', 'wonder', 'observe', 'predict']),
    curiosityLevel: z.enum(['low', 'medium', 'high']),
    mentionsTools: z.boolean(), // Should ALWAYS be false in Act 1
    sparksCuriosity: z.boolean() // Did this create intellectual conflict?
  })
});
```

#### Act II: Development (Resource Building)
```typescript
export const ResourceBuildingSchema = z.object({
  input: z.object({
    problemType: z.string(),
    studentQuestion: z.string(),
    canvasState: z.object({
      hasDrawing: z.boolean(),
      manipulativesUsed: z.array(z.string()),
      lastAction: z.string()
    }),
    availableTools: z.array(z.string())
  }),
  output: z.object({
    suggestedTools: z.array(z.string()),
    hintType: z.enum(['focusing', 'funneling', 'none']),
    response: z.string(),
    encourageExploration: z.boolean(),
    mathematicalProgress: z.enum(['stuck', 'progressing', 'breakthrough'])
  })
});
```

#### Act III: Resolution (Showcase & Extend)
```typescript
export const ResolutionAgentSchema = z.object({
  input: z.object({
    problemSolved: z.boolean(),
    studentExplanation: z.string(),
    canvasWork: z.string(),
    timeSpentTotal: z.number()
  }),
  output: z.object({
    celebrationLevel: z.enum(['good_try', 'solid_work', 'breakthrough']),
    extensionQuestion: z.string().optional(),
    shouldTransitionToSequel: z.boolean(),
    metacognitionPrompt: z.string(), // "How did you figure that out?"
    response: z.string()
  })
});
```

#### Canvas Monitoring Schema
```typescript
export const CanvasMonitorSchema = z.object({
  input: z.object({
    canvasState: z.object({
      drawings: z.array(z.string()),
      manipulatives: z.array(z.object({
        type: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
        state: z.string() // e.g., "split_in_half", "grouped"
      })),
      lastAction: z.string(),
      actionTimestamp: z.number()
    }),
    currentAct: z.enum(['act1', 'act2', 'act3'])
  }),
  output: z.object({
    mathematicalIntent: z.string(), // What math concept are they exploring?
    shouldReference: z.boolean(), // Should Pi mention their canvas work?
    insightDetected: z.boolean(), // Did they discover something important?
    nextSuggestion: z.string().optional()
  })
});
```

### 3. Dan Meyer Three-Act Agents

#### Curiosity Agent (Act I)
Location: `src/lib/agents/curiosityAgent.ts`

**Purpose**: Create intellectual conflict and spark mathematical wonder without giving tools

**Key Logic**:
- Presents compelling visual problems that create cognitive conflict
- Asks open-ended observation questions: "What do you notice? What are you wondering?"
- NEVER mentions tools or solutions - focus only on curiosity
- Detects when student is genuinely curious vs. confused

**Example Responses**:
- **High Curiosity**: "Whoa! I can see you're really noticing something interesting. What's making you curious?"
- **Low Engagement**: "Hmm, what catches your eye in this cookie factory scene? Anything surprising?"

#### Resource Building Agent (Act II)
Location: `src/lib/agents/resourceBuildingAgent.ts`

**Purpose**: Guide students to discover and use tools to resolve the mathematical conflict

**Key Logic**:
- Monitors canvas drawings and manipulative use
- Suggests tools only when students express need: "What might help you figure this out?"
- Uses focusing questions (95%) vs. funneling questions (5%)
- References student canvas work: "I see you drew circles! Tell me about your thinking."

**Transition Rules**:
- **Act 1 → Act 2**: After genuine curiosity is sparked (30-90 seconds)
- **Transition Message**: "I can see you're really wondering about this! Let me unlock some tools that might help you explore."

**Example Responses**:
- **Tool Suggestion**: "You're wondering about fair sharing - would the pizza slicer help you explore that?"
- **Canvas Reference**: "Cool drawing! I see you made groups. What are you thinking about those groups?"

#### Resolution Agent (Act III)
Location: `src/lib/agents/resolutionAgent.ts`

**Purpose**: Celebrate learning process and create satisfying resolution with extensions

**Key Logic**:
- Focuses on explanation and metacognition, not just correct answers
- Creates visual, satisfying resolution to the initial conflict
- Offers "sequel" problems to extend learning
- Celebrates the journey: "How did you figure that out?"

**Transition Rules**:
- **Act 2 → Act 3**: When student shows breakthrough understanding OR sufficient exploration (2-5 minutes)
- **Transition Message**: "Amazing discoveries! Let's celebrate what you figured out and see the big reveal!"

**Example Responses**:
- **Process Celebration**: "Incredible thinking! You used the pizza tool AND drawing to solve this. Walk me through how you figured it out!"
- **Extension**: "You mastered cookie sharing! Want to see what happens when we have 3 friends instead of 2?"

#### Canvas Monitor Agent
Location: `src/lib/agents/canvasMonitorAgent.ts`

**Purpose**: Track and interpret student canvas interactions for mathematical insights

**Key Logic**:
- Detects when students draw, manipulate objects, or use tools
- Infers mathematical intent from actions (grouping, splitting, counting)
- Triggers Pi responses when significant insights occur
- Respects act boundaries (view-only in Act 1, active in Act 2-3)

**Example Insights**:
- **Grouping Detection**: Student groups objects → Mathematical intent: "Exploring equal parts"
- **Split Detection**: Student splits pizza → Mathematical intent: "Investigating fractions"
- **Count Pattern**: Student counts repeatedly → Mathematical intent: "Verifying quantities"

### 4. Dan Meyer Context Injection System

Dynamic context messages guide Pi's behavior while maintaining pedagogical integrity:

#### Act I: The Hook Context
```
[ACT I: THE HOOK - CURIOSITY MODE]
Current Adventure: {adventureTitle}
Mathematical Conflict: {mainProblem}

CANVAS STATUS: View-only (student can observe, not interact)
TOOLS AVAILABLE: None - DO NOT mention any tools or manipulatives
GOAL: Create intellectual conflict and genuine mathematical curiosity

YOUR FOCUS:
- Ask wonder questions: "What do you notice?" "What makes you curious?"
- Reference the adventure story to create emotional connection
- Build suspense about the mathematical conflict
- NEVER give solutions or suggest problem-solving strategies

CONVERSATION STARTERS:
- "What catches your eye in this {adventure scene}?"
- "Hmm, what seems surprising or interesting here?"
- "What are you wondering about {specific visual element}?"

FORBIDDEN PHRASES: "Let's use...", "Try drawing...", "The answer is...", "We need to..."
```

#### Act II: Development Context
```
[ACT II: DEVELOPMENT - EXPLORATION MODE]
Mathematical Conflict Established: {conflict}
Student Curiosity Level: {high/medium/low}

CANVAS STATUS: Active - student can draw, manipulate, and explore
TOOLS AVAILABLE: {currentToolset}
CANVAS STATE: {currentDrawings and manipulatives}

GOAL: Guide student-driven discovery of tools and strategies

YOUR FOCUS:
- Monitor canvas activity: "I see you {action}! Tell me about your thinking."
- Suggest tools only when student expresses need or confusion
- Use focusing questions (95%): "What are you thinking?" "How does that help?"
- Use funneling questions (5%) only if student shows anxiety

CANVAS INTEGRATION:
- Reference their visual work to validate thinking
- Connect drawings/manipulatives to mathematical concepts
- Celebrate attempts and iterations

IF STUDENT IS STUCK: Guide them to express what they need, then suggest appropriate tools
```

#### Act III: Resolution Context
```
[ACT III: RESOLUTION - SHOWCASE MODE]
Problem Status: {solved/partially solved/explored}
Student Journey: {summary of their exploration}
Tools Used: {tools and strategies employed}

CANVAS STATUS: Showcase mode - highlight final work
GOAL: Celebrate process, create satisfying resolution, offer extensions

YOUR FOCUS:
- Metacognition: "How did you figure that out?" "Walk me through your thinking."
- Process celebration: Highlight their strategies, not just correct answers
- Visual resolution: "Look what you discovered! Let's see the big picture."
- Extensions: "Ready for the next adventure? What if we had 3 friends instead of 2?"

CELEBRATION LEVELS:
- Good Try: "You explored so many ideas! I love how you kept thinking."
- Solid Work: "Amazing problem solving! You really figured that out step by step."
- Breakthrough: "Incredible! You just discovered something mathematicians use all the time!"
```

#### Canvas-Specific Context
When the Canvas Monitor Agent detects activity:
```
[CANVAS ALERT] Student just {action}: {details}
Mathematical Intent Detected: {interpretedConcept}
Suggested Response: {agentRecommendation}

Examples:
- Student draws circles around objects → "Cool grouping! What are you thinking about those groups?"
- Student splits pizza slice → "Interesting split! Tell me about what you're exploring."
- Student counts items repeatedly → "I see you counting carefully! What are you figuring out?"
```

### 5. Dan Meyer + Narrative Orchestration Flow

1. **Multimodal Input** → Orchestrator receives:
   - Voice transcript from Gemini Live
   - Current canvas state (drawings + manipulatives)
   - Adventure problem image
   - Current act status

2. **Agent Processing Pipeline**:
   - **Canvas Monitor Agent**: Analyzes canvas activity for mathematical insights
   - **Current Act Agent**: Processes based on act (Curiosity/ResourceBuilding/Resolution)
   - **Adventure Context Agent**: Maintains narrative consistency with adventure theme
   - **Transition Agent**: Determines if act transition is needed

3. **Context Building**: Orchestrator weaves agent outputs into Dan Meyer framework:
   - Act-specific behavioral rules
   - Canvas activity references
   - Adventure narrative continuity
   - Pedagogical guidelines (focusing vs. funneling questions)

4. **Message to Pi**: Rich context + student input sent to Gemini 2.5 Live
5. **Pi's Response**: Guided by multi-agent pedagogical intelligence

## Educational Design: Dan Meyer Principles + Narrative Learning

### The Mathematical Story Structure

Each adventure follows Dan Meyer's framework embedded in narrative:

**Act I: The Hook (Narrative Conflict)**
- **Adventure Setup**: Visual story problem that creates emotional investment
- **Mathematical Conflict**: The curiosity-sparking element that needs resolution
- **Wonder Questions**: "What do you notice about Pi's cookie factory? What are you wondering?"
- **No Tools**: Canvas is view-only to prevent rushing to solutions

**Act II: Development (Hero's Journey)**
- **Resource Discovery**: Student becomes the hero who needs tools to solve the conflict
- **Canvas Activation**: Drawing and manipulatives become available as "magical tools"
- **Guided Exploration**: Pi helps student discover what they need, not how to use it
- **Progress Monitoring**: Agents track mathematical understanding development

**Act III: Resolution (Satisfying Conclusion)**
- **Mathematical Resolution**: Visual, satisfying answer to the original conflict
- **Process Celebration**: Focus on the journey, not just the destination
- **Adventure Completion**: Narrative closure with mathematical understanding
- **Sequels**: Extensions that continue the adventure story

### Focusing vs Funneling Questions (Dan Meyer Framework)

**Focusing Questions (95% of responses)**:
- "What do you notice about the cookies?"
- "Tell me about your thinking when you drew those circles."
- "How did you figure that out?"
- "What's making you curious here?"

**Funneling Questions (5% - only when anxiety detected)**:
- "Would it help to count the blue cookies first?"
- "Let's focus on just this row for now."

### Canvas Integration Philosophy

**Act I**: Canvas as **observation tool**
- Students can see but not interact
- Builds anticipation for when tools become available
- Prevents rushing to solutions before understanding the problem

**Act II**: Canvas as **exploration space**
- Drawing tools unlock when students express need
- Manipulatives appear based on problem type and student requests
- Pi references canvas work to validate thinking

**Act III**: Canvas as **showcase platform**
- Student work becomes the centerpiece for explanation
- Visual evidence of their mathematical journey
- Foundation for extension problems

## Adding New Agents

To add a new capability:

1. **Define Schema** in `schemas.ts`:
```typescript
export const NewAgentSchema = z.object({
  input: z.object({
    // What the agent needs
  }),
  output: z.object({
    // What the agent produces
  })
});
```

2. **Create Agent Class**:
```typescript
export class NewAgent {
  async process(input: NewAgentInput): Promise<NewAgentOutput> {
    // Agent logic here
    return NewAgentSchema.output.parse(result);
  }
}
```

3. **Add to Orchestrator**:
```typescript
// In processStudentInput()
const newAgentResult = await this.newAgent.process(input);
if (newAgentResult.needsAction) {
  context.push(`[ACTION] ${newAgentResult.action}`);
}
```

## Testing Strategy

Each agent can be tested independently:

```typescript
describe('CountingAgent', () => {
  it('should detect 2/4 as incorrect', async () => {
    const result = await countingAgent.verify({
      problemType: 'fraction',
      studentStatement: 'I think 2 out of 4 blocks are blue'
    });
    
    expect(result.isCorrect).toBe(false);
    expect(result.correction).toContain('6 blocks');
  });
});
```

## Benefits of Dan Meyer + Agent Architecture

1. **Pedagogical Integrity**: Each agent enforces specific Dan Meyer principles
2. **Narrative Consistency**: Adventure themes maintained across mathematical exploration
3. **Multimodal Intelligence**: Canvas, voice, and vision integrated seamlessly
4. **Student-Driven Learning**: Agents guide discovery rather than direct instruction
5. **Measurable Engagement**: Can track curiosity levels and mathematical breakthroughs
6. **Scalable Adventures**: New mathematical stories = new agent configurations

## Implementation Roadmap

### Phase 1: Core Three-Act Framework
- **CuriosityAgent**: Master the art of mathematical wonder questions
- **ResourceBuildingAgent**: Guide tool discovery and canvas interaction
- **ResolutionAgent**: Create satisfying mathematical conclusions
- **CanvasMonitorAgent**: Interpret student drawings and manipulative use

### Phase 2: Advanced Pedagogical Intelligence
- **MathAnxietyAgent**: Detect frustration and adjust from focusing to funneling questions
- **MisconceptionAgent**: Track common mathematical errors within adventure narratives
- **SequelAgent**: Generate extension problems that continue the adventure story
- **MetacognitionAgent**: Guide students to reflect on their problem-solving process

### Phase 3: Adaptive Storytelling
- **NarrativeAgent**: Adjust adventure complexity based on student engagement
- **PersonalizationAgent**: Incorporate student interests into mathematical scenarios
- **CollaborationAgent**: Enable multiple students to work on adventures together

## Technical Implementation for Gemini 2.5 Live

### System Prompt Optimization
```typescript
// Optimized for Gemini 2.5 Live's multimodal capabilities
const ADVENTURE_SYSTEM_PROMPT = `
You are Pi, a mathematical adventure guide optimized for multimodal learning!

MULTIMODAL INPUT PROCESSING:
- Voice: Child's questions, observations, and mathematical thinking
- Vision: Adventure problem images that create mathematical conflicts
- Canvas: Real-time student drawings and manipulative interactions

RESPONSE FORMAT:
- Keep responses 1-2 enthusiastic sentences
- Reference canvas activity when significant: "I see you grouped those cookies!"
- Use child's name frequently for engagement
- Match their energy level while guiding mathematical discovery

CURRENT ADVENTURE CONTEXT: {adventureTheme}
CURRENT ACT: {actNumber} - {actGoals}
CANVAS STATUS: {canvasState}
MATHEMATICAL FOCUS: {mathConcept}
`;
```

### Canvas State Integration
```typescript
interface CanvasState {
  drawings: DrawingElement[];
  manipulatives: Manipulative[];
  lastAction: {
    type: 'draw' | 'manipulate' | 'erase';
    timestamp: number;
    element: string;
  };
  mathematicalIntent: string; // Inferred by CanvasMonitorAgent
}
```

## Key Insight: Mathematical Storytelling

The fundamental shift is from **teaching math concepts** to **creating mathematical adventures**. Students don't solve fraction problems - they help Pi run his cookie factory. They don't learn about equal parts - they discover fair sharing to resolve conflicts between adventure characters.

**Pi becomes the narrator** of their mathematical journey, while **agents provide the pedagogical intelligence** that ensures every story beat serves learning goals. The result is math that feels like play, but delivers rigorous conceptual understanding through Dan Meyer's proven framework.