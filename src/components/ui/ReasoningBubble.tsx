import React, { useRef, useEffect } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';
import { designSystem } from '../../config/designSystem';
import './ReasoningBubble.scss';

interface ReasoningBubbleProps {
  step: {
    id: string;
    transcript: string;
    classification: 'correct' | 'partial' | 'incorrect' | 'exploring';
    timestamp: number;
    concepts?: string[];
  };
  position: { x: number; y: number };
  isActive?: boolean;
  onClick?: () => void;
}

export const ReasoningBubble: React.FC<ReasoningBubbleProps> = ({
  step,
  position,
  isActive = false,
  onClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rc = rough.svg(svg);
    svg.innerHTML = '';

    const width = 240;
    const height = 120;
    const fillColor = designSystem.colors.fills[step.classification];

    // Draw thought bubble shape
    const bubble = rc.ellipse(width / 2, height / 2, width - 20, height - 20, {
      fill: fillColor,
      fillStyle: 'solid',
      fillWeight: 0.5,
      stroke: designSystem.colors.ink,
      strokeWidth: 2,
      roughness: designSystem.roughness.normal,
      bowing: 2
    });

    // Draw tail for speech bubble effect
    const tailPoints = [
      [width * 0.3, height - 10],
      [width * 0.2, height + 20],
      [width * 0.4, height - 5]
    ];
    
    const tail = rc.polygon(tailPoints as [number, number][], {
      fill: fillColor,
      fillStyle: 'solid',
      stroke: designSystem.colors.ink,
      strokeWidth: 2,
      roughness: designSystem.roughness.normal
    });

    svg.appendChild(bubble);
    svg.appendChild(tail);
  }, [step.classification]);

  return (
    <motion.div
      className={`reasoning-bubble ${isActive ? 'reasoning-bubble--active' : ''}`}
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.5,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      onClick={onClick}
    >
      <svg
        ref={svgRef}
        className="reasoning-bubble__svg"
        width="240"
        height="140"
      />
      
      <div className="reasoning-bubble__content">
        <p className="reasoning-bubble__transcript">
          "{step.transcript}"
        </p>
        
        {step.concepts && step.concepts.length > 0 && (
          <div className="reasoning-bubble__concepts">
            {step.concepts.map((concept, i) => (
              <span key={i} className="reasoning-bubble__concept">
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className={`reasoning-bubble__icon reasoning-bubble__icon--${step.classification}`}>
        {step.classification === 'correct' && '✓'}
        {step.classification === 'partial' && '~'}
        {step.classification === 'incorrect' && '!'}
        {step.classification === 'exploring' && '?'}
      </div>
    </motion.div>
  );
};