import React from 'react';
import './FractionCircles.scss';

interface FractionCirclesProps {
  parts: number;
  shaded: number;
  onChange: (data: { parts: number; shaded: number }) => void;
}

const FractionCircles: React.FC<FractionCirclesProps> = ({ parts, shaded, onChange }) => {
  const radius = 60;
  const centerX = 70;
  const centerY = 70;
  
  const handlePartClick = (index: number) => {
    // Toggle selection up to clicked part
    if (index + 1 === shaded) {
      onChange({ parts, shaded: 0 });
    } else {
      onChange({ parts, shaded: index + 1 });
    }
  };
  
  const handlePartsChange = (delta: number) => {
    const newParts = Math.max(1, Math.min(12, parts + delta));
    const newShaded = Math.min(shaded, newParts);
    onChange({ parts: newParts, shaded: newShaded });
  };
  
  // Generate pie slices
  const slices = Array.from({ length: parts }, (_, i) => {
    const startAngle = (i * 360) / parts - 90; // Start from top
    const endAngle = ((i + 1) * 360) / parts - 90;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = 360 / parts > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return {
      path: pathData,
      isShaded: i < shaded
    };
  });

  return (
    <div className="fraction-circles">
      <div className="circle-controls">
        <button onClick={() => handlePartsChange(-1)}>−</button>
        <span>{parts} parts</span>
        <button onClick={() => handlePartsChange(1)}>+</button>
      </div>
      
      <svg width="140" height="140" className="circle-svg">
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="white"
          stroke="#e0e0e0"
          strokeWidth="2"
        />
        
        {/* Pie slices */}
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.isShaded ? '#5B21B6' : 'transparent'}
            stroke="#333"
            strokeWidth="2"
            className="slice"
            onClick={() => handlePartClick(i)}
          />
        ))}
        
        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill="#333"
        />
      </svg>
      
      <div className="fraction-display">
        <span className="numerator">{shaded}</span>
        <span className="fraction-bar">—</span>
        <span className="denominator">{parts}</span>
      </div>
    </div>
  );
};

export default FractionCircles;