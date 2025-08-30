/**
 * Lesson Configuration Utilities
 * 
 * Provides functions for loading lesson configurations and generating
 * AI system instruction context for lesson-aware behavior
 */

import { LessonConfig, LessonSlide, LessonLoadResult } from './types';

/**
 * Load a lesson configuration from JSON file
 * @param lessonId - The lesson identifier (e.g., 'intro-fractions')
 * @returns Promise<LessonLoadResult> - The loaded lesson configuration
 */
export async function loadLessonConfig(lessonId: string): Promise<LessonLoadResult> {
  try {
    // Import the lesson JSON file
    const lessonModule = await import(`./${lessonId}.json`);
    const slides: LessonSlide[] = lessonModule.default || lessonModule;
    
    // Validate basic structure
    if (!Array.isArray(slides) || slides.length === 0) {
      return {
        success: false,
        error: `Invalid lesson structure for ${lessonId}: expected array of slides`
      };
    }
    
    // Validate each slide has required properties
    for (const slide of slides) {
      if (!slide.slide_number || !slide.name || !slide.advance_to_next_slide_criteria) {
        return {
          success: false,
          error: `Invalid slide structure in ${lessonId}: missing required properties`
        };
      }
    }
    
    const config: LessonConfig = {
      lessonId,
      slides: slides.sort((a, b) => a.slide_number - b.slide_number) // Ensure slides are in order
    };
    
    return {
      success: true,
      config
    };
  } catch (error) {
    console.error(`Failed to load lesson ${lessonId}:`, error);
    return {
      success: false,
      error: `Failed to load lesson ${lessonId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate lesson-specific context to append to Pi's system instruction
 * This provides the AI with detailed information about the current lesson structure
 * @param lessonConfig - The lesson configuration
 * @param currentSlideNumber - The currently active slide number (optional)
 * @returns string - Formatted lesson context for AI system instruction
 */
export function generateLessonContext(lessonConfig: LessonConfig, currentSlideNumber?: number): string {
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
- Eliciting Questions: ${slide.ai_focus.eliciting_questions || 'None specified'}
- Potential Misconceptions: ${Array.isArray(slide.ai_focus.potential_misconceptions) 
    ? slide.ai_focus.potential_misconceptions.join('; ') 
    : slide.ai_focus.potential_misconceptions || 'None specified'}
- Advance Criteria: ${slide.advance_to_next_slide_criteria}
`).join('')}

CURRENT SLIDE FOCUS:
${currentSlideNumber ? (() => {
  const currentSlide = slides.find(s => s.slide_number === currentSlideNumber);
  if (!currentSlide) return `You are starting the lesson.`;
  
  return `You are currently on SLIDE ${currentSlide.slide_number}: ${currentSlide.name}
- YOUR FOCUS: ${currentSlide.ai_focus.eliciting_questions || 'Engage with student'}
- ADVANCEMENT CRITERIA: ${currentSlide.advance_to_next_slide_criteria}
- WATCH FOR: ${Array.isArray(currentSlide.ai_focus.potential_misconceptions) 
    ? currentSlide.ai_focus.potential_misconceptions.join(', ') 
    : currentSlide.ai_focus.potential_misconceptions || 'No specific misconceptions'}

CRITICAL: Listen for student responses that match "${currentSlide.advance_to_next_slide_criteria}" then IMMEDIATELY call advance_slide tool.`;
})() : `You are starting the lesson. Begin with slide 1.`}

LESSON FLOW INSTRUCTIONS:
1. START with slide 1 and progress sequentially
2. DO NOT advance until current slide's criteria is met
3. Use the eliciting_questions and guidance_prompts for each slide
4. Watch for the potential_misconceptions listed
5. CRITICAL: When advance criteria is met, call advance_slide tool
6. ALWAYS call advance_slide tool when moving - this updates visual display

SLIDE ADVANCEMENT RULES:
- Monitor student responses for specific evidence that meets advancement criteria
- Collect concrete evidence before advancing (direct quotes, observations)
- Call advance_slide tool with current_slide, next_slide, and mastery_evidence
- Never verbally move to new slide content without calling the tool first
`;
}

/**
 * Get a specific slide by number from a lesson config
 * @param lessonConfig - The lesson configuration
 * @param slideNumber - The slide number to retrieve
 * @returns LessonSlide | null - The slide or null if not found
 */
export function getSlideByNumber(lessonConfig: LessonConfig | null, slideNumber: number): LessonSlide | null {
  if (!lessonConfig) return null;
  return lessonConfig.slides.find(slide => slide.slide_number === slideNumber) || null;
}

/**
 * Get the first slide of a lesson (typically slide 1)
 * @param lessonConfig - The lesson configuration
 * @returns LessonSlide | null - The first slide or null if no slides
 */
export function getFirstSlide(lessonConfig: LessonConfig): LessonSlide | null {
  if (!lessonConfig.slides.length) return null;
  return lessonConfig.slides[0];
}

/**
 * Get the next slide number after the current one
 * @param lessonConfig - The lesson configuration
 * @param currentSlideNumber - The current slide number
 * @returns number | null - The next slide number or null if at end
 */
export function getNextSlideNumber(lessonConfig: LessonConfig, currentSlideNumber: number): number | null {
  const currentIndex = lessonConfig.slides.findIndex(slide => slide.slide_number === currentSlideNumber);
  if (currentIndex === -1 || currentIndex >= lessonConfig.slides.length - 1) {
    return null; // Not found or at last slide
  }
  return lessonConfig.slides[currentIndex + 1].slide_number;
}

/**
 * Validate that a lesson configuration is complete and valid
 * @param lessonConfig - The lesson configuration to validate
 * @returns { valid: boolean; errors: string[] } - Validation result
 */
export function validateLessonConfig(lessonConfig: LessonConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!lessonConfig.lessonId) {
    errors.push('Missing lessonId');
  }
  
  if (!lessonConfig.slides || lessonConfig.slides.length === 0) {
    errors.push('No slides defined');
    return { valid: false, errors };
  }
  
  // Check for sequential slide numbers starting from 1
  const slideNumbers = lessonConfig.slides.map(s => s.slide_number).sort((a, b) => a - b);
  for (let i = 0; i < slideNumbers.length; i++) {
    if (slideNumbers[i] !== i + 1) {
      errors.push(`Slide numbers must be sequential starting from 1. Missing slide ${i + 1}`);
      break;
    }
  }
  
  // Validate each slide
  lessonConfig.slides.forEach((slide, index) => {
    const slidePrefix = `Slide ${slide.slide_number}`;
    
    if (!slide.name) errors.push(`${slidePrefix}: Missing name`);
    if (!slide.state_trigger) errors.push(`${slidePrefix}: Missing state_trigger`);
    if (!slide.advance_to_next_slide_criteria) errors.push(`${slidePrefix}: Missing advance_to_next_slide_criteria`);
    if (!slide.keywords || slide.keywords.length === 0) errors.push(`${slidePrefix}: Missing keywords`);
    if (!slide.description) errors.push(`${slidePrefix}: Missing description`);
    if (!slide.use_cases || slide.use_cases.length === 0) errors.push(`${slidePrefix}: Missing use_cases`);
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}