/**
 * Enhanced Vision Service for Real-Time Canvas Analysis
 * Uses Gemini 2.5 Pro for high-quality vision understanding
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface VisionAnalysis {
  mathConcepts: string[];
  studentActions: string[];
  drawingDescription: string;
  problemProgress: 'not_started' | 'exploring' | 'working' | 'stuck' | 'complete';
  suggestions: string[];
  offTaskDetected: boolean;
  confidence: number;
}

interface VisionUpdate {
  problemImage: string;
  canvasImage: string;
  timestamp: number;
  context?: string;
}

export class EnhancedVisionService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private lastAnalysis: VisionAnalysis | null = null;
  private analysisQueue: VisionUpdate[] = [];
  private isProcessing = false;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Pro for superior vision capabilities
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent analysis
        topK: 1,
        topP: 1,
      }
    });
  }

  /**
   * Analyze canvas with high-quality vision model
   */
  async analyzeCanvas(update: VisionUpdate): Promise<VisionAnalysis> {
    try {
      // Convert base64 to proper format
      const problemBase64 = update.problemImage.split(',')[1];
      const canvasBase64 = update.canvasImage.split(',')[1];

      const prompt = `You are analyzing a student's work on a math problem. Look at these two images:

Image 1: The math problem the student needs to solve
Image 2: The student's current work on their digital canvas (includes drawings, manipulatives, and thinking)

Analyze the student's progress and provide detailed feedback in the following areas:

1. MATH CONCEPTS: What mathematical concepts are the student working with?
2. STUDENT ACTIONS: What specific actions has the student taken? (drawing, using tools, etc.)
3. DRAWING DESCRIPTION: Describe exactly what you see on the student's canvas
4. PROGRESS ASSESSMENT: Where is the student in their problem-solving journey?
5. SUGGESTIONS: What should the student try next?
6. OFF-TASK DETECTION: Is the student focused on the math problem or drawing unrelated things?

Focus on being specific about what you observe and providing constructive guidance.`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: problemBase64,
            mimeType: "image/jpeg"
          }
        },
        {
          inlineData: {
            data: canvasBase64,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = result.response.text();
      
      // Parse the structured response (would implement more sophisticated parsing)
      const analysis = this.parseVisionResponse(response);
      this.lastAnalysis = analysis;
      
      return analysis;
      
    } catch (error) {
      console.error('Vision analysis error:', error);
      return {
        mathConcepts: [],
        studentActions: ['Unable to analyze'],
        drawingDescription: 'Vision analysis unavailable',
        problemProgress: 'exploring',
        suggestions: [],
        offTaskDetected: false,
        confidence: 0
      };
    }
  }

  /**
   * Queue vision update for processing
   */
  queueVisionUpdate(update: VisionUpdate) {
    this.analysisQueue.push(update);
    this.processQueue();
  }

  /**
   * Process vision analysis queue
   */
  private async processQueue() {
    if (this.isProcessing || this.analysisQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get the most recent update (skip older ones for real-time)
      const latestUpdate = this.analysisQueue[this.analysisQueue.length - 1];
      this.analysisQueue = []; // Clear queue, we're processing the latest

      const analysis = await this.analyzeCanvas(latestUpdate);
      
      // Emit analysis results for Pi to use
      window.dispatchEvent(new CustomEvent('vision-analysis-complete', {
        detail: {
          analysis,
          timestamp: latestUpdate.timestamp,
          context: latestUpdate.context
        }
      }));

    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
      
      // Process next item if queue has grown
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Get optimized image quality based on activity
   */
  getOptimalImageQuality(isActiveDrawing: boolean): number {
    // Lower quality during active drawing for speed
    // Higher quality when paused for detailed analysis
    return isActiveDrawing ? 0.6 : 0.9;
  }

  /**
   * Compress image for faster transmission
   */
  async compressImage(imageDataUrl: string, quality: number = 0.8): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Adaptive sizing - smaller during active work
        const maxWidth = quality < 0.7 ? 800 : 1200;
        const scale = Math.min(1, maxWidth / img.width);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = imageDataUrl;
    });
  }

  /**
   * Parse vision model response into structured data
   */
  private parseVisionResponse(response: string): VisionAnalysis {
    // Simple parsing - could be made more sophisticated
    const lines = response.split('\n');
    
    return {
      mathConcepts: this.extractSection(lines, 'MATH CONCEPTS'),
      studentActions: this.extractSection(lines, 'STUDENT ACTIONS'),
      drawingDescription: this.extractText(lines, 'DRAWING DESCRIPTION'),
      problemProgress: this.extractProgress(lines),
      suggestions: this.extractSection(lines, 'SUGGESTIONS'),
      offTaskDetected: this.extractOffTask(lines),
      confidence: 0.8 // Default confidence
    };
  }

  private extractSection(lines: string[], section: string): string[] {
    const sectionStart = lines.findIndex(line => 
      line.toUpperCase().includes(section)
    );
    
    if (sectionStart === -1) return [];
    
    const items = [];
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-') || line.startsWith('•')) {
        items.push(line.substring(1).trim());
      } else if (line.includes(':')) {
        break; // Next section
      }
    }
    
    return items;
  }

  private extractText(lines: string[], section: string): string {
    const sectionStart = lines.findIndex(line => 
      line.toUpperCase().includes(section)
    );
    
    if (sectionStart === -1) return '';
    
    return lines[sectionStart + 1]?.trim() || '';
  }

  private extractProgress(lines: string[]): VisionAnalysis['problemProgress'] {
    const progressLine = lines.find(line => 
      line.toUpperCase().includes('PROGRESS')
    );
    
    if (!progressLine) return 'exploring';
    
    const lower = progressLine.toLowerCase();
    if (lower.includes('not started')) return 'not_started';
    if (lower.includes('working')) return 'working';
    if (lower.includes('stuck')) return 'stuck';
    if (lower.includes('complete')) return 'complete';
    
    return 'exploring';
  }

  private extractOffTask(lines: string[]): boolean {
    const offTaskLine = lines.find(line => 
      line.toUpperCase().includes('OFF-TASK')
    );
    
    return offTaskLine?.toLowerCase().includes('yes') || false;
  }

  /**
   * Get last analysis for reference
   */
  getLastAnalysis(): VisionAnalysis | null {
    return this.lastAnalysis;
  }
}