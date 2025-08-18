import React, { useState } from 'react';
import './MinimalToolbar.scss';

interface MinimalToolbarProps {
  currentTool: 'pencil' | 'eraser' | 'text';
  currentColor: string;
  onToolChange: (tool: 'pencil' | 'eraser' | 'text') => void;
  onColorChange: (color: string) => void;
  onClear: () => void;
  onSendToPi?: () => void;
}

const MinimalToolbar: React.FC<MinimalToolbarProps> = ({
  currentTool,
  currentColor,
  onToolChange,
  onColorChange,
  onClear,
  onSendToPi
}) => {
  const [showColors, setShowColors] = useState(false);
  
  const colors = ['#2a2a2a', '#ff4444', '#4444ff', '#44aa44']; // Black, Red, Blue, Green

  return (
    <div className="minimal-toolbar">
      <button
        className={`tool-btn ${currentTool === 'pencil' ? 'active' : ''}`}
        onClick={() => {
          onToolChange('pencil');
          setShowColors(true);
        }}
        title="Pencil"
      >
        ✏️
      </button>
      
      {showColors && currentTool === 'pencil' && (
        <div className="color-picker">
          {colors.map(color => (
            <button
              key={color}
              className={`color-btn ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                onColorChange(color);
                setShowColors(false);
              }}
            />
          ))}
        </div>
      )}
      
      <button
        className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
        onClick={() => {
          onToolChange('eraser');
          setShowColors(false);
        }}
        title="Eraser"
      >
        🧹
      </button>
      
      <button
        className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
        onClick={() => {
          onToolChange('text');
          setShowColors(false);
        }}
        title="Text"
      >
        📝
      </button>
      
      <div className="toolbar-divider" />
      
      {onSendToPi && (
        <button
          className="tool-btn send-btn"
          onClick={onSendToPi}
          title="Send to Pi (for testing)"
        >
          👁️
        </button>
      )}
      
      <button
        className="tool-btn clear-btn"
        onClick={onClear}
        title="Clear all"
      >
        🗑️
      </button>
    </div>
  );
};

export default MinimalToolbar;