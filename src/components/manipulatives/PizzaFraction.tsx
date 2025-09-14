import React, { useState } from 'react';
import './PizzaFraction.scss';

interface PizzaFractionProps {
  slices?: number;
  eaten?: number;
  onChange?: (data: { slices: number; eaten: number }) => void;
}

const PizzaFraction: React.FC<PizzaFractionProps> = ({ 
  slices = 8, 
  eaten = 0,
  onChange 
}) => {
  const [eatenSlices, setEatenSlices] = useState(eaten);
  
  const toggleSlice = (index: number) => {
    const newEaten = eatenSlices & (1 << index) ? eatenSlices & ~(1 << index) : eatenSlices | (1 << index);
    setEatenSlices(newEaten);
    
    // Count number of eaten slices
    let count = 0;
    for (let i = 0; i < slices; i++) {
      if (newEaten & (1 << i)) count++;
    }
    
    onChange?.({ slices, eaten: count });
  };
  
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  // Generate slice paths
  const slicePaths = [];
  for (let i = 0; i < slices; i++) {
    const startAngle = (i * 360 / slices - 90) * Math.PI / 180;
    const endAngle = ((i + 1) * 360 / slices - 90) * Math.PI / 180;
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    
    const pathData = `
      M ${centerX} ${centerY}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;
    
    const isEaten = eatenSlices & (1 << i);
    
    slicePaths.push(
      <path
        key={i}
        d={pathData}
        className={`pizza-slice ${isEaten ? 'eaten' : ''}`}
        onClick={() => toggleSlice(i)}
      />
    );
  }
  
  return (
    <div className="pizza-fraction">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={radius} 
          className="pizza-base"
        />
        {slicePaths}
        {/* Crust */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={radius} 
          className="pizza-crust"
          fill="none"
        />
      </svg>
      <div className="pizza-info">
        <span className="fraction">
          {slices - Array(slices).fill(0).filter((_, i) => eatenSlices & (1 << i)).length}/{slices}
        </span>
        <span className="label">left</span>
      </div>
    </div>
  );
};

export default PizzaFraction;