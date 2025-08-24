import React from 'react';
import './ArrayGrid.scss';

interface ArrayGridProps {
  rows: number;
  cols: number;
  showGrouping: boolean;
  onChange: (data: { rows: number; cols: number; showGrouping: boolean }) => void;
}

const ArrayGrid: React.FC<ArrayGridProps> = ({ rows, cols, showGrouping, onChange }) => {
  const handleRowsChange = (delta: number) => {
    const newRows = Math.max(1, Math.min(10, rows + delta));
    onChange({ rows: newRows, cols, showGrouping });
  };

  const handleColsChange = (delta: number) => {
    const newCols = Math.max(1, Math.min(10, cols + delta));
    onChange({ rows, cols: newCols, showGrouping });
  };

  const toggleGrouping = () => {
    onChange({ rows, cols, showGrouping: !showGrouping });
  };

  const total = rows * cols;

  return (
    <div className="array-grid">
      <div className="array-controls">
        <div className="dimension-control">
          <button onClick={() => handleRowsChange(-1)}>−</button>
          <span>{rows} rows</span>
          <button onClick={() => handleRowsChange(1)}>+</button>
        </div>
        <div className="dimension-control">
          <button onClick={() => handleColsChange(-1)}>−</button>
          <span>{cols} cols</span>
          <button onClick={() => handleColsChange(1)}>+</button>
        </div>
      </div>

      <div 
        className={`array-display ${showGrouping ? 'show-grouping' : ''}`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (
            <div
              key={`${r}-${c}`}
              className={`array-dot ${
                showGrouping && r % 2 === 0 ? 'grouped-row' : ''
              } ${
                showGrouping && c % 2 === 0 ? 'grouped-col' : ''
              }`}
            >
              <div className="dot" />
            </div>
          ))
        )}
      </div>

      <div className="array-equation">
        <span className="equation">
          {rows} × {cols} = <strong>{total}</strong>
        </span>
      </div>

      <button className="grouping-toggle" onClick={toggleGrouping}>
        {showGrouping ? '🔲 Hide groups' : '🔳 Show groups'}
      </button>
    </div>
  );
};

export default ArrayGrid;