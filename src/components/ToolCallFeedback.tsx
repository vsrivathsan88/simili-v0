import { useEffect, useState } from 'react';
import { sessionStore } from '../lib/toolImplementations';
import './ToolCallFeedback.scss';

export function ToolCallFeedback() {
  const [recentSteps, setRecentSteps] = useState<any[]>([]);
  const [lastMisconception, setLastMisconception] = useState<any>(null);
  
  useEffect(() => {
    // Listen for tool call events
    const handleReasoningStep = (event: CustomEvent) => {
      setRecentSteps(prev => [...prev.slice(-2), event.detail]);
      
      // Auto-clear after 10 seconds
      setTimeout(() => {
        setRecentSteps(prev => prev.filter(s => s.id !== event.detail.id));
      }, 10000);
    };
    
    const handleMisconception = (event: CustomEvent) => {
      setLastMisconception(event.detail);
      
      // Clear after 5 seconds
      setTimeout(() => setLastMisconception(null), 5000);
    };
    
    const handleCelebration = (event: CustomEvent) => {
      console.log('Celebration!', event.detail);
      // Could add visual celebration here
    };
    
    window.addEventListener('reasoning-step-added', handleReasoningStep as any);
    window.addEventListener('misconception-flagged', handleMisconception as any);
    window.addEventListener('celebrate-exploration', handleCelebration as any);
    
    return () => {
      window.removeEventListener('reasoning-step-added', handleReasoningStep as any);
      window.removeEventListener('misconception-flagged', handleMisconception as any);
      window.removeEventListener('celebrate-exploration', handleCelebration as any);
    };
  }, []);
  
  if (recentSteps.length === 0 && !lastMisconception) return null;
  
  return (
    <div className="tool-call-feedback">
      {recentSteps.map(step => (
        <div 
          key={step.id} 
          className={`reasoning-step reasoning-step--${step.classification}`}
        >
          <span className="step-icon">
            {step.classification === 'correct' && '✓'}
            {step.classification === 'partial' && '~'}
            {step.classification === 'incorrect' && '!'}
            {step.classification === 'exploring' && '?'}
          </span>
          <span className="step-text">"{step.transcript}"</span>
        </div>
      ))}
      
      {lastMisconception && (
        <div className="misconception-alert">
          <span className="misconception-icon">💡</span>
          <span className="misconception-text">
            Interesting thinking! Let's explore this together...
          </span>
        </div>
      )}
    </div>
  );
}