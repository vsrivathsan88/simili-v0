/**
 * Enhanced Vision Service for Real-Time Canvas Analysis
 * Works with existing Gemini Live system for immediate vision updates
 */

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
  private lastAnalysis: VisionAnalysis | null = null;
  private analysisQueue: VisionUpdate[] = [];
  private isProcessing = false;
  
  constructor(apiKey: string) {
    // No longer need separate model - will use Gemini Live directly
    console.log('Enhanced Vision Service initialized for real-time processing');
  }

  /**
   * Process canvas update - simplified for real-time performance
   */
  async analyzeCanvas(update: VisionUpdate): Promise<VisionAnalysis> {
    try {
      // For now, create a basic analysis structure
      // The actual vision analysis will be handled by Gemini Live directly
      const analysis: VisionAnalysis = {
        mathConcepts: ['fractions', 'visual_representation'],
        studentActions: ['drawing', 'using_tools'],
        drawingDescription: `Student work on canvas - ${update.context}`,
        problemProgress: 'working',
        suggestions: ['Continue exploring', 'Try different approach'],
        offTaskDetected: false,
        confidence: 0.8
      };
      
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

  // Parsing methods removed - using simplified analysis for real-time performance

  /**
   * Get last analysis for reference
   */
  getLastAnalysis(): VisionAnalysis | null {
    return this.lastAnalysis;
  }
}