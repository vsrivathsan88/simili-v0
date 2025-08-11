// Voice Manager for Simili - Handles speech recognition and Gemini Live integration

import { sessionManager } from './sessionManager'

export interface VoiceCommand {
  trigger: string[]
  action: string
  parameters?: any
  description: string
  category: 'drawing' | 'manipulative' | 'navigation' | 'session'
}

export interface VoiceResponse {
  text: string
  action?: {
    type: 'add_manipulative' | 'clear_canvas' | 'undo' | 'redo' | 'switch_mode'
    data?: any
  }
  emotion?: 'encouraging' | 'helpful' | 'curious' | 'celebratory'
}

class VoiceManager {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis = window.speechSynthesis
  private isListening = false
  private isSpeaking = false
  private commandCallbacks = new Map<string, Function>()

  // Predefined voice commands
  private commands: VoiceCommand[] = [
    // Drawing Commands
    {
      trigger: ['clear', 'clear canvas', 'start over', 'erase everything'],
      action: 'clear_canvas',
      description: 'Clear all drawings',
      category: 'drawing'
    },
    {
      trigger: ['undo', 'go back', 'undo that'],
      action: 'undo',
      description: 'Undo last action',
      category: 'drawing'
    },
    {
      trigger: ['redo', 'do that again'],
      action: 'redo',
      description: 'Redo last action',
      category: 'drawing'
    },
    {
      trigger: ['pencil mode', 'drawing mode', 'draw'],
      action: 'switch_mode',
      parameters: { mode: 'pencil' },
      description: 'Switch to drawing mode',
      category: 'drawing'
    },
    {
      trigger: ['pointer mode', 'interact mode', 'use tools'],
      action: 'switch_mode',
      parameters: { mode: 'pointer' },
      description: 'Switch to pointer mode',
      category: 'drawing'
    },

    // Manipulative Commands
    {
      trigger: ['add number line', 'number line', 'show number line'],
      action: 'add_manipulative',
      parameters: { type: 'number-line' },
      description: 'Add a number line tool',
      category: 'manipulative'
    },
    {
      trigger: ['add fraction bar', 'fraction bar', 'fractions'],
      action: 'add_manipulative',
      parameters: { type: 'fraction-bar' },
      description: 'Add a fraction bar tool',
      category: 'manipulative'
    },
    {
      trigger: ['add graph paper', 'graph paper', 'coordinate grid'],
      action: 'add_manipulative',
      parameters: { type: 'graph-paper' },
      description: 'Add graph paper',
      category: 'manipulative'
    },
    {
      trigger: ['add calculator', 'calculator', 'math calculator'],
      action: 'add_manipulative',
      parameters: { type: 'calculator' },
      description: 'Add a calculator',
      category: 'manipulative'
    },

    // Session Commands
    {
      trigger: ['share my work', 'share this', 'show share'],
      action: 'share_session',
      description: 'Open sharing dialog',
      category: 'session'
    },
    {
      trigger: ['show progress', 'my progress', 'how am I doing'],
      action: 'show_progress',
      description: 'Show learning progress',
      category: 'session'
    }
  ]

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeSpeechRecognition()
    }
  }

  // Initialize Web Speech API
  private initializeSpeechRecognition(): void {
    if (typeof window === 'undefined') return
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = 'en-US'

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim()
        console.log('🎤 Voice input:', transcript)
        this.processVoiceCommand(transcript)
      }

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        this.isListening = false
        window.dispatchEvent(new CustomEvent('simili-voice-error', {
          detail: { error: event.error }
        }))
      }

      this.recognition.onend = () => {
        this.isListening = false
        window.dispatchEvent(new CustomEvent('simili-voice-ended'))
      }
    } else {
      console.warn('Speech recognition not supported in this browser')
    }
  }

  // Start listening for voice commands
  startListening(): boolean {
    if (!this.recognition || this.isListening) return false

    try {
      this.recognition.start()
      this.isListening = true
      console.log('🎤 Listening for voice commands...')
      
      // Log activity
      sessionManager.logActivity('session_started', { sessionDuration: 0 })
      
      window.dispatchEvent(new CustomEvent('simili-voice-started'))
      return true
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      return false
    }
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
      console.log('🎤 Stopped listening')
    }
  }

  // Process voice command
  private processVoiceCommand(transcript: string): void {
    const matchedCommand = this.findMatchingCommand(transcript)
    
    if (matchedCommand) {
      console.log('✅ Matched command:', matchedCommand.action)
      
      // Execute command via callback
      const callback = this.commandCallbacks.get(matchedCommand.action)
      if (callback) {
        callback(matchedCommand.parameters)
      }
      
      // Generate contextual response
      const response = this.generateResponse(matchedCommand, transcript)
      this.speak(response.text)
      
      // Log activity
      sessionManager.logActivity('manipulative_added', {
        manipulativeType: matchedCommand.parameters?.type
      })
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('simili-voice-command', {
        detail: { command: matchedCommand, response }
      }))
    } else {
      // No command matched - could be sent to Gemini Live
      console.log('❓ No command matched, could ask Gemini Live:', transcript)
      this.handleUnknownCommand(transcript)
    }
  }

  // Find matching command
  private findMatchingCommand(transcript: string): VoiceCommand | null {
    for (const command of this.commands) {
      for (const trigger of command.trigger) {
        if (transcript.includes(trigger)) {
          return command
        }
      }
    }
    return null
  }

  // Generate contextual response
  private generateResponse(command: VoiceCommand, transcript: string): VoiceResponse {
    const responses: { [key: string]: VoiceResponse } = {
      'clear_canvas': {
        text: "Sure! I've cleared the canvas. Ready for a fresh start!",
        emotion: 'helpful'
      },
      'undo': {
        text: "Undoing that for you. No worries!",
        emotion: 'helpful'
      },
      'redo': {
        text: "Redoing that action!",
        emotion: 'helpful'
      },
      'switch_mode': {
        text: command.parameters?.mode === 'pencil' 
          ? "Switched to drawing mode. Ready to create!"
          : "Switched to pointer mode. You can now interact with tools!",
        emotion: 'helpful'
      },
      'add_manipulative': {
        text: `I've added a ${command.parameters?.type?.replace('-', ' ')} for you. Give it a try!`,
        action: {
          type: 'add_manipulative',
          data: command.parameters
        },
        emotion: 'encouraging'
      },
      'share_session': {
        text: "Opening the sharing options. You can share your awesome work with classmates!",
        emotion: 'encouraging'
      },
      'show_progress': {
        text: "Let me show you how much you've learned! You're doing great!",
        emotion: 'celebratory'
      }
    }

    return responses[command.action] || {
      text: "I heard you! Let me help with that.",
      emotion: 'helpful'
    }
  }

  // Handle unknown commands (could be sent to Gemini Live)
  private handleUnknownCommand(transcript: string): void {
    // For now, provide helpful guidance
    const helpfulResponse = this.generateHelpfulResponse(transcript)
    this.speak(helpfulResponse)
    
    // In a real implementation, this would be sent to Gemini Live 2.0
    console.log('🤖 Would send to Gemini Live:', transcript)
    
    window.dispatchEvent(new CustomEvent('simili-unknown-command', {
      detail: { transcript }
    }))
  }

  // Generate helpful response for unknown commands
  private generateHelpfulResponse(transcript: string): string {
    if (transcript.includes('help')) {
      return "I can help you with drawing, adding math tools, clearing the canvas, and sharing your work. Just say things like 'add number line' or 'clear canvas'!"
    }
    
    if (transcript.includes('what can') || transcript.includes('what do')) {
      return "You can ask me to add math tools like number lines or fraction bars, clear the canvas, or share your work. What would you like to do?"
    }
    
    return "I'm not sure about that command, but I'm learning! Try saying 'add number line' or 'clear canvas'. You can also ask for help!"
  }

  // Text-to-speech
  speak(text: string, emotion: VoiceResponse['emotion'] = 'helpful'): void {
    if (this.isSpeaking) {
      this.synthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Adjust voice characteristics based on emotion
    switch (emotion) {
      case 'encouraging':
        utterance.pitch = 1.1
        utterance.rate = 0.9
        break
      case 'celebratory':
        utterance.pitch = 1.2
        utterance.rate = 1.0
        break
      case 'curious':
        utterance.pitch = 1.05
        utterance.rate = 0.95
        break
      default: // helpful
        utterance.pitch = 1.0
        utterance.rate = 0.9
    }

    utterance.volume = 0.7
    utterance.lang = 'en-US'

    utterance.onstart = () => {
      this.isSpeaking = true
      console.log('🔊 Speaking:', text)
    }

    utterance.onend = () => {
      this.isSpeaking = false
    }

    this.synthesis.speak(utterance)
  }

  // Register command callback
  registerCommand(action: string, callback: Function): void {
    this.commandCallbacks.set(action, callback)
  }

  // Get available commands
  getCommands(): VoiceCommand[] {
    return [...this.commands]
  }

  // Check if voice is supported
  isVoiceSupported(): boolean {
    return this.recognition !== null && 'speechSynthesis' in window
  }

  // Get listening state
  getListeningState(): boolean {
    return this.isListening
  }

  // Get speaking state
  getSpeakingState(): boolean {
    return this.isSpeaking
  }
}

// Singleton instance
export const voiceManager = new VoiceManager()

// React hook for voice features
export function useVoice() {
  return {
    startListening: () => voiceManager.startListening(),
    stopListening: () => voiceManager.stopListening(),
    speak: (text: string, emotion?: VoiceResponse['emotion']) => voiceManager.speak(text, emotion),
    registerCommand: (action: string, callback: Function) => voiceManager.registerCommand(action, callback),
    getCommands: () => voiceManager.getCommands(),
    isSupported: () => voiceManager.isVoiceSupported(),
    isListening: () => voiceManager.getListeningState(),
    isSpeaking: () => voiceManager.getSpeakingState()
  }
}
