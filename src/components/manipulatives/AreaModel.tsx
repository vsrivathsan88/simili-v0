import React from 'react';
import './AreaModel.scss';

interface AreaModelProps {
  rows: number;
  cols: number;
  selectedCells: boolean[][];
  onChange: (data: { rows: number; cols: number; selectedCells: boolean[][] }) => void;
}

const AreaModel: React.FC<AreaModelProps> = ({ rows, cols, selectedCells, onChange }) => {
  const handleCellClick = (row: number, col: number) => {
    const newSelectedCells = selectedCells.map((r, rIdx) =>
      r.map((c, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return !c;
        }
        return c;
      })
    );
    onChange({ rows, cols, selectedCells: newSelectedCells });
  };

  const handleRowsChange = (delta: number) => {
    const newRows = Math.max(1, Math.min(10, rows + delta));
    const newSelectedCells: boolean[][] = [];
    
    for (let r = 0; r < newRows; r++) {
      newSelectedCells[r] = [];
      for (let c = 0; c < cols; c++) {
        newSelectedCells[r][c] = selectedCells[r]?.[c] || false;
      }
    }
    
    onChange({ rows: newRows, cols, selectedCells: newSelectedCells });
  };

  const handleColsChange = (delta: number) => {
    const newCols = Math.max(1, Math.min(10, cols + delta));
    const newSelectedCells: boolean[][] = [];
    
    for (let r = 0; r < rows; r++) {
      newSelectedCells[r] = [];
      for (let c = 0; c < newCols; c++) {
        newSelectedCells[r][c] = selectedCells[r]?.[c] || false;
      }
    }
    
    onChange({ rows, cols: newCols, selectedCells: newSelectedCells });
  };

  const selectedCount = selectedCells.flat().filter(Boolean).length;
  const totalCount = rows * cols;

  return (
    <div className="area-model">
      <div className="area-controls">
        <div className="dimension-control">
          <label>Rows:</label>
          <button onClick={() => handleRowsChange(-1)}>−</button>
          <span>{rows}</span>
          <button onClick={() => handleRowsChange(1)}>+</button>
        </div>
        <div className="dimension-control">
          <label>Cols:</label>
          <button onClick={() => handleColsChange(-1)}>−</button>
          <span>{cols}</span>
          <button onClick={() => handleColsChange(1)}>+</button>
        </div>
      </div>
      
      <div className="area-grid" style={{ gridTemplateColumns: `repeat(${cols}, 30px)` }}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (
            <div
              key={`${r}-${c}`}
              className={`area-cell ${selectedCells[r]?.[c] ? 'selected' : ''}`}
              onClick={() => handleCellClick(r, c)}
            />
          ))
        )}
      </div>
      
      <div className="area-fraction">
        <span className="fraction-display">
          <span className="numerator">{selectedCount}</span>
          <span className="fraction-bar">—</span>
          <span className="denominator">{totalCount}</span>
        </span>
      </div>
    </div>
  );
};

export default AreaModel;