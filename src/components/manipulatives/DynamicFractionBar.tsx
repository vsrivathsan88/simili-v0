import React, { useState } from 'react';
import rough from 'roughjs';
import './DynamicFractionBar.scss';

interface DynamicFractionBarProps {
  parts: number;
  shaded: number;
  onChange: (data: { parts: number; shaded: number }) => void;
}

const DynamicFractionBar: React.FC<DynamicFractionBarProps> = ({ 
  parts, 
  shaded, 
  onChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const width = 200;
  const height = 60;
  const partWidth = width / parts;

  const handlePartClick = (index: number) => {
    if (!isEditing) {
      const newShaded = index + 1;
      onChange({ parts, shaded: newShaded === shaded ? 0 : newShaded });
    }
  };

  const adjustParts = (delta: number) => {
    const newParts = Math.max(1, Math.min(12, parts + delta));
    const newShaded = Math.min(shaded, newParts);
    onChange({ parts: newParts, shaded: newShaded });
  };

  return (
    <div className="dynamic-fraction-bar">
      <div className="fraction-controls">
        <button 
          className="control-button"
          onClick={() => setIsEditing(!isEditing)}
          title="Edit fraction bar"
        >
          ⚙️
        </button>
        {isEditing && (
          <div className="edit-controls">
            <button onClick={() => adjustParts(-1)}>−</button>
            <span>{parts} parts</span>
            <button onClick={() => adjustParts(1)}>+</button>
          </div>
        )}
      </div>
      
      <svg width={width} height={height}>
        {/* Draw the whole bar outline */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="none"
          stroke="#333"
          strokeWidth={2}
        />
        
        {/* Draw each part */}
        {Array.from({ length: parts }).map((_, i) => (
          <g key={i} onClick={() => handlePartClick(i)}>
            <rect
              x={i * partWidth}
              y={0}
              width={partWidth}
              height={height}
              fill={i < shaded ? '#4a90e2' : 'white'}
              stroke="#333"
              strokeWidth={1}
              className="fraction-part"
              style={{ cursor: 'pointer' }}
            />
            {/* Add rough.js style hatching for shaded parts */}
            {i < shaded && (
              <path
                d={createHatchPattern(i * partWidth, 0, partWidth, height)}
                stroke="#2a5fb4"
                strokeWidth={0.5}
                fill="none"
              />
            )}
          </g>
        ))}
      </svg>
      
      <div className="fraction-label">
        {shaded}/{parts}
      </div>
    </div>
  );
};

// Create hand-drawn style hatching
const createHatchPattern = (x: number, y: number, w: number, h: number): string => {
  const lines: string[] = [];
  const spacing = 6;
  
  for (let i = 0; i < w + h; i += spacing) {
    const x1 = x + Math.max(0, i - h);
    const y1 = y + Math.max(0, h - i);
    const x2 = x + Math.min(w, i);
    const y2 = y + Math.min(h, i);
    
    // Add slight randomness for hand-drawn effect
    const wobble = () => (Math.random() - 0.5) * 1;
    lines.push(`M ${x1 + wobble()} ${y1 + wobble()} L ${x2 + wobble()} ${y2 + wobble()}`);
  }
  
  return lines.join(' ');
};

export default DynamicFractionBar;