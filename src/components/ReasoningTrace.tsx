import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ReasoningTrace.scss';
import { sessionRecorder } from '../lib/sessionRecorder';

interface ReasoningStep {
  id: string;
  transcript: string;
  classification: 'correct' | 'partial' | 'incorrect' | 'exploring';
  concepts: string[];
  confidence: number;
  timestamp: Date;
}

interface Misconception {
  type: string;
  evidence: string;
  severity: 'minor' | 'major';
  timestamp: Date;
}

const ReasoningTrace: React.FC = () => {
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [misconceptions, setMisconceptions] = useState<Misconception[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    // Poll for updates from session recorder
    const interval = setInterval(() => {
      const currentSession = sessionRecorder.getCurrentSession();
      if (currentSession) {
        setReasoningSteps(currentSession.reasoningSteps);
        setMisconceptions(currentSession.misconceptions);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getStepIcon = (classification: string) => {
    switch (classification) {
      case 'correct': return '✓';
      case 'partial': return '≈';
      case 'incorrect': return '✗';
      case 'exploring': return '?';
      default: return '•';
    }
  };

  const getStepColor = (classification: string) => {
    switch (classification) {
      case 'correct': return 'step-correct';
      case 'partial': return 'step-partial';
      case 'incorrect': return 'step-incorrect';
      case 'exploring': return 'step-exploring';
      default: return '';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="reasoning-trace">
      <h3 className="trace-title">Student Reasoning Journey</h3>
      
      <div className="trace-legend">
        <span className="legend-item correct">
          <span className="legend-icon">✓</span> Correct
        </span>
        <span className="legend-item partial">
          <span className="legend-icon">≈</span> Partial
        </span>
        <span className="legend-item incorrect">
          <span className="legend-icon">✗</span> Incorrect
        </span>
        <span className="legend-item exploring">
          <span className="legend-icon">?</span> Exploring
        </span>
      </div>

      <div className="trace-timeline">
        <AnimatePresence>
          {reasoningSteps.map((step, index) => {
            const relatedMisconception = misconceptions.find(m => 
              Math.abs(new Date(m.timestamp).getTime() - new Date(step.timestamp).getTime()) < 5000
            );

            return (
              <motion.div
                key={step.id}
                className={`trace-step ${getStepColor(step.classification)}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => setShowDetails(showDetails === step.id ? null : step.id)}
              >
                <div className="step-header">
                  <span className="step-icon">{getStepIcon(step.classification)}</span>
                  <span className="step-time">{formatTime(step.timestamp)}</span>
                  <span className="step-confidence">
                    {Math.round(step.confidence * 100)}%
                  </span>
                </div>
                
                <div className="step-content">
                  <p className="step-transcript">"{step.transcript}"</p>
                  
                  {step.concepts.length > 0 && (
                    <div className="step-concepts">
                      {step.concepts.map((concept, i) => (
                        <span key={i} className="concept-tag">{concept}</span>
                      ))}
                    </div>
                  )}

                  {relatedMisconception && (
                    <div className={`misconception-alert ${relatedMisconception.severity}`}>
                      <span className="alert-icon">⚠️</span>
                      <span className="alert-text">
                        {relatedMisconception.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {showDetails === step.id && (
                  <motion.div 
                    className="step-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {relatedMisconception && (
                      <div className="detail-section">
                        <h4>Misconception Details</h4>
                        <p>{relatedMisconception.evidence}</p>
                      </div>
                    )}
                    
                    <div className="detail-section">
                      <h4>Learning Progress</h4>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${step.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {reasoningSteps.length === 0 && (
          <div className="empty-state">
            <p>Student's reasoning steps will appear here as they work through the problem...</p>
          </div>
        )}
      </div>

      <div className="trace-summary">
        <div className="summary-stat">
          <span className="stat-value">{reasoningSteps.length}</span>
          <span className="stat-label">Steps</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">
            {reasoningSteps.filter(s => s.classification === 'correct').length}
          </span>
          <span className="stat-label">Correct</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{misconceptions.length}</span>
          <span className="stat-label">Challenges</span>
        </div>
      </div>
    </div>
  );
};

export default ReasoningTrace;