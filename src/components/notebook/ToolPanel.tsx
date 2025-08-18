import React from 'react';
import { DrawingTool, NotebookBackground } from '../types/notebook';
import './ToolPanel.scss';

interface ToolPanelProps {
  currentTool: DrawingTool;
  currentColor: string;
  strokeWidth: number;
  background: NotebookBackground;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onBackgroundChange: (bg: NotebookBackground) => void;
  onUndo: () => void;
  onClear: () => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
  currentTool,
  currentColor,
  strokeWidth,
  background,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onBackgroundChange,
  onUndo,
  onClear
}) => {
  const tools: DrawingTool[] = ['pencil', 'pen', 'eraser', 'highlighter'];
  const colors = [
    '#2a2a2a', // Dark gray (pencil)
    '#000000', // Black
    '#ff0000', // Red
    '#0066cc', // Blue
    '#009900', // Green
    '#ff9900', // Orange
    '#9900cc', // Purple
    '#ffcc00', // Yellow highlighter
    '#66ff66', // Green highlighter
    '#ff66ff', // Pink highlighter
  ];
  
  const strokeWidths = [1, 2, 3, 5, 8];
  const backgrounds: NotebookBackground[] = ['blank', 'ruled', 'graph', 'dots'];

  return (
    <div className="tool-panel">
      <div className="tool-section">
        <h3>Tools</h3>
        <div className="tool-buttons">
          {tools.map(tool => (
            <button
              key={tool}
              className={`tool-button ${currentTool === tool ? 'active' : ''}`}
              onClick={() => onToolChange(tool)}
              title={tool}
            >
              {getToolIcon(tool)}
            </button>
          ))}
        </div>
      </div>

      <div className="tool-section">
        <h3>Colors</h3>
        <div className="color-palette">
          {colors.map(color => (
            <button
              key={color}
              className={`color-button ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
      </div>

      <div className="tool-section">
        <h3>Stroke Width</h3>
        <div className="stroke-widths">
          {strokeWidths.map(width => (
            <button
              key={width}
              className={`stroke-button ${strokeWidth === width ? 'active' : ''}`}
              onClick={() => onStrokeWidthChange(width)}
            >
              <div 
                className="stroke-preview" 
                style={{ 
                  height: `${width}px`,
                  backgroundColor: currentColor 
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="tool-section">
        <h3>Paper</h3>
        <div className="background-options">
          {backgrounds.map(bg => (
            <button
              key={bg}
              className={`bg-button ${background === bg ? 'active' : ''}`}
              onClick={() => onBackgroundChange(bg)}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      <div className="tool-section actions">
        <button className="action-button" onClick={onUndo}>
          ↶ Undo
        </button>
        <button className="action-button clear" onClick={onClear}>
          🗑 Clear
        </button>
      </div>
    </div>
  );
};

const getToolIcon = (tool: DrawingTool): string => {
  switch (tool) {
    case 'pencil': return '✏️';
    case 'pen': return '🖊';
    case 'eraser': return '🧹';
    case 'highlighter': return '🖍';
    case 'text': return 'T';
    case 'shapes': return '⬜';
    default: return '?';
  }
};

export default ToolPanel;