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
      title: 'Introduction to Fractions',
      subtitle: 'Understanding parts of a whole',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🍕',
      active: true,
      description: 'Learn what fractions are using pizza, pies, and other fun examples!'
    },
    {
      id: 'equivalent-fractions',
      title: 'Equivalent Fractions',
      subtitle: 'Different names, same amount',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🍰',
      active: false,
      description: 'Discover how 1/2 equals 2/4 and more!'
    },
    {
      id: 'comparing-fractions',
      title: 'Comparing Fractions',
      subtitle: 'Which is bigger?',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🍪',
      active: false,
      description: 'Learn to compare fractions using visual models'
    },
    {
      id: 'fractions-number-line',
      title: 'Fractions on a Number Line',
      subtitle: 'Finding fraction positions',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '📏',
      active: false,
      description: 'Place fractions on number lines accurately'
    },
    {
      id: 'unit-fractions',
      title: 'Unit Fractions',
      subtitle: 'Building blocks of fractions',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '🧱',
      active: false,
      description: 'Understand fractions with numerator 1'
    },
    {
      id: 'fraction-word-problems',
      title: 'Fraction Word Problems',
      subtitle: 'Real-world applications',
      grade: 'Grade 3',
      unit: 'Unit 5',
      image: '📝',
      active: false,
      description: 'Solve story problems with fractions'
    }
  ];

  return (
    <div className="lesson-homepage">
      <header className="homepage-header">
        <h1>🎵 Math Playlist</h1>
        <p>With your tutor Pi</p>
      </header>

      <div className="playlist-container">
        <div className="playlist-header">
          <div className="playlist-info">
            <h2>Grade 3 Fractions</h2>
            <p>6 lessons • Based on Illustrative Math</p>
          </div>
          <div className="playlist-controls">
            <button className="shuffle-btn">🔀</button>
            <button className="play-all-btn" onClick={() => onLessonSelect('intro-fractions')}>
              ▶️ Start Learning
            </button>
          </div>
        </div>

        <div className="lessons-playlist">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`playlist-track ${lesson.active ? 'active' : 'inactive'} spring-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                className="track-button"
                onClick={() => lesson.active && onLessonSelect(lesson.id)}
                disabled={!lesson.active}
              >
                <div className="track-number">
                  {lesson.active ? (
                    <span className="play-icon">▶️</span>
                  ) : (
                    <span className="track-index">{index + 1}</span>
                  )}
                </div>
                
                <div className="track-visual">
                  <span className="track-emoji">{lesson.image}</span>
                </div>
                
                <div className="track-info">
                  <h3 className="track-title">{lesson.title}</h3>
                  <p className="track-subtitle">{lesson.subtitle}</p>
                  <div className="track-meta">
                    <span className="unit-badge">{lesson.unit}</span>
                    <span className="difficulty">Easy</span>
                  </div>
                </div>
                
                <div className="track-status">
                  {lesson.active ? (
                    <span className="duration">~10 min</span>
                  ) : (
                    <span className="coming-soon-badge">Soon</span>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="homepage-footer">
        <p>🤖 Your AI math tutor is ready to help!</p>
      </footer>
    </div>
  );
};

export default LessonHomepage;