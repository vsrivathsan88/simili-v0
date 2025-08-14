export type Subject = 'mathematics' | 'science' | 'language' | 'general'

export interface StudentContext {
  gradeLevel: number
  subject: Subject
  currentTopic: string
}

export interface VisionAnalysis {
  // Flexible shape to keep payloads compact
  shapes?: string[]
  numberLine?: { markers?: number[]; range?: [number, number] }
  fractionBar?: { parts?: number; shaded?: number }
  graph?: { points?: Array<[number, number]>; pattern?: string }
  notes?: string
  [key: string]: unknown
}

function buildTopicFragment(student: StudentContext): string {
  const topic = student.currentTopic?.trim()
  if (!topic) return 'Math exploration.'
  return `Topic: ${topic}.`
}

function buildAnalysisFragment(analysis?: VisionAnalysis): string {
  if (!analysis || typeof analysis !== 'object') return ''
  const pieces: string[] = []
  if (Array.isArray(analysis.shapes) && analysis.shapes.length > 0) {
    pieces.push(`Visible shapes: ${analysis.shapes.slice(0, 4).join(', ')}.`)
  }
  if (analysis.numberLine && typeof analysis.numberLine === 'object') {
    const markers = Array.isArray(analysis.numberLine.markers) ? analysis.numberLine.markers.slice(0, 4).join(', ') : ''
    if (markers) pieces.push(`Number line markers: ${markers}.`)
  }
  if (analysis.fractionBar && typeof analysis.fractionBar === 'object') {
    const parts = (analysis.fractionBar as any).parts
    const shaded = (analysis.fractionBar as any).shaded
    if (typeof parts === 'number') pieces.push(`Fraction bar parts: ${parts}.`)
    if (typeof shaded === 'number') pieces.push(`Shaded parts: ${shaded}.`)
  }
  return pieces.join(' ')
}

export function buildPiSystemPersona(student: StudentContext): string {
  return (
    `You are Pi, a warm, encouraging elementary math tutor. ` +
    `Student grade: ${student.gradeLevel}. Subject: ${student.subject}. ` +
    `Use friendly, age-appropriate language. Be Socratic. Never give direct answers. ` +
    `Keep responses to ONE short sentence with a single question that nudges thinking.`
  )
}

export function buildPiNudgePrompt(opts: {
  trigger: 'drawing' | 'manipulative' | 'pause' | 'activity'
  contextLine: string
  student: StudentContext
  analysis?: VisionAnalysis
}): string {
  const { trigger, contextLine, student, analysis } = opts
  const persona = buildPiSystemPersona(student)
  const topic = buildTopicFragment(student)
  const visual = buildAnalysisFragment(analysis)
  const visualLine = visual ? ` ${visual}` : ''
  const triggerLine = `Trigger: ${trigger}. ${contextLine}`
  return `${persona}\n${topic}${visualLine}\n${triggerLine}\nRespond in ONE short sentence with warmth and a single question. Avoid answers.`
}


