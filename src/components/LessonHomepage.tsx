import React from 'react';
import { motion } from 'framer-motion';
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
        <h1>🎓 Grade 3 Fractions</h1>
        <p>Based on Illustrative Mathematics</p>
      </header>

      <div className="lessons-grid">
        {lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              className={`lesson-card ${lesson.active ? 'active' : 'inactive'}`}
              onClick={() => lesson.active && onLessonSelect(lesson.id)}
              disabled={!lesson.active}
            >
              <div className="card-image">
                <span className="lesson-emoji">{lesson.image}</span>
                {!lesson.active && <div className="coming-soon">Coming Soon</div>}
              </div>
              
              <div className="card-content">
                <div className="card-meta">
                  <span className="unit">{lesson.unit}</span>
                  <span className="grade">{lesson.grade}</span>
                </div>
                <h3>{lesson.title}</h3>
                <p className="subtitle">{lesson.subtitle}</p>
                <p className="description">{lesson.description}</p>
              </div>

              {lesson.active && (
                <div className="start-button">
                  <span>Start Lesson</span>
                  <span className="arrow">→</span>
                </div>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      <footer className="homepage-footer">
        <p>Powered by Pi 🤖 • Your friendly math tutor</p>
      </footer>
    </div>
  );
};

export default LessonHomepage;