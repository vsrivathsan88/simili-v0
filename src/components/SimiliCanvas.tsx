'use client'

import { useState, useCallback } from 'react'
import { designSystem } from '@/lib/design'
import { PaperTextureFilter } from '@/components/PaperTextureFilter'
import SimpleCanvas from '@/components/SimpleCanvas'
import { type DetectedShape, type SmartSuggestion } from '@/lib/shapeDetection'

const SimiliCanvas = () => {
  const [hasDrawing, setHasDrawing] = useState(false)

  const handlePathsChange = useCallback((hasPaths: boolean) => {
    setHasDrawing(hasPaths)
  }, [])

  const handleShapeDetected = useCallback((shapes: DetectedShape[], suggestions: SmartSuggestion[]) => {
    // Handle shape detection results
    console.log('🔍 Shapes detected:', shapes)
    console.log('💡 Suggestions:', suggestions)
  }, [])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
      {/* Paper texture background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 60%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
          `,
          backgroundColor: designSystem.colors.paper
        }}
      />
      
      {/* Hand-drawn border */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          <PaperTextureFilter />
          <rect
            x="8"
            y="8"
            width="calc(100% - 16px)"
            height="calc(100% - 16px)"
            fill="none"
            stroke={designSystem.colors.accent}
            strokeWidth="2"
            strokeDasharray="8,4"
            strokeLinecap="round"
            rx="12"
            ry="12"
            style={{
              filter: 'url(#rough-paper-texture)',
              opacity: 0.4
            }}
          />
        </svg>
      </div>
      
      {/* Canvas with full manipulative support */}
      <div className="relative z-10 w-full h-full">
        <SimpleCanvas 
          onPathsChange={handlePathsChange}
          onShapeDetected={handleShapeDetected}
        />
      </div>
    </div>
  )
}

export default SimiliCanvas
