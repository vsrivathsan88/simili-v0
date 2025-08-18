import React, { useState, useRef, useEffect } from 'react';
import './ProblemDisplay.scss';
import { SketchyButton } from './ui/SketchyButton';
import { VisualProblem, getStartingProblem, getNextProblem } from '../data/adaptiveProblems';

interface ProblemDisplayProps {
  onImageUpload: (imageData: string) => void;
  lessonId?: string;
  onProblemChange?: (problem: VisualProblem) => void;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ onImageUpload, lessonId, onProblemChange }) => {
  const [problemImage, setProblemImage] = useState<string | null>(null);
  const [currentProblem, setCurrentProblem] = useState<VisualProblem | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lessonId) {
      const problem = getStartingProblem(lessonId);
      if (problem) {
        setCurrentProblem(problem);
        setAttemptCount(0);
        createProblemImage(problem);
        if (onProblemChange) {
          onProblemChange(problem);
        }
      }
    }
  }, [lessonId, onProblemChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setProblemImage(imageData);
      onImageUpload(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setProblemImage(imageData);
        onImageUpload(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const createProblemImage = (problem: VisualProblem) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#FFFEF7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Visual prompt (large emojis/symbols)
    ctx.font = '72px Arial';
    ctx.fillStyle = '#2D3748';
    ctx.textAlign = 'center';
    ctx.fillText(problem.visualPrompt, canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left';

    // Convert to image
    const imageData = canvas.toDataURL();
    setProblemImage(imageData);
    onImageUpload(imageData);
  };

  const loadNextProblem = (wasSuccessful: boolean = true) => {
    if (currentProblem) {
      const nextProblem = getNextProblem(currentProblem.id, wasSuccessful, attemptCount);
      if (nextProblem) {
        setCurrentProblem(nextProblem);
        setAttemptCount(wasSuccessful ? 0 : attemptCount + 1);
        createProblemImage(nextProblem);
        if (onProblemChange) {
          onProblemChange(nextProblem);
        }
      }
    }
  };

  return (
    <div className="problem-display">
      {!problemImage ? (
        <div 
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="upload-content">
            <span className="upload-icon">📷</span>
            <h3>Add Problem</h3>
            <p>Drop image here</p>
            
            <SketchyButton onClick={triggerFileSelect} variant="primary" size="small">
              Browse
            </SketchyButton>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      ) : (
        <div className="problem-image-container">
          <img 
            src={problemImage} 
            alt="Math problem" 
            className="problem-image"
          />
          <div className="problem-controls">
            <button 
              className="change-image-btn"
              onClick={triggerFileSelect}
              title="Upload custom image"
            >
              📷
            </button>
            {currentProblem && (
              <button 
                className="next-problem-btn"
                onClick={() => loadNextProblem(true)}
                title="Next problem"
              >
                ➡️
              </button>
            )}
          </div>
          {currentProblem && (
            <div className="problem-hint">
              💡 Ask Pi if you need help!
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ProblemDisplay;