# Simili Agent Architecture

## Overview

Simili uses a **structured multi-agent architecture** inspired by DSPy principles but implemented in TypeScript. Instead of one massive system prompt trying to handle all scenarios, we use discrete agents with single responsibilities, strict input/output schemas, and a central orchestrator.

## Core Philosophy

### Problems with Monolithic Prompts
- **Unreliable**: Pi would confuse rules (e.g., mentioning tools in Act 1)
- **Unscalable**: Adding new features meant making the prompt even longer
- **Untestable**: No way to verify specific behaviors in isolation
- **Poor Error Handling**: When Pi said "2/4" instead of "2/6", we couldn't correct it

### Agent-Based Solution
- **Discrete Modules**: Each agent handles ONE thing well
- **Strict Schemas**: Using Zod for type-safe input/output contracts
- **Testable**: Each agent can be unit tested
- **Composable**: Easy to add new capabilities

## Architecture Components

### 1. Base System Prompt (Minimal)
Location: `src/lib/orchestrator/structuredOrchestrator.ts`

```
You are Pi, a friendly math buddy who loves exploring patterns with kids!

Core traits:
- Speak like a friend (use "cool!", "awesome!", "hmm...")
- Get excited about their ideas
- Love mistakes as learning opportunities
- Wait patiently after asking questions

You receive two images with each message:
1. A math problem
2. The student's canvas/work

Your responses will be guided by context messages that tell you the current mode and rules.
```

**Key Point**: This prompt only defines Pi's personality, NOT the rules for each situation.

### 2. Agent Schemas
Location: `src/lib/agents/schemas.ts`

We use Zod to define strict contracts for each agent:

#### Notice & Wonder Schema
```typescript
export const NoticeWonderSchema = z.object({
  input: z.object({
    problemImage: z.string(),
    studentCanvas: z.string(),
    currentAct: z.literal('act1')
  }),
  output: z.object({
    response: z.string(),
    questionType: z.enum(['notice', 'wonder', 'observe']),
    mentionsTools: z.boolean() // Should ALWAYS be false in Act 1
  })
});
```

#### Verify Counting Schema
```typescript
export const VerifyCountingSchema = z.object({
  input: z.object({
    problemType: z.literal('fraction'),
    studentStatement: z.string()
  }),
  output: z.object({
    totalObjects: z.number(),
    targetObjects: z.number(),
    studentAnswer: z.string(),
    isCorrect: z.boolean(),
    correction: z.string().optional()
  })
});
```

#### Act Transition Schema
```typescript
export const ActTransitionSchema = z.object({
  input: z.object({
    currentAct: z.enum(['act1', 'act2', 'act3']),
    studentProgress: z.object({
      timeInAct: z.number(),
      hasAskedForHelp: z.boolean(),
      hasDrawnSomething: z.boolean(),
      hasSolvedProblem: z.boolean()
    })
  }),
  output: z.object({
    shouldTransition: z.boolean(),
    nextAct: z.enum(['act1', 'act2', 'act3']).optional(),
    reason: z.string()
  })
});
```

### 3. Individual Agents

#### Counting Agent
Location: `src/lib/agents/countingAgent.ts`

**Purpose**: Ensures Pi always counts correctly and catches common errors

**Key Logic**:
- Detects phrases like "2 out of 4" or "2/4"
- Knows correct answer is 2/6 or 1/3
- Generates focusing questions when student miscounts

**Example Responses**:
- Correct: "Yes! You found that 2 out of 6 blocks are blue. How did you figure that out?"
- Wrong Total: "I see you're thinking about the blocks. Can you count ALL the blocks again? How many do you see altogether?"

#### Act Transition Agent
Location: `src/lib/agents/actTransitionAgent.ts`

**Purpose**: Decides when to move between acts based on student progress

**Transition Rules**:
- **Act 1 → Act 2**: After 30s OR when student asks for help
- **Act 2 → Act 3**: When problem is solved OR significant progress + 2 minutes

**Transition Messages**:
- To Act 2: "Great noticing! Now let's work on this together. I've unlocked some tools for you!"
- To Act 3: "Wow, look at all your thinking! Let's showcase what you discovered!"

### 4. Context Injection System

Instead of trying to intercept Pi's audio responses, we inject context with each message:

#### Act-Specific Context

**Act 1 Context**:
```
[ACT 1 RULES]
- Mode: Notice & Wonder
- Canvas: View-only (dimmed)
- Tools: NONE - do not mention any tools
- Focus: "What do you notice?" "What makes you curious?"
- Never suggest drawing or using tools
```

**Act 2 Context**:
```
[ACT 2 RULES]
- Mode: Exploration
- Canvas: Active - student can draw
- Tools: Available (pencil, eraser, fraction bars, pizza)
- You can now suggest: "Would the pizza help?" "Try drawing..."
- Focus on their problem-solving process
```

**Act 3 Context**:
```
[ACT 3 RULES]
- Mode: Showcase
- Focus: "How did you figure that out?" "Explain your thinking"
- Celebrate their solution
- No new problem solving
```

#### Error Corrections
When the counting agent detects an error:
```
[IMPORTANT] The student counted 4 blocks total, but there are actually 6 blocks (2 blue, 4 gray)
[RESPONSE GUIDE] Use a focusing question about counting ALL blocks
```

### 5. Orchestration Flow

1. **Student Input** → Orchestrator receives transcript + canvas + problem image
2. **Agent Processing**:
   - CountingAgent checks for counting statements
   - ActTransitionAgent checks if it's time to change acts
   - Other agents can be added here
3. **Context Building**: Orchestrator combines all agent outputs into context
4. **Message to Pi**: Context + student input sent to Gemini Live
5. **Pi's Response**: Informed by the injected context

## Educational Design Considerations

### Focusing vs Funneling Questions

The system is designed to prioritize **focusing questions** (95% of the time):
- "What do you notice?"
- "Can you tell me more about your thinking?"
- "How did you figure that out?"

**Funneling questions** are only used when math anxiety is detected:
- "Would it help if we count the blue blocks first?"
- "Let's start with just this row..."

### Error Handling Philosophy

When students make mistakes (e.g., saying "2 out of 4"):
1. **Don't correct directly**: No "Actually, there are 6 blocks"
2. **Use focusing questions**: "Can you count ALL the blocks again?"
3. **Celebrate the attempt**: "I love how you're thinking about this!"

### Three-Act Structure

**Act 1: Notice & Wonder**
- Goal: Build understanding without pressure
- No tools available (prevents rushing to solve)
- Pi asks open-ended observation questions

**Act 2: Explore**
- Goal: Active problem-solving with support
- Tools unlocked based on problem type
- Pi can suggest strategies and tools

**Act 3: Showcase**
- Goal: Consolidate and celebrate learning
- Focus on explanation and metacognition
- Pi asks about process, not just answer

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

## Benefits of This Architecture

1. **Reliability**: Each agent has a single, testable responsibility
2. **Maintainability**: Changes to one behavior don't affect others
3. **Debuggability**: Can trace exactly which agent made each decision
4. **Extensibility**: New features = new agents, not prompt changes
5. **Type Safety**: Zod schemas catch errors at development time

## Future Considerations

### Potential New Agents
- **MathAnxietyAgent**: Detects frustration and adjusts approach
- **HintProgressionAgent**: Manages hint escalation
- **MisconceptionAgent**: Tracks and addresses common errors
- **ProgressTrackingAgent**: Monitors learning over time

### Optimization Opportunities
- Each agent's prompts can be manually tuned
- Could add caching for common scenarios
- Agent decisions could be logged for analysis

## Key Insight

The fundamental shift is from trying to make Pi "smart" through one massive prompt, to making the **system** smart through coordinated agents. Pi just needs to be a friendly voice - the agents handle the pedagogical intelligence.

## ADK-Orchestrated Runtime (Server) — Migration Plan

### Goals
- Keep TS frontend agents/orchestrator logic as “policy”; move runtime (voice BIDI, turn-taking, tool dispatch, vision fan-in) into an ADK server
- Preserve strict schemas; define JSON tool contracts mirrored as ADK tools

### Components
- ADK Agent (Python)
  - Foundational agent → adds tools for: set_lesson_act, annotate_canvas, mark_reasoning_step, flag_misconception, suggest_hint, celebrate_exploration
  - RunConfig uses BIDI streaming; asyncio.TaskGroup for receive/send/think
- WS Bridge (server)
  - Accepts `{type: 'audio'|'text'|'vision'|'event'}` from browser
  - Emits `{type: 'audio'|'text'|'tool'}` to browser
  - Vision buffer maintains latest problem/canvas frames for agent context
- Frontend
  - `adkClient` sends mic audio (future), text and vision; listens for audio/text/tool events
  - Tool events call existing TS handlers to update UI (three‑act, reasoning map, annotations)

### Schema Mapping (ADK ⇄ TS)
- One‑to‑one mapping of tool payloads (zod in TS; pydantic/dataclass in Python)
- Version field `v1` in messages; additive changes only

### Flow
1. Browser connects WS; sends initial problem + blank canvas images
2. User speaks; browser streams audio (phase 2) or pushes interim transcripts (phase 1)
3. ADK agent replies with audio/text and tool calls
4. Frontend applies tool calls; sends periodic vision frames

### Incremental Milestones
- M1: Text‑only BIDI (echo → agent response)
- M2: Tool calls for three‑act + annotate + reasoning step
- M3: Vision context integration and throttling
- M4: Audio streaming + barge‑in

### Testing
- Contract tests for tool payloads (TS/py cross‑validation)
- E2E script: select lesson → Act 1 → ADK set_lesson_act → Act 2 drawing → annotate_canvas event

### Rollback
- Feature flag `REACT_APP_USE_ADK`; Live client remains as fallback