import { create } from 'zustand';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface ConnectionStore {
  state: ConnectionState;
  lastError?: string;
  setIdle: () => void;
  setConnecting: () => void;
  setConnected: () => void;
  setReconnecting: () => void;
  setError: (message?: string) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  state: 'idle',
  lastError: undefined,
  setIdle: () => set({ state: 'idle', lastError: undefined }),
  setConnecting: () => set({ state: 'connecting', lastError: undefined }),
  setConnected: () => set({ state: 'connected', lastError: undefined }),
  setReconnecting: () => set({ state: 'reconnecting' }),
  setError: (message) => set({ state: 'error', lastError: message }),
}));
