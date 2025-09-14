import React, { useState, useEffect } from 'react';
import { systemMonitor } from '../lib/monitoring/systemMonitor';
import { reliabilityLayer } from '../lib/reliability/reliabilityLayer';
import { useThreeActStore } from '../stores/threeActStore';
import './DebugPanel.scss';

/**
 * Debug Panel: Visual debugging without interfering with Gemini
 * Only visible in development mode
 */
const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'state' | 'health'>('logs');
  
  const currentAct = useThreeActStore(state => state.currentAct);
  const connected = (window as any).geminiConnected || false;
  
  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;
    
    // Listen for logs
    const handleLog = (log: any) => {
      setLogs(prev => [...prev.slice(-50), log]); // Keep last 50
    };
    
    systemMonitor.on('log', handleLog);
    
    // Periodic health checks
    const healthInterval = setInterval(async () => {
      const health = await reliabilityLayer.performHealthCheck();
      setHealthStatus(health);
    }, 5000);
    
    // Keyboard shortcut (Ctrl+Shift+D)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      systemMonitor.off('log', handleLog);
      clearInterval(healthInterval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
  
  if (process.env.NODE_ENV !== 'development' || !isOpen) {
    return null;
  }
  
  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };
  
  const exportDebugInfo = async () => {
    const report = await systemMonitor.exportLogs();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simili-debug-${Date.now()}.json`;
    a.click();
  };
  
  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>🐛 Debug Panel</h3>
        <div className="debug-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢' : '🔴'} Gemini
          </span>
          <span className="current-act">Act {currentAct}</span>
        </div>
        <button onClick={() => setIsOpen(false)}>✕</button>
      </div>
      
      <div className="debug-tabs">
        <button 
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
        <button 
          className={activeTab === 'state' ? 'active' : ''}
          onClick={() => setActiveTab('state')}
        >
          State
        </button>
        <button 
          className={activeTab === 'health' ? 'active' : ''}
          onClick={() => setActiveTab('health')}
        >
          Health
        </button>
      </div>
      
      <div className="debug-content">
        {activeTab === 'logs' && (
          <div className="logs-tab">
            <div className="log-filters">
              <button onClick={() => setLogs([])}>Clear</button>
              <button onClick={exportDebugInfo}>Export</button>
            </div>
            <div className="log-list">
              {logs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`log-entry ${log.level}`}
                  style={{ borderLeftColor: getLogColor(log.level) }}
                >
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="log-type">[{log.type}]</span>
                  <span className="log-message">{log.message}</span>
                  {log.data && (
                    <details className="log-data">
                      <summary>Data</summary>
                      <pre>{JSON.stringify(log.data, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'state' && (
          <div className="state-tab">
            <div className="state-section">
              <h4>Current State</h4>
              <pre>{JSON.stringify({
                act: currentAct,
                connected,
                contextCards: 'Active', // Simplified
                agents: 'Running'
              }, null, 2)}</pre>
            </div>
            
            <div className="state-section">
              <h4>Quick Actions</h4>
              <button onClick={() => {
                reliabilityLayer.attemptRecovery('state_mismatch');
              }}>
                Force State Sync
              </button>
              <button onClick={() => {
                reliabilityLayer.attemptRecovery('counting_error');
              }}>
                Inject Count Correction
              </button>
              <button onClick={() => {
                systemMonitor.snapshot('manual_debug');
              }}>
                Take Snapshot
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'health' && (
          <div className="health-tab">
            {healthStatus && (
              <>
                <div className={`health-summary ${healthStatus.healthy ? 'healthy' : 'unhealthy'}`}>
                  {healthStatus.healthy ? '✅ System Healthy' : '⚠️ Issues Detected'}
                </div>
                <div className="health-checks">
                  {healthStatus.checks?.map((check: any, idx: number) => (
                    <div key={idx} className={`health-check ${check.passed ? 'passed' : 'failed'}`}>
                      <span>{check.passed ? '✓' : '✗'}</span>
                      <span>{check.name}</span>
                      <span>{check.message}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;