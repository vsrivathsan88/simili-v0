// Design tokens aligned with design-scheme.md
export const designSystem = {
  // Roughness levels per design scheme
  roughness: {
    subtle: 0.6,
    normal: 1.2,
    playful: 1.8
  },
  
  // Accessibility-first color palette
  colors: {
    // Core neutrals
    paper: '#FFFDF6',
    ink: '#1F2937',
    line: '#CBD5E1',
    
    // Brand colors
    primary: '#4F46E5',
    secondary: '#6366F1',
    accent: '#93C5FD',
    
    // Feedback colors
    success: '#16A34A',
    warning: '#F59E0B',
    info: '#2563EB',
    error: '#DC2626',

    // Drawing colors (accessible subset)
    drawing: {
      blue: '#3B82F6',
      green: '#22C55E',
      purple: '#8B5CF6',
      orange: '#FB923C',
      red: '#EF4444',
      ink: '#1F2937', // Add ink to drawing colors
    },
    
    // UI colors
    ui: {
      background: '#FFFFFF',
      secondary: '#F8FAFC',
      line: '#CBD5E1',
    },
    
    // Semantic fills (backgrounds only, never for text)
    fills: {
      correct: '#E8F5E9',
      partial: '#FFF8E1',
      incorrect: '#FFEDD5',
      exploring: '#F3E8FF',
    }
  },
  
  // Motion respecting reduced motion preferences
  animations: {
    micro: { duration: 120 },
    short: { duration: 200 },
    medium: { duration: 300 },
    // Reduced motion alternatives
    reducedMotion: {
      scale: [1, 1.02, 1],
      opacity: [0.8, 1],
      duration: 200
    }
  },
  
  // rough.js defaults per design scheme
  roughDefaults: {
    roughness: 1.2,
    bowing: 0.6,
    strokeWidth: 2,
    fillStyle: 'hachure' as const,
    hachureAngle: -41,
    hachureGap: 8
  },
  
  // Hit area minimums
  hitArea: {
    minimum: 44, // 44x44px minimum touch target
    comfortable: 48 // 48x48px preferred
  },
  
  // Focus ring standards
  focus: {
    ringWidth: 3,
    ringColor: '#4338CA',
    ringOffset: 2
  },
  
  // Typography
  fonts: {
    casual: 'Kalam',
    handwritten: 'Caveat',
    body: 'Inter'
  }
}
