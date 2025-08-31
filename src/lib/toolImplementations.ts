import { FunctionCall } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { designSystem } from '../config/designSystem';
import { SlideAdvancementMonitor, validateAdvancementCriteria } from './slideAdvancementTesting';

// Types for our tool responses
export interface ReasoningStep {
  id: string;
  timestamp: number;
  transcript: string;
  classification: 'correct' | 'partial' | 'incorrect' | 'exploring';
  concepts: string[];
  confidence: number;
  canvasSnapshot?: string;
  slideContext?: {
    slideNumber: number;
    slideName: string;
    lessonId: string;
  };
}

export interface Misconception {
  id: string;
  timestamp: number;
  type: 'unequal_parts' | 'counting_not_measuring' | 'whole_unclear';
  evidence: string;
  severity: 'minor' | 'major';
  slideContext?: {
    slideNumber: number;
    slideName: string;
    lessonId: string;
  };
}

export interface CanvasAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'underline';
  coordinates: { x: number; y: number }[];
  color: string;
  message?: string;
}

export interface SlideAdvancement {
  id: string;
  timestamp: number;
  currentSlide: number;
  nextSlide: number;
  masteryEvidence: string;
}

// Current lesson context (will be set by the main app)
export const currentLessonContext = {
  lessonId: '',
  currentSlideNumber: 1,
  currentSlideName: '',
  setLessonContext: (lessonId: string, slideNumber: number, slideName: string) => {
    currentLessonContext.lessonId = lessonId;
    currentLessonContext.currentSlideNumber = slideNumber;
    currentLessonContext.currentSlideName = slideName;
  }
};

// Store for session data
export const sessionStore = {
  reasoningSteps: [] as ReasoningStep[],
  misconceptions: [] as Misconception[],
  annotations: [] as CanvasAnnotation[],
  celebrations: [] as any[],
  slideAdvancements: [] as SlideAdvancement[]
};

// Tool implementation functions
export const toolImplementations = {
  mark_reasoning_step: async (params: any) => {
    const monitor = SlideAdvancementMonitor.getInstance();
    
    const step: ReasoningStep = {
      id: uuidv4(),
      timestamp: Date.now(),
      transcript: params.transcript,
      classification: params.classification,
      concepts: params.concepts,
      confidence: params.confidence,
      slideContext: currentLessonContext.lessonId ? {
        slideNumber: currentLessonContext.currentSlideNumber,
        slideName: currentLessonContext.currentSlideName,
        lessonId: currentLessonContext.lessonId
      } : undefined
    };
    
    // Log student response for monitoring
    if (step.slideContext) {
      monitor.logStudentResponse(
        step.slideContext.slideNumber,
        step.transcript,
        step.classification
      );
    }
    
    // Add to session store
    sessionStore.reasoningSteps.push(step);
    
    // Emit event for UI update
    window.dispatchEvent(new CustomEvent('reasoning-step-added', { detail: step }));
    
    // If incorrect, we celebrate the attempt
    if (step.classification === 'incorrect') {
      window.dispatchEvent(new CustomEvent('celebrate-mistake', { detail: step }));
    }
    
    return { success: true, stepId: step.id };
  },
  
  flag_misconception: async (params: any) => {
    const misconception: Misconception = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: params.type,
      evidence: params.evidence,
      severity: params.severity,
      slideContext: currentLessonContext.lessonId ? {
        slideNumber: currentLessonContext.currentSlideNumber,
        slideName: currentLessonContext.currentSlideName,
        lessonId: currentLessonContext.lessonId
      } : undefined
    };
    
    // Add to session store
    sessionStore.misconceptions.push(misconception);
    
    // Create visual indicator (not as error, but as interesting thinking)
    window.dispatchEvent(new CustomEvent('misconception-flagged', { 
      detail: { 
        ...misconception,
        celebration: true // Always celebrate attempts
      } 
    }));
    
    return { success: true, misconceptionId: misconception.id };
  },
  
  suggest_hint: async (params: any) => {
    // Visual hints appear on canvas
    if (params.level === 'visual_hint') {
      const hintId = uuidv4();
      
      window.dispatchEvent(new CustomEvent('visual-hint-requested', {
        detail: {
          id: hintId,
          level: params.level,
          content: params.content
        }
      }));
      
      return { success: true, hintId };
    }
    
    // Other hints are just verbal from Pi
    return { success: true, delivered: 'verbally' };
  },
  
  celebrate_exploration: async (params: any) => {
    const celebrationId = uuidv4();
    
    // Trigger celebration animation
    window.dispatchEvent(new CustomEvent('celebrate-exploration', {
      detail: {
        id: celebrationId,
        message: params.message,
        animation: params.animation
      }
    }));
    
    // Add to session
    sessionStore.celebrations.push({
      id: celebrationId,
      timestamp: Date.now(),
      message: params.message,
      animation: params.animation
    });
    
    return { success: true, celebrationId };
  },
  
  annotate_canvas: async (params: any) => {
    const annotation: CanvasAnnotation = {
      id: uuidv4(),
      type: params.type,
      coordinates: params.coordinates,
      color: params.color || designSystem.colors.primary,
      message: params.message
    };
    
    // Add to session store
    sessionStore.annotations.push(annotation);
    
    // Trigger canvas annotation
    window.dispatchEvent(new CustomEvent('canvas-annotation', { detail: annotation }));
    
    return { success: true, annotationId: annotation.id };
  },
  
  advance_slide: async (params: any) => {
    const monitor = SlideAdvancementMonitor.getInstance();
    const currentSlide = params.current_slide;
    const nextSlide = params.next_slide;
    const masteryEvidence = params.mastery_evidence;
    
    // Validate advancement criteria
    const validation = validateAdvancementCriteria(currentSlide, masteryEvidence);
    
    // Log AI decision for debugging
    monitor.logAIDecision(
      currentSlide,
      `Request advance to slide ${nextSlide}`,
      validation.evidence,
      `Confidence: ${validation.confidence}, Missing: ${validation.missingElements.join(', ')}`
    );
    
    const advancement: SlideAdvancement = {
      id: uuidv4(),
      timestamp: Date.now(),
      currentSlide,
      nextSlide,
      masteryEvidence
    };
    
    console.log(`🚀 AI requesting slide advance: ${currentSlide} -> ${nextSlide}`);
    console.log(`📋 Evidence: ${masteryEvidence}`);
    console.log(`🔍 Validation:`, validation);
    
    // Behavioral validation warnings
    if (!validation.shouldAdvance) {
      console.warn(`⚠️  Advancement may be premature. Missing: ${validation.missingElements.join(', ')}`);
      console.warn(`🤖 AI should collect more evidence before advancing`);
    }
    
    if (validation.confidence < 0.5) {
      console.warn(`⚠️  Low confidence advancement (${Math.round(validation.confidence * 100)}%)`);
    }
    
    // Log the tool call
    monitor.logToolCall(currentSlide, 'advance_slide', params, { validation });
    
    // Add to session store for analytics
    sessionStore.slideAdvancements.push(advancement);
    
    // Log advancement attempt
    monitor.logAdvancement(currentSlide, nextSlide, masteryEvidence, true);
    
    // Dispatch custom event to trigger slide advancement in UI
    window.dispatchEvent(new CustomEvent('advance-slide', {
      detail: {
        id: advancement.id,
        currentSlide,
        nextSlide,
        masteryEvidence,
        timestamp: advancement.timestamp,
        validation
      }
    }));
    
    // Success response to AI (always succeeds, but with validation feedback)
    return { 
      success: true, 
      advancementId: advancement.id,
      message: `Advanced from slide ${currentSlide} to slide ${nextSlide}`,
      nextSlide,
      validation: {
        confidence: validation.confidence,
        evidenceStrength: validation.evidence.length,
        recommendedAction: validation.shouldAdvance ? 'proceed' : 'collect_more_evidence'
      }
    };
  }
};

// Helper to handle tool calls from Gemini
export async function handleToolCall(functionCall: FunctionCall) {
  const { name, args } = functionCall;
  
  if (!name) {
    return {
      response: null,
      error: 'Function name is missing'
    };
  }
  
  if (name in toolImplementations) {
    try {
      const result = await toolImplementations[name as keyof typeof toolImplementations](args);
      return {
        response: result,
        error: null
      };
    } catch (error) {
      console.error(`Error in tool ${name}:`, error);
      return {
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  return {
    response: null,
    error: `Unknown tool: ${name}`
  };
}