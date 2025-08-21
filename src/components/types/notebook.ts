export type DrawingTool = 'pencil' | 'pen' | 'eraser' | 'highlighter' | 'text' | 'shapes';
export type DrawingMode = 'draw' | 'manipulate' | 'text';
export type NotebookBackground = 'blank' | 'ruled' | 'graph' | 'dots';

export interface DrawingSettings {
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface Shape {
  type: 'circle' | 'square' | 'triangle' | 'line' | 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  filled?: boolean;
}