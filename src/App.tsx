import { useEffect, useState, useCallback } from 'react';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useLiveAPIContext } from './contexts/LiveAPIContext';
import { PI_SYSTEM_INSTRUCTION, piToolDeclarations } from './config/piTutor';
import { VoiceInput } from './components/VoiceInput';
import UnifiedCanvas from './components/UnifiedCanvas';
import ProblemDisplay from './components/ProblemDisplay';
import TeacherPanel from './components/TeacherPanel';
import VoicePermissionModal from './components/VoicePermissionModal';
import LessonHomepage from './components/LessonHomepage';
import LessonTransition from './components/LessonTransition';
import LessonEntryPopup from './components/LessonEntryPopup';
import { ToolCallFeedback } from './components/ToolCallFeedback';
import { handleToolCall } from './lib/toolImplementations';
import { useConnectionRetry } from './hooks/useConnectionRetry';
import { useDebounce } from './hooks/useDebounce';
import { sessionRecorder } from './lib/sessionRecorder';
import { Modality } from '@google/genai';
import './App.scss';

// Main Simili App Component
function SimiliApp() {
  // 1. STATE HOOKS
  const { client, setConfig, setModel, connect, disconnect, connected } = useLiveAPIContext();
  const [canvasImageData, setCanvasImageData] = useState<string>('');
  const debouncedCanvasData = useDebounce(canvasImageData, 2000);
  const [problemImage, setProblemImage] = useState<string>('');
  const [showVoicePermission, setShowVoicePermission] = useState(false);
  const [showTeacherPanel, setShowTeacherPanel] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isManualDisconnect, setIsManualDisconnect] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionLesson, setTransitionLesson] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'text'>('pencil');
  const [currentColor, setCurrentColor] = useState('#2D3748');
  const [showLessonEntry, setShowLessonEntry] = useState(false);

  // 2. CUSTOM HOOKS
  const { connectWithRetry, reset } = useConnectionRetry(
    connect,
    3, // max retries
    2000 // initial delay
  );

  // 3. MEMOIZED CALLBACKS
  const handleCanvasChange = useCallback((imageData: string) => {
    setCanvasImageData(imageData);
  }, []);

  const sendToVisionAPI = useCallback((problemImg: string, canvasImg: string) => {
    if (!client || !connected) {
      console.log('Vision API: Client not ready or not connected');
      return;
    }
    
    try {
      // Convert data URLs to base64
      const problemBase64 = problemImg.split(',')[1];
      const canvasBase64 = canvasImg.split(',')[1];
      
      if (!problemBase64 || !canvasBase64) {
        console.log('Vision API: Invalid image data', {
          hasProblemData: !!problemBase64,
          hasCanvasData: !!canvasBase64,
          problemImgStart: problemImg?.substring(0, 50),
          canvasImgStart: canvasImg?.substring(0, 50)
        });
        return;
      }
      
      console.log('Vision API: Sending problem and canvas images to Pi...');
      console.log('Problem image size:', problemBase64.length, 'bytes');
      console.log('Canvas image size:', canvasBase64.length, 'bytes');
      console.log('Problem image type:', problemImg.split(',')[0]);
      console.log('Canvas image type:', canvasImg.split(',')[0]);
      
      // Send both images with clear labels in one call
      client.sendRealtimeInput([
        {
          mimeType: 'image/jpeg',
          data: problemBase64
        },
        {
          mimeType: 'image/jpeg', 
          data: canvasBase64
        }
      ]);
      
      console.log('Vision API: Successfully sent both images to Pi');
      
      // Also send a clear context message to help Pi understand
      setTimeout(() => {
        if (client && connected) {
          client.send({
            text: "Hi Pi! I just sent you two images: (1) The math problem I'm working on, and (2) My current work on the canvas. Please look at both images and help guide me through this problem. Can you see what I've drawn so far?"
          });
        }
      }, 200);
      
    } catch (error) {
      console.error('Error sending images to vision API:', error);
    }
  }, [client, connected]);

  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  const handleVoiceAllow = useCallback(async () => {
    setShowVoicePermission(false);
    try {
      console.log('Attempting to connect to Gemini Live...');
      await connectWithRetry();
      console.log('Connection initiated - session will remain active until you click End Session');
    } catch (error) {
      alert('Failed to connect after multiple attempts. Please check your API key and internet connection.');
      console.error('Connection error:', error);
    }
  }, [connectWithRetry]);

  const handleVoiceDeny = useCallback(() => {
    setShowVoicePermission(false);
  }, []);

  const handleDisconnect = useCallback(async () => {
    console.log('Manual disconnect requested');
    setIsManualDisconnect(true); // Prevent auto-reconnection
    reset(); // Reset retry logic
    const session = sessionRecorder.endSession();
    if (session) {
      console.log('Session saved:', session);
      console.log(`Total reasoning steps: ${session.reasoningSteps.length}`);
      console.log(`Total misconceptions: ${session.misconceptions.length}`);
    }
    
    // Disconnect and wait a moment for cleanup
    disconnect();
    console.log('Disconnecting... waiting for cleanup');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSelectedLesson(null); // Return to lesson selection
    console.log('Returned to lesson selection');
  }, [reset, disconnect]);

  const handleProblemImageUpload = useCallback((imageData: string) => {
    setProblemImage(imageData);
    if (canvasImageData && connected && client) {
      sendToVisionAPI(imageData, canvasImageData);
    }
  }, [canvasImageData, connected, client, sendToVisionAPI]);

  const handleLessonSelect = useCallback((lessonId: string) => {
    console.log('Lesson selected:', lessonId);
    const lessons = [
      { id: 'intro-fractions', title: 'Parts & Wholes' },
      { id: 'equivalent-fractions', title: 'Same Amount, Different Ways' },
      { id: 'comparing-fractions', title: 'Bigger or Smaller?' },
      { id: 'fractions-number-line', title: 'Finding Your Spot' },
      { id: 'unit-fractions', title: 'Special One-Pieces' },
      { id: 'fraction-word-problems', title: 'Real-Life Stories' }
    ];
    
    const lesson = lessons.find(l => l.id === lessonId);
    console.log('Found lesson:', lesson);
    setTransitionLesson(lesson?.title || 'Math Adventures');
    setShowTransition(true);
    setIsManualDisconnect(false);
    console.log('Starting transition for:', lesson?.title);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    console.log('Transition completed, showing lesson entry popup...');
    setShowTransition(false);
    // Find the lesson ID from the title to set selected lesson properly
    const lessons = [
      { id: 'intro-fractions', title: 'Parts & Wholes' },
      { id: 'equivalent-fractions', title: 'Same Amount, Different Ways' },
      { id: 'comparing-fractions', title: 'Bigger or Smaller?' },
      { id: 'fractions-number-line', title: 'Finding Your Spot' },
      { id: 'unit-fractions', title: 'Special One-Pieces' },
      { id: 'fraction-word-problems', title: 'Real-Life Stories' }
    ];
    const lesson = lessons.find(l => l.title === transitionLesson);
    setSelectedLesson(lesson?.id || 'intro-fractions');
    // Show lesson entry popup instead of auto-connecting
    setShowLessonEntry(true);
  }, [transitionLesson]);

  const handleManualSendToPi = useCallback(() => {
    if (canvasImageData && problemImage) {
      console.log('Manual send to Pi requested');
      sendToVisionAPI(problemImage, canvasImageData);
    } else {
      console.log('Manual send failed - missing canvas or problem image');
    }
  }, [canvasImageData, problemImage, sendToVisionAPI]);

  const handleToolChange = useCallback((tool: 'pencil' | 'eraser' | 'text') => {
    setCurrentTool(tool);
  }, []);

  const handleClear = useCallback(() => {
    // This will be handled by the UnifiedCanvas component
    console.log('Clear requested');
  }, []);

  const handleLessonEntryStart = useCallback(async () => {
    console.log('Starting lesson from entry popup...');
    console.log('API Key exists:', !!process.env.REACT_APP_GEMINI_API_KEY);
    console.log('Client exists:', !!client);
    console.log('Connected state:', connected);
    setShowLessonEntry(false);
    
    // Check mic permission and connect
    const hasPermission = await checkMicrophonePermission();
    if (hasPermission) {
      // Permission already granted, connect directly
      try {
        console.log('Permission already granted, attempting connection...');
        
        // Add a small delay to ensure any previous connection is fully closed
        await new Promise(resolve => setTimeout(resolve, 500));
        await connectWithRetry();
        console.log('Connection initiated - session will remain active until you click End Session');
      } catch (error) {
        console.error('Connection failed:', error);
        if ((error as Error).message?.includes('CLOSING') || (error as Error).message?.includes('CLOSED')) {
          console.log('WebSocket was closing, retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            await connectWithRetry();
            console.log('Retry connection successful');
          } catch (retryError) {
            alert('Failed to connect after multiple attempts. Please check your API key and internet connection.');
            console.error('Retry connection error:', retryError);
          }
        } else {
          alert('Failed to connect. Please check your API key and internet connection.');
        }
      }
    } else {
      // Need to request permission
      console.log('Permission not granted, showing permission modal...');
      setShowVoicePermission(true);
    }
  }, [client, connected, checkMicrophonePermission, connectWithRetry]);

  // 4. EFFECT HOOKS
  useEffect(() => {
    // Configure Pi tutor with Gemini Live model
    setModel("gemini-2.0-flash-live-001");
    setConfig({
      systemInstruction: {
        parts: [{ text: PI_SYSTEM_INSTRUCTION }]
      },
      tools: [{ functionDeclarations: piToolDeclarations }],
      responseModalities: [Modality.AUDIO]
    });
  }, [setConfig, setModel]);

  useEffect(() => {
    if (!client) return;

    // Set up event listeners
    const handleOpen = () => {
      // Start session recording
      sessionRecorder.startSession('pizza-fractions-1');
    };

    const handleClose = (event: any) => {
      // Connection state handled by context
      
      // If it wasn't a manual disconnect, try to reconnect
      if (!isManualDisconnect && selectedLesson) {
        setTimeout(() => {
          if (!connected && !isManualDisconnect) {
            console.log('Attempting automatic reconnection...');
            connectWithRetry().catch(error => {
              console.error('Auto-reconnection failed:', error);
            });
          }
        }, 2000); // Wait 2 seconds before reconnecting
      }
    };
    
    const handleError = (error: any) => {
      console.error('Gemini Live error:', error);
    };
    
    const handleSetupComplete = () => {
      console.log('Gemini Live setup complete');
    };

    const handleToolCallEvent = async (toolCall: any) => {
      console.log('Tool call received:', toolCall);
      
      // Handle multiple function calls
      if (toolCall.functionCalls && toolCall.functionCalls.length > 0) {
        const responses = [];
        
        for (const functionCall of toolCall.functionCalls) {
          const result = await handleToolCall(functionCall);
          
          if (result.response) {
            responses.push({
              id: functionCall.id,
              name: functionCall.name,
              response: result.response
            });
          }
        }
        
        // Send all responses back to Gemini
        if (responses.length > 0) {
          client.sendToolResponse({
            functionResponses: responses
          });
        }
      }
    };

    client.on('open', handleOpen);
    client.on('close', handleClose);
    client.on('error', handleError);
    client.on('setupcomplete', handleSetupComplete);
    client.on('toolcall', handleToolCallEvent);

    return () => {
      client.off('open', handleOpen);
      client.off('close', handleClose);
      client.off('error', handleError);
      client.off('setupcomplete', handleSetupComplete);
      client.off('toolcall', handleToolCallEvent);
    };
  }, [client, isManualDisconnect, selectedLesson, connected, connectWithRetry]);

  // Use effect to sync debounced canvas data
  useEffect(() => {
    console.log('Vision sync check:', {
      hasCanvasData: !!debouncedCanvasData,
      hasProblemImage: !!problemImage,
      isConnected: connected,
      hasClient: !!client
    });
    
    if (debouncedCanvasData && problemImage && connected && client) {
      console.log('All conditions met - sending to vision API');
      sendToVisionAPI(problemImage, debouncedCanvasData);
    } else {
      console.log('Vision sync skipped - missing requirements');
    }
  }, [debouncedCanvasData, problemImage, connected, client, sendToVisionAPI]);

  // 5. RETURN STATEMENT
  // Return early states first
  if (showTransition) {
    return (
      <div className="simili-app">
        <LessonTransition 
          isActive={true}
          lessonTitle={transitionLesson}
          onComplete={handleTransitionComplete}
        />
      </div>
    );
  }

  if (showLessonEntry && selectedLesson) {
    return (
      <div className="simili-app">
        <LessonEntryPopup
          isOpen={true}
          lessonTitle={transitionLesson}
          onStart={handleLessonEntryStart}
          onCancel={() => {
            setShowLessonEntry(false);
            setSelectedLesson(null);
          }}
        />
      </div>
    );
  }

  if (!selectedLesson) {
    return (
      <div className="simili-app">
        <LessonHomepage onLessonSelect={handleLessonSelect} />
      </div>
    );
  }

  // Main lesson interface
  return (
    <div className="simili-app">
      <div className="lesson-interface">
        {/* Left Sidebar - Problem Display */}
        <div className="lesson-sidebar">
          <div className="problem-card">
            <ProblemDisplay 
              onImageUpload={handleProblemImageUpload}
              lessonId={selectedLesson}
            />
          </div>

          {/* Connection Status */}
          <div className="connection-status">
            {connected ? (
              <div className="status-connected">
                <span className="status-dot"></span>
                <span>Pi is listening...</span>
              </div>
            ) : (
              <div className="status-disconnected">
                <span>Not connected</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="lesson-controls">
            <button
              className="teacher-toggle-btn"
              onClick={() => setShowTeacherPanel(!showTeacherPanel)}
            >
              📊 Teacher View
            </button>

            {connected && (
              <button
                className="disconnect-btn"
                onClick={handleDisconnect}
              >
                End Session
              </button>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="canvas-area">
          <UnifiedCanvas 
            onCanvasChange={handleCanvasChange}
            problemImage={problemImage}
            onSendToPi={handleManualSendToPi}
            currentTool={currentTool}
            currentColor={currentColor}
            onToolChange={handleToolChange}
            onColorChange={(color) => setCurrentColor(color)}
            onClear={handleClear}
          />
          
          {/* Voice Input Component */}
          <VoiceInput />
          
          {/* Tool Call Feedback */}
          <ToolCallFeedback />
        </div>
      </div>

      {/* Teacher Panel (overlay when open) */}
      <TeacherPanel 
        isOpen={showTeacherPanel}
        onToggle={() => setShowTeacherPanel(!showTeacherPanel)}
      />

      {/* Modal Components */}
      <VoicePermissionModal
        isOpen={showVoicePermission}
        onAllow={handleVoiceAllow}
        onDeny={handleVoiceDeny}
      />
    </div>
  );
}

// Main App with Provider
function App() {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  
  return (
    <LiveAPIProvider options={{ apiKey }}>
      <SimiliApp />
    </LiveAPIProvider>
  );
}

export default App;