import { useEffect, useRef } from 'react';
import { systemMonitor } from '../lib/monitoring/systemMonitor';
import { sessionRecorder } from '../lib/sessionRecorder';
import { contextCards, ContextCardSystem } from '../lib/contextCards';
import { lessons, getProblem } from '../config/lessonStructure';
import { piOrchestrator } from '../lib/piOrchestrator';
import { reliabilityLayer } from '../lib/reliability/reliabilityLayer';
import { handleToolCall } from '../lib/toolImplementations';
import { useConnectionStore } from '../stores/connectionStore';

export interface SessionState {
  hasIntroduced: boolean;
  firstImagesShared: boolean;
  lastVisionSync: number;
}

export interface UseGeminiClientEventsArgs {
  client: any;
  connected: boolean;
  selectedLesson: string | null;
  currentProblemIndex: number;
  isManualDisconnect: boolean;
  connectWithRetry: () => Promise<void>;
  sendToVisionAPI: (problemImg: string, canvasImg: string) => Promise<void>;
  problemImage: string;
  sessionState: SessionState;
  setSessionState: React.Dispatch<React.SetStateAction<SessionState>>;
}

export function useGeminiClientEvents({
  client,
  connected,
  selectedLesson,
  currentProblemIndex,
  isManualDisconnect,
  connectWithRetry,
  sendToVisionAPI,
  problemImage,
  sessionState,
  setSessionState,
}: UseGeminiClientEventsArgs) {
  const connectedRef = useRef<boolean>(connected);
  const selectedLessonRef = useRef<string | null>(selectedLesson);
  const currentProblemIndexRef = useRef<number>(currentProblemIndex);
  const isManualDisconnectRef = useRef<boolean>(isManualDisconnect);
  const connectWithRetryRef = useRef(connectWithRetry);
  const sendToVisionAPIRef = useRef(sendToVisionAPI);
  const problemImageRef = useRef<string>(problemImage);
  const sessionStateRef = useRef<SessionState>(sessionState);

  useEffect(() => { connectedRef.current = connected; }, [connected]);
  useEffect(() => { selectedLessonRef.current = selectedLesson; }, [selectedLesson]);
  useEffect(() => { currentProblemIndexRef.current = currentProblemIndex; }, [currentProblemIndex]);
  useEffect(() => { isManualDisconnectRef.current = isManualDisconnect; }, [isManualDisconnect]);
  useEffect(() => { connectWithRetryRef.current = connectWithRetry; }, [connectWithRetry]);
  useEffect(() => { sendToVisionAPIRef.current = sendToVisionAPI; }, [sendToVisionAPI]);
  useEffect(() => { problemImageRef.current = problemImage; }, [problemImage]);
  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);

  useEffect(() => {
    if (!client) return;

    const handleOpen = () => {
      console.log('Connected to Gemini Live');
      (window as any).geminiConnected = true;
      // Update connection store
      try { useConnectionStore.getState().setConnected(); } catch {}

      systemMonitor.log({
        type: 'info',
        level: 'info',
        message: 'Connected to Gemini Live',
        data: { sessionId: 'pizza-fractions-1' },
      });

      sessionRecorder.startSession('pizza-fractions-1');

      setTimeout(() => {
        if (client && connectedRef.current && !sessionStateRef.current.hasIntroduced) {
          const lessonId = selectedLessonRef.current;
          if (lessonId) {
            const currentProblem = getProblem(lessonId, currentProblemIndexRef.current);
            if (currentProblem) {
              contextCards.addCard(ContextCardSystem.getNarrativeCard(currentProblem.narrativeKey));
              contextCards.addCard(ContextCardSystem.getActCard('act1'));
              contextCards.addCard({
                id: 'problem-info',
                type: 'problem_facts',
                content: `Current Problem: "${currentProblem.title}" (${currentProblemIndexRef.current + 1} of ${lessons[lessonId].problems.length})`,
                priority: 'medium',
              });
            }
          }

          const initialContext = contextCards.buildContextMessage(true);
          client.send({
            text: `${initialContext}

[SESSION START]
The student just connected. Share your STORY about the LEGO blocks (provided above) in an excited, friendly way!
Then ask the follow-up question. Remember: You're not a teacher, you're a curious friend with a puzzle!`,
          });

          setSessionState(prev => ({ ...prev, hasIntroduced: true }));

          if (problemImageRef.current) {
            console.log('Sending initial problem image to Pi');
            const blankCanvas = document.createElement('canvas');
            const ctx = blankCanvas.getContext('2d');
            if (ctx) {
              blankCanvas.width = window.innerWidth;
              blankCanvas.height = window.innerHeight;
              ctx.fillStyle = '#FFFEF7';
              ctx.fillRect(0, 0, blankCanvas.width, blankCanvas.height);
              const blankCanvasData = blankCanvas.toDataURL('image/jpeg', 0.8);
              setTimeout(() => {
                sendToVisionAPIRef.current(problemImageRef.current, blankCanvasData);
              }, 500);
            }
          }
        }
      }, 1500);
    };

    const handleClose = (event: any) => {
      console.log('Disconnected from Gemini Live', event);
      console.log('Close event details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      (window as any).geminiConnected = false;
      // Mark reconnecting immediately
      try { useConnectionStore.getState().setReconnecting(); } catch {}

      systemMonitor.log({
        type: 'warning',
        level: 'warning',
        message: 'Disconnected from Gemini Live',
        data: {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          isManualDisconnect: isManualDisconnectRef.current,
        },
      });

      if (!isManualDisconnectRef.current && selectedLessonRef.current) {
        console.log('Unexpected disconnect detected, attempting to reconnect...');
        setTimeout(() => {
          if (!connectedRef.current && !isManualDisconnectRef.current) {
            console.log('Attempting automatic reconnection...');
            connectWithRetryRef.current().catch(error => {
              console.error('Auto-reconnection failed:', error);
              try { useConnectionStore.getState().setError(error?.message); } catch {}
            });
          }
        }, 2000);
      }
    };

    const handleError = (error: any) => {
      console.error('Gemini Live error:', error);
      try { useConnectionStore.getState().setError(error?.message); } catch {}
    };

    const handleSetupComplete = () => {
      console.log('Gemini Live setup complete');
    };

    const handleToolCallEvent = async (toolCall: any) => {
      console.log('Tool call received:', toolCall);

      systemMonitor.log({
        type: 'tool_call',
        level: 'info',
        message: `Tool calls received: ${toolCall.functionCalls?.length || 0}`,
        data: toolCall,
      });

      if (toolCall.functionCalls && toolCall.functionCalls.length > 0) {
        const responses: Array<{ id: string; name: string; response: any }> = [];
        for (const functionCall of toolCall.functionCalls) {
          const error = piOrchestrator.checkForCommonErrors(functionCall);
          if (error) {
            console.warn('Pi error detected:', error);
            contextCards.addCard(ContextCardSystem.getCorrectionCard(error));
          }

          if (
            functionCall.name === 'mark_reasoning_step' &&
            functionCall.args?.classification === 'correct' &&
            (functionCall.args?.transcript?.includes('2/4') ||
              functionCall.args?.transcript?.includes('out of 4'))
          ) {
            contextCards.addCard(
              ContextCardSystem.getCorrectionCard(
                'Student said 2/4 but there are 6 blocks total. The correct answer is 2/6 or 1/3.'
              )
            );
          }

          const result = await handleToolCall(functionCall);
          window.dispatchEvent(
            new CustomEvent('toolcall', {
              detail: {
                name: functionCall.name,
                args: functionCall.args,
                result: result.response,
              },
            })
          );

          if (result.response) {
            responses.push({
              id: functionCall.id,
              name: functionCall.name,
              response: result.response,
            });
          }
        }

        if (responses.length > 0) {
          client.sendToolResponse({ functionResponses: responses });
        }
      }
    };

    const handleContentData = (content: any) => {
      if (content.modelTurn?.parts) {
        const parts = content.modelTurn.parts;
        const transcript = parts.find((p: any) => p.text)?.text || '';
        if (transcript) {
          reliabilityLayer.validateResponse(transcript, []);
          systemMonitor.log({
            type: 'info',
            level: 'debug',
            message: 'Pi response received',
            data: {
              transcript: transcript.substring(0, 100) + '...',
              length: transcript.length,
            },
          });
        }
      }
    };

    client.on('open', handleOpen);
    client.on('close', handleClose);
    client.on('error', handleError);
    client.on('setupcomplete', handleSetupComplete);
    client.on('toolcall', handleToolCallEvent);
    client.on('content', handleContentData);

    return () => {
      client.off('open', handleOpen);
      client.off('close', handleClose);
      client.off('error', handleError);
      client.off('setupcomplete', handleSetupComplete);
      client.off('toolcall', handleToolCallEvent);
      client.off('content', handleContentData);
    };
  }, [client, setSessionState]);
}
