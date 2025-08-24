import React from 'react';
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
  const colors = [
    { value: '#2D3748', name: 'Black', emoji: '🖤' },
    { value: '#E53E3E', name: 'Red', emoji: '❤️' },
    { value: '#3182CE', name: 'Blue', emoji: '💙' },
    { value: '#38A169', name: 'Green', emoji: '💚' }
  ];

  return (
    <div className="minimal-toolbar">
      {/* Drawing Tools */}
      <div className="tool-section">
        <button
          className={`tool-btn ${currentTool === 'pencil' ? 'active' : ''}`}
          onClick={() => onToolChange('pencil')}
          title="Pencil"
        >
          ✏️
        </button>
        
        <button
          className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
          onClick={() => onToolChange('eraser')}
          title="Eraser"
        >
          🧽
        </button>
      </div>

      {/* Color Palette - Always Visible */}
      <div className="color-section">
        {colors.map(color => (
          <button
            key={color.value}
            className={`color-btn ${currentColor === color.value ? 'active' : ''}`}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorChange(color.value)}
            title={color.name}
          >
            {currentColor === color.value && <span className="color-check">✓</span>}
          </button>
        ))}
      </div>
      
      {/* Action Buttons */}
      <div className="action-section">
        {onSendToPi && (
          <button
            className="tool-btn send-btn"
            onClick={onSendToPi}
            title="Show Pi my work"
          >
            👁️ Pi
          </button>
        )}
        
        <button
          className="tool-btn clear-btn"
          onClick={onClear}
          title="Clear canvas"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default MinimalToolbar;