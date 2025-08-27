import { FunctionCall } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { designSystem } from '../config/designSystem';

// Types for our tool responses
export interface ReasoningStep {
  id: string;
  timestamp: number;
  transcript: string;
  classification: 'correct' | 'partial' | 'incorrect' | 'exploring';
  concepts: string[];
  confidence: number;
  canvasSnapshot?: string;
}

export interface Misconception {
  id: string;
  timestamp: number;
  type: 'unequal_parts' | 'counting_not_measuring' | 'whole_unclear';
  evidence: string;
  severity: 'minor' | 'major';
}

export interface CanvasAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'underline';
  coordinates: { x: number; y: number }[];
  color: string;
  message?: string;
}

export interface OffTaskEvent {
  id: string;
  timestamp: number;
  observation: string;
  redirectMessage: string;
  problemElement: string;
}

// Store for session data
export const sessionStore = {
  reasoningSteps: [] as ReasoningStep[],
  misconceptions: [] as Misconception[],
  annotations: [] as CanvasAnnotation[],
  celebrations: [] as any[],
  offTaskEvents: [] as OffTaskEvent[]
};

// Tool implementation functions
export const toolImplementations = {
  mark_reasoning_step: async (params: any) => {
    const step: ReasoningStep = {
      id: uuidv4(),
      timestamp: Date.now(),
      transcript: params.transcript,
      classification: params.classification,
      concepts: params.concepts,
      confidence: params.confidence
    };
    
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
      severity: params.severity
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
  
  redirect_to_task: async (params: any) => {
    console.log('Redirecting student back to task:', params);
    
    // Track off-task behavior
    const offTaskEvent: OffTaskEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      observation: params.observation,
      redirectMessage: params.redirect_message,
      problemElement: params.problem_element
    };
    
    sessionStore.offTaskEvents.push(offTaskEvent);
    
    // Emit event for UI feedback (could show gentle animation)
    window.dispatchEvent(new CustomEvent('redirect-to-task', { 
      detail: {
        message: params.redirect_message,
        problemElement: params.problem_element
      }
    }));
    
    return { 
      success: true, 
      redirected: true, 
      message: params.redirect_message 
    };
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