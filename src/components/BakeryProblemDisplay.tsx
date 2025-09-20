import React from 'react';
import './BakeryProblemDisplay.scss';

interface BakeryProblemDisplayProps {
  isMinimized: boolean;
  onToggle: () => void;
  currentAct: 'discovery' | 'challenge' | 'resolution';
}

const BakeryProblemDisplay: React.FC<BakeryProblemDisplayProps> = ({
  isMinimized,
  onToggle,
  currentAct
}) => {
  const getSceneContent = () => {
    switch (currentAct) {
      case 'discovery':
        return {
          title: "Pi's Magic Bakery",
          description: "4 star-cookies, 3 cloud friends",
          image: "/assets/cloud-bakery-intro.png",
          fallbackEmoji: "🍪"
        };
      case 'challenge':
        return {
          title: "More Friends Arrive!",
          description: "4 star-cookies, 8 cloud friends",
          image: "/assets/cloud-bakery-friends.png",
          fallbackEmoji: "🍪👥"
        };
      case 'resolution':
        return {
          title: "Cookie Celebration!",
          description: "Everyone gets equal pieces!",
          image: "/assets/cloud-bakery-celebration.png",
          fallbackEmoji: "🎉🍪"
        };
      default:
        return {
          title: "Pi's Magic Bakery",
          description: "Help Pi share cookies fairly!",
          image: "/assets/cloud-bakery-intro.png",
          fallbackEmoji: "🍪"
        };
    }
  };

  const sceneContent = getSceneContent();

  if (isMinimized) {
    return (
      <div className="bakery-problem-minimized" onClick={onToggle}>
        <div className="minimized-content">
          <span className="minimized-emoji">{sceneContent.fallbackEmoji}</span>
          <span className="minimized-text">{sceneContent.title}</span>
        </div>
        <button className="expand-btn">↗️</button>
      </div>
    );
  }

  return (
    <div className="bakery-problem-display">
      <div className="problem-header">
        <h3 className="problem-title">{sceneContent.title}</h3>
        <button className="minimize-btn" onClick={onToggle}>
          ↙️
        </button>
      </div>

      <div className="problem-content">
        <div className="scene-image">
          <img
            src={sceneContent.image}
            alt={sceneContent.title}
            onError={(e) => {
              // Fallback to emoji if image doesn't exist
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `<div class="fallback-emoji">${sceneContent.fallbackEmoji}</div>`;
            }}
          />
        </div>

        <div className="problem-description">
          <p>{sceneContent.description}</p>
        </div>
      </div>
    </div>
  );
};

export default BakeryProblemDisplay;