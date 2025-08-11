'use client'

import { designSystem } from '@/lib/design'
import AccessibleButton from './AccessibleButton'

type ToolMode = 'pointer' | 'pencil'

type DrawingTool = 'pen' | 'eraser'

interface CanvasToolbarProps {
  currentColor: string
  onChangeColor: (c: string) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onInsert: () => void
  canUndo: boolean
  canRedo: boolean
  toolMode: ToolMode
  onToolModeChange: (mode: ToolMode) => void
  drawingTool: DrawingTool
  onDrawingToolChange: (tool: DrawingTool) => void
}

const crayonPalette = [
  designSystem.colors.drawing.blue,
  designSystem.colors.drawing.green,
  designSystem.colors.drawing.purple,
  designSystem.colors.drawing.orange,
]

const CanvasToolbar = ({
  currentColor,
  onChangeColor,
  onUndo,
  onRedo,
  onClear,
  onInsert,
  canUndo,
  canRedo,
  toolMode,
  onToolModeChange,
  drawingTool,
  onDrawingToolChange
}: CanvasToolbarProps) => {
  return (
    <div className="flex items-center gap-3 p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-white/20">
      
      {/* Tool Mode Switch */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onToolModeChange('pointer')}
          className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all duration-short ${
            toolMode === 'pointer' 
              ? 'bg-blue-500 text-white shadow-sm' 
              : 'bg-transparent text-gray-600 hover:bg-gray-200'
          }`}
          aria-label="Pointer tool - interact with widgets"
          title="Pointer: Click and drag widgets"
        >
          🖱️
        </button>
        <button
          onClick={() => onToolModeChange('pencil')}
          className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all duration-short ${
            toolMode === 'pencil' 
              ? 'bg-green-500 text-white shadow-sm' 
              : 'bg-transparent text-gray-600 hover:bg-gray-200'
          }`}
          aria-label="Pencil tool - draw on canvas"
          title="Pencil: Draw and sketch"
        >
          ✏️
        </button>
      </div>

      <div className="h-6 w-px bg-gray-200" />
      
      {/* Drawing Tools - only show in pencil mode */}
      {toolMode === 'pencil' && (
        <>
          {/* Pen/Eraser Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onDrawingToolChange('pen')}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all duration-short ${
                drawingTool === 'pen' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Pen tool"
              title="Pen: Draw with color"
            >
              ✏️
            </button>
            <button
              onClick={() => onDrawingToolChange('eraser')}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all duration-short ${
                drawingTool === 'eraser' 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Eraser tool"
              title="Eraser: Remove drawings"
            >
              🗑️
            </button>
          </div>
          
          <div className="h-6 w-px bg-gray-200" />
          
          {/* Colors - only show for pen tool */}
          {drawingTool === 'pen' && (
            <>
              <div className="flex items-center gap-2">
                {crayonPalette.map((color, index) => (
                  <button
                    key={`color-${index}`}
                    onClick={() => onChangeColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform duration-short shadow-sm ${
                      currentColor === color ? 'ring-2 ring-primary border-white scale-110' : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${index + 1}`}
                    aria-pressed={currentColor === color}
                  />
                ))}
              </div>
              <div className="h-6 w-px bg-gray-200" />
            </>
          )}
        </>
      )}

      {/* Actions: Undo/Redo - only show in pencil mode */}
      {toolMode === 'pencil' && (
        <>
          <div className="flex items-center gap-1">
            <AccessibleButton
              variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}
              aria-label="Undo last action" className="w-10 h-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </AccessibleButton>
            <AccessibleButton
              variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}
              aria-label="Redo last action" className="w-10 h-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
            </AccessibleButton>
          </div>
          
          <div className="h-6 w-px bg-gray-200" />
        </>
      )}

      {/* Clear Button - show in both modes */}
      <AccessibleButton
        variant="ghost" size="sm" onClick={onClear}
        aria-label="Clear all drawings" className="w-10 h-10 text-gray-500 hover:text-red-500"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </AccessibleButton>

      <div className="h-6 w-px bg-gray-200" />

      {/* Insert Manipulative Button */}
      <AccessibleButton
        variant="secondary" size="sm" onClick={onInsert}
        aria-label="Insert manipulative" className="w-10 h-10 font-bold text-lg"
      >
        +
      </AccessibleButton>
    </div>
  )
}

export default CanvasToolbar
