// Gemini API Client for Educational AI Tutoring

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface StudentContext {
  gradeLevel: number
  subject: 'mathematics' | 'science' | 'language' | 'general'
  currentTopic: string
  learningObjectives: string[]
  studentName?: string
  sessionDuration: number // minutes
  strugglingAreas: string[]
  masterredConcepts: string[]
}

export interface DrawingAnalysis {
  shapes: string[]
  patterns: string[]
  mathematicalConcepts: string[]
  confidence: number
}

export interface TutorResponse {
  text: string
  questionType: 'open-ended' | 'guided' | 'reflection' | 'encouragement' | 'intervention'
  nextSuggestion?: string
  visualHints?: string[]
  followUpQuestions: string[]
}

class GeminiEducationalClient {
  private client: GoogleGenerativeAI | null = null
  private model: any = null
  private isInitialized = false

  // Educational system prompts for different contexts
  private readonly systemPrompts = {
    base: `You are Pi, a curious coach in the Pi Lab for grade 3 students. Treat students as capable junior investigators.

Core Principles:
- Always respond with curiosity and respect
- Ask concise nudges that help students discover concepts themselves  
- Use clear, age-appropriate language without baby talk
- Celebrate progress and productive struggle (debugging)
- When students struggle, break problems into smaller steps
- Connect math to real-world examples students can relate to
- Encourage students to explain their thinking out loud

 Response Format:
 - Keep responses to 1-2 sentences max
 - Ask one clear question at a time
 - Use prompts like "I notice..." "What does your drawing show?" "What will you check?"
 - Suggest drawing or manipulatives when helpful`,

    mathematics: `You are Pi, a math coach in the Pi Lab specializing in elementary mathematics. Focus on:

Key Areas:
- Number sense and counting
- Basic arithmetic (addition, subtraction, multiplication, division)
- Fractions and decimals
- Geometry and shapes
- Patterns and relationships
- Measurement
- Problem-solving strategies

Teaching Approach:
- Use visual and hands-on methods
- Connect to everyday experiences
- Build on what students already know
- Help students see patterns and relationships
- Encourage multiple solution methods`,

    collaborative: `You are Pi, facilitating collaborative learning in the Pi Lab. Your role:

Collaboration Goals:
- Help students share their thinking with each other
- Encourage peer explanations and discussions  
- Point out different approaches and solutions
- Foster respectful mathematical discourse
- Help students learn from each other's strategies

Facilitation Style:
- "What do you think about [Student A]'s approach?"
- "Can someone explain this in a different way?"
- "I see two different methods here. What's similar? What's different?"
- "How might you build on your classmate's idea?"`
  }

  constructor() {
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      // Get API key from environment variables
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      
      if (!apiKey) {
        console.warn('⚠️  Gemini API key not found. AI tutoring will use fallback responses.')
        this.setupFallbackMode()
        return
      }

      this.client = new GoogleGenerativeAI(apiKey)
      
      // Use Gemini Pro for text generation
      this.model = this.client.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.7, // Balanced creativity for educational responses
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 200, // Keep responses concise for children
        }
      })

      this.isInitialized = true
      console.log('✅ Gemini AI tutor initialized')
      
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error)
      this.setupFallbackMode()
    }
  }

  // Fallback responses when Gemini API is unavailable
  private setupFallbackMode(): void {
    console.log('🔄 Setting up fallback AI responses')
    this.isInitialized = false
  }

  // Generate tutor response based on student context and drawing
  async generateTutorResponse(
    studentContext: StudentContext,
    drawingAnalysis: DrawingAnalysis,
    conversationHistory: string[] = [],
    collaborationContext?: { studentCount: number, recentActivity: string[] }
  ): Promise<TutorResponse> {
    
    if (!this.isInitialized || !this.model) {
      return this.getFallbackResponse(studentContext, drawingAnalysis)
    }

    try {
      const prompt = this.buildEducationalPrompt(
        studentContext, 
        drawingAnalysis, 
        conversationHistory,
        collaborationContext
      )

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseGeminiResponse(text, studentContext)
      
    } catch (error) {
      console.error('Gemini API error:', error)
      return this.getFallbackResponse(studentContext, drawingAnalysis)
    }
  }

  // Build comprehensive educational prompt
  private buildEducationalPrompt(
    studentContext: StudentContext,
    drawingAnalysis: DrawingAnalysis,
    conversationHistory: string[],
    collaborationContext?: { studentCount: number, recentActivity: string[] }
  ): string {
    const getSubjectPrompt = (subject: string) => {
      switch (subject) {
        case 'mathematics': return this.systemPrompts.mathematics
        case 'science': return this.systemPrompts.base // Add science prompt later
        case 'language': return this.systemPrompts.base // Add language prompt later
        default: return this.systemPrompts.base
      }
    }
    
    const basePrompt = collaborationContext ? 
      this.systemPrompts.collaborative : 
      getSubjectPrompt(studentContext.subject)

    const contextSection = `
Student Context:
- Grade Level: ${studentContext.gradeLevel}
- Subject: ${studentContext.subject}
- Current Topic: ${studentContext.currentTopic}
- Learning Objectives: ${studentContext.learningObjectives.join(', ')}
- Session Duration: ${studentContext.sessionDuration} minutes
- Struggling Areas: ${studentContext.strugglingAreas.join(', ') || 'None identified'}
- Mastered Concepts: ${studentContext.masterredConcepts.join(', ') || 'Building foundation'}
`

    const drawingSection = `
Current Drawing Analysis:
- Shapes detected: ${drawingAnalysis.shapes.join(', ') || 'None yet'}
- Patterns observed: ${drawingAnalysis.patterns.join(', ') || 'Exploring'}  
- Mathematical concepts: ${drawingAnalysis.mathematicalConcepts.join(', ') || 'Free exploration'}
- Confidence level: ${drawingAnalysis.confidence}
`

    const conversationSection = conversationHistory.length > 0 ? `
Recent Conversation:
${conversationHistory.slice(-3).map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
` : ''

    const collaborationSection = collaborationContext ? `
Collaboration Context:
- Students in session: ${collaborationContext.studentCount}
- Recent peer activity: ${collaborationContext.recentActivity.join(', ')}
` : ''

    const instructionSection = `
Generate a response that:
1. Acknowledges what the student is exploring
2. Asks ONE thoughtful question to guide their thinking
3. Suggests a specific next step or drawing action if helpful
4. Uses language appropriate for grade ${studentContext.gradeLevel}
5. Stays focused on the current learning objective

Format your response as:
RESPONSE: [Your encouraging response and question]
TYPE: [open-ended|guided|reflection|encouragement|intervention]
NEXT: [Optional specific suggestion]
HINTS: [Optional visual hints, separated by commas]
FOLLOWUP: [Related questions for deeper exploration, separated by semicolons]
`

    return `${basePrompt}\n\n${contextSection}\n${drawingSection}\n${conversationSection}\n${collaborationSection}\n${instructionSection}`
  }

  // Parse Gemini response into structured format
  private parseGeminiResponse(text: string, context: StudentContext): TutorResponse {
    const lines = text.split('\n')
    const response: Partial<TutorResponse> = {}

    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('RESPONSE:')) {
        response.text = trimmed.substring(9).trim()
      } else if (trimmed.startsWith('TYPE:')) {
        response.questionType = trimmed.substring(5).trim() as any
      } else if (trimmed.startsWith('NEXT:')) {
        response.nextSuggestion = trimmed.substring(5).trim()
      } else if (trimmed.startsWith('HINTS:')) {
        response.visualHints = trimmed.substring(6).split(',').map(h => h.trim()).filter(h => h)
      } else if (trimmed.startsWith('FOLLOWUP:')) {
        response.followUpQuestions = trimmed.substring(9).split(';').map(q => q.trim()).filter(q => q)
      }
    })

    // Fallback if parsing fails
    if (!response.text) {
      response.text = text.slice(0, 200) // First 200 chars
    }

    return {
      text: response.text || "That's interesting! Tell me more about what you're thinking.",
      questionType: response.questionType || 'open-ended',
      nextSuggestion: response.nextSuggestion,
      visualHints: response.visualHints || [],
      followUpQuestions: response.followUpQuestions || []
    }
  }

  // Fallback responses when Gemini is unavailable
  private getFallbackResponse(context: StudentContext, analysis: DrawingAnalysis): TutorResponse {
    const fallbackResponses = {
      shapes: [
        "I see you're working with shapes! What do you notice about the shape you just drew?",
        "Interesting shape! Can you tell me what makes this shape special?",
        "I'm curious about your drawing. What were you thinking when you made that shape?"
      ],
      patterns: [
        "I notice you're creating a pattern. What comes next?",
        "Cool pattern! How did you decide what to draw next?",
        "Patterns are everywhere in math! What pattern do you see here?"
      ],
      general: [
        "I love watching you explore! What are you discovering?",
        "You're doing great thinking! Tell me about your work.",
        "That's interesting! What made you choose to draw that?"
      ]
    }

    let responses = fallbackResponses.general
    if (analysis.shapes.length > 0) responses = fallbackResponses.shapes
    if (analysis.patterns.length > 0) responses = fallbackResponses.patterns

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    return {
      text: randomResponse,
      questionType: 'open-ended',
      followUpQuestions: [
        "What do you think will happen next?",
        "How does this connect to what we learned before?",
        "Can you show me another way to think about this?"
      ]
    }
  }

  // Analyze student drawing for mathematical concepts
  async analyzeDrawing(imageData: string, context: StudentContext): Promise<DrawingAnalysis> {
    if (!this.isInitialized || !this.model) {
      return this.getBasicDrawingAnalysis()
    }

    try {
      // For now, use basic analysis - future enhancement would use Gemini Vision
      return this.getBasicDrawingAnalysis()
    } catch (error) {
      console.error('Drawing analysis error:', error)
      return this.getBasicDrawingAnalysis()
    }
  }

  private getBasicDrawingAnalysis(): DrawingAnalysis {
    return {
      shapes: [],
      patterns: [],
      mathematicalConcepts: [],
      confidence: 0.5
    }
  }

  // Generate assessment questions based on student work
  async generateAssessmentQuestions(context: StudentContext): Promise<string[]> {
    const questions = [
      "Can you explain how you solved this problem?",
      "What strategy did you use here?",
      "If you had to teach this to a friend, what would you say?",
      "What was the trickiest part of this problem?",
      "How do you know your answer makes sense?"
    ]

    return questions.slice(0, 3) // Return 3 questions
  }

  // Check if Gemini is available
  isAvailable(): boolean {
    return this.isInitialized
  }

  // Get current status
  getStatus(): { available: boolean, mode: string } {
    return {
      available: this.isInitialized,
      mode: this.isInitialized ? 'gemini-pro' : 'fallback'
    }
  }
}

// Singleton instance
export const geminiClient = new GeminiEducationalClient()

// React hook for Gemini integration
export function useGeminiTutor() {
  return {
    generateResponse: (context: StudentContext, analysis: DrawingAnalysis, history?: string[], collaboration?: any) =>
      geminiClient.generateTutorResponse(context, analysis, history, collaboration),
    analyzeDrawing: (imageData: string, context: StudentContext) =>
      geminiClient.analyzeDrawing(imageData, context),
    generateQuestions: (context: StudentContext) =>
      geminiClient.generateAssessmentQuestions(context),
    isAvailable: () => geminiClient.isAvailable(),
    getStatus: () => geminiClient.getStatus()
  }
}
