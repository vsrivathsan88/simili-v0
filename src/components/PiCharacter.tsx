import React, { useState } from 'react';
import './PiCharacter.scss';

export type PiState = 'normal' | 'suggestion' | 'tools';

export interface Tool {
  id: string;
  name: string;
  emoji: string;
  category: 'fractions' | 'numbers' | 'shapes' | 'measurement';
}

interface PiCharacterProps {
  state: PiState;
  onToolRequest: () => void;
  onToolSelect: (tool: Tool) => void;
  onDismissSuggestion: () => void;
  availableTools?: Tool[];
  suggestion?: string;
  className?: string;
}

// Default tool sets for different lesson types
export const FRACTION_TOOLS: Tool[] = [
  { id: 'pizza', name: 'Pizza Slices', emoji: '🍕', category: 'fractions' },
  { id: 'pie', name: 'Pie Chart', emoji: '📊', category: 'fractions' },
  { id: 'fraction-bar', name: 'Fraction Bars', emoji: '▬', category: 'fractions' },
  { id: 'fraction-circles', name: 'Fraction Circles', emoji: '🔴', category: 'fractions' }
];

export const NUMBER_TOOLS: Tool[] = [
  { id: 'number-line', name: 'Number Line', emoji: '📏', category: 'numbers' },
  { id: 'counting-blocks', name: 'Counting Blocks', emoji: '🟦', category: 'numbers' },
  { id: 'ten-frame', name: 'Ten Frame', emoji: '⬜', category: 'numbers' }
];

export function PiCharacter({ 
  state, 
  onToolRequest, 
  onToolSelect, 
  onDismissSuggestion,
  availableTools = [],
  suggestion = "I have something that might help!",
  className = ""
}: PiCharacterProps) {
  const [showTools, setShowTools] = useState(false);

  const handlePiClick = () => {
    if (state === 'suggestion') {
      // Show the suggestion and tools
      setShowTools(true);
    } else if (state === 'normal') {
      // Request tools from satchel
      onToolRequest();
      setShowTools(true);
    }
  };

  const handleToolSelect = (tool: Tool) => {
    onToolSelect(tool);
    setShowTools(false);
  };

  const handleDismiss = () => {
    onDismissSuggestion();
    setShowTools(false);
  };

  const getPiImageSrc = () => {
    switch (state) {
      case 'suggestion':
        return '/assets/pi-lightbulb.png'; // Will be created
      case 'tools':
        return '/assets/pi-open-satchel.png'; // Will be created
      default:
        return '/assets/pi-character.png'; // Current image
    }
  };

  return (
    <div className={`pi-character ${className}`}>
      {/* Pi Character */}
      <div 
        className={`pi-avatar ${state}`}
        onClick={handlePiClick}
      >
        <img 
          src={getPiImageSrc()} 
          alt="Pi the math helper" 
        />
        
        {/* Suggestion bubble */}
        {state === 'suggestion' && !showTools && (
          <div className="pi-suggestion-bubble">
            <div className="bubble-content">
              {suggestion}
            </div>
            <button 
              className="bubble-dismiss"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Floating tool selection */}
      {showTools && availableTools.length > 0 && (
        <div className="pi-tools-menu">
          <div className="tools-header">
            <span>What would help you show your thinking?</span>
            <button 
              className="tools-close"
              onClick={() => setShowTools(false)}
            >
              ×
            </button>
          </div>
          
          <div className="tools-grid">
            {availableTools.map((tool) => (
              <button
                key={tool.id}
                className="tool-option"
                onClick={() => handleToolSelect(tool)}
              >
                <span className="tool-emoji">{tool.emoji}</span>
                <span className="tool-name">{tool.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pi's encouraging message when tools are shown */}
      {showTools && (
        <div className="pi-encouragement">
          "Pick what feels right to you!"
        </div>
      )}
    </div>
  );
}