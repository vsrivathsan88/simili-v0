import React, { useState, useEffect } from 'react';
import { LessonSlide } from '../config/lessons/types';
import './SlideDisplay.scss';

interface SlideDisplayProps {
  slide: LessonSlide | null;
  onSlideComplete?: () => void;
  lessonId?: string;
}

const SlideDisplay: React.FC<SlideDisplayProps> = ({ 
  slide, 
  onSlideComplete,
  lessonId 
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image states when slide changes
  useEffect(() => {
    setIsImageLoaded(false);
    setImageError(false);
  }, [slide?.id]);

  // Handle image load success
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsImageLoaded(false);
    setImageError(true);
    console.warn(`Failed to load image for slide ${slide?.slide_number}: ${slide?.image_path}`);
  };

  // If no slide provided, show placeholder
  if (!slide) {
    return (
      <div className="slide-display slide-display--loading">
        <div className="slide-placeholder">
          <div className="slide-placeholder__icon">📚</div>
          <div className="slide-placeholder__text">Loading lesson...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-display" data-slide-number={slide.slide_number}>
      {/* Slide Header */}
      <div className="slide-display__header">
        <div className="slide-display__meta">
          <span className="slide-display__number">
            Slide {slide.slide_number}
          </span>
          {lessonId && (
            <span className="slide-display__lesson">
              {lessonId.replace(/-/g, ' ')}
            </span>
          )}
        </div>
        <h3 className="slide-display__title">
          {slide.name.replace(/_/g, ' ')}
        </h3>
      </div>

      {/* Slide Content */}
      <div className="slide-display__content">
        {/* Slide Image */}
        {slide.image_path && (
          <div className="slide-display__image-container">
            {!isImageLoaded && !imageError && (
              <div className="slide-display__image-loading">
                <div className="loading-spinner"></div>
                <span>Loading image...</span>
              </div>
            )}
            
            {imageError && (
              <div className="slide-display__image-error">
                <div className="error-icon">🖼️</div>
                <span>Image not found</span>
                <small>{slide.image_path}</small>
              </div>
            )}
            
            <img
              src={slide.image_path}
              alt={`Slide ${slide.slide_number}: ${slide.name}`}
              className={`slide-display__image ${isImageLoaded ? 'loaded' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageError ? 'none' : 'block' }}
            />
          </div>
        )}
        
        {/* Slide Text Content */}
        <div className="slide-display__text">
          {slide.description && (
            <div className="slide-display__description">
              {slide.description}
            </div>
          )}
          
          {/* AI Focus Information (for debugging - can be hidden in production) */}
          {process.env.NODE_ENV === 'development' && slide.ai_focus.goal && (
            <div className="slide-display__debug">
              <details className="debug-details">
                <summary>🤖 AI Goal</summary>
                <p>{slide.ai_focus.goal}</p>
                {slide.advance_to_next_slide_criteria && (
                  <div className="debug-criteria">
                    <strong>Advance Criteria:</strong> {slide.advance_to_next_slide_criteria}
                  </div>
                )}
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Slide Metadata */}
      <div className="slide-display__footer">
        {slide.keywords && slide.keywords.length > 0 && (
          <div className="slide-display__keywords">
            {slide.keywords.map((keyword, index) => (
              <span key={index} className="keyword-tag">
                {keyword}
              </span>
            ))}
          </div>
        )}
        
        {/* Slide Progress Indicator */}
        <div className="slide-display__progress">
          <div className="progress-indicator">
            <span className="progress-text">Exploring...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideDisplay;