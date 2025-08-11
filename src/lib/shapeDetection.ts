interface Point {
  x: number
  y: number
}

interface DrawingPath {
  id: string
  points: Point[]
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

export interface DetectedShape {
  type: 'circle' | 'line' | 'triangle' | 'rectangle' | 'unknown'
  confidence: number
  pathId: string
  bounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    width: number
    height: number
  }
}

// Calculate distance between two points
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

// Calculate center of a set of points
function calculateCenter(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / points.length, y: sum.y / points.length }
}

// Calculate bounding box of points
function calculateBounds(points: Point[]) {
  if (points.length === 0) return undefined
  
  const minX = Math.min(...points.map(p => p.x))
  const maxX = Math.max(...points.map(p => p.x))
  const minY = Math.min(...points.map(p => p.y))
  const maxY = Math.max(...points.map(p => p.y))
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// Detect if a path looks like a circle (much more lenient)
function detectCircle(path: DrawingPath): DetectedShape | null {
  const { points } = path
  if (points.length < 6) return null // Lower threshold for easier detection
  
  const center = calculateCenter(points)
  const distances = points.map(p => distance(p, center))
  const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length
  
  // Check how consistent the distances are (circle should have consistent radius)
  const radiusVariation = distances.map(d => Math.abs(d - avgRadius))
  const maxVariation = Math.max(...radiusVariation)
  const variationRatio = maxVariation / avgRadius
  
  // Also check if start and end points are close (closed shape)
  const startEndDistance = distance(points[0], points[points.length - 1])
  const isClosedShape = startEndDistance < avgRadius * 0.7 // Much more lenient
  
      const bounds = calculateBounds(points)
  
    // Much more lenient thresholds for easier detection
    if (variationRatio < 0.8 && isClosedShape && avgRadius > 10) {
      console.log('🟢 Circle detected!', { 
        points: points.length, 
        variationRatio: variationRatio.toFixed(2), 
        avgRadius: avgRadius.toFixed(1), 
        startEndDistance: startEndDistance.toFixed(1),
        isClosedShape 
      })
      return {
        type: 'circle',
        confidence: Math.max(0, 1 - variationRatio),
        pathId: path.id,
        bounds: bounds || undefined
      }
    }
  
  return null
}

// Detect if a path looks like a straight line (more lenient)
function detectLine(path: DrawingPath): DetectedShape | null {
  const { points } = path
  if (points.length < 4) return null // Lower threshold
  
  const start = points[0]
  const end = points[points.length - 1]
  const totalDistance = distance(start, end)
  
  if (totalDistance < 20) return null // Lower threshold for meaningful line
  
  // Check how much the path deviates from a straight line
  let maxDeviation = 0
  for (const point of points) {
    // Calculate distance from point to the line between start and end
    const A = end.y - start.y
    const B = start.x - end.x
    const C = end.x * start.y - start.x * end.y
    const deviation = Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B)
    maxDeviation = Math.max(maxDeviation, deviation)
  }
  
  const deviationRatio = maxDeviation / totalDistance
  const bounds = calculateBounds(points)
  
  if (deviationRatio < 0.15) { // More lenient
    console.log('🟢 Line detected!', { 
      points: points.length, 
      totalDistance: totalDistance.toFixed(1), 
      maxDeviation: maxDeviation.toFixed(1),
      deviationRatio: deviationRatio.toFixed(3)
    })
    return {
      type: 'line',
      confidence: Math.max(0, 1 - deviationRatio * 6.67),
      pathId: path.id,
      bounds: bounds || undefined
    }
  }
  
  return null
}

// Main shape detection function
export function detectShape(path: DrawingPath): DetectedShape | null {
  if (path.tool === 'eraser' || path.points.length < 3) return null
  
  console.log('🔍 Analyzing path with', path.points.length, 'points')
  
  // Try to detect different shapes
  const circleResult = detectCircle(path)
  if (circleResult && circleResult.confidence > 0.3) { // Lower confidence threshold
    console.log('✅ Circle accepted with confidence:', circleResult.confidence.toFixed(2))
    return circleResult
  }
  
  const lineResult = detectLine(path)
  if (lineResult && lineResult.confidence > 0.5) {
    console.log('✅ Line accepted with confidence:', lineResult.confidence.toFixed(2))
    return lineResult
  }
  
  console.log('❌ No shapes detected')
  return null
}

export interface SmartSuggestion {
  message: string
  manipulative?: 'number-line' | 'graph-paper' | 'fraction-bar' | 'circle' | 'square' | 'triangle' | 'calculator'
  action?: 'add-tool' | 'highlight-feature'
  educationalContext?: string
  gradeLevel?: 'elementary' | 'middle' | 'high'
}

// Analyze multiple paths for patterns
export function analyzeDrawing(paths: DrawingPath[]): {
  shapes: DetectedShape[]
  patterns: string[]
  suggestions: string[]
  smartSuggestions: SmartSuggestion[]
} {
  const shapes = paths.map(detectShape).filter(Boolean) as DetectedShape[]
  const patterns: string[] = []
  const suggestions: string[] = []
  const smartSuggestions: SmartSuggestion[] = []
  
  // Look for patterns
  const circles = shapes.filter(s => s.type === 'circle')
  const lines = shapes.filter(s => s.type === 'line')
  
  if (circles.length > 0) {
    patterns.push(`${circles.length} circle${circles.length > 1 ? 's' : ''} detected`)
    suggestions.push('Explore radius and diameter')
    
    if (circles.length === 1) {
      smartSuggestions.push({
        message: 'Perfect circle! Let\'s explore fractions with pie slices 🥧',
        manipulative: 'fraction-bar',
        action: 'add-tool',
        educationalContext: 'Circles are great for understanding fractions as parts of a whole',
        gradeLevel: 'elementary'
      })
    } else {
      smartSuggestions.push({
        message: 'Multiple circles! Compare their sizes and relationships',
        manipulative: 'graph-paper',
        action: 'add-tool',
        educationalContext: 'Compare circle properties and ratios',
        gradeLevel: 'middle'
      })
    }
  }
  
  if (lines.length > 1) {
    patterns.push(`${lines.length} lines detected`)
    suggestions.push('Try creating angles and geometric shapes')
    
    smartSuggestions.push({
      message: 'I see lines! Perfect for number line activities 📊',
      manipulative: 'number-line',
      action: 'add-tool',
      educationalContext: 'Use number lines to understand position, distance, and operations',
      gradeLevel: 'elementary'
    })
  }
  
  if (lines.length === 2) {
    smartSuggestions.push({
      message: 'Two lines create angles! Let\'s build shapes 🔺',
      manipulative: 'triangle',
      action: 'add-tool',
      educationalContext: 'Two lines can form angles - explore triangles and geometric relationships',
      gradeLevel: 'elementary'
    })
  }
  
  if (circles.length > 0 && lines.length > 0) {
    patterns.push('Mix of circles and lines - geometric exploration!')
    suggestions.push('Great for geometry exploration!')
    smartSuggestions.push({
      message: 'Circles + lines = awesome geometry! 🎨 Try graphing',
      manipulative: 'graph-paper',
      action: 'add-tool',
      educationalContext: 'Combine shapes to explore coordinate geometry and spatial relationships',
      gradeLevel: 'middle'
    })
  }
  
  // If many shapes, suggest math operations
  if (shapes.length > 2) {
    smartSuggestions.push({
      message: 'Lots of shapes! Time for some counting and calculating 🧮',
      manipulative: 'calculator',
      action: 'add-tool',
      educationalContext: 'Count shapes, calculate areas, and explore mathematical relationships',
      gradeLevel: 'elementary'
    })
  }
  
  // If no shapes detected but there\'s drawing, encourage creativity
  if (paths.length > 0 && shapes.length === 0) {
    smartSuggestions.push({
      message: 'Creative drawing! Add some math tools to explore patterns ✨',
      manipulative: 'fraction-bar',
      action: 'add-tool',
      educationalContext: 'Turn creative drawings into mathematical exploration opportunities',
      gradeLevel: 'elementary'
    })
  }
  
  console.log('📊 Analyzing', paths.length, 'paths, found', shapes.length, 'shapes')
  console.log('🎯 Final suggestions:', smartSuggestions.length)
  
  return { shapes, patterns, suggestions, smartSuggestions }
}
