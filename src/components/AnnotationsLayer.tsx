'use client'

import { useEffect, useRef, useState } from 'react'

type AnnotationType = 'arrow' | 'circle' | 'underline'

interface Point { x: number; y: number }

interface Annotation {
  id: string
  type: AnnotationType
  coordinates: Point[]
  color?: string
  message?: string
  createdAt: number
}

export default function AnnotationsLayer() {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const cleanupRef = useRef<number | null>(null)

  useEffect(() => {
    const handleAnnotate = (event: any) => {
      const detail = event?.detail || {}
      const type: AnnotationType = ['arrow', 'circle', 'underline'].includes(detail.type) ? detail.type : 'circle'
      const coords = Array.isArray(detail.coordinates) ? detail.coordinates : []
      if (coords.length === 0) return
      const ann: Annotation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        type,
        coordinates: coords.slice(0, 4).map((p: any) => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 })),
        color: typeof detail.color === 'string' ? detail.color : '#a855f7',
        message: typeof detail.message === 'string' ? detail.message : undefined,
        createdAt: Date.now()
      }
      setAnnotations(prev => [...prev, ann])
    }

    window.addEventListener('simili-annotate-canvas', handleAnnotate as EventListener)
    return () => window.removeEventListener('simili-annotate-canvas', handleAnnotate as EventListener)
  }, [])

  // Auto-cleanup annotations after a few seconds
  useEffect(() => {
    if (cleanupRef.current) window.clearInterval(cleanupRef.current)
    cleanupRef.current = window.setInterval(() => {
      const now = Date.now()
      setAnnotations(prev => prev.filter(a => now - a.createdAt < 6000))
    }, 1000)
    return () => {
      if (cleanupRef.current) window.clearInterval(cleanupRef.current)
    }
  }, [])

  if (annotations.length === 0) return null

  return (
    <svg className="absolute inset-0 pointer-events-none z-40" aria-hidden>
      {annotations.map(ann => {
        if (ann.type === 'circle') {
          const p = ann.coordinates[0]
          const r = 24
          return (
            <g key={ann.id}>
              <circle cx={p.x} cy={p.y} r={r} stroke={ann.color} strokeWidth={3} fill="none" />
              {ann.message && (
                <text x={p.x + r + 6} y={p.y} fill={ann.color} fontSize="12" fontWeight="600">{ann.message}</text>
              )}
            </g>
          )
        }
        if (ann.type === 'underline') {
          const [a,b] = ann.coordinates
          if (!a || !b) return null
          return (
            <g key={ann.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ann.color} strokeWidth={3} />
              {ann.message && (
                <text x={b.x + 6} y={b.y} fill={ann.color} fontSize="12" fontWeight="600">{ann.message}</text>
              )}
            </g>
          )
        }
        // arrow
        const [a,b] = ann.coordinates
        if (!a || !b) return null
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.max(1, Math.hypot(dx, dy))
        const ux = dx / len
        const uy = dy / len
        const arrowSize = 10
        const left = { x: b.x - arrowSize * (ux + uy), y: b.y - arrowSize * (uy - ux) }
        const right = { x: b.x - arrowSize * (ux - uy), y: b.y - arrowSize * (uy + ux) }
        return (
          <g key={ann.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ann.color} strokeWidth={3} />
            <polygon points={`${b.x},${b.y} ${left.x},${left.y} ${right.x},${right.y}`} fill={ann.color} />
            {ann.message && (
              <text x={b.x + 6} y={b.y} fill={ann.color} fontSize="12" fontWeight="600">{ann.message}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}


