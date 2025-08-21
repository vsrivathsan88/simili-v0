import React, { useState } from 'react';
import './GameFractionBar.scss';

interface GameFractionBarProps {
  parts: number;
  shaded: number;
  onChange: (data: { parts: number; shaded: number }) => void;
}

const GameFractionBar: React.FC<GameFractionBarProps> = ({ 
  parts, 
  shaded, 
  onChange 
}) => {
  const [hoveredPart, setHoveredPart] = useState<number | null>(null);
  
  const handlePartClick = (index: number) => {
    // Toggle shading up to clicked part
    if (index + 1 === shaded) {
      onChange({ parts, shaded: 0 });
    } else {
      onChange({ parts, shaded: index + 1 });
    }
  };

  const addPart = () => {
    if (parts < 12) {
      onChange({ parts: parts + 1, shaded: Math.min(shaded, parts + 1) });
    }
  };

  const removePart = () => {
    if (parts > 1) {
      onChange({ parts: parts - 1, shaded: Math.min(shaded, parts - 1) });
    }
  };

  const width = 280;
  const height = 80;
  const partWidth = width / parts;

  return (
    <div className="game-fraction-bar">
      {/* Top controls with clear +/- buttons */}
      <div className="fraction-controls">
        <button 
          className="control-btn remove"
          onClick={removePart}
          disabled={parts <= 1}
          title="Remove a part"
        >
          <span className="icon">−</span>
          <span className="label">Less parts</span>
        </button>
        
        <div className="fraction-display">
          <span className="numerator">{shaded}</span>
          <span className="divider"></span>
          <span className="denominator">{parts}</span>
        </div>
        
        <button 
          className="control-btn add"
          onClick={addPart}
          disabled={parts >= 12}
          title="Add a part"
        >
          <span className="icon">+</span>
          <span className="label">More parts</span>
        </button>
      </div>

      {/* Interactive fraction bar */}
      <div className="bar-container">
        <svg 
          width={width} 
          height={height}
          className="fraction-svg"
        >
          {/* Background */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#f0f0f0"
            stroke="#333"
            strokeWidth={3}
            rx={4}
          />
          
          {/* Parts */}
          {Array.from({ length: parts }).map((_, i) => (
            <g key={i}>
              {/* Shaded part */}
              {i < shaded && (
                <rect
                  x={i * partWidth + 2}
                  y={2}
                  width={partWidth - 4}
                  height={height - 4}
                  fill="#4a90e2"
                  className="shaded-part"
                />
              )}
              
              {/* Interactive overlay */}
              <rect
                x={i * partWidth}
                y={0}
                width={partWidth}
                height={height}
                fill="transparent"
                stroke="#333"
                strokeWidth={1}
                className={`part-overlay ${hoveredPart === i ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredPart(i)}
                onMouseLeave={() => setHoveredPart(null)}
                onClick={() => handlePartClick(i)}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Part number (on hover) */}
              {hoveredPart === i && (
                <text
                  x={i * partWidth + partWidth / 2}
                  y={height / 2 + 5}
                  textAnchor="middle"
                  className="part-number"
                  pointerEvents="none"
                >
                  {i + 1}
                </text>
              )}
            </g>
          ))}
          
          {/* Division lines */}
          {Array.from({ length: parts - 1 }).map((_, i) => (
            <line
              key={`line-${i}`}
              x1={(i + 1) * partWidth}
              y1={0}
              x2={(i + 1) * partWidth}
              y2={height}
              stroke="#333"
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>

      {/* Helper text */}
      <div className="helper-text">
        Click parts to shade • {shaded} out of {parts} parts shaded
      </div>
    </div>
  );
};

export default GameFractionBar;