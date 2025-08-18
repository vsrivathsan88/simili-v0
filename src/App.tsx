import { useEffect, useState } from 'react';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useLiveAPIContext } from './contexts/LiveAPIContext';
import { PI_SYSTEM_INSTRUCTION, piToolDeclarations } from './config/piTutor';
import { designSystem } from './config/designSystem';
import { VoiceInput } from './components/VoiceInput';
import UnifiedCanvas from './components/UnifiedCanvas';
import ProblemDisplay from './components/ProblemDisplay';
import TeacherPanel from './components/TeacherPanel';
import VoicePermissionModal from './components/VoicePermissionModal';
import LessonHomepage from './components/LessonHomepage';
import { ToolCallFeedback } from './components/ToolCallFeedback';
import { handleToolCall } from './lib/toolImplementations';
import { useConnectionRetry } from './hooks/useConnectionRetry';
import { useDebounce } from './hooks/useDebounce';
import { sessionRecorder } from './lib/sessionRecorder';
import { Modality } from '@google/genai';
import './App.scss';

// Main Simili App Component
function SimiliApp() {
  const { client, setConfig, setModel, connect, disconnect, connected } = useLiveAPIContext();
  // Remove local isConnected state - use connected from context
  const [canvasImageData, setCanvasImageData] = useState<string>('');
  const debouncedCanvasData = useDebounce(canvasImageData, 2000); // Debounce canvas updates by 2 seconds
  const [problemImage, setProblemImage] = useState<string>('');
  const [showVoicePermission, setShowVoicePermission] = useState(false);
  const [showTeacherPanel, setShowTeacherPanel] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isManualDisconnect, setIsManualDisconnect] = useState(false);

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
      console.log('Connected to Gemini Live');
      // Start session recording
      sessionRecorder.startSession('pizza-fractions-1');
    };

    const handleClose = (event: any) => {
      // Connection state handled by context
      console.log('Disconnected from Gemini Live', event);
      console.log('Close event details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      
      // If it wasn't a manual disconnect, try to reconnect
      if (!isManualDisconnect && selectedLesson) {
        console.log('Unexpected disconnect detected, attempting to reconnect...');
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
  }, [client]);

  const { connectWithRetry, reset } = useConnectionRetry(
    connect,
    3, // max retries
    2000 // initial delay
  );

  const handleConnect = async () => {
    setShowVoicePermission(true);
  };

  const handleVoiceAllow = async () => {
    setShowVoicePermission(false);
    try {
      console.log('Attempting to connect to Gemini Live...');
      await connectWithRetry();
      console.log('Connection initiated - session will remain active until you click End Session');
    } catch (error) {
      alert('Failed to connect after multiple attempts. Please check your API key and internet connection.');
      console.error('Connection error:', error);
    }
  };

  const handleVoiceDeny = () => {
    setShowVoicePermission(false);
  };

  const handleDisconnect = () => {
    console.log('Manual disconnect requested');
    setIsManualDisconnect(true); // Prevent auto-reconnection
    reset(); // Reset retry logic
    const session = sessionRecorder.endSession();
    if (session) {
      console.log('Session saved:', session);
      console.log(`Total reasoning steps: ${session.reasoningSteps.length}`);
      console.log(`Total misconceptions: ${session.misconceptions.length}`);
    }
    disconnect();
    setSelectedLesson(null); // Return to lesson selection
  };

  const handleCanvasChange = (imageData: string) => {
    console.log('Canvas change detected, image data length:', imageData.length);
    setCanvasImageData(imageData);
  };

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
  }, [debouncedCanvasData, problemImage, connected, client]);

  const handleProblemImageUpload = (imageData: string) => {
    setProblemImage(imageData);
    if (canvasImageData && connected && client) {
      sendToVisionAPI(imageData, canvasImageData);
    }
  };

  const sendToVisionAPI = (problemImg: string, canvasImg: string) => {
    if (!client || !connected) {
      console.log('Vision API: Client not ready or not connected');
      return;
    }
    
    try {
      // Convert data URLs to base64
      const problemBase64 = problemImg.split(',')[1];
      const canvasBase64 = canvasImg.split(',')[1];
      
      if (!problemBase64 || !canvasBase64) {
        console.log('Vision API: Invalid image data');
        return;
      }
      
      console.log('Vision API: Sending problem and canvas images to Pi...');
      
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
      
      // Also send a brief context message to help Pi understand
      setTimeout(() => {
        if (client && connected) {
          client.send({
            text: "I just sent you two images: first is the math problem, second is what I've drawn on my canvas. Can you see my work?"
          });
        }
      }, 200);
      
    } catch (error) {
      console.error('Error sending images to vision API:', error);
    }
  };

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLesson(lessonId);
    setIsManualDisconnect(false); // Reset manual disconnect flag
    // Auto-start connection for any lesson
    handleConnect();
  };

  const handleManualSendToPi = () => {
    if (canvasImageData && problemImage) {
      console.log('Manual send to Pi requested');
      sendToVisionAPI(problemImage, canvasImageData);
    } else {
      console.log('Manual send failed - missing canvas or problem image');
    }
  };

  return (
    <div className="simili-app" style={{ backgroundColor: designSystem.colors.paper }}>
      {connected && <ToolCallFeedback />}
      <header className="simili-header">
        <h1 className="simili-title">📚 Math with Pi</h1>
      </header>

      <main className="simili-main">
        {!selectedLesson ? (
          <LessonHomepage onLessonSelect={handleLessonSelect} />
        ) : (
          <div className="simili-workspace">
            <div className="workspace-simple">
              {/* Problem Image - Fixed 30% width */}
              <div className="problem-section">
                <ProblemDisplay 
                  onImageUpload={handleProblemImageUpload}
                  lessonId={selectedLesson || undefined}
                />
                <div className="voice-status">
                  <VoiceInput />
                  {connected ? (
                    <span className="listening-indicator">🎤 Pi is listening</span>
                  ) : (
                    <span className="connecting-indicator">🔄 Connecting to Pi...</span>
                  )}
                </div>
              </div>

              {/* Student Canvas - Takes remaining space */}
              <div className="canvas-section">
                <UnifiedCanvas 
                  onCanvasChange={handleCanvasChange}
                  problemImage={problemImage}
                  onSendToPi={handleManualSendToPi}
                />
              </div>
            </div>

            {/* Floating end button with confirmation */}
            <button 
              className="end-session-btn" 
              onClick={() => {
                if (window.confirm('End your math session with Pi? 🤖\n\nYour progress will be saved!')) {
                  handleDisconnect();
                }
              }}
              title="End Session"
            >
              {connected ? '🛑' : '✖️'}
            </button>

            {/* Teacher panel */}
            <TeacherPanel 
              isOpen={showTeacherPanel}
              onToggle={() => setShowTeacherPanel(!showTeacherPanel)}
            />
          </div>
        )}
      </main>

      <VoicePermissionModal
        isOpen={showVoicePermission}
        onAllow={handleVoiceAllow}
        onDeny={handleVoiceDeny}
      />
    </div>
  );
}

// App wrapper with LiveAPI provider
function App() {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return (
      <div className="simili-error">
        <h1>Configuration Error</h1>
        <p>Please add your Gemini API key to the .env file:</p>
        <code>REACT_APP_GEMINI_API_KEY=your_api_key_here</code>
      </div>
    );
  }

  return (
    <LiveAPIProvider options={{ apiKey }}>
      <SimiliApp />
    </LiveAPIProvider>
  );
}

export default App;