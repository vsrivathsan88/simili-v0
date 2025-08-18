import { useRef, useEffect, useState, useCallback } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import './DrawingCanvas.scss';

interface Point {
  x: number;
  y: number;
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const { client, connected } = useLiveAPIContext();
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  
  // Send canvas as image to Gemini periodically
  const sendCanvasImage = useCallback(() => {
    const canvas = canvasRef.current;
    const renderCanvas = renderCanvasRef.current;
    
    if (!canvas || !renderCanvas || !connected) return;
    
    const ctx = renderCanvas.getContext('2d');
    if (!ctx) return;
    
    // Scale down for faster transmission
    renderCanvas.width = canvas.width * 0.5;
    renderCanvas.height = canvas.height * 0.5;
    
    ctx.drawImage(canvas, 0, 0, renderCanvas.width, renderCanvas.height);
    
    const base64 = renderCanvas.toDataURL('image/jpeg', 0.8);
    const data = base64.slice(base64.indexOf(',') + 1);
    
    client.sendRealtimeInput([{ 
      mimeType: 'image/jpeg', 
      data 
    }]);
    
    // Emit event for session recording
    window.dispatchEvent(new CustomEvent('canvas-snapshot', { detail: base64 }));
    
    console.log('Sent canvas snapshot to Gemini');
  }, [client, connected]);
  
  // Drawing handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const point = {
      x: ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left,
      y: ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top
    };
    
    setIsDrawing(true);
    setLastPoint(point);
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left,
      y: ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top
    };
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    setLastPoint(currentPoint);
  };
  
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      
      // Send canvas after drawing stops
      setTimeout(sendCanvasImage, 500);
    }
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sendCanvasImage();
  };
  
  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;
    
    // Fill with white background
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);
  
  // Send canvas periodically when connected
  useEffect(() => {
    if (!connected) return;
    
    const interval = setInterval(sendCanvasImage, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, [connected, sendCanvasImage]);
  
  return (
    <>
      <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
      />
      <canvas
        ref={renderCanvasRef}
        style={{ display: 'none' }}
      />
      <button onClick={clearCanvas} className="clear-drawing-button">
        Clear Drawing
      </button>
    </>
  );
}