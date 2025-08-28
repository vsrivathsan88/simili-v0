/**
 * Real-Time Canvas System for Immediate Pi Vision Updates
 * Optimized for impatient kids - no delays, instant feedback
 */

import { EnhancedVisionService } from './visionService';

interface CanvasEvent {
  type: 'stroke_end' | 'tool_change' | 'manipulative_move' | 'clear' | 'pause';
  timestamp: number;
  data?: any;
}

interface RealTimeCanvasOptions {
  visionService: EnhancedVisionService;
  onVisionUpdate: (analysis: any) => void;
  onActivityChange: (isActive: boolean) => void;
  problemImage: string;
}

export class RealTimeCanvasHandler {
  private visionService: EnhancedVisionService;
  private onVisionUpdate: (analysis: any) => void;
  private onActivityChange: (isActive: boolean) => void;
  private problemImage: string;
  
  private isActiveDrawing = false;
  private lastActivity = 0;
  private activityTimer: NodeJS.Timeout | null = null;
  private lastVisionUpdate = 0;
  private pendingUpdate = false;
  
  // Rate limiting for vision updates
  private readonly MIN_UPDATE_INTERVAL = 200; // 200ms minimum between updates
  private readonly ACTIVITY_TIMEOUT = 2000; // 2s of inactivity = not drawing
  
  constructor(options: RealTimeCanvasOptions) {
    this.visionService = options.visionService;
    this.onVisionUpdate = options.onVisionUpdate;
    this.onActivityChange = options.onActivityChange;
    this.problemImage = options.problemImage;
    
    this.setupActivityDetection();
  }

  /**
   * Handle canvas events in real-time
   */
  handleCanvasEvent(event: CanvasEvent, canvasImageData: string) {
    this.updateActivity();
    
    switch (event.type) {
      case 'stroke_end':
        this.handleStrokeEnd(canvasImageData);
        break;
        
      case 'tool_change':
        this.handleToolChange(canvasImageData, event.data);
        break;
        
      case 'manipulative_move':
        this.handleManipulativeMove(canvasImageData, event.data);
        break;
        
      case 'clear':
        this.handleCanvasClear(canvasImageData);
        break;
        
      case 'pause':
        this.handlePause(canvasImageData);
        break;
    }
  }

  /**
   * Handle end of drawing stroke - immediate update
   */
  private async handleStrokeEnd(canvasImageData: string) {
    console.log('Stroke ended - sending immediate vision update');
    
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastVisionUpdate;
    
    if (timeSinceLastUpdate < this.MIN_UPDATE_INTERVAL) {
      // Too soon, queue for later
      if (!this.pendingUpdate) {
        this.pendingUpdate = true;
        setTimeout(() => {
          this.sendVisionUpdate(canvasImageData, 'stroke_drawing');
          this.pendingUpdate = false;
        }, this.MIN_UPDATE_INTERVAL - timeSinceLastUpdate);
      }
    } else {
      // Send immediately
      this.sendVisionUpdate(canvasImageData, 'stroke_completed');
    }
  }

  /**
   * Handle tool change - contextual update
   */
  private handleToolChange(canvasImageData: string, toolData: any) {
    console.log('Tool changed to:', toolData.tool);
    this.sendVisionUpdate(canvasImageData, `switched_to_${toolData.tool}`);
  }

  /**
   * Handle manipulative movement - positional update
   */
  private handleManipulativeMove(canvasImageData: string, manipulativeData: any) {
    console.log('Manipulative moved:', manipulativeData);
    this.sendVisionUpdate(canvasImageData, `moved_${manipulativeData.type}_to_${manipulativeData.x}_${manipulativeData.y}`);
  }

  /**
   * Handle canvas clear - immediate full update
   */
  private handleCanvasClear(canvasImageData: string) {
    console.log('Canvas cleared - full state update');
    this.sendVisionUpdate(canvasImageData, 'canvas_cleared', true);
  }

  /**
   * Handle pause in activity - high quality update
   */
  private handlePause(canvasImageData: string) {
    console.log('Activity paused - sending high-quality analysis');
    this.sendVisionUpdate(canvasImageData, 'detailed_analysis', true);
  }

  /**
   * Send vision update with appropriate quality and context
   */
  private async sendVisionUpdate(canvasImageData: string, context: string, highQuality = false) {
    try {
      this.lastVisionUpdate = Date.now();
      
      // Determine image quality based on activity and context
      const quality = highQuality ? 0.9 : this.visionService.getOptimalImageQuality(this.isActiveDrawing);
      
      // Compress image for faster transmission
      const compressedCanvas = await this.visionService.compressImage(canvasImageData, quality);
      const compressedProblem = await this.visionService.compressImage(this.problemImage, quality);
      
      // Queue for analysis with Gemini 2.5 Pro
      this.visionService.queueVisionUpdate({
        problemImage: compressedProblem,
        canvasImage: compressedCanvas,
        timestamp: Date.now(),
        context
      });
      
      console.log(`Vision update sent: ${context} (quality: ${quality})`);
      
    } catch (error) {
      console.error('Failed to send vision update:', error);
    }
  }

  /**
   * Update activity tracking
   */
  private updateActivity() {
    const now = Date.now();
    this.lastActivity = now;
    
    if (!this.isActiveDrawing) {
      this.isActiveDrawing = true;
      this.onActivityChange(true);
      console.log('Student started drawing');
    }
    
    // Reset activity timer
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    this.activityTimer = setTimeout(() => {
      this.isActiveDrawing = false;
      this.onActivityChange(false);
      console.log('Student stopped drawing - sending detailed analysis');
      
      // Send high-quality analysis after inactivity
      this.handlePause(this.getLastCanvasState());
    }, this.ACTIVITY_TIMEOUT);
  }

  /**
   * Setup activity detection listeners
   */
  private setupActivityDetection() {
    // Listen for vision analysis results
    window.addEventListener('vision-analysis-complete', (event: any) => {
      const { analysis, context } = event.detail;
      this.onVisionUpdate({
        analysis,
        context,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Update problem image
   */
  updateProblemImage(newProblemImage: string) {
    this.problemImage = newProblemImage;
    console.log('Problem image updated');
  }

  /**
   * Get current canvas state (placeholder - would integrate with actual canvas)
   */
  private getLastCanvasState(): string {
    // This would be implemented to get the actual canvas image data
    // For now, returning empty - would integrate with UnifiedCanvas
    return '';
  }

  /**
   * Force immediate vision update (for testing/debugging)
   */
  forceVisionUpdate(canvasImageData: string) {
    this.sendVisionUpdate(canvasImageData, 'forced_update', true);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    window.removeEventListener('vision-analysis-complete', this.setupActivityDetection);
  }
}