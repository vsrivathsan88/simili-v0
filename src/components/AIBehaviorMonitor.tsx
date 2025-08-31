/**
 * AI Behavior Monitor Component
 * 
 * Development and testing tool for monitoring AI slide advancement behavior
 * Shows real-time validation of advancement decisions and behavioral compliance
 */

import React, { useState, useEffect } from 'react';
import { SlideAdvancementMonitor } from '../lib/slideAdvancementTesting';
import { BehaviorValidator, behaviorTestScenarios } from '../lib/behaviorValidation';
import './AIBehaviorMonitor.scss';

interface AIBehaviorMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

const AIBehaviorMonitor: React.FC<AIBehaviorMonitorProps> = ({ isVisible, onToggle }) => {
  const [monitor] = useState(() => SlideAdvancementMonitor.getInstance());
  const [validator] = useState(() => BehaviorValidator.getInstance());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'advancements' | 'behavior' | 'scenarios'>('advancements');

  // Refresh data every 2 seconds when visible
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const advancementHistory = monitor.getAdvancementHistory();
  const aiDecisionHistory = monitor.getAIDecisionHistory();
  const complianceReport = validator.getComplianceReport();

  const handleClearLogs = () => {
    monitor.clearLogs();
    validator.reset();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExportLogs = () => {
    const logs = {
      advancement_monitor: monitor.exportLogs(),
      behavior_validator: validator.exportForDebug(),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-behavior-logs-${Date.now()}.json`;
    a.click();
  };

  if (!isVisible) {
    return (
      <button className="ai-monitor-toggle" onClick={onToggle}>
        🤖 AI Monitor
      </button>
    );
  }

  return (
    <div className="ai-behavior-monitor">
      <div className="monitor-header">
        <h3>🤖 AI Behavior Monitor</h3>
        <div className="monitor-controls">
          <button onClick={handleClearLogs} className="btn-clear">
            🧹 Clear Logs
          </button>
          <button onClick={handleExportLogs} className="btn-export">
            📥 Export Logs
          </button>
          <button onClick={onToggle} className="btn-close">
            ✕
          </button>
        </div>
      </div>

      <div className="monitor-tabs">
        <button 
          className={`tab ${activeTab === 'advancements' ? 'active' : ''}`}
          onClick={() => setActiveTab('advancements')}
        >
          🚀 Slide Advancements ({advancementHistory.length})
        </button>
        <button 
          className={`tab ${activeTab === 'behavior' ? 'active' : ''}`}
          onClick={() => setActiveTab('behavior')}
        >
          ⏱️ Behavior Compliance
        </button>
        <button 
          className={`tab ${activeTab === 'scenarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenarios')}
        >
          🧪 Test Scenarios
        </button>
      </div>

      <div className="monitor-content">
        {activeTab === 'advancements' && (
          <div className="advancements-panel">
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total Advancements:</span>
                <span className="stat-value">{advancementHistory.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">AI Decisions:</span>
                <span className="stat-value">{aiDecisionHistory.length}</span>
              </div>
            </div>

            <div className="recent-advancements">
              <h4>Recent Slide Advancements</h4>
              {advancementHistory.slice(-5).reverse().map((advancement, index) => (
                <div key={index} className="advancement-item">
                  <div className="advancement-header">
                    <span className="advancement-transition">
                      Slide {advancement.data.fromSlide || advancement.slideNumber} → {advancement.data.toSlide}
                    </span>
                    <span className="advancement-time">
                      {new Date(advancement.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="advancement-evidence">
                    <strong>Evidence:</strong> {advancement.data.evidence}
                  </div>
                  <div className="advancement-success">
                    Status: {advancement.data.success ? '✅ Success' : '❌ Failed'}
                  </div>
                </div>
              ))}
              {advancementHistory.length === 0 && (
                <div className="no-data">No slide advancements recorded yet</div>
              )}
            </div>

            <div className="ai-decisions">
              <h4>Recent AI Decisions</h4>
              {aiDecisionHistory.slice(-3).reverse().map((decision, index) => (
                <div key={index} className="decision-item">
                  <div className="decision-header">
                    <span className="decision-action">{decision.data.decision}</span>
                    <span className="decision-slide">Slide {decision.slideNumber}</span>
                  </div>
                  <div className="decision-evidence">
                    <strong>Evidence Found:</strong> {decision.data.evidence.join(', ') || 'None'}
                  </div>
                  <div className="decision-reasoning">
                    <strong>Reasoning:</strong> {decision.data.reasoning}
                  </div>
                </div>
              ))}
              {aiDecisionHistory.length === 0 && (
                <div className="no-data">No AI decisions recorded yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="behavior-panel">
            <div className="compliance-summary">
              <h4>Behavioral Compliance Report</h4>
              <div className="compliance-status">
                <span className={`status-badge ${complianceReport.behavioral_compliance.valid ? 'valid' : 'invalid'}`}>
                  {complianceReport.behavioral_compliance.valid ? '✅ Compliant' : '⚠️ Issues Detected'}
                </span>
              </div>
            </div>

            <div className="session-stats">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">{complianceReport.session_summary.total_interactions}</span>
                  <span className="stat-label">Total Interactions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{complianceReport.session_summary.questions}</span>
                  <span className="stat-label">Questions Asked</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{complianceReport.session_summary.tool_calls}</span>
                  <span className="stat-label">Tool Calls</span>
                </div>
                <div className="stat-item">
                  <span className={`stat-number ${complianceReport.session_summary.wait_time_violations > 0 ? 'warning' : ''}`}>
                    {complianceReport.session_summary.wait_time_violations}
                  </span>
                  <span className="stat-label">Wait Time Violations</span>
                </div>
              </div>
            </div>

            {complianceReport.behavioral_compliance.issues.length > 0 && (
              <div className="compliance-issues">
                <h5>⚠️ Issues Detected</h5>
                <ul>
                  {complianceReport.behavioral_compliance.issues.map((issue, index) => (
                    <li key={index} className="issue-item">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {complianceReport.behavioral_compliance.recommendations.length > 0 && (
              <div className="compliance-recommendations">
                <h5>💡 Recommendations</h5>
                <ul>
                  {complianceReport.behavioral_compliance.recommendations.map((rec, index) => (
                    <li key={index} className="recommendation-item">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="scenarios-panel">
            <h4>Test Scenarios for Validation</h4>
            <div className="scenario-list">
              {behaviorTestScenarios.map((scenario, index) => (
                <div key={index} className="scenario-item">
                  <h5>{scenario.name}</h5>
                  <p className="scenario-description">{scenario.description}</p>
                  <div className="scenario-steps">
                    <strong>Test Steps:</strong>
                    <ol>
                      {scenario.testSteps.map((step, stepIndex) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="expected-behavior">
                    <strong>Expected Behavior:</strong> {scenario.expectedBehavior}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIBehaviorMonitor;