import React, { useState, useRef, useCallback } from 'react';
import './StudentNotebook.scss';
import { DrawingTool, NotebookBackground } from './types/notebook';
import ToolPanel from './notebook/ToolPanel';
import ManipulativePanel from './notebook/ManipulativePanel';
import OptimizedCanvas from './OptimizedCanvas';
import DynamicFractionBar from './manipulatives/DynamicFractionBar';
import DynamicNumberLine from './manipulatives/DynamicNumberLine';
import BaseBlocks from './manipulatives/BaseBlocks';
import ArrayDots from './manipulatives/ArrayDots';

interface StudentNotebookProps {
  onCanvasChange?: (imageData: string) => void;
}

interface Manipulative {
  id: string;
  type: 'fraction-bar' | 'number-line' | 'base-blocks' | 'array-dots';
  x: number;
  y: number;
  data: any;
  selected?: boolean;
}

const StudentNotebook: React.FC<StudentNotebookProps> = ({ onCanvasChange }) => {
  const [manipulatives, setManipulatives] = useState<Manipulative[]>([]);
  const [selectedManipulative, setSelectedManipulative] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drawing settings
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [currentColor, setCurrentColor] = useState('#2a2a2a');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [background, setBackground] = useState<NotebookBackground>('graph');

  const handleManipulativeAdd = (type: Manipulative['type']) => {
    const newManipulative: Manipulative = {
      id: `${type}-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      data: getDefaultManipulativeData(type)
    };
    setManipulatives(prev => [...prev, newManipulative]);
  };

  const getDefaultManipulativeData = (type: Manipulative['type']) => {
    switch (type) {
      case 'fraction-bar':
        return { parts: 4, shaded: 1 };
      case 'number-line':
        return { min: 0, max: 10, marks: [3, 7] };
      case 'base-blocks':
        return { hundreds: 1, tens: 2, ones: 5 };
      case 'array-dots':
        return { rows: 3, cols: 4 };
      default:
        return {};
    }
  };

  const handleManipulativeUpdate = (id: string, data: any) => {
    setManipulatives(prev => prev.map(m => 
      m.id === id ? { ...m, data } : m
    ));
  };

  const handleManipulativeMouseDown = (e: React.MouseEvent, manipulativeId: string) => {
    e.preventDefault();
    setSelectedManipulative(manipulativeId);
    setIsDragging(true);
    
    const manipulative = manipulatives.find(m => m.id === manipulativeId);
    if (!manipulative) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragOffset({
      x: e.clientX - rect.left - manipulative.x,
      y: e.clientY - rect.top - manipulative.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedManipulative) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    setManipulatives(prev => prev.map(m => 
      m.id === selectedManipulative 
        ? { ...m, x: Math.max(0, newX), y: Math.max(0, newY) }
        : m
    ));
  }, [isDragging, selectedManipulative, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleUndo = () => {
    // This will be handled by OptimizedCanvas
    console.log('Undo requested');
  };

  const handleClear = () => {
    setManipulatives([]);
    // Also clear the canvas - this would need to be passed to OptimizedCanvas
    console.log('Clear requested');
  };

  return (
    <div className="student-notebook">
      <ToolPanel
        currentTool={currentTool}
        currentColor={currentColor}
        strokeWidth={strokeWidth}
        background={background}
        onToolChange={setCurrentTool}
        onColorChange={setCurrentColor}
        onStrokeWidthChange={setStrokeWidth}
        onBackgroundChange={setBackground}
        onUndo={handleUndo}
        onClear={handleClear}
      />
      
      <div className="notebook-area" ref={containerRef}>
        <OptimizedCanvas
          width={800}
          height={600}
          onCanvasChange={onCanvasChange}
          background={background}
          currentTool={currentTool}
          currentColor={currentColor}
          strokeWidth={strokeWidth}
        />
        
        <div className="manipulatives-layer">
          {manipulatives.map(m => (
            <div
              key={m.id}
              className={`manipulative ${m.id === selectedManipulative ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                left: m.x,
                top: m.y,
                cursor: isDragging && m.id === selectedManipulative ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleManipulativeMouseDown(e, m.id)}
            >
              {m.type === 'fraction-bar' && (
                <DynamicFractionBar
                  {...m.data}
                  onChange={(data) => handleManipulativeUpdate(m.id, data)}
                />
              )}
              {m.type === 'number-line' && (
                <DynamicNumberLine
                  {...m.data}
                  onChange={(data) => handleManipulativeUpdate(m.id, data)}
                />
              )}
              {m.type === 'base-blocks' && (
                <BaseBlocks
                  {...m.data}
                  onChange={(data) => handleManipulativeUpdate(m.id, data)}
                />
              )}
              {m.type === 'array-dots' && (
                <ArrayDots
                  {...m.data}
                  onChange={(data) => handleManipulativeUpdate(m.id, data)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <ManipulativePanel
        onAddManipulative={handleManipulativeAdd}
      />
    </div>
  );
};

export default StudentNotebook;