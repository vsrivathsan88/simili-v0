import { useCallback, useState } from 'react';
import { Tool } from '../components/PiCharacter';

export interface PlacedManipulative {
  id: string;
  tool: Tool;
  x: number;
  y: number;
  selected: boolean;
}

export interface UseCanvasManagerArgs {
  onRealtimeEvent?: (event: any, imageData?: string) => void;
}

export function useCanvasManager({ onRealtimeEvent }: UseCanvasManagerArgs) {
  const [canvasImageData, setCanvasImageData] = useState<string>('');
  const [placedManipulatives, setPlacedManipulatives] = useState<PlacedManipulative[]>([]);
  const [selectedManipulative, setSelectedManipulative] = useState<string | null>(null);

  const clearCanvas = useCallback(() => {
    setCanvasImageData('');
    setPlacedManipulatives([]);
    onRealtimeEvent?.({ type: 'clear', timestamp: Date.now() }, '');
  }, [onRealtimeEvent]);

  const addManipulative = useCallback((tool: Tool, x: number, y: number) => {
    const newManipulative: PlacedManipulative = {
      id: `${tool.id}-${Date.now()}`,
      tool,
      x,
      y,
      selected: false,
    };
    setPlacedManipulatives(prev => [...prev, newManipulative]);
    return newManipulative.id;
  }, []);

  const moveManipulative = useCallback((id: string, x: number, y: number) => {
    setPlacedManipulatives(prev => prev.map(m => (m.id === id ? { ...m, x, y } : m)));
    onRealtimeEvent?.({ type: 'manipulative_move', timestamp: Date.now(), data: { id, x, y } }, canvasImageData);
  }, [onRealtimeEvent, canvasImageData]);

  const selectManipulative = useCallback((id: string) => {
    setSelectedManipulative(id);
    setPlacedManipulatives(prev => prev.map(m => ({ ...m, selected: m.id === id })));
  }, []);

  const removeManipulative = useCallback((id: string) => {
    setPlacedManipulatives(prev => prev.filter(m => m.id !== id));
    setSelectedManipulative(prev => (prev === id ? null : prev));
  }, []);

  return {
    // state
    canvasImageData,
    setCanvasImageData,
    placedManipulatives,
    selectedManipulative,
    // actions
    clearCanvas,
    addManipulative,
    moveManipulative,
    selectManipulative,
    removeManipulative,
  };
}
