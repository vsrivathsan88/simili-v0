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
            <h3>Upload Problem Image</h3>
            <p>Drag & drop or click to upload</p>
            <p className="upload-hint">Take a photo of the problem from a textbook or worksheet</p>
            
            <SketchyButton onClick={triggerFileSelect} variant="primary" size="medium">
              Choose Image
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

      {/* Sample problems for demo */}
      <div className="sample-problems">
        <h4>Or try a sample problem:</h4>
        <div className="sample-grid">
          <button className="sample-btn" onClick={() => {
            setProblemImage('/samples/pizza-fractions.png');
            onImageUpload('/samples/pizza-fractions.png');
          }}>
            🍕 Pizza Fractions
          </button>
          <button className="sample-btn" onClick={() => {
            setProblemImage('/samples/word-problem.png');
            onImageUpload('/samples/word-problem.png');
          }}>
            📝 Word Problem
          </button>
          <button className="sample-btn" onClick={() => {
            setProblemImage('/samples/multiplication.png');
            onImageUpload('/samples/multiplication.png');
          }}>
            ✖️ Multiplication
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemDisplay;