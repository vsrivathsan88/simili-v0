import React from 'react';
import { useConnectionStore } from '../stores/connectionStore';

export default function ConnectionBanner() {
  const { state, lastError } = useConnectionStore();

  if (state === 'idle' || state === 'connected') return null;

  const getMessage = () => {
    switch (state) {
      case 'connecting':
        return 'Connecting to Pi…';
      case 'reconnecting':
        return 'Reconnecting… your work is safe.';
      case 'error':
        return lastError ? `Connection issue: ${lastError}` : 'Connection issue. Retrying…';
      default:
        return '';
    }
  };

  return (
    <div className={`connection-banner ${state}`} role="status" aria-live="polite">
      {getMessage()}
    </div>
  );
}
