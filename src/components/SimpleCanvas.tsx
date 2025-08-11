'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import rough from 'roughjs'
import { designSystem } from '@/lib/design'
import CanvasToolbar from '@/components/CanvasToolbar'
import ManipulativeMenu from '@/components/ManipulativeMenu'
import NumberLine from '@/components/NumberLine'
import GraphPaper from '@/components/GraphPaper'
import FractionBar from '@/components/FractionBar'
import GeometricShape from '@/components/GeometricShape'
import Calculator from '@/components/Calculator'
import { detectShape, analyzeDrawing, type DetectedShape, type SmartSuggestion } from '@/lib/shapeDetection'
import { useSessionManager } from '@/lib/sessionManager'

interface CanvasPoint {
  x: number
  y: number
}

interface DrawingPath {
  id: string
  points: CanvasPoint[]
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

interface Manipulative {
  id: string
  type: 'number-line' | 'graph-paper' | 'fraction-bar' | 'circle' | 'square' | 'triangle' | 'calculator'
  x: number
  y: number
  shapeType?: 'circle' | 'square' | 'triangle'
  state?: any // Widget-specific state for session management
}

type ToolMode = 'pointer' | 'pencil'

interface SimpleCanvasProps {
  onPathsChange?: (hasPaths: boolean) => void
  onShapeDetected?: (shapes: DetectedShape[], suggestions: string[], smartSuggestions: SmartSuggestion[]) => void
}

const SimpleCanvas = ({ onPathsChange, onShapeDetected }: SimpleCanvasProps) => {
  const sessionManager = useSessionManager()
  const onPathsChangeRef = useRef(onPathsChange)
  const onShapeDetectedRef = useRef(onShapeDetected)
  
  // Update refs when props change
  useEffect(() => {
    onPathsChangeRef.current = onPathsChange
    onShapeDetectedRef.current = onShapeDetected
  })
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<CanvasPoint[]>([])
  const [paths, setPaths] = useState<DrawingPath[]>([])
  const [pathHistory, setPathHistory] = useState<DrawingPath[][]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [currentColor, setCurrentColor] = useState(designSystem.colors.drawing.blue)
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [showManipulativeMenu, setShowManipulativeMenu] = useState(false)
  const [manipulatives, setManipulatives] = useState<Manipulative[]>([])
  const [activeManipulative, setActiveManipulative] = useState<string | null>(null)
  const [toolMode, setToolMode] = useState<ToolMode>('pointer') // Start in pointer mode
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen')

  const getMousePos = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const CTM = svg.getScreenCTM()
    if (!CTM) return { x: 0, y: 0 }
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d,
    }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // Only draw in pencil mode
    if (toolMode === 'pencil') {
      setIsDrawing(true)
      setCurrentPath([getMousePos(e)])
    }
  }, [getMousePos, toolMode])

  const draw = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || toolMode !== 'pencil') return
    setCurrentPath((prev) => [...prev, getMousePos(e)])
  }, [isDrawing, getMousePos, toolMode])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    if (currentPath.length > 1) {
      const newPath: DrawingPath = {
        id: Date.now().toString(),
        points: currentPath,
        color: drawingTool === 'eraser' ? 'white' : currentColor,
        width: drawingTool === 'eraser' ? strokeWidth * 2 : strokeWidth,
        tool: drawingTool,
      }
      const newPaths = [...paths, newPath]
      setPaths(newPaths)
      setPathHistory([...pathHistory, newPaths])
      setHistoryStep(pathHistory.length)
      
      // Broadcast drawing event for ambient agent
      window.dispatchEvent(new CustomEvent('simili-drawing-event', {
        detail: {
          type: 'path_completed',
          pathLength: newPath.points.length,
          tool: drawingTool,
          color: currentColor,
          timestamp: Date.now()
        }
      }))
      
      // Save to session with current manipulatives
      sessionManager.saveSession(newPaths, manipulatives)
      
      // Log drawing activity
      if (drawingTool === 'pen') {
        sessionManager.logActivity('shape_drawn', { shapesDetected: [] })
      }
      
      // Only analyze for shapes and suggestions if no manipulatives are active
      if (manipulatives.length === 0) {
        const analysis = analyzeDrawing(newPaths)
        onShapeDetectedRef.current?.(analysis.shapes, analysis.suggestions, analysis.smartSuggestions)
      } else {
        // Clear Pi suggestions when manipulatives are active
        onShapeDetectedRef.current?.([], [], [])
      }
    }
    setCurrentPath([])
  }, [currentPath, currentColor, strokeWidth, drawingTool, paths, pathHistory, manipulatives]) // Removed onShapeDetected to prevent loops

  // Load session data on component mount (run only once)
  useEffect(() => {
    const currentSession = sessionManager.getCurrentSession()
    if (currentSession) {
      console.log('🔄 Restoring session:', currentSession.name)
      console.log('📊 Restoring paths:', currentSession.paths.length)
      console.log('🔧 Restoring manipulatives:', currentSession.manipulatives.length)
      
      // Restore drawing paths
      if (currentSession.paths.length > 0) {
        setPaths(currentSession.paths)
        setPathHistory([currentSession.paths])
        setHistoryStep(0)
        onPathsChangeRef.current?.(true)
      }
      
      // Restore manipulatives
      if (currentSession.manipulatives.length > 0) {
        setManipulatives(currentSession.manipulatives as Manipulative[])
      }
    }
  }, []) // Empty dependency array - run only on mount

  // Listen for voice commands (after all functions are defined)
  useEffect(() => {
    const handleModeChange = (event: any) => {
      setToolMode(event.detail.mode)
    }
    
    window.addEventListener('simili-mode-change', handleModeChange)
    
    return () => {
      window.removeEventListener('simili-mode-change', handleModeChange)
    }
  }, [])

  // Render paths using rough.js
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const rc = rough.svg(svg)
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    // Completed paths
    paths.forEach(path => {
      if (path.points.length > 1) {
        const d = `M${path.points.map(p => `${p.x},${p.y}`).join('L')}`
        const roughPath = rc.path(d, {
          stroke: path.color,
          strokeWidth: path.width,
          roughness: designSystem.roughness.normal,
          bowing: 0.4
        })
        svg.appendChild(roughPath)
      }
    })

    // Current path
    if (currentPath.length > 1) {
      const d = `M${currentPath.map(p => `${p.x},${p.y}`).join('L')}`
      const roughPath = rc.path(d, {
        stroke: currentColor,
        strokeWidth: strokeWidth,
        roughness: designSystem.roughness.subtle,
        bowing: 0.2
      })
      roughPath.style.opacity = '0.9'
      svg.appendChild(roughPath)
    }
  }, [paths, currentPath, currentColor, strokeWidth])

  const saveToHistory = useCallback(() => {
    setPathHistory(prev => [...prev.slice(0, historyStep + 1), [...paths]])
    setHistoryStep(prev => prev + 1)
  }, [paths, historyStep])

  const undo = useCallback(() => {
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1)
      setPaths(pathHistory[historyStep - 1] || [])
    }
  }, [historyStep, pathHistory])

  const redo = useCallback(() => {
    if (historyStep < pathHistory.length - 1) {
      setHistoryStep(prev => prev + 1)
      setPaths(pathHistory[historyStep + 1])
    }
  }, [historyStep, pathHistory])

  const clearCanvas = useCallback(() => {
    saveToHistory()
    setPaths([])
    setCurrentPath([])
    onPathsChangeRef.current?.(false)
  }, [saveToHistory])

  // Add voice command listeners for canvas actions (after functions are defined)
  useEffect(() => {
    const handleClearCanvas = () => clearCanvas()
    const handleUndo = () => undo()
    const handleRedo = () => redo()
    
    window.addEventListener('simili-clear-canvas', handleClearCanvas)
    window.addEventListener('simili-undo', handleUndo)
    window.addEventListener('simili-redo', handleRedo)
    
    return () => {
      window.removeEventListener('simili-clear-canvas', handleClearCanvas)
      window.removeEventListener('simili-undo', handleUndo)
      window.removeEventListener('simili-redo', handleRedo)
    }
  }, [clearCanvas, undo, redo])

  // Notify parent when paths change
  useEffect(() => {
    onPathsChangeRef.current?.(paths.length > 0)
  }, [paths.length]) // Remove onPathsChange from deps to prevent infinite loop

  const handleInsert = useCallback(() => {
    setShowManipulativeMenu(true)
  }, [])

  const handleManipulativeSelect = useCallback((type: 'number-line' | 'graph-paper' | 'fraction-bar' | 'circle' | 'square' | 'triangle' | 'calculator') => {
    // Student-friendly: Only allow one manipulative at a time
    setManipulatives([]) // Clear existing manipulatives
    
    const newManipulative: Manipulative = {
      id: `${type}-${Date.now()}`,
      type,
      x: 150, // Center-ish position
      y: 100,
      shapeType: ['circle', 'square', 'triangle'].includes(type) ? type as 'circle' | 'square' | 'triangle' : undefined
    }
    
    // Broadcast manipulative event for ambient agent
    window.dispatchEvent(new CustomEvent('simili-manipulative-event', {
      detail: {
        type: 'tool_added',
        manipulativeType: type,
        timestamp: Date.now()
      }
    }))
    setManipulatives([newManipulative]) // Add only the new one
    setActiveManipulative(newManipulative.id)
    setShowManipulativeMenu(false)
    console.log('📐 Added', type, 'to canvas')
  }, [])

  const handleRemoveManipulative = useCallback((id: string) => {
    setManipulatives(prev => prev.filter(m => m.id !== id))
    if (activeManipulative === id) {
      setActiveManipulative(null)
    }
    console.log('🗑️ Removed manipulative from canvas')
  }, [activeManipulative])

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden"
         style={{
           backgroundImage: `
             radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.04) 1px, transparent 0)
           `,
           backgroundSize: '20px 20px',
         }}>
      
      {/* Floating Toolbar - always visible but cleaner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <CanvasToolbar
          currentColor={currentColor}
          onChangeColor={setCurrentColor}
          onUndo={undo}
          onRedo={redo}
          onClear={clearCanvas}
          onInsert={handleInsert}
          canUndo={historyStep > 0}
          canRedo={historyStep < pathHistory.length - 1}
          toolMode={toolMode}
          onToolModeChange={setToolMode}
          drawingTool={drawingTool}
          onDrawingToolChange={setDrawingTool}
        />
        
        {/* Manipulative Menu */}
        <ManipulativeMenu
          isOpen={showManipulativeMenu}
          onClose={() => setShowManipulativeMenu(false)}
          onSelect={handleManipulativeSelect}
        />
      </div>

      {/* Manipulatives Layer - interactive in pointer mode */}
      <div className={`absolute inset-0 z-10 ${
        toolMode === 'pointer' ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {manipulatives.map((manipulative) => {
          const isActive = activeManipulative === manipulative.id
          
          if (manipulative.type === 'number-line') {
            return (
              <NumberLine
                key={manipulative.id}
                id={manipulative.id}
                x={manipulative.x}
                y={manipulative.y}
                onRemove={handleRemoveManipulative}
              />
            )
          } else if (manipulative.type === 'graph-paper') {
            return (
              <GraphPaper
                key={manipulative.id}
                id={manipulative.id}
                x={manipulative.x}
                y={manipulative.y}
                onRemove={handleRemoveManipulative}
              />
            )
          } else if (manipulative.type === 'fraction-bar') {
            return (
              <FractionBar
                key={manipulative.id}
                id={manipulative.id}
                x={manipulative.x}
                y={manipulative.y}
                onRemove={handleRemoveManipulative}
              />
            )
          } else if (['circle', 'square', 'triangle'].includes(manipulative.type)) {
            return (
              <GeometricShape
                key={manipulative.id}
                id={manipulative.id}
                x={manipulative.x}
                y={manipulative.y}
                shapeType={manipulative.shapeType!}
                onRemove={handleRemoveManipulative}
              />
            )
          } else if (manipulative.type === 'calculator') {
            return (
              <Calculator
                key={manipulative.id}
                id={manipulative.id}
                x={manipulative.x}
                y={manipulative.y}
                onRemove={handleRemoveManipulative}
              />
            )
          }
          return null
        })}
      </div>
      
      {/* Mode indicator */}
      <div className="absolute bottom-4 left-4 z-30">
        <div className={`rounded-lg px-3 py-2 shadow-sm border ${
          toolMode === 'pointer' 
            ? 'bg-blue-100 border-blue-300' 
            : 'bg-green-100 border-green-300'
        }`}>
          <div className={`text-sm font-medium ${
            toolMode === 'pointer' ? 'text-blue-800' : 'text-green-800'
          }`}>
            {toolMode === 'pointer' ? '🖱️ Pointer Mode' : '✏️ Pencil Mode'}
          </div>
          <div className={`text-xs ${
            toolMode === 'pointer' ? 'text-blue-600' : 'text-green-600'
          }`}>
            {toolMode === 'pointer' 
              ? 'Click and drag widgets • Use widget controls' 
              : 'Draw and sketch • Select colors'
            }
          </div>
          {activeManipulative && manipulatives.length > 0 && (
            <div className="text-xs text-gray-600 mt-1">
              Active: {manipulatives[0].type.replace('-', ' ')}
            </div>
          )}
        </div>
      </div>

      {/* Main SVG drawing surface */}
      <svg
        ref={svgRef}
        className={`absolute inset-0 w-full h-full z-20 ${
          toolMode === 'pencil' 
            ? 'cursor-crosshair' 
            : 'cursor-default'
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          pointerEvents: toolMode === 'pencil' ? 'all' : 'none',
          cursor: toolMode === 'pencil' ? (drawingTool === 'eraser' ? 'crosshair' : 'crosshair') : 'default'
        }}
      >
        {/* Drawing paths render here */}
      </svg>
    </div>
  )
}

export default SimpleCanvas