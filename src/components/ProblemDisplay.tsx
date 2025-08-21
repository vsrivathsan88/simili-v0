import React, { useState, useRef } from 'react';
import './ProblemDisplay.scss';
import { SketchyButton } from './ui/SketchyButton';

interface ProblemDisplayProps {
  onImageUpload: (imageData: string) => void;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ onImageUpload }) => {
  const [problemImage, setProblemImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <button 
            className="change-image-btn"
            onClick={triggerFileSelect}
            title="Change image"
          >
            📷
          </button>
        </div>
      )}

    </div>
  );
};

export default ProblemDisplay;