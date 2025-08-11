'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import rough from 'roughjs'
import Draggable from 'react-draggable'
import { designSystem } from '@/lib/design'
import AccessibleButton from './AccessibleButton'

interface NumberLineProps {
  id: string
  x?: number
  y?: number
  onRemove?: (id: string) => void
}

interface Marker {
  position: number
  id: string
  color: string
  label?: string
}

const NumberLine = ({ id, x = 50, y = 50, onRemove }: NumberLineProps) => {
  const nodeRef = useRef(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(10)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [hoveredNumber, setHoveredNumber] = useState<number | null>(null)

  const lineWidth = 400
  const lineHeight = 60
  const padding = 40

  const getPositionFromValue = (value: number) => {
    const range = rangeEnd - rangeStart
    return padding + ((value - rangeStart) / range) * lineWidth
  }

  const getValueFromClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return null

    const rect = svg.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const range = rangeEnd - rangeStart
    const relativeX = clickX - padding
    const value = rangeStart + (relativeX / lineWidth) * range
    
    // Snap to integer positions
    return Math.round(value)
  }

  const toggleMarker = (value: number) => {
    const existingMarkerIndex = markers.findIndex(m => m.position === value)
    
    if (existingMarkerIndex >= 0) {
      // Remove existing marker
      setMarkers(prev => prev.filter((_, index) => index !== existingMarkerIndex))
    } else {
      // Add new marker
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      const newMarker: Marker = {
        position: value,
        id: `marker-${Date.now()}`,
        color: colors[markers.length % colors.length],
        label: value.toString()
      }
      setMarkers(prev => [...prev, newMarker])
    }
  }

  const draw = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    svg.innerHTML = ''
    const rc = rough.svg(svg)

    // Draw main line
    const lineElement = rc.line(padding, lineHeight / 2, padding + lineWidth, lineHeight / 2, {
      stroke: designSystem.colors.ink,
      strokeWidth: 3,
      roughness: designSystem.roughness.normal
    })
    svg.appendChild(lineElement)

    // Draw tick marks and numbers
    const range = rangeEnd - rangeStart
    for (let i = 0; i <= range; i++) {
      const value = rangeStart + i
      const x = getPositionFromValue(value)
      
      // Tick mark
      const tickElement = rc.line(x, lineHeight / 2 - 8, x, lineHeight / 2 + 8, {
        stroke: designSystem.colors.ink,
        strokeWidth: 2,
        roughness: designSystem.roughness.subtle
      })
      svg.appendChild(tickElement)

      // Number label with hover effect
      const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      textElement.setAttribute('x', x.toString())
      textElement.setAttribute('y', (lineHeight / 2 + 25).toString())
      textElement.setAttribute('text-anchor', 'middle')
      textElement.setAttribute('font-size', '14')
      textElement.setAttribute('font-weight', 'bold')
      textElement.setAttribute('fill', hoveredNumber === value ? '#3b82f6' : designSystem.colors.ink)
      textElement.setAttribute('cursor', 'pointer')
      textElement.textContent = value.toString()
      
      // Make numbers clickable
      textElement.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleMarker(value)
      })
      
      textElement.addEventListener('mouseenter', () => setHoveredNumber(value))
      textElement.addEventListener('mouseleave', () => setHoveredNumber(null))
      
      svg.appendChild(textElement)
    }

    // Draw markers
    markers.forEach(marker => {
      const x = getPositionFromValue(marker.position)
      
      // Marker circle
      const markerElement = rc.circle(x, lineHeight / 2 - 20, 16, {
        fill: marker.color,
        stroke: marker.color,
        fillStyle: 'solid',
        roughness: designSystem.roughness.normal
      })
      svg.appendChild(markerElement)

      // Marker label
      const labelElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      labelElement.setAttribute('x', x.toString())
      labelElement.setAttribute('y', (lineHeight / 2 - 15).toString())
      labelElement.setAttribute('text-anchor', 'middle')
      labelElement.setAttribute('font-size', '10')
      labelElement.setAttribute('font-weight', 'bold')
      labelElement.setAttribute('fill', 'white')
      labelElement.textContent = marker.label || ''
      svg.appendChild(labelElement)
    })

    // Removed instruction text per user request

  }, [rangeStart, rangeEnd, markers, hoveredNumber])

  useEffect(() => {
    draw()
  }, [draw])

  const shiftRange = (direction: 'left' | 'right') => {
    const shift = direction === 'left' ? -1 : 1
    setRangeStart(prev => prev + shift)
    setRangeEnd(prev => prev + shift)
    // Clear markers that are now out of range
    setMarkers(prev => prev.filter(m => 
      m.position >= rangeStart + shift && m.position <= rangeEnd + shift
    ))
  }

  const clearMarkers = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setMarkers([])
    console.log('Clearing markers, current count:', markers.length)
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
        style={{ width: lineWidth + padding * 2 + 40 }}
      >
        {/* Simple header with controls */}
        <div className="drag-handle cursor-move bg-gray-50 -m-3 mb-2 p-2 rounded-t-lg border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Number Line</span>
            <div className="flex items-center gap-1">
              <AccessibleButton
                onClick={() => shiftRange('left')}
                className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                aria-label="Shift left"
              >
                ←
              </AccessibleButton>
              <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                {rangeStart}-{rangeEnd}
              </span>
              <AccessibleButton
                onClick={() => shiftRange('right')}
                className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                aria-label="Shift right"
              >
                →
              </AccessibleButton>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <AccessibleButton
              onClick={(e) => clearMarkers(e)}
              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              aria-label="Clear markers"
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
          width={lineWidth + padding * 2}
          height={lineHeight + 20}
          className="cursor-pointer"
          onClick={(e) => {
            const value = getValueFromClick(e)
            if (value !== null && value >= rangeStart && value <= rangeEnd) {
              toggleMarker(value)
            }
          }}
        />
        
        {/* Status */}
        {markers.length > 0 && (
          <div className="text-xs text-gray-600 mt-1 text-center">
            {markers.length} marker{markers.length > 1 ? 's' : ''} placed
          </div>
        )}
      </div>
    </Draggable>
  )
}

export default NumberLine