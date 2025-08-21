import React, { useState, useRef, useCallback } from 'react';
import { Manipulative, FractionBarData, NumberLineData } from './manipulatives/types';
import { FractionBar } from './manipulatives/FractionBar';
import { NumberLine } from './manipulatives/NumberLine';
import { DrawingCanvas } from './DrawingCanvas';
import { v4 as uuidv4 } from 'uuid';
import './ManipulativeCanvas.scss';

export function ManipulativeCanvas() {
  const [manipulatives, setManipulatives] = useState<Manipulative[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Add a new manipulative
  const addManipulative = (type: Manipulative['type']) => {
    const newManipulative: Manipulative = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      width: type === 'number-line' ? 400 : 200,
      height: type === 'number-line' ? 80 : 60,
      data: getDefaultData(type)
    };
    
    setManipulatives([...manipulatives, newManipulative]);
    setSelectedId(newManipulative.id);
  };
  
  const getDefaultData = (type: Manipulative['type']): any => {
    switch (type) {
      case 'fraction-bar':
        return { parts: 4, filled: 0, color: '#5B21B6' } as FractionBarData;
      case 'number-line':
        return { min: 0, max: 10, step: 1, marks: [] } as NumberLineData;
      default:
        return {};
    }
  };
  
  // Update manipulative data
  const updateManipulative = (id: string, updates: Partial<Manipulative>) => {
    setManipulatives(manipulatives.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  };
  
  // Delete selected manipulative
  const deleteSelected = () => {
    if (selectedId) {
      setManipulatives(manipulatives.filter(m => m.id !== selectedId));
      setSelectedId(null);
    }
  };
  
  // Handle dragging
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragId: string | null;
    offset: { x: number; y: number };
  }>({ isDragging: false, dragId: null, offset: { x: 0, y: 0 } });
  
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const manipulative = manipulatives.find(m => m.id === id);
    if (!manipulative) return;
    
    setSelectedId(id);
    setDragState({
      isDragging: true,
      dragId: id,
      offset: {
        x: e.clientX - manipulative.x,
        y: e.clientY - manipulative.y
      }
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.dragId) return;
    
    const newX = e.clientX - dragState.offset.x;
    const newY = e.clientY - dragState.offset.y;
    
    updateManipulative(dragState.dragId, { x: newX, y: newY });
  };
  
  const handleMouseUp = () => {
    setDragState({ isDragging: false, dragId: null, offset: { x: 0, y: 0 } });
  };
  
  // Render manipulative based on type
  const renderManipulative = (m: Manipulative) => {
    const commonProps = {
      key: m.id,
      id: m.id,
      x: m.x,
      y: m.y,
      width: m.width,
      height: m.height,
      selected: m.id === selectedId,
      onUpdate: (data: any) => updateManipulative(m.id, { data })
    };
    
    switch (m.type) {
      case 'fraction-bar':
        return <FractionBar {...commonProps} data={m.data as FractionBarData} />;
      case 'number-line':
        return <NumberLine {...commonProps} data={m.data as NumberLineData} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="manipulative-canvas-container">
      <div className="toolbar">
        <button onClick={() => addManipulative('fraction-bar')} className="tool-button">
          + Fraction Bar
        </button>
        <button onClick={() => addManipulative('number-line')} className="tool-button">
          + Number Line
        </button>
        <button onClick={() => setShowGrid(!showGrid)} className={`tool-button ${showGrid ? 'active' : ''}`}>
          {showGrid ? '◼' : '◻'} Grid
        </button>
        {selectedId && (
          <button onClick={deleteSelected} className="tool-button delete">
            Delete Selected
          </button>
        )}
      </div>
      
      <div 
        className={`canvas-area ${showGrid ? 'show-grid' : ''}`}
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drawing layer */}
        <div className="drawing-layer">
          <DrawingCanvas />
        </div>
        
        {/* Manipulatives layer */}
        <svg className="manipulatives-layer">
          {manipulatives.map(m => (
            <g
              key={m.id}
              onMouseDown={(e) => handleMouseDown(e, m.id)}
              style={{ cursor: dragState.isDragging && dragState.dragId === m.id ? 'grabbing' : 'grab' }}
            >
              {renderManipulative(m)}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}