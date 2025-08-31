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