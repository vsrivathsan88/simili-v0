# Lesson Development Memory

## Current Lesson Flow Analysis

### "Let's Go" Button Flow

1. **Button Location**: `LessonHomepage.tsx:121-128`
   - Triggers `onLessonSelect(currentLesson.id)` with current lesson (intro-fractions)

2. **Lesson Selection Handler**: `App.tsx:320-342` 
   - `handleLessonSelect()` sets transition and shows 3.5s animation
   - Proceeds to lesson entry popup

3. **"Start with Pi" Button**: `LessonEntryPopup.tsx:48-56`
   - Triggers `handleLessonEntryStart()` in App.tsx

4. **Connection Process**: `App.tsx:388-416`
   - Checks microphone permissions
   - Calls `connectWithRetry()` to establish Gemini Live connection

### What Gets Sent to Gemini at Connection

**Only these 3 items are sent:**
1. **System Instruction** (`piTutor.ts:4-86`) - Personality prompt including opening
2. **Tool Declarations** (`piTutor.ts:89-236`) - Functions Pi can call
3. **Response Modality** - Audio output only

**What's NOT sent:**
- No lesson content from `adaptiveProblems.ts`
- No problem details or context
- No selected lesson ID
- No `intro-fractions.json` content (this file is unused in main flow)

### The Problem Context Gap

#### What Happens to Problem Data:
1. **Problem loads** in `ProblemDisplay.tsx:20-32` from `adaptiveProblems.ts`
2. **Gets console logged** (our addition) - full JSON with spokenPrompt, successCriteria, etc.
3. **Gets converted to image** via `createProblemImage()` function
4. **Only the visual gets sent** to Gemini as image data

#### What Gemini Actually Receives:
- **400x300 pixel canvas** with white background
- **Just the `visualPrompt` property** (e.g., "🍕 🍕") as 72px text
- **No textual context** about what student should do

#### The Disconnect:
- System instruction says "Ready to check out this problem together?"
- But no actual problem context is provided to Gemini
- When asked "what problem?", Gemini correctly responds "I don't have a problem"
- All rich context (spokenPrompt, successCriteria, manipulatives) is lost

### Unused Systems

1. **JSON Lesson System**: 
   - Files like `intro-fractions.json` exist
   - `loadLessonConfig()` function can load them
   - But **not used** in main app flow
   - Only used in test components

2. **Problem Change Callback**:
   - `onProblemChange` prop exists in ProblemDisplay
   - But **never passed** from App.tsx:471-474
   - Rich problem context never flows back to parent

### Current Problem Flow Summary

```
"Let's Go" → Transition → "Start with Pi" → Gemini Connection
                                        ↓
                            Only gets: System instruction + Tools
                                        ↓
ProblemDisplay loads → Console logs full problem → Creates emoji image → Sends to Gemini
         ↓                                                                      ↓
   Rich context lost                                              Gemini gets: "🍕 🍕" image only
```

## Key Finding

**The lesson system is fundamentally broken** - Gemini's opening speech promises to work on a problem together, but it never receives the actual problem context, only a visual emoji image with no explanation of what the student should do with it.

## Technical Issues Fixed (2024-08-31)

### AudioWorkletNode Race Condition Bug

**Problem**: Users clicking "Start with Pi" received error:
```
Failed to construct 'AudioWorkletNode': The node name 'audio-recorder-worklet' is not defined in AudioWorkletGlobalScope.
```

**Root Cause**: Race condition in `src/lib/audio-recorder.ts:64-67`. Even though `addModule()` was awaited, worklet registration in `AudioWorkletGlobalScope` is asynchronous and may not complete before `new AudioWorkletNode()` constructor runs.

**Solution**: Added `createWorkletNodeWithRetry()` method with exponential backoff retry mechanism instead of relying on arbitrary timing delays.

**Why This Fix Works**: 
- Actively checks for worklet availability instead of passive waiting
- Handles network latency, CPU load, and browser caching variations
- Resilient to different device performance characteristics

**Critical Code Pattern**:
```typescript
// DON'T DO: Brittle timing-based fix
await this.audioContext.audioWorklet.addModule('/audio-recorder-worklet.js');
await new Promise(resolve => setTimeout(resolve, 100)); // UNRELIABLE

// DO: Robust retry mechanism  
await this.audioContext.audioWorklet.addModule('/audio-recorder-worklet.js');
this.recordingWorklet = await this.createWorkletNodeWithRetry(workletName, 5, 50);
```

### React Infinite Re-render Loops

**Problem**: Console showed "Maximum update depth exceeded" warnings causing performance issues and potential crashes.

**Root Cause**: Unstable function references in useEffect dependencies:
1. `VoiceInput.tsx:22-24` - `onVolume` function recreated every render
2. `App.tsx:237` - `handleCanvasChange` function recreated every render  
3. `EnhancedCanvas.tsx:79-84` - `onCanvasChange` in dependency array without stable reference

**Solution**: Wrapped event handlers in `useCallback` with empty dependency arrays to ensure stable function identity.

**Why This Fix Works**:
- Prevents function recreation on every render
- Breaks the infinite loop cycle in useEffect dependencies
- Follows React best practices for performance optimization

**Critical Code Pattern**:
```typescript
// DON'T DO: Unstable function reference
const onVolume = (vol: number) => {
  setVolume(vol);
};

// DO: Stable function reference
const onVolume = useCallback((vol: number) => {
  setVolume(vol);  
}, []);
```

### Prevention Guidelines for Future Development

1. **AudioWorklet Initialization**: Always use retry mechanisms, never setTimeout for worklet timing
2. **React Event Handlers**: Always wrap in useCallback when passed to useEffect or child components
3. **Function Stability**: Ensure parent components pass stable function references as props
4. **Testing**: Run `npm run build` before commits to catch TypeScript and React hooks violations

These fixes maintain backward compatibility while resolving the core technical blockers preventing the lesson system from functioning.

---

## ESLint Configuration & Code Quality Improvements (2024-08-31)

### Problem: Warnings Not Blocking Builds

**Issue**: ESLint warnings were not failing builds, allowing problematic code patterns to reach production. Key warnings included:
- `react-hooks/exhaustive-deps`: Missing dependencies causing infinite re-render loops
- `@typescript-eslint/no-unused-vars`: Dead code accumulation
- `no-loop-func`: Unsafe closure patterns in loops

**Solution**: Updated `package.json` ESLint configuration to treat critical warnings as errors:

```json
{
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"],
    "rules": {
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-unused-vars": "error", 
      "no-loop-func": "error"
    }
  }
}
```

### Comprehensive Code Structure Refactoring

**Root Cause Analysis**: The original codebase suffered from poor React component organization, leading to:
1. "Used before declaration" errors with hooks and functions
2. Circular dependencies in useCallback/useEffect chains
3. Inconsistent function ordering across components

**Solution Applied**: Systematic refactoring of all major components to follow standard React patterns:

#### 1. App.tsx - Complete Restructure
**Before**: Functions scattered throughout component, causing circular dependencies
**After**: Standard React pattern implementation:

```typescript
function SimiliApp() {
  // 1. STATE HOOKS - All useState and useRef declarations
  const [canvasImageData, setCanvasImageData] = useState<string>('');
  // ... all state declarations

  // 2. CUSTOM HOOKS - All custom hook calls  
  const { connectWithRetry, reset } = useConnectionRetry(...);

  // 3. MEMOIZED CALLBACKS - All useCallback functions
  const handleCanvasChange = useCallback((imageData: string) => {
    setCanvasImageData(imageData);
  }, []);
  
  const sendToVisionAPI = useCallback((problemImg: string, canvasImg: string) => {
    // ... implementation
  }, [client, connected]);
  // ... all other callbacks

  // 4. EFFECT HOOKS - All useEffect blocks
  useEffect(() => {
    // Configuration effect
  }, [setConfig, setModel]);
  
  useEffect(() => {
    // Client event listeners
  }, [client, isManualDisconnect, selectedLesson, connected, connectWithRetry]);
  // ... other effects

  // 5. RETURN STATEMENT - JSX rendering
  return (/* JSX */);
}
```

#### 2. ProblemDisplay.tsx & StudentProgress.tsx - Pattern Application
Applied identical restructuring to eliminate "used before declaration" errors:
- Moved `createProblemImage` and `processSessionsForProgress` functions before their usage in useEffect
- Wrapped all event handlers in useCallback with proper dependencies
- Ordered all hooks according to standard pattern

#### 3. Enhanced Canvas - Pure Function Extraction
**Problem**: Circular dependency between `redrawCanvas` and `drawBackground` functions
**Solution**: Moved `drawBackground` outside component as pure helper function:

```typescript
// Pure helper function outside component - no dependencies
const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, background: string) => {
  // Drawing logic
};

const EnhancedCanvas: React.FC<Props> = (props) => {
  // Component only contains stateful logic
  const redrawCanvas = useCallback(() => {
    drawBackground(context, width, height, background); // Call pure function
  }, [strokes, textElements, width, height, background, onCanvasChange]);
};
```

### UI Layout Restoration

**Problem**: During refactoring, the main lesson interface layout was broken. After "Start with Pi", users saw a blank screen instead of the expected two-column layout.

**Root Cause**: 
1. Missing CSS classes for layout structure
2. Incorrect component hierarchy in JSX
3. Removed essential layout containers during cleanup

**Solution**: Complete UI structure restoration:

#### 1. JSX Structure Redesign
```typescript
// NEW: Proper two-column layout
<div className="lesson-interface">
  {/* Left Sidebar - 320px fixed width */}
  <div className="lesson-sidebar">
    <div className="problem-card">
      <ProblemDisplay />
    </div>
    <div className="connection-status">
      {/* Pi listening status */}
    </div>
    <div className="lesson-controls">
      {/* Teacher View, Disconnect buttons */}
    </div>
  </div>

  {/* Right Main Area - flexible width */}
  <div className="canvas-area">
    <UnifiedCanvas />
    <VoiceInput />
    <ToolCallFeedback />
  </div>
</div>
```

#### 2. CSS Layout Implementation
Added comprehensive CSS for two-column responsive layout:

```scss
.lesson-interface {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.lesson-sidebar {
  width: 320px;
  min-width: 320px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: white;
}
```

### Technical Debt Resolution

**Issues Fixed**:
1. **LiveAPIProvider Missing Props**: Added required `options={{ apiKey }}` prop
2. **Invalid Style References**: Removed non-existent `designSystem.layout` references
3. **Orphaned State References**: Removed `clearTrigger` key references after state deletion
4. **Unused Imports/Variables**: Comprehensive cleanup of dead code
5. **Audio Recorder Loop Function**: Fixed closure bug in retry mechanism

### Build System Improvements

**Before**: Build warnings ignored, allowing problematic patterns
**After**: Strict build validation ensuring code quality:

```bash
# All builds now fail on:
- Missing useEffect dependencies
- Unused variables and imports  
- Unsafe loop functions
- TypeScript errors
- Component prop mismatches
```

### Current System State

**✅ Fully Functional**:
- ESLint errors treated as build failures
- All React components follow standard patterns
- UI layout properly restored (sidebar + canvas)
- No infinite re-render loops
- Clean TypeScript compilation
- Proper hook dependency management

**📋 Lesson System Status** (Unchanged from previous analysis):
- Core problem still exists: Pi receives only emoji images without context
- Problem data (`spokenPrompt`, `successCriteria`) still not sent to Gemini
- `onProblemChange` callback still unused in main flow
- Lesson JSON system still inactive

**🎯 Next Development Steps**:
1. **Fix Core Lesson Context Gap**: Implement proper problem context transmission to Gemini
2. **Activate Problem Change Callback**: Connect rich problem data to parent components
3. **Enable Lesson JSON System**: Integrate structured lesson configs into main flow
4. **Add Context Messages**: Send problem instructions alongside visual data

**🔧 Development Guidelines Established**:
1. Always follow React hook ordering: State → Custom Hooks → Callbacks → Effects → Return
2. Wrap all event handlers in useCallback when passed to useEffect or child components
3. Extract pure functions outside components to avoid circular dependencies
4. Run `npm run build` before commits to catch violations
5. Treat ESLint warnings as errors for critical patterns

The codebase is now in a maintainable state with proper architecture, but the core lesson functionality gap remains the primary development priority.