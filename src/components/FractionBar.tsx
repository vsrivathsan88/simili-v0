'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import rough from 'roughjs'
import Draggable from 'react-draggable'
import { designSystem } from '@/lib/design'
import AccessibleButton from './AccessibleButton'

interface FractionBarProps {
  id: string
  x?: number
  y?: number
  onRemove?: (id: string) => void
}

const FractionBar = ({ id, x = 100, y = 100, onRemove }: FractionBarProps) => {
  const nodeRef = useRef(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [totalParts, setTotalParts] = useState(4)
  const [filledParts, setFilledParts] = useState(0)
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)

  const barWidth = 300
  const barHeight = 60
  const padding = 20

  const getEquivalentFraction = () => {
    if (filledParts === 0) return { simplified: '0', decimal: '0', percentage: '0%' }
    
    // Simplify fraction
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(filledParts, totalParts)
    const simplifiedNum = filledParts / divisor
    const simplifiedDen = totalParts / divisor
    
    const decimal = (filledParts / totalParts).toFixed(2)
    const percentage = Math.round((filledParts / totalParts) * 100)
    
    return {
      simplified: simplifiedDen === 1 ? simplifiedNum.toString() : `${simplifiedNum}/${simplifiedDen}`,
      decimal: decimal,
      percentage: `${percentage}%`
    }
  }

  const toggleSegment = (segmentIndex: number) => {
    if (segmentIndex < filledParts) {
      // Clicking on a filled segment - reduce filled parts to this point
      setFilledParts(segmentIndex)
    } else {
      // Clicking on an empty segment - fill up to this point
      setFilledParts(segmentIndex + 1)
    }
  }

  const draw = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    svg.innerHTML = ''
    const rc = rough.svg(svg)

    const segmentWidth = barWidth / totalParts

    // Draw each segment
    for (let i = 0; i < totalParts; i++) {
      const x = padding + i * segmentWidth
      const isFilled = i < filledParts
      const isHovered = hoveredSegment === i
      
      // Segment rectangle
      const segmentElement = rc.rectangle(x, padding, segmentWidth, barHeight, {
        fill: isFilled ? designSystem.colors.drawing.blue : 'white',
        stroke: designSystem.colors.ink,
        strokeWidth: 2,
        fillStyle: isFilled ? 'solid' : 'hachure',
        roughness: designSystem.roughness.normal,
        hachureGap: 8
      })
      svg.appendChild(segmentElement)

      // Hover highlight
      if (isHovered) {
        const hoverElement = rc.rectangle(x, padding, segmentWidth, barHeight, {
          stroke: '#3b82f6',
          strokeWidth: 3,
          fill: 'rgba(59, 130, 246, 0.1)',
          fillStyle: 'solid',
          roughness: designSystem.roughness.subtle
        })
        svg.appendChild(hoverElement)
      }

      // Segment number
      const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      textElement.setAttribute('x', (x + segmentWidth / 2).toString())
      textElement.setAttribute('y', (padding + barHeight / 2 + 5).toString())
      textElement.setAttribute('text-anchor', 'middle')
      textElement.setAttribute('font-size', '12')
      textElement.setAttribute('font-weight', 'bold')
      textElement.setAttribute('fill', isFilled ? 'white' : designSystem.colors.ink)
      textElement.setAttribute('cursor', 'pointer')
      textElement.textContent = (i + 1).toString()
      
      // Make segments clickable
      const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      clickArea.setAttribute('x', x.toString())
      clickArea.setAttribute('y', padding.toString())
      clickArea.setAttribute('width', segmentWidth.toString())
      clickArea.setAttribute('height', barHeight.toString())
      clickArea.setAttribute('fill', 'transparent')
      clickArea.setAttribute('cursor', 'pointer')
      
      clickArea.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleSegment(i)
      })
      
      clickArea.addEventListener('mouseenter', () => setHoveredSegment(i))
      clickArea.addEventListener('mouseleave', () => setHoveredSegment(null))
      
      svg.appendChild(clickArea)
      svg.appendChild(textElement)
    }

    // Draw fraction label
    const fractionElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    fractionElement.setAttribute('x', (padding + barWidth / 2).toString())
    fractionElement.setAttribute('y', (padding + barHeight + 25).toString())
    fractionElement.setAttribute('text-anchor', 'middle')
    fractionElement.setAttribute('font-size', '16')
    fractionElement.setAttribute('font-weight', 'bold')
    fractionElement.setAttribute('fill', designSystem.colors.drawing.blue)
    fractionElement.textContent = `${filledParts}/${totalParts}`
    svg.appendChild(fractionElement)

    // Draw equivalents
    const equivalents = getEquivalentFraction()
    if (filledParts > 0 && equivalents.simplified !== `${filledParts}/${totalParts}`) {
      const equivElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      equivElement.setAttribute('x', (padding + barWidth / 2).toString())
      equivElement.setAttribute('y', (padding + barHeight + 45).toString())
      equivElement.setAttribute('text-anchor', 'middle')
      equivElement.setAttribute('font-size', '12')
      equivElement.setAttribute('fill', '#6b7280')
      equivElement.textContent = `= ${equivalents.simplified} = ${equivalents.decimal} = ${equivalents.percentage}`
      svg.appendChild(equivElement)
    }

    // Removed instruction text per user request

  }, [totalParts, filledParts, hoveredSegment])

  useEffect(() => {
    draw()
  }, [draw])

  const adjustParts = (delta: number) => {
    const newTotal = Math.max(2, Math.min(16, totalParts + delta))
    setTotalParts(newTotal)
    setFilledParts(Math.min(filledParts, newTotal))
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
        style={{ width: barWidth + padding * 2 + 40 }}
      >
        {/* Simple header with controls */}
        <div className="drag-handle cursor-move bg-gray-50 -m-3 mb-2 p-2 rounded-t-lg border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Fraction Bar</span>
            <div className="flex items-center gap-1">
              <AccessibleButton
                onClick={() => adjustParts(-1)}
                className="w-6 h-6 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                aria-label="Fewer parts"
              >
                −
              </AccessibleButton>
              <span className="text-xs text-gray-600 min-w-[2rem] text-center font-mono">
                {totalParts}
              </span>
              <AccessibleButton
                onClick={() => adjustParts(1)}
                className="w-6 h-6 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                aria-label="More parts"
              >
                +
              </AccessibleButton>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <AccessibleButton
              onClick={() => setFilledParts(0)}
              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              aria-label="Clear"
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
          width={barWidth + padding * 2}
          height={barHeight + 70}
          className="cursor-pointer"
        />
      </div>
    </Draggable>
  )
}

export default FractionBar