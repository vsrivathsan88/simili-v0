import React, { useState } from 'react';
import './SimpleStudentCanvas.scss';
import OptimizedCanvas from './OptimizedCanvas';
import MinimalToolbar from './MinimalToolbar';
import DynamicFractionBar from './manipulatives/DynamicFractionBar';
import NumberLine from './manipulatives/DynamicNumberLine';

interface SimpleStudentCanvasProps {
  onCanvasChange?: (imageData: string) => void;
}

const SimpleStudentCanvas: React.FC<SimpleStudentCanvasProps> = ({ onCanvasChange }) => {
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser'>('pencil');
  const [currentColor, setCurrentColor] = useState('#2a2a2a');
  const [manipulatives, setManipulatives] = useState<any[]>([]);

  const handleClear = () => {
    // Clear canvas - would need to pass ref or state to OptimizedCanvas
    setManipulatives([]);
  };

  const addFractionBar = () => {
    setManipulatives([...manipulatives, {
      id: Date.now(),
      type: 'fraction',
      x: 50,
      y: 50,
      data: { parts: 4, shaded: 1 }
    }]);
  };

  const addNumberLine = () => {
    setManipulatives([...manipulatives, {
      id: Date.now(),
      type: 'numberline',
      x: 50,
      y: 150,
      data: { min: 0, max: 10, marks: [] }
    }]);
  };

  return (
    <div className="simple-student-canvas">
      <MinimalToolbar
        currentTool={currentTool}
        currentColor={currentColor}
        onToolChange={setCurrentTool}
        onColorChange={setCurrentColor}
        onClear={handleClear}
      />

      <div className="canvas-container">
        <OptimizedCanvas
          width={800}
          height={600}
          onCanvasChange={onCanvasChange}
          background="graph"
          currentTool={currentTool}
          currentColor={currentColor}
          strokeWidth={currentTool === 'pencil' ? 2 : 20}
        />

        {/* Floating manipulative buttons */}
        <div className="manipulative-buttons">
          <button onClick={addFractionBar} title="Add fraction bar">
            <span className="icon">⬜</span>
            <span className="label">Fractions</span>
          </button>
          <button onClick={addNumberLine} title="Add number line">
            <span className="icon">↔️</span>
            <span className="label">Number Line</span>
          </button>
        </div>

        {/* Manipulatives layer */}
        <div className="manipulatives-overlay">
          {manipulatives.map((m) => (
            <div
              key={m.id}
              className="manipulative-wrapper"
              style={{ 
                position: 'absolute', 
                left: m.x, 
                top: m.y,
                cursor: 'move'
              }}
            >
              {m.type === 'fraction' && (
                <DynamicFractionBar
                  {...m.data}
                  onChange={(data) => {
                    setManipulatives(manipulatives.map(item => 
                      item.id === m.id ? { ...item, data } : item
                    ));
                  }}
                />
              )}
              {m.type === 'numberline' && (
                <NumberLine
                  {...m.data}
                  onChange={(data) => {
                    setManipulatives(manipulatives.map(item => 
                      item.id === m.id ? { ...item, data } : item
                    ));
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleStudentCanvas;