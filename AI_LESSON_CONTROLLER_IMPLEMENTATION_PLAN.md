# AI Lesson Controller System - Phased Implementation Plan

**Project**: Simili Math Tutor  
**Target**: Transform current ambient Pi companion into intelligent lesson controller  
**Based on**: AI_LESSON_CONTROLLER_SYSTEM_GUIDE.md  
**Date**: 2025-08-26

---

## Current State Analysis

### ✅ **Already Available**
- **Pi Personality System**: `src/config/piTutor.ts` with comprehensive system instructions
- **Tool Function Framework**: Existing tool declarations and implementations
- **Gemini Live Integration**: Full voice + vision API connection
- **Canvas System**: Drawing and visual interaction capabilities
- **Session Recording**: Analytics and reasoning step tracking
- **Event System**: Custom event handling infrastructure

### 🔒 **PROTECTED - DO NOT MODIFY**
- **Voice Exchange System**: `VoiceInput.tsx`, `useLiveAPIContext`, audio recording/streaming
- **Canvas & Vision**: All canvas drawing, `sendToVisionAPI`, `handleCanvasChange`, vision sync
- **Gemini Live Connection**: Core connection logic, audio streaming, real-time input
- **Drawing Tools**: Canvas interaction, tool selection, color management
- **Existing Pi Personality**: Current ambient behavior and timing rules

### ⚠️ **Needs Enhancement**
- **Lesson Structure**: No structured slides or progression system
- **Slide Advancement Logic**: Missing `advance_slide` tool and criteria-based progression
- **Lesson Configuration**: No JSON-based lesson definitions
- **Visual Slide Display**: No dedicated slide component (will replace `ProblemDisplay`)
- **AI Behavior**: Add lesson-aware intelligence WITHOUT changing voice/vision core

### ❌ **Missing Components**
- Lesson configuration utilities (`src/config/lessons/index.ts`)
- Lesson slide definitions (`src/config/lessons/intro-fractions.json`)
- Slide display component (`src/components/SlideDisplay.tsx`)
- Enhanced tool implementations for slide management (additive only)
- Lesson context generation system (appends to existing system instruction)

---

## Phase 1: Foundation Infrastructure (Week 1)

### **Phase 1.1: Lesson Configuration System**
**Duration**: 2-3 days  
**Files**: `src/config/lessons/`

**Tasks**:
1. **Create lesson data types**
   - `src/config/lessons/types.ts` - Define `LessonSlide` and `LessonConfig` interfaces
   - Match specification from guide exactly

2. **Build lesson utilities**
   - `src/config/lessons/index.ts` - Lesson loading and context generation functions
   - `generateLessonContext()` function for AI system instruction enhancement
   - `loadLessonConfig()` function for JSON lesson loading

3. **Create sample lesson definition**
   - `src/config/lessons/intro-fractions.json` - First lesson with 5-6 slides
   - Include specific advancement criteria for each slide
   - Focus on real-world fraction concepts (candy bar, building, etc.)

**Success Criteria**:
- [ ] TypeScript interfaces match guide specification
- [ ] JSON lesson can be loaded successfully
- [ ] Lesson context generation produces valid system instructions
- [ ] No breaking changes to existing code

---

### **Phase 1.2: Enhanced Tool System**
**Duration**: 1-2 days  
**Files**: `src/config/piTutor.ts`, `src/lib/toolImplementations.ts`

**Tasks**:
1. **Add `advance_slide` tool declaration**
   - Update `piToolDeclarations` array in `src/config/piTutor.ts`
   - Include proper parameters: `current_slide`, `next_slide`, `mastery_evidence`

2. **Implement `advance_slide` tool handler**
   - Add to `src/lib/toolImplementations.ts`
   - Dispatch `advance-slide` custom event
   - Include proper error handling and logging

3. **Enhance existing tool implementations**
   - Ensure `mark_reasoning_step` works with slide context
   - Update `flag_misconception` for lesson-specific misconceptions

**Success Criteria**:
- [ ] `advance_slide` tool can be called by AI
- [ ] Custom events fire correctly
- [ ] Existing functionality remains intact
- [ ] Tool responses include proper success/error status

---

## Phase 2: Visual Slide System (Week 2)

### **Phase 2.1: Slide Display Component**
**Duration**: 2-3 days  
**Files**: `src/components/SlideDisplay.tsx`, `src/components/SlideDisplay.scss`

**Tasks**:
1. **Create base slide component**
   - Display slide number, title, description
   - Handle slide images (using existing asset structure)
   - Show keywords and metadata
   - Responsive design matching Simili aesthetic

2. **Integrate with existing UI**
   - Replace `ProblemDisplay` content with structured slide display
   - Maintain exact same floating card design and positioning
   - NO changes to canvas-first layout or drawing functionality
   - Preserve existing image upload capability (for slide images)

3. **Add slide state management**
   - Track current slide number in component state
   - Listen for `advance-slide` events
   - Update display when AI advances slides

**Success Criteria**:
- [ ] Slides display correctly with images and text
- [ ] Component responds to slide advancement events
- [ ] Visual design matches existing Simili style
- [ ] No interference with canvas drawing functionality

---

### **Phase 2.2: Lesson Integration with App**
**Duration**: 1-2 days  
**Files**: `src/App.tsx`, `src/components/LessonHomepage.tsx`

**Tasks**:
1. **Modify lesson selection**
   - Update `LessonHomepage` to include slide-based lessons
   - Pass lesson configuration to main app
   - Maintain existing transition animations

2. **Update main app logic**
   - Load lesson configuration when lesson starts
   - APPEND lesson context to existing system instruction (don't replace)
   - Initialize slide tracking state (start with slide 1)
   - **CRITICAL**: Preserve all existing voice/vision/canvas logic

3. **Handle slide advancement events**
   - Listen for `advance-slide` events in main app
   - Update current slide state and display
   - **NO CHANGES** to voice exchange, canvas, or vision sync functionality

**Success Criteria**:
- [ ] Lesson selection loads slide-based lessons
- [ ] AI receives lesson-aware system instructions
- [ ] Slide advancement works end-to-end
- [ ] Existing lesson flow remains functional

---

## Phase 3: AI Behavior Enhancement (Week 3)

### **Phase 3.1: Enhanced Pi System Instructions**
**Duration**: 2-3 days  
**Files**: `src/config/piTutor.ts`

**Tasks**:
1. **Update core system instruction**
   - **APPEND ONLY** - Add slide management rules to existing instruction
   - Include critical timing and advancement behaviors
   - Emphasize evidence-based progression  
   - **PRESERVE** all existing personality traits and voice/vision behaviors

2. **Add lesson-specific behaviors**
   - Criteria monitoring logic in instructions
   - Evidence collection requirements
   - Slide advancement trigger descriptions
   - No-advancement-without-tool-call rules

3. **Test instruction integration**
   - Verify lesson context appends correctly
   - Ensure total instruction length is within limits
   - Test with actual Gemini Live API

**Success Criteria**:
- [ ] AI understands slide advancement requirements
- [ ] System instructions include lesson-specific context
- [ ] AI behavior aligns with guide specifications
- [ ] No degradation in existing Pi personality

---

### **Phase 3.2: Slide Advancement Logic Testing**
**Duration**: 1-2 days  
**Files**: Test scenarios, debugging tools

**Tasks**:
1. **Create test scenarios**
   - Develop specific test cases for each slide advancement criteria
   - Test premature advancement prevention
   - Verify evidence collection requirements
   - Test edge cases and error conditions

2. **Implement debugging tools**
   - Enhanced logging for AI decision making
   - Slide state visualization in developer tools
   - Tool call tracking and verification
   - Mastery evidence collection display

3. **Behavioral validation**
   - 8-second wait time compliance
   - Visual-first approach verification
   - Specific evidence requirement checking
   - Tool call before advancement validation

**Success Criteria**:
- [ ] AI waits for proper evidence before advancing
- [ ] `advance_slide` tool is called with correct parameters
- [ ] No verbal advancement without tool calls
- [ ] All advancement criteria work as specified

---

## Phase 4: Content and Polish (Week 4)

### **Phase 4.1: Complete Lesson Content**
**Duration**: 2-3 days  
**Files**: `src/config/lessons/intro-fractions.json`, asset files

**Tasks**:
1. **Create complete intro-fractions lesson**
   - 8-10 slides covering full fraction introduction
   - Include all required slide images in `/public/assets/`
   - Specific advancement criteria for each slide
   - Comprehensive misconception tracking

2. **Add additional lesson**
   - `src/config/lessons/equivalent-fractions.json`
   - Test lesson system with multiple lessons
   - Verify lesson switching and state management

3. **Asset integration**
   - Create/source all required slide images
   - Optimize images for web delivery
   - Implement lazy loading if needed

**Success Criteria**:
- [ ] Complete lessons with all slides and images
- [ ] All advancement criteria are specific and testable
- [ ] Multiple lessons can be loaded and switched
- [ ] Asset loading doesn't impact performance

---

### **Phase 4.2: User Experience and Edge Cases**
**Duration**: 1-2 days  
**Files**: Multiple components, error handling

**Tasks**:
1. **Error handling and resilience**
   - Handle missing lesson configurations gracefully
   - Manage AI tool call failures
   - Provide fallback behaviors for edge cases
   - Implement retry logic for slide advancement

2. **User experience polish**
   - Smooth slide transition animations
   - Clear visual feedback for slide advancement
   - Loading states and progress indicators
   - Accessibility considerations

3. **Integration testing**
   - Full end-to-end lesson completion testing
   - Multiple student interaction patterns
   - Connection failure and recovery testing
   - Performance testing with full lesson content

**Success Criteria**:
- [ ] Robust error handling prevents crashes
- [ ] Smooth user experience throughout lessons
- [ ] System handles edge cases gracefully
- [ ] Performance meets acceptable standards

---

## Phase 5: Deployment and Validation (Week 5)

### **Phase 5.1: Testing and Quality Assurance**
**Duration**: 2-3 days  

**Tasks**:
1. **Comprehensive testing suite**
   - Unit tests for lesson utilities
   - Component tests for slide display
   - Integration tests for AI behavior
   - End-to-end lesson completion tests

2. **AI behavior validation**
   - Verify all guide requirements are met
   - Test conversation patterns match examples
   - Validate advancement criteria interpretation
   - Check timing and wait behavior

3. **Performance and reliability**
   - Load testing with multiple concurrent users
   - Memory usage and optimization
   - API rate limiting and error handling
   - Mobile device compatibility

**Success Criteria**:
- [ ] All tests pass consistently
- [ ] AI behavior matches guide specifications
- [ ] System is performant and reliable
- [ ] Ready for production deployment

---

### **Phase 5.2: Documentation and Deployment**
**Duration**: 1-2 days  

**Tasks**:
1. **Update documentation**
   - Update CLAUDE.md with new system architecture
   - Create deployment guide for lesson system
   - Document lesson creation process
   - Update troubleshooting guides

2. **Deployment preparation**
   - Environment configuration for production
   - Asset optimization and CDN setup
   - Monitoring and logging configuration
   - Rollback procedures

3. **Launch and monitoring**
   - Staged rollout to test users
   - Real-time monitoring of AI behavior
   - User feedback collection
   - Performance metrics tracking

**Success Criteria**:
- [ ] Complete documentation is available
- [ ] Production deployment is successful
- [ ] Monitoring systems are operational
- [ ] User feedback is positive

---

## 🔒 **CRITICAL CONSTRAINTS & PROTECTED FUNCTIONALITY**

### **ABSOLUTELY DO NOT TOUCH**
1. **Voice System**:
   - `src/components/VoiceInput.tsx` - Audio recording and streaming
   - `src/hooks/use-live-api.ts` - Gemini Live connection management  
   - `src/lib/audio-recorder.ts` - Audio capture functionality
   - Any `sendRealtimeInput` calls for audio data

2. **Vision System**:
   - `sendToVisionAPI()` function in App.tsx
   - `handleCanvasChange` and `canvasImageData` logic
   - Canvas-to-base64 conversion and vision sync
   - Debounced canvas updates (2-second delay)

3. **Canvas & Drawing**:
   - All canvas drawing functionality
   - Tool selection (pencil, eraser, colors)
   - `UnifiedCanvas`, `EnhancedCanvas` components
   - Canvas state management and updates

4. **Core Pi Behavior**:
   - Existing 8-second wait times
   - Visual-first approach
   - Current personality traits
   - Ambient listening mode

### **IMPLEMENTATION STRATEGY**
- **Additive Only**: Add new functionality without modifying existing systems
- **Append, Don't Replace**: Enhance system instructions by appending lesson context
- **Event-Driven**: Use custom events to avoid direct integration conflicts
- **UI Replacement**: Replace only `ProblemDisplay` content, keep same container

---

## Implementation Priorities

### **Critical Path Items**
1. **Lesson Configuration System** - Foundation for everything else
2. **`advance_slide` Tool Implementation** - Core AI behavior (additive to existing tools)
3. **Slide Display Component** - Visual system (replaces ProblemDisplay content only)
4. **AI System Instruction Updates** - Behavioral alignment (append-only)

### **Risk Mitigation**
- **Voice Exchange Disruption**: Test extensively that lesson system doesn't interfere with audio streaming
- **Canvas/Vision Conflicts**: Ensure slide system works alongside existing vision sync
- **AI Behavior Regression**: Preserve existing Pi personality while adding lesson awareness
- **Integration Challenges**: Use event-driven architecture to minimize direct code changes
- **Performance Issues**: Profile early, optimize asset loading and state management
- **Content Creation**: Begin with minimal viable lessons, expand based on testing

### **Success Metrics**
- AI consistently waits for proper evidence before advancing slides
- Students complete lessons with appropriate pacing (not too fast/slow)
- Zero instances of verbal advancement without tool calls
- Positive user feedback on lesson structure and AI behavior

---

## Resource Requirements

### **Development Time**: 4-5 weeks full-time equivalent
### **Key Skills Needed**:
- React/TypeScript development
- AI prompt engineering and behavior design
- Educational content development
- User experience design

### **Dependencies**:
- Existing Gemini Live API integration
- Current canvas and drawing systems
- Session recording and analytics infrastructure
- Asset creation and management pipeline

---

*This plan transforms the current ambient Pi companion into an intelligent lesson controller while preserving the core educational value and user experience of the Simili platform.*