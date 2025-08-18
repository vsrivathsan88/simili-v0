import React, { useState, useRef, useCallback } from 'react';
import './UnifiedCanvas.scss';
import MinimalToolbar from './MinimalToolbar';
import GameFractionBar from './manipulatives/GameFractionBar';
import DynamicNumberLine from './manipulatives/DynamicNumberLine';
import AreaModel from './manipulatives/AreaModel';
import ArrayGrid from './manipulatives/ArrayGrid';
import FractionCircles from './manipulatives/FractionCircles';
import VisualNumberLine from './manipulatives/VisualNumberLine';
import EnhancedCanvas from './EnhancedCanvas';

interface UnifiedCanvasProps {
  onCanvasChange?: (imageData: string) => void;
  problemImage?: string;
  onSendToPi?: () => void;
}

interface Manipulative {
  id: string;
  type: 'fraction-bar' | 'number-line' | 'area-model' | 'array-grid' | 'fraction-circles' | 'visual-number-line';
  x: number;
  y: number;
  data: any;
}

const UnifiedCanvas: React.FC<UnifiedCanvasProps> = ({ onCanvasChange, problemImage, onSendToPi }) => {
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'text'>('pencil');
  const [currentColor, setCurrentColor] = useState('#2a2a2a');
  const [manipulatives, setManipulatives] = useState<Manipulative[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleClear = () => {
    setManipulatives([]);
    // TODO: Clear canvas
  };

  const handleToolChange = (tool: 'pencil' | 'eraser' | 'text') => {
    setCurrentTool(tool);
  };

  const addManipulative = (type: Manipulative['type']) => {
    const newManipulative: Manipulative = {
      id: `${type}-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      data: type === 'fraction-bar' 
        ? { parts: 4, shaded: 1 }
        : type === 'number-line'
        ? { min: 0, max: 10, marks: [] }
        : type === 'area-model'
        ? { rows: 3, cols: 4, selectedCells: Array(3).fill(null).map(() => Array(4).fill(false)) }
        : type === 'array-grid'
        ? { rows: 3, cols: 4, showGrouping: false }
        : type === 'fraction-circles'
        ? { parts: 4, shaded: 1 }
        : { length: 10, markers: [] } // visual-number-line
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
        onToolChange={handleToolChange}
        onColorChange={setCurrentColor}
        onClear={handleClear}
        onSendToPi={onSendToPi}
      />

      {/* Main canvas - always in background */}
      <div className="canvas-layer">
        <EnhancedCanvas
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
              {m.type === 'area-model' && (
                <AreaModel
                  {...m.data}
                  onChange={(data) => updateManipulative(m.id, data)}
                />
              )}
              {m.type === 'array-grid' && (
                <ArrayGrid
                  {...m.data}
                  onChange={(data) => updateManipulative(m.id, data)}
                />
              )}
              {m.type === 'fraction-circles' && (
                <FractionCircles
                  {...m.data}
                  onChange={(data) => updateManipulative(m.id, data)}
                />
              )}
              {m.type === 'visual-number-line' && (
                <VisualNumberLine
                  {...m.data}
                  onChange={(data) => updateManipulative(m.id, data)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick add buttons - Visual only */}
      <div className="quick-add-tools">
        <button 
          onClick={() => addManipulative('fraction-bar')}
          title="Add bars"
        >
          <span className="icon">▭</span>
          <span className="label">Bars</span>
        </button>
        <button 
          onClick={() => addManipulative('fraction-circles')}
          title="Add circles"
        >
          <span className="icon">◯</span>
          <span className="label">Circles</span>
        </button>
        <button 
          onClick={() => addManipulative('visual-number-line')}
          title="Add line"
        >
          <span className="icon">━</span>
          <span className="label">Line</span>
        </button>
        <button 
          onClick={() => addManipulative('area-model')}
          title="Add grid"
        >
          <span className="icon">⊞</span>
          <span className="label">Grid</span>
        </button>
        <button 
          onClick={() => addManipulative('array-grid')}
          title="Add dots"
        >
          <span className="icon">⚫</span>
          <span className="label">Dots</span>
        </button>
      </div>
    </div>
  );
};

export default UnifiedCanvas;