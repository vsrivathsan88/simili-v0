# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simili is an AI-powered elementary math tutor using Google's Gemini Live API for multimodal voice + vision interactions. The app features a canvas-first design where students can draw, talk, and explore math concepts with Pi, an ambient AI companion.

## Key Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm run test

# Environment setup - create .env file with:
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

## Architecture Overview

### Core Flow
1. **Lesson Selection** → Student picks a lesson from homepage
2. **Transition Animation** → 3.5 second Pi character transition
3. **Entry Popup** → Simple onboarding with mic permission request
4. **Gemini Connection** → Connects to Gemini Live API after popup CTA
5. **Ambient Pi Mode** → Pi introduces lesson naturally via voice, then listens/watches

### Key Technical Patterns

#### Gemini Live Integration (`src/contexts/LiveAPIContext.tsx`)
- WebSocket connection to Gemini Live API
- Handles voice (PCM 16kHz) and vision (base64 images)
- Tool functions for Pi to track reasoning, misconceptions, hints
- Always-on microphone when connected (ambient mode)

#### Canvas System (`src/components/UnifiedCanvas.tsx` + `EnhancedCanvas.tsx`)
- Full-screen drawing surface with minimal floating UI
- Debounced canvas updates sent to vision API (2 second delay)
- Drawing tools: pencil (4 colors), eraser, clear
- Canvas state sent as base64 JPEG to Gemini

#### Vision Sync (`src/App.tsx:sendToVisionAPI`)
```typescript
// Sends both problem image and student canvas to Pi
client.sendRealtimeInput([
  { mimeType: 'image/jpeg', data: problemBase64 },    // Problem
  { mimeType: 'image/jpeg', data: canvasBase64 }      // Student work
]);
```

#### Pi's Personality (`src/config/piTutor.ts`)
- Adventure buddy persona, not math teacher
- System prompt enforces ambient behavior
- Waits for student to work before commenting
- Tool declarations for tracking student reasoning

### Component Structure

#### Layout Components
- `App.tsx` - Main app with Gemini connection logic
- `LessonHomepage.tsx` - Lesson selection with Pi character
- `LessonTransition.tsx` - 3.5s animation between screens
- `LessonEntryPopup.tsx` - Simplified onboarding popup
- `VoicePermissionModal.tsx` - Fallback for mic permissions

#### Canvas Components
- `UnifiedCanvas.tsx` - Container managing tools and manipulatives
- `EnhancedCanvas.tsx` - Actual drawing implementation
- `MinimalToolbar.tsx` - Floating toolbar (now removed)
- `ProblemDisplay.tsx` - Shows math problem images

#### Teacher Tools
- `TeacherPanel.tsx` - Collapsible panel with analytics
- `ReasoningTrace.tsx` - Visual thinking journey
- `StudentProgress.tsx` - Progress tracking dashboard

### State Management
- React hooks for local state
- `LiveAPIContext` for Gemini connection state
- `sessionRecorder.ts` for capturing lesson data
- localStorage for persistence

### Styling Approach
- SCSS with design system (`src/config/designSystem.scss`)
- CSS variables for theming
- Hand-drawn aesthetic goals (using standard CSS currently)
- Responsive grid layouts

## Important Considerations

### Gemini Live Connection
- Connection happens AFTER lesson entry popup CTA
- Microphone auto-starts when connected (no "Start Talking" button)
- Pi gives natural voice introduction on first connection
- Handle WebSocket CLOSING/CLOSED states with retry logic

### Canvas Updates
- Always debounce canvas changes (2s delay prevents spam)
- Send both problem AND canvas images together
- Use toDataURL('image/jpeg', 0.8) for smaller payloads
- Clear context message helps Pi understand what images represent

### UI/UX Principles
- Canvas-first design (90% of viewport)
- Minimal floating elements (problem card, toolbar, Pi indicator)
- No manipulatives in toolbar currently (removed for simplicity)
- Warm colors, rounded corners, kid-friendly design
- Pi status shows ambient state ("Pi is listening...")

### Common Issues
- SASS variable imports: Ensure `_variables.scss` is imported
- Gemini disconnections: Implement retry with backoff
- Vision hallucinations: Send clear context with images
- Layout overflow: Use grid-based layouts, not absolute positioning

## Current State (as of last update)

### Completed
- ✅ Canvas-first layout with floating elements
- ✅ Lesson entry popup flow
- ✅ Ambient Pi personality (no pre-recorded audio)
- ✅ Simplified toolbar (drawing tools only)
- ✅ Gemini Live voice + vision integration

### In Progress
- 🚧 Manipulatives system (removed temporarily)
- 🚧 Hand-drawn UI aesthetic (rough.js integration)
- 🚧 Teacher analytics dashboard
- 🚧 Session replay functionality

### Known Limitations
- No offline support
- Limited to Gemini Live API availability
- Canvas performance on low-end devices
- No collaborative features yet