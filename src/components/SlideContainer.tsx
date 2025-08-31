import React, { useState, useEffect, useCallback } from 'react';
import SlideDisplay from './SlideDisplay';
import { LessonConfig, LessonSlide } from '../config/lessons/types';
import { getSlideByNumber } from '../config/lessons/index';
import { currentLessonContext } from '../lib/toolImplementations';
import './SlideContainer.scss';

interface SlideContainerProps {
  lessonConfig: LessonConfig | null;
  onSlideChange?: (slide: LessonSlide | null, slideNumber: number) => void;
  initialSlideNumber?: number;
  currentSlideNumber?: number;
}

const SlideContainer: React.FC<SlideContainerProps> = ({
  lessonConfig,
  onSlideChange,
  initialSlideNumber = 1,
  currentSlideNumber
}) => {
  const [currentSlide, setCurrentSlide] = useState<LessonSlide | null>(null);

  // Use prop currentSlideNumber if provided, otherwise use initialSlideNumber
  const effectiveSlideNumber = currentSlideNumber ?? initialSlideNumber;

  // Update current slide when lesson config or slide number changes
  useEffect(() => {
    if (lessonConfig) {
      const slide = getSlideByNumber(lessonConfig, effectiveSlideNumber);
      setCurrentSlide(slide);
      
      // Update global lesson context for tool implementations
      if (slide) {
        currentLessonContext.setLessonContext(
          lessonConfig.lessonId,
          slide.slide_number,
          slide.name
        );
      }
      
      // Notify parent component of slide change
      if (onSlideChange) {
        onSlideChange(slide, effectiveSlideNumber);
      }
      
      console.log(`📚 Slide changed to: ${slide?.name || 'Not found'} (${effectiveSlideNumber})`);
    } else {
      setCurrentSlide(null);
    }
  }, [lessonConfig, effectiveSlideNumber, onSlideChange]);

  // Listen for slide advancement events from AI
  const handleSlideAdvancement = useCallback((event: CustomEvent) => {
    const { nextSlide, masteryEvidence } = event.detail;
    
    console.log(`🚀 Received slide advancement event: ${effectiveSlideNumber} -> ${nextSlide}`);
    console.log(`📋 Evidence: ${masteryEvidence}`);
    
    // Only advance if it's a valid progression - but let the parent handle the actual advancement
    if (lessonConfig && nextSlide > effectiveSlideNumber) {
      const targetSlide = getSlideByNumber(lessonConfig, nextSlide);
      if (targetSlide) {
        console.log(`✅ Valid slide advancement: ${effectiveSlideNumber} -> ${nextSlide}`);
        // The parent App component will handle the actual slide change via the event listener
      } else {
        console.warn(`Invalid slide number for advancement: ${nextSlide}`);
      }
    } else {
      console.warn(`Invalid slide advancement: ${effectiveSlideNumber} -> ${nextSlide}`);
    }
  }, [effectiveSlideNumber, lessonConfig]);

  // Set up event listener for slide advancements
  useEffect(() => {
    window.addEventListener('advance-slide', handleSlideAdvancement as EventListener);
    
    return () => {
      window.removeEventListener('advance-slide', handleSlideAdvancement as EventListener);
    };
  }, [handleSlideAdvancement]);

  // Manual slide navigation (for testing/debugging)
  const goToSlide = useCallback((slideNumber: number) => {
    if (lessonConfig && onSlideChange) {
      const targetSlide = getSlideByNumber(lessonConfig, slideNumber);
      if (targetSlide) {
        console.log(`🔧 Manual slide navigation: ${effectiveSlideNumber} -> ${slideNumber}`);
        onSlideChange(targetSlide, slideNumber); // Notify parent to update slide
      }
    }
  }, [lessonConfig, onSlideChange, effectiveSlideNumber]);

  // Development helper: Expose slide navigation to window for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).goToSlide = goToSlide;
      (window as any).getCurrentSlide = () => ({
        slideNumber: effectiveSlideNumber,
        slide: currentSlide,
        lesson: lessonConfig?.lessonId
      });
    }
  }, [goToSlide, effectiveSlideNumber, currentSlide, lessonConfig]);

  return (
    <div className="slide-container">
      <SlideDisplay
        slide={currentSlide}
        lessonId={lessonConfig?.lessonId}
        onSlideComplete={() => {
          // This could trigger additional actions when a slide is "complete"
          console.log(`Slide ${effectiveSlideNumber} marked as complete`);
        }}
      />
      
      {/* Development Navigation (only in dev mode) */}
      {process.env.NODE_ENV === 'development' && lessonConfig && (
        <div className="slide-dev-nav">
          <div className="dev-nav-header">
            🧪 Dev Navigation - Lesson: {lessonConfig.lessonId}
          </div>
          <div className="dev-nav-buttons">
            {lessonConfig.slides.map((slide) => (
              <button
                key={slide.slide_number}
                className={`dev-nav-btn ${
                  slide.slide_number === effectiveSlideNumber ? 'active' : ''
                }`}
                onClick={() => goToSlide(slide.slide_number)}
                disabled={false}
              >
                {slide.slide_number}
              </button>
            ))}
          </div>
          <div className="dev-nav-info">
            Current: Slide {effectiveSlideNumber} - {currentSlide?.name || 'Unknown'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideContainer;