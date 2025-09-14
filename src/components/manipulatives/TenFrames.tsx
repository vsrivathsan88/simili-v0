import React, { useState } from 'react';
import './TenFrames.scss';

interface TenFramesProps {
  frames?: number;
  filled?: number;
  onChange: (data: { frames: number; filled: number; value: number }) => void;
}

const TenFrames: React.FC<TenFramesProps> = ({ 
  frames = 2,
  filled = 5,
  onChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const adjustFrames = (delta: number) => {
    const newFrames = Math.max(1, Math.min(5, frames + delta));
    const maxFilled = newFrames * 10;
    const newFilled = Math.min(filled, maxFilled);
    onChange({ 
      frames: newFrames, 
      filled: newFilled,
      value: newFilled 
    });
  };

  const adjustFilled = (delta: number) => {
    const maxFilled = frames * 10;
    const newFilled = Math.max(0, Math.min(maxFilled, filled + delta));
    onChange({ 
      frames, 
      filled: newFilled,
      value: newFilled 
    });
  };

  const toggleDot = (frameIndex: number, dotIndex: number) => {
    const globalDotIndex = frameIndex * 10 + dotIndex;
    
    if (globalDotIndex < filled) {
      // Clicking on a filled dot - remove dots from this position to the end
      onChange({ 
        frames, 
        filled: globalDotIndex,
        value: globalDotIndex 
      });
    } else if (globalDotIndex === filled) {
      // Clicking on the first empty dot - add one
      onChange({ 
        frames, 
        filled: filled + 1,
        value: filled + 1 
      });
    }
  };

  const renderFrame = (frameIndex: number) => {
    const startDot = frameIndex * 10;
    
    return (
      <div key={frameIndex} className="ten-frame">
        <div className="frame-number">{frameIndex + 1}</div>
        <div className="frame-grid">
          {Array.from({ length: 10 }).map((_, dotIndex) => {
            const globalDotIndex = startDot + dotIndex;
            const isFilled = globalDotIndex < filled;
            
            return (
              <div
                key={dotIndex}
                className={`frame-cell ${isFilled ? 'filled' : 'empty'}`}
                onClick={() => toggleDot(frameIndex, dotIndex)}
              >
                {isFilled && <div className="dot" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="ten-frames">
      <div className="ten-frames-controls">
        <button 
          className="control-button"
          onClick={() => setIsEditing(!isEditing)}
          title="Edit ten frames"
        >
          ⚙️
        </button>
        {isEditing && (
          <div className="edit-controls">
            <div className="value-control">
              <label>Frames:</label>
              <button onClick={() => adjustFrames(-1)}>−</button>
              <span>{frames}</span>
              <button onClick={() => adjustFrames(1)}>+</button>
            </div>
            <div className="value-control">
              <label>Filled:</label>
              <button onClick={() => adjustFilled(-1)}>−</button>
              <span>{filled}</span>
              <button onClick={() => adjustFilled(1)}>+</button>
            </div>
          </div>
        )}
      </div>

      <div className="frames-container">
        {Array.from({ length: frames }).map((_, i) => renderFrame(i))}
      </div>

      <div className="ten-frames-summary">
        <div className="value-display">
          <strong>{filled}</strong>
          {filled !== frames * 10 && (
            <span className="remaining"> ({frames * 10 - filled} empty)</span>
          )}
        </div>
        {frames > 1 && (
          <div className="breakdown">
            {Array.from({ length: frames }).map((_, i) => {
              const frameStart = i * 10;
              const frameEnd = frameStart + 10;
              const frameFilled = Math.max(0, Math.min(10, filled - frameStart));
              return (
                <div key={i} className="frame-summary">
                  Frame {i + 1}: {frameFilled}/10
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenFrames;