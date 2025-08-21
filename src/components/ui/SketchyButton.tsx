import React, { useRef, useEffect, useState } from 'react';
import rough from 'roughjs';
import { designSystem } from '../../config/designSystem';
import './SketchyButton.scss';

interface SketchyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const SketchyButton: React.FC<SketchyButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const sizeMap = {
    small: { padding: 12, fontSize: 14 },
    medium: { padding: 16, fontSize: 16 },
    large: { padding: 20, fontSize: 18 }
  };

  // Measure button dimensions after mount
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, [size]); // Re-measure if size changes

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = svgRef.current;
    const rc = rough.svg(svg);
    svg.innerHTML = '';

    const { width, height } = dimensions;
    const fillColor = variant === 'primary' 
      ? (isHovered ? designSystem.colors.primary : 'transparent')
      : designSystem.colors.paper;

    const rect = rc.rectangle(5, 5, width - 10, height - 10, {
      fill: fillColor,
      fillStyle: isHovered ? 'solid' : 'hachure',
      fillWeight: 0.5,
      stroke: designSystem.colors.primary,
      strokeWidth: 2,
      roughness: isHovered ? designSystem.roughness.playful : designSystem.roughness.normal,
      bowing: isHovered ? 2 : 1
    });

    svg.appendChild(rect);
  }, [dimensions, isHovered, variant]);

  return (
    <button
      ref={buttonRef}
      className={`sketchy-button sketchy-button--${variant} sketchy-button--${size}`}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <svg
        ref={svgRef}
        className="sketchy-button__svg"
        style={{ width: '100%', height: '100%' }}
      />
      <span className="sketchy-button__content" style={{ fontSize: sizeMap[size].fontSize }}>
        {children}
      </span>
    </button>
  );
};