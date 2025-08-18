import React, { useState } from 'react';
import './ArrayDots.scss';

interface ArrayDotsProps {
  rows: number;
  cols: number;
  onChange: (data: { rows: number; cols: number }) => void;
}

const ArrayDots: React.FC<ArrayDotsProps> = ({ 
  rows, 
  cols, 
  onChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDots, setSelectedDots] = useState<Set<string>>(new Set());
  
  const dotSize = 16;
  const spacing = 24;

  const adjustDimension = (dimension: 'rows' | 'cols', delta: number) => {
    const newValue = dimension === 'rows' 
      ? Math.max(1, Math.min(10, rows + delta))
      : Math.max(1, Math.min(10, cols + delta));
    
    onChange({
      rows: dimension === 'rows' ? newValue : rows,
      cols: dimension === 'cols' ? newValue : cols
    });
    setSelectedDots(new Set()); // Clear selection on resize
  };

  const toggleDot = (row: number, col: number) => {
    if (isEditing) return;
    
    const key = `${row}-${col}`;
    const newSelected = new Set(selectedDots);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedDots(newSelected);
  };

  const clearSelection = () => {
    setSelectedDots(new Set());
  };

  const selectRow = (row: number) => {
    const newSelected = new Set(selectedDots);
    for (let col = 0; col < cols; col++) {
      const key = `${row}-${col}`;
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
    }
    setSelectedDots(newSelected);
  };

  const selectCol = (col: number) => {
    const newSelected = new Set(selectedDots);
    for (let row = 0; row < rows; row++) {
      const key = `${row}-${col}`;
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
    }
    setSelectedDots(newSelected);
  };

  const total = rows * cols;
  const selected = selectedDots.size;

  return (
    <div className="array-dots">
      <div className="array-controls">
        <button 
          className="control-button"
          onClick={() => setIsEditing(!isEditing)}
          title="Edit array"
        >
          ⚙️
        </button>
        {isEditing && (
          <div className="edit-controls">
            <div className="dimension-control">
              <button onClick={() => adjustDimension('rows', -1)}>−</button>
              <span>{rows} rows</span>
              <button onClick={() => adjustDimension('rows', 1)}>+</button>
            </div>
            <div className="dimension-control">
              <button onClick={() => adjustDimension('cols', -1)}>−</button>
              <span>{cols} cols</span>
              <button onClick={() => adjustDimension('cols', 1)}>+</button>
            </div>
          </div>
        )}
        {!isEditing && selected > 0 && (
          <button className="clear-button" onClick={clearSelection}>
            Clear
          </button>
        )}
      </div>
      
      <div className="array-container">
        {/* Row labels */}
        <div className="row-labels">
          {Array.from({ length: rows }).map((_, row) => (
            <button
              key={row}
              className="label-button"
              onClick={() => selectRow(row)}
              title={`Select row ${row + 1}`}
            >
              {row + 1}
            </button>
          ))}
        </div>
        
        {/* Array grid */}
        <div className="dots-grid">
          {/* Column labels */}
          <div className="col-labels">
            {Array.from({ length: cols }).map((_, col) => (
              <button
                key={col}
                className="label-button"
                onClick={() => selectCol(col)}
                title={`Select column ${col + 1}`}
              >
                {col + 1}
              </button>
            ))}
          </div>
          
          {/* Dots */}
          <svg 
            width={cols * spacing + dotSize} 
            height={rows * spacing + dotSize}
            className="dots-svg"
          >
            {Array.from({ length: rows }).map((_, row) =>
              Array.from({ length: cols }).map((_, col) => {
                const key = `${row}-${col}`;
                const isSelected = selectedDots.has(key);
                
                return (
                  <circle
                    key={key}
                    cx={col * spacing + dotSize / 2}
                    cy={row * spacing + dotSize / 2}
                    r={dotSize / 2}
                    fill={isSelected ? '#ff6b6b' : '#4a90e2'}
                    stroke="#333"
                    strokeWidth={2}
                    onClick={() => toggleDot(row, col)}
                    className="array-dot"
                    style={{ cursor: 'pointer' }}
                  />
                );
              })
            )}
          </svg>
        </div>
      </div>
      
      <div className="array-info">
        <div>{rows} × {cols} = {total}</div>
        {selected > 0 && (
          <div className="selected-info">
            Selected: {selected} of {total}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrayDots;