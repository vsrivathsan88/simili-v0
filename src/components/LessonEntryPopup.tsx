import React, { useState, useEffect } from 'react';
import './LessonEntryPopup.scss';

interface LessonEntryPopupProps {
  isOpen: boolean;
  adventureTitle: string;
  adventureDescription: string;
  onStart: () => void;
  onCancel: () => void;
}

const LessonEntryPopup: React.FC<LessonEntryPopupProps> = ({
  isOpen,
  adventureTitle,
  adventureDescription,
  onStart,
  onCancel
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const piMessages = [
    "Hi there! I'm Pi, your adventure buddy!",
    "I love talking and listening just like you do!",
    "Can you put on some headphones?",
    "Feel free to talk to me naturally - tell me your thoughts, ask questions, think out loud!",
    "I'll be right here listening. Ready for an awesome adventure?"
  ];

  // Progressive message reveal
  useEffect(() => {
    if (!isOpen) return;

    const messageTimer = setTimeout(() => {
      if (currentMessage < piMessages.length - 1) {
        setCurrentMessage(prev => prev + 1);
      } else {
        setShowButton(true);
      }
    }, 2500); // Each message shows for 2.5 seconds

    return () => clearTimeout(messageTimer);
  }, [isOpen, currentMessage, piMessages.length]);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setCurrentMessage(0);
      setShowButton(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="lesson-entry-overlay">
      <div className="lesson-entry-backdrop" onClick={onCancel} />

      <div className="lesson-entry-popup voice-first">
        {/* Pi Avatar Section */}
        <div className="pi-welcome-section">
          <div className="pi-avatar-large">
            <img
              src={currentMessage === 2 ? "/assets/pi-intro-headphones.png" : "/assets/pi-intro-waving.png"}
              alt="Pi"
              className={`pi-image ${isHovering ? 'excited' : 'talking'}`}
            />
          </div>

          {/* Voice indicator */}
          <div className="voice-indicator active">
            <div className="voice-pulse"></div>
          </div>
        </div>

        {/* Content Section */}
        <div className="popup-content">
          <div className="adventure-preview">
            <h3 className="adventure-title">{adventureTitle}</h3>
            <p className="adventure-description">{adventureDescription}</p>
          </div>

          {/* Pi's progressive messages */}
          <div className="pi-speech-bubble">
            <p className="pi-message">{piMessages[currentMessage]}</p>
          </div>

          {currentMessage === 2 && (
            <div className="headphones-reminder">
              <img src="/assets/headphones-icon.png" alt="Headphones" className="headphones-icon" />
              <span>Headphones help me hear you better!</span>
            </div>
          )}

          {showButton && (
            <button
              className="start-adventure-btn voice-ready"
              onClick={onStart}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <span className="btn-text">I'm ready, Pi!</span>
              <span className="btn-icon">🎤</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonEntryPopup;