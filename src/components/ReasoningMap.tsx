'use client'

import { useState, useEffect, useRef } from 'react'
import rough from 'roughjs/bundled/rough.esm.js'
import { designSystem } from '@/lib/design'

interface ReasoningStep {
  id: string
  timestamp: number
  transcript: string
  classification: 'correct' | 'partial' | 'incorrect' | 'exploring'
  concepts: string[]
  confidence: number
  position?: { x: number, y: number }
}

interface ReasoningMapProps {
  className?: string
  isVisible: boolean
}

const ReasoningMap = ({ className = '', isVisible }: ReasoningMapProps) => {
  const [steps, setSteps] = useState<ReasoningStep[]>([])
  const [celebrations, setCelebrations] = useState<Set<string>>(new Set())
  const svgRef = useRef<SVGSVGElement>(null)
  const roughRef = useRef<any>(null)

  // Initialize rough.js
  useEffect(() => {
    if (svgRef.current) {
      roughRef.current = rough.svg(svgRef.current)
    }
  }, [])

  // Listen for reasoning steps from Gemini Live
  useEffect(() => {
    const handleReasoningStep = (event: CustomEvent) => {
      const step: ReasoningStep = event.detail
      
      // Add position for visualization
      const position = calculateStepPosition(steps.length)
      const stepWithPosition = { ...step, position }
      
      setSteps(prev => [...prev, stepWithPosition])
      
      // Celebrate incorrect steps (learning opportunities!)
      if (step.classification === 'incorrect') {
        setTimeout(() => {
          setCelebrations(prev => new Set([...prev, step.id]))
        }, 1000)
      }
    }

    const handleCelebration = (event: CustomEvent) => {
      const { message, animation } = event.detail
      console.log('🎉 Celebration:', message, animation)
      // Trigger celebration animation
      // For now, just log - future enhancement would show visual celebration
    }

    window.addEventListener('simili-reasoning-step', handleReasoningStep as EventListener)
    window.addEventListener('simili-celebration', handleCelebration as EventListener)

    return () => {
      window.removeEventListener('simili-reasoning-step', handleReasoningStep as EventListener)
      window.removeEventListener('simili-celebration', handleCelebration as EventListener)
    }
  }, [steps.length])

  // Calculate position for new reasoning step
  const calculateStepPosition = (stepIndex: number) => {
    const baseX = 50
    const baseY = 100
    const stepSpacing = 150
    const verticalSpread = 50

    // Create a flowing, organic layout
    const x = baseX + (stepIndex * stepSpacing)
    const y = baseY + Math.sin(stepIndex * 0.5) * verticalSpread
    
    return { x, y }
  }

  // Get color for step classification
  const getStepColor = (classification: string) => {
    switch (classification) {
      case 'correct': return designSystem.colors.ui.success || '#10B981'
      case 'partial': return designSystem.colors.ui.warning || '#F59E0B'
      case 'incorrect': return designSystem.colors.ui.secondary || '#F97316' // Orange, not red!
      case 'exploring': return designSystem.colors.ui.primary || '#8B5CF6'
      default: return designSystem.colors.ink || '#1F2937'
    }
  }

  // Render reasoning step bubble with rough.js
  const renderStepBubble = (step: ReasoningStep, index: number) => {
    if (!roughRef.current || !step.position) return null

    const { x, y } = step.position
    const width = 120
    const height = 80
    const color = getStepColor(step.classification)
    const isCelebrated = celebrations.has(step.id)

    return (
      <g key={step.id} className={`reasoning-step ${isCelebrated ? 'celebrated' : ''}`}>
        {/* Step bubble */}
        <ellipse
          cx={x}
          cy={y}
          rx={width / 2}
          ry={height / 2}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
          style={{
            filter: 'url(#paper-texture)',
            transition: 'all 0.3s ease-in-out',
            transform: isCelebrated ? 'scale(1.1)' : 'scale(1)'
          }}
        />
        
         {/* Step number */}
        <circle
          cx={x - width / 3}
          cy={y - height / 3}
          r="15"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
        <text
          x={x - width / 3}
          y={y - height / 3 + 5}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="white"
        >
          {index + 1}
        </text>
        
         {/* Step classification icon */}
        <text
          x={x}
          y={y - 10}
          textAnchor="middle"
          fontSize="20"
        >
           {step.classification === 'correct' ? '✔︎' :
            step.classification === 'partial' ? '⚙︎' :
            step.classification === 'incorrect' ? '↺' :
            '🔎'}
        </text>
        
        {/* Truncated transcript */}
        <text
          x={x}
          y={y + 10}
          textAnchor="middle"
          fontSize="10"
          fill={designSystem.colors.ink}
          style={{ fontFamily: designSystem.fonts?.body || 'Inter, sans-serif' }}
        >
          {step.transcript.slice(0, 20)}...
        </text>
        
        {/* Celebration sparkles */}
        {isCelebrated && (
          <>
            <text x={x - 30} y={y - 40} fontSize="16" className="animate-bounce">✨</text>
            <text x={x + 30} y={y - 40} fontSize="16" className="animate-bounce" style={{ animationDelay: '0.2s' }}>✨</text>
            <text x={x} y={y - 50} fontSize="16" className="animate-bounce" style={{ animationDelay: '0.4s' }}>⭐</text>
          </>
        )}
        
        {/* Connector to next step */}
        {index < steps.length - 1 && steps[index + 1]?.position && (
          <path
            d={`M ${x + width/2} ${y} Q ${x + width + 20} ${y + 20} ${steps[index + 1].position!.x - width/2} ${steps[index + 1].position!.y}`}
            fill="none"
            stroke={designSystem.colors.ui.line || '#6B7280'}
            strokeWidth="2"
            strokeDasharray="5,5"
            style={{ filter: 'url(#paper-texture)' }}
          />
        )}
      </g>
    )
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`reasoning-map ${className}`}>
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: designSystem.fonts?.casual || 'Kalam, cursive' }}>
            Strategy Timeline
          </h3>
        </div>
        
        <div className="relative">
          {steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🧠</div>
              <div className="text-sm">Explain your move, then your check.</div>
              <div className="text-xs mt-1">Pi records Hypothesis → Evidence → Revision → Check</div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="200"
              viewBox="0 0 800 200"
              className="overflow-visible"
            >
              {/* Paper texture filter */}
              <defs>
                <filter id="paper-texture" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence
                    baseFrequency="0.04"
                    numOctaves="5"
                    result="noise"
                    seed="1"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="1"
                  />
                </filter>
              </defs>
              
              {/* Render all reasoning steps */}
              {steps.map((step, index) => renderStepBubble(step, index))}
            </svg>
          )}
        </div>
        
         {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-200 border border-green-500"></div>
            <span>Hypothesis confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-500"></div>
            <span>Evidence gathered</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-200 border border-orange-500"></div>
            <span>Revision</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-200 border border-purple-500"></div>
            <span>Exploring / Check</span>
          </div>
        </div>
        
        {/* Journey stats */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-800">{steps.length}</div>
              <div className="text-gray-600">Steps logged</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {steps.filter(s => s.classification === 'correct').length}
              </div>
              <div className="text-gray-600">Checks passed</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {new Set(steps.flatMap(s => s.concepts)).size}
              </div>
              <div className="text-gray-600">Concepts tagged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReasoningMap
