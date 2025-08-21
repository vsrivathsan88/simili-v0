import React, { useState, useRef, useCallback } from 'react';
import './UnifiedCanvas.scss';
import MinimalToolbar from './MinimalToolbar';
import GameFractionBar from './manipulatives/GameFractionBar';
import DynamicNumberLine from './manipulatives/DynamicNumberLine';
import OptimizedCanvas from './OptimizedCanvas';

interface UnifiedCanvasProps {
  onCanvasChange?: (imageData: string) => void;
  problemImage?: string;
}

interface Manipulative {
  id: string;
  type: 'fraction-bar' | 'number-line';
  x: number;
  y: number;
  data: any;
}

const UnifiedCanvas: React.FC<UnifiedCanvasProps> = ({ onCanvasChange, problemImage }) => {
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser'>('pencil');
  const [currentColor, setCurrentColor] = useState('#2a2a2a');
  const [manipulatives, setManipulatives] = useState<Manipulative[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    setManipulatives([]);
    // TODO: Clear canvas
  };

  const addManipulative = (type: 'fraction-bar' | 'number-line') => {
    const newManipulative: Manipulative = {
      id: `${type}-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      data: type === 'fraction-bar' 
        ? { parts: 4, shaded: 1 }
        : { min: 0, max: 10, marks: [] }
    };
    setManipulatives(prev => [...prev, newManipulative]);
  };

  const updateManipulative = (id: string, data: any) => {
    setManipulatives(prev => prev.map(m => 
      m.id === id ? { ...m, data } : m
    ));
  };

  const handleManipulativeDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 150; // Center of manipulative
    const y = e.clientY - rect.top - 50;
    
    setManipulatives(prev => prev.map(m => 
      m.id === isDragging ? { ...m, x, y } : m
    ));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleManipulativeDrag);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleManipulativeDrag);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleManipulativeDrag, handleMouseUp]);

  return (
    <div className="unified-canvas" ref={containerRef}>
      {/* Floating toolbar */}
      <MinimalToolbar
        currentTool={currentTool}
        currentColor={currentColor}
        onToolChange={setCurrentTool}
        onColorChange={setCurrentColor}
        onClear={handleClear}
      />

      {/* Main canvas - always in background */}
      <div className="canvas-layer">
        <OptimizedCanvas
          width={800}
          height={600}
          onCanvasChange={onCanvasChange}
          background="graph"
          currentTool={currentTool}
          currentColor={currentColor}
          strokeWidth={currentTool === 'pencil' ? 2 : 20}
        />
      </div>

      {/* Manipulatives layer - on top but allows drawing through */}
      <div className="manipulatives-layer">
        {manipulatives.map(m => (
          <div
            key={m.id}
            className="manipulative-container"
            style={{ 
              left: m.x, 
              top: m.y,
              position: 'absolute'
            }}
          >
            {/* Drag handle */}
            <div 
              className="drag-handle"
              onMouseDown={() => setIsDragging(m.id)}
            >
              ⋮⋮
            </div>
            
            {/* Manipulative content */}
            <div className="manipulative-content">
              {m.type === 'fraction-bar' && (
                <GameFractionBar
                  {...m.data}
                  onChange={(data) => updateManipulative(m.id, data)}
                />
              )}
              {m.type === 'number-line' && (
                <DynamicNumberLine
                  {...m.data}
                  onChange={(data) => updateManipulative(m.id, data)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick add buttons */}
      <div className="quick-add-tools">
        <button 
          onClick={() => addManipulative('fraction-bar')}
          title="Add fraction bar"
        >
          <span className="icon">⬜</span>
          <span className="label">Fraction Bar</span>
        </button>
        <button 
          onClick={() => addManipulative('number-line')}
          title="Add number line"
        >
          <span className="icon">↔️</span>
          <span className="label">Number Line</span>
        </button>
      </div>
    </div>
  );
};

export default UnifiedCanvas;