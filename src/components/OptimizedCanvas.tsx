import React, { useState, useRef, useCallback, useEffect } from 'react';
import './OptimizedCanvas.scss';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pencil' | 'pen' | 'eraser';
}

interface OptimizedCanvasProps {
  width: number;
  height: number;
  onCanvasChange?: (imageData: string) => void;
  background?: 'blank' | 'ruled' | 'graph' | 'dots';
  currentTool: string; // Accept any tool, but only handle pencil/pen/eraser
  currentColor: string;
  strokeWidth: number;
}

const OptimizedCanvas: React.FC<OptimizedCanvasProps> = ({
  width,
  height,
  onCanvasChange,
  background = 'graph',
  currentTool,
  currentColor,
  strokeWidth
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
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

    // Set up for high DPI displays
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(scale, scale);

    contextRef.current = context;
    
    // Initial background draw
    drawBackground();
  }, [width, height]);

  const drawBackground = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // White background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    // Draw grid/lines based on background type
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    if (background === 'ruled') {
      for (let y = 30; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      // Margin line
      ctx.strokeStyle = '#ffcccc';
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, height);
      ctx.stroke();
    } else if (background === 'graph') {
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }, [background, width, height]);

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    drawBackground();
    
    const ctx = contextRef.current;
    if (!ctx) return;

    strokes.forEach(stroke => {
      if (stroke.tool === 'eraser') {
        // Eraser removes content
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }
      
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          const prevPoint = stroke.points[index - 1];
          // Use quadratic curves for smoother lines
          const midX = (prevPoint.x + point.x) / 2;
          const midY = (prevPoint.y + point.y) / 2;
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
        }
      });
      
      // Draw the last segment
      if (stroke.points.length > 1) {
        const lastPoint = stroke.points[stroke.points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }
      
      ctx.stroke();
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    // Notify parent of changes
    if (onCanvasChange && canvasRef.current) {
      onCanvasChange(canvasRef.current.toDataURL());
    }
  }, [strokes, drawBackground, onCanvasChange]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const drawSmoothLine = (from: Point, to: Point) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    // Only handle supported tools
    const tool = ['pencil', 'pen', 'eraser'].includes(currentTool) ? currentTool : 'pencil';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    }

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCoordinates(e);
    setIsDrawing(true);
    currentStrokeRef.current = [point];
    lastPointRef.current = point;

    // Draw a single point
    const ctx = contextRef.current;
    if (ctx) {
      ctx.fillStyle = currentTool === 'eraser' ? 'white' : currentColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, strokeWidth / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPointRef.current) return;

    const point = getCoordinates(e);
    
    // Use requestAnimationFrame for smooth drawing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      drawSmoothLine(lastPointRef.current!, point);
      currentStrokeRef.current.push(point);
      lastPointRef.current = point;
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
    if (currentStrokeRef.current.length > 0) {
      // Only save strokes for supported tools
      const tool = ['pencil', 'pen', 'eraser'].includes(currentTool) ? currentTool : 'pencil';
      const newStroke: Stroke = {
        points: [...currentStrokeRef.current],
        color: currentColor,
        width: strokeWidth,
        tool: tool as 'pencil' | 'pen' | 'eraser'
      };
      setStrokes(prev => [...prev, newStroke]);
    }

    currentStrokeRef.current = [];
    lastPointRef.current = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleUndo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  return (
    <canvas
      ref={canvasRef}
      className="optimized-canvas"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{ 
        cursor: currentTool === 'eraser' ? 'grab' : 'crosshair',
        touchAction: 'none' // Prevent scrolling while drawing
      }}
    />
  );
};

export default OptimizedCanvas;