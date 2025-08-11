'use client'

import { designSystem } from '@/lib/design'
import { useCallback, useEffect, useRef, useState } from 'react'
import rough from 'roughjs'

type SketchyButtonProps = {
  children: React.ReactNode
  onClick: () => void
}

interface RoughCanvas {
  rectangle: (x: number, y: number, width: number, height: number, options: Record<string, unknown>) => void
}

const SketchyButton = ({ children, onClick }: SketchyButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const roughCanvasRef = useRef<unknown>(null)

  const draw = useCallback(() => {
    const rc = roughCanvasRef.current as RoughCanvas
    const canvas = canvasRef.current
    if (!rc || !canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    rc.rectangle(5, 5, 180, 50, {
      fill: isHovered ? '#EEF2FF' : '#FFFFFF',
      fillStyle: 'solid',
      roughness: designSystem.roughness.subtle,
      bowing: isHovered ? 1.2 : 0.8,
      stroke: designSystem.colors.primary,
      strokeWidth: 2,
    })
  }, [isHovered])

  useEffect(() => {
    if (canvasRef.current) {
      roughCanvasRef.current = rough.canvas(canvasRef.current)
      draw()
    }
  }, [draw])

  useEffect(() => { draw() }, [draw])

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="relative w-[190px] h-[60px]"
    >
      <canvas ref={canvasRef} width="190" height="60" className="absolute top-0 left-0" />
      <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-ink">
        {children}
      </span>
    </button>
  )
}

export default SketchyButton
