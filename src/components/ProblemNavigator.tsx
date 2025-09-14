import React from 'react';
import { lessons, getNextProblem, isLastProblem } from '../config/lessonStructure';
import './ProblemNavigator.scss';

interface ProblemNavigatorProps {
  lessonId: string;
  currentProblemIndex: number;
  onNextProblem: () => void;
  onPreviousProblem: () => void;
  onFinishLesson: () => void;
}

const ProblemNavigator: React.FC<ProblemNavigatorProps> = ({
  lessonId,
  currentProblemIndex,
  onNextProblem,
  onPreviousProblem,
  onFinishLesson
}) => {
  const lesson = lessons[lessonId];
  if (!lesson) return null;
  
  const currentProblem = lesson.problems[currentProblemIndex];
  const totalProblems = lesson.problems.length;
  const isFirst = currentProblemIndex === 0;
  const isLast = currentProblemIndex === totalProblems - 1;
  
  return (
    <div className="problem-navigator">
      <div className="problem-info">
        <span className="problem-counter">
          Problem {currentProblemIndex + 1} of {totalProblems}
        </span>
        <h3 className="problem-title">{currentProblem?.title}</h3>
      </div>
      
      <div className="problem-progress">
        {lesson.problems.map((_, index) => (
          <div
            key={index}
            className={`progress-dot ${
              index === currentProblemIndex ? 'active' : ''
            } ${index < currentProblemIndex ? 'completed' : ''}`}
          />
        ))}
      </div>
      
      <div className="navigation-buttons">
        <button
          className="nav-button previous"
          onClick={onPreviousProblem}
          disabled={isFirst}
        >
          ← Previous
        </button>
        
        {isLast ? (
          <button
            className="nav-button finish"
            onClick={onFinishLesson}
          >
            Finish Lesson 🎉
          </button>
        ) : (
          <button
            className="nav-button next"
            onClick={onNextProblem}
          >
            Next Problem →
          </button>
        )}
      </div>
    </div>
  );
};

export default ProblemNavigator;