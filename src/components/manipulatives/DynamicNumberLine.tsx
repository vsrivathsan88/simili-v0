import React, { useState } from 'react';
import './DynamicNumberLine.scss';

interface DynamicNumberLineProps {
  min: number;
  max: number;
  marks: number[];
  onChange: (data: { min: number; max: number; marks: number[] }) => void;
}

const DynamicNumberLine: React.FC<DynamicNumberLineProps> = ({ 
  min, 
  max, 
  marks, 
  onChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingMark, setIsDraggingMark] = useState<number | null>(null);
  const width = 400;
  const height = 80;
  const lineY = height / 2;
  const scale = width / (max - min);

  const handleLineClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isEditing || isDraggingMark !== null) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const value = Math.round(min + (x / width) * (max - min));
    
    if (!marks.includes(value)) {
      onChange({ min, max, marks: [...marks, value].sort((a, b) => a - b) });
    }
  };

  const handleMarkDrag = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingMark(index);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingMark === null) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const value = Math.round(min + (x / width) * (max - min));
    
    const newMarks = [...marks];
    newMarks[isDraggingMark] = Math.max(min, Math.min(max, value));
    onChange({ min, max, marks: newMarks.sort((a, b) => a - b) });
  };

  const handleMouseUp = () => {
    setIsDraggingMark(null);
  };

  const removeMark = (index: number) => {
    const newMarks = marks.filter((_, i) => i !== index);
    onChange({ min, max, marks: newMarks });
  };

  const adjustRange = (field: 'min' | 'max', delta: number) => {
    if (field === 'min') {
      const newMin = min + delta;
      if (newMin < max) {
        onChange({ min: newMin, max, marks: marks.filter(m => m >= newMin) });
      }
    } else {
      const newMax = max + delta;
      if (newMax > min) {
        onChange({ min, max: newMax, marks: marks.filter(m => m <= newMax) });
      }
    }
  };

  return (
    <div className="dynamic-number-line">
      <div className="number-line-controls">
        <button 
          className="control-button"
          onClick={() => setIsEditing(!isEditing)}
          title="Edit number line"
        >
          ⚙️
        </button>
        {isEditing && (
          <div className="edit-controls">
            <div className="range-control">
              <button onClick={() => adjustRange('min', -1)}>−</button>
              <span>Min: {min}</span>
              <button onClick={() => adjustRange('min', 1)}>+</button>
            </div>
            <div className="range-control">
              <button onClick={() => adjustRange('max', -1)}>−</button>
              <span>Max: {max}</span>
              <button onClick={() => adjustRange('max', 1)}>+</button>
            </div>
          </div>
        )}
      </div>
      
      <svg 
        width={width} 
        height={height}
        onClick={handleLineClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDraggingMark !== null ? 'grabbing' : 'pointer' }}
      >
        {/* Main line */}
        <line
          x1={0}
          y1={lineY}
          x2={width}
          y2={lineY}
          stroke="#333"
          strokeWidth={3}
        />
        
        {/* Tick marks for each integer */}
        {Array.from({ length: max - min + 1 }).map((_, i) => {
          const value = min + i;
          const x = i * scale;
          return (
            <g key={value}>
              <line
                x1={x}
                y1={lineY - 10}
                x2={x}
                y2={lineY + 10}
                stroke="#333"
                strokeWidth={2}
              />
              <text
                x={x}
                y={lineY + 25}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
              >
                {value}
              </text>
            </g>
          );
        })}
        
        {/* User marks */}
        {marks.map((mark, index) => {
          const x = (mark - min) * scale;
          return (
            <g key={`mark-${index}`}>
              <circle
                cx={x}
                cy={lineY}
                r={8}
                fill="#ff6b6b"
                stroke="#333"
                strokeWidth={2}
                onMouseDown={(e) => handleMarkDrag(index, e)}
                style={{ cursor: 'grab' }}
              />
              {isEditing && (
                <text
                  x={x}
                  y={lineY - 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#ff6b6b"
                  onClick={() => removeMark(index)}
                  style={{ cursor: 'pointer' }}
                >
                  ✕
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {!isEditing && (
        <div className="number-line-hint">
          Click to add marks • Drag marks to move
        </div>
      )}
    </div>
  );
};

export default DynamicNumberLine;