import React, { useState } from 'react';
import './VisualNumberLine.scss';

interface VisualNumberLineProps {
  length: number;
  markers: { position: number; label?: string; color?: string }[];
  onChange: (data: { length: number; markers: any[] }) => void;
}

const VisualNumberLine: React.FC<VisualNumberLineProps> = ({ length, markers, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  
  const handleLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.round((x / rect.width) * length * 10) / 10; // Round to nearest 0.1
    
    // Add a new marker
    const newMarker = {
      position,
      color: '#5B21B6'
    };
    
    onChange({
      length,
      markers: [...markers, newMarker]
    });
  };
  
  const handleMarkerDrag = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    
    const handleMove = (moveEvent: MouseEvent) => {
      const rect = (e.target as HTMLElement).closest('.visual-number-line')?.getBoundingClientRect();
      if (!rect) return;
      
      const x = moveEvent.clientX - rect.left;
      const newPosition = Math.max(0, Math.min(length, Math.round((x / rect.width) * length * 10) / 10));
      
      const newMarkers = [...markers];
      newMarkers[index] = { ...newMarkers[index], position: newPosition };
      onChange({ length, markers: newMarkers });
    };
    
    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };
  
  const removeMarker = (index: number) => {
    onChange({
      length,
      markers: markers.filter((_, i) => i !== index)
    });
  };
  
  const handleLengthChange = (delta: number) => {
    const newLength = Math.max(1, Math.min(20, length + delta));
    onChange({ length: newLength, markers });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.round((x / rect.width) * length * 10) / 10;
      setHoverPosition(position);
    }
  };

  return (
    <div className="visual-number-line-container">
      <div className="line-controls">
        <button onClick={() => handleLengthChange(-1)} title="Shorter">
          <span className="icon">←</span>
        </button>
        <span className="length-label">0 to {length}</span>
        <button onClick={() => handleLengthChange(1)} title="Longer">
          <span className="icon">→</span>
        </button>
      </div>
      
      <div 
        className="visual-number-line"
        onClick={handleLineClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPosition(null)}
      >
        {/* The line itself */}
        <div className="line-track">
          {/* Tick marks */}
          {Array.from({ length: length + 1 }, (_, i) => (
            <div
              key={i}
              className="tick-mark"
              style={{ left: `${(i / length) * 100}%` }}
            >
              <div className="tick" />
              <span className="tick-label">{i}</span>
            </div>
          ))}
          
          {/* Markers */}
          {markers.map((marker, index) => (
            <div
              key={index}
              className="marker"
              style={{ 
                left: `${(marker.position / length) * 100}%`,
                backgroundColor: marker.color || '#5B21B6'
              }}
              onMouseDown={(e) => handleMarkerDrag(index, e)}
              title={`Position: ${marker.position}`}
            >
              <div className="marker-dot" />
              {marker.label && <span className="marker-label">{marker.label}</span>}
              <button 
                className="remove-marker"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMarker(index);
                }}
              >
                ×
              </button>
            </div>
          ))}
          
          {/* Hover indicator */}
          {hoverPosition !== null && (
            <div 
              className="hover-indicator"
              style={{ left: `${(hoverPosition / length) * 100}%` }}
            >
              <span className="hover-value">{hoverPosition}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="line-instructions">
        Click to add a point • Drag points to move • × to remove
      </div>
    </div>
  );
};

export default VisualNumberLine;