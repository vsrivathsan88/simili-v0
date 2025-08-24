import React from 'react';
import './LessonHomepage.scss';

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  grade: string;
  unit: string;
  image: string;
  active: boolean;
  description: string;
}

interface LessonHomepageProps {
  onLessonSelect: (lessonId: string) => void;
}

const LessonHomepage: React.FC<LessonHomepageProps> = ({ onLessonSelect }) => {
  const lessons: Lesson[] = [
    {
      id: 'intro-fractions',
      title: 'Parts & Wholes',
      subtitle: 'Share pizza like a pro! 🍕',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🍕',
      active: true,
      description: 'Pizza time! Learn by playing with yummy treats!'
    },
    {
      id: 'equivalent-fractions',
      title: 'Same Amount, Different Ways',
      subtitle: 'Cool magic tricks! ✨',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🍰',
      active: false,
      description: '1/2 = 2/4? Mind = blown! 🤯'
    },
    {
      id: 'comparing-fractions',
      title: 'Bigger or Smaller?',
      subtitle: 'Be a detective! 🕵️',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🍪',
      active: false,
      description: 'Which piece wins? You decide!'
    },
    {
      id: 'fractions-number-line',
      title: 'Finding Your Spot',
      subtitle: 'Treasure hunt time! 🗺️',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '📏',
      active: false,
      description: 'Every number has its secret hiding spot!'
    },
    {
      id: 'unit-fractions',
      title: 'Special One-Pieces',
      subtitle: 'Like LEGO blocks! 🧱',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🧱',
      active: false,
      description: 'The super important building blocks!'
    },
    {
      id: 'fraction-word-problems',
      title: 'Real-Life Stories',
      subtitle: 'Math everywhere! 🌍',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '📝',
      active: false,
      description: 'Math is hiding all around us!'
    }
  ];

  // Get current lesson (first available one) and other lessons
  const currentLesson = lessons.find(lesson => lesson.active) || lessons[0];
  const otherLessons = lessons.filter(lesson => lesson.id !== currentLesson.id);

  return (
    <div className="lesson-homepage">
      {/* Featured Lesson - 60% of viewport */}
      <div className="featured-lesson-section">
        <div className="featured-lesson-container">
          {/* Pi Introduction */}
          <div className="pi-introduction">
            <div className="pi-character">
              <div className="pi-avatar">
                <img src="/assets/pi-character.png" alt="Pi, your learning companion" className="pi-character-img" />
                <div className="pi-sparkles">✨</div>
              </div>
              <div className="pi-speech-bubble">
                <p>👋 Hi! I am Pi!</p>
              </div>
            </div>
          </div>

          {/* Current Lesson Hero */}
          <div className="current-lesson-hero">
            <div className="lesson-visual-large">
              <span className="lesson-emoji-large">{currentLesson.image}</span>
            </div>
            
            <div className="lesson-hero-content">
              <div className="lesson-meta-small">
                <span className="lesson-number-badge">🎯 1</span>
                <span className="lesson-subtitle">✨ {currentLesson.subtitle}</span>
              </div>
              
              <h1 className="lesson-hero-title">{currentLesson.title}</h1>
              <div className="confidence-boost">💪 You've got this!</div>
              
              <div className="lesson-hero-actions">
                <button 
                  className="start-lesson-btn" 
                  onClick={() => onLessonSelect(currentLesson.id)}
                >
                  <span className="btn-icon">🚀</span>
                  Let's Go!
                  <span className="btn-sparkle">✨</span>
                </button>
                <div className="lesson-duration-info">
                  <span>⏱️ ~10 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Lessons - Below the fold */}
      <div className="other-lessons-section">
        <div className="other-lessons-header">
          <h2>🌟 More Adventures!</h2>
        </div>

        <div className="other-lessons-grid">
          {otherLessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`lesson-card-small ${lesson.active ? 'available' : 'coming-soon'}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                className="lesson-button-small"
                onClick={() => lesson.active && onLessonSelect(lesson.id)}
                disabled={!lesson.active}
              >
                <div className="lesson-visual-small">
                  <span className="lesson-emoji-small">{lesson.image}</span>
                  <div className="lesson-number-small">{index + 2}</div>
                </div>
                
                <div className="lesson-content-small">
                  <h3 className="lesson-title-small">{lesson.title}</h3>
                  <p className="lesson-description-small">{lesson.subtitle}</p>
                </div>
                
                <div className="lesson-status-small">
                  {lesson.active ? (
                    <div className="available-badge">Ready</div>
                  ) : (
                    <div className="coming-soon-badge">Soon</div>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="homepage-footer">
        <p>💙 You've got this! 🌈</p>
      </footer>
    </div>
  );
};

export default LessonHomepage;