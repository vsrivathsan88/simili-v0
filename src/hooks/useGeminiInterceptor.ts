import { useEffect, useRef } from 'react';
import { useThreeActStore } from '../stores/threeActStore';

interface InterceptorConfig {
  onOutgoingMessage?: (message: string) => string;
  onIncomingResponse?: (response: string) => string | null;
  onToolCall?: (toolCall: any) => boolean; // return false to block
}

export function useGeminiInterceptor(client: any, config: InterceptorConfig) {
  const currentActRef = useRef<string>('act1');
  
  useEffect(() => {
    // Subscribe to act changes
    const unsubscribe = useThreeActStore.subscribe((state) => {
      currentActRef.current = state.currentAct;
    });
    
    return unsubscribe;
  }, []);
  
  // Intercept outgoing messages
  const sendMessage = (text: string) => {
    if (!client) return;
    
    // Add context based on current act
    const enhancedMessage = config.onOutgoingMessage?.(text) || text;
    client.send({ text: enhancedMessage });
  };
  
  // Monitor incoming audio/responses
  useEffect(() => {
    if (!client) return;
    
    const handleAudioData = (event: any) => {
      // This is where we'd intercept Pi's responses
      // but Gemini Live streams audio directly
      console.log('Audio data received', event);
    };
    
    // For tool calls, we can intercept
    const originalSendToolResponse = client.sendToolResponse?.bind(client);
    if (originalSendToolResponse) {
      client.sendToolResponse = (response: any) => {
        // Check if we should block this tool call
        const shouldProceed = config.onToolCall?.(response) ?? true;
        if (shouldProceed) {
          originalSendToolResponse(response);
        } else {
          console.warn('Tool call blocked by interceptor');
        }
      };
    }
    
    return () => {
      // Restore original method
      if (originalSendToolResponse) {
        client.sendToolResponse = originalSendToolResponse;
      }
    };
  }, [client, config]);
  
  return { sendMessage };
}