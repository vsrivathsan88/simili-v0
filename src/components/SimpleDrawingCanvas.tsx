'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useGeminiLiveTutor } from '@/components/GeminiLiveTutor'

interface Point {
  x: number
  y: number
}

interface DrawingPath {
  points: Point[]
  color: string
  width: number
  timestamp: number
}

export default function SimpleDrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [paths, setPaths] = useState<DrawingPath[]>([])
  const [strokeColor, setStrokeColor] = useState('#2563eb')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const lastUpdateRef = useRef<number>(0)

  const tutor = useGeminiLiveTutor()

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    context.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Set drawing properties
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = strokeColor
    context.lineWidth = strokeWidth

    contextRef.current = context
  }, [strokeColor, strokeWidth])

  // Redraw all paths
  const redrawCanvas = useCallback(() => {
    const context = contextRef.current
    const canvas = canvasRef.current
    if (!context || !canvas) return

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all paths
    paths.forEach(path => {
      if (path.points.length < 2) return

      context.beginPath()
      context.strokeStyle = path.color
      context.lineWidth = path.width

      context.moveTo(path.points[0].x, path.points[0].y)
      path.points.forEach(point => {
        context.lineTo(point.x, point.y)
      })
      context.stroke()
    })

    // Draw current path
    if (currentPath.length > 1) {
      context.beginPath()
      context.strokeStyle = strokeColor
      context.lineWidth = strokeWidth

      context.moveTo(currentPath[0].x, currentPath[0].y)
      currentPath.forEach(point => {
        context.lineTo(point.x, point.y)
      })
      context.stroke()
    }
  }, [paths, currentPath, strokeColor, strokeWidth])

  // Send canvas to tutor periodically
  const sendCanvasUpdate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !tutor.connected || !tutor.setupComplete) return

    const now = Date.now()
    if (now - lastUpdateRef.current > 3000) { // Max once per 3 seconds
      tutor.sendCanvasUpdate(canvas)
      lastUpdateRef.current = now
    }
  }, [tutor])

  // Mouse/touch handlers
  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const point = getPoint(e)
    setIsDrawing(true)
    setCurrentPath([point])
  }, [getPoint])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()

    const point = getPoint(e)
    setCurrentPath(prev => [...prev, point])
  }, [isDrawing, getPoint])

  const stopDrawing = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false)
      setCurrentPath([])
      return
    }

    // Save current path
    const newPath: DrawingPath = {
      points: currentPath,
      color: strokeColor,
      width: strokeWidth,
      timestamp: Date.now()
    }

    setPaths(prev => [...prev, newPath])
    setCurrentPath([])
    setIsDrawing(false)

    // Send update to tutor
    setTimeout(sendCanvasUpdate, 100)
  }, [isDrawing, currentPath, strokeColor, strokeWidth, sendCanvasUpdate])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setPaths([])
    setCurrentPath([])
    const context = contextRef.current
    const canvas = canvasRef.current
    if (context && canvas) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  // Undo last path
  const undo = useCallback(() => {
    if (paths.length > 0) {
      setPaths(prev => prev.slice(0, -1))
    }
  }, [paths])

  // Redraw when paths change
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center space-x-3">
        {/* Color Picker */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Color:</span>
          <div className="flex space-x-1">
            {['#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#1f2937'].map(color => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  strokeColor === color ? 'border-gray-400' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Brush Size */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Size:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-16"
          />
          <span className="text-xs text-gray-500 w-6">{strokeWidth}px</span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 border-l border-gray-200 pl-3">
          <button
            onClick={undo}
            disabled={paths.length === 0}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
          >
            Undo
          </button>
          <button
            onClick={clearCanvas}
            disabled={paths.length === 0}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-red-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className={`w-2 h-2 rounded-full ${
          tutor.connected && tutor.setupComplete 
            ? 'bg-green-500 animate-pulse' 
            : tutor.connected 
            ? 'bg-yellow-500' 
            : 'bg-red-500'
        }`} />
        <span className="text-xs font-medium text-gray-700">
          {tutor.connected && tutor.setupComplete 
            ? 'Pi is watching' 
            : tutor.connected 
            ? 'Connecting...' 
            : 'Offline'
          }
        </span>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-500 font-medium">
        ✨ Draw your mathematical thinking here!
      </div>

      {/* Stats */}
      {paths.length > 0 && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          {paths.length} drawing{paths.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
