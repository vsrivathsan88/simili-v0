import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThreeActStore } from '../stores/threeActStore';
import './FloatingToolbar.scss';

interface FloatingToolbarProps {
  currentTool: string;
  currentColor: string;
  onToolChange: (tool: 'pencil' | 'eraser' | 'text' | 'select') => void;
  onColorChange: (color: string) => void;
  onClear: () => void;
  onAddManipulative?: (type: 'fraction-bar' | 'number-line' | 'area-model' | 'array-grid' | 'fraction-circles' | 'visual-number-line' | 'pizza') => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  currentTool,
  currentColor,
  onToolChange,
  onColorChange,
  onClear,
  onAddManipulative
}) => {
  const { currentAct, unlockedTools, getCanvasMode } = useThreeActStore();
  const canvasMode = getCanvasMode();
  
  // Only show toolbar in Act 2
  if (canvasMode !== 'workbench') return null;
  
  const colors = ['#2D3748', '#E53E3E', '#3182CE', '#38A169'];
  
  return (
    <AnimatePresence>
      <motion.div 
        className="floating-toolbar"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Drawing Tools */}
        <div className="tool-section">
          <h3>Draw</h3>
          <div className="tool-group">
            {unlockedTools.pencil && (
              <button
                className={`tool-btn ${currentTool === 'pencil' ? 'active' : ''}`}
                onClick={() => onToolChange('pencil')}
                title="Pencil"
              >
                ✏️
              </button>
            )}
            {unlockedTools.eraser && (
              <button
                className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                onClick={() => onToolChange('eraser')}
                title="Eraser"
              >
                🧹
              </button>
            )}
            <button
              className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
              onClick={() => onToolChange('select')}
              title="Select"
            >
              👆
            </button>
            <button
              className="tool-btn"
              onClick={onClear}
              title="Clear"
            >
              🗑️
            </button>
          </div>
          
          {/* Color Picker */}
          {unlockedTools.pencil && (
            <div className="color-group">
              {colors.map(color => (
                <button
                  key={color}
                  className={`color-btn ${currentColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Manipulatives */}
        {(unlockedTools.fractionBar || unlockedTools.pizza) && (
          <div className="tool-section">
            <h3>Tools</h3>
            <div className="tool-group">
              {unlockedTools.fractionBar && (
                <button
                  className="tool-btn manipulative"
                  onClick={() => {
                    // Call the canvas function directly
                    if ((window as any).__addManipulativeToCanvas) {
                      (window as any).__addManipulativeToCanvas('fraction-bar');
                    }
                    onAddManipulative?.('fraction-bar');
                  }}
                  title="Fraction Bar"
                >
                  <span className="tool-icon">▭</span>
                  <span className="tool-label">Bars</span>
                </button>
              )}
              {unlockedTools.pizza && (
                <button
                  className="tool-btn manipulative"
                  onClick={() => {
                    // Call the canvas function directly
                    if ((window as any).__addManipulativeToCanvas) {
                      (window as any).__addManipulativeToCanvas('pizza');
                    }
                    onAddManipulative?.('pizza');
                  }}
                  title="Pizza"
                >
                  <span className="tool-icon">🍕</span>
                  <span className="tool-label">Pizza</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingToolbar;