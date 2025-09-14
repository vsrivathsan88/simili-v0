import React, { useState, useRef, useCallback, useEffect } from 'react';
import './UnifiedCanvas.scss';
import GameFractionBar from './manipulatives/GameFractionBar';
import DynamicNumberLine from './manipulatives/DynamicNumberLine';
import AreaModel from './manipulatives/AreaModel';
import ArrayGrid from './manipulatives/ArrayGrid';
import FractionCircles from './manipulatives/FractionCircles';
import VisualNumberLine from './manipulatives/VisualNumberLine';
import PizzaFraction from './manipulatives/PizzaFraction';
import EnhancedCanvas from './EnhancedCanvas';
import { useThreeActStore } from '../stores/threeActStore';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedCanvasProps {
  onCanvasChange?: (imageData: string) => void;
  problemImage?: string;
  onSendToPi?: () => void;
  currentTool?: 'pencil' | 'eraser' | 'text' | 'select';
  currentColor?: string;
  onToolChange?: (tool: 'pencil' | 'eraser' | 'text' | 'select') => void;
  onColorChange?: (color: string) => void;
  onClear?: () => void;
  onAddManipulative?: (type: 'fraction-bar' | 'number-line' | 'area-model' | 'array-grid' | 'fraction-circles' | 'visual-number-line' | 'pizza') => void;
}

interface Manipulative {
  id: string;
  type: 'fraction-bar' | 'number-line' | 'area-model' | 'array-grid' | 'fraction-circles' | 'visual-number-line' | 'pizza';
  x: number;
  y: number;
  data: any;
}

const UnifiedCanvas: React.FC<UnifiedCanvasProps> = ({ 
  onCanvasChange, 
  problemImage, 
  onSendToPi,
  currentTool = 'pencil',
  currentColor = '#2D3748',
  onToolChange,
  onColorChange,
  onClear,
  onAddManipulative
}) => {
  const [canvasSize, setCanvasSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });
  const [manipulatives, setManipulatives] = useState<Manipulative[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const manipulativesRef = useRef<Manipulative[]>([]);
  
  // Three-act state
  const { currentAct, unlockedTools, isTransitioning, getCanvasMode } = useThreeActStore();
  const canvasMode = getCanvasMode();

  const handleClear = () => {
    setManipulatives([]);
    // Clear the canvas by triggering a state change
    setClearTrigger(prev => prev + 1);
    if (onClear) onClear();
  };

  const addManipulative = (type: Manipulative['type']) => {
    console.log('Adding manipulative:', type);
    const newManipulative: Manipulative = {
      id: `${type}-${Date.now()}`,
      type,
      x: 300,  // More centered
      y: 200,  // More centered
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
        : type === 'pizza'
        ? { slices: 8, eaten: 0 }
        : { length: 10, markers: [] } // visual-number-line
    };
    setManipulatives(prev => {
      const updated = [...prev, newManipulative];
      console.log('Current manipulatives:', updated);
      manipulativesRef.current = updated;
      return updated;
    });
  };
  
  // Handle external add manipulative calls
  useEffect(() => {
    // Make the addManipulative function available globally
    (window as any).__addManipulativeToCanvas = (type: Manipulative['type']) => {
      console.log('Global add manipulative called:', type);
      const newManipulative: Manipulative = {
        id: `${type}-${Date.now()}`,
        type,
        x: 300,
        y: 200,
        data: type === 'fraction-bar' 
          ? { parts: 4, shaded: 1 }
          : type === 'pizza'
          ? { slices: 8, eaten: 0 }
          : {}
      };
      setManipulatives(prev => {
        const updated = [...prev, newManipulative];
        console.log('Added manipulative, total:', updated.length);
        return updated;
      });
    };
    
    // Cleanup
    return () => {
      delete (window as any).__addManipulativeToCanvas;
    };
  }, []);

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
    <div className={`unified-canvas ${canvasMode}-mode`} ref={containerRef}>
      {/* Dimming overlay for Act 1 (Spotlight mode) */}
      <AnimatePresence>
        {canvasMode === 'spotlight' && (
          <motion.div 
            className="spotlight-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Main canvas - full screen */}
      <div className="canvas-layer">
        <EnhancedCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          onCanvasChange={onCanvasChange}
          background="graph"
          currentTool={currentTool}
          currentColor={currentColor}
          strokeWidth={currentTool === 'pencil' ? 2 : 20}
          clearTrigger={clearTrigger}
          // Disable drawing in Act 1
          disabled={canvasMode === 'spotlight'}
          enableSelection={currentTool === 'select'}
        />
        
        {/* Problem display - inside canvas layer so it can be marked up */}
        {problemImage && (
          <motion.div
            className={`problem-display ${canvasMode}`}
            layout
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            style={{ pointerEvents: 'none' }} // Allow drawing over it
          >
            <img src={problemImage} alt="Math problem" style={{ pointerEvents: 'none' }} />
          </motion.div>
        )}
      </div>

      {/* Manipulatives layer - only visible in Act 2 */}
      <AnimatePresence>
        {canvasMode === 'workbench' && (
          <motion.div 
            className="manipulatives-layer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
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
            
            {/* Delete button */}
            <button
              className="delete-btn"
              onClick={() => {
                setManipulatives(prev => prev.filter(manip => manip.id !== m.id));
              }}
              title="Delete"
            >
              ✕
            </button>
            
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
              {m.type === 'pizza' && (
                <PizzaFraction
                  {...m.data}
                  onChange={(data) => updateManipulative(m.id, data)}
                />
              )}
            </div>
          </div>
        ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Act 3 Showcase overlay - highlights final work */}
      <AnimatePresence>
        {canvasMode === 'showcase' && (
          <motion.div 
            className="showcase-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedCanvas;