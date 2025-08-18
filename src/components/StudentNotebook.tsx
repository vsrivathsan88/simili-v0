import React, { useState, useRef, useCallback, useEffect } from 'react';
import rough from 'roughjs';
import './StudentNotebook.scss';
import { DrawingTool, DrawingMode, NotebookBackground } from './types/notebook';
import ToolPanel from './notebook/ToolPanel';
import ManipulativePanel from './notebook/ManipulativePanel';
import DynamicFractionBar from './manipulatives/DynamicFractionBar';
import DynamicNumberLine from './manipulatives/DynamicNumberLine';
import BaseBlocks from './manipulatives/BaseBlocks';
import ArrayDots from './manipulatives/ArrayDots';

interface StudentNotebookProps {
  onCanvasChange?: (imageData: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  tool: DrawingTool;
  color: string;
  width: number;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roughCanvasRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [manipulatives, setManipulatives] = useState<Manipulative[]>([]);
  const [selectedManipulative, setSelectedManipulative] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Drawing settings
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [currentColor, setCurrentColor] = useState('#2a2a2a');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [background, setBackground] = useState<NotebookBackground>('graph');
  
  useEffect(() => {
    if (canvasRef.current && !roughCanvasRef.current) {
      roughCanvasRef.current = rough.canvas(canvasRef.current);
    }
  }, []);

  const drawBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw paper background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw lines based on background type
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    if (background === 'ruled') {
      // Draw horizontal lines
      for (let y = 30; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      // Draw margin line
      ctx.strokeStyle = '#ffcccc';
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, canvas.height);
      ctx.stroke();
    } else if (background === 'graph') {
      // Draw grid
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [background]);

  const redrawCanvas = useCallback(() => {
    drawBackground();
    
    const canvas = canvasRef.current;
    const rc = roughCanvasRef.current;
    if (!canvas || !rc) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Redraw all strokes
    strokes.forEach(stroke => {
      if (stroke.tool === 'eraser') {
        // Eraser clears pixels
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        stroke.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Draw with rough.js for pencil/pen
        const roughness = stroke.tool === 'pencil' ? 1.5 : 0.5;
        
        if (stroke.points.length > 1) {
          for (let i = 1; i < stroke.points.length; i++) {
            rc.line(
              stroke.points[i - 1].x,
              stroke.points[i - 1].y,
              stroke.points[i].x,
              stroke.points[i].y,
              {
                stroke: stroke.color,
                strokeWidth: stroke.width,
                roughness,
                bowing: stroke.tool === 'pencil' ? 2 : 0
              }
            );
          }
        }
      }
    });
    
    // Notify parent of canvas change
    if (onCanvasChange) {
      onCanvasChange(canvas.toDataURL());
    }
  }, [strokes, drawBackground, onCanvasChange]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, background, redrawCanvas]);

  const startDrawing = (e: React.MouseEvent) => {
    if (selectedManipulative) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDrawing(true);
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setCurrentStroke([point]);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setCurrentStroke(prev => [...prev, point]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes(prev => [...prev, {
        points: currentStroke,
        tool: currentTool,
        color: currentColor,
        width: strokeWidth
      }]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

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

  const handleUndo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    setManipulatives([]);
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
      
      <div className="notebook-area">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        <div className="manipulatives-layer">
          {manipulatives.map(m => (
            <div
              key={m.id}
              className={`manipulative ${m.selected ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                left: m.x,
                top: m.y,
                cursor: isDragging && m.selected ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => {
                setSelectedManipulative(m.id);
                setIsDragging(true);
                const rect = e.currentTarget.getBoundingClientRect();
                setDragOffset({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                });
              }}
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