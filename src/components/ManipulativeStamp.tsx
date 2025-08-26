import React from 'react';
import { Tool } from './PiCharacter';
import './ManipulativeStamp.scss';

interface ManipulativeStampProps {
  tool: Tool;
  x: number;
  y: number;
  size?: 'small' | 'medium' | 'large';
  onMove?: (newX: number, newY: number) => void;
  onRemove?: () => void;
  isSelected?: boolean;
}

export function ManipulativeStamp({
  tool,
  x,
  y,
  size = 'medium',
  onMove,
  onRemove,
  isSelected = false
}: ManipulativeStampProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onMove) return;
    
    e.preventDefault();
    const startX = e.clientX - x;
    const startY = e.clientY - y;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      onMove(newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderManipulative = () => {
    switch (tool.id) {
      case 'pizza':
        return <PizzaSlice />;
      case 'fraction-bar':
        return <FractionBar />;
      case 'fraction-circles':
        return <FractionCircle />;
      case 'pie':
        return <PieChart />;
      case 'number-line':
        return <NumberLine />;
      default:
        return (
          <div className="generic-stamp">
            <span className="stamp-emoji">{tool.emoji}</span>
            <span className="stamp-label">{tool.name}</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`manipulative-stamp ${size} ${isSelected ? 'selected' : ''}`}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
    >
      {renderManipulative()}
      
      {isSelected && onRemove && (
        <button 
          className="stamp-remove"
          onClick={onRemove}
          aria-label="Remove manipulative"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Individual manipulative components
function PizzaSlice() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="pizza-slice">
      <path
        d="M40 40 L40 10 A30 30 0 0 1 65 30 Z"
        fill="#FFA500"
        stroke="#D69E2E"
        strokeWidth="2"
      />
      {/* Pepperoni */}
      <circle cx="50" cy="22" r="3" fill="#8B0000" />
      <circle cx="45" cy="30" r="2.5" fill="#8B0000" />
    </svg>
  );
}

function FractionBar() {
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" className="fraction-bar">
      <rect
        x="5"
        y="10"
        width="110"
        height="20"
        fill="#4ECDC4"
        stroke="#2D3748"
        strokeWidth="2"
        rx="2"
      />
      {/* Division lines */}
      {[1, 2, 3].map(i => (
        <line
          key={i}
          x1={5 + (110 * i / 4)}
          y1="8"
          x2={5 + (110 * i / 4)}
          y2="32"
          stroke="#2D3748"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

function FractionCircle() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="fraction-circle">
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="#FF6B6B"
        stroke="#2D3748"
        strokeWidth="2"
      />
      {/* Division lines */}
      <line x1="40" y1="10" x2="40" y2="70" stroke="#2D3748" strokeWidth="2" />
      <line x1="10" y1="40" x2="70" y2="40" stroke="#2D3748" strokeWidth="2" />
    </svg>
  );
}

function PieChart() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="pie-chart">
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="#32D74B"
        stroke="#2D3748"
        strokeWidth="2"
      />
      {/* Pie slice */}
      <path
        d="M40 40 L40 10 A30 30 0 0 1 70 40 Z"
        fill="#68D391"
        stroke="#2D3748"
        strokeWidth="2"
      />
    </svg>
  );
}

function NumberLine() {
  return (
    <svg width="150" height="40" viewBox="0 0 150 40" className="number-line">
      {/* Main line */}
      <line
        x1="10"
        y1="20"
        x2="140"
        y2="20"
        stroke="#2D3748"
        strokeWidth="3"
      />
      {/* Tick marks */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <g key={i}>
          <line
            x1={10 + (i * 26)}
            y1="15"
            x2={10 + (i * 26)}
            y2="25"
            stroke="#2D3748"
            strokeWidth="2"
          />
          <text
            x={10 + (i * 26)}
            y="35"
            textAnchor="middle"
            fontSize="12"
            fill="#2D3748"
          >
            {i}
          </text>
        </g>
      ))}
    </svg>
  );
}