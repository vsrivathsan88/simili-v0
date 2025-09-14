import React, { useState, useRef, useCallback, useEffect } from 'react';
import './EnhancedCanvas.scss';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: 'pencil' | 'pen' | 'eraser';
  selected?: boolean;
}

interface TextElement {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface EnhancedCanvasProps {
  width: number;
  height: number;
  onCanvasChange?: (imageData: string) => void;
  background?: 'blank' | 'ruled' | 'graph' | 'dots';
  currentTool: string;
  currentColor: string;
  strokeWidth: number;
  clearTrigger?: number; // Add clear trigger prop
  disabled?: boolean; // Add disabled prop for Act 1
  enableSelection?: boolean; // Enable selection mode
  onDeleteSelected?: () => void; // Callback when delete is requested
}

const EnhancedCanvas: React.FC<EnhancedCanvasProps> = ({
  width,
  height,
  onCanvasChange,
  background = 'graph',
  currentTool,
  currentColor,
  strokeWidth,
  clearTrigger,
  disabled = false,
  enableSelection = false,
  onDeleteSelected
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
  const currentStrokeRef = useRef<Point[]>([]);
  const animationFrameRef = useRef<number>();
  const lastPointRef = useRef<Point | null>(null);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: true
    });
    if (!context) return;

    contextRef.current = context;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.scale(dpr, dpr);
    
    redrawCanvas();
    
    // Send initial blank canvas
    setTimeout(() => {
      if (onCanvasChange) {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCanvasChange(imageData);
        console.log('Initial blank canvas sent to Pi');
      }
    }, 100);
  }, [width, height, onCanvasChange]);

  // Define drawBackground before redrawCanvas
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Fill with paper color
    ctx.fillStyle = '#FFFEF7';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    if (background === 'graph') {
      // Draw grid
      const gridSize = 20;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (background === 'ruled') {
      // Draw horizontal lines
      const lineSpacing = 25;
      for (let y = lineSpacing; y <= height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }, [width, height, background]);

  // Redraw entire canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Draw background
    drawBackground(context);

    // Redraw all strokes
    strokes.forEach(stroke => {
      drawStroke(context, stroke);
    });
    
    // Draw selection box if active
    if (selectionBox && isSelecting) {
      context.strokeStyle = '#3B82F6';
      context.lineWidth = 1;
      context.setLineDash([5, 5]);
      const width = selectionBox.end.x - selectionBox.start.x;
      const height = selectionBox.end.y - selectionBox.start.y;
      context.strokeRect(selectionBox.start.x, selectionBox.start.y, width, height);
      context.setLineDash([]);
    }

    // Draw all text elements
    textElements.forEach(text => {
      drawText(context, text);
    });

    // Notify parent of changes
    if (onCanvasChange) {
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      onCanvasChange(imageData);
    }
  }, [strokes, textElements, width, height, background, onCanvasChange, drawBackground, selectedStrokeIds, selectionBox, isSelecting]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Clear canvas when clearTrigger changes
  useEffect(() => {
    if (clearTrigger !== undefined && clearTrigger > 0) {
      console.log('Clearing canvas - clearTrigger changed:', clearTrigger);
      setStrokes([]);
      setTextElements([]);
      setTextInput(null);
      setIsDrawing(false);
      
      // Clear the canvas immediately
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        context.clearRect(0, 0, width, height);
        drawBackground(context);
        
        // Send cleared canvas to parent
        if (onCanvasChange) {
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          onCanvasChange(imageData);
          console.log('Cleared canvas sent to Pi');
        }
      }
    }
  }, [clearTrigger]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFEF7' : stroke.color;
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    // Use quadratic curves for smooth lines
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }

    // Draw the last segment
    if (stroke.points.length > 1) {
      const lastPoint = stroke.points[stroke.points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
    
    // Draw selection highlight if selected
    if (selectedStrokeIds.has(stroke.id)) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = stroke.width + 4;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    ctx.globalCompositeOperation = 'source-over';
  };

  const drawText = (ctx: CanvasRenderingContext2D, text: TextElement) => {
    ctx.font = `${text.fontSize}px "Inter", sans-serif`;
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return; // Prevent drawing when disabled
    
    const point = getCoordinates(e);
    
    // Handle selection mode
    if (currentTool === 'select' || enableSelection) {
      setIsSelecting(true);
      setSelectionBox({ start: point, end: point });
      return;
    }
    
    if (currentTool === 'text') {
      setTextInput({ x: point.x, y: point.y, text: '' });
      return;
    }

    if (currentTool !== 'pencil' && currentTool !== 'eraser') return;

    setIsDrawing(true);
    currentStrokeRef.current = [point];
    lastPointRef.current = point;
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const point = getCoordinates(e);
    
    // Handle selection box dragging
    if (isSelecting && selectionBox) {
      setSelectionBox({ ...selectionBox, end: point });
      redrawCanvas(); // Redraw to show selection box
      return;
    }
    
    if (!isDrawing || (currentTool !== 'pencil' && currentTool !== 'eraser')) return;

    currentStrokeRef.current.push(point);

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth drawing
    animationFrameRef.current = requestAnimationFrame(() => {
      const context = contextRef.current;
      if (!context || !lastPointRef.current) return;

      // Draw only the new segment
      context.lineWidth = strokeWidth;
      context.strokeStyle = currentTool === 'eraser' ? '#FFFEF7' : currentColor;
      context.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';

      context.beginPath();
      context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      context.lineTo(point.x, point.y);
      context.stroke();

      lastPointRef.current = point;
      context.globalCompositeOperation = 'source-over';
    });
  }, [isDrawing, isSelecting, selectionBox, currentTool, currentColor, strokeWidth, redrawCanvas]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
    if (currentStrokeRef.current.length > 0) {
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random()}`,
        points: [...currentStrokeRef.current],
        color: currentColor,
        width: strokeWidth,
        tool: currentTool as 'pencil' | 'eraser'
      };
      
      setStrokes(prev => {
        const newStrokes = [...prev, newStroke];
        
        // Immediately send canvas update after stroke is complete
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas && onCanvasChange) {
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            onCanvasChange(imageData);
            console.log('Canvas updated and sent to Pi');
          }
        }, 50); // Small delay to ensure stroke is fully rendered
        
        return newStrokes;
      });
      currentStrokeRef.current = [];
    }
    
    lastPointRef.current = null;
  }, [isDrawing, isSelecting, selectionBox, strokes, currentColor, strokeWidth, currentTool, onCanvasChange, redrawCanvas]);

  const handleTextSubmit = (text: string) => {
    if (textInput && text.trim()) {
      const newText: TextElement = {
        x: textInput.x,
        y: textInput.y,
        text: text.trim(),
        color: currentColor,
        fontSize: 16
      };
      setTextElements(prev => {
        const newElements = [...prev, newText];
        
        // Send canvas update after text is added
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas && onCanvasChange) {
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            onCanvasChange(imageData);
            console.log('Canvas text updated and sent to Pi');
          }
        }, 50);
        
        return newElements;
      });
    }
    setTextInput(null);
  };

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStrokeIds.size > 0) {
        e.preventDefault();
        // Remove selected strokes
        setStrokes(prev => prev.filter(stroke => !selectedStrokeIds.has(stroke.id)));
        setSelectedStrokeIds(new Set());
        
        // Notify parent if callback provided
        if (onDeleteSelected) {
          onDeleteSelected();
        }
      }
      
      // Clear selection on Escape
      if (e.key === 'Escape') {
        setSelectedStrokeIds(new Set());
        setSelectionBox(null);
        setIsSelecting(false);
        redrawCanvas();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStrokeIds, onDeleteSelected, redrawCanvas]);

  return (
    <div className="enhanced-canvas-container">
      <canvas
        ref={canvasRef}
        className="enhanced-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {textInput && (
        <input
          type="text"
          className="canvas-text-input"
          style={{
            position: 'absolute',
            left: textInput.x,
            top: textInput.y - 8,
            fontSize: '16px',
            fontFamily: '"Inter", sans-serif',
            color: currentColor,
            border: '1px solid #ccc',
            padding: '2px 4px',
            background: 'white'
          }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTextSubmit(e.currentTarget.value);
            } else if (e.key === 'Escape') {
              setTextInput(null);
            }
          }}
          onBlur={(e) => handleTextSubmit(e.currentTarget.value)}
        />
      )}
    </div>
  );
};

export default EnhancedCanvas;