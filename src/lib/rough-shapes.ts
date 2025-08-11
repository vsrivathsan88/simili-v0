import { designSystem } from './design'

// Enhanced rough.js configuration for kid-friendly drawing
export const getRoughOptions = (color: string, fill?: string) => ({
  stroke: color,
  strokeWidth: 3,
  roughness: designSystem.roughness.normal,
  bowing: 1.2,
  fill: fill || 'transparent',
  fillStyle: fill ? 'solid' : 'hachure',
  fillWeight: 1,
  hachureAngle: -41,
  hachureGap: 8,
  curveStepCount: 12, // Smoother curves
  simplification: 0.2, // Slight simplification for hand-drawn feel
})

// Kid-friendly color mapping - using string literal types that match tldraw
export const getKidFriendlyColor = (colorStyle: string): string => {
  const colorMap: Record<string, string> = {
    'black': designSystem.colors.ink,
    'grey': '#6B7280',
    'violet': designSystem.colors.drawing.purple,
    'blue': designSystem.colors.drawing.blue,
    'light-blue': '#7DD3FC',
    'yellow': designSystem.colors.warning,
    'orange': designSystem.colors.drawing.orange,
    'green': designSystem.colors.drawing.green,
    'light-green': '#86EFAC',
    'red': designSystem.colors.drawing.red,
    'light-red': designSystem.colors.secondary,
    'white': '#FFFFFF'
  }
  return colorMap[colorStyle] || designSystem.colors.ink
}

// Helper function to create hand-drawn path data
export const createHandDrawnPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return ''
  
  const [first, ...rest] = points
  const pathParts = [`M${first.x},${first.y}`]
  
  rest.forEach(point => {
    pathParts.push(`L${point.x},${point.y}`)
  })
  
  return pathParts.join('')
}

// CSS styles for hand-drawn effects
export const handDrawnStyles = {
  paperTexture: {
    filter: 'url(#rough-paper-texture)',
    opacity: 0.9
  },
  sketchyStroke: {
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: '2,2'
  },
  friendlyShape: {
    strokeLinecap: 'round' as const,
    filter: 'url(#rough-paper-texture)'
  }
}
