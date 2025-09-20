import React, { useState, useEffect } from 'react';
import './AdventureHub.scss';

interface Adventure {
  id: string;
  title: string;
  world: string;
  emoji: string;
  description: string;
  gradeRange: string;
  estimatedTime: string;
  problemsTotal: number;
  problemsCompleted: number;
  isUnlocked: boolean;
  thumbnailImage: string;
  comingSoon?: boolean;
}

interface UserProgress {
  hasCompletedOnboarding: boolean;
  childName: string;
  adventures: {
    [adventureId: string]: {
      isUnlocked: boolean;
      problemsCompleted: number;
      totalProblems: number;
    };
  };
}

interface AdventureHubProps {
  onAdventureSelect: (adventureId: string) => void;
  userProgress: UserProgress;
  onProgressUpdate: (adventureId: string, progress: { problemsCompleted: number }) => void;
}

const AdventureHub: React.FC<AdventureHubProps> = ({ onAdventureSelect, userProgress, onProgressUpdate }) => {
  const [piMessage, setPiMessage] = useState(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  // Static adventure data
  const staticAdventures = [
    {
      id: 'cookie-factory',
      title: 'Cookie Factory Adventure',
      world: 'The Sweet Factory',
      emoji: '🏭',
      description: 'Help Pi run his magical cookie factory and learn about fractions by sharing treats!',
      gradeRange: 'Grades 3-4',
      estimatedTime: '15 min',
      thumbnailImage: '/assets/adventures/cookie-factory-thumb.png'
    },
    {
      id: 'space-station',
      title: 'Space Station Mission',
      world: 'Cosmic Laboratory',
      emoji: '🚀',
      description: 'Join Pi on his space station to solve multiplication and division puzzles among the stars!',
      gradeRange: 'Grades 2-3',
      estimatedTime: '12 min',
      thumbnailImage: '/assets/adventures/space-station-thumb.png'
    },
    {
      id: 'underwater-city',
      title: 'Underwater City',
      world: 'Aquatic Kingdom',
      emoji: '🌊',
      description: 'Dive deep with Pi to explore an underwater city and master addition and subtraction!',
      gradeRange: 'Grades 1-2',
      estimatedTime: '10 min',
      thumbnailImage: '/assets/adventures/underwater-city-thumb.png'
    },
    {
      id: 'enchanted-forest',
      title: 'Enchanted Forest',
      world: 'Magical Woodland',
      emoji: '🌳',
      description: 'Venture into Pi\'s enchanted forest to discover the secrets of decimals and percentages!',
      gradeRange: 'Grades 4-5',
      estimatedTime: '18 min',
      thumbnailImage: '/assets/adventures/enchanted-forest-thumb.png'
    }
  ];

  // Calculate unlock status based on progress
  const calculateUnlockStatus = (adventureId: string, index: number): boolean => {
    if (index === 0) return true; // First adventure is always unlocked

    // Check if previous adventure is completed
    const previousAdventure = staticAdventures[index - 1];
    const previousProgress = userProgress.adventures[previousAdventure.id];

    if (previousProgress) {
      return previousProgress.problemsCompleted >= previousProgress.totalProblems;
    }

    return false;
  };

  // Merge static data with dynamic progress
  const adventures: Adventure[] = staticAdventures.map((adventure, index) => {
    const progress = userProgress.adventures[adventure.id];
    const isUnlocked = calculateUnlockStatus(adventure.id, index);
    const isComingSoon = index > 0; // Only first adventure is ready

    return {
      ...adventure,
      problemsTotal: progress?.totalProblems || 7,
      problemsCompleted: progress?.problemsCompleted || 0,
      isUnlocked,
      comingSoon: isComingSoon
    };
  });

  // Detect newly unlocked adventures
  useEffect(() => {
    const currentlyUnlocked = adventures
      .filter(adventure => adventure.isUnlocked && !adventure.comingSoon)
      .map(adventure => adventure.id);

    const previouslyUnlocked = JSON.parse(localStorage.getItem('previously-unlocked') || '["cookie-factory"]');
    const newUnlocks = currentlyUnlocked.filter(id => !previouslyUnlocked.includes(id));

    if (newUnlocks.length > 0) {
      setNewlyUnlocked(newUnlocks);
      localStorage.setItem('previously-unlocked', JSON.stringify(currentlyUnlocked));

      // Clear the newly unlocked state after animation
      setTimeout(() => {
        setNewlyUnlocked([]);
      }, 3000);
    }
  }, [adventures]);

  const childName = userProgress.childName;
  const piMessages = [
    `Welcome to my adventure world${childName ? `, ${childName}` : ''}! 🌟`,
    "I've prepared amazing places for us to explore together!",
    "Each adventure is packed with fun math puzzles and surprises!"
  ];

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setPiMessage(prev => {
        if (prev < piMessages.length - 1) {
          return prev + 1;
        } else {
          setShowContinuePrompt(true);
          clearInterval(messageTimer);
          return prev;
        }
      });
    }, 3000);

    return () => clearInterval(messageTimer);
  }, [piMessages.length]);

  const getProgressPercentage = (adventure: Adventure) => {
    return (adventure.problemsCompleted / adventure.problemsTotal) * 100;
  };

  const handleAdventureClick = (adventure: Adventure) => {
    if (adventure.isUnlocked && !adventure.comingSoon) {
      onAdventureSelect(adventure.id);
    }
  };

  return (
    <div className="adventure-hub">
      <div className="hub-container">

        {/* Header with Pi */}
        <header className="hub-header">
          <div className="pi-host">
            <img
              src="/assets/pi-character.png"
              alt="Pi, your adventure guide"
              className="pi-avatar talking"
            />
            <div className="pi-speech">
              <div className="speech-bubble">
                <p className="pi-message">{piMessages[piMessage]}</p>
              </div>
            </div>
          </div>

          <div className="hub-title-section">
            <h1 className="hub-title">Pi's Adventure Universe</h1>
            <p className="hub-subtitle">Choose your next mathematical adventure!</p>
          </div>
        </header>

        {/* Featured Adventure */}
        <section className="featured-adventure">
          <div className="featured-card" onClick={() => handleAdventureClick(adventures[0])}>
            <div className="featured-thumbnail">
              <div className="fallback-thumb">
                <span className="adventure-emoji">{adventures[0].emoji}</span>
              </div>
              <div className="play-overlay">
                <div className="play-button">
                  <span>▶️</span>
                </div>
              </div>
            </div>

            <div className="featured-content">
              <div className="adventure-badge">✨ Start Here!</div>
              <h2 className="featured-title">{adventures[0].title}</h2>
              <p className="featured-description">{adventures[0].description}</p>

              <div className="featured-meta">
                <span className="grade-range">{adventures[0].gradeRange}</span>
                <span className="estimated-time">🕐 {adventures[0].estimatedTime}</span>
              </div>

              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage(adventures[0])}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {adventures[0].problemsCompleted}/{adventures[0].problemsTotal} problems completed
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Other Adventures Grid */}
        <section className="other-adventures">
          <h3 className="section-title">More Adventures Await!</h3>
          <div className="adventures-grid">
            {adventures.slice(1).map((adventure, index) => {
              const isNewlyUnlocked = newlyUnlocked.includes(adventure.id);
              const isCompleted = adventure.problemsCompleted >= adventure.problemsTotal;

              return (
                <div
                  key={adventure.id}
                  className={`adventure-card ${!adventure.isUnlocked ? 'locked' : ''} ${adventure.comingSoon ? 'coming-soon' : ''} ${isNewlyUnlocked ? 'newly-unlocked' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleAdventureClick(adventure)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                <div className="card-thumbnail">
                  <div className="fallback-thumb">
                    <span className="adventure-emoji">{adventure.emoji}</span>
                  </div>
                  {adventure.comingSoon && (
                    <div className="coming-soon-overlay">
                      <span>Coming Soon!</span>
                    </div>
                  )}
                  {!adventure.isUnlocked && !adventure.comingSoon && (
                    <div className="locked-overlay">
                      <span>🔒</span>
                    </div>
                  )}
                  {isNewlyUnlocked && (
                    <div className="unlock-celebration">
                      <span>🎉 UNLOCKED! 🎉</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="completed-badge">
                      <span>✅ Complete!</span>
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <h4 className="card-title">{adventure.title}</h4>
                  <p className="card-world">{adventure.world}</p>
                  <div className="card-meta">
                    <span className="card-grade">{adventure.gradeRange}</span>
                    <span className="card-time">🕐 {adventure.estimatedTime}</span>
                  </div>

                  {adventure.isUnlocked && !adventure.comingSoon && (
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${getProgressPercentage(adventure)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {adventure.problemsCompleted}/{adventure.problemsTotal} completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* Continue Prompt */}
        {showContinuePrompt && (
          <div className="continue-prompt">
            <button
              className="start-adventure-btn"
              onClick={() => handleAdventureClick(adventures[0])}
            >
              <span className="btn-text">Start Cookie Factory Adventure</span>
              <span className="btn-icon">🍪</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdventureHub;