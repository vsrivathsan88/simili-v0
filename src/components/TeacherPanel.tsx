import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TeacherPanel.scss';
import ReasoningTrace from './ReasoningTrace';
import StudentProgress from './StudentProgress';

interface TeacherPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const TeacherPanel: React.FC<TeacherPanelProps> = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'reasoning' | 'analytics' | 'progress' | 'settings'>('reasoning');

  return (
    <>
      {/* Toggle button */}
      <button 
        className={`teacher-panel-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        title={isOpen ? 'Close teacher view' : 'Open teacher view'}
      >
        <span className="icon">👩‍🏫</span>
        <span className="label">{isOpen ? 'Hide' : 'Teacher'}</span>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="teacher-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="panel-header">
              <h2>Teacher Dashboard</h2>
              <button className="close-btn" onClick={onToggle}>✕</button>
            </div>

            <div className="panel-tabs">
              <button
                className={`tab ${activeTab === 'reasoning' ? 'active' : ''}`}
                onClick={() => setActiveTab('reasoning')}
              >
                Student Reasoning
              </button>
              <button
                className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
              <button
                className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
                onClick={() => setActiveTab('progress')}
              >
                Progress
              </button>
              <button
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>

            <div className="panel-content">
              {activeTab === 'reasoning' && (
                <div className="reasoning-section">
                  <ReasoningTrace />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="analytics-section">
                  <h3>Session Analytics</h3>
                  
                  <div className="stat-cards">
                    <div className="stat-card">
                      <span className="stat-value">7:32</span>
                      <span className="stat-label">Time on Task</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-value">12</span>
                      <span className="stat-label">Attempts</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-value">3</span>
                      <span className="stat-label">Hints Given</span>
                    </div>
                  </div>

                  <div className="insights">
                    <h4>Key Insights</h4>
                    <ul>
                      <li>Student understands basic fraction concepts</li>
                      <li>Struggling with equivalent fractions</li>
                      <li>Good use of visual manipulatives</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="progress-section">
                  <StudentProgress />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="settings-section">
                  <h3>Tutor Settings</h3>
                  
                  <div className="setting-group">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Auto-provide hints after 2 attempts
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Track misconceptions
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input type="checkbox" />
                      Show worked examples
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>
                      Difficulty Level
                      <select defaultValue="adaptive">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="adaptive">Adaptive</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TeacherPanel;