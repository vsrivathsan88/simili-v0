import React, { useState } from 'react';
import './LessonEntryPopup.scss';

interface LessonEntryPopupProps {
  isOpen: boolean;
  lessonTitle: string;
  onStart: () => void;
  onCancel: () => void;
}

const LessonEntryPopup: React.FC<LessonEntryPopupProps> = ({
  isOpen,
  lessonTitle,
  onStart,
  onCancel
}) => {
  const [isHovering, setIsHovering] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="lesson-entry-overlay">
      <div className="lesson-entry-backdrop" onClick={onCancel} />
      
      <div className="lesson-entry-popup">
        {/* Pi Avatar Section */}
        <div className="pi-welcome-section">
          <div className="pi-avatar-large">
            <img 
              src="/assets/pi-character.png" 
              alt="Pi" 
              className={`pi-image ${isHovering ? 'excited' : 'waving'}`}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="popup-content">
          <h2 className="welcome-title">
            <span className="lesson-name">{lessonTitle}</span>
          </h2>
          
          <div className="mic-hint">
            <span className="mic-icon">🎤</span>
            <span>Talk out loud!</span>
          </div>

          <button 
            className="start-adventure-btn"
            onClick={onStart}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span className="btn-text">Start with Pi</span>
            <span className="btn-icon">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonEntryPopup;