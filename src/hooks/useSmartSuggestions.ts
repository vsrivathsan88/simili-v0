import { useState, useCallback, useRef } from 'react';
import { Tool, FRACTION_TOOLS, NUMBER_TOOLS } from '../components/PiCharacter';

export interface ShapeRecognition {
  type: 'circle' | 'rectangle' | 'line' | 'unknown';
  confidence: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function useSmartSuggestions() {
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  const [suggestedTools, setSuggestedTools] = useState<Tool[]>([]);
  const lastSuggestionTime = useRef<number>(0);

  // Simple shape recognition based on drawing patterns
  const analyzeDrawing = useCallback((imageData: string): ShapeRecognition => {
    // This is a simplified version - in practice, you'd use more sophisticated
    // computer vision or analyze the drawing path data
    
    // For now, we'll simulate detection based on timing and patterns
    const now = Date.now();
    const timeSinceLastSuggestion = now - lastSuggestionTime.current;
    
    // Don't suggest too frequently
    if (timeSinceLastSuggestion < 5000) {
      return { type: 'unknown', confidence: 0 };
    }

    // Simulate shape detection (in real implementation, analyze the actual drawing)
    const shapes = ['circle', 'rectangle', 'line'] as const;
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence

    return {
      type: randomShape,
      confidence,
      bounds: {
        x: 100,
        y: 100,
        width: 200,
        height: 150
      }
    };
  }, []);

  const processDrawingForSuggestions = useCallback((imageData: string, lessonType: 'fractions' | 'numbers' = 'fractions') => {
    const recognition = analyzeDrawing(imageData);
    
    if (recognition.confidence < 0.7) return;

    let suggestion = '';
    let tools: Tool[] = [];

    switch (recognition.type) {
      case 'circle':
        if (lessonType === 'fractions') {
          suggestion = "I noticed you're drawing circles! I have some perfect fraction circles in my satchel.";
          tools = FRACTION_TOOLS.filter(tool => 
            tool.id.includes('circle') || tool.id.includes('pie') || tool.id.includes('pizza')
          );
        }
        break;
        
      case 'rectangle':
        if (lessonType === 'fractions') {
          suggestion = "Are you making fraction bars? I have some neat ones that might help!";
          tools = FRACTION_TOOLS.filter(tool => 
            tool.id.includes('bar') || tool.id.includes('rectangle')
          );
        }
        break;
        
      case 'line':
        suggestion = "I see you're drawing lines! Need a number line or some measuring tools?";
        tools = NUMBER_TOOLS.filter(tool => 
          tool.id.includes('line') || tool.id.includes('ruler')
        );
        break;
    }

    if (suggestion && tools.length > 0) {
      setCurrentSuggestion(suggestion);
      setSuggestedTools(tools);
      setHasSuggestion(true);
      lastSuggestionTime.current = Date.now();
    }
  }, [analyzeDrawing]);

  const dismissSuggestion = useCallback(() => {
    setHasSuggestion(false);
    setCurrentSuggestion('');
    setSuggestedTools([]);
  }, []);

  const acceptSuggestion = useCallback(() => {
    // Keep the tools but remove the suggestion bubble
    setHasSuggestion(false);
    setCurrentSuggestion('');
  }, []);

  return {
    hasSuggestion,
    currentSuggestion,
    suggestedTools,
    processDrawingForSuggestions,
    dismissSuggestion,
    acceptSuggestion
  };
}