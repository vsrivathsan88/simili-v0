import React, { useState } from 'react';
import './BaseBlocks.scss';

interface BaseBlocksProps {
  hundreds: number;
  tens: number;
  ones: number;
  onChange: (data: { hundreds: number; tens: number; ones: number }) => void;
}

const BaseBlocks: React.FC<BaseBlocksProps> = ({ 
  hundreds, 
  tens, 
  ones, 
  onChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const blockSize = 20;
  const gap = 5;

  const adjustValue = (type: 'hundreds' | 'tens' | 'ones', delta: number) => {
    const newValues = { hundreds, tens, ones };
    newValues[type] = Math.max(0, Math.min(9, newValues[type] + delta));
    onChange(newValues);
  };

  const drawHundredBlock = (x: number, y: number) => (
    <g key={`hundred-${x}-${y}`}>
      <rect
        x={x}
        y={y}
        width={blockSize * 10}
        height={blockSize * 10}
        fill="#4a90e2"
        stroke="#2a5fb4"
        strokeWidth={2}
      />
      {/* Draw grid lines */}
      {Array.from({ length: 9 }).map((_, i) => (
        <g key={i}>
          <line
            x1={x + (i + 1) * blockSize}
            y1={y}
            x2={x + (i + 1) * blockSize}
            y2={y + blockSize * 10}
            stroke="#2a5fb4"
            strokeWidth={0.5}
          />
          <line
            x1={x}
            y1={y + (i + 1) * blockSize}
            x2={x + blockSize * 10}
            y2={y + (i + 1) * blockSize}
            stroke="#2a5fb4"
            strokeWidth={0.5}
          />
        </g>
      ))}
    </g>
  );

  const drawTenBlock = (x: number, y: number) => (
    <g key={`ten-${x}-${y}`}>
      <rect
        x={x}
        y={y}
        width={blockSize}
        height={blockSize * 10}
        fill="#66cc66"
        stroke="#339933"
        strokeWidth={2}
      />
      {/* Draw unit lines */}
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={i}
          x1={x}
          y1={y + (i + 1) * blockSize}
          x2={x + blockSize}
          y2={y + (i + 1) * blockSize}
          stroke="#339933"
          strokeWidth={0.5}
        />
      ))}
    </g>
  );

  const drawOneBlock = (x: number, y: number) => (
    <rect
      key={`one-${x}-${y}`}
      x={x}
      y={y}
      width={blockSize}
      height={blockSize}
      fill="#ff9966"
      stroke="#cc6633"
      strokeWidth={2}
      rx={2}
    />
  );

  const totalValue = hundreds * 100 + tens * 10 + ones;

  return (
    <div className="base-blocks">
      <div className="base-blocks-controls">
        <button 
          className="control-button"
          onClick={() => setIsEditing(!isEditing)}
          title="Edit blocks"
        >
          ⚙️
        </button>
        {isEditing && (
          <div className="edit-controls">
            <div className="value-control">
              <button onClick={() => adjustValue('hundreds', -1)}>−</button>
              <span>{hundreds}H</span>
              <button onClick={() => adjustValue('hundreds', 1)}>+</button>
            </div>
            <div className="value-control">
              <button onClick={() => adjustValue('tens', -1)}>−</button>
              <span>{tens}T</span>
              <button onClick={() => adjustValue('tens', 1)}>+</button>
            </div>
            <div className="value-control">
              <button onClick={() => adjustValue('ones', -1)}>−</button>
              <span>{ones}O</span>
              <button onClick={() => adjustValue('ones', 1)}>+</button>
            </div>
          </div>
        )}
      </div>
      
      <svg 
        width={400} 
        height={250}
        className="base-blocks-svg"
      >
        {/* Draw hundreds blocks */}
        {Array.from({ length: hundreds }).map((_, i) => 
          drawHundredBlock(
            i * (blockSize * 10 + gap), 
            0
          )
        )}
        
        {/* Draw tens blocks */}
        {Array.from({ length: tens }).map((_, i) => 
          drawTenBlock(
            hundreds * (blockSize * 10 + gap) + i * (blockSize + gap), 
            0
          )
        )}
        
        {/* Draw ones blocks */}
        {Array.from({ length: ones }).map((_, i) => 
          drawOneBlock(
            hundreds * (blockSize * 10 + gap) + tens * (blockSize + gap) + 
            (i % 5) * (blockSize + 2),
            blockSize * 10 + gap + Math.floor(i / 5) * (blockSize + 2)
          )
        )}
      </svg>
      
      <div className="base-blocks-value">
        Value: {totalValue}
      </div>
    </div>
  );
};

export default BaseBlocks;