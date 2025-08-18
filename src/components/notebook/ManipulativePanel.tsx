import React from 'react';
import './ManipulativePanel.scss';

interface ManipulativePanelProps {
  onAddManipulative: (type: 'fraction-bar' | 'number-line' | 'base-blocks' | 'array-dots') => void;
}

const ManipulativePanel: React.FC<ManipulativePanelProps> = ({ onAddManipulative }) => {
  const manipulatives = [
    {
      type: 'fraction-bar' as const,
      name: 'Fraction Bar',
      icon: '⬜',
      description: 'Split into equal parts'
    },
    {
      type: 'number-line' as const,
      name: 'Number Line',
      icon: '↔️',
      description: 'Show positions of numbers'
    },
    {
      type: 'base-blocks' as const,
      name: 'Base 10 Blocks',
      icon: '🟦',
      description: 'Hundreds, tens, ones'
    },
    {
      type: 'array-dots' as const,
      name: 'Array/Dots',
      icon: '⚫',
      description: 'Arrays for multiplication'
    }
  ];

  return (
    <div className="manipulative-panel">
      <h3>Math Tools</h3>
      <div className="manipulative-grid">
        {manipulatives.map(m => (
          <button
            key={m.type}
            className="manipulative-button"
            onClick={() => onAddManipulative(m.type)}
            title={m.description}
          >
            <span className="manipulative-icon">{m.icon}</span>
            <span className="manipulative-name">{m.name}</span>
          </button>
        ))}
      </div>
      <div className="tips">
        <p>💡 Drag tools onto your paper!</p>
        <p>✏️ Click on tools to adjust them</p>
      </div>
    </div>
  );
};

export default ManipulativePanel;