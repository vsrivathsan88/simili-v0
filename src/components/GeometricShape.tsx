'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Draggable from 'react-draggable'
import rough from 'roughjs'
import { designSystem } from '@/lib/design'
import AccessibleButton from './AccessibleButton'

type ShapeType = 'circle' | 'square' | 'triangle'

interface GeometricShapeProps {
  id: string
  x: number
  y: number
  shapeType: ShapeType
  onRemove?: (id: string) => void
}

const crayonPalette = [
  designSystem.colors.drawing.blue,
  designSystem.colors.drawing.green,
  designSystem.colors.drawing.purple,
  designSystem.colors.drawing.orange,
]

const GeometricShape = ({ id, x, y, shapeType, onRemove }: GeometricShapeProps) => {
  const nodeRef = useRef(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState(80)
  const [color, setColor] = useState(designSystem.colors.drawing.blue)
  const [showMeasurements, setShowMeasurements] = useState(true)
  const [showProperties, setShowProperties] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Calculate properties based on shape type and size
  const getShapeProperties = () => {
    switch (shapeType) {
      case 'circle':
        const radius = size / 2
        const circumference = 2 * Math.PI * radius
        const area = Math.PI * radius * radius
        return {
          radius: radius.toFixed(1),
          diameter: (radius * 2).toFixed(1),
          circumference: circumference.toFixed(1),
          area: area.toFixed(1)
        }
      case 'square':
        const squareArea = size * size
        const perimeter = size * 4
        return {
          side: size.toFixed(1),
          perimeter: perimeter.toFixed(1),
          area: squareArea.toFixed(1),
          diagonal: (size * Math.sqrt(2)).toFixed(1)
        }
      case 'triangle':
        // Equilateral triangle
        const triangleArea = (Math.sqrt(3) / 4) * size * size
        const trianglePerimeter = size * 3
        const height = size * (Math.sqrt(3) / 2)
        return {
          side: size.toFixed(1),
          height: height.toFixed(1),
          perimeter: trianglePerimeter.toFixed(1),
          area: triangleArea.toFixed(1)
        }
      default:
        return {}
    }
  }

  const drawShape = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const rc = rough.svg(svg)
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    const options = {
      stroke: color,
      strokeWidth: 3,
      roughness: designSystem.roughness.normal,
      bowing: 0.5,
      fillStyle: 'hachure' as const,
      fill: color + '20', // Semi-transparent fill
    }

    const centerX = 100
    const centerY = 80

    let shapeElement: SVGGElement | null = null
    const properties = getShapeProperties()

    if (shapeType === 'circle') {
      shapeElement = rc.circle(centerX, centerY, size, options)
      
      if (showMeasurements) {
        // Draw radius line
        const radiusLine = rc.line(centerX, centerY, centerX + size/2, centerY, {
          stroke: designSystem.colors.secondary,
          strokeWidth: 2,
          roughness: 0.5
        })
        svg.appendChild(radiusLine)
        
        // Radius label
        const radiusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        radiusLabel.setAttribute('x', (centerX + size/4).toString())
        radiusLabel.setAttribute('y', (centerY - 5).toString())
        radiusLabel.setAttribute('text-anchor', 'middle')
        radiusLabel.setAttribute('font-family', designSystem.fonts.casual)
        radiusLabel.setAttribute('font-size', '10')
        radiusLabel.setAttribute('fill', designSystem.colors.secondary)
        radiusLabel.textContent = `r = ${properties.radius}`
        svg.appendChild(radiusLabel)
      }
      
    } else if (shapeType === 'square') {
      shapeElement = rc.rectangle(centerX - size/2, centerY - size/2, size, size, options)
      
      if (showMeasurements) {
        // Side length label
        const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        sideLabel.setAttribute('x', centerX.toString())
        sideLabel.setAttribute('y', (centerY + size/2 + 15).toString())
        sideLabel.setAttribute('text-anchor', 'middle')
        sideLabel.setAttribute('font-family', designSystem.fonts.casual)
        sideLabel.setAttribute('font-size', '10')
        sideLabel.setAttribute('fill', designSystem.colors.secondary)
        sideLabel.textContent = `side = ${properties.side}`
        svg.appendChild(sideLabel)
      }
      
    } else if (shapeType === 'triangle') {
      const height = size * (Math.sqrt(3) / 2)
      shapeElement = rc.polygon([
        [centerX, centerY - height/2],
        [centerX - size/2, centerY + height/2],
        [centerX + size/2, centerY + height/2]
      ], options)
      
      if (showMeasurements) {
        // Height line
        const heightLine = rc.line(centerX, centerY - height/2, centerX, centerY + height/2, {
          stroke: designSystem.colors.secondary,
          strokeWidth: 2,
          roughness: 0.5,
          strokeLineDash: [5, 5]
        })
        svg.appendChild(heightLine)
        
        // Height label
        const heightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        heightLabel.setAttribute('x', (centerX + 10).toString())
        heightLabel.setAttribute('y', centerY.toString())
        heightLabel.setAttribute('font-family', designSystem.fonts.casual)
        heightLabel.setAttribute('font-size', '10')
        heightLabel.setAttribute('fill', designSystem.colors.secondary)
        heightLabel.textContent = `h = ${properties.height}`
        svg.appendChild(heightLabel)
      }
    }

    if (shapeElement) {
      svg.appendChild(shapeElement)
    }

    // Add properties panel
    if (showProperties) {
      const panelY = 160
      const props = Object.entries(properties)
      
      props.forEach(([key, value], index) => {
        const propText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        propText.setAttribute('x', '10')
        propText.setAttribute('y', (panelY + index * 15).toString())
        propText.setAttribute('font-family', designSystem.fonts.casual)
        propText.setAttribute('font-size', '12')
        propText.setAttribute('fill', designSystem.colors.ink)
        propText.textContent = `${key}: ${value}`
        svg.appendChild(propText)
      })
    }

  }, [shapeType, size, color, showMeasurements, showProperties])

  useEffect(() => {
    drawShape()
  }, [drawShape])

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startSize = size
    const startX = e.clientX
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      setSize(Math.max(30, Math.min(150, startSize + deltaX)))
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [size])

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x, y }}
      onMouseDown={() => setIsHovered(true)}
      onStop={() => setIsHovered(false)}
    >
      <div
        ref={nodeRef}
        className="absolute z-10 group bg-white/95 rounded-lg shadow-md border border-gray-200 p-2 backdrop-blur-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main shape SVG */}
        <svg 
          ref={svgRef} 
          width="200" 
          height={showProperties ? "240" : "160"} 
          className="pointer-events-none"
        />
        
        {/* Interactive handles and controls only on hover */}
        {isHovered && (
          <>
            {/* Resize handle - bottom right */}
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize shadow-sm"
              onMouseDown={handleResize}
            />
            
            {/* Color palette - top */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 bg-white/90 rounded-full px-2 py-1 shadow-lg">
              {crayonPalette.map((c, index) => (
                <button
                  key={index}
                  onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded-full border-2 transition-transform duration-short shadow-sm ${
                    color === c ? 'ring-2 ring-blue-500 border-white scale-110' : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Controls - left side */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              <AccessibleButton
                onClick={() => setShowMeasurements(!showMeasurements)}
                aria-label="Toggle measurements"
                className={`w-5 h-5 ${showMeasurements ? 'bg-green-500' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-green-600 transition-colors`}
              >
                📏
              </AccessibleButton>
              <AccessibleButton
                onClick={() => setShowProperties(!showProperties)}
                aria-label="Toggle properties panel"
                className={`w-5 h-5 ${showProperties ? 'bg-purple-500' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-purple-600 transition-colors`}
              >
                📊
              </AccessibleButton>
            </div>
            
            {/* Remove button - top right */}
            <AccessibleButton
              onClick={() => onRemove?.(id)}
              aria-label="Remove shape"
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition-colors"
            >
              ✕
            </AccessibleButton>
            
            {/* Shape label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-1 rounded text-xs text-gray-700 shadow-sm capitalize">
              {shapeType}
            </div>
          </>
        )}
      </div>
    </Draggable>
  )
}

export default GeometricShape