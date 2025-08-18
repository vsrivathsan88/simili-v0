import { useCallback, useRef, useState } from 'react';

export function useConnectionRetry(
  connectFn: () => Promise<void>,
  maxRetries = 3,
  retryDelay = 1000
) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const connectWithRetry = useCallback(async () => {
    try {
      await connectFn();
      // Reset retry count on successful connection
      setRetryCount(0);
    } catch (error) {
      console.error('Connection failed:', error);
      
      if (retryCount < maxRetries) {
        setIsRetrying(true);
        console.log(`Retrying connection... (${retryCount + 1}/${maxRetries})`);
        
        timeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectWithRetry();
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setIsRetrying(false);
        throw new Error(`Failed to connect after ${maxRetries} attempts`);
      }
    }
  }, [connectFn, retryCount, maxRetries, retryDelay]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    connectWithRetry,
    isRetrying,
    retryCount,
    reset
  };
}