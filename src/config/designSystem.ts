// Design tokens for rough.js hand-drawn UI
export const designSystem = {
  // Roughness levels
  roughness: {
    subtle: 0.5,    // Nearly straight
    normal: 1.5,    // Clearly hand-drawn
    playful: 2.5    // Very sketchy
  },
  
  // Color palette (warm, friendly)
  colors: {
    paper: '#FFFEF7',        // Warm white
    ink: '#2D3748',          // Soft black
    primary: '#5B21B6',      // Purple
    success: '#059669',      // Green
    warning: '#D97706',      // Amber
    error: '#DC2626',        // Red (used sparingly)
    
    // Pastel fills for bubbles
    fills: {
      correct: '#D1FAE5',    // Light green
      partial: '#FEF3C7',    // Light yellow
      incorrect: '#FED7AA',  // Light orange
      exploring: '#E9D5FF'   // Light purple
    }
  },
  
  // Animation presets
  animations: {
    drawIn: {
      strokeDasharray: 1000,
      strokeDashoffset: [1000, 0],
      duration: 1000
    },
    pulse: {
      scale: [1, 1.05, 1],
      duration: 500
    },
    celebrate: {
      rotate: [-5, 5, -5],
      scale: [1, 1.1, 1],
      duration: 300
    }
  },
  
  // Typography
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    handwritten: '"Comic Sans MS", "Marker Felt", cursive'
  }
};