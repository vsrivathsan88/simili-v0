import React, { useState, useEffect } from 'react';
import './SlideAdvancementDebugger.scss';

interface SlideAdvancementDebuggerProps {
  currentSlideNumber: number;
  lessonConfig: any;
  isVisible?: boolean;
}

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

const SlideAdvancementDebugger: React.FC<SlideAdvancementDebuggerProps> = ({
  currentSlideNumber,
  lessonConfig,
  isVisible = false
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
      data
    };
    setLogs(prev => [...prev, entry].slice(-50)); // Keep last 50 logs
  };

  useEffect(() => {
    if (!isVisible) return;

    // Log current state
    addLog('info', `Debugger initialized - Current slide: ${currentSlideNumber}`);
    if (lessonConfig) {
      addLog('success', `Lesson config loaded: ${lessonConfig.lessonId} (${lessonConfig.slides.length} slides)`);
    } else {
      addLog('warning', 'No lesson config available');
    }

    // Set up event listeners for debugging
    const handleAdvanceSlide = (event: any) => {
      addLog('success', 'advance-slide event received!', event.detail);
    };

    const handleReasoningStep = (event: any) => {
      addLog('info', 'reasoning-step-added event received', event.detail);
    };

    const handleMisconception = (event: any) => {
      addLog('warning', 'misconception-flagged event received', event.detail);
    };

    const handleCelebration = (event: any) => {
      addLog('info', 'celebrate-exploration event received', event.detail);
    };

    // Add event listeners
    window.addEventListener('advance-slide', handleAdvanceSlide);
    window.addEventListener('reasoning-step-added', handleReasoningStep);
    window.addEventListener('misconception-flagged', handleMisconception);
    window.addEventListener('celebrate-exploration', handleCelebration);

    // Clean up
    return () => {
      window.removeEventListener('advance-slide', handleAdvanceSlide);
      window.removeEventListener('reasoning-step-added', handleReasoningStep);
      window.removeEventListener('misconception-flagged', handleMisconception);
      window.removeEventListener('celebrate-exploration', handleCelebration);
    };
  }, [isVisible, currentSlideNumber, lessonConfig]);

  const testSlideAdvancement = () => {
    addLog('info', 'Testing slide advancement manually...');
    
    const testEvent = new CustomEvent('advance-slide', {
      detail: {
        id: 'test-' + Date.now(),
        currentSlide: currentSlideNumber,
        nextSlide: currentSlideNumber + 1,
        masteryEvidence: 'Manual test advancement',
        timestamp: Date.now(),
        validation: {
          confidence: 1.0,
          shouldAdvance: true,
          evidence: ['Manual test'],
          missingElements: []
        }
      }
    });

    window.dispatchEvent(testEvent);
    addLog('success', 'Test event dispatched');
  };

  const testAIToolCall = async () => {
    addLog('info', 'Simulating AI tool call...');
    
    try {
      // Import and call the tool implementation directly
      const { toolImplementations } = await import('../lib/toolImplementations');
      
      const result = await toolImplementations.advance_slide({
        current_slide: currentSlideNumber,
        next_slide: currentSlideNumber + 1,
        mastery_evidence: 'Simulated AI tool call test'
      });
      
      addLog('success', 'AI tool call simulation successful', result);
    } catch (error) {
      addLog('error', `AI tool call simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  if (!isVisible) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="slide-advancement-debugger">
      <div className="debugger-header">
        <button 
          className="debugger-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          🐛 Slide Debug {isExpanded ? '▼' : '▶'}
        </button>
        <div className="debugger-status">
          Slide {currentSlideNumber} | {lessonConfig?.lessonId || 'No lesson'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="debugger-content">
          <div className="debugger-controls">
            <button onClick={testSlideAdvancement} className="test-btn">
              Test Event
            </button>
            <button onClick={testAIToolCall} className="test-btn">
              Test AI Tool
            </button>
            <button onClick={clearLogs} className="clear-btn">
              Clear Logs
            </button>
          </div>
          
          <div className="debugger-logs">
            {logs.length === 0 ? (
              <div className="no-logs">No logs yet...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-time">{formatTime(log.timestamp)}</span>
                  <span className="log-icon">{getTypeIcon(log.type)}</span>
                  <span className="log-message">{log.message}</span>
                  {log.data && (
                    <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideAdvancementDebugger;