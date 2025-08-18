export interface Manipulative {
  id: string;
  type: 'fraction-bar' | 'number-line' | 'base-10' | 'array-dots' | 'area-model';
  x: number;
  y: number;
  width: number;
  height: number;
  data: any; // Type-specific data
  selected?: boolean;
}

export interface FractionBarData {
  parts: number;      // Total number of parts
  filled: number;     // Number of filled parts
  color: string;      // Fill color
}

export interface NumberLineData {
  min: number;
  max: number;
  step: number;
  marks: number[];    // Points marked on the line
}

export interface Base10Data {
  hundreds: number;
  tens: number;
  ones: number;
}

export interface ArrayDotsData {
  rows: number;
  cols: number;
  filled: boolean[][]; // Which dots are filled
}

export interface AreaModelData {
  rows: number;
  cols: number;
  sections: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    label?: string;
    color?: string;
  }[];
}