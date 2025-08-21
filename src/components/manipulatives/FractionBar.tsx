import React, { useRef, useEffect } from 'react';
import rough from 'roughjs';
import { FractionBarData } from './types';
import { designSystem } from '../../config/designSystem';

interface FractionBarProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: FractionBarData;
  selected?: boolean;
  onUpdate?: (data: FractionBarData) => void;
}

export const FractionBar: React.FC<FractionBarProps> = ({
  id,
  x,
  y,
  width,
  height,
  data,
  selected,
  onUpdate
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const rc = rough.svg(svg);
    svg.innerHTML = '';
    
    // Draw outer rectangle
    const rect = rc.rectangle(0, 0, width, height, {
      stroke: selected ? designSystem.colors.primary : designSystem.colors.ink,
      strokeWidth: selected ? 3 : 2,
      roughness: designSystem.roughness.normal,
      fill: 'transparent'
    });
    svg.appendChild(rect);
    
    // Draw divisions
    const partWidth = width / data.parts;
    for (let i = 1; i < data.parts; i++) {
      const line = rc.line(
        partWidth * i, 
        0, 
        partWidth * i, 
        height,
        {
          stroke: designSystem.colors.ink,
          strokeWidth: 1.5,
          roughness: designSystem.roughness.normal,
          bowing: 0.5
        }
      );
      svg.appendChild(line);
    }
    
    // Fill parts
    for (let i = 0; i < data.filled; i++) {
      const fillRect = rc.rectangle(
        i * partWidth + 2,
        2,
        partWidth - 4,
        height - 4,
        {
          fill: data.color || designSystem.colors.primary,
          fillStyle: 'solid',
          fillWeight: 0.5,
          stroke: 'transparent',
          roughness: designSystem.roughness.subtle
        }
      );
      svg.appendChild(fillRect);
    }
    
    // Add fraction label
    if (data.filled > 0) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(width / 2));
      text.setAttribute('y', String(height + 20));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', designSystem.fonts.body);
      text.setAttribute('font-size', '14');
      text.setAttribute('fill', designSystem.colors.ink);
      text.textContent = `${data.filled}/${data.parts}`;
      svg.appendChild(text);
    }
  }, [x, y, width, height, data, selected]);

  const handlePartClick = (partIndex: number) => {
    if (!onUpdate) return;
    
    // Toggle fill up to clicked part
    const newFilled = partIndex >= data.filled ? partIndex + 1 : partIndex;
    onUpdate({ ...data, filled: newFilled });
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <svg
        ref={svgRef}
        width={width}
        height={height + 25}
        style={{ cursor: 'pointer' }}
      />
      {/* Invisible click areas for each part */}
      {Array.from({ length: data.parts }).map((_, i) => (
        <rect
          key={i}
          x={x + (width / data.parts) * i}
          y={y}
          width={width / data.parts}
          height={height}
          fill="transparent"
          onClick={() => handlePartClick(i)}
          style={{ cursor: 'pointer' }}
        />
      ))}
    </g>
  );
};