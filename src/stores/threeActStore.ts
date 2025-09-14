import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type Act = 'act1' | 'act2' | 'act3';

export interface ToolConfig {
  pencil: boolean;
  eraser: boolean;
  fractionBar: boolean;
  pizza: boolean;
  numberLine: boolean;
  array: boolean;
}

interface ThreeActState {
  // Current act
  currentAct: Act;
  
  // Tools unlocked per act
  unlockedTools: ToolConfig;
  
  // Transition state
  isTransitioning: boolean;
  
  // Actions
  setAct: (act: Act, toolsToUnlock?: string[]) => void;
  resetToAct1: () => void;
  getCanvasMode: () => 'spotlight' | 'workbench' | 'showcase';
}

const defaultTools: ToolConfig = {
  pencil: false,
  eraser: false,
  fractionBar: false,
  pizza: false,
  numberLine: false,
  array: false,
};

const act1Tools: ToolConfig = {
  ...defaultTools,
  // No tools in Act 1 - just voice
};

const act2DefaultTools: ToolConfig = {
  ...defaultTools,
  pencil: true,
  eraser: true,
  // Manipulatives are unlocked dynamically
};

const act3Tools: ToolConfig = {
  ...defaultTools,
  // No tools in Act 3 - showcase mode
};

export const useThreeActStore = create<ThreeActState>()(
  devtools(
    (set, get) => ({
      currentAct: 'act1',
      unlockedTools: act1Tools,
      isTransitioning: false,

      setAct: (act: Act, toolsToUnlock?: string[]) => {
        set({ isTransitioning: true });
        
        // Determine base tools for the act
        let baseTools = act1Tools;
        if (act === 'act2') baseTools = act2DefaultTools;
        if (act === 'act3') baseTools = act3Tools;
        
        // Unlock additional tools if specified (for Act 2)
        const unlockedTools = { ...baseTools };
        if (act === 'act2' && toolsToUnlock) {
          toolsToUnlock.forEach(tool => {
            if (tool in unlockedTools) {
              (unlockedTools as any)[tool] = true;
            }
          });
        }
        
        // Update state with delay for transition
        setTimeout(() => {
          set({
            currentAct: act,
            unlockedTools,
            isTransitioning: false,
          });
        }, 500); // Half second transition
      },

      resetToAct1: () => {
        set({
          currentAct: 'act1',
          unlockedTools: act1Tools,
          isTransitioning: false,
        });
      },

      getCanvasMode: () => {
        const { currentAct } = get();
        switch (currentAct) {
          case 'act1':
            return 'spotlight';
          case 'act2':
            return 'workbench';
          case 'act3':
            return 'showcase';
        }
      },
    }),
    {
      name: 'three-act-store',
    }
  )
);