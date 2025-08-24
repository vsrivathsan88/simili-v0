import React, { useEffect, useState } from 'react';
import './StudentProgress.scss';
import { sessionRecorder } from '../lib/sessionRecorder';

interface ProgressData {
  totalSessions: number;
  totalProblems: number;
  conceptsMastered: string[];
  strugglingConcepts: string[];
  recentActivity: {
    date: string;
    problemsSolved: number;
    conceptsPracticed: string[];
  }[];
  masteryByUnit: {
    unit: string;
    mastery: number;
    concepts: string[];
  }[];
}

const StudentProgress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  useEffect(() => {
    // Load all sessions from localStorage
    const sessions = sessionRecorder.getAllSessions();
    
    // Process sessions to extract progress data
    const data = processSessionsForProgress(sessions);
    setProgressData(data);
  }, []);

  const processSessionsForProgress = (sessions: any[]): ProgressData => {
    const conceptFrequency: { [key: string]: number } = {};
    const misconceptionFrequency: { [key: string]: number } = {};
    const recentActivity: any[] = [];
    
    sessions.forEach(session => {
      // Count concepts
      session.reasoningSteps.forEach((step: any) => {
        if (step.concepts) {
          step.concepts.forEach((concept: string) => {
            conceptFrequency[concept] = (conceptFrequency[concept] || 0) + 1;
          });
        }
      });
      
      // Count misconceptions
      session.misconceptions.forEach((misconception: any) => {
        if (misconception.type) {
          misconceptionFrequency[misconception.type] = 
            (misconceptionFrequency[misconception.type] || 0) + 1;
        }
      });
      
      // Add to recent activity
      if (recentActivity.length < 7) {
        recentActivity.push({
          date: new Date(session.endTime || session.startTime).toLocaleDateString(),
          problemsSolved: session.reasoningSteps.length > 0 ? 1 : 0,
          conceptsPracticed: Array.from(new Set(
            session.reasoningSteps.flatMap((s: any) => s.concepts || [])
          ))
        });
      }
    });
    
    // Determine mastered vs struggling concepts
    const conceptsMastered = Object.entries(conceptFrequency)
      .filter(([_, count]) => count >= 3)
      .map(([concept]) => concept);
      
    const strugglingConcepts = Object.keys(misconceptionFrequency)
      .filter(concept => misconceptionFrequency[concept] >= 2);
    
    // Calculate mastery by unit
    const masteryByUnit = [
      {
        unit: 'Fractions Basics',
        mastery: calculateMastery(['equal parts', 'numerator', 'denominator'], conceptFrequency),
        concepts: ['equal parts', 'numerator', 'denominator']
      },
      {
        unit: 'Equivalent Fractions',
        mastery: calculateMastery(['equivalent fractions', 'same size'], conceptFrequency),
        concepts: ['equivalent fractions', 'same size different pieces']
      },
      {
        unit: 'Comparing Fractions',
        mastery: calculateMastery(['comparing fractions', 'number line'], conceptFrequency),
        concepts: ['comparing fractions', 'number line', 'visual comparison']
      },
      {
        unit: 'Operations',
        mastery: calculateMastery(['adding fractions', 'subtracting fractions'], conceptFrequency),
        concepts: ['adding fractions', 'subtracting fractions', 'like denominators']
      }
    ];
    
    return {
      totalSessions: sessions.length,
      totalProblems: sessions.reduce((sum, s) => sum + (s.reasoningSteps.length > 0 ? 1 : 0), 0),
      conceptsMastered,
      strugglingConcepts,
      recentActivity,
      masteryByUnit
    };
  };

  const calculateMastery = (concepts: string[], frequency: { [key: string]: number }): number => {
    const totalPractice = concepts.reduce((sum, c) => sum + (frequency[c] || 0), 0);
    return Math.min(100, Math.round((totalPractice / concepts.length) * 20));
  };

  if (!progressData) {
    return <div className="student-progress loading">Loading progress...</div>;
  }

  return (
    <div className="student-progress">
      <h2>📊 Your Progress Dashboard</h2>
      
      <div className="progress-overview">
        <div className="stat-card">
          <span className="stat-value">{progressData.totalSessions}</span>
          <span className="stat-label">Study Sessions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{progressData.totalProblems}</span>
          <span className="stat-label">Problems Solved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{progressData.conceptsMastered.length}</span>
          <span className="stat-label">Concepts Mastered</span>
        </div>
      </div>

      <div className="mastery-section">
        <h3>🎯 Unit Progress</h3>
        <div className="mastery-units">
          {progressData.masteryByUnit.map(unit => (
            <div key={unit.unit} className="unit-progress">
              <div className="unit-header">
                <h4>{unit.unit}</h4>
                <span className="mastery-percent">{unit.mastery}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${unit.mastery}%` }}
                />
              </div>
              <div className="unit-concepts">
                {unit.concepts.map(concept => (
                  <span key={concept} className="concept-tag">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="strengths-weaknesses">
        <div className="strengths">
          <h3>💪 Your Strengths</h3>
          {progressData.conceptsMastered.length > 0 ? (
            <ul>
              {progressData.conceptsMastered.map(concept => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
          ) : (
            <p>Keep practicing to build your strengths!</p>
          )}
        </div>
        
        <div className="areas-to-practice">
          <h3>🎯 Areas to Practice</h3>
          {progressData.strugglingConcepts.length > 0 ? (
            <ul>
              {progressData.strugglingConcepts.map(concept => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
          ) : (
            <p>Great job! Keep up the good work!</p>
          )}
        </div>
      </div>

      <div className="recent-activity">
        <h3>📅 Recent Activity</h3>
        <div className="activity-list">
          {progressData.recentActivity.map((activity, i) => (
            <div key={i} className="activity-item">
              <span className="activity-date">{activity.date}</span>
              <span className="activity-problems">
                {activity.problemsSolved} {activity.problemsSolved === 1 ? 'problem' : 'problems'}
              </span>
              <div className="activity-concepts">
                {activity.conceptsPracticed.slice(0, 3).map(concept => (
                  <span key={concept} className="mini-tag">{concept}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="motivational-message">
        <p>🌟 Keep going! Every problem you solve makes you stronger in math!</p>
      </div>
    </div>
  );
};

export default StudentProgress;