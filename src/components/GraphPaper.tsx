'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Draggable from 'react-draggable'
import rough from 'roughjs'
import { designSystem } from '@/lib/design'
import AccessibleButton from './AccessibleButton'

interface GraphPaperProps {
  id: string
  x?: number
  y?: number
  onRemove?: (id: string) => void
}

interface PlottedPoint {
  x: number
  y: number
  id: string
  color: string
  label?: string
}

const GraphPaper = ({ id, x = 50, y = 50, onRemove }: GraphPaperProps) => {
  const nodeRef = useRef(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [gridSize, setGridSize] = useState(20)
  const [points, setPoints] = useState<PlottedPoint[]>([])
  const [showAxis, setShowAxis] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null)

  const paperWidth = 300
  const paperHeight = 200
  const padding = 40

  const getGridCoordinates = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null

    const rect = svg.getBoundingClientRect()
    const svgX = clientX - rect.left
    const svgY = clientY - rect.top

    // Convert to grid coordinates (center is 0,0)
    const centerX = paperWidth / 2 + padding
    const centerY = paperHeight / 2 + padding
    const gridX = Math.round((svgX - centerX) / gridSize)
    const gridY = Math.round((centerY - svgY) / gridSize) // Flip Y axis

    return { x: gridX, y: gridY }
  }

  const togglePoint = (gridX: number, gridY: number) => {
    const existingIndex = points.findIndex(p => p.x === gridX && p.y === gridY)
    
    if (existingIndex >= 0) {
      setPoints(prev => prev.filter((_, index) => index !== existingIndex))
    } else {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      const newPoint: PlottedPoint = {
        x: gridX,
        y: gridY,
        id: `point-${Date.now()}`,
        color: colors[points.length % colors.length],
        label: `(${gridX},${gridY})`
      }
      setPoints(prev => [...prev, newPoint])
    }
  }

  const draw = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    svg.innerHTML = ''
    const rc = rough.svg(svg)

    const centerX = paperWidth / 2 + padding
    const centerY = paperHeight / 2 + padding

    // Draw grid lines
    const gridLines = Math.max(paperWidth, paperHeight) / gridSize
    for (let i = -gridLines; i <= gridLines; i++) {
      // Vertical lines
      const x = centerX + i * gridSize
      if (x >= padding && x <= paperWidth + padding) {
        const line = rc.line(x, padding, x, paperHeight + padding, {
          stroke: i === 0 && showAxis ? designSystem.colors.ink : '#e5e7eb',
          strokeWidth: i === 0 && showAxis ? 2 : 1,
          roughness: designSystem.roughness.subtle
        })
        svg.appendChild(line)
      }

      // Horizontal lines
      const y = centerY + i * gridSize
      if (y >= padding && y <= paperHeight + padding) {
        const line = rc.line(padding, y, paperWidth + padding, y, {
          stroke: i === 0 && showAxis ? designSystem.colors.ink : '#e5e7eb',
          strokeWidth: i === 0 && showAxis ? 2 : 1,
          roughness: designSystem.roughness.subtle
        })
        svg.appendChild(line)
      }
    }

    // Draw axis labels
    if (showAxis) {
      for (let i = -10; i <= 10; i++) {
        if (i === 0) continue
        
        const x = centerX + i * gridSize
        const y = centerY + i * gridSize
        
        // X-axis labels
        if (x >= padding && x <= paperWidth + padding) {
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          label.setAttribute('x', x.toString())
          label.setAttribute('y', (centerY + 15).toString())
          label.setAttribute('text-anchor', 'middle')
          label.setAttribute('font-size', '10')
          label.setAttribute('fill', '#6b7280')
          label.textContent = i.toString()
          svg.appendChild(label)
        }

        // Y-axis labels
        if (y >= padding && y <= paperHeight + padding) {
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          label.setAttribute('x', (centerX - 10).toString())
          label.setAttribute('y', (y + 3).toString())
          label.setAttribute('text-anchor', 'middle')
          label.setAttribute('font-size', '10')
          label.setAttribute('fill', '#6b7280')
          label.textContent = (-i).toString() // Flip for proper Y-axis
          svg.appendChild(label)
        }
      }
    }

    // Draw hover indicator
    if (hoveredCell) {
      const hoverX = centerX + hoveredCell.x * gridSize
      const hoverY = centerY - hoveredCell.y * gridSize
      const hoverRect = rc.rectangle(hoverX - gridSize/2, hoverY - gridSize/2, gridSize, gridSize, {
        fill: 'rgba(59, 130, 246, 0.2)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        fillStyle: 'solid',
        roughness: designSystem.roughness.subtle
      })
      svg.appendChild(hoverRect)
    }

    // Draw plotted points
    points.forEach(point => {
      const pointX = centerX + point.x * gridSize
      const pointY = centerY - point.y * gridSize
      
      const pointElement = rc.circle(pointX, pointY, 12, {
        fill: point.color,
        stroke: point.color,
        fillStyle: 'solid',
        roughness: designSystem.roughness.normal
      })
      svg.appendChild(pointElement)

      // Point label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      label.setAttribute('x', (pointX + 15).toString())
      label.setAttribute('y', (pointY - 5).toString())
      label.setAttribute('font-size', '10')
      label.setAttribute('font-weight', 'bold')
      label.setAttribute('fill', point.color)
      label.textContent = point.label || ''
      svg.appendChild(label)
    })

  }, [gridSize, points, showAxis, hoveredCell])

  useEffect(() => {
    draw()
  }, [draw])

  const clearPoints = () => {
    setPoints([])
  }

  const adjustGridSize = (delta: number) => {
    setGridSize(prev => Math.max(10, Math.min(40, prev + delta)))
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x, y }}
      handle=".drag-handle"
    >
      <div 
        ref={nodeRef}
        className="absolute z-10 bg-white/95 rounded-lg shadow-lg border border-gray-200 p-3"
        style={{ width: paperWidth + padding * 2 + 40 }}
      >
        {/* Header with controls */}
        <div className="drag-handle cursor-move bg-gray-50 -m-3 mb-2 p-2 rounded-t-lg border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Graph Paper</span>
            <div className="flex items-center gap-1">
              <AccessibleButton
                onClick={() => adjustGridSize(-5)}
                className="w-6 h-6 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                aria-label="Smaller grid"
              >
                −
              </AccessibleButton>
              <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                {gridSize}px
              </span>
              <AccessibleButton
                onClick={() => adjustGridSize(5)}
                className="w-6 h-6 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                aria-label="Larger grid"
              >
                +
              </AccessibleButton>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <AccessibleButton
              onClick={() => setShowAxis(!showAxis)}
              className={`px-2 py-1 text-xs rounded ${showAxis ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              aria-label="Toggle axes"
            >
              XY
            </AccessibleButton>
            <AccessibleButton
              onClick={clearPoints}
              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              aria-label="Clear points"
            >
              Clear
            </AccessibleButton>
            <AccessibleButton
              onClick={() => onRemove?.(id)}
              className="w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
              aria-label="Remove"
            >
              ×
            </AccessibleButton>
          </div>
        </div>

        {/* Interactive SVG */}
        <svg
          ref={svgRef}
          width={paperWidth + padding * 2}
          height={paperHeight + padding * 2}
          className="cursor-pointer"
          onClick={(e) => {
            const coords = getGridCoordinates(e.clientX, e.clientY)
            if (coords) {
              togglePoint(coords.x, coords.y)
            }
          }}
          onMouseMove={(e) => {
            const coords = getGridCoordinates(e.clientX, e.clientY)
            setHoveredCell(coords)
          }}
          onMouseLeave={() => setHoveredCell(null)}
        />
        
        {/* Status */}
        {points.length > 0 && (
          <div className="text-xs text-gray-600 mt-1 text-center">
            {points.length} point{points.length > 1 ? 's' : ''} plotted
          </div>
        )}
      </div>
    </Draggable>
  )
}

export default GraphPaper