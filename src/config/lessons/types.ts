/**
 * Lesson Configuration Types
 * 
 * Defines the structure for AI-controlled lesson slides and configurations
 * Based on AI_LESSON_CONTROLLER_SYSTEM_GUIDE.md specifications
 */

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

// Helper type for slide advancement events
export interface SlideAdvancementEvent {
  currentSlide: number;
  nextSlide: number;
  masteryEvidence: string;
}

// Type for lesson loading result
export interface LessonLoadResult {
  success: boolean;
  config?: LessonConfig;
  error?: string;
}