import React, { useRef, useEffect } from 'react';
import rough from 'roughjs';
import { NumberLineData } from './types';
import { designSystem } from '../../config/designSystem';

interface NumberLineProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: NumberLineData;
  selected?: boolean;
  onUpdate?: (data: NumberLineData) => void;
}

export const NumberLine: React.FC<NumberLineProps> = ({
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
    
    const lineY = height / 2;
    const padding = 20;
    
    // Draw main line
    const line = rc.line(
      padding, 
      lineY, 
      width - padding, 
      lineY,
      {
        stroke: selected ? designSystem.colors.primary : designSystem.colors.ink,
        strokeWidth: selected ? 3 : 2,
        roughness: designSystem.roughness.normal
      }
    );
    svg.appendChild(line);
    
    // Draw tick marks and labels
    const range = data.max - data.min;
    const steps = Math.floor(range / data.step) + 1;
    const stepWidth = (width - 2 * padding) / (steps - 1);
    
    for (let i = 0; i < steps; i++) {
      const tickX = padding + i * stepWidth;
      const value = data.min + i * data.step;
      
      // Tick mark
      const tick = rc.line(
        tickX,
        lineY - 10,
        tickX,
        lineY + 10,
        {
          stroke: designSystem.colors.ink,
          strokeWidth: 1.5,
          roughness: designSystem.roughness.subtle
        }
      );
      svg.appendChild(tick);
      
      // Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(tickX));
      label.setAttribute('y', String(lineY + 25));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-family', designSystem.fonts.body);
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', designSystem.colors.ink);
      label.textContent = String(value);
      svg.appendChild(label);
    }
    
    // Draw marked points
    data.marks.forEach(mark => {
      const markX = padding + ((mark - data.min) / range) * (width - 2 * padding);
      
      // Draw a circle at the mark
      const circle = rc.circle(markX, lineY, 12, {
        fill: designSystem.colors.primary,
        fillStyle: 'solid',
        stroke: designSystem.colors.primary,
        strokeWidth: 2,
        roughness: designSystem.roughness.normal
      });
      svg.appendChild(circle);
      
      // Add value label above
      const markLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      markLabel.setAttribute('x', String(markX));
      markLabel.setAttribute('y', String(lineY - 15));
      markLabel.setAttribute('text-anchor', 'middle');
      markLabel.setAttribute('font-family', designSystem.fonts.body);
      markLabel.setAttribute('font-size', '14');
      markLabel.setAttribute('font-weight', 'bold');
      markLabel.setAttribute('fill', designSystem.colors.primary);
      markLabel.textContent = String(mark);
      svg.appendChild(markLabel);
    });
  }, [x, y, width, height, data, selected]);

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onUpdate || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const padding = 20;
    
    // Calculate value from click position
    const relativeX = (clickX - padding) / (width - 2 * padding);
    const value = data.min + relativeX * (data.max - data.min);
    
    // Round to nearest step
    const roundedValue = Math.round(value / data.step) * data.step;
    
    // Toggle mark
    const newMarks = data.marks.includes(roundedValue)
      ? data.marks.filter(m => m !== roundedValue)
      : [...data.marks, roundedValue];
    
    onUpdate({ ...data, marks: newMarks });
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
};